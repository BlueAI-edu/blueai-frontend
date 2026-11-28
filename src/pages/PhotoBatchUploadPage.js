/**
 * pages/PhotoBatchUploadPage.jsx
 *
 * Route: /teacher/photo-batch/upload?assessmentId=<id>
 *
 * Composes PhotoBatchUploader into a single page.
 *
 * Register in your router (alongside your existing lazy routes):
 *
 *   const PhotoBatchUploadPage = React.lazy(() =>
 *     import("@/pages/PhotoBatchUploadPage")
 *   );
 *
 *   <Route
 *     path="/teacher/photo-batch/upload"
 *     element={<PhotoBatchUploadPage />}
 *   />
 *
 */

import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";

import PhotoBatchUploader from "@/components/PhotoBatchUploader";

export default function PhotoBatchUploadPage() {
  const [searchParams]  = useSearchParams();
  const assessmentId    = searchParams.get("assessmentId");

  const [uploadError, setUploadError] = useState(null);

  // ── guard ─────────────────────────────────────────────────────────────────

  if (!assessmentId) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">
        <p className="font-medium">Missing assessment</p>
        <p className="mt-1">
          This page requires an <code>?assessmentId=</code> query parameter.
        </p>
        <Link
          to="/teacher/assessments"
          className="mt-3 inline-block text-blue-600 underline dark:text-blue-400"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to assessments
        </Link>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Back link */}
      <Link
        to={`/teacher/assessments/${assessmentId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to assessment
      </Link>

      {/* Page heading */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
          <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Upload photo exam scripts
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Photograph each exam page and upload them here. You will be taken to
            the OCR review page when processing completes.
          </p>
        </div>
      </div>

      {/* Quality notice */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/30 dark:bg-amber-900/20 dark:text-amber-300">
        <p className="font-medium">Tips for best OCR quality</p>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs">
          <li>Lay pages flat — avoid curved or folded corners</li>
          <li>Use good lighting; avoid flash glare on the page</li>
          <li>Keep the camera directly above, parallel to the paper</li>
          <li>One page per photo — don't overlap scripts</li>
        </ul>
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">
          {uploadError}
        </div>
      )}

      <PhotoBatchUploader
        assessmentId={assessmentId}
        onError={setUploadError}
      />
    </div>
  );
}