import { useMemo } from "react";

// ─── Severity config ──────────────────────────────────────────────────────────

const SEV = {
  high:   { label: "High",   bg: "bg-red-100",   text: "text-red-700",   border: "border-red-200",   bar: "bg-red-500"   },
  medium: { label: "Medium", bg: "bg-amber-100",  text: "text-amber-700", border: "border-amber-200", bar: "bg-amber-400" },
  low:    { label: "Low",    bg: "bg-sky-100",    text: "text-sky-700",   border: "border-sky-200",   bar: "bg-sky-400"   },
};

const SEV_ORDER = { high: 0, medium: 1, low: 2 };

// ─── Queue item derivation ────────────────────────────────────────────────────

function severityFromCount(count, highThreshold = 5, medThreshold = 2) {
  if (count >= highThreshold) return "high";
  if (count >= medThreshold) return "medium";
  return "low";
}

function oldestTs(items, field = "created_at") {
  const ts = items.map((a) => new Date(a[field] || a.created_at || 0).getTime());
  return Math.min(...ts);
}

export function deriveQueueItems(assessments) {
  const items = [];

  // — Review Needed ——————————————————————————————————————————
  const reviewNeeded = assessments.filter((a) => a.status === "review_needed");
  if (reviewNeeded.length > 0) {
    items.push({
      id: "review_needed",
      icon: "flag",
      title: "Assessments Need Review",
      detail: `${reviewNeeded.length} assessment${reviewNeeded.length !== 1 ? "s" : ""} queued`,
      severity: severityFromCount(reviewNeeded.length, 4, 2),
      count: reviewNeeded.length,
      age: oldestTs(reviewNeeded, "closed_at"),
      routeFilter: "review_needed",
    });
  }

  // — Low Confidence Extractions ————————————————————————————
  const lowConf = assessments.filter((a) => a.status === "low_confidence");
  if (lowConf.length > 0) {
    items.push({
      id: "low_confidence",
      icon: "warning",
      title: "Low Confidence Extractions",
      detail: `${lowConf.length} assessment${lowConf.length !== 1 ? "s" : ""} affected`,
      severity: severityFromCount(lowConf.length, 3, 1),
      count: lowConf.length,
      age: oldestTs(lowConf),
      routeFilter: "low_confidence",
    });
  }

  // — OCR in Review —————————————————————————————————————————
  const ocrReview = assessments.filter((a) => a.status === "ocr_in_review");
  if (ocrReview.length > 0) {
    items.push({
      id: "ocr_in_review",
      icon: "scan",
      title: "Graph / Diagram Review",
      detail: `${ocrReview.length} extraction${ocrReview.length !== 1 ? "s" : ""} pending`,
      severity: severityFromCount(ocrReview.length, 5, 2),
      count: ocrReview.length,
      age: oldestTs(ocrReview),
      routeFilter: "ocr_in_review",
    });
  }

  // — Awaiting Upload ————————————————————————————————————————
  const awaitUpload = assessments.filter((a) => a.status === "awaiting_upload");
  if (awaitUpload.length > 0) {
    items.push({
      id: "awaiting_upload",
      icon: "upload",
      title: "Awaiting Upload",
      detail: `${awaitUpload.length} assessment${awaitUpload.length !== 1 ? "s" : ""} waiting`,
      severity: severityFromCount(awaitUpload.length, 4, 2),
      count: awaitUpload.length,
      age: oldestTs(awaitUpload),
      routeFilter: "awaiting_upload",
    });
  }

  // — Awaiting Marking Approval ——————————————————————————————
  const readyRelease = assessments.filter((a) => a.status === "ready_to_release");
  if (readyRelease.length > 0) {
    items.push({
      id: "ready_to_release",
      icon: "checkmark",
      title: "Awaiting Marking Approval",
      detail: `${readyRelease.length} assessment${readyRelease.length !== 1 ? "s" : ""} ready`,
      severity: severityFromCount(readyRelease.length, 5, 2),
      count: readyRelease.length,
      age: oldestTs(readyRelease),
      routeFilter: "ready_to_release",
    });
  }

  // — High Flagged Response Count ————————————————————————————
  const highFlagged = assessments.filter((a) => (a.flagged_count || 0) >= 3);
  if (highFlagged.length > 0) {
    items.push({
      id: "flagged_responses",
      icon: "flag",
      title: "High Flagged Response Count",
      detail: `${highFlagged.length} assessment${highFlagged.length !== 1 ? "s" : ""} flagged`,
      severity: severityFromCount(highFlagged.length, 5, 2),
      count: highFlagged.length,
      age: oldestTs(highFlagged, "started_at"),
      routeFilter: null,
      assessmentId: highFlagged.length === 1 ? highFlagged[0].id : null,
    });
  }

  // Sort: severity → age (oldest first) → count desc
  return items.sort((a, b) => {
    const sevDiff = SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
    if (sevDiff !== 0) return sevDiff;
    const ageDiff = a.age - b.age;
    if (ageDiff !== 0) return ageDiff;
    return b.count - a.count;
  });
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const QueueIcon = ({ type }) => {
  const cls = "w-4 h-4 flex-shrink-0";
  if (type === "flag") return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  );
  if (type === "warning") return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
  if (type === "scan") return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
  if (type === "upload") return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
    </svg>
  );
  // checkmark / default
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const QueueSkeleton = () => (
  <div className="space-y-2">
    {[80, 65, 90].map((w, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
        <div className="w-1 h-10 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className={`h-3.5 bg-gray-200 rounded`} style={{ width: `${w}%` }} />
          <div className="h-3 bg-gray-100 rounded w-2/5" />
        </div>
        <div className="h-5 w-14 bg-gray-200 rounded-full flex-shrink-0" />
      </div>
    ))}
  </div>
);

// ─── Single queue item row ────────────────────────────────────────────────────

const QueueItem = ({ item, onClick }) => {
  const sev = SEV[item.severity] ?? SEV.low;
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      data-testid={`queue-item-${item.id}`}
    >
      {/* Severity bar */}
      <div className={`w-1 h-10 rounded-full flex-shrink-0 ${sev.bar}`} aria-hidden="true" />

      {/* Text block */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`flex-shrink-0 ${sev.text}`}>
            <QueueIcon type={item.icon} />
          </span>
          <span className="text-sm font-semibold text-gray-800 truncate leading-snug">
            {item.title}
          </span>
        </div>
        <span className="text-xs text-gray-400 leading-none">{item.detail}</span>
      </div>

      {/* Severity chip */}
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border flex-shrink-0 ${sev.bg} ${sev.text} ${sev.border}`}
        data-testid={`queue-severity-${item.id}`}
      >
        {sev.label}
      </span>

      {/* Chevron */}
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const QueueEmpty = ({ onCreateEnhanced }) => (
  <div className="flex flex-col items-center text-center py-8 px-4" data-testid="queue-empty">
    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    </div>
    <p className="text-sm font-semibold text-gray-700 mb-1">All clear</p>
    <p className="text-xs text-gray-400 leading-relaxed max-w-[180px]">
      No items need your attention right now. Great work!
    </p>
    {onCreateEnhanced && (
      <button
        onClick={onCreateEnhanced}
        className="mt-4 text-xs font-medium text-indigo-600 hover:underline underline-offset-2"
      >
        Create a new assessment →
      </button>
    )}
  </div>
);

// ─── Panel ────────────────────────────────────────────────────────────────────

export const AssessmentQueuePanel = ({
  assessments = [],
  loading = false,
  onNavigate,
  onFilterReview,
  onCreateEnhanced,
}) => {
  const items = useMemo(() => deriveQueueItems(assessments), [assessments]);

  const handleItemClick = (item) => {
    if (!onNavigate) return;
    if (item.routeFilter === "review_needed" || item.routeFilter === "low_confidence" ||
        item.routeFilter === "ocr_in_review" || item.routeFilter === "awaiting_upload" ||
        item.routeFilter === "ready_to_release") {
      // Scroll + filter via parent callback, or navigate to OCR page
      if (item.routeFilter === "ocr_in_review") {
        onNavigate("/teacher/ocr-review");
      } else if (onFilterReview && item.routeFilter) {
        onFilterReview(item.routeFilter);
      }
    } else if (item.assessmentId) {
      onNavigate(`/teacher/assessments/${item.assessmentId}`);
    }
  };

  const handleViewAll = () => {
    if (onFilterReview) {
      onFilterReview("review_needed");
    } else if (onNavigate) {
      onNavigate("/teacher/assessments");
    }
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
      data-testid="assessment-queue-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900 leading-none">Assessment Queue</h2>
          {!loading && items.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
              {items.length}
            </span>
          )}
        </div>
        <button
          onClick={handleViewAll}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline underline-offset-2 transition-colors"
          data-testid="queue-view-all"
        >
          View all
        </button>
      </div>

      {/* Body */}
      <div className="p-2">
        {loading ? (
          <QueueSkeleton />
        ) : items.length === 0 ? (
          <QueueEmpty onCreateEnhanced={onCreateEnhanced} />
        ) : (
          <ul className="space-y-0.5" data-testid="queue-item-list">
            {items.map((item) => (
              <li key={item.id}>
                <QueueItem item={item} onClick={() => handleItemClick(item)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer — only when items exist */}
      {!loading && items.length > 0 && (
        <div className="px-4 pb-3.5 pt-1 border-t border-gray-100">
          <button
            onClick={handleViewAll}
            className="w-full text-center text-xs font-medium text-indigo-600 hover:text-indigo-800 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
            data-testid="queue-view-all-footer"
          >
            View all {items.length} queue items →
          </button>
        </div>
      )}
    </div>
  );
};
