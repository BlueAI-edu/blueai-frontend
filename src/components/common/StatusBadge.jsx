const ATTEMPT_STATUS = {
  marked:               { label: 'Marked',           cls: 'bg-green-100 text-green-700' },
  submitted:            { label: 'Submitted',         cls: 'bg-blue-100 text-blue-700' },
  pending_manual_marking:{ label: 'Needs Review',     cls: 'bg-amber-100 text-amber-700' },
  ocr_in_review:        { label: 'OCR in Review',     cls: 'bg-blue-100 text-blue-700' },
  auto_marked:          { label: 'Auto Marked',       cls: 'bg-indigo-100 text-indigo-700' },
  drawing_review:       { label: 'Drawing Review',    cls: 'bg-purple-100 text-purple-700' },
  in_progress:          { label: 'In Progress',       cls: 'bg-yellow-100 text-yellow-700' },
  abandoned:            { label: 'Abandoned',         cls: 'bg-gray-100 text-gray-500' },
};

const ASSESSMENT_STATUS = {
  draft:     { label: 'Draft',     cls: 'bg-gray-100 text-gray-600' },
  published: { label: 'Published', cls: 'bg-blue-100 text-blue-700' },
  started:   { label: 'Live',      cls: 'bg-green-100 text-green-700' },
  closed:    { label: 'Closed',    cls: 'bg-red-100 text-red-700' },
};

function Badge({ label, cls, size = 'sm' }) {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${padding} ${cls}`}>
      {label}
    </span>
  );
}

export function AttemptStatusBadge({ status, size }) {
  const config = ATTEMPT_STATUS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return <Badge {...config} size={size} />;
}

export function AssessmentStatusBadge({ status, size }) {
  const config = ASSESSMENT_STATUS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return <Badge {...config} size={size} />;
}

export default Badge;
