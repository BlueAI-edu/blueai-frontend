import styles from './skeleton-animation.module.css';

/**
 * SkeletonLoader — Reusable skeleton components with shimmer animation.
 * Each variant approximates the shape and size of real content.
 */

const baseSkeleton = `${styles.skeleton} bg-gray-200 rounded`;

export const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
    <div className={`${baseSkeleton} w-9 h-9`} />
    <div className="flex-1">
      <div className={`${baseSkeleton} h-6 w-12 mb-2`} />
      <div className={`${baseSkeleton} h-3 w-16`} />
    </div>
  </div>
);

export const StatRowSkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[0, 1, 2, 3].map(i => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

export const QueueItemSkeleton = () => (
  <div className="flex items-center gap-3 px-3 py-3 rounded-xl">
    <div className={`${baseSkeleton} w-8 h-8 shrink-0`} />
    <div className="flex-1 min-w-0 space-y-1.5">
      <div className={`${baseSkeleton} h-3.5 w-40`} />
      <div className={`${baseSkeleton} h-3 w-32`} />
    </div>
    <div className={`${baseSkeleton} h-4 w-16 shrink-0`} />
  </div>
);

export const QueueSkeleton = ({ itemCount = 3 }) => (
  <div className="space-y-1">
    {Array.from({ length: itemCount }).map((_, i) => (
      <QueueItemSkeleton key={i} />
    ))}
  </div>
);

export const AssessmentRowSkeleton = () => (
  <div className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
    <div className={`${baseSkeleton} w-7 h-7 shrink-0`} />
    <div className="flex-1 min-w-0 space-y-1.5">
      <div className={`${baseSkeleton} h-3.5 w-48`} />
      <div className={`${baseSkeleton} h-3 w-32`} />
    </div>
    <div className={`${baseSkeleton} h-5 w-20 rounded-full shrink-0`} />
    <div className={`${baseSkeleton} w-4 h-4 shrink-0`} />
  </div>
);

export const AssessmentListSkeleton = ({ rowCount = 5 }) => (
  <div className="divide-y divide-gray-50">
    {Array.from({ length: rowCount }).map((_, i) => (
      <AssessmentRowSkeleton key={i} />
    ))}
  </div>
);

/**
 * Alternate: Compact skeleton for use in cards/panels
 * (e.g., if assessment list is displayed as cards instead of rows)
 */
export const AssessmentCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
    <div className={`${baseSkeleton} h-4 w-3/4`} />
    <div className="space-y-2">
      <div className={`${baseSkeleton} h-3 w-full`} />
      <div className={`${baseSkeleton} h-3 w-5/6`} />
    </div>
    <div className="flex gap-2">
      <div className={`${baseSkeleton} h-5 w-20 rounded-full`} />
      <div className={`${baseSkeleton} h-5 w-16 rounded-full`} />
    </div>
  </div>
);

export const AssessmentCardGridSkeleton = ({ cardCount = 5 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: cardCount }).map((_, i) => (
      <AssessmentCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Health/metrics panel skeleton — for multi-row metric display
 * (e.g., if adding an "Assessment Health" panel later)
 */
export const HealthMetricSkeleton = () => (
  <div className="flex items-center justify-between py-2 px-3 rounded-lg">
    <div className="space-y-1.5 flex-1">
      <div className={`${baseSkeleton} h-3 w-32`} />
      <div className={`${baseSkeleton} h-2.5 w-24`} />
    </div>
    <div className={`${baseSkeleton} h-6 w-12 shrink-0`} />
  </div>
);

export const HealthPanelSkeleton = ({ metricCount = 4 }) => (
  <div className="space-y-1">
    {Array.from({ length: metricCount }).map((_, i) => (
      <HealthMetricSkeleton key={i} />
    ))}
  </div>
);

/**
 * Classes Page skeleton — class card in grid
 * Matches the actual card layout: title, subtitle, 2-column stats grid
 */
export const ClassCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
    {/* Header with title and score badge */}
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <div className={`${baseSkeleton} h-5 w-40 mb-1`} />
        <div className={`${baseSkeleton} h-3 w-24 mb-0.5`} />
        <div className={`${baseSkeleton} h-3 w-20`} />
      </div>
      <div className={`${baseSkeleton} h-6 w-16 rounded-full shrink-0`} />
    </div>

    {/* Stats grid - 2 columns (Students | Assessments) */}
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="bg-gray-50 rounded p-3 text-center space-y-2">
        <div className={`${baseSkeleton} h-7 w-8 mx-auto`} />
        <div className={`${baseSkeleton} h-3 w-16 mx-auto`} />
      </div>
      <div className="bg-gray-50 rounded p-3 text-center space-y-2">
        <div className={`${baseSkeleton} h-7 w-8 mx-auto`} />
        <div className={`${baseSkeleton} h-3 w-20 mx-auto`} />
      </div>
    </div>

    {/* Last assessment date (optional) */}
    <div className={`${baseSkeleton} h-2.5 w-48 mt-4`} />
  </div>
);

export const ClassesGridSkeleton = ({ cardCount = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: cardCount }).map((_, i) => (
      <ClassCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Questions Page skeletons — recent questions, templates, question bank
 */
export const QuestionRowSkeleton = () => (
  <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
    <div className="flex-1 min-w-0 space-y-1.5">
      <div className={`${baseSkeleton} h-4 w-48`} />
      <div className={`${baseSkeleton} h-3 w-40`} />
    </div>
    <div className="flex gap-1 shrink-0">
      <div className={`${baseSkeleton} w-8 h-8 rounded-md`} />
      <div className={`${baseSkeleton} w-8 h-8 rounded-md`} />
      <div className={`${baseSkeleton} w-8 h-8 rounded-md`} />
    </div>
  </div>
);

export const RecentQuestionsSkeleton = ({ rowCount = 4 }) => (
  <div className="space-y-0">
    {Array.from({ length: rowCount }).map((_, i) => (
      <QuestionRowSkeleton key={i} />
    ))}
  </div>
);

/**
 * Template card skeleton
 */
export const TemplateCardSkeleton = () => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
    {/* Header with title and delete button */}
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className={`${baseSkeleton} h-4 w-32`} />
        <div className={`${baseSkeleton} h-3 w-24`} />
      </div>
      <div className={`${baseSkeleton} w-6 h-6 rounded shrink-0`} />
    </div>
    
    {/* Description */}
    <div className="space-y-1.5">
      <div className={`${baseSkeleton} h-3 w-full`} />
      <div className={`${baseSkeleton} h-3 w-3/4`} />
    </div>

    {/* Tags/metadata */}
    <div className="flex gap-2">
      <div className={`${baseSkeleton} h-5 w-16 rounded-full`} />
      <div className={`${baseSkeleton} h-5 w-20 rounded-full`} />
    </div>

    {/* Button */}
    <div className={`${baseSkeleton} h-9 w-full rounded-md`} />
  </div>
);

export const TemplatesGridSkeleton = ({ cardCount = 3 }) => (
  <div className="grid gap-3 md:grid-cols-2">
    {Array.from({ length: cardCount }).map((_, i) => (
      <TemplateCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Question Bank list skeleton (for when viewing all questions in bank tab)
 */
export const QuestionBankSkeleton = ({ rowCount = 8 }) => (
  <div className="space-y-0">
    {Array.from({ length: rowCount }).map((_, i) => (
      <QuestionRowSkeleton key={i} />
    ))}
  </div>
);