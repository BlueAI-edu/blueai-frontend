const HeroIllustration = () => (
  <svg
    viewBox="0 0 280 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
    aria-hidden="true"
  >
    {/* Checklist card */}
    <rect x="8" y="24" width="148" height="160" rx="12" fill="white" fillOpacity="0.12" />
    <rect x="8" y="24" width="148" height="160" rx="12" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />

    {/* Checklist header bar */}
    <rect x="8" y="24" width="148" height="32" rx="12" fill="white" fillOpacity="0.18" />
    <rect x="22" y="36" width="72" height="8" rx="4" fill="white" fillOpacity="0.7" />

    {/* Row 1 — checked */}
    <rect x="22" y="72" width="14" height="14" rx="3" fill="white" fillOpacity="0.9" />
    <polyline points="25,79 28,82 33,76" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="42" y="75" width="82" height="7" rx="3.5" fill="white" fillOpacity="0.45" />

    {/* Row 2 — checked */}
    <rect x="22" y="96" width="14" height="14" rx="3" fill="white" fillOpacity="0.9" />
    <polyline points="25,103 28,106 33,100" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="42" y="99" width="66" height="7" rx="3.5" fill="white" fillOpacity="0.45" />

    {/* Row 3 — unchecked */}
    <rect x="22" y="120" width="14" height="14" rx="3" fill="white" fillOpacity="0.18" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" />
    <rect x="42" y="123" width="74" height="7" rx="3.5" fill="white" fillOpacity="0.3" />

    {/* Row 4 — unchecked */}
    <rect x="22" y="144" width="14" height="14" rx="3" fill="white" fillOpacity="0.18" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" />
    <rect x="42" y="147" width="56" height="7" rx="3.5" fill="white" fillOpacity="0.3" />

    {/* Bar chart card */}
    <rect x="132" y="52" width="136" height="132" rx="12" fill="white" fillOpacity="0.12" />
    <rect x="132" y="52" width="136" height="132" rx="12" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />

    {/* Chart title */}
    <rect x="148" y="66" width="60" height="7" rx="3.5" fill="white" fillOpacity="0.5" />

    {/* Bars */}
    <rect x="152" y="130" width="22" height="38" rx="4" fill="white" fillOpacity="0.3" />
    <rect x="182" y="108" width="22" height="60" rx="4" fill="white" fillOpacity="0.55" />
    <rect x="212" y="90" width="22" height="78" rx="4" fill="white" fillOpacity="0.8" />

    {/* Sparkle / AI star */}
    <g transform="translate(238, 32)">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        fill="white" fillOpacity="0.9" />
    </g>

    {/* Small floating badge */}
    <rect x="104" y="152" width="72" height="28" rx="14" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.35" strokeWidth="1" />
    <rect x="116" y="162" width="48" height="7" rx="3.5" fill="white" fillOpacity="0.6" />
  </svg>
);

export const AssessmentHero = ({
  onCreateEnhanced,
  onClassicMode,
  liveCount = 0,
  onOpenLive,
}) => {
  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-8"
      style={{
        background: "linear-gradient(135deg, #3730a3 0%, #4f46e5 40%, #2563eb 100%)",
      }}
      data-testid="assessment-hero"
    >
      {/* Subtle background rings for depth */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)" }}
      />

      <div className="relative flex flex-col lg:flex-row items-center gap-6 px-6 py-8 sm:px-10 sm:py-10">
        {/* Left: text + CTAs */}
        <div className="flex-1 min-w-0 text-center lg:text-left">
          {/* AI badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-xs font-medium mb-4">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
            AI-Powered Assessment Suite
          </div>

          <h1
            className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-2"
            data-testid="assessments-title"
          >
            Assessments
          </h1>
          <p className="text-indigo-100 text-base sm:text-lg leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
            Create, launch and manage assessments with AI-powered tools.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-5">
            <button
              onClick={onCreateEnhanced}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold text-sm shadow-lg hover:bg-indigo-50 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              data-testid="create-enhanced-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
              Create Enhanced Assessment
            </button>

            <button
              onClick={onClassicMode}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-transparent border border-white/40 text-white font-medium text-sm hover:bg-white/10 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              data-testid="classic-mode-btn"
            >
              + Classic Mode
            </button>
          </div>

          {/* Optional secondary links */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center lg:justify-start">
            {liveCount > 0 && (
              <button
                onClick={onOpenLive}
                className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white underline-offset-2 hover:underline transition-colors"
                data-testid="open-live-btn"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {liveCount} Live {liveCount === 1 ? "Assessment" : "Assessments"}
              </button>
            )}
          </div>
        </div>

        {/* Right: illustration */}
        <div
          className="hidden sm:block flex-shrink-0 w-56 h-40 lg:w-72 lg:h-52 opacity-90"
          aria-hidden="true"
        >
          <HeroIllustration />
        </div>
      </div>
    </div>
  );
};
