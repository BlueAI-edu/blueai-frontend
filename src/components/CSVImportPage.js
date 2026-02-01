import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export const CSVImportPage = ({ user }) => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState('upload'); // upload, preview, importing, complete
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const downloadTemplate = async () => {
    try {
      const response = await axios.get(`${API}/teacher/students/csv-template`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_import_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target.result);
    };
    reader.readAsText(file);
  };

  const handlePreview = async () => {
    if (!csvContent) {
      setError('Please select a CSV file first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/teacher/students/csv-preview`, {
        csv_content: csvContent
      });
      setPreview(response.data);
      setStep('preview');
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to preview CSV');
    }
    setLoading(false);
  };

  const handleImport = async () => {
    if (!preview) return;

    setStep('importing');
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/teacher/students/csv-import`, {
        rows: preview.preview
      });
      setImportResult(response.data);
      setStep('complete');
    } catch (error) {
      setError(error.response?.data?.detail || 'Import failed');
      setStep('preview');
    }
    setLoading(false);
  };

  const getActionBadge = (action, valid) => {
    if (!valid) {
      return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">Skip (Error)</span>;
    }
    switch (action) {
      case 'create':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Create</span>;
      case 'update':
        return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Update</span>;
      case 'skip':
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Skip</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-blue-600">BlueAI</h1>
            <button 
              onClick={() => navigate(classId ? `/teacher/classes/${classId}` : '/teacher/classes')} 
              className="text-gray-700 hover:text-blue-600"
            >
              ← Back to {classId ? 'Class' : 'Classes'}
            </button>
          </div>
          <span className="text-gray-700">{user.name}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900" data-testid="import-title">Import Students from CSV</h2>
          <p className="text-gray-600 mt-2">Upload a CSV file to bulk import students into your classes</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${step === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
              step === 'upload' ? 'bg-blue-600 text-white' : 
              step !== 'upload' ? 'bg-green-500 text-white' : 'bg-gray-200'
            }`}>
              {step !== 'upload' ? '✓' : '1'}
            </div>
            <span className="ml-2 font-medium">Upload</span>
          </div>
          <div className="w-16 h-1 bg-gray-200 mx-2"></div>
          <div className={`flex items-center ${step === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
              step === 'preview' ? 'bg-blue-600 text-white' : 
              ['importing', 'complete'].includes(step) ? 'bg-green-500 text-white' : 'bg-gray-200'
            }`}>
              {['importing', 'complete'].includes(step) ? '✓' : '2'}
            </div>
            <span className="ml-2 font-medium">Preview</span>
          </div>
          <div className="w-16 h-1 bg-gray-200 mx-2"></div>
          <div className={`flex items-center ${step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
              step === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-200'
            }`}>
              {step === 'complete' ? '✓' : '3'}
            </div>
            <span className="ml-2 font-medium">Complete</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload CSV File</h3>
              <p className="text-gray-600 mb-4">
                Select a CSV file with your student data. Classes will be created automatically if they don't exist.
              </p>
              <button
                onClick={downloadTemplate}
                className="text-blue-600 hover:text-blue-700 underline text-sm mb-6 inline-block"
                data-testid="download-template-btn"
              >
                Download CSV Template
              </button>
            </div>

            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv"
                className="hidden"
                data-testid="csv-file-input"
              />
              
              {fileName ? (
                <div>
                  <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-900 font-medium">{fileName}</p>
                  <p className="text-sm text-gray-500 mt-1">Click to select a different file</p>
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600">Click to select a CSV file</p>
                  <p className="text-sm text-gray-400 mt-1">or drag and drop</p>
                </div>
              )}
            </div>

            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Required CSV Columns:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-red-500">*</span> class_name</div>
                <div><span className="text-red-500">*</span> first_name</div>
                <div><span className="text-red-500">*</span> last_name</div>
                <div>preferred_name (optional)</div>
                <div>student_code (optional)</div>
                <div>sen_flag (TRUE/FALSE)</div>
                <div>pupil_premium_flag (TRUE/FALSE)</div>
                <div>eal_flag (TRUE/FALSE)</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handlePreview}
                disabled={!csvContent || loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="preview-btn"
              >
                {loading ? 'Processing...' : 'Preview Import'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && preview && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Preview Import</h3>
              <p className="text-gray-600 mt-1">Review the changes before importing</p>
            </div>

            {/* Summary Cards */}
            <div className="p-6 bg-gray-50 border-b">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <p className="text-3xl font-bold text-gray-900">{preview.total_rows}</p>
                  <p className="text-sm text-gray-600">Total Rows</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <p className="text-3xl font-bold text-green-600">{preview.summary.will_create}</p>
                  <p className="text-sm text-green-600">Will Create</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <p className="text-3xl font-bold text-blue-600">{preview.summary.will_update}</p>
                  <p className="text-sm text-blue-600">Will Update</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <p className="text-3xl font-bold text-red-600">{preview.summary.will_skip}</p>
                  <p className="text-sm text-red-600">Will Skip</p>
                </div>
              </div>

              {preview.summary.new_classes.length > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-amber-800 text-sm">
                    <strong>New classes will be created:</strong> {preview.summary.new_classes.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flags</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.preview.map((row, idx) => (
                    <tr key={idx} className={`${!row.valid ? 'bg-red-50' : row.action === 'update' ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.row_num}</td>
                      <td className="px-4 py-3">{getActionBadge(row.action, row.valid)}</td>
                      <td className="px-4 py-3 text-sm">{row.class_name}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{row.first_name} {row.last_name}</p>
                          {row.preferred_name && <p className="text-xs text-gray-500">({row.preferred_name})</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.student_code || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {row.sen_flag && <span className="bg-purple-100 text-purple-700 px-1 py-0.5 rounded text-xs">SEN</span>}
                          {row.pupil_premium_flag && <span className="bg-amber-100 text-amber-700 px-1 py-0.5 rounded text-xs">PP</span>}
                          {row.eal_flag && <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-xs">EAL</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="p-6 border-t flex justify-between">
              <button
                onClick={() => {
                  setStep('upload');
                  setPreview(null);
                }}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
              >
                ← Back to Upload
              </button>
              <button
                onClick={handleImport}
                disabled={loading || preview.summary.will_create + preview.summary.will_update === 0}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="confirm-import-btn"
              >
                {loading ? 'Importing...' : `Import ${preview.summary.will_create + preview.summary.will_update} Students`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900">Importing Students...</h3>
            <p className="text-gray-600 mt-2">Please wait while we process your data</p>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && importResult && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Import Complete!</h3>
              <p className="text-gray-600 mt-2">{importResult.message}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <p className="text-4xl font-bold text-green-600">{importResult.summary.created}</p>
                <p className="text-green-600 font-medium">Students Created</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <p className="text-4xl font-bold text-blue-600">{importResult.summary.updated}</p>
                <p className="text-blue-600 font-medium">Students Updated</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-4xl font-bold text-gray-600">{importResult.summary.skipped}</p>
                <p className="text-gray-600 font-medium">Rows Skipped</p>
              </div>
            </div>

            {importResult.summary.classes_created.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-amber-800">
                  <strong>New classes created:</strong> {importResult.summary.classes_created.join(', ')}
                </p>
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-red-800 mb-2">Errors ({importResult.errors.length})</h4>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {importResult.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>Row {err.row}: {err.error}</li>
                  ))}
                  {importResult.errors.length > 5 && (
                    <li>...and {importResult.errors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/teacher/classes')}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
              >
                View All Classes
              </button>
              <button
                onClick={() => {
                  setStep('upload');
                  setCsvContent('');
                  setFileName('');
                  setPreview(null);
                  setImportResult(null);
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Import More Students
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVImportPage;
