import { useState, useEffect, useRef } from "react";

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft:            { label: "Draft",            dot: "bg-gray-400",   text: "text-gray-700",  bg: "bg-gray-100",   border: "border-gray-200" },
  published:        { label: "Published",        dot: "bg-blue-500",   text: "text-blue-700",  bg: "bg-blue-50",    border: "border-blue-200" },
  started:          { label: "Live",             dot: "bg-green-500",  text: "text-green-700", bg: "bg-green-50",   border: "border-green-200", pulse: true },
  closed:           { label: "Closed",           dot: "bg-red-400",    text: "text-red-700",   bg: "bg-red-50",     border: "border-red-200" },
  archived:         { label: "Archived",         dot: "bg-gray-300",   text: "text-gray-500",  bg: "bg-gray-50",    border: "border-gray-200" },
  review_needed:    { label: "Review Needed",    dot: "bg-orange-500", text: "text-orange-700",bg: "bg-orange-50",  border: "border-orange-200" },
  awaiting_upload:  { label: "Awaiting Upload",  dot: "bg-yellow-500", text: "text-yellow-700",bg: "bg-yellow-50",  border: "border-yellow-200" },
  ocr_in_review:    { label: "OCR in Review",    dot: "bg-violet-500", text: "text-violet-700",bg: "bg-violet-50",  border: "border-violet-200" },
  ready_to_release: { label: "Ready to Release", dot: "bg-teal-500",   text: "text-teal-700",  bg: "bg-teal-50",    border: "border-teal-200" },
  low_confidence:   { label: "Low Confidence",   dot: "bg-amber-500",  text: "text-amber-700", bg: "bg-amber-50",   border: "border-amber-200" },
};

export const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
      data-testid={`status-badge-${status}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
};

// ─── Type badge ───────────────────────────────────────────────────────────────

const MODE_TO_TYPE = {
  CLASSIC:                           { label: "Classic",          bg: "bg-slate-100",   text: "text-slate-600"  },
  FORMATIVE_SINGLE_LONG_RESPONSE:    { label: "Formative",        bg: "bg-sky-100",     text: "text-sky-700"    },
  SUMMATIVE_MULTI_QUESTION:          { label: "Summative",        bg: "bg-indigo-100",  text: "text-indigo-700" },
  EXAM_STRUCTURED_GCSE_STYLE:        { label: "GCSE Style",       bg: "bg-purple-100",  text: "text-purple-700" },
  OCR_GENERATED_GCSE_PAST_PAPER:     { label: "GCSE Past Paper",  bg: "bg-amber-100",   text: "text-amber-700"  },
  OCR_GENERATED:                     { label: "OCR Generated",    bg: "bg-amber-100",   text: "text-amber-700"  },
  AI_GENERATED:                      { label: "AI Generated",     bg: "bg-violet-100",  text: "text-violet-700" },
  MANUAL:                            { label: "Manual",           bg: "bg-gray-100",    text: "text-gray-600"   },
};

export const TypeBadge = ({ mode }) => {
  const key = mode?.toUpperCase?.().replace(/ /g, "_") ?? "CLASSIC";
  const cfg = MODE_TO_TYPE[key] ?? { label: mode || "Classic", bg: "bg-slate-100", text: "text-slate-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

export const AssessmentCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 animate-pulse">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-2.5">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
        </div>
        <div className="h-6 w-2/3 bg-gray-200 rounded-lg" />
        <div className="h-4 w-1/2 bg-gray-100 rounded" />
      </div>
      <div className="h-14 w-28 bg-gray-100 rounded-lg flex-shrink-0" />
    </div>
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
      <div className="h-3 w-full bg-gray-100 rounded-full" />
      <div className="flex gap-2 mt-3">
        <div className="h-8 w-28 bg-gray-200 rounded-lg" />
        <div className="h-8 w-28 bg-gray-100 rounded-lg" />
      </div>
    </div>
  </div>
);

// ─── Overflow (3-dot) menu ────────────────────────────────────────────────────

const OverflowMenu = ({ items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!items?.length) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="More options"
        data-testid="overflow-menu-btn"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 overflow-hidden">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.onClick(); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 hover:bg-gray-50 transition-colors ${item.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"}`}
              data-testid={item.testId}
            >
              {item.icon && <span className="opacity-70">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Countdown display ────────────────────────────────────────────────────────

const TimeDisplay = ({ startedAt }) => {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => {
      const elapsedMs = Date.now() - new Date(startedAt).getTime();
      if (elapsedMs < 0) return;
      const totalSeconds = Math.floor(elapsedMs / 1_000);
      const h = Math.floor(totalSeconds / 3_600);
      const m = Math.floor((totalSeconds % 3_600) / 60);
      const s = totalSeconds % 60;
      setDisplay(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!display) return null;
  return (
    <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
      ⏱ Running {display}
    </span>
  );
};

// ─── Submissions progress ─────────────────────────────────────────────────────

const SubmissionsProgress = ({ submitted, total, flagged }) => {
  const hasData = typeof submitted === "number";
  const pct = hasData && total > 0 ? Math.round((submitted / total) * 100) : 0;
  const barColor = pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : "bg-indigo-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submissions</span>
        <div className="flex items-center gap-2">
          {hasData ? (
            <span className="text-xs font-semibold text-gray-700">
              {submitted}{total ? `/${total}` : ""} submitted
            </span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
          {flagged > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6V3h2v3h14l-3 6 3 6H6v3H4V6zm2 2v8h11.16l-2-4 2-4H6z"/></svg>
              {flagged} flagged
            </span>
          )}
        </div>
      </div>
      {(hasData && total > 0) && (
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

// ─── Join code block ──────────────────────────────────────────────────────────

const CopyButton = ({ text, size = 13 }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
      title="Copy code"
    >
      {copied ? (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  );
};

// Renders class-specific codes (prominent) + universal code (dimmed).
// Falls back to the original single-code look when no assignments.
const JoinCodeBlock = ({ code, status, assignments = [] }) => {
  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Join Code</span>
        <div className="flex items-center gap-1.5">
          <span
            className="font-mono text-lg font-bold text-indigo-700 tracking-widest leading-none"
            data-testid={`join-code-${code}`}
          >
            {code}
          </span>
          <CopyButton text={code} />
        </div>
        {status === "started" && (
          <span className="text-[10px] text-gray-400">/join</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
      {assignments.map((a) => (
        <div key={a.id} className="flex items-center gap-1">
          <div className="flex flex-col items-end">
            <span
              className="text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-none mb-0.5 max-w-[120px] truncate"
              title={a.class_name}
            >
              {a.class_name}
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`font-mono text-base font-bold tracking-widest leading-none ${
                  a.status === 'open' ? 'text-indigo-700' : 'text-gray-400 line-through'
                }`}
                data-testid={`join-code-${a.join_code}`}
              >
                {a.join_code}
              </span>
              {a.status !== 'open' && (
                <span className="text-[9px] text-gray-400 font-medium uppercase">closed</span>
              )}
            </div>
          </div>
          <CopyButton text={a.join_code} size={11} />
        </div>
      ))}

      <div className="w-full border-t border-gray-100 pt-1">
        <div className="flex items-center gap-1 justify-end">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-medium text-gray-300 uppercase tracking-wider leading-none mb-0.5">
              Universal
            </span>
            <span
              className="font-mono text-sm font-semibold tracking-widest leading-none text-gray-400"
              data-testid={`join-code-${code}`}
            >
              {code}
            </span>
          </div>
          <CopyButton text={code} size={11} />
        </div>
      </div>

      {status === "started" && (
        <span className="text-[10px] text-gray-400">/join</span>
      )}
    </div>
  );
};

// ─── Main card ────────────────────────────────────────────────────────────────

export const AssessmentCard = ({
  assessment: a,
  question,
  classes = [],
  assignments = [],
  onStart,
  onClose,
  onReopen,
  onEdit,
  onViewSubmissions,
  onViewEnhanced,
  onDelete,
}) => {
  const isEnhanced = a.assessmentMode && a.assessmentMode !== "CLASSIC";

  const title = isEnhanced ? (a.title || "Untitled Assessment") : (question?.topic || question?.subject || "Untitled");
  const subject = isEnhanced ? a.subject : question?.subject;
  const stage = isEnhanced ? a.stage : question?.key_stage;
  const qCount = isEnhanced ? (a.questions?.length ?? 0) : 1;
  const totalMarks = isEnhanced ? a.totalMarks : null;
  const duration = isEnhanced ? a.durationMinutes : a.duration_minutes;
  const mode = isEnhanced ? a.assessmentMode : "CLASSIC";

  const cls = classes.find((c) => c.id === a.class_id);
  const clsName = cls?.class_name;

  const submitted = a.submission_count ?? undefined;
  const expectedTotal = cls?.student_count ?? undefined;
  const flagged = a.flagged_count ?? 0;

  const isDraft = a.status === "draft";
  const isPublished = a.status === "published";
  const isStarted = a.status === "started";
  const isClosed = a.status === "closed";
  const isOcrLocked = a.assessmentMode === "OCR_GENERATED_GCSE_PAST_PAPER" && a.ocrConfirmed;
  const canEdit = (isDraft || isPublished) && isEnhanced && !isOcrLocked;
  const canStart = isDraft || isPublished;

  const viewDetailRoute = isEnhanced ? onViewEnhanced : onViewSubmissions;

  const overflowItems = [
    canEdit && {
      label: "Edit Assessment",
      icon: "✏️",
      testId: `edit-${a.id}`,
      onClick: onEdit,
    },
    isClosed && {
      label: "Reopen as Draft",
      icon: "↩️",
      testId: `reopen-${a.id}`,
      onClick: onReopen,
    },
    {
      label: "View Submissions",
      icon: "📋",
      testId: `view-subs-overflow-${a.id}`,
      onClick: viewDetailRoute,
    },
    onDelete && {
      label: "Delete",
      icon: "🗑️",
      danger: true,
      testId: `delete-${a.id}`,
      onClick: onDelete,
    },
  ].filter(Boolean);

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
      data-testid={`assessment-card-${a.id}`}
    >
      {/* Status accent bar */}
      <div
        className={`h-1 w-full rounded-t-xl ${
          isStarted ? "bg-green-400" :
          isPublished ? "bg-blue-400" :
          isClosed ? "bg-gray-300" :
          "bg-gray-200"
        }`}
      />

      <div className="p-5">
        {/* ── Row 1: badges + join code ── */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <StatusBadge status={a.status} />
            <TypeBadge mode={mode} />
            {isStarted && duration && (
              <TimeDisplay startedAt={a.started_at} />
            )}
          </div>
          <JoinCodeBlock code={a.join_code} status={a.status} assignments={assignments} />
        </div>

        {/* ── Row 2: title ── */}
        <h3 className="text-base font-bold text-gray-900 leading-snug mb-1 pr-2">
          {title}
        </h3>

        {/* ── Row 3: metadata ── */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 mb-4">
          {subject && <span className="font-medium text-gray-600">{subject}</span>}
          {subject && (stage || qCount || totalMarks) && <span className="text-gray-300">•</span>}
          {stage && <span>{stage}</span>}
          {stage && (qCount || totalMarks) && <span className="text-gray-300">•</span>}
          {qCount > 0 && <span>{qCount} {qCount === 1 ? "question" : "questions"}</span>}
          {qCount > 0 && totalMarks > 0 && <span className="text-gray-300">•</span>}
          {totalMarks > 0 && <span>{totalMarks} marks</span>}
          {duration && (
            <>
              <span className="text-gray-300">•</span>
              <span>{duration} min</span>
            </>
          )}
          {clsName && (
            <>
              <span className="text-gray-300">•</span>
              <span className="inline-flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
                {clsName}
              </span>
            </>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-gray-100 pt-4 space-y-4">
          {/* Submissions progress */}
          <SubmissionsProgress
            submitted={submitted}
            total={expectedTotal}
            flagged={flagged}
          />

          {/* ── Actions row ── */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary action */}
            {canStart && (
              <button
                onClick={onStart}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 active:scale-95 transition-all"
                data-testid={`start-assessment-${a.id}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Start Assessment
              </button>
            )}

            {isStarted && (
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 active:scale-95 transition-all"
                data-testid={`close-assessment-${a.id}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
                Close Assessment
              </button>
            )}

            {/* View submissions — always present */}
            <button
              onClick={viewDetailRoute}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 active:scale-95 transition-all"
              data-testid={`view-submissions-${a.id}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              View Submissions
            </button>

            {/* Edit — shown inline for draft/published enhanced */}
            {canEdit && (
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 active:scale-95 transition-all"
                data-testid={`edit-assessment-${a.id}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
            )}

            {isClosed && (
              <button
                onClick={onReopen}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 active:scale-95 transition-all"
                data-testid={`reopen-assessment-${a.id}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
                Reopen
              </button>
            )}

            {/* Spacer + overflow */}
            <div className="flex-1" />
            <OverflowMenu items={overflowItems} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────

export const AssessmentEmptyState = ({ onCreateEnhanced }) => (
  <div
    className="flex flex-col items-center justify-center py-16 px-8 bg-white border border-dashed border-gray-200 rounded-xl text-center"
    data-testid="no-assessments"
  >
    <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/>
        <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    </div>
    <h4 className="text-base font-semibold text-gray-800 mb-1">No assessments yet</h4>
    <p className="text-sm text-gray-500 max-w-xs mb-6">
      Set up your first assessment to start collecting and reviewing student work.
    </p>
    <div className="flex gap-3 flex-wrap justify-center">
      <button
        onClick={onCreateEnhanced}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>
        Create Assessment
      </button>
    </div>
  </div>
);
