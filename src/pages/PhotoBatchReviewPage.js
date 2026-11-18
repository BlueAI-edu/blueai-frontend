/**
 * pages/PhotoBatchReviewPage.jsx
 *
 * Route: /teacher/photo-batch/:batchId/review?assessmentId=<id>
 *
 * Loads all flagged images for a batch and lets the teacher correct the
 * OCR transcript for each one before proceeding to marking.
 *
 * Flow:
 *   1. Fetch /teacher/photo-batch/:batchId/flagged
 *   2. Show image + editable textarea for each flagged page, side by side
 *   3. PATCH each image as the teacher confirms the transcript
 *   4. Once all are resolved → navigate to the normal marking / OCR
 *      moderation route for this assessment
 *
 * Mirrors the style of the existing OCRModerationPage so teachers see a
 * consistent experience regardless of upload source.
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  XCircle,
} from "lucide-react";
import { teacherApi } from "@/services/api";

// ─── component ────────────────────────────────────────────────────────────────

export default function PhotoBatchReviewPage() {
  const { batchId }         = useParams();
  const [searchParams]      = useSearchParams();
  const assessmentId        = searchParams.get("assessmentId");
  const navigate            = useNavigate();

  const [images, setImages]         = useState([]);   // flagged image docs
  const [currentIndex, setIndex]    = useState(0);
  const [transcripts, setTranscripts] = useState({}); // { image_id: string }
  const [saved, setSaved]           = useState({});   // { image_id: true }
  const [saving, setSaving]         = useState(false);
  const [loadError, setLoadError]   = useState(null);
  const [saveError, setSaveError]   = useState(null);
  const [loading, setLoading]       = useState(true);

  // ── load flagged images ─────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const { data } = await teacherApi.get(
          `/teacher/photo-batch/${batchId}/flagged`
        );
        const imgs = data.images ?? [];
        setImages(imgs);
        // Seed transcript state with OCR text so the teacher can edit from it
        const seed = {};
        imgs.forEach((img) => { seed[img.image_id] = img.ocr_text ?? ""; });
        setTranscripts(seed);
      } catch (err) {
        setLoadError(err.response?.data?.detail || "Failed to load flagged images.");
      } finally {
        setLoading(false);
      }
    })();
  }, [batchId]);

  // ── save single image ───────────────────────────────────────────────────

  const saveCurrentImage = useCallback(async () => {
    const img = images[currentIndex];
    if (!img) return;

    const text = transcripts[img.image_id]?.trim();
    if (!text) {
      setSaveError("Transcript cannot be empty.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await teacherApi.patch(
        `/teacher/photo-batch/${batchId}/images/${img.image_id}`,
        { ocr_text: text }
      );
      setSaved((prev) => ({ ...prev, [img.image_id]: true }));

      // Auto-advance to the next unsaved image
      const nextUnsaved = images.findIndex(
        (im, i) => i > currentIndex && !saved[im.image_id] && im.image_id !== img.image_id
      );
      if (nextUnsaved !== -1) {
        setIndex(nextUnsaved);
      }
    } catch (err) {
      setSaveError(err.response?.data?.detail || "Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  }, [images, currentIndex, transcripts, batchId, saved]);

  // ── keyboard shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "n") {
        setIndex((i) => Math.min(i + 1, images.length - 1));
      }
      if (e.key === "ArrowLeft" || e.key === "p") {
        setIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length]);

  // ── all done check ──────────────────────────────────────────────────────

  const allSaved = images.length > 0 && images.every((img) => saved[img.image_id]);

  const handleFinish = () => {
    // Navigate to the existing OCR moderation / marking route for this assessment
    // WIRE: replace with the actual route you use post-OCR (e.g. OCRModerationPage)
    navigate(`/teacher/assessments/${assessmentId}/ocr-review`);
  };

  // ── render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading flagged images…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">
        <div className="flex items-start gap-2">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-gray-500">
        <CheckCircle className="h-8 w-8 text-green-500" />
        <p>No flagged images — all pages passed OCR confidence check.</p>
        <button
          type="button"
          onClick={handleFinish}
          className="mt-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Continue to marking
        </button>
      </div>
    );
  }

  const current = images[currentIndex];
  const savedCount = Object.keys(saved).length;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Review flagged pages
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {savedCount} of {images.length} confirmed · correct the transcript
            then click Save
          </p>
        </div>

        {allSaved ? (
          <button
            type="button"
            onClick={handleFinish}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            All confirmed — continue to marking
          </button>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {images.length - savedCount} remaining
          </p>
        )}
      </div>

      {/* Thumbnail strip */}
      <ThumbnailStrip
        images={images}
        currentIndex={currentIndex}
        saved={saved}
        onSelect={setIndex}
      />

      {/* Main review panel */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Image */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Original photo ({currentIndex + 1}/{images.length})
          </p>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <img
              key={current.image_id}
              src={`/uploads/photo_batches/${batchId}/${current.image_id}${_ext(current.original_filename)}`}
              alt={current.original_filename}
              className="max-h-[600px] w-full object-contain"
              onError={(e) => {
                // Fallback: hide the img if path can't be resolved
                // WIRE: serve images via a /teacher/photo-batch/:batchId/images/:imageId
                //       endpoint if you don't want to expose the upload folder directly
                e.target.style.display = "none";
              }}
            />
            <p className="truncate px-3 pb-2 pt-1 text-xs text-gray-400">
              {current.original_filename}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <ConfidencePill confidence={current.confidence} />
          </div>
        </div>

        {/* Transcript editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              OCR transcript
            </p>
            {saved[current.image_id] && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
          </div>

          <textarea
            value={transcripts[current.image_id] ?? ""}
            onChange={(e) =>
              setTranscripts((prev) => ({
                ...prev,
                [current.image_id]: e.target.value,
              }))
            }
            rows={22}
            placeholder="OCR text will appear here — correct any mistakes before saving."
            className={[
              "w-full resize-none rounded-lg border px-3 py-2.5 font-mono text-sm",
              "text-gray-800 placeholder-gray-400 outline-none transition-colors",
              "dark:text-gray-200 dark:placeholder-gray-500",
              saved[current.image_id]
                ? "border-green-300 bg-green-50/50 dark:border-green-700/40 dark:bg-green-900/10"
                : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800",
              "focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30",
            ].join(" ")}
          />

          {saveError && (
            <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {saveError}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            {/* Prev / Next */}
            <div className="flex gap-2">
              <NavButton
                direction="prev"
                disabled={currentIndex === 0}
                onClick={() => setIndex((i) => i - 1)}
              />
              <NavButton
                direction="next"
                disabled={currentIndex === images.length - 1}
                onClick={() => setIndex((i) => i + 1)}
              />
            </div>

            {/* Save */}
            <button
              type="button"
              onClick={saveCurrentImage}
              disabled={saving || saved[current.image_id]}
              className={[
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors",
                saved[current.image_id]
                  ? "bg-green-500 cursor-default"
                  : saving
                  ? "bg-blue-400 cursor-wait"
                  : "bg-blue-600 hover:bg-blue-700",
                "disabled:opacity-70",
              ].join(" ")}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved[current.image_id] ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved[current.image_id] ? "Saved" : "Save transcript"}
            </button>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Keyboard: ← / → to navigate · fixes are saved per-image
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function ThumbnailStrip({ images, currentIndex, saved, onSelect }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {images.map((img, i) => (
        <button
          key={img.image_id}
          type="button"
          onClick={() => onSelect(i)}
          className={[
            "relative shrink-0 h-14 w-14 overflow-hidden rounded-lg border-2 transition-all",
            i === currentIndex
              ? "border-blue-500 ring-2 ring-blue-500/30"
              : saved[img.image_id]
              ? "border-green-400 opacity-70"
              : "border-amber-300 hover:border-amber-400",
          ].join(" ")}
          title={img.original_filename}
        >
          {/* Placeholder coloured block since we may not be able to serve the img directly */}
          <div className="h-full w-full bg-gray-100 dark:bg-gray-800" />
          {/* Status dot */}
          <div
            className={[
              "absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border border-white",
              saved[img.image_id] ? "bg-green-500" : "bg-amber-400",
            ].join(" ")}
          />
          <span className="absolute left-0 right-0 top-0.5 text-center text-[9px] font-medium text-gray-500">
            {i + 1}
          </span>
        </button>
      ))}
    </div>
  );
}

function ConfidencePill({ confidence }) {
  if (confidence == null) return null;
  const pct  = Math.round(confidence * 100);
  const good = confidence >= 0.75;
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        good
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      ].join(" ")}
    >
      <AlertTriangle className="h-3 w-3" />
      OCR confidence: {pct}%{!good && " — low quality, review carefully"}
    </span>
  );
}

function NavButton({ direction, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-30 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200"
      title={direction === "prev" ? "Previous" : "Next"}
    >
      {direction === "prev"
        ? <ChevronLeft className="h-4 w-4" />
        : <ChevronRight className="h-4 w-4" />}
    </button>
  );
}

// ─── utils ────────────────────────────────────────────────────────────────────

function _ext(filename) {
  if (!filename) return "";
  const m = filename.match(/(\.[^.]+)$/);
  return m ? m[1].toLowerCase() : "";
}