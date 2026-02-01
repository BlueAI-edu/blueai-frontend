import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API_URL = window.location.origin;

export default function OCRReviewPage({ user }) {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [editedText, setEditedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  useEffect(() => {
    if (pages.length > 0) {
      setEditedText(pages[currentPageIndex]?.approved_ocr_text || '');
    }
  }, [currentPageIndex, pages]);

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ocr/submissions/${submissionId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch submission');
      }

      const data = await response.json();
      setSubmission(data.submission);
      setPages(data.pages);
      if (data.pages.length > 0) {
        setEditedText(data.pages[0].approved_ocr_text || '');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePage = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const currentPage = pages[currentPageIndex];
      const response = await fetch(
        `${API_URL}/api/ocr/pages/${submissionId}/${currentPage.page_number}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            approved_ocr_text: editedText,
            is_approved: true
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save page');
      }

      // Update local state
      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = {
        ...updatedPages[currentPageIndex],
        approved_ocr_text: editedText,
        is_approved: true
      };
      setPages(updatedPages);
      setSuccessMessage('Page saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAll = async () => {
    setSaving(true);
    setError('');

    try {
      // Save current page first
      await handleSavePage();

      // Approve all and mark
      const approveResponse = await fetch(
        `${API_URL}/api/ocr/submissions/${submissionId}/approve`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (!approveResponse.ok) {
        throw new Error('Failed to approve submission');
      }

      // Trigger AI marking
      const markResponse = await fetch(
        `${API_URL}/api/ocr/submissions/${submissionId}/mark`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (!markResponse.ok) {
        throw new Error('Failed to mark submission');
      }

      // Navigate to moderation page
      navigate(`/teacher/ocr-moderate/${submissionId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRerunOCR = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/api/ocr/submissions/${submissionId}/process`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to re-run OCR');
      }

      // Refresh submission data
      await fetchSubmission();
      setSuccessMessage('OCR re-processed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading OCR submission...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Submission not found</p>
        </div>
      </div>
    );
  }

  const currentPage = pages[currentPageIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/teacher/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Review OCR Text</h1>
            </div>
            <div className="text-sm text-gray-500">
              Student: <span className="font-medium text-gray-900">{submission.student_name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Navigation */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                disabled={currentPageIndex === 0}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <span className="text-sm font-medium text-gray-700">
                Page {currentPageIndex + 1} of {pages.length}
              </span>
              <button
                onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
                disabled={currentPageIndex === pages.length - 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {pages.map((page, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPageIndex(index)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    index === currentPageIndex
                      ? 'bg-blue-600 text-white'
                      : page.is_approved
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Side by Side View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Image Viewer */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Scanned Image</h2>
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              <div className="aspect-[3/4] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Image preview not available</p>
                  <p className="text-xs mt-1">File: {currentPage?.file_path?.split('/').pop()}</p>
                </div>
              </div>
            </div>
            {currentPage?.confidence && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  OCR Confidence: <span className="font-medium">{(currentPage.confidence * 100).toFixed(1)}%</span>
                </p>
              </div>
            )}
          </div>

          {/* Right: OCR Text Editor */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Extracted Text</h2>
              {currentPage?.is_approved && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  ✓ Approved
                </span>
              )}
            </div>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full h-[500px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Edit the OCR text here..."
            />
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleSavePage}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save & Approve Page'}
              </button>
              <button
                onClick={handleRerunOCR}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                Re-run OCR
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ready to Mark?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Once you're satisfied with all pages, approve and send for AI marking
              </p>
            </div>
            <button
              onClick={handleApproveAll}
              disabled={saving}
              className="bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Processing...' : 'Approve All & Mark'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
