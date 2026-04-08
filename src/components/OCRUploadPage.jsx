import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function OCRUploadPage({ user }) {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [studentName, setStudentName] = useState('');
  const [batchLabel, setBatchLabel] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/teacher/assessments`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAssessments(data);
      }
    } catch (err) {
      console.error('Failed to fetch assessments:', err);
    }
  };

  const ALLOWED_OCR_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
  const MAX_OCR_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_OCR_FILES = 20;

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const nextFiles = [...files, ...selectedFiles];

    if (nextFiles.length > MAX_OCR_FILES) {
      setError(`Too many files. Maximum ${MAX_OCR_FILES} files allowed.`);
      return;
    }

    for (const file of selectedFiles) {
      if (!ALLOWED_OCR_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not a supported type. Only PDF, JPG, and PNG are accepted.`);
        return;
      }
      if (file.size > MAX_OCR_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 10MB limit.`);
        return;
      }
    }

    setError('');
    setFiles(nextFiles);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAssessment || !studentName || files.length === 0) {
      setError('Please fill all required fields and select files');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(10);

    try {
      // Step 1: Create OCR submission
      const createResponse = await fetch(`${API_URL}/api/ocr/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
        body: JSON.stringify({
          assessment_id: selectedAssessment,
          student_name: studentName,
          batch_label: batchLabel || null
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create submission');
      }

      const { submission_id } = await createResponse.json();
      setUploadProgress(30);

      // Step 2: Upload files
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const uploadResponse = await fetch(`${API_URL}/api/ocr/submissions/${submission_id}/upload`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload files');
      }

      setUploadProgress(60);

      // Step 3: Process OCR
      const processResponse = await fetch(`${API_URL}/api/ocr/submissions/${submission_id}/process`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include'
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process OCR');
      }

      setUploadProgress(100);

      // Navigate to review page
      setTimeout(() => {
        navigate(`/teacher/ocr-review/${submission_id}`);
      }, 500);

    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/teacher/dashboard')}
                variant="ghost"
                className="text-slate-600 hover:text-slate-900"
              >
                ← Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-slate-300" />
              <h1 className="text-2xl font-bold text-slate-900">Upload Student Script</h1>
            </div>
            {user && (
              <Badge variant="secondary" className="text-sm">
                {user.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">OCR Text Extraction</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Upload handwritten student scripts for automatic text extraction with AI-assisted cleanup. 
                  Supports PDFs and images (JPG, PNG) up to 10MB each, maximum 20 files.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Upload Handwritten Script</CardTitle>
            <CardDescription>
              Submit student work for OCR processing and AI marking
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Assessment Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Assessment <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAssessment}
                  onChange={(e) => setSelectedAssessment(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                  disabled={loading}
                >
                  <option value="">Choose an assessment...</option>
                  {assessments.map(assessment => (
                    <option key={assessment.id} value={assessment.id}>
                      {assessment.join_code} - {assessment.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter student's full name"
                  required
                  disabled={loading}
                />
              </div>

              {/* Batch Label (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Batch Label <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={batchLabel}
                  onChange={(e) => setBatchLabel(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Class 10A, Morning Session"
                  disabled={loading}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Upload Files <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-all hover:bg-blue-50/50">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="hidden"
                    id="file-upload"
                    disabled={loading}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="text-slate-600">
                      <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-3 text-sm">
                        <span className="font-semibold text-blue-600 hover:text-blue-500">Click to upload</span>
                        <span className="text-slate-500"> or drag and drop</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">PDF, JPG, or PNG (max 10MB each, up to 20 files)</p>
                    </div>
                  </label>
                </div>
                
                {/* Selected Files */}
                {files.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      {files.length} file{files.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                              <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          {!loading && (
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="flex-shrink-0 ml-4 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {loading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Processing...</span>
                    <span className="text-slate-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit"
                  disabled={loading || !selectedAssessment || !studentName || files.length === 0}
                  className="flex-1"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload & Process OCR
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => navigate('/teacher/dashboard')}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                >
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
