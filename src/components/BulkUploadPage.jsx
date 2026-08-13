import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';

/**
 * Bulk class-set upload (#241) — sibling to OCRUploadPage.jsx's single-script
 * flow. A teacher uploads one multi-page PDF containing a whole class's
 * scripts (e.g. from "Scan to Email"); the backend detects submission
 * boundaries and splits it into per-student chunks (services/ocr_batch_service.py)
 * rather than the teacher uploading one script at a time.
 */
export default function BulkUploadPage({ user }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assessments, setAssessments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [file, setFile] = useState(null);
  const [batchId, setBatchId] = useState(null);
  const [batch, setBatch] = useState(null);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [assessmentsRes, classesRes] = await Promise.all([
          fetch(`${API_URL}/api/teacher/assessments`, { credentials: 'include' }),
          fetch(`${API_URL}/api/teacher/classes`, { credentials: 'include' }),
        ]);
        if (assessmentsRes.ok) setAssessments(await assessmentsRes.json());
        if (classesRes.ok) {
          const data = await classesRes.json();
          setClasses(data.classes || data || []);
        }
      } catch (err) {
        console.error('Failed to fetch assessments/classes:', err);
      }
    })();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const startPolling = (id) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/ocr/batches/${id}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setBatch(data.batch);
        if (data.batch.status === 'ready_for_review') {
          clearInterval(pollRef.current);
          navigate(`/teacher/ocr-bulk-review/${id}`);
        } else if (data.batch.status === 'error') {
          clearInterval(pollRef.current);
          toast({ title: 'Processing failed', description: data.batch.error || 'Please try again.', variant: 'destructive' });
        }
      } catch (err) {
        console.error('Batch poll failed:', err);
      }
    }, 3000);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    e.target.value = '';
    if (!selected) return;
    if (selected.type !== 'application/pdf') {
      toast({ title: 'Unsupported file type', description: 'Bulk upload requires a single PDF file.', variant: 'destructive' });
      return;
    }
    if (selected.size > 50 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'File exceeds the 50MB limit.', variant: 'destructive' });
      return;
    }
    setFile(selected);
  };

  const handleStart = async (e) => {
    e.preventDefault();
    if (!selectedAssessment || !file) {
      toast({ title: 'Missing fields', description: 'Select an assessment and upload a PDF.', variant: 'destructive' });
      return;
    }
    setStarting(true);
    try {
      const createRes = await fetch(`${API_URL}/api/ocr/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
        body: JSON.stringify({ assessment_id: selectedAssessment, class_id: selectedClass || null }),
      });
      if (!createRes.ok) throw new Error('Failed to create batch');
      const { batch_id } = await createRes.json();
      setBatchId(batch_id);

      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${API_URL}/api/ocr/batches/${batch_id}/upload`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error((await uploadRes.json().catch(() => ({}))).detail || 'Failed to upload PDF');
      const { total_pages } = await uploadRes.json();
      setBatch({ status: 'uploaded', total_pages, pages_processed: 0, detected_submission_count: 0 });

      const processRes = await fetch(`${API_URL}/api/ocr/batches/${batch_id}/process`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
      });
      if (!processRes.ok) throw new Error('Failed to start processing');
      setBatch((prev) => ({ ...prev, status: 'processing' }));
      startPolling(batch_id);
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message || 'Please try again.', variant: 'destructive' });
      setStarting(false);
    }
  };

  const isProcessing = batch && ['uploaded', 'processing'].includes(batch.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar user={user} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Class Set Upload</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Upload one multi-page PDF containing a whole class's scripts (e.g. from "Scan to
                  Email") and BlueAI will detect where each student's script starts and split it
                  automatically. Select the class too so detected names can be matched to your
                  roster — anything uncertain is flagged for you to confirm before marking.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Upload Class Set</CardTitle>
            <CardDescription>Split one scanned PDF into individual student submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStart} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Assessment <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAssessment}
                  onChange={(e) => setSelectedAssessment(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                  disabled={starting}
                >
                  <option value="">Choose an assessment...</option>
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>{a.title || a.join_code} — {a.join_code}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Class <span className="text-slate-400">(optional, enables roster matching)</span>
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  disabled={starting}
                >
                  <option value="">No class — assign students manually during review</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.class_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Class Set PDF <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-all hover:bg-blue-50/50">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                    id="bulk-file-upload"
                    disabled={starting}
                  />
                  <label htmlFor="bulk-file-upload" className="cursor-pointer">
                    <div className="text-slate-600">
                      <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-3 text-sm">
                        <span className="font-semibold text-blue-600 hover:text-blue-500">Click to upload</span>
                        <span className="text-slate-500"> or drag and drop</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Single PDF, max 50MB, any number of pages</p>
                    </div>
                  </label>
                </div>
                {file && (
                  <div className="mt-4 flex items-center justify-between bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    {!starting && (
                      <button type="button" onClick={() => setFile(null)} className="ml-4 text-slate-400 hover:text-red-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isProcessing && (
                <div className="space-y-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {batch.status === 'uploaded'
                      ? 'Starting...'
                      : `Processing ${batch.pages_processed || 0} of ${batch.total_pages || '?'} pages...`}
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${batch.total_pages ? Math.round(((batch.pages_processed || 0) / batch.total_pages) * 100) : 5}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={starting || !selectedAssessment || !file} className="flex-1" size="lg">
                  {starting ? 'Processing...' : 'Upload & Split'}
                </Button>
                <Button type="button" onClick={() => navigate('/teacher/dashboard')} disabled={starting} variant="outline" size="lg">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
