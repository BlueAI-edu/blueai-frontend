export function getPageConfidence(page) {
  return page?.vision_confidence || page?.confidence || 0;
}

export function getMinConfidence(page) {
  return page?.min_confidence || page?.vision_confidence || page?.confidence || 0;
}

export function getConfidenceLevel(confidence) {
  if (confidence >= 0.95) return "high";
  if (confidence >= 0.80) return "medium";
  return "low";
}

export function getConfidenceColor(confidence) {
  const level = getConfidenceLevel(confidence);
  const colors = {
    high: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-300"
    },
    medium: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-300"
    },
    low: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-300"
    }
  };
  return colors[level];
}

export function validateCleanupRules(cleanupData) {
  const violations = [];
  
  if (cleanupData.rules_applied) {
    cleanupData.rules_applied.forEach(rule => {
      if (rule.status === "failed") {
        violations.push({
          rule: rule.rule,
          reason: rule.reason
        });
      }
    });
  }
  
  return {
    isValid: violations.length === 0,
    violations
  };
}

export function formatBlockType(blockType) {
  const labels = {
    heading: "Question/Title",
    answer: "Answer",
    working: "Working/Steps",
    diagram: "Diagram/Graph",
    diagram_label: "Diagram Label",
    table: "Table",
    text: "Text"
  };
  return labels[blockType] || "Text";
}

// ==================== Page Classification Helpers ====================

export function getPageTypeLabel(pageType) {
  if (!pageType) return null;
  const labels = {
    cover: "Cover Page",
    instruction: "Instructions",
    question: "Question Page",
    continuation: "Continuation",
    blank: "Blank Page",
    error: "Error",
    unknown: "Unknown",
  };
  return labels[pageType] || pageType;
}

export function isPageSkipped(pageType) {
  return pageType === "cover" || pageType === "instruction" || pageType === "blank" || pageType === "error";
}

export function getPageTypeColor(pageType) {
  if (!pageType) return null;
  const colors = {
    cover: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300" },
    instruction: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300" },
    question: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    continuation: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    blank: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200" },
    error: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
    unknown: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
  };
  return colors[pageType] || colors.unknown;
}

// ==================== Response Block Helpers ====================

export function getReviewRequiredCount(responseBlocks) {
  if (!responseBlocks) return 0;
  return responseBlocks.filter(rb => rb.review_required).length;
}
