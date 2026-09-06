import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_URL } from '@/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';

const STATUS_LABELS = {
  uploaded: { label: 'Queued', className: 'bg-slate-100 text-slate-700' },
  ocr_processing: { label: 'Extracting…', className: 'bg-blue-100 text-blue-800' },
  ocr_ready: { label: 'Extracting…', className: 'bg-blue-100 text-blue-800' },
  approved: { label: 'Marking…', className: 'bg-blue-100 text-blue-800' },
  marked_draft: { label: 'Ready for review', className: 'bg-amber-100 text-amber-800' },
  finalized: { label: 'Approved ✓', className: 'bg-green-100 text-green-800' },
  file_error: { label: 'Failed', className: 'bg-red-100 text-red-800' },
};

function StatusBadge({ status }) {
  const info = STATUS_LABELS[status] || { label: status, className: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${info.className}`}>
      {info.label}
    </span>
  );
}

/**
 * Batch dashboard for the bulk multi-file upload (#271, pilot release) —
 * sibling to BulkUploadReviewPage.jsx (#241's review screen), but simpler:
 * there's no boundary/page-range to correct, just per-file roster assignment
 * and per-file OCR->approve->mark status, since each file is already exactly
 * one student's submission (services/bulk_upload_service.py).
 */
export default function MultiUploadDashboardPage({ user }) {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [batch, setBatch] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState({});
  const [approvingAll, setApprovingAll] = useState(false);
  const [exporting, setExporting] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/ocr/multi-batches/${batchId}`, { credentials: 'include' });
    if (!res.ok) {
      toast({ title: 'Failed to load batch', variant: 'destructive' });
      return null;
    }
    const data = await res.json();
    setBatch(data.batch);
    setSubmissions(data.submissions || []);
    if (data.batch.class_id && roster.length === 0) {
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
  }, [batchId, toast]);

  useEffect(() => {
    load();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  useEffect(() => {
    if (batch?.status === 'processing' && !pollRef.current) {
      pollRef.current = setInterval(load, 3000);
    }
    if (batch && batch.status !== 'processing' && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [batch, load]);

  const withBusy = async (submissionId, fn) => {
    setBusyIds((prev) => ({ ...prev, [submissionId]: true }));
    try {
      await fn();
    } finally {
      setBusyIds((prev) => { const next = { ...prev }; delete next[submissionId]; return next; });
    }
  };

  const handleAssign = (submissionId, studentId) =>
    withBusy(submissionId, async () => {
      const student = roster.find((s) => s.id === studentId);
      const res = await fetch(
        `${API_URL}/api/ocr/multi-batches/${batchId}/submissions/${submissionId}/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'include',
          body: JSON.stringify({
            student_id: studentId || null,
            student_name: student ? student.full_name : null,
          }),
        }
      );
      if (!res.ok) {
        toast({ title: 'Failed to assign student', variant: 'destructive' });
        return;
      }
      await load();
    });

  const handleAssignName = (submissionId, name) =>
    withBusy(submissionId, async () => {
      const res = await fetch(
        `${API_URL}/api/ocr/multi-batches/${batchId}/submissions/${submissionId}/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'include',
          body: JSON.stringify({ student_name: name }),
        }
      );
      if (!res.ok) {
        toast({ title: 'Failed to assign student', variant: 'destructive' });
        return;
      }
      await load();
    });

  const handleRetry = (submissionId) =>
    withBusy(submissionId, async () => {
      const res = await fetch(
        `${API_URL}/api/ocr/multi-batches/${batchId}/submissions/${submissionId}/retry`,
        { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'include' }
      );
      if (!res.ok) {
        toast({ title: 'Retry failed to start', description: (await res.json().catch(() => ({}))).detail, variant: 'destructive' });
        return;
      }
      toast({ title: 'Retrying…', description: 'This file is being re-processed.' });
      setTimeout(load, 1500);
    });

  const handleApprove = (submissionId) =>
    withBusy(submissionId, async () => {
      const res = await fetch(`${API_URL}/api/ocr/submissions/${submissionId}/finalize`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
      });
      if (!res.ok) {
        toast({ title: 'Approve failed', description: (await res.json().catch(() => ({}))).detail, variant: 'destructive' });
        return;
      }
      await load();
    });

  const handleApproveAll = async () => {
    setApprovingAll(true);
    try {
      const res = await fetch(`${API_URL}/api/ocr/multi-batches/${batchId}/approve-all`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to approve');
      const data = await res.json();
      toast({ title: 'Approved', description: `${data.finalized} submission(s) approved${data.failed ? `, ${data.failed} failed` : ''}.` });
      await load();
    } catch (err) {
      toast({ title: 'Approve all failed', description: err.message, variant: 'destructive' });
    } finally {
      setApprovingAll(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_URL}/api/ocr/multi-batches/${batchId}/export`, { credentials: 'include' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Nothing to export yet');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch_${batchId.slice(0, 8)}_feedback.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    } finally {
      setExporting(false);
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

  const isProcessing = batch?.status === 'processing' || batch?.status === 'uploaded';
  const readyForApproveCount = submissions.filter((s) => s.status === 'marked_draft').length;
  const approvedCount = submissions.filter((s) => s.status === 'finalized').length;
  const failedCount = submissions.filter((s) => s.status === 'file_error').length;
  const needsAssignCount = submissions.filter((s) => s.needs_review).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar user={user} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bulk Assessment Upload</h1>
            <p className="text-sm text-slate-600 mt-1">
              {submissions.length} file{submissions.length !== 1 ? 's' : ''} in this batch
              {approvedCount > 0 && <span className="text-green-700 font-medium"> · {approvedCount} approved</span>}
              {readyForApproveCount > 0 && <span className="text-amber-600 font-medium"> · {readyForApproveCount} ready for your review</span>}
              {failedCount > 0 && <span className="text-red-600 font-medium"> · {failedCount} failed</span>}
              {needsAssignCount > 0 && <span className="text-amber-600 font-medium"> · {needsAssignCount} need a student assigned</span>}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {readyForApproveCount > 0 && (
              <Button onClick={handleApproveAll} disabled={approvingAll} variant="outline">
                {approvingAll ? 'Approving…' : `Approve All Ready (${readyForApproveCount})`}
              </Button>
            )}
            {approvedCount > 0 && (
              <Button onClick={handleExport} disabled={exporting}>
                {exporting ? 'Preparing ZIP…' : `Download Approved (${approvedCount})`}
              </Button>
            )}
          </div>
        </div>

        {isProcessing && (
          <Card className="mb-6 border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing {batch?.files_processed || 0} of {batch?.total_files || submissions.length} files…
              </div>
              <p className="text-xs text-blue-700 mt-1.5 ml-6">
                This can take a while for a large batch — OCR and marking run in the background, so it's
                safe to close this tab and come back later; nothing will be lost.
              </p>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden mt-2 ml-6" style={{ width: 'calc(100% - 1.5rem)' }}>
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${batch?.total_files ? Math.round(((batch.files_processed || 0) / batch.total_files) * 100) : 5}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {submissions.map((sub) => {
            const busy = !!busyIds[sub.id];
            return (
              <Card key={sub.id} className={sub.needs_review || sub.status === 'file_error' ? 'border-amber-300' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base">
                      {sub.student_name} <span className="text-slate-400 font-normal text-sm">· {sub.source_filename}</span>
                    </CardTitle>
                    <StatusBadge status={sub.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sub.needs_review && roster.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Assign to student</label>
                      <select
                        value={sub.matched_student_id || ''}
                        onChange={(e) => handleAssign(sub.id, e.target.value)}
                        disabled={busy}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="">-- Not matched / choose a student --</option>
                        {roster.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {sub.needs_review && roster.length === 0 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Student name</label>
                      <input
                        type="text"
                        defaultValue={sub.student_name}
                        disabled={busy}
                        onBlur={(e) => handleAssignName(sub.id, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  )}

                  {sub.status === 'file_error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{sub.file_error || 'Processing failed.'}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    {sub.status === 'file_error' && (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => handleRetry(sub.id)}>
                        {busy ? 'Retrying…' : 'Retry this file'}
                      </Button>
                    )}
                    {sub.status === 'marked_draft' && (
                      <Button size="sm" disabled={busy} onClick={() => handleApprove(sub.id)}>
                        {busy ? 'Approving…' : 'Approve'}
                      </Button>
                    )}
                    {['marked_draft', 'finalized'].includes(sub.status) && (
                      <Link
                        to={`/teacher/ocr-review/${sub.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Review extracted answers →
                      </Link>
                    )}
                    {sub.status === 'finalized' && (
                      <a
                        href={`${API_URL}/api/ocr/submissions/${sub.id}/download-pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-green-700 hover:text-green-800"
                      >
                        Download PDF →
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={() => navigate('/teacher/dashboard')} variant="outline">Back to Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
