import { ArrowUpDown, Calendar, ChevronDown, Users, X } from "lucide-react";
import { SubjectCombobox } from "@/components/SubjectComboBox";
// Adjust this path to wherever EnhancedAssessmentBuilderPage.js lives.
import { SUBJECT_GROUPS } from "@/pages/EnhancedAssessmentBuilderPage";

export const EMPTY_FILTERS = { subject: "", classId: "", status: "", from: "", to: "" };

const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "subject", label: "Subject (A–Z)" },
  { value: "class", label: "Class (A–Z)" },
  { value: "submissions", label: "Most submissions" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "started", label: "Live" },
  { value: "closed", label: "Closed" },
];

/* ───────── Small building blocks ───────── */
const SelectField = ({ icon: Icon, label, value, onChange, children, className = "", testId }) => (
  <div className={`relative ${className}`}>
    {Icon && (
      <Icon
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
    )}
    <select
      aria-label={label}
      value={value}
      onChange={onChange}
      data-testid={testId}
      className={`h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white pr-9 text-sm text-gray-800 hover:border-gray-300 focus:border-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        Icon ? "pl-9" : "pl-3"
      }`}
    >
      {children}
    </select>
    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      aria-hidden="true"
    />
  </div>
);

const Chip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-indigo-700">
    {label}
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
      className="rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <X className="h-3 w-3" aria-hidden="true" />
    </button>
  </span>
);

const formatDateKey = (key) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/* ───────── Toolbar ───────── */
export const AssessmentsToolbar = ({
  sortBy,
  onSortChange,
  filters,
  onFilterChange, // (key, value) => void; must use a functional state update
  onClear,
  classes,
  subjectCounts, // { [subject.toLowerCase()]: { label, count } }
  resultCount,
  totalCount,
}) => {
  const className = classes.find((c) => c.id === filters.classId)?.class_name;

  const chips = [];
  if (filters.subject) {
    chips.push({ key: "subject", label: filters.subject, remove: () => onFilterChange("subject", "") });
  }
  if (filters.classId) {
    chips.push({ key: "class", label: className || "Class", remove: () => onFilterChange("classId", "") });
  }
  if (filters.status) {
    chips.push({
      key: "status",
      label: STATUS_OPTIONS.find((o) => o.value === filters.status)?.label || filters.status,
      remove: () => onFilterChange("status", ""),
    });
  }
  if (filters.from || filters.to) {
    const label =
      filters.from && filters.to
        ? `${formatDateKey(filters.from)} – ${formatDateKey(filters.to)}`
        : filters.from
        ? `From ${formatDateKey(filters.from)}`
        : `Until ${formatDateKey(filters.to)}`;
    chips.push({
      key: "dates",
      label,
      remove: () => {
        onFilterChange("from", "");
        onFilterChange("to", "");
      },
    });
  }

  return (
    <div className="mb-4 rounded-2xl border border-gray-200 bg-white shadow-sm" data-testid="assessments-toolbar">
      <div className="flex flex-wrap items-center gap-3 p-3">
        <SubjectCombobox
          value={filters.subject}
          onChange={(v) => onFilterChange("subject", v)}
          groups={SUBJECT_GROUPS}
          subjectCounts={subjectCounts}
          ariaLabel="Filter by subject"
          testId="filter-subject"
          className="w-full sm:w-56"
        />

        <SelectField
          icon={Users}
          label="Filter by class"
          value={filters.classId}
          onChange={(e) => onFilterChange("classId", e.target.value)}
          className="w-full sm:w-44"
          testId="filter-class"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.class_name}
            </option>
          ))}
        </SelectField>

        <div
          role="radiogroup"
          aria-label="Filter by status"
          className="inline-flex h-10 items-center rounded-lg bg-gray-100 p-1"
          data-testid="filter-status"
        >
          {STATUS_OPTIONS.map((o) => {
            const selected = filters.status === o.value;
            return (
              <button
                key={o.value || "all"}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onFilterChange("status", o.value)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  selected ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {o.value === "started" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
                )}
                {o.label}
              </button>
            );
          })}
        </div>

        <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500 hover:border-gray-300">
          <Calendar className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
          <input
            type="date"
            aria-label="From date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => onFilterChange("from", e.target.value)}
            className="w-[8.5rem] bg-transparent text-sm text-gray-800 focus:outline-none"
            data-testid="filter-from"
          />
          <span className="text-gray-300" aria-hidden="true">–</span>
          <input
            type="date"
            aria-label="To date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => onFilterChange("to", e.target.value)}
            className="w-[8.5rem] bg-transparent text-sm text-gray-800 focus:outline-none"
            data-testid="filter-to"
          />
        </div>

        <SelectField
          icon={ArrowUpDown}
          label="Sort assessments"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full sm:ml-auto sm:w-44"
          testId="sort-select"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-3 py-2 text-xs text-gray-500">
        <span aria-live="polite">
          Showing <span className="font-semibold text-gray-700">{resultCount}</span> of {totalCount}
        </span>
        {chips.map((c) => (
          <Chip key={c.key} label={c.label} onRemove={c.remove} />
        ))}
        {chips.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="ml-auto rounded font-medium text-indigo-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            data-testid="clear-filters-btn"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};