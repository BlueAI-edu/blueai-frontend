import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getPageTypeLabel,
  isPageSkipped,
  getPageTypeColor,
  getReviewRequiredCount,
} from "@/utils/ocrHelpers";

export default function OCRReviewPage() {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  const { toast } = useToast();
  const [submission, setSubmission] = useState(null);
  const [pages, setPages] = useState([]);
  const [responseBlocks, setResponseBlocks] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [editedText, setEditedText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  useEffect(() => {
    if (pages.length > 0) {
      const page = pages[currentPageIndex];
      setEditedText(getPageAnswerText(page));
    }
  }, [currentPageIndex, pages]);

  const getPageAnswerText = (page) => {
    if (page?.approved_ocr_text) return page.approved_ocr_text;
    if (page?.vision_responses?.length > 0) {
      return page.vision_responses
        .map((r) => {
          const parts = [];
          if (r.answer_text?.trim()) parts.push(r.answer_text.trim());
          if (r.working_text?.trim()) parts.push(r.working_text.trim());
          return parts.join("\n\n");
        })
        .filter(Boolean)
        .join("\n\n");
    }
    return page?.raw_ocr_text || "";
  };

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ocr/submissions/${submissionId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch submission");
      }

      const data = await response.json();
      const normalizedPages = (data.pages || []).map((page) => ({
        ...page,
        page_type: page.page_type || page.page_classification?.page_type || "unknown",
      }));

      setSubmission(data.submission);
      setPages(normalizedPages);
      setResponseBlocks(data.response_blocks || []);

      if (normalizedPages.length > 0) {
        setEditedText(getPageAnswerText(normalizedPages[0]));
      }
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePage = async () => {
    setSaving(true);
    try {
      const currentPage = pages[currentPageIndex];
      const response = await fetch(
        `${API_URL}/api/ocr/pages/${submissionId}/${currentPage.page_number}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          credentials: "include",
          body: JSON.stringify({
            approved_ocr_text: editedText,
            is_approved: true,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save page");
      }

      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = {
        ...updatedPages[currentPageIndex],
        approved_ocr_text: editedText,
        is_approved: true,
      };

      setPages(updatedPages);
      toast({ title: "Saved", description: "Page saved and approved." });
    } catch (err) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAll = async () => {
    setSaving(true);
    try {
      await handleSavePage();

      const approveResponse = await fetch(
        `${API_URL}/api/ocr/submissions/${submissionId}/approve`,
        {
          method: "POST",
          headers: { "X-Requested-With": "XMLHttpRequest" },
          credentials: "include",
        },
      );

      if (!approveResponse.ok) {
        throw new Error("Failed to approve submission");
      }

      const markResponse = await fetch(
        `${API_URL}/api/ocr/submissions/${submissionId}/mark`,
        {
          method: "POST",
          headers: { "X-Requested-With": "XMLHttpRequest" },
          credentials: "include",
        },
      );

      if (!markResponse.ok) {
        throw new Error("Failed to mark submission");
      }

      toast({ title: "Approved", description: "Submission approved and marked. Redirecting..." });
      navigate(`/teacher/ocr-moderate/${submissionId}`);
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRerunOCR = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `${API_URL}/api/ocr/submissions/${submissionId}/process`,
        {
          method: "POST",
          headers: { "X-Requested-With": "XMLHttpRequest" },
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to re-run OCR");
      }

      await fetchSubmission();
      toast({ title: "Re-processed", description: "OCR re-processed successfully." });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading OCR submission...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Submission not found</p>
        </div>
      </div>
    );
  }

  const currentPage = pages[currentPageIndex];
  const currentPageType = currentPage?.page_type;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/teacher/dashboard")}
                variant="ghost"
                className="text-slate-600"
              >
                &larr; Back
              </Button>
              <div className="h-6 w-px bg-slate-300" />
              <h1 className="text-2xl font-bold text-slate-900">Review Student Answer</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600">
                Student:{" "}
                <span className="font-medium text-slate-900">
                  {submission.student_name}
                </span>
              </div>
              <Badge variant="secondary">
                {pages.length} {pages.length === 1 ? "page" : "pages"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                  disabled={currentPageIndex === 0}
                  variant="outline"
                >
                  &larr; Previous
                </Button>
                <span className="text-sm font-medium text-slate-700">
                  Page {currentPageIndex + 1} of {pages.length}
                </span>
                <Button
                  onClick={() =>
                    setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))
                  }
                  disabled={currentPageIndex === pages.length - 1}
                  variant="outline"
                >
                  Next &rarr;
                </Button>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {(() => {
                  const total = pages.length;
                  const current = currentPageIndex;
                  const SIBLING_COUNT = 2;

                  // Build the set of page indices to show
                  const pageIndices = new Set();
                  // Always show first and last
                  pageIndices.add(0);
                  pageIndices.add(total - 1);
                  // Show window around current
                  for (let i = current - SIBLING_COUNT; i <= current + SIBLING_COUNT; i++) {
                    if (i >= 0 && i < total) pageIndices.add(i);
                  }

                  const sorted = [...pageIndices].sort((a, b) => a - b);
                  const items = [];

                  sorted.forEach((pageIdx, i) => {
                    // Insert ellipsis if there's a gap
                    if (i > 0 && pageIdx - sorted[i - 1] > 1) {
                      items.push(
                        <span key={`ellipsis-${pageIdx}`} className="w-6 text-center text-slate-400 text-xs">
                          &hellip;
                        </span>
                      );
                    }

                    const page = pages[pageIdx];
                    const skipped = isPageSkipped(page.page_type);
                    items.push(
                      <button
                        key={page.page_id || page.page_number || pageIdx}
                        onClick={() => setCurrentPageIndex(pageIdx)}
                        title={getPageTypeLabel(page.page_type) || `Page ${pageIdx + 1}`}
                        className={[
                          "w-8 h-8 rounded-full text-xs font-medium transition-all",
                          skipped
                            ? "bg-gray-200 text-gray-400 line-through"
                            : pageIdx === current
                              ? "bg-blue-600 text-white ring-2 ring-blue-300"
                              : page.is_approved
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                        ].join(" ")}
                      >
                        {pageIdx + 1}
                      </button>
                    );
                  });

                  return items;
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Page Classification Info */}
        {currentPageType && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                {(() => {
                  const colors = getPageTypeColor(currentPageType);
                  return (
                    <Badge className={`${colors?.bg || ''} ${colors?.text || ''} ${colors?.border || ''} border`}>
                      {getPageTypeLabel(currentPageType)}
                    </Badge>
                  );
                })()}
                {isPageSkipped(currentPageType) && (
                  <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                    Skipped for marking
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Scanned Page</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <div className="flex items-center justify-center min-h-[400px]">
                  <img
                    key={currentPage?.page_id || currentPage?.page_number}
                    src={`${API_URL}/api/ocr/submissions/${submissionId}/image/${currentPage?.page_number}`}
                    alt={`Page ${currentPage?.page_number}`}
                    className="max-w-full max-h-[600px] object-contain"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Student Answer</CardTitle>
                {currentPage?.is_approved && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                    &#10003; Approved
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-[500px] p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                placeholder="Edit the student's answer here..."
              />

              <div className="mt-4 flex gap-3">
                <Button onClick={handleSavePage} disabled={saving} className="flex-1">
                  {saving && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {saving ? "Saving..." : "Save & Approve Page"}
                </Button>
                <Button onClick={handleRerunOCR} disabled={saving} variant="outline">
                  {saving ? "Processing..." : "Re-run OCR"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Blocks Summary */}
        {responseBlocks.length > 0 && (
          <Card className="mt-6 border-indigo-200 bg-indigo-50/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Question-Level Extraction
                <Badge variant="secondary">{responseBlocks.length} blocks</Badge>
                {getReviewRequiredCount(responseBlocks) > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {getReviewRequiredCount(responseBlocks)} need review
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {responseBlocks.map((rb) => (
                  <div
                    key={rb.block_id}
                    className={`p-3 rounded-lg border text-sm ${
                      rb.review_required
                        ? "border-amber-300 bg-amber-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">
                        Q{rb.question_ref}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          OCR: {Math.round(rb.ocr_confidence * 100)}%
                        </span>
                        <span className="text-xs text-slate-500">
                          Seg: {Math.round(rb.segmentation_confidence * 100)}%
                        </span>
                        {rb.review_required && (
                          <Badge variant="destructive" className="text-xs">
                            Review
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 font-mono">
                      {rb.extracted_text || "(empty)"}
                    </p>
                    {rb.source_pages?.length > 1 && (
                      <p className="text-xs text-slate-400 mt-1">
                        Pages: {rb.source_pages.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Ready to Mark?</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Review each page answer, then approve everything and continue to marking.
                </p>
              </div>
              <Button onClick={handleApproveAll} disabled={saving} size="lg">
                {saving && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {saving ? "Processing..." : "Approve All & Mark"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
