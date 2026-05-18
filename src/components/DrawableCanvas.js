import { useRef, useState, useEffect, useCallback } from 'react';

const CANVAS_W = 800;
const CANVAS_H = 550;

// Detect whether question text requires a drawing/graph response.
// Exported so EnhancedAttemptPage can use it directly.
export function requiresDrawing(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  return (
    /\bsketch\b/.test(t) ||
    /\bdraw\s+(a\s+|the\s+|your\s+)?(histogram|graph|diagram|bar chart|frequency polygon|cumulative frequency|curve|line|circle|triangle|quadrilateral|region|shape)\b/.test(t) ||
    /\bplot\s+(the\s+|a\s+|your\s+)?(points?|graph|histogram|coordinates|data)\b/.test(t) ||
    /\bcomplete\s+(the\s+|a\s+)?(histogram|graph|diagram|chart|table)\b/.test(t) ||
    /\bshade\s+(the\s+|a\s+)?(region|area)\b/.test(t) ||
    /\bon\s+the\s+(grid|axes|template|diagram|graph)\s+(provided|given|below|above)\b/.test(t)
  );
}

const COLORS = [
  { value: '#1d4ed8', label: 'Blue' },
  { value: '#dc2626', label: 'Red' },
  { value: '#15803d', label: 'Green' },
  { value: '#000000', label: 'Black' },
];

const DrawableCanvas = ({ backgroundImage, onChange, initialDrawing }) => {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const undoStackRef = useRef([]);
  const backgroundDataRef = useRef(null); // base64 of background-only snapshot

  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#1d4ed8');
  const [lineWidth, setLineWidth] = useState(2);
  const [canUndo, setCanUndo] = useState(false);

  const getPos = (canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  };

  const drawBlankGrid = (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Minor grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= CANVAS_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(CANVAS_W / 2, 0); ctx.lineTo(CANVAS_W / 2, CANVAS_H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, CANVAS_H / 2); ctx.lineTo(CANVAS_W, CANVAS_H / 2); ctx.stroke();
  };

  const saveUndoState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    undoStackRef.current.push(data);
    if (undoStackRef.current.length > 15) undoStackRef.current.shift();
    setCanUndo(undoStackRef.current.length > 1);
    onChange?.(data);
  }, [onChange]);

  // Initialise canvas once on mount / backgroundImage change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // If we have a previously saved drawing (full canvas snapshot), restore it directly.
    // The snapshot already contains the background so we skip re-drawing it.
    if (initialDrawing) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      const drawImg = new Image();
      drawImg.onload = () => {
        ctx.drawImage(drawImg, 0, 0, CANVAS_W, CANVAS_H);
        const snap = canvas.toDataURL();
        backgroundDataRef.current = snap;
        undoStackRef.current = [snap];
        setCanUndo(false);
      };
      drawImg.src = initialDrawing;
      return;
    }

    const finishSetup = (baseSnapshot) => {
      backgroundDataRef.current = baseSnapshot;
      undoStackRef.current = [baseSnapshot];
      setCanUndo(false);
    };

    if (backgroundImage) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(CANVAS_W / img.width, CANVAS_H / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        ctx.drawImage(img, (CANVAS_W - w) / 2, (CANVAS_H - h) / 2, w, h);
        finishSetup(canvas.toDataURL());
      };
      img.src = backgroundImage;
    } else {
      drawBlankGrid(ctx);
      finishSetup(canvas.toDataURL());
    }
  }, [backgroundImage]); // initialDrawing intentionally omitted — only used on first mount

  const startDraw = useCallback((e) => {
    e.preventDefault();
    isDrawingRef.current = true;
    lastPosRef.current = getPos(canvasRef.current, e);
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(canvas, e);
    ctx.beginPath();
    // Eraser draws white (keeps PNG opaque for clean restoration)
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 8 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
  }, [tool, color, lineWidth]);

  const endDraw = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    saveUndoState();
  }, [saveUndoState]);

  const handleUndo = () => {
    if (undoStackRef.current.length <= 1) return;
    undoStackRef.current.pop();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const snapshot = undoStackRef.current[undoStackRef.current.length - 1];
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(img, 0, 0);
      setCanUndo(undoStackRef.current.length > 1);
      onChange?.(snapshot);
    };
    img.src = snapshot;
  };

  const handleClear = () => {
    if (!window.confirm('Clear your drawing and start over?')) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const base = backgroundDataRef.current || undoStackRef.current[0];
    if (!base) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(img, 0, 0);
      undoStackRef.current = [base];
      setCanUndo(false);
      onChange?.(base);
    };
    img.src = base;
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <button
          onClick={() => setTool('pen')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            tool === 'pen' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          Pen
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            tool === 'eraser' ? 'bg-orange-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          Eraser
        </button>

        <div className="w-px h-5 bg-gray-300" />

        {COLORS.map(({ value, label }) => (
          <button
            key={value}
            title={label}
            onClick={() => { setColor(value); setTool('pen'); }}
            className={`w-6 h-6 rounded-full transition-all ${
              color === value && tool === 'pen'
                ? 'ring-2 ring-offset-1 ring-gray-800 scale-110'
                : 'ring-1 ring-gray-300'
            }`}
            style={{ backgroundColor: value }}
          />
        ))}

        <div className="w-px h-5 bg-gray-300" />

        <select
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
        >
          <option value={1}>Thin</option>
          <option value={2}>Normal</option>
          <option value={4}>Thick</option>
        </select>

        <div className="w-px h-5 bg-gray-300" />

        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className="px-3 py-1.5 rounded text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Undo
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-1.5 rounded text-sm font-medium bg-white border border-gray-300 text-red-600 hover:bg-red-50"
        >
          Clear
        </button>
      </div>

      {/* Canvas */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            cursor: tool === 'eraser' ? 'cell' : 'crosshair',
            touchAction: 'none',
          }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      <p className="text-xs text-gray-500 italic">
        Draw your answer above. Changes are saved automatically.
      </p>
    </div>
  );
};

export default DrawableCanvas;
