import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_URL } from '@/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';
import { ChevronDown } from 'lucide-react';

// Real submission lifecycle (see routes/ocr_routes.py):
// boundary_detected → ocr_processing → ocr_ready → approved → marked_draft → finalized
const STATUS_META = {
  uploaded:          { label: 'Uploaded',          cls: 'bg-slate-100 text-slate-700' },
  boundary_detected: { label: 'Awaiting confirm',  cls: 'bg-slate-100 text-slate-700' },
  ocr_processing:    { label: 'Extracting',        cls: 'bg-blue-50 text-blue-700' },
  ocr_ready:         { label: 'Extracted',         cls: 'bg-blue-100 text-blue-800' },
  ocr_error:         { label: 'Extraction failed', cls: 'bg-red-100 text-red-800' },
  file_error:        { label: 'File error',        cls: 'bg-red-100 text-red-800' },
  approved:          { label: 'Reviewed',          cls: 'bg-indigo-100 text-indigo-800' },
  marked_draft:      { label: 'Marked',            cls: 'bg-amber-100 text-amber-800' },
  finalized:         { label: 'Finalized',         cls: 'bg-green-100 text-green-800' },
};
const REVIEWED = ['approved', 'marked_draft', 'finalized'];
const REVIEWABLE = ['ocr_ready', ...REVIEWED];
const isReviewed = (s) => REVIEWED.includes(s.status);
const POLL_INTERVAL_MS = 4000;

const feedbackToText = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        return item?.text || item?.feedback || JSON.stringify(item);
      })
      .join('\n');
  }

  return value == null ? '' : String(value);
};

/**
 * Review screen for a bulk class-set upload (#241), shown once a batch
 * reaches status "ready_for_review" (see BulkUploadPage.jsx). Lists each
 * detected chunk with its page range, matched student (or a roster picker if
 * unmatched/needs_review), and a confidence badge. The teacher corrects any
 * mis-detected boundary or wrong match here before "Confirm All" triggers the
 * real handwriting extraction (POST /ocr/batches/{id}/confirm).
 */
export default function BulkUploadReviewPage({ user }) {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [batch, setBatch] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);
  const [edits, setEdits] = useState({}); // submissionId -> {pageStart, pageEnd}
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);
  const [markingResults, setMarkingResults] = useState({});
  const [markingEdits, setMarkingEdits] = useState({});
  const [loadingMarkingId, setLoadingMarkingId] = useState(null);
  const [savingMarkingId, setSavingMarkingId] = useState(null);
  const [reviewedFeedbackIds, setReviewedFeedbackIds] = useState({});
  const [finalizingFeedback, setFinalizingFeedback] = useState(false);

  // Batch + child submissions only — cheap enough to poll. The roster is
  // loaded once by load() below, not on every poll.
  const fetchBatch = useCallback(async (silent = false) => {
    const res = await fetch(`${API_URL}/api/ocr/batches/${batchId}`, { credentials: 'include' });
    if (!res.ok) {
      if (!silent) toast({ title: 'Failed to load batch', variant: 'destructive' });
      return null;
    }
    const data = await res.json();
    setBatch(data.batch);
    setSubmissions(data.submissions || []);
    return data;
  }, [batchId, toast]);

  const load = useCallback(async () => {
    const data = await fetchBatch();
    if (!data) return;
    if (data.batch.class_id) {
      const rosterRes = await fetch(
        `${API_URL}/api/teacher/classes/${data.batch.class_id}/students-dropdown`,
        { credentials: 'include' }
      );
      if (rosterRes.ok) {
        const rosterData = await rosterRes.json();
        setRoster(rosterData.students || []);
      }
    }
    setLoading(false);
    return data.batch;
  }, [fetchBatch]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the badges live while scripts are being extracted or Approve All is
  // sending them to marking in the background.
  const needsPolling =
    batch?.approve_all_status === 'running' ||
    submissions.some((s) => s.status === 'ocr_processing');

  useEffect(() => {
    if (!needsPolling) return undefined;
    const timer = setInterval(() => { fetchBatch(true); }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [needsPolling, fetchBatch]);

  const reviewable = submissions.filter((s) => REVIEWABLE.includes(s.status));
  const reviewedCount = reviewable.filter(isReviewed).length;
  const markedCount = reviewable.filter((s) => ['marked_draft', 'finalized'].includes(s.status)).length;
  const nextUnreviewed = reviewable.find((s) => !isReviewed(s));
  const approvableCount = submissions.filter((s) => s.status === 'ocr_ready').length;
  const approveAllRunning = batch?.approve_all_status === 'running';
  const approveAllFailed = batch?.approve_all_result?.failed || 0;

  const handleReassignStudent = async (submissionId, studentId) => {
    const student = roster.find((s) => s.id === studentId);
    const res = await fetch(`${API_URL}/api/ocr/batches/${batchId}/submissions/${submissionId}/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'include',
      body: JSON.stringify({
        student_id: studentId || null,
        student_name: student ? student.display_name : null,
      }),
    });
    if (!res.ok) {
      toast({ title: 'Failed to reassign student', variant: 'destructive' });
      return;
    }
    await load();
  };

  const handleEditPageRange = (submissionId, field, value) => {
    setEdits((prev) => ({ ...prev, [submissionId]: { ...prev[submissionId], [field]: value } }));
  };

  const handleSavePageRange = async (submissionId) => {
    const edit = edits[submissionId];
    if (!edit) return;
    const body = {};
    if (edit.pageStart !== undefined) body.page_start = parseInt(edit.pageStart, 10);
    if (edit.pageEnd !== undefined) body.page_end = parseInt(edit.pageEnd, 10);
    const res = await fetch(`${API_URL}/api/ocr/batches/${batchId}/submissions/${submissionId}/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast({ title: 'Failed to update page range', description: (await res.json().catch(() => ({}))).detail, variant: 'destructive' });
      return;
    }
    setEdits((prev) => { const next = { ...prev }; delete next[submissionId]; return next; });
    await load();
  };

  const handleConfirmAll = async () => {
    setConfirming(true);
    try {
      const res = await fetch(`${API_URL}/api/ocr/batches/${batchId}/confirm`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to confirm batch');
      await load();
      toast({ title: 'Class set extracted', description: 'The student submissions are ready for individual review.' });
    } catch (err) {
      toast({ title: 'Confirm failed', description: err.message, variant: 'destructive' });
    } finally {
      setConfirming(false);
    }
  };

  // Approve & send to marking every extracted script that is safe to
  // bulk-approve. The backend skips scripts with failed or low-confidence
  // extraction and never re-marks scripts that are already approved/marked.
  const handleApproveAll = async () => {
    const plural = approvableCount !== 1 ? 's' : '';
    const ok = window.confirm(
      `Approve ${approvableCount} script${plural} and send ${approvableCount !== 1 ? 'them' : 'it'} to AI marking?\n\n` +
      'Each script uses one AI marking run from your allowance. Scripts with failed or ' +
      'low-confidence extraction are skipped so you can review them individually.'
    );
    if (!ok) return;

    setApprovingAll(true);
    try {
      const res = await fetch(`${API_URL}/api/ocr/batches/${batchId}/approve-all`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.detail || 'Failed to start Approve All');

      const skippedNote = body.skipped?.length
        ? ` ${body.skipped.length} skipped for individual review.`
        : '';
      toast({
        title: 'Sending to marking',
        description: `${body.queued} script${body.queued !== 1 ? 's' : ''} queued.${skippedNote}`,
      });
      await fetchBatch(true);
    } catch (err) {
      toast({ title: 'Approve All failed', description: err.message, variant: 'destructive' });
    } finally {
      setApprovingAll(false);
    }
  };

  const handleToggleFeedback = async (submissionId, status) => {
    if (expandedSubmissionId === submissionId) {
      setExpandedSubmissionId(null);
      return;
    }

    setExpandedSubmissionId(submissionId);

    if (['marked_draft', 'finalized'].includes(status)) {
      await handleLoadMarkingResult(submissionId);
    }
  };

  const handleDownloadAllFeedback = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/ocr/batches/${batchId}/feedback-zip`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.detail || 'Failed to download feedback PDFs.'
        );
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = `batch_${batchId.slice(0, 8)}_feedback.zip`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: 'Download started',
        description: 'Your feedback ZIP file is being downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error.message || 'Could not download feedback PDFs.',
        variant: 'destructive',
      });
    }
  };

  const handleLoadMarkingResult = async (submissionId) => {
    // Avoid fetching the same result repeatedly.
    if (markingResults[submissionId]) return;

    setLoadingMarkingId(submissionId);

    try {
      const response = await fetch(
        `${API_URL}/api/ocr/submissions/${submissionId}/marking`,
        {
          credentials: 'include',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to load marking results.');
      }

      const result = await response.json();

      setMarkingResults((prev) => ({
        ...prev,
        [submissionId]: result,
      }));

      setMarkingEdits((prev) => ({
        ...prev,
        [submissionId]: {
          total_score: result.total_score ?? 0,
          www: feedbackToText(result.www),
          next_steps: feedbackToText(result.next_steps),
          overall_feedback: feedbackToText(result.overall_feedback),
          per_question_scores: result.question_scores ?? {},
          per_question_feedback: result.per_question_feedback ?? [],
        },
      }));
    } catch (error) {
      toast({
        title: 'Failed to load feedback',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingMarkingId(null);
    }
  };

  const handleSaveMarkingEdits = async (submissionId) => {
    const edits = markingEdits[submissionId];    
    const rawScore = edits?.total_score;
    const score = Number(rawScore);

    const maxMarks = Number(markingResults[submissionId]?.max_marks);
    const hasMaxMarks = Number.isFinite(maxMarks);

    const maxAllowed = hasMaxMarks
      ? Math.min(maxMarks, 1000)
      : 1000;

    const isValidScore =
      rawScore !== '' &&
      rawScore !== null &&
      rawScore !== undefined &&
      Number.isInteger(score) &&
      score >= 0 &&
      score <= maxAllowed;

    if (!isValidScore) {
      toast({
        title: 'Invalid total score',
        description: `Enter a whole number between 0 and ${maxAllowed}.`,
        variant: 'destructive',
      });

      return false;
    }

    if (!edits) return;

    setSavingMarkingId(submissionId);

    try {
      const response = await fetch(
        `${API_URL}/api/ocr/submissions/${submissionId}/moderate`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'include',
          body: JSON.stringify({
            total_score: edits.total_score,
            www: edits.www,
            next_steps: edits.next_steps,
            overall_feedback: edits.overall_feedback,
            per_question_scores: edits.per_question_scores,
            per_question_feedback: edits.per_question_feedback,
          }),
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to save feedback changes.');
      }

      setMarkingResults((prev) => ({
        ...prev,
        [submissionId]: {
          ...prev[submissionId],
          total_score: edits.total_score,
          www: edits.www,
          next_steps: edits.next_steps,
          overall_feedback: edits.overall_feedback,
          question_scores: edits.per_question_scores,
          per_question_feedback: edits.per_question_feedback,
        },
      }));

      toast({
        title: 'Feedback saved',
        description: 'Your changes have been saved.',
      });

      return true;
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive',
      });

      return false;
    } finally {
      setSavingMarkingId(null);
    }
  };

  const handleMarkFeedbackReviewed = (submissionId) => {
    setReviewedFeedbackIds((prev) => ({
      ...prev,
      [submissionId]: true,
    }));

    toast({
      title: 'Feedback marked as reviewed',
      description: 'This draft is now eligible for finalization.',
    });
  };

  
  const handleFinalizeAndDownloadFeedback = async () => {
    const draftsToFinalize = submissions.filter(
      (sub) =>
        sub.status === 'marked_draft' &&
        reviewedFeedbackIds[sub.id] === true
    );

    setFinalizingFeedback(true);

    try {
      // Save edits before finalizing each explicitly reviewed draft.
      for (const sub of draftsToFinalize) {
        const saved = await handleSaveMarkingEdits(sub.id);

        if (!saved) {
          throw new Error(
            `Could not save feedback for ${sub.student_name}. No further drafts were finalized.`
          );
        }

        const response = await fetch(
          `${API_URL}/api/ocr/submissions/${sub.id}/finalize`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
            },
          }
        );

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(
            body.detail ||
              `Failed to finalize feedback for ${sub.student_name}.`
          );
        }
      }

      // Refresh statuses so finalized drafts are reflected on the page.
      await fetchBatch(true);

      // Download the ZIP containing finalized feedback PDFs.
      await handleDownloadAllFeedback();
    } catch (error) {
      toast({
        title: 'Finalization incomplete',
        description: error.message || 'Could not finalize feedback.',
        variant: 'destructive',
      });

      await fetchBatch(true);
    } finally {
      setFinalizingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar user={user} />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500">Loading batch...</div>
      </div>
    );
  }

  const confirmedDone = batch?.status === 'confirmed';
  const needsReviewCount = submissions.filter((s) => s.needs_review && s.status === 'boundary_detected').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar user={user} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Review Class Set Split</h1>
            <p className="text-sm text-slate-600 mt-1">
              {submissions.length} student{submissions.length !== 1 ? 's' : ''} detected across {batch?.total_pages} pages.
              {needsReviewCount > 0 && !confirmedDone && (
                <span className="text-amber-600 font-medium"> 
                  {' '}{needsReviewCount} need{needsReviewCount === 1 ? 's' : ''} your review.
                </span>
              )}
            </p>
            {confirmedDone && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-slate-700">
                  {reviewedCount} of {reviewable.length} reviewed
                </span>
                <div className="h-2 w-40 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${reviewable.length ? (reviewedCount / reviewable.length) * 100 : 0}%` }}
                  />
                </div>
                {nextUnreviewed && (
                  <Button size="sm" onClick={() => navigate(`/teacher/ocr-review/${nextUnreviewed.id}?batch=${batchId}`)}>
                    Continue with next script
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            {!confirmedDone && (
              <Button onClick={handleConfirmAll} disabled={confirming} size="lg" className="w-full sm:w-auto">
                {confirming ? 'Extracting...' : 'Confirm All'}
              </Button>
            )}
            {confirmedDone && approvableCount > 0 && (
              <Button
                onClick={handleApproveAll}
                disabled={approvingAll || approveAllRunning}
                size="lg"
                className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto"
              >
                {approvingAll || approveAllRunning
                  ? 'Sending to marking...'
                  : `Approve All & Send to Marking (${approvableCount})`}
              </Button>
            )}
          </div>

          {batch?.approve_all_status === 'done' &&
            submissions.some((s) => ['marked_draft', 'finalized'].includes(s.status)) && (
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleFinalizeAndDownloadFeedback}
                disabled={finalizingFeedback}
              >
                {finalizingFeedback
                  ? 'Finalizing & Preparing ZIP...'
                  : 'Finalise & Download Feedback (ZIP)'}
              </Button>
            )}
        </div>

        {approveAllRunning && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Marking in progress — {markedCount} of {reviewable.length} marked. You can keep reviewing
            other scripts or leave this page; this batch will be waiting in your dashboard.
          </div>
        )}
        {!approveAllRunning && approveAllFailed > 0 && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {approveAllFailed} script{approveAllFailed !== 1 ? 's' : ''} could not be marked. Open
            {approveAllFailed !== 1 ? ' them' : ' it'} and use Approve &amp; Send to Marking to retry.
          </div>
        )}
          

          <div className="flex items-center justify-center mb-8">
            {/* Step 1 — Prepare */}
            <div className={`flex items-center ${!confirmedDone && !confirming ? 'text-blue-600' : 'text-gray-400'}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  !confirmedDone && !confirming ? 'bg-blue-600 text-white' 
                  : confirmedDone || confirming ? 'bg-green-500 text-white' : 'bg-gray-200'}`
                }>
                {confirmedDone || confirming ? '✓' : '1'}
              </div>

              <span className="ml-2 font-medium">Prepare</span>
            </div>

            {/* Connector */}
            <div className="w-16 h-1 bg-gray-200 mx-2"></div>

            {/* Step 2 — Extract */}
            <div
              className={`flex items-center ${
                confirming
                  ? 'text-blue-600'
                  : confirmedDone
                    ? 'text-gray-400'
                    : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  confirming ? 'bg-blue-600 text-white' : confirmedDone ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}
              >
                {confirmedDone ? '✓' : '2'}
              </div>

              <span className="ml-2 font-medium">Extract</span>
            </div>

            {/* Connector */}
            <div className="w-16 h-1 bg-gray-200 mx-2"></div>

            {/* Step 3 — Review */}
            <div
              className={`flex items-center ${
                confirmedDone ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  confirmedDone
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200'
                }`}
              >
                {confirmedDone ? '✓' : '3'}
              </div>

              <span className="ml-2 font-medium">Review</span>
            </div>
          </div>
        

        <div className="space-y-4">
          {submissions.map((sub) => {
            const edit = edits[sub.id] || {};
            const isPending = sub.status === 'boundary_detected';
            const isExpanded = expandedSubmissionId === sub.id;
            const markingResult = markingResults[sub.id];
            const markingEdit = markingEdits[sub.id];
            const isMarked = ['marked_draft', 'finalized'].includes(sub.status);
            const isFinalized = sub.status === 'finalized';
            const hasReviewedFeedback = reviewedFeedbackIds[sub.id] === true;
            return (
              <Card key={sub.id} className={sub.needs_review && isPending ? 'border-amber-300' : ''}>         
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="min-w-0 text-lg">
                      Pages {sub.page_range?.start}–{sub.page_range?.end} · {sub.student_name}
                    </CardTitle>
                    <div className="flex shrink-0 items-center gap-2">
                      {isPending ? (
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            sub.needs_review
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {sub.needs_review ? 'Needs review': `Confident match (${Math.round((sub.roster_match_score || 0) * 100)}%)`}
                        </span>
                      ) : (() => {
                        const m = STATUS_META[sub.status] || {
                          label: sub.status,
                          cls: 'bg-slate-100 text-slate-700',
                        };
                        return (
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${m.cls}`}>
                            {m.label}
                          </span>
                        );
                      })()}

                      {!isPending && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleToggleFeedback(sub.id, sub.status)}
                        >
                          <ChevronDown
                            className={`ml-1 h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </Button>
                      )}
                    </div>
                  </div>

                  {!isPending && isExpanded && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      {isMarked ? (
                        loadingMarkingId === sub.id ? (
                          <p className="text-sm text-slate-500">
                            Loading marking and feedback...
                          </p>
                        ) : !markingResult ? (
                          <p className="text-sm text-slate-500">
                            Marking results could not be loaded.
                          </p>
                        ) : (
                          <>
                            {Array.isArray(markingResult.review_warnings) &&
                              markingResult.review_warnings.length > 0 && (
                                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                  <p className="mb-2 text-sm font-semibold text-amber-800">
                                    Review warnings
                                  </p>
                                  <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
                                    {markingResult.review_warnings.map((warning, index) => (
                                      <li key={index}>
                                        {typeof warning === 'string'
                                          ? warning
                                          : warning.message || JSON.stringify(warning)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                            <div className="space-y-4">
                              <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                  Total score
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={Math.min(markingResult?.max_marks ?? 1000, 1000)}
                                  step={1}
                                  value={markingEdit?.total_score ?? 0}
                                  disabled={isFinalized}
                                  onChange={(e) =>
                                    setMarkingEdits((prev) => ({
                                      ...prev,
                                      [sub.id]: {
                                        ...prev[sub.id],
                                        total_score:
                                          e.target.value === '' ? '' : Number(e.target.value),
                                      },
                                    }))
                                  }
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                                />
                              </div>

                              {Array.isArray(markingEdit?.per_question_feedback) &&
                                markingEdit.per_question_feedback.length > 0 && (
                                  <div>
                                    <h4 className="mb-2 text-sm font-semibold text-slate-800">
                                      Per-question feedback
                                    </h4>
                                    <div className="space-y-3">
                                      {markingEdit.per_question_feedback.map((item, index) => (
                                        <div
                                          key={item.question_number ?? item.question_id ?? index}
                                          className="rounded-lg border border-slate-200 bg-white p-3"
                                        >
                                          <p className="mb-1 text-sm font-semibold text-slate-700">
                                            Question {item.question_number ?? item.question_id ?? index + 1}
                                            {item.score != null && item.max_marks != null
                                              ? ` — ${item.score}/${item.max_marks}`
                                              : ''}
                                          </p>
                                          <p className="whitespace-pre-wrap text-sm text-slate-600">
                                            {feedbackToText(item.feedback ?? item.text ?? item)}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              {[
                                { key: 'www', label: 'What went well (WWW)' },
                                { key: 'next_steps', label: 'Next steps' },
                                { key: 'overall_feedback', label: 'Overall feedback' },
                              ].map(({ key, label }) => (
                                <div key={key}>
                                  <label className="mb-1 block text-sm font-medium text-slate-700">
                                    {label}
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={markingEdit?.[key] ?? ''}
                                    disabled={isFinalized}
                                    onChange={(e) =>
                                      setMarkingEdits((prev) => ({
                                        ...prev,
                                        [sub.id]: {
                                          ...prev[sub.id],
                                          [key]: e.target.value,
                                        },
                                      }))
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                                  />
                                </div>
                              ))}

                              {isFinalized ? (
                                <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                                  This feedback is finalized and read-only.
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    onClick={() => handleSaveMarkingEdits(sub.id)}
                                    disabled={savingMarkingId === sub.id}
                                  >
                                    {savingMarkingId === sub.id
                                      ? 'Saving...'
                                      : 'Save Feedback Changes'}
                                  </Button>

                                  <Button
                                    variant="outline"
                                    onClick={() => handleMarkFeedbackReviewed(sub.id)}
                                    disabled={
                                      hasReviewedFeedback || savingMarkingId === sub.id
                                    }
                                  >
                                    {hasReviewedFeedback
                                      ? 'Marked as Reviewed'
                                      : 'Mark as Reviewed'}
                                  </Button>
                                </div>
                              )}

                              {hasReviewedFeedback && !isFinalized && (
                                <p className="text-xs text-green-700">
                                  This feedback has been marked as reviewed.
                                </p>
                              )}
                            </div>
                          </>
                        )
                      ) : (
                        <p className="text-sm text-slate-600">
                          Open the extracted-answer review page below to inspect the OCR results.
                        </p>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {isPending && roster.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Assign to student</label>
                      <select
                        value={sub.matched_student_id || ''}
                        onChange={(e) => handleReassignStudent(sub.id, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="">-- Not matched / choose a student --</option>
                        {roster.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {isPending && roster.length === 0 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Student name</label>
                      <input
                        type="text"
                        defaultValue={sub.student_name}
                        onBlur={async (e) => {
                          const res = await fetch(`${API_URL}/api/ocr/batches/${batchId}/submissions/${sub.id}/reassign`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                            credentials: 'include',
                            body: JSON.stringify({ student_name: e.target.value }),
                          });
                          if (res.ok) await load();
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  )}
                  {isPending && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">
                        Confirm which pages belong to this student.
                      </p>
                      <div className="flex items-end gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Start page</label>
                          <input
                            type="number"
                            min={1}
                            defaultValue={sub.page_range?.start}
                            onChange={(e) => handleEditPageRange(sub.id, 'pageStart', e.target.value)}
                            className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">End page</label>
                          <input
                            type="number"
                            min={1}
                            defaultValue={sub.page_range?.end}
                            onChange={(e) => handleEditPageRange(sub.id, 'pageEnd', e.target.value)}
                            className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm"
                          />
                        </div>
                        {(edit.pageStart !== undefined || edit.pageEnd !== undefined) && (
                          <Button size="sm" variant="outline" onClick={() => handleSavePageRange(sub.id)}>
                            Save range
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {!isPending && sub.mark_error && sub.status === 'approved' && (
                    <p className="text-xs font-medium text-red-600">
                      Marking failed: {sub.mark_error}. Open the script to retry.
                    </p>
                  )}
                  {!isPending && (
                    <Link
                      to={`/teacher/ocr-review/${sub.id}?batch=${batchId}`}
                      className="inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Review extracted answers →
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {confirmedDone && (
          <div className="mt-8 flex justify-end">
            <Button onClick={() => navigate('/teacher/dashboard')} variant="outline">Back to Dashboard</Button>
          </div>
        )}
      </div>
    </div>
  );
}
