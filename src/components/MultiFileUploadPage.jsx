import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';
import { MULTI_UPLOAD_MAX_FILES } from '@/config';

/**
 * Bulk multi-file assessment upload (#271, pilot release) — sibling to
 * BulkUploadPage.jsx's single-combined-PDF auto-split flow. Here the teacher
 * uploads one file PER STUDENT in one action (up to MULTI_UPLOAD_MAX_FILES);
 * each file is already exactly one student's submission, matched to the
 * roster by filename (services/bulk_upload_service.py) rather than detected
 * via a boundary-detection pass. Creating the batch, uploading, and starting
 * processing all happen here; per-file status/retry/approve/export live on
 * MultiUploadDashboardPage.jsx (navigated to once processing starts).
 */
export default function MultiFileUploadPage({ user }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assessments, setAssessments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [files, setFiles] = useState([]);
  const [starting, setStarting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

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
  }, []);

  const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png'];

  const processFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const rejected = [];
    const accepted = [];
    for (const f of incoming) {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXT.includes(ext)) {
        rejected.push(`${f.name} (unsupported type)`);
        continue;
      }
      if (f.size > 50 * 1024 * 1024) {
        rejected.push(`${f.name} (over 50MB)`);
        continue;
      }
      accepted.push(f);
    }
    if (rejected.length) {
      toast({
        title: `${rejected.length} file(s) skipped`,
        description: rejected.slice(0, 5).join(', '),
        variant: 'destructive',
      });
    }

    setFiles((prev) => {
      const combined = [...prev, ...accepted];
      if (combined.length > MULTI_UPLOAD_MAX_FILES) {
        toast({
          title: `Only the first ${MULTI_UPLOAD_MAX_FILES} files were kept`,
          description: `You can upload up to ${MULTI_UPLOAD_MAX_FILES} files in one batch.`,
          variant: 'destructive',
        });
        return combined.slice(0, MULTI_UPLOAD_MAX_FILES);
      }
      return combined;
    });
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (starting) return;
    processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!starting) setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStart = async (e) => {
    e.preventDefault();
    if (!selectedAssessment || files.length === 0) {
      toast({ title: 'Missing fields', description: 'Select an assessment and add at least one file.', variant: 'destructive' });
      return;
    }
    setStarting(true);
    try {
      const createRes = await fetch(`${API_URL}/api/ocr/multi-batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
        body: JSON.stringify({ assessment_id: selectedAssessment, class_id: selectedClass || null }),
      });
      if (!createRes.ok) throw new Error('Failed to create batch');
      const { batch_id } = await createRes.json();

      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const uploadRes = await fetch(`${API_URL}/api/ocr/multi-batches/${batch_id}/upload`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
        body: formData,
      });
      if (!uploadRes.ok) {
        throw new Error((await uploadRes.json().catch(() => ({}))).detail || 'Failed to upload files');
      }

      const processRes = await fetch(`${API_URL}/api/ocr/multi-batches/${batch_id}/process`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
      });
      if (!processRes.ok) {
        throw new Error((await processRes.json().catch(() => ({}))).detail || 'Failed to start processing');
      }

      toast({ title: 'Upload complete', description: `${files.length} file(s) are now processing in the background.` });
      navigate(`/teacher/bulk-assessment-upload/${batch_id}`);
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message || 'Please try again.', variant: 'destructive' });
      setStarting(false);
    }
  };

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
                <h3 className="font-semibold text-blue-900">Bulk Assessment Upload</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Already have each student's work as a separate file? Upload them all at once — each
                  file becomes its own student submission (no splitting needed). Select the class too
                  so BlueAI can match filenames to your roster; anything it can't confidently match is
                  flagged for you to assign manually.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Upload Student Files</CardTitle>
            <CardDescription>Up to {MULTI_UPLOAD_MAX_FILES} files — PDF, JPG or PNG, one per student</CardDescription>
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
                  Class <span className="text-slate-400">(optional, enables filename-to-roster matching)</span>
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  disabled={starting}
                >
                  <option value="">No class — assign students manually after upload</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.class_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Student Files <span className="text-red-500">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    isDragActive ? 'border-blue-400 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
                  onDragEnter={handleDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="multi-file-upload"
                    disabled={starting}
                  />
                  <label htmlFor="multi-file-upload" className="cursor-pointer">
                    <div className="text-slate-600">
                      <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-3 text-sm">
                        <span className="font-semibold text-blue-600 hover:text-blue-500">Click to upload</span>
                        <span className="text-slate-500"> or drag and drop multiple files</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">PDF, JPG or PNG, max 50MB each, up to {MULTI_UPLOAD_MAX_FILES} files</p>
                    </div>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
                    <p className="text-xs font-medium text-slate-500">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
                    {files.map((f, idx) => (
                      <div key={`${f.name}-${idx}`} className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">{f.name}</p>
                          <p className="text-xs text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        {!starting && (
                          <button type="button" onClick={() => removeFile(idx)} className="ml-4 text-slate-400 hover:text-red-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {starting && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-amber-800">
                    Uploading {files.length} file{files.length !== 1 ? 's' : ''}... For a large batch this can take a
                    little while — you'll be taken to the processing dashboard once uploading finishes, and OCR/marking
                    continues in the background even if you close this tab.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={starting || !selectedAssessment || files.length === 0} className="flex-1" size="lg">
                  {starting ? 'Uploading...' : `Upload ${files.length || ''} File${files.length === 1 ? '' : 's'} & Start`}
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
