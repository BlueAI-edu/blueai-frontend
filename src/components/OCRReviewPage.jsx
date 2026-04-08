import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "@/config";
import { useAsync } from "../hooks/use-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { transformLegacyPage } from "@/utils/ocrHelpers";

export default function OCRReviewPage() {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [question, setQuestion] = useState(null);
  const [pages, setPages] = useState([]);
  const [combinedStudentAnswerText, setCombinedStudentAnswerText] = useState("");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [editedText, setEditedText] = useState("");
  const [loading, setLoading] = useState(true);
  const [runSave, saving] = useAsync();
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  useEffect(() => {
    if (pages.length > 0) {
      setEditedText(getStudentAnswerText(pages[currentPageIndex]));
    }
  }, [currentPageIndex, pages]);

  const QUESTION_BLOCK_TYPES = new Set(["question", "sub_question", "heading"]);
  const ANSWER_BLOCK_TYPES = new Set([
    "answer",
    "working",
    "bullet_point",
    "table",
    "diagram",
    "other",
    "text",
  ]);

  const getQuestionBlocks = (page) =>
    (page?.blocks || []).filter((block) => QUESTION_BLOCK_TYPES.has(block.block_type));

  const getAnswerBlocks = (page) =>
    (page?.blocks || []).filter((block) => ANSWER_BLOCK_TYPES.has(block.block_type));

  const getPreferredAnswerBlocks = (page) => {
    const answerBlocks = getAnswerBlocks(page);
    const handwrittenAnswerBlocks = answerBlocks.filter(
      (block) => block.is_handwritten,
    );

    if (handwrittenAnswerBlocks.length > 0) {
      return handwrittenAnswerBlocks;
    }

    return answerBlocks.filter(
      (block) => block.block_type !== "diagram" && block.block_type !== "table",
    );
  };

  const getQuestionTextFromOCR = (page) =>
    getQuestionBlocks(page)
      .map((block) => block.text)
      .filter(Boolean)
      .join("\n\n");

  const getStudentAnswerText = (page) => {
    const answerBlocks = getPreferredAnswerBlocks(page);
    if (answerBlocks.length > 0) {
      return answerBlocks.map((block) => block.text || "").join("\n\n");
    }

    return page?.approved_ocr_text || page?.raw_ocr_text || "";
  };

  const buildCombinedStudentAnswer = (normalizedPages) =>
    normalizedPages
      .map((page) => page.approved_ocr_text || getStudentAnswerText(page))
      .filter((text) => text && text.trim())
      .join("\n\n");

  const fetchQuestionContext = async (assessmentId) => {
    const assessmentResponse = await fetch(`${API_URL}/api/teacher/assessments`, {
      credentials: "include",
    });
    if (!assessmentResponse.ok) {
      return;
    }

    const assessments = await assessmentResponse.json();
    const foundAssessment = assessments.find((assessment) => assessment.id === assessmentId);
    if (!foundAssessment?.question_id) {
      return;
    }

    const questionResponse = await fetch(`${API_URL}/api/teacher/questions`, {
      credentials: "include",
    });
    if (!questionResponse.ok) {
      return;
    }

    const questions = await questionResponse.json();
    const foundQuestion = questions.find(
      (candidate) => candidate.id === foundAssessment.question_id,
    );
    setQuestion(foundQuestion || null);
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
      const normalizedPages = (data.pages || []).map(transformLegacyPage);

      setSubmission(data.submission);
      setQuestion(null);
      setPages(normalizedPages);
      setCombinedStudentAnswerText(
        data.combined_student_answer_text || buildCombinedStudentAnswer(normalizedPages),
      );

      if (normalizedPages.length > 0) {
        setEditedText(getStudentAnswerText(normalizedPages[0]));
      }

      if (data.submission?.assessment_id) {
        await fetchQuestionContext(data.submission.assessment_id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePage = () => {
    setError("");
    setSuccessMessage("");

    return runSave(
      async () => {
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
        setCombinedStudentAnswerText(buildCombinedStudentAnswer(updatedPages));
        setSuccessMessage("Page saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      },
      (err) => {
        setError(err.message);
      },
    );
  };

  const handleApproveAll = () => {
    setError("");

    return runSave(
      async () => {
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

        navigate(`/teacher/ocr-moderate/${submissionId}`);
      },
      (err) => {
        setError(err.message);
      },
    );
  };

  const handleRerunOCR = () => {
    setError("");

    return runSave(
      async () => {
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
        setSuccessMessage("OCR re-processed successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      },
      (err) => {
        setError(err.message);
      },
    );
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
  const questionText = question?.question_text || getQuestionTextFromOCR(currentPage);
  const studentAnswerText = getStudentAnswerText(currentPage);

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
                ← Back
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

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-emerald-700 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

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
                  ← Previous
                </Button>
                <span className="text-sm font-medium text-slate-700">
                  Page {currentPage?.page_number || currentPageIndex + 1} of {pages.length}
                </span>
                <Button
                  onClick={() =>
                    setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))
                  }
                  disabled={currentPageIndex === pages.length - 1}
                  variant="outline"
                >
                  Next →
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {pages.map((page, index) => (
                  <button
                    key={page.page_id || page.page_number || index}
                    onClick={() => setCurrentPageIndex(index)}
                    className={[
                      "w-8 h-8 rounded-full text-xs font-medium transition-all",
                      index === currentPageIndex
                        ? "bg-blue-600 text-white ring-2 ring-blue-300"
                        : page.is_approved
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    ].join(" ")}
                  >
                    {page.page_number || index + 1}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-blue-200 bg-blue-50/40">
          <CardHeader>
            <CardTitle>Question</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">
              {questionText || "Question text not available for this submission."}
            </pre>
          </CardContent>
        </Card>

        {pages.length > 1 && (
          <Card className="mb-6 border-slate-200">
            <CardHeader>
              <CardTitle>Combined Student Answer</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
                {combinedStudentAnswerText || "Student answer not detected yet."}
              </pre>
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
                    ✓ Approved
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
                  {saving ? "Saving..." : "Save & Approve Page"}
                </Button>
                <Button onClick={handleRerunOCR} disabled={saving} variant="outline">
                  Re-run OCR
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

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
                {saving ? "Processing..." : "Approve All & Mark"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
