import { useEffect, useRef, useState } from 'react';
import JXG from 'jsxgraph';
// jsxgraph's package "exports" field blocks importing distrib/jsxgraph.css
// directly — see src/vendor/jsxgraph.css for why this is vendored locally.
import '../vendor/jsxgraph.css';

/**
 * GraphPlotInput — structured graph answer widget (diagram pipeline D4,
 * extended for #234 with drag support + curve plotting via JSXGraph).
 *
 * Students click on a coordinate grid to place points (snap-to-grid), then
 * can drag any point to reposition it. In line/curve mode, placed points are
 * connected with a live preview. The submitted answer is DATA, not pixels:
 *
 *   { _type: 'graph_plot', axes, points: [{x,y}...],
 *     elements: [{kind:'line'|'curve', through:[[x,y],[x,y],...]}] }
 *
 * which the backend grades deterministically against the question's
 * expectedGraph spec (services/graph_answer_grader.py) — no AI involved.
 *
 * Props:
 *   spec     — { axes: { x: [min, max, step], y: [min, max, step] } }
 *   value    — previously saved answer object (or null), read once at mount
 *   onChange — called with the answer object on every edit
 *   readOnly — display-only mode for teacher review (e.g. EnhancedSubmissionDetailPage):
 *              points are fixed (not draggable), clicking the board does nothing,
 *              and the mode toggle / Undo / Clear controls are hidden.
 */

const round = (v) => Math.round(v * 1000) / 1000;

// Least-squares (slope, intercept) through a set of [x,y] pairs, or null if
// degenerate (fewer than 2 points, or a vertical spread) — mirrors the
// backend's _fit_line in services/graph_answer_grader.py so the on-screen
// preview always matches what will actually be marked.
const fitLine = (points) => {
  if (points.length < 2) return null;
  const n = points.length;
  const mx = points.reduce((s, p) => s + p[0], 0) / n;
  const my = points.reduce((s, p) => s + p[1], 0) / n;
  const sxx = points.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
  if (sxx < 1e-9) return null;
  const slope = points.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / sxx;
  return { slope, intercept: my - slope * mx };
};

const GraphPlotInput = ({ spec, value, onChange, readOnly = false }) => {
  const axes = spec?.axes || { x: [-10, 10, 1], y: [-10, 10, 1] };
  const [xMin, xMax, xStep = 1] = axes.x;
  const [yMin, yMax, yStep = 1] = axes.y;

  const boxId = useRef(`jxg-graph-${Math.random().toString(36).slice(2)}`);
  const boardRef = useRef(null);
  const pointsRef = useRef([]);
  const previewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Freehand curve-drawing state: while the pointer is down in curve mode,
  // 'move' samples points along the drag path instead of requiring a click
  // per point — tracing a curve by dragging is the natural gesture for
  // "plot a curve", vs. clicking each point individually.
  const isDrawingRef = useRef(false);
  const lastSampleRef = useRef(null);
  const strokeStartsRef = useRef([]); // stack of pointsRef indices, one per curve stroke
  const minSampleDist = Math.max(xStep, yStep) * 0.6;

  const initialMode = (value?.elements || []).find(
    (el) => el.kind === 'line' || el.kind === 'curve'
  )?.kind || 'points';
  const [drawMode, setDrawMode] = useState(initialMode);
  const drawModeRef = useRef(drawMode);
  drawModeRef.current = drawMode;
  const [pointCount, setPointCount] = useState((value?.points || []).length);

  const emit = () => {
    const pts = pointsRef.current.map((p) => ({ x: round(p.X()), y: round(p.Y()) }));
    const elements =
      drawModeRef.current !== 'points' && pts.length >= 2
        ? [{ kind: drawModeRef.current, through: pts.map((p) => [p.x, p.y]) }]
        : [];
    setPointCount(pts.length);
    onChangeRef.current({ _type: 'graph_plot', axes, points: pts, elements });
  };

  // Both preview lines are built as plain static-array 'curve' elements
  // (never JSXGraph's dynamic point-tracking curve/functiongraph/spline
  // types) — one shared, known-reliable rendering path for both modes.
  const drawStaticCurve = (board, xs, ys) => {
    previewRef.current = board.create('curve', [xs, ys], {
      strokeColor: '#2563eb', strokeWidth: 2, fixed: true, highlight: false, name: '',
    });
  };

  const updatePreview = (board) => {
    if (previewRef.current) {
      board.removeObject(previewRef.current);
      previewRef.current = null;
    }
    if (drawModeRef.current === 'points' || pointsRef.current.length < 2) return;

    if (drawModeRef.current === 'line') {
      const fit = fitLine(pointsRef.current.map((p) => [p.X(), p.Y()]));
      if (!fit) return;
      drawStaticCurve(board, [xMin, xMax], [fit.slope * xMin + fit.intercept, fit.slope * xMax + fit.intercept]);
    } else {
      // Curve mode: a genuine smooth natural-cubic-spline fit through the
      // placed points (JXG.Math.Numerics — the same spline math JSXGraph's
      // own dynamic 'spline' element uses internally, but run here against
      // plain arrays and densely re-sampled into a fine polyline, which is
      // what actually renders reliably — see drawStaticCurve above).
      const x = pointsRef.current.map((p) => p.X());
      const y = pointsRef.current.map((p) => p.Y());
      // splineDef sorts x/y in place and needs distinct x values per knot —
      // duplicate x (e.g. two points snapped to the same column) would
      // divide by a zero knot-spacing, so collapse to the first y seen.
      const byX = new Map();
      x.forEach((xi, i) => { if (!byX.has(xi)) byX.set(xi, y[i]); });
      const ux = [...byX.keys()];
      const uy = [...byX.values()];
      if (ux.length < 2) return;

      const F = JXG.Math.Numerics.splineDef(ux, uy); // sorts ux/uy in place
      const xLo = ux[0];
      const xHi = ux[ux.length - 1];
      if (xHi - xLo < 1e-9) return;
      const samples = 120;
      const xs = Array.from({ length: samples + 1 }, (_, i) => xLo + ((xHi - xLo) * i) / samples);
      const ys = JXG.Math.Numerics.splineEval(xs, ux, uy, F);
      drawStaticCurve(board, xs, ys);
    }
  };

  const removePoint = (board, point) => {
    board.removeObject(point);
    pointsRef.current = pointsRef.current.filter((p) => p !== point);
    updatePreview(board);
    emit();
  };

  const addPoint = (board, gx, gy) => {
    const point = board.create('point', [gx, gy], {
      size: 4,
      fillColor: '#2563eb',
      strokeColor: '#2563eb',
      highlightFillColor: '#1d4ed8',
      highlightStrokeColor: '#1d4ed8',
      fixed: readOnly,
      snapToGrid: true,
      snapSizeX: xStep / 2,
      snapSizeY: yStep / 2,
      showInfobox: false,
      withLabel: false,
    });
    if (!readOnly) {
      point.on('drag', () => { updatePreview(board); emit(); });
      point.on('dblclick', () => removePoint(board, point));
    }
    pointsRef.current.push(point);
    return point;
  };

  // Mount the board once; re-mount only if the axes spec itself changes
  // (in practice the widget is remounted per-question via a `key` prop, so
  // this effectively runs once per question).
  useEffect(() => {
    const board = JXG.JSXGraph.initBoard(boxId.current, {
      boundingbox: [xMin, yMax, xMax, yMin],
      axis: true,
      grid: true,
      keepAspectRatio: false,
      showCopyright: false,
      showNavigation: false,
      pan: { enabled: false },
      zoom: { enabled: false },
    });
    boardRef.current = board;
    pointsRef.current = [];
    previewRef.current = null;

    // `value` is only read here, at mount, to seed initial points — mirrors
    // the previous useState(() => value?.points) mount-only read.
    (value?.points || []).forEach((p) => addPoint(board, p.x, p.y));
    updatePreview(board);

    if (!readOnly) {
      board.on('down', (e) => {
        // Only skip point-creation if an existing *point* was hit — grid
        // lines and axes are also hasPoint()-hittable within a tolerance
        // and would otherwise block placing a point near them.
        const hitPoint = board.getAllObjectsUnderMouse(e).some((el) => el.elType === 'point');
        if (hitPoint) return; // let native drag/dblclick handle it instead
        const coords = board.getUsrCoordsOfMouse(e);

        if (drawModeRef.current === 'curve') {
          strokeStartsRef.current.push(pointsRef.current.length);
          isDrawingRef.current = true;
          lastSampleRef.current = { x: coords[0], y: coords[1] };
        }
        addPoint(board, coords[0], coords[1]);
        updatePreview(board);
        emit();
      });

      board.on('move', (e) => {
        if (!isDrawingRef.current) return;
        const coords = board.getUsrCoordsOfMouse(e);
        const [gx, gy] = coords;
        if (gx < xMin || gx > xMax || gy < yMin || gy > yMax) return;
        const last = lastSampleRef.current;
        const dist = last ? Math.hypot(gx - last.x, gy - last.y) : Infinity;
        if (dist < minSampleDist) return;
        lastSampleRef.current = { x: gx, y: gy };
        addPoint(board, gx, gy);
        updatePreview(board);
        emit();
      });

      board.on('up', () => {
        isDrawingRef.current = false;
        lastSampleRef.current = null;
      });
    }

    return () => {
      JXG.JSXGraph.freeBoard(board);
      boardRef.current = null;
    };
  }, [xMin, xMax, yMin, yMax, xStep, yStep, readOnly]);

  const changeDrawMode = (mode) => {
    setDrawMode(mode);
    drawModeRef.current = mode;
    if (boardRef.current) {
      updatePreview(boardRef.current);
      emit();
    }
  };

  const undoPoint = () => {
    const board = boardRef.current;
    if (!board || pointsRef.current.length === 0) return;

    if (drawModeRef.current === 'curve' && strokeStartsRef.current.length > 0) {
      // Undo the whole most-recent drawn stroke, not just its last sampled
      // point — a freehand stroke can be dozens of points, and undoing them
      // one at a time would be as tedious as the click-per-point flow this
      // gesture replaced.
      const startIdx = strokeStartsRef.current.pop();
      const toRemove = pointsRef.current.slice(startIdx);
      toRemove.forEach((p) => board.removeObject(p));
      pointsRef.current = pointsRef.current.slice(0, startIdx);
    } else {
      const last = pointsRef.current[pointsRef.current.length - 1];
      board.removeObject(last);
      pointsRef.current = pointsRef.current.filter((p) => p !== last);
    }
    updatePreview(board);
    emit();
  };

  const clearPoints = () => {
    const board = boardRef.current;
    if (!board) return;
    pointsRef.current.forEach((p) => board.removeObject(p));
    pointsRef.current = [];
    strokeStartsRef.current = [];
    updatePreview(board);
    emit();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">
          Auto-marked graph
        </span>
        <span className="text-gray-500">
          {readOnly
            ? "Student's plotted answer (read-only)"
            : drawMode === 'curve'
              ? 'Press and drag across the grid to draw the curve · double-click a point to remove it'
              : 'Click to place a point · drag to move it · double-click to remove it'}
        </span>
      </div>

      <div
        id={boxId.current}
        className="w-full max-w-md aspect-square border-2 border-gray-300 rounded-lg bg-white touch-none"
        role="img"
        aria-label="Coordinate grid for plotting your answer"
      />

      {!readOnly && (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name={`${boxId.current}-mode`}
                checked={drawMode === 'points'}
                onChange={() => changeDrawMode('points')}
                className="rounded"
              />
              Points only
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name={`${boxId.current}-mode`}
                checked={drawMode === 'line'}
                onChange={() => changeDrawMode('line')}
                className="rounded"
              />
              Draw a straight line through my points
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name={`${boxId.current}-mode`}
                checked={drawMode === 'curve'}
                onChange={() => changeDrawMode('curve')}
                className="rounded"
              />
              Draw a curve
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={undoPoint}
              disabled={pointCount === 0}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              {drawMode === 'curve' ? 'Undo last stroke' : 'Undo point'}
            </button>
            <button
              type="button"
              onClick={clearPoints}
              disabled={pointCount === 0}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Clear
            </button>
            <span className="text-xs text-gray-400 ml-auto">
              {pointCount} point{pointCount !== 1 ? 's' : ''} placed
            </span>
          </div>
        </>
      )}

      {readOnly && (
        <p className="text-xs text-gray-400">
          {pointCount} point{pointCount !== 1 ? 's' : ''} plotted
          {drawMode !== 'points' ? ` · ${drawMode === 'line' ? 'straight line' : 'curve'} mode` : ''}
        </p>
      )}
    </div>
  );
};

export default GraphPlotInput;
