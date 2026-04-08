export function hasBlockData(page) {
  return page && page.blocks && Array.isArray(page.blocks) && page.blocks.length > 0;
}

export function getPageConfidence(page) {
  if (hasBlockData(page)) {
    return page.average_confidence || calculateAverageConfidence(page.blocks);
  }
  return page.confidence || 0;
}

export function calculateAverageConfidence(blocks) {
  if (!blocks || blocks.length === 0) return 0;
  return blocks.reduce((sum, block) => sum + (block.confidence || 0), 0) / blocks.length;
}

export function getMinConfidence(page) {
  if (hasBlockData(page)) {
    return page.min_confidence || calculateMinConfidence(page.blocks);
  }
  return page.confidence || 0;
}

export function calculateMinConfidence(blocks) {
  if (!blocks || blocks.length === 0) return 0;
  return Math.min(...blocks.map(b => b.confidence || 0));
}

export function getLowConfidenceBlocks(page, threshold = 0.80) {
  if (!hasBlockData(page)) return [];
  return page.blocks.filter(block => (block.confidence || 0) < threshold);
}

export function needsAttention(page, threshold = 0.80) {
  if (hasBlockData(page)) {
    return getLowConfidenceBlocks(page, threshold).length > 0;
  }
  return (page.confidence || 0) < threshold;
}

export function transformLegacyPage(page) {
  const approvedText = page.approved_ocr_text ?? page.raw_ocr_text ?? page.ocr_text ?? "";

  if (hasBlockData(page)) {
    return {
      ...page,
      page_id: page.page_id || `page-${page.page_number}`,
      approved_ocr_text: approvedText,
      raw_ocr_text: page.raw_ocr_text ?? approvedText,
      average_confidence: page.average_confidence || calculateAverageConfidence(page.blocks),
      min_confidence: page.min_confidence || calculateMinConfidence(page.blocks)
    };
  }
  
  if (approvedText) {
    const blockId = `p${page.page_number}b1`;
    return {
      ...page,
      page_id: page.page_id || `page-${page.page_number}`,
      blocks: [
        {
          block_id: blockId,
          text: approvedText,
          confidence: page.confidence || 0.5,
          block_type: "text",
          original_text: approvedText,
          cleaned_text: null,
          is_cleaned: false
        }
      ],
      approved_ocr_text: approvedText,
      raw_ocr_text: page.raw_ocr_text ?? approvedText,
      average_confidence: page.confidence || 0.5,
      min_confidence: page.confidence || 0.5
    };
  }
  
  return {
    ...page,
    page_id: page.page_id || `page-${page.page_number}`
  };
}

export function combineBlocksText(blocks) {
  if (!blocks || blocks.length === 0) return "";
  return blocks.map(b => b.text || "").join("\n\n");
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
    diagram_label: "Diagram Label",
    text: "Text"
  };
  return labels[blockType] || "Text";
}
