import LaTeXRenderer from './LaTeXRenderer';

/**
 * Method marks, level descriptors and examiner notes captured from an extracted
 * mark scheme, for the teacher's submission review. These arrive as objects
 * ({level, marks_range, descriptor} / {mark_type, description}); they used to be
 * printed with String(), which showed "[object Object]".
 */

export const hasMarkSchemeExtras = (item) =>
  Boolean(item?.methodMarks?.length || item?.levelDescriptors?.length || item?.examinerNotes);

export const formatLevel = (d) => {
  if (!d || typeof d !== 'object') return String(d ?? '');
  const range = d.marks_range ? ` (${String(d.marks_range).replace('-', '–')} marks)` : '';
  const head = d.level !== undefined && d.level !== null ? `Level ${d.level}${range}` : range.trim();
  return [head, d.descriptor].filter(Boolean).join(': ');
};

export const formatMethodMark = (m) => {
  if (!m || typeof m !== 'object') return String(m ?? '');
  return [m.mark_type, m.description].filter(Boolean).join(': ');
};

const MarkSchemeExtras = ({ item }) => {
  if (!hasMarkSchemeExtras(item)) return null;
  return (
    <>
      {item.methodMarks?.length > 0 && (
        <div>
          <p className="text-xs text-gray-600 mb-1 font-medium">Method Marks:</p>
          <ul className="list-disc pl-4 text-sm space-y-0.5">
            {item.methodMarks.map((m, i) => (
              <li key={i}><LaTeXRenderer text={formatMethodMark(m)} inline /></li>
            ))}
          </ul>
        </div>
      )}
      {item.levelDescriptors?.length > 0 && (
        <div>
          <p className="text-xs text-gray-600 mb-1 font-medium">Level Descriptors:</p>
          <ul className="list-disc pl-4 text-sm space-y-0.5">
            {item.levelDescriptors.map((d, i) => (
              <li key={i}><LaTeXRenderer text={formatLevel(d)} inline /></li>
            ))}
          </ul>
        </div>
      )}
      {item.examinerNotes && (
        <div>
          <p className="text-xs text-gray-600 mb-1 font-medium">Examiner Notes:</p>
          <p className="text-sm text-gray-700 italic">{item.examinerNotes}</p>
        </div>
      )}
    </>
  );
};

export default MarkSchemeExtras;
