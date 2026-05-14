import React, { useRef, useState, useCallback, useEffect } from 'react';

// ─── Resize handle definitions ────────────────────────────────────────────────
const HANDLES = [
  { name: 'nw', style: { top: -5,    left: -5    }, cursor: 'nw-resize' },
  { name: 'n',  style: { top: -5,    left: '50%', transform: 'translateX(-50%)' }, cursor: 'n-resize'  },
  { name: 'ne', style: { top: -5,    right: -5   }, cursor: 'ne-resize' },
  { name: 'e',  style: { top: '50%', right: -5,   transform: 'translateY(-50%)' }, cursor: 'e-resize'  },
  { name: 'se', style: { bottom: -5, right: -5   }, cursor: 'se-resize' },
  { name: 's',  style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' }, cursor: 's-resize'  },
  { name: 'sw', style: { bottom: -5, left: -5    }, cursor: 'sw-resize' },
  { name: 'w',  style: { top: '50%', left: -5,    transform: 'translateY(-50%)' }, cursor: 'w-resize'  },
];

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function applyResize(startSel, startPos, currentPos, handle) {
  const dx = currentPos.x - startPos.x;
  const dy = currentPos.y - startPos.y;
  let { x, y, w, h } = startSel;

  switch (handle) {
    case 'nw': x += dx; y += dy; w -= dx; h -= dy; break;
    case 'n':            y += dy;           h -= dy; break;
    case 'ne':      w += dx; y += dy; h -= dy; break;
    case 'e':       w += dx;                        break;
    case 'se':      w += dx;             h += dy; break;
    case 's':                            h += dy; break;
    case 'sw': x += dx; w -= dx;         h += dy; break;
    case 'w':  x += dx; w -= dx;                  break;
    default: break;
  }

  if (w < 0) { x += w; w = -w; }
  if (h < 0) { y += h; h = -h; }

  x = Math.max(0, x);
  y = Math.max(0, y);
  w = Math.max(0.005, Math.min(1 - x, w));
  h = Math.max(0.005, Math.min(1 - y, h));

  return { x, y, w, h };
}

function applyMove(startSel, startPos, currentPos) {
  const x = Math.max(0, Math.min(1 - startSel.w, startSel.x + (currentPos.x - startPos.x)));
  const y = Math.max(0, Math.min(1 - startSel.h, startSel.y + (currentPos.y - startPos.y)));
  return { ...startSel, x, y };
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * DiagramCropModal
 *
 * Props:
 *   pageImage      – data URI of the rendered page (~900px wide)
 *   currentDiagram – existing stimulusBlock shown as reference (or null)
 *   onConfirm(stimulusBlock) – new {type, content, caption}
 *   onRemove()     – discard existing diagram
 *   onClose()      – cancel without changes
 */

const ZOOM_LEVELS = [1, 1.5, 2, 2.5, 3];

const DiagramCropModal = ({ pageImage, currentDiagram, onConfirm, onRemove, onClose }) => {
  const imgRef       = useRef(null);
  const containerRef = useRef(null);
  const [selection, setSelection] = useState(null);
  const [imgLoaded,  setImgLoaded]  = useState(false);
  const [zoom, setZoom] = useState(1);

  // Refs so event handlers can read latest state without stale closures.
  const selectionRef  = useRef(null);
  const drawStartRef  = useRef(null);   // {x,y} origin when drawing a new rect
  const dragStateRef  = useRef(null);   // { type, handle?, startPos, startSel }
  const activeRef     = useRef(false);

  useEffect(() => { selectionRef.current = selection; }, [selection]);

  // ── Close on Escape ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ── Normalised position relative to the image container ─────────────────────
  // getBoundingClientRect() accounts for scroll offset automatically, so this
  // is correct whether the container is scrolled or not.
  const getRelPos = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left)  / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top)   / rect.height)),
    };
  }, []);

  // ── Window-level mousemove / mouseup ─────────────────────────────────────────
  // Attached to window so that:
  //  • dragging continues if the cursor drifts onto a scrollbar or outside the container
  //  • scrolling the view does not cancel an active draw/resize/move
  useEffect(() => {
    const onMove = (e) => {
      if (!activeRef.current || !containerRef.current) return;
      const pos = getRelPos(e);

      if (drawStartRef.current) {
        const s = drawStartRef.current;
        setSelection({
          x: Math.min(s.x, pos.x),
          y: Math.min(s.y, pos.y),
          w: Math.abs(pos.x - s.x),
          h: Math.abs(pos.y - s.y),
        });
        return;
      }

      if (dragStateRef.current) {
        const { type, handle, startPos, startSel } = dragStateRef.current;
        setSelection(type === 'move'
          ? applyMove(startSel, startPos, pos)
          : applyResize(startSel, startPos, pos, handle)
        );
      }
    };

    const onUp = () => {
      drawStartRef.current = null;
      dragStateRef.current = null;
      activeRef.current    = false;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, [getRelPos]);

  // ── Container mousedown handlers ─────────────────────────────────────────────

  const handleBgMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    drawStartRef.current = getRelPos(e);
    activeRef.current    = true;
    setSelection(null);
  }, [getRelPos]);

  const handleMoveStart = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    dragStateRef.current = { type: 'move', startPos: getRelPos(e), startSel: selectionRef.current };
    activeRef.current    = true;
  }, [getRelPos]);

  const handleResizeStart = useCallback((handleName, e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    dragStateRef.current = { type: 'resize', handle: handleName, startPos: getRelPos(e), startSel: selectionRef.current };
    activeRef.current    = true;
  }, [getRelPos]);

  // ── Confirm crop ─────────────────────────────────────────────────────────────

  const handleConfirm = useCallback(() => {
    const sel = selectionRef.current;
    if (!sel || sel.w < 0.01 || sel.h < 0.01) return;
    const src = imgRef.current;
    if (!src) return;

    const sw = src.naturalWidth;
    const sh = src.naturalHeight;
    const cw = Math.max(1, Math.round(sel.w * sw));
    const ch = Math.max(1, Math.round(sel.h * sh));
    const canvas = document.createElement('canvas');
    canvas.width  = cw;
    canvas.height = ch;
    canvas.getContext('2d').drawImage(src,
      Math.round(sel.x * sw), Math.round(sel.y * sh), cw, ch,
      0, 0, cw, ch
    );
    onConfirm({ type: 'image', content: canvas.toDataURL('image/jpeg', 0.92), caption: 'Diagram' });
  }, [onConfirm]);

  const hasValidSelection = selection && selection.w > 0.01 && selection.h > 0.01;
  const isZoomed          = zoom > 1;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-4xl" style={{ maxHeight: '92vh' }}>

        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">Crop Diagram</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Drag on the page to draw a selection · drag handles to resize · drag the box to move it
              {isZoomed && ' · scroll to pan around the image'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1">
              <button
                onClick={() => setZoom(z => { const i = ZOOM_LEVELS.indexOf(z); return i > 0 ? ZOOM_LEVELS[i - 1] : z; })}
                disabled={zoom === ZOOM_LEVELS[0]}
                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg leading-none"
                title="Zoom out"
              >−</button>
              <span className="text-xs text-gray-600 w-8 text-center select-none">{zoom}×</span>
              <button
                onClick={() => setZoom(z => { const i = ZOOM_LEVELS.indexOf(z); return i < ZOOM_LEVELS.length - 1 ? ZOOM_LEVELS[i + 1] : z; })}
                disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg leading-none"
                title="Zoom in"
              >+</button>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
          </div>
        </div>

        {/* Scroll hint bar — only shown when zoomed */}
        {isZoomed && imgLoaded && (
          <div className="px-5 py-1.5 bg-blue-50 border-b border-blue-100 shrink-0 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
            </svg>
            <span className="text-xs text-blue-700">Scrollbars active — use them to pan, then draw your crop selection</span>
          </div>
        )}

        {/* Page image + scrollable canvas */}
        <div
          className="flex-1 min-h-0 p-4"
          style={{
            overflowX: isZoomed ? 'scroll' : 'auto',
            overflowY: isZoomed ? 'scroll' : 'auto',
          }}
        >
          {!imgLoaded && (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading page…</div>
          )}

          {/* Image container — expands to zoom * 100% wide, triggering both scrollbars */}
          <div
            ref={containerRef}
            className={`relative rounded border border-gray-200 ${imgLoaded ? '' : 'hidden'}`}
            style={{
              cursor: 'crosshair',
              userSelect: 'none',
              width: `${zoom * 100}%`,
              minWidth: `${zoom * 100}%`,
            }}
            onMouseDown={handleBgMouseDown}
          >
            <img
              ref={imgRef}
              src={pageImage}
              alt="Page"
              className="w-full block"
              draggable={false}
              onLoad={() => setImgLoaded(true)}
            />

            {selection && (
              <>
                {/* Dimming overlays */}
                <div className="absolute inset-x-0 top-0 bg-black bg-opacity-40 pointer-events-none"
                     style={{ height: `${selection.y * 100}%` }} />
                <div className="absolute inset-x-0 bg-black bg-opacity-40 pointer-events-none"
                     style={{ top: `${(selection.y + selection.h) * 100}%`, bottom: 0 }} />
                <div className="absolute bg-black bg-opacity-40 pointer-events-none"
                     style={{ top: `${selection.y * 100}%`, height: `${selection.h * 100}%`, left: 0, width: `${selection.x * 100}%` }} />
                <div className="absolute bg-black bg-opacity-40 pointer-events-none"
                     style={{ top: `${selection.y * 100}%`, height: `${selection.h * 100}%`, left: `${(selection.x + selection.w) * 100}%`, right: 0 }} />

                {/* Selection box */}
                <div
                  style={{
                    position: 'absolute',
                    left:   `${selection.x * 100}%`,
                    top:    `${selection.y * 100}%`,
                    width:  `${selection.w * 100}%`,
                    height: `${selection.h * 100}%`,
                    border: '2px solid #2563eb',
                    cursor: 'move',
                    boxSizing: 'border-box',
                  }}
                  onMouseDown={handleMoveStart}
                >
                  {HANDLES.map((h) => (
                    <div
                      key={h.name}
                      style={{
                        position: 'absolute',
                        width: 10, height: 10,
                        background: 'white',
                        border: '2px solid #2563eb',
                        borderRadius: 2,
                        cursor: h.cursor,
                        ...h.style,
                      }}
                      onMouseDown={(e) => handleResizeStart(h.name, e)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t shrink-0 flex items-center gap-3">
          {currentDiagram?.content && (
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-xs text-gray-500 shrink-0">Current:</span>
              <img src={currentDiagram.content} alt="Current crop"
                   className="h-12 w-auto border border-gray-200 rounded object-contain" />
              {onRemove && (
                <button onClick={onRemove}
                        className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1 hover:bg-red-50">
                  Remove
                </button>
              )}
            </div>
          )}
          {!currentDiagram?.content && <div className="mr-auto" />}

          <button onClick={onClose}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!hasValidSelection}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagramCropModal;
