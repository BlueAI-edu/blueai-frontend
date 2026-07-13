import { useMemo, useState } from 'react';

/**
 * GraphPlotInput — structured graph answer widget (diagram pipeline D4).
 *
 * Students click on a coordinate grid to place points (snap-to-grid); in line
 * mode a straight line is drawn through the placed points. The submitted
 * answer is DATA, not pixels:
 *
 *   { _type: 'graph_plot', axes, points: [{x,y}...],
 *     elements: [{kind:'line', through:[[x,y],[x,y]]}] }
 *
 * which the backend grades deterministically against the question's
 * expectedGraph spec (services/graph_answer_grader.py) — no AI involved.
 *
 * Props:
 *   spec     — { axes: { x: [min, max, step], y: [min, max, step] } }
 *   value    — previously saved answer object (or null)
 *   onChange — called with the answer object on every edit
 */

const SVG_SIZE = 420;
const MARGIN = 34;

const GraphPlotInput = ({ spec, value, onChange }) => {
  const axes = spec?.axes || { x: [-10, 10, 1], y: [-10, 10, 1] };
  const [xMin, xMax, xStep = 1] = axes.x;
  const [yMin, yMax, yStep = 1] = axes.y;

  const [points, setPoints] = useState(() => value?.points || []);
  const [lineMode, setLineMode] = useState(
    () => (value?.elements || []).some((el) => el.kind === 'line')
  );

  const plot = SVG_SIZE - 2 * MARGIN;
  const toPx = useMemo(() => ({
    x: (gx) => MARGIN + ((gx - xMin) / (xMax - xMin)) * plot,
    y: (gy) => SVG_SIZE - MARGIN - ((gy - yMin) / (yMax - yMin)) * plot,
  }), [xMin, xMax, yMin, yMax, plot]);

  const emit = (nextPoints, nextLineMode) => {
    const answer = {
      _type: 'graph_plot',
      axes,
      points: nextPoints,
      elements:
        nextLineMode && nextPoints.length >= 2
          ? [{ kind: 'line', through: nextPoints.map((p) => [p.x, p.y]) }]
          : [],
    };
    onChange(answer);
  };

  const update = (nextPoints, nextLineMode = lineMode) => {
    setPoints(nextPoints);
    emit(nextPoints, nextLineMode);
  };

  const handleClick = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    // Account for responsive scaling of the SVG viewBox
    const px = ((e.clientX - rect.left) / rect.width) * SVG_SIZE;
    const py = ((e.clientY - rect.top) / rect.height) * SVG_SIZE;
    let gx = xMin + ((px - MARGIN) / plot) * (xMax - xMin);
    let gy = yMin + ((SVG_SIZE - MARGIN - py) / plot) * (yMax - yMin);
    if (gx < xMin || gx > xMax || gy < yMin || gy > yMax) return;

    // Snap to half the axis step — fine enough for GCSE plotting accuracy
    const snap = (v, step) => Math.round(v / (step / 2)) * (step / 2);
    gx = snap(gx, xStep);
    gy = snap(gy, yStep);

    // Clicking an existing point removes it
    const existing = points.findIndex(
      (p) => Math.abs(p.x - gx) < xStep / 4 && Math.abs(p.y - gy) < yStep / 4
    );
    if (existing >= 0) {
      update(points.filter((_, i) => i !== existing));
    } else {
      update([...points, { x: gx, y: gy }]);
    }
  };

  const gridLines = [];
  for (let gx = Math.ceil(xMin / xStep) * xStep; gx <= xMax; gx += xStep) {
    gridLines.push(
      <line key={`vx${gx}`} x1={toPx.x(gx)} y1={toPx.y(yMin)} x2={toPx.x(gx)} y2={toPx.y(yMax)}
        stroke={gx === 0 ? '#94a3b8' : '#e2e8f0'} strokeWidth={gx === 0 ? 1.5 : 1} />
    );
  }
  for (let gy = Math.ceil(yMin / yStep) * yStep; gy <= yMax; gy += yStep) {
    gridLines.push(
      <line key={`hy${gy}`} x1={toPx.x(xMin)} y1={toPx.y(gy)} x2={toPx.x(xMax)} y2={toPx.y(gy)}
        stroke={gy === 0 ? '#94a3b8' : '#e2e8f0'} strokeWidth={gy === 0 ? 1.5 : 1} />
    );
  }

  // Line of best fit through the points (simple least squares, mirrors the grader)
  let linePath = null;
  if (lineMode && points.length >= 2) {
    const n = points.length;
    const mx = points.reduce((s, p) => s + p.x, 0) / n;
    const my = points.reduce((s, p) => s + p.y, 0) / n;
    const sxx = points.reduce((s, p) => s + (p.x - mx) ** 2, 0);
    if (sxx > 1e-9) {
      const slope = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / sxx;
      const c = my - slope * mx;
      linePath = { x1: xMin, y1: slope * xMin + c, x2: xMax, y2: slope * xMax + c };
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">
          Auto-marked graph
        </span>
        <span className="text-gray-500">Click to place a point · click a point to remove it</span>
      </div>

      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full max-w-md border-2 border-gray-300 rounded-lg bg-white cursor-crosshair touch-none"
        onClick={handleClick}
        role="img"
        aria-label="Coordinate grid for plotting your answer"
      >
        {gridLines}
        {/* Axis labels at extremes and zero */}
        {[xMin, 0, xMax].filter((v, i, a) => a.indexOf(v) === i && v >= xMin && v <= xMax).map((gx) => (
          <text key={`lx${gx}`} x={toPx.x(gx)} y={toPx.y(yMin) + 16} fontSize="11" fill="#64748b" textAnchor="middle">{gx}</text>
        ))}
        {[yMin, 0, yMax].filter((v, i, a) => a.indexOf(v) === i && v >= yMin && v <= yMax).map((gy) => (
          <text key={`ly${gy}`} x={toPx.x(xMin) - 8} y={toPx.y(gy) + 4} fontSize="11" fill="#64748b" textAnchor="end">{gy}</text>
        ))}

        {linePath && (
          <line
            x1={toPx.x(linePath.x1)} y1={toPx.y(Math.max(yMin, Math.min(yMax, linePath.y1)))}
            x2={toPx.x(linePath.x2)} y2={toPx.y(Math.max(yMin, Math.min(yMax, linePath.y2)))}
            stroke="#2563eb" strokeWidth="2"
          />
        )}

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={toPx.x(p.x)} cy={toPx.y(p.y)} r="6" fill="#2563eb" fillOpacity="0.15" />
            <circle cx={toPx.x(p.x)} cy={toPx.y(p.y)} r="3.5" fill="#2563eb" />
          </g>
        ))}
      </svg>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={lineMode}
            onChange={(e) => { setLineMode(e.target.checked); emit(points, e.target.checked); }}
            className="rounded"
          />
          Draw a straight line through my points
        </label>
        <button
          type="button"
          onClick={() => update(points.slice(0, -1))}
          disabled={points.length === 0}
          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          Undo point
        </button>
        <button
          type="button"
          onClick={() => update([])}
          disabled={points.length === 0}
          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          Clear
        </button>
        <span className="text-xs text-gray-400 ml-auto">
          {points.length} point{points.length !== 1 ? 's' : ''} placed
        </span>
      </div>
    </div>
  );
};

export default GraphPlotInput;
