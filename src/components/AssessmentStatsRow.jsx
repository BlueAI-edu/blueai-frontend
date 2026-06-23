// ─── Icons ────────────────────────────────────────────────────────────────────

const IconClipboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="2"/>
    <line x1="9" y1="12" x2="15" y2="12"/>
    <line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
);

const IconPlay = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const IconInbox = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
  </svg>
);

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

// ─── Skeleton card ────────────────────────────────────────────────────────────

const StatCardSkeleton = () => (
  <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl p-4 sm:p-5 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-lg bg-gray-100" />
      <div className="w-5 h-5 rounded bg-gray-100" />
    </div>
    <div className="h-8 w-14 bg-gray-200 rounded mb-2" />
    <div className="h-3.5 w-28 bg-gray-100 rounded mb-1" />
    <div className="h-3 w-20 bg-gray-100 rounded" />
  </div>
);

// ─── Single stat card ─────────────────────────────────────────────────────────

const StatCard = ({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  supportingText,
  trend,
  active,
  onClick,
  testId,
}) => (
  <button
    onClick={onClick}
    className={`
      flex-1 min-w-0 text-left rounded-xl border p-4 sm:p-5
      transition-all duration-150 cursor-pointer group
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
      ${active
        ? "bg-indigo-50 border-indigo-300 shadow-sm ring-1 ring-indigo-200"
        : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }
    `}
    data-testid={testId}
    aria-pressed={active}
  >
    {/* Icon + chevron row */}
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      {/* Chevron — shows on hover to signal it's clickable */}
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        className={`mt-0.5 transition-opacity duration-150 ${active ? "opacity-60 text-indigo-500" : "opacity-0 group-hover:opacity-40 text-gray-400"}`}
      >
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>

    {/* Value */}
    <div className={`text-2xl sm:text-3xl font-extrabold leading-none mb-1.5 ${active ? "text-indigo-700" : "text-gray-900"}`}>
      {value}
    </div>

    {/* Label */}
    <div className={`text-sm font-semibold leading-snug mb-0.5 ${active ? "text-indigo-700" : "text-gray-700"}`}>
      {label}
    </div>

    {/* Supporting text */}
    <div className="text-xs text-gray-400 leading-snug">
      {supportingText}
    </div>
  </button>
);

// ─── Stats row ────────────────────────────────────────────────────────────────

export const AssessmentStatsRow = ({
  loading,
  totalAssessments,
  liveAssessments,
  totalSubmissions,
  reviewNeeded,
  activeFilter,
  onFilterAll,
  onFilterLive,
  onFilterSubmissions,
  onFilterReview,
}) => {
  if (loading) {
    return (
      <div className="flex gap-3 sm:gap-4 mb-6" data-testid="stats-row-skeleton">
        {[1, 2, 3, 4].map((n) => <StatCardSkeleton key={n} />)}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6"
      data-testid="assessment-stats-row"
    >
      <StatCard
        icon={<IconClipboard />}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
        label="Total Assessments"
        value={totalAssessments}
        supportingText="Across all classes"
        active={activeFilter === "all"}
        onClick={onFilterAll}
        testId="stat-total-assessments"
      />

      <StatCard
        icon={<IconPlay />}
        iconBg="bg-green-50"
        iconColor="text-green-600"
        label="Live Assessments"
        value={liveAssessments}
        supportingText="Currently active"
        active={activeFilter === "started"}
        onClick={onFilterLive}
        testId="stat-live-assessments"
      />

      <StatCard
        icon={<IconInbox />}
        iconBg="bg-sky-50"
        iconColor="text-sky-600"
        label="Total Submissions"
        value={totalSubmissions ?? 0}
        supportingText="This term"
        active={activeFilter === "submissions"}
        onClick={onFilterSubmissions}
        testId="stat-total-submissions"
      />

      <StatCard
        icon={<IconAlert />}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        label="Review Needed"
        value={reviewNeeded}
        supportingText="Requires attention"
        active={activeFilter === "review_needed"}
        onClick={onFilterReview}
        testId="stat-review-needed"
      />
    </div>
  );
};
