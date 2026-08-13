import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_URL } from '@/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';

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
  const [edits, setEdits] = useState({}); // submissionId -> {pageStart, pageEnd}

  const load = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/ocr/batches/${batchId}`, { credentials: 'include' });
    if (!res.ok) {
      toast({ title: 'Failed to load batch', variant: 'destructive' });
      return;
    }
    const data = await res.json();
    setBatch(data.batch);
    setSubmissions(data.submissions || []);
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
  }, [batchId, toast]);

  useEffect(() => {
    load();
  }, [load]);

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
      toast({ title: 'Batch confirmed', description: 'Extraction complete — review each submission below.' });
    } catch (err) {
      toast({ title: 'Confirm failed', description: err.message, variant: 'destructive' });
    } finally {
      setConfirming(false);
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Review Class Set Split</h1>
            <p className="text-sm text-slate-600 mt-1">
              {submissions.length} student{submissions.length !== 1 ? 's' : ''} detected across {batch?.total_pages} pages.
              {needsReviewCount > 0 && !confirmedDone && (
                <span className="text-amber-600 font-medium"> {needsReviewCount} need{needsReviewCount === 1 ? 's' : ''} your review.</span>
              )}
            </p>
          </div>
          {!confirmedDone && (
            <Button onClick={handleConfirmAll} disabled={confirming} size="lg">
              {confirming ? 'Extracting...' : 'Confirm All'}
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {submissions.map((sub) => {
            const edit = edits[sub.id] || {};
            const isPending = sub.status === 'boundary_detected';
            return (
              <Card key={sub.id} className={sub.needs_review && isPending ? 'border-amber-300' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-lg">
                      Pages {sub.page_range?.start}–{sub.page_range?.end} · {sub.student_name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            sub.needs_review ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {sub.needs_review ? 'Needs review' : `Confident match (${Math.round((sub.roster_match_score || 0) * 100)}%)`}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800">Extracted</span>
                      )}
                    </div>
                  </div>
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
                    <div className="flex items-end gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">First page</label>
                        <input
                          type="number"
                          min={1}
                          defaultValue={sub.page_range?.start}
                          onChange={(e) => handleEditPageRange(sub.id, 'pageStart', e.target.value)}
                          className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Last page</label>
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
                  )}
                  {!isPending && (
                    <Link
                      to={`/teacher/ocr-review/${sub.id}`}
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
