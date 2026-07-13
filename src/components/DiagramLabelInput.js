import { useRef, useState } from 'react';

/**
 * DiagramLabelInput — complete-the-diagram answer widget (pipeline D5).
 *
 * The question's diagram is the background; the student clicks a spot and
 * types a label. The answer is DATA (fractional coordinates + text), marked
 * deterministically against the teacher's zones — no AI call:
 *
 *   { _type: 'diagram_labels', labels: [{x: 0.42, y: 0.31, text: 'nucleus'}] }
 *
 * Also used by the teacher zone editor in QuestionEditor (editMode) where each
 * placed point represents a marking zone instead of a student label.
 *
 * Props:
 *   image    — data URI of the diagram (question stimulusBlock content)
 *   value    — previously saved answer object (or null)
 *   onChange — called with the answer object on every edit
 *   editMode — teacher zone-editing variant (green pins, "zone" wording)
 */
const DiagramLabelInput = ({ image, value, onChange, editMode = false }) => {
  const containerRef = useRef(null);
  const [labels, setLabels] = useState(() => value?.labels || []);
  const [pending, setPending] = useState(null); // {x, y} awaiting text input
  const [draft, setDraft] = useState('');

  const emit = (next) => {
    setLabels(next);
    onChange({ _type: 'diagram_labels', labels: next });
  };

  const handleImageClick = (e) => {
    if (pending) return; // finish the current label first
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    setPending({ x, y });
    setDraft('');
  };

  const commitPending = () => {
    if (pending && draft.trim()) {
      emit([...labels, { x: pending.x, y: pending.y, text: draft.trim() }]);
    }
    setPending(null);
    setDraft('');
  };

  const removeLabel = (idx) => emit(labels.filter((_, i) => i !== idx));

  const pinColor = editMode ? 'bg-emerald-600' : 'bg-blue-600';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${editMode ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-100 text-emerald-800'}`}>
          {editMode ? 'Marking zones' : 'Auto-marked labelling'}
        </span>
        <span className="text-gray-500">
          {editMode
            ? 'Click the diagram where a label belongs, then type the accepted answer(s)'
            : 'Click the diagram, then type your label · click a label to remove it'}
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative inline-block max-w-full border-2 border-gray-300 rounded-lg overflow-hidden cursor-crosshair"
        onClick={handleImageClick}
      >
        <img src={image} alt="Diagram to label" className="max-w-full block select-none" draggable={false} />

        {labels.map((l, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => { e.stopPropagation(); removeLabel(i); }}
            title="Click to remove"
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${pinColor} text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow hover:bg-red-600`}
            style={{ left: `${l.x * 100}%`, top: `${l.y * 100}%` }}
          >
            {l.text}
          </button>
        ))}

        {pending && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: `${pending.x * 100}%`, top: `${pending.y * 100}%` }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitPending();
                if (e.key === 'Escape') { setPending(null); setDraft(''); }
              }}
              onBlur={commitPending}
              placeholder={editMode ? 'accepted answer(s), comma-separated' : 'type label…'}
              className="px-2 py-1 text-xs border-2 border-blue-500 rounded shadow-lg w-44 focus:outline-none"
            />
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        {labels.length} label{labels.length !== 1 ? 's' : ''} placed
      </p>
    </div>
  );
};

export default DiagramLabelInput;
