import React, { useState, useRef, useEffect } from 'react';

const GraphPlotter = ({ onSave, initialData = null }) => {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState('function'); // 'function' or 'points'
  const [equation, setEquation] = useState(initialData?.equation || '');
  const [points, setPoints] = useState(initialData?.points || []);
  const [gridSize, setGridSize] = useState({ min: -10, max: 10 });
  const [zoom, setZoom] = useState(20); // pixels per unit
  const [showGrid, setShowGrid] = useState(true);
  const [lineColor, setLineColor] = useState('#2563eb');
  const [error, setError] = useState('');

  const canvasWidth = 600;
  const canvasHeight = 600;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // Convert canvas coordinates to graph coordinates
  const canvasToGraph = (x, y) => {
    return {
      x: (x - centerX) / zoom,
      y: (centerY - y) / zoom
    };
  };

  // Convert graph coordinates to canvas coordinates
  const graphToCanvas = (x, y) => {
    return {
      x: centerX + x * zoom,
      y: centerY - y * zoom
    };
  };

  // Draw the grid and axes
  const drawGrid = (ctx) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (showGrid) {
      // Grid lines
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;

      for (let i = gridSize.min; i <= gridSize.max; i++) {
        const pos = graphToCanvas(i, 0);
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(pos.x, 0);
        ctx.lineTo(pos.x, canvasHeight);
        ctx.stroke();

        // Horizontal lines
        const posY = graphToCanvas(0, i);
        ctx.beginPath();
        ctx.moveTo(0, posY.y);
        ctx.lineTo(canvasWidth, posY.y);
        ctx.stroke();
      }
    }

    // Axes
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvasWidth, centerY);
    ctx.stroke();
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.moveTo(centerX, canvasHeight);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    for (let i = gridSize.min; i <= gridSize.max; i++) {
      if (i !== 0) {
        const pos = graphToCanvas(i, 0);
        ctx.fillText(i.toString(), pos.x, centerY + 20);
        
        const posY = graphToCanvas(0, i);
        ctx.fillText(i.toString(), centerX - 20, posY.y + 5);
      }
    }
  };

  // Evaluate math expression safely
  const evaluateExpression = (expr, xVal) => {
    try {
      // Replace x with the value
      let expression = expr.toLowerCase()
        .replace(/\^/g, '**')
        .replace(/x/g, `(${xVal})`)
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/abs/g, 'Math.abs')
        .replace(/log/g, 'Math.log10')
        .replace(/ln/g, 'Math.log')
        .replace(/pi/g, 'Math.PI')
        .replace(/e(?![a-z])/g, 'Math.E');

      // eslint-disable-next-line no-eval
      return eval(expression);
    } catch (e) {
      return null;
    }
  };

  // Plot function
  const plotFunction = (ctx) => {
    if (!equation.trim()) return;

    setError('');
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    let started = false;
    const step = 0.1;

    for (let x = gridSize.min; x <= gridSize.max; x += step) {
      const y = evaluateExpression(equation, x);
      
      if (y === null || !isFinite(y)) {
        started = false;
        continue;
      }

      const pos = graphToCanvas(x, y);

      if (pos.y < -50 || pos.y > canvasHeight + 50) {
        started = false;
        continue;
      }

      if (!started) {
        ctx.moveTo(pos.x, pos.y);
        started = true;
      } else {
        ctx.lineTo(pos.x, pos.y);
      }
    }

    ctx.stroke();
  };

  // Plot points
  const plotPoints = (ctx) => {
    ctx.fillStyle = lineColor;
    points.forEach(point => {
      const pos = graphToCanvas(point.x, point.y);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Label
      ctx.fillStyle = '#000000';
      ctx.font = '11px Arial';
      ctx.fillText(`(${point.x}, ${point.y})`, pos.x + 8, pos.y - 8);
      ctx.fillStyle = lineColor;
    });
  };

  // Redraw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    drawGrid(ctx);

    if (mode === 'function') {
      try {
        plotFunction(ctx);
      } catch (e) {
        setError('Invalid equation. Use format like: 2*x+3 or x^2 or sin(x)');
      }
    } else {
      plotPoints(ctx);
    }
  }, [equation, points, zoom, showGrid, lineColor, mode, gridSize]);

  // Handle canvas click for point mode
  const handleCanvasClick = (e) => {
    if (mode !== 'points') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const graphCoords = canvasToGraph(x, y);
    const roundedX = Math.round(graphCoords.x * 10) / 10;
    const roundedY = Math.round(graphCoords.y * 10) / 10;

    setPoints([...points, { x: roundedX, y: roundedY }]);
  };

  const removeLastPoint = () => {
    setPoints(points.slice(0, -1));
  };

  const clearAllPoints = () => {
    setPoints([]);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/png');
    
    onSave({
      mode,
      equation: mode === 'function' ? equation : null,
      points: mode === 'points' ? points : null,
      image: imageData,
      gridSize,
      zoom
    });
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">📊 Graph Plotter</h3>

      {/* Mode Selection */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('function')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'function'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Plot Function
        </button>
        <button
          onClick={() => setMode('points')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'points'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Plot Points
        </button>
      </div>

      {/* Function Input */}
      {mode === 'function' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter equation (y = ...)
          </label>
          <input
            type="text"
            value={equation}
            onChange={(e) => setEquation(e.target.value)}
            placeholder="e.g., 2*x+3, x^2, sin(x), x^2-4"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported: +, -, *, /, ^, sin, cos, tan, sqrt, abs, log, ln, pi, e
          </p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      )}

      {/* Points Info */}
      {mode === 'points' && (
        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-2">
            Click on the graph to plot points. Points: {points.length}
          </p>
          {points.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={removeLastPoint}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
              >
                Remove Last
              </button>
              <button
                onClick={clearAllPoints}
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Canvas */}
      <div className="border rounded-lg overflow-hidden mb-4 bg-white">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleCanvasClick}
          className="cursor-crosshair"
        />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zoom: {zoom}px/unit
          </label>
          <input
            type="range"
            min="10"
            max="50"
            value={zoom}
            onChange={(e) => setZoom(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Line Color
          </label>
          <input
            type="color"
            value={lineColor}
            onChange={(e) => setLineColor(e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">Show Grid</span>
        </label>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          Save Graph
        </button>
      </div>
    </div>
  );
};

export default GraphPlotter;
