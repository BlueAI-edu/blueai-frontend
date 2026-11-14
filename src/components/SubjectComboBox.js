import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

/* Accepts SUBJECT_GROUPS as an array of strings, an array of
   { label|name|group|title, subjects|options|items } objects,
   or an object keyed by group name. */
const subjectName = (s) => (typeof s === "string" ? s : s?.label ?? s?.name ?? s?.value ?? "");

const normaliseGroups = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw) && raw.every((g) => typeof g === "string")) {
    return [{ label: "Subjects", subjects: raw }];
  }
  const entries = Array.isArray(raw)
    ? raw
    : Object.entries(raw).map(([label, subjects]) => ({ label, subjects }));
  return entries
    .map((g) => ({
      label: g.label ?? g.name ?? g.group ?? g.title ?? "Subjects",
      subjects: (g.subjects ?? g.options ?? g.items ?? []).map(subjectName).filter(Boolean),
    }))
    .filter((g) => g.subjects.length > 0);
};

/**
 * Search box with grouped subject suggestions.
 *
 * Props
 *  - value / onChange(subject: string)  controlled value ("" = nothing chosen)
 *  - groups        SUBJECT_GROUPS (passed in, so this file never imports a page)
 *  - subjectCounts optional { [subject.toLowerCase()]: { label, count } }.
 *                  Shows a count per subject and adds unknown subjects under "Other".
 *  - placeholder, ariaLabel, testId, className, id, required, disabled, clearable
 *
 * Only a subject picked from the list can become the value; half-typed text
 * reverts on blur, so forms never end up with a free-typed typo.
 * clearable={false}: the value can be replaced but never emptied.
 */
export const SubjectCombobox = ({
  value,
  onChange,
  groups: groupsProp,
  subjectCounts = {},
  placeholder = "Search subject…",
  ariaLabel = "Subject",
  testId,
  className = "w-full",
  id,
  required = false,
  disabled = false,
  clearable = true,
}) => {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const listId = useId();
  const current = value || "";

  // Keep the text in sync when the value is changed or cleared elsewhere.
  useEffect(() => setQuery(current), [current]);

  const groups = useMemo(() => {
    const base = normaliseGroups(groupsProp);
    const known = new Set(base.flatMap((g) => g.subjects.map((s) => s.toLowerCase())));
    // Subjects that exist on assessments but aren't in the shared list.
    const extra = Object.entries(subjectCounts)
      .filter(([key]) => !known.has(key))
      .map(([, v]) => v.label)
      .sort();
    return extra.length ? [...base, { label: "Other", subjects: extra }] : base;
  }, [groupsProp, subjectCounts]);

  const visible = useMemo(() => {
    // With a subject already chosen, show the full list when reopened.
    const q = current && query === current ? "" : query.trim().toLowerCase();
    return groups
      .map((g) => ({ ...g, subjects: g.subjects.filter((s) => !q || s.toLowerCase().includes(q)) }))
      .filter((g) => g.subjects.length > 0);
  }, [groups, query, current]);

  const flat = useMemo(() => visible.flatMap((g) => g.subjects), [visible]);

  useEffect(() => {
    if (open) document.getElementById(`${listId}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, listId]);

  const close = () => {
    setOpen(false);
    setQuery(current);
  };

  const select = (subject) => {
    onChange(subject);
    setQuery(subject);
    setOpen(false);
  };

  const handleInput = (e) => {
    const v = e.target.value;
    setQuery(v);
    setOpen(true);
    setActive(0);
    if (v === "" && current && clearable) onChange("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && flat[active]) {
        e.preventDefault(); // also stops a surrounding form from submitting
        select(flat[active]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        close();
      }
    }
  };

  let optionIndex = -1;

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget)) close();
      }}
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
      <input
        id={id}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && flat.length ? `${listId}-opt-${active}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        disabled={disabled}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-800 placeholder:text-gray-400 hover:border-gray-300 focus:border-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
        data-testid={testId}
      />
      {/* Native required can't see the picked value (only the typed text), so mirror it. */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={current}
          onChange={() => {}}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
      )}
      {clearable && (current || query) && !disabled && (
        <button
          type="button"
          aria-label="Clear subject"
          onClick={() => {
            onChange("");
            setQuery("");
            setOpen(false);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Subjects"
          // Keeps focus in the input while clicking or scrolling the list.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {flat.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-gray-500">No subjects match “{query}”</p>
          ) : (
            visible.map((g) => (
              <div key={g.label} role="group" aria-label={g.label}>
                <p className="sticky top-0 bg-white px-3 pb-1 pt-2 text-xs font-medium text-gray-400">
                  {g.label}
                </p>
                {g.subjects.map((s) => {
                  optionIndex += 1;
                  const i = optionIndex;
                  const count = subjectCounts[s.toLowerCase()]?.count ?? 0;
                  const selected = current.toLowerCase() === s.toLowerCase();
                  return (
                    <div
                      key={`${g.label}-${s}`}
                      id={`${listId}-opt-${i}`}
                      role="option"
                      aria-selected={selected}
                      onClick={() => select(s)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                        i === active ? "bg-indigo-50 text-indigo-900" : "text-gray-700"
                      } ${selected ? "font-semibold" : ""}`}
                    >
                      <span>{s}</span>
                      {count > 0 && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs tabular-nums text-gray-600">
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};