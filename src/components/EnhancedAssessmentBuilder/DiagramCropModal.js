import React, { useRef, useState, useCallback, useEffect } from 'react';

/**
 * DiagramCropModal
 *
 * Lets the teacher draw a selection rectangle on a rendered page image and
 * confirms a new base64 JPEG crop for the question's stimulusBlock.
 *
 * Props:
 *   pageImage     – data URI of the page at ~900px wide
 *   currentDiagram – existing stimulusBlock (or null) shown as reference
 *   onConfirm(stimulusBlock) – called with the new {type, content, caption} object
 *   onRemove()    – called when the teacher wants to discard the current diagram
 *   onClose()     – called to cancel without changes
 */
const DiagramCropModal = ({ pageImage, currentDiagram, onConfirm, onRemove, onClose }) => {
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Selection in 0-1 fractions of the displayed image
  const [selection, setSelection] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const getRelPos = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  }, []);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    const pos = getRelPos(e);
    setDragStart(pos);
    setDragging(true);
    setSelection(null);
  }, [getRelPos]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !dragStart) return;
    const pos = getRelPos(e);
    setSelection({
      x: Math.min(dragStart.x, pos.x),
      y: Math.min(dragStart.y, pos.y),
      w: Math.abs(pos.x - dragStart.x),
      h: Math.abs(pos.y - dragStart.y),
    });
  }, [dragging, dragStart, getRelPos]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selection || selection.w < 0.01 || selection.h < 0.01) return;
    const srcImg = imgRef.current;
    if (!srcImg) return;

    const sw = srcImg.naturalWidth;
    const sh = srcImg.naturalHeight;

    const cx = Math.round(selection.x * sw);
    const cy = Math.round(selection.y * sh);
    const cw = Math.max(1, Math.round(selection.w * sw));
    const ch = Math.max(1, Math.round(selection.h * sh));

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(srcImg, cx, cy, cw, ch, 0, 0, cw, ch);

    const dataUri = canvas.toDataURL('image/jpeg', 0.92);
    onConfirm({ type: 'image', content: dataUri, caption: 'Diagram' });
  }, [selection, onConfirm]);

  const hasValidSelection = selection && selection.w > 0.01 && selection.h > 0.01;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-4xl"
           style={{ maxHeight: '92vh' }}>

        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">Crop Diagram</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Click and drag on the page to select the diagram area, then click Apply.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>

        {/* Page image with crop overlay */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4">
          {!imgLoaded && (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Loading page…
            </div>
          )}
          <div
            ref={containerRef}
            className={`relative select-none ${imgLoaded ? '' : 'hidden'}`}
            style={{ cursor: 'crosshair' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imgRef}
              src={pageImage}
              alt="Page"
              className="w-full block border border-gray-200 rounded"
              draggable={false}
              onLoad={() => setImgLoaded(true)}
            />

            {/* Selection rectangle */}
            {selection && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${selection.x * 100}%`,
                  top: `${selection.y * 100}%`,
                  width: `${selection.w * 100}%`,
                  height: `${selection.h * 100}%`,
                  border: '2px solid #2563eb',
                  background: 'rgba(37,99,235,0.10)',
                  boxSizing: 'border-box',
                }}
              />
            )}

            {/* Dimming overlay outside selection */}
            {selection && (
              <>
                <div className="absolute inset-0 bg-black bg-opacity-30 pointer-events-none"
                     style={{ clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${selection.x * 100}% ${selection.y * 100}%, ${selection.x * 100}% ${(selection.y + selection.h) * 100}%, ${(selection.x + selection.w) * 100}% ${(selection.y + selection.h) * 100}%, ${(selection.x + selection.w) * 100}% ${selection.y * 100}%, ${selection.x * 100}% ${selection.y * 100}%)` }} />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t shrink-0 flex items-center gap-3">
          {/* Current diagram preview */}
          {currentDiagram?.content && (
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-xs text-gray-500 shrink-0">Current:</span>
              <img
                src={currentDiagram.content}
                alt="Current crop"
                className="h-12 w-auto border border-gray-200 rounded object-contain"
              />
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
                >
                  Remove
                </button>
              )}
            </div>
          )}
          {!currentDiagram?.content && onRemove && (
            <div className="mr-auto" />
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
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
