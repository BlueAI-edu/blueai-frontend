/**
 * components/PhotoBatchUploader.jsx
 *
 * Drag-and-drop / gallery-picker for uploading a class set of photographed
 * exam pages.  Accepts JPEG, PNG, WebP, HEIC.
 *
 * Props:
 *   assessmentId  {string}   — required; passed through to the OCR submission
 *   onError(message)          — called with a human-readable string on failure
 *
 * Usage:
 *   <PhotoBatchUploader
 *     assessmentId={assessment._id}
 *     onError={setErrorMessage}
 *   />
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, X, Upload, AlertCircle } from "lucide-react";
import axios from "axios";

// ─── constants ───────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_FILES      = 60;
const MAX_FILE_MB    = 25;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const PENDING_OCR_KEY = "pending_ocr_submission";

// ─── component ───────────────────────────────────────────────────────────────

export default function PhotoBatchUploader({ assessmentId, onError }) {
  const [files, setFiles]       = useState([]);   // File[]
  const [previews, setPreviews] = useState([]);   // { url, name, size, valid }[]
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [ocrError, setOcrError] = useState(null);
  const [polling, setPolling] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [validationError, setValidationError] = useState(null);
  const inputRef = useRef(null);
  const onErrorRef = useRef(onError);
  const navigate = useNavigate();

  onErrorRef.current = onError;

  useEffect(() => {
    const pendingSubmissionId = window.localStorage.getItem(PENDING_OCR_KEY);
    if (pendingSubmissionId) {
      setSubmissionId(pendingSubmissionId);
      setProcessing(true);
      setPolling(true);
    }
  }, []);

  useEffect(() => {
    if (!submissionId || !polling) return undefined;

    let active = true;
    let requestInFlight = false;
    let pollErrorReported = false;
    const pollSubmission = async () => {
      if (requestInFlight) return;
      requestInFlight = true;

      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/ocr/submissions/${submissionId}`,
          {
            headers: { "X-Requested-With": "XMLHttpRequest" },
            withCredentials: true,
          }
        );
        if (!active) return;

        const status = data.submission?.status;
        if (!status) {
          throw new Error("Could not read OCR submission status.");
        }
        pollErrorReported = false;

        if (status === "ocr_ready") {
          if (window.localStorage.getItem(PENDING_OCR_KEY) === submissionId) {
            window.localStorage.removeItem(PENDING_OCR_KEY);
          }
          setPolling(false);
          setProcessing(false);
          navigate(`/teacher/ocr-review/${submissionId}`);
        } else if (status === "ocr_error") {
          if (window.localStorage.getItem(PENDING_OCR_KEY) === submissionId) {
            window.localStorage.removeItem(PENDING_OCR_KEY);
          }
          setPolling(false);
          setProcessing(false);
          setOcrError("OCR processing failed. Please retry.");
        } else if (status === "uploaded" || status === "ocr_processing") {
          setProcessing(true);
        }
      } catch (err) {
        if (active && !pollErrorReported) {
          pollErrorReported = true;
          onErrorRef.current?.(
            err.response?.data?.detail ||
              err.message ||
              "Unable to check OCR processing status."
          );
        }
      } finally {
        requestInFlight = false;
      }
    };

    pollSubmission();
    const intervalId = window.setInterval(pollSubmission, 3_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [navigate, polling, submissionId]);

  // ── file ingestion ──────────────────────────────────────────────────────

  const addFiles = useCallback((incoming) => {
    setValidationError(null);
    const newFiles = Array.from(incoming);

    // Validate
    const invalid = newFiles.filter(
      (f) => !ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(heic|heif)$/i)
    );
    if (invalid.length) {
      setValidationError(
        `${invalid.length} file(s) skipped — only JPEG, PNG, WebP and HEIC are accepted.`
      );
    }

    const valid = newFiles.filter(
      (f) => ACCEPTED_TYPES.includes(f.type) || f.name.match(/\.(heic|heif)$/i)
    );

    const oversized = valid.filter((f) => f.size > MAX_FILE_BYTES);
    if (oversized.length) {
      setValidationError(
        `${oversized.length} file(s) exceed ${MAX_FILE_MB} MB and were skipped.`
      );
    }

    const acceptedNew = valid.filter((f) => f.size <= MAX_FILE_BYTES);

    setFiles((prev) => {
      const combined = [...prev, ...acceptedNew].slice(0, MAX_FILES);
      if (prev.length + acceptedNew.length > MAX_FILES) {
        setValidationError(`Capped at ${MAX_FILES} images per batch.`);
      }
      return combined;
    });

    setPreviews((prev) => {
      const newPreviews = acceptedNew.map((f) => ({
        url:  URL.createObjectURL(f),
        name: f.name,
        size: f.size,
      }));
      return [...prev, ...newPreviews].slice(0, MAX_FILES);
    });
  }, []);

  const removeFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]?.url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const clearAll = useCallback(() => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setFiles([]);
    setPreviews([]);
    setValidationError(null);
  }, [previews]);

  // ── drag-and-drop ───────────────────────────────────────────────────────

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true);  };
  const onDragLeave = ()   => setDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  // ── upload ──────────────────────────────────────────────────────────────

  const startProcessing = async (id) => {
    setSubmissionId(id);
    setOcrError(null);
    setProcessing(true);
    setPolling(false);

    try {
      window.localStorage.setItem(PENDING_OCR_KEY, id);
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/ocr/submissions/${id}/process`,
        null,
        {
          headers: { "X-Requested-With": "XMLHttpRequest" },
          withCredentials: true,
        }
      );
      setPolling(true);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Could not start OCR processing. Please retry.";
      setOcrError(msg);
      setProcessing(false);
      setPolling(false);
      onError?.(msg);
    }
  };

  const handleUpload = async () => {
    if (!files.length || uploading) return;
    setUploading(true);
    setValidationError(null);

    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/ocr/submissions`,
        {
          assessment_id: assessmentId,
          student_name: "Photo Upload",
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          withCredentials: true,
        }
      );

      const form = new FormData();
      files.forEach((f) => form.append("files", f));

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/ocr/submissions/${data.submission_id}/upload`,
        form,
        {
          headers: { "X-Requested-With": "XMLHttpRequest" },
          withCredentials: true,
        }
      );

      await startProcessing(data.submission_id);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Upload failed. Please try again.";
      onError?.(msg);
    } finally {
      setUploading(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !uploading && !processing && inputRef.current?.click()}
        className={[
          "relative flex flex-col items-center justify-center gap-3",
          "rounded-xl border-2 border-dashed p-10 text-center",
          "cursor-pointer transition-colors select-none",
          dragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500",
          (uploading || processing) && "pointer-events-none opacity-60",
        ].join(" ")}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <ImagePlus className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Drag photos here, or{" "}
            <span className="text-blue-600 dark:text-blue-400 underline underline-offset-2">
              browse
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            JPEG · PNG · WebP · HEIC — up to {MAX_FILES} images, {MAX_FILE_MB} MB each
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          capture={false}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
          disabled={uploading || processing}
        />
      </div>

      {/* Validation warning */}
      {validationError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {processing && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
        >
          <Spinner />
          <span>Processing your photos…</span>
        </div>
      )}

      {ocrError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-300"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{ocrError}</span>
          </div>
          {submissionId && (
            <button
              type="button"
              onClick={() => startProcessing(submissionId)}
              disabled={uploading || processing}
              className="self-start rounded-md bg-red-700 px-3 py-1.5 font-medium text-white hover:bg-red-800 disabled:opacity-60"
            >
              Retry OCR
            </button>
          )}
        </div>
      )}

      {/* Image preview grid */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {previews.length} photo{previews.length !== 1 ? "s" : ""} selected
            </p>
            <button
              type="button"
              onClick={clearAll}
              disabled={uploading || processing}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-40"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {previews.map((p, i) => (
              <PreviewTile
                key={p.url}
                preview={p}
                index={i}
                onRemove={removeFile}
                disabled={uploading || processing}
              />
            ))}

            {/* Add more button (inline in grid) */}
            {previews.length < MAX_FILES && (
              <button
                type="button"
                disabled={uploading || processing}
                onClick={() => inputRef.current?.click()}
                className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500 dark:border-gray-600 dark:text-gray-500 disabled:opacity-40"
                title="Add more photos"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Upload button */}
          {!submissionId && (
            <>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || processing || !files.length}
                className={[
                  "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5",
                  "text-sm font-medium text-white transition-colors",
                  uploading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
                  "disabled:opacity-60",
                ].join(" ")}
              >
                {uploading ? (
                  <>
                    <Spinner />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload {files.length} photo{files.length !== 1 ? "s" : ""} for OCR
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                You will be taken to the OCR review page when processing completes.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function PreviewTile({ preview, index, onRemove, disabled }) {
  return (
    <div className="group relative aspect-square">
      <img
        src={preview.url}
        alt={preview.name}
        className="h-full w-full rounded-lg object-cover"
        loading="lazy"
      />
      {/* Overlay with filename on hover */}
      <div className="absolute inset-0 flex items-end rounded-lg bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate px-1.5 pb-1 text-[10px] text-white">
          {preview.name}
        </p>
      </div>
      {/* Remove button */}
      {!disabled && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(index); }}
          className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
          title="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
      />
    </svg>
  );
}