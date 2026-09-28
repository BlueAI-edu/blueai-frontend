import LaTeXRenderer from './LaTeXRenderer';
import GraphPlotInput from './GraphPlotInput';
import DiagramLabelInput from './DiagramLabelInput';

/**
 * StudentAnswerDisplay — renders a saved student answer for teacher review.
 *
 * Plain text/LaTeX/numeric answers are stored as-is and render through
 * LaTeXRenderer as before. Structured answer types (drawing / graph_plot /
 * diagram_labels — see GraphPlotInput.js, DiagramLabelInput.js) are stored as
 * a JSON string; without this dispatcher those show up to the teacher as a
 * raw JSON/base64 text dump instead of the actual sketch/graph/diagram,
 * which defeats the point of the manual diagram/graph review gate (see
 * "AI Marking Flow" in CLAUDE.md) — the teacher can't review what they can't see.
 *
 * For hybrid answers (graph_plot with text field), both the graph and text
 * explanation are rendered side-by-side so teachers have full context.
 *
 * Props:
 *   answer   — the raw answer value from attempt.answers (string or falsy)
 *   stimulus — the question/part's stimulusBlock (needed to render
 *              diagram_labels answers, which don't embed the image)
 */
const StudentAnswerDisplay = ({ answer, stimulus }) => {
  if (!answer) {
    return <p className="text-gray-500 italic text-sm">No answer provided</p>;
  }

  let parsed = null;
  if (typeof answer === 'string') {
    try {
      parsed = JSON.parse(answer);
    } catch {
      parsed = null;
    }
  } else if (typeof answer === 'object') {
    parsed = answer;
  }

  if (parsed?._type === 'drawing' && parsed.imageData) {
    return (
      <img
        src={parsed.imageData}
        alt="Student's sketch"
        className="max-w-full max-h-96 rounded border border-gray-300 bg-white"
      />
    );
  }

  // FIX: Handle hybrid graph_plot answers with text explanation
  if (parsed?._type === 'graph_plot' && parsed.axes) {
    const hasText = parsed.text && parsed.text.trim();
    
    if (hasText) {
      // Render graph and text side-by-side for hybrid answers
      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Plotted Graph:</p>
            <GraphPlotInput
              spec={{ axes: parsed.axes }}
              value={parsed}
              onChange={() => {}}
              readOnly
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Explanation:</p>
            <div className="p-3 bg-gray-50 rounded border border-gray-200 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{parsed.text}</p>
            </div>
          </div>
        </div>
      );
    } else {
      // Graph-only answer (no explanation)
      return (
        <GraphPlotInput
          spec={{ axes: parsed.axes }}
          value={parsed}
          onChange={() => {}}
          readOnly
        />
      );
    }
  }

  if (parsed?._type === 'diagram_labels' && stimulus?.type === 'image') {
    return (
      <DiagramLabelInput
        image={stimulus.content}
        value={parsed}
        onChange={() => {}}
        readOnly
      />
    );
  }

  return <LaTeXRenderer text={String(answer)} />;
};

export default StudentAnswerDisplay;