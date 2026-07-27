import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getPageTypeLabel,
  isPageSkipped,
  isPageFailed,
  getFailedPageCount,
  getPageTypeColor,
  getReviewRequiredCount,
} from "@/utils/ocrHelpers";

const VISUAL_RESPONSE_TYPES = new Set([
  "graph_reading",
  "graph_plotting_line_drawing",
  "labelled_diagram",
  "mixed_format",
  "table_completion",
]);

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
  const [reExtracting, setReExtracting] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  useEffect(() => {
    if (pages.length > 0) {
      const page = pages[currentPageIndex];
      setEditedText(getPageAnswerText(page));
    }
  }, [currentPageIndex, pages]);

  const getSelectionPreview = (selection) => {
    const selected = [];
    const ambiguous = [];

    (selection?.options || []).forEach((option) => {
      const label = (option?.label || option?.text || "").trim();
      if (!label) return;
      if (option.state === "selected") selected.push(label);
      if (option.state === "ambiguous") ambiguous.push(label);
    });

    const parts = [];
    if (selected.length > 0) parts.push(`Selected: ${selected.join("; ")}`);
    if (ambiguous.length > 0) parts.push(`Ambiguous: ${ambiguous.join("; ")}`);
    return parts.join("\n");
  };

  const getListTexts = (items) => {
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => {
        if (typeof item === "string") return item.trim();
        return (item?.text || item?.label || item?.kind || "").trim();
      })
      .filter(Boolean);
  };

  const getVisualResponsePreview = (response) => {
    const parts = [];

    if (response?.diagram) {
      const labels = getListTexts(response.diagram.labels);
      const annotations = getListTexts(response.diagram.annotations);
      if (labels.length > 0) parts.push(`Diagram labels: ${labels.join("; ")}`);
      if (annotations.length > 0) {
        parts.push(`Diagram annotations: ${annotations.join("; ")}`);
      }
      if (labels.length === 0 && annotations.length === 0) {
        parts.push("Diagram response region preserved");
      }
    }

    if (response?.graph) {
      const points = Array.isArray(response.graph.points) ? response.graph.points : [];
      const lines = Array.isArray(response.graph.drawn_lines)
        ? response.graph.drawn_lines
        : [];
      const markings = getListTexts(response.graph.markings);
      if (points.length > 0) parts.push(`Graph points detected: ${points.length}`);
      if (lines.length > 0) {
        const lineKinds = getListTexts(lines);
        parts.push(
          `Graph lines/curves detected: ${
            lineKinds.length > 0 ? lineKinds.join("; ") : lines.length
          }`,
        );
      }
      if (markings.length > 0) parts.push(`Graph markings: ${markings.join("; ")}`);
      if (points.length === 0 && lines.length === 0 && markings.length === 0) {
        parts.push("Graph response region preserved");
      }
    }

    if (response?.table) {
      const rows = Array.isArray(response.table.rows) ? response.table.rows : [];
      const cells = Array.isArray(response.table.cells) ? response.table.cells : [];
      if (rows.length > 0 || cells.length > 0) {
        parts.push(`Table entries detected: ${cells.length || rows.length}`);
      } else {
        parts.push("Table response structure preserved");
      }
    }

    if (parts.length === 0 && response?.visual_region_refs?.length > 0) {
      parts.push("Visual response region preserved");
    }

    return parts.join("\n");
  };

  const getResponseBlockPreview = (responseBlock) => {
    const componentPreviews = responseBlock?.structured_response?.components
      ?.map((component) =>
        [getSelectionPreview(component.selection), getVisualResponsePreview(component)]
          .filter(Boolean)
          .join("\n"),
      )
      .filter(Boolean);
    const previewParts = [];
    if (responseBlock?.extracted_text?.trim()) {
      previewParts.push(responseBlock.extracted_text.trim());
    }
    if (componentPreviews?.length > 0) {
      previewParts.push(componentPreviews.join("\n"));
    }
    return previewParts.join("\n") || "(empty)";
  };

  const getPageAnswerText = (page) => {
    if (page?.approved_ocr_text) return page.approved_ocr_text;
    if (page?.vision_responses?.length > 0) {
      return page.vision_responses
        .map((r) => {
          const parts = [];
          if (r.answer_text?.trim()) parts.push(r.answer_text.trim());
          if (r.working_text?.trim()) parts.push(r.working_text.trim());
          const selectionPreview = getSelectionPreview(r.selection);
          if (selectionPreview) parts.push(selectionPreview);
          const visualPreview = getVisualResponsePreview(r);
          if (visualPreview) parts.push(visualPreview);
          if (parts.length === 0) return "";
          return `[Q${r.question_ref || ""}] ${parts.join("\n\n")}`;
        })
        .filter(Boolean)
        .join("\n\n");
    }
    return page?.raw_ocr_text || "";
  };

  const isVisualResponse = (response) =>
    VISUAL_RESPONSE_TYPES.has(response?.response_type) ||
    Boolean(response?.diagram || response?.graph || response?.table) ||
    response?.visual_region_refs?.length > 0;

  const getNormalizedRegion = (response) => {
    const region = response?.response_region || response?.bbox;
    if (region?.width && region?.height) return region;

    const visualRef = response?.visual_region_refs?.find(
      (ref) => ref?.bbox?.width && ref?.bbox?.height,
    );
    if (visualRef) return visualRef.bbox;

    const sourceRegion = response?.source_regions?.find(
      (ref) => ref?.bbox?.width && ref?.bbox?.height,
    );
    return sourceRegion?.bbox || null;
  };

  const getVisualResponsesForPage = (page) =>
    (page?.vision_responses || [])
      .filter(isVisualResponse)
      .map((response) => ({
        response,
        region: getNormalizedRegion(response),
        preview: getVisualResponsePreview(response),
      }));

  const RegionImagePreview = ({ pageNumber, region, label }) => {
    const imageUrl = `${API_URL}/api/ocr/submissions/${submissionId}/image/${pageNumber}`;

    if (!region) {
      return (
        <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
          <img src={imageUrl} alt={label} className="w-full max-h-48 object-contain" />
        </div>
      );
    }

    const x = Math.max(0, Math.min(1, Number(region.x) || 0));
    const y = Math.max(0, Math.min(1, Number(region.y) || 0));
    const width = Math.max(0.01, Math.min(1 - x, Number(region.width) || 1));
    const height = Math.max(0.01, Math.min(1 - y, Number(region.height) || 1));

    return (
      <div
        className="relative w-full overflow-hidden rounded-md border border-slate-200 bg-white"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <img
          src={imageUrl}
          alt={label}
          className="absolute max-w-none object-fill"
          style={{
            left: `${-(x / width) * 100}%`,
            top: `${-(y / height) * 100}%`,
            width: `${100 / width}%`,
            height: `${100 / height}%`,
          }}
        />
      </div>
    );
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

  const handleReExtractPage = async () => {
    const currentPage = pages[currentPageIndex];
    setReExtracting(true);
    try {
      const response = await fetch(
        `${API_URL}/api/ocr/pages/${submissionId}/${currentPage.page_number}/reextract`,
        {
          method: "POST",
          headers: { "X-Requested-With": "XMLHttpRequest" },
          credentials: "include",
        },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to re-extract page");
      }

      const data = await response.json();

      // Patch only the current page in state — no full reload needed
      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = {
        ...updatedPages[currentPageIndex],
        ...data.page,
        page_type: data.page_type,
      };
      setPages(updatedPages);
      setResponseBlocks(data.response_blocks || []);
      setEditedText(getPageAnswerText(data.page));

      const found = data.responses_found ?? 0;
      toast({
        title: found > 0 ? "Answers extracted" : "No answers found",
        description:
          found > 0
            ? `Found ${found} response${found !== 1 ? "s" : ""} on this page.`
            : "We couldn't find student answers on this page. You can type them in manually.",
        variant: found > 0 ? "default" : "destructive",
      });
    } catch (err) {
      toast({ title: "Re-extract failed", description: err.message, variant: "destructive" });
    } finally {
      setReExtracting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading submission...</p>
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
  const currentPageFailed = isPageFailed(currentPageType);
  const visualResponses = getVisualResponsesForPage(currentPage);
  // Always derived live from `pages` state (not a stored submission field)
  // so it stays correct immediately after a single-page re-extract patches
  // page_type in place, without needing a full re-fetch.
  const failedPageCount = getFailedPageCount(pages);

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
                <h1 className="text-2xl font-bold text-slate-900">Review Extracted Answers</h1>
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
              {failedPageCount > 0 && (
                <Badge className="bg-red-100 text-red-700 border-red-300 border animate-pulse">
                  &#9888; {failedPageCount} {failedPageCount === 1 ? "page" : "pages"} need attention
                </Badge>
              )}
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
                    const failed = isPageFailed(page.page_type);
                    items.push(
                      <button
                        key={page.page_id || page.page_number || pageIdx}
                        onClick={() => setCurrentPageIndex(pageIdx)}
                        title={
                          failed
                            ? `Page ${pageIdx + 1}: OCR failed — needs attention`
                            : getPageTypeLabel(page.page_type) || `Page ${pageIdx + 1}`
                        }
                        className={[
                          "w-8 h-8 rounded-full text-xs font-medium transition-all",
                          failed
                            // Deliberately NOT dimmed/line-through like skipped pages —
                            // a failed page must stand out in the strip, not recede.
                            ? pageIdx === current
                              ? "bg-red-600 text-white ring-2 ring-red-300"
                              : "bg-red-100 text-red-700 ring-1 ring-red-400 hover:bg-red-200 animate-pulse"
                            : skipped
                              ? "bg-gray-200 text-gray-400 line-through"
                              : pageIdx === current
                                ? "bg-blue-600 text-white ring-2 ring-blue-300"
                                : page.is_approved
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                        ].join(" ")}
                      >
                        {failed ? "!" : pageIdx + 1}
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
          <Card className={`mb-6 ${currentPageFailed ? "border-red-300" : ""}`}>
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
              {currentPageFailed && (
                <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm font-semibold text-red-800">
                    &#9888; Automatic text extraction failed on this page
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    {currentPage?.ocr_error
                      ? `Reason: ${currentPage.ocr_error}`
                      : "The AI could not process this page — this is usually a temporary issue."}
                    {" "}The student's answer on this page has <strong>not</strong> been marked yet.
                  </p>
                  <p className="mt-2 text-sm text-red-700">
                    Click <strong>Re-extract</strong> below to try again, or type the
                    student's answer into the box on the right yourself.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Original Script</CardTitle>
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
                <CardTitle>Extracted Response</CardTitle>
                {currentPage?.is_approved && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                    &#10003; Approved
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {visualResponses.length > 0 && (
                <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">
                      Visual response evidence
                    </p>
                    <Badge variant="secondary">{visualResponses.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {visualResponses.map(({ response, region, preview }, index) => (
                      <div
                        key={`${response.question_ref || "visual"}-${index}`}
                        className="rounded-md bg-white p-2 border border-slate-200"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-700">
                            Q{response.question_ref || "?"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {response.response_type?.replaceAll("_", " ")}
                          </span>
                        </div>
                        <RegionImagePreview
                          pageNumber={currentPage?.page_number}
                          region={region}
                          label={`Visual response for question ${response.question_ref || ""}`}
                        />
                        {preview && (
                          <p className="mt-2 whitespace-pre-line text-xs text-slate-500">
                            {preview}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className={[
                  "w-full h-[500px] p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none",
                  currentPageFailed ? "border-red-300 bg-red-50/30" : "border-slate-300",
                ].join(" ")}
                placeholder={
                  currentPageFailed
                    ? "OCR failed on this page — type the student's answer here, or click Re-extract above to try again."
                    : "Edit the student's answer here..."
                }
              />

              <div className="mt-4 flex gap-3">
                <Button onClick={handleSavePage} disabled={saving || reExtracting} className="flex-1">
                  {saving && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {saving ? "Saving..." : "Save & Approve Page"}
                </Button>
                <Button
                  onClick={handleReExtractPage}
                  disabled={saving || reExtracting}
                  variant={currentPageFailed ? undefined : "outline"}
                  className={
                    currentPageFailed
                      ? "bg-red-600 text-white hover:bg-red-700 gap-1.5"
                      : "border-amber-500 text-amber-700 hover:bg-amber-50 gap-1.5"
                  }
                  title="Re-run GPT-4o extraction on this page only"
                >
                  {reExtracting ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {reExtracting ? "Re-extracting..." : "Re-extract"}
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Use <span className="font-medium text-amber-600">Re-extract</span> if the extracted text looks incorrect.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Response Blocks Summary */}
        {responseBlocks.length > 0 && (
          <Card className="mt-6 border-indigo-200 bg-indigo-50/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Question-Level Answers
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
                      {getResponseBlockPreview(rb)}
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
                <h3 className="text-lg font-semibold text-slate-900">Ready to Send to Marking?</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Review each extracted answer, then approve all and continue to AI marking.
                </p>
              </div>
              <Button onClick={handleApproveAll} disabled={saving} size="lg">
                {saving && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {saving ? "Processing..." : "Approve & Send to Marking"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
