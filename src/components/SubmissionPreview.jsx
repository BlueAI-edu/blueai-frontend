import { useEffect, useState } from "react";
import { API_URL } from "@/config";

function getSelectionText(selection) {
  if (!selection) return "";

  const options = Array.isArray(selection)
    ? selection
    : selection.options || [];

  const selected = options
    .filter((option) => option.state === "selected")
    .map((option) => option.label || option.text)
    .filter(Boolean);

  const ambiguous = options
    .filter((option) => option.state === "ambiguous")
    .map((option) => option.label || option.text)
    .filter(Boolean);

  return [
    selected.length ? `Selected: ${selected.join(", ")}` : "",
    ambiguous.length ? `Ambiguous: ${ambiguous.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function getPageAnswerText(page) {
  if (page.approved_ocr_text) {
    return page.approved_ocr_text;
  }

  if (page.vision_responses?.length > 0) {
    return page.vision_responses
      .map((response) => {
        const parts = [
          response.answer_text,
          response.working_text,
          getSelectionText(response.selection),
        ].filter(Boolean);

        const text = parts.join("\n\n");

        return text
          ? `[Q${response.question_ref || ""}] ${text}`
          : "";
      })
      .filter(Boolean)
      .join("\n\n");
  }

  return page.raw_ocr_text || "";
}

export default function SubmissionPreview({ submissionId, isOpen }) {
  const [pages, setPages] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isOpen || !submissionId) {
      return;
    }

    // Reuse successfully fetched pages unless explicitly retrying.
    if (pages !== null && retryCount === 0) {
      return;
    }

    const controller = new AbortController();

    const loadPreview = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/ocr/submissions/${submissionId}`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load this submission. Please try again."
          );
        }

        const data = await response.json();

        const normalizedPages = (data.pages || []).map((page) => ({
          ...page,
          page_type:
            page.page_type ||
            page.page_classification?.page_type ||
            "unknown",
        }));

        setPages(normalizedPages);
        setSelectedPageIndex(0);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.message ||
              "An unexpected error occurred while loading the preview."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRetryCount(0);
        }
      }
    };

    loadPreview();

    return () => {
      controller.abort();
    };
  }, [isOpen, submissionId, pages, retryCount]);

  // Reset the displayed data when the component switches submissions.
  useEffect(() => {
    setPages(null);
    setError("");
    setSelectedPageIndex(0);
    setRetryCount(0);
  }, [submissionId]);

  if (!isOpen) {
    return null;
  }

  const selectedPage =
    pages?.length > 0
      ? pages[selectedPageIndex] || pages[0]
      : null;

  const answerText = selectedPage
    ? getPageAnswerText(selectedPage)
    : "";

  return (
    <div className="space-y-4 pt-2">
      {loading && (
        <p className="text-sm text-slate-500">
          Loading script preview…
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => {
              setPages(null);
              setError("");
              setRetryCount((count) => count + 1);
            }}
            className="mt-2 text-sm font-medium text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {pages?.length === 0 && !loading && (
        <p className="text-sm text-slate-500">
          No script pages are available for preview.
        </p>
      )}

      {pages?.length > 0 && selectedPage && (
        <>
          {/* Page selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-medium text-slate-600">
              Page
            </span>

            {pages.map((page, index) => (
              <button
                key={page.page_id || page.page_number}
                type="button"
                onClick={() => setSelectedPageIndex(index)}
                aria-label={`View page ${page.page_number}`}
                aria-pressed={selectedPageIndex === index}
                className={`flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors ${
                  selectedPageIndex === index
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {page.page_number}
              </button>
            ))}
          </div>

          {/* Selected page */}
          <section
            key={selectedPage.page_id || selectedPage.page_number}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Original script */}
              <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <h5 className="text-sm font-medium text-slate-700">
                    Original Script — Page {selectedPage.page_number}
                  </h5>
                </div>

                <div className="flex min-h-[200px] items-center justify-center bg-slate-50 p-2">
                  <img
                    src={`${API_URL}/api/ocr/submissions/${submissionId}/image/${selectedPage.page_number}`}
                    alt={`Original script, page ${selectedPage.page_number}`}
                    className="max-h-[500px] max-w-full object-contain"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Extracted response */}
              <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <h5 className="text-sm font-medium text-slate-700">
                    Extracted Response
                  </h5>

                  {selectedPage.is_approved && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      Approved
                    </span>
                  )}
                </div>

                <div className="min-h-[200px] p-3">
                  {answerText ? (
                    <pre className="whitespace-pre-wrap break-words font-sans text-sm text-slate-700">
                      {answerText}
                    </pre>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No extracted response is available for this page yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
