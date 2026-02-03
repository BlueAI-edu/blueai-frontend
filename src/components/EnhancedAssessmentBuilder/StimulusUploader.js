import React, { useState } from 'react';
import axios from 'axios';
import { API } from '@/config';

const StimulusUploader = ({ assessmentId, questionNumber, currentStimulus, onStimulusUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [stimulusType, setStimulusType] = useState('image');
  const [textContent, setTextContent] = useState(currentStimulus?.type === 'text' ? currentStimulus.content : '');
  const [caption, setCaption] = useState(currentStimulus?.caption || '');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('question_number', questionNumber);
      formData.append('caption', caption);

      const response = await axios.post(
        `${API}/teacher/assessments/${assessmentId}/upload-stimulus`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success) {
        onStimulusUploaded(response.data.stimulusBlock);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleTextStimulusSubmit = () => {
    if (!textContent.trim()) {
      setError('Please enter stimulus content');
      return;
    }

    const stimulusBlock = {
      type: 'text',
      content: textContent,
      caption: caption
    };

    onStimulusUploaded(stimulusBlock);
  };

  const removeStimulus = () => {
    onStimulusUploaded(null);
    setTextContent('');
    setCaption('');
  };

  return (
    <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
      <h4 className="font-medium text-gray-900 mb-3">Shared Stimulus (Optional)</h4>
      <p className="text-sm text-gray-600 mb-4">
        Add a shared diagram, text passage, or table that students will refer to when answering this question.
      </p>

      {currentStimulus ? (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">
                {currentStimulus.type === 'image' ? '🖼️ Image' : '📝 Text'}
              </span>
              {currentStimulus.caption && (
                <p className="text-sm font-medium text-gray-700 mt-1">{currentStimulus.caption}</p>
              )}
            </div>
            <button
              onClick={removeStimulus}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>

          {currentStimulus.type === 'image' ? (
            <img
              src={currentStimulus.content}
              alt={currentStimulus.caption || 'Stimulus'}
              className="max-w-full h-auto rounded border"
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded">
              {currentStimulus.content}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Stimulus Type Selector */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setStimulusType('image')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium ${
                stimulusType === 'image'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              🖼️ Image/Diagram
            </button>
            <button
              onClick={() => setStimulusType('text')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium ${
                stimulusType === 'text'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              📝 Text/Table
            </button>
          </div>

          {/* Caption Input */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption (Optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g., Figure 1: Circuit diagram"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {stimulusType === 'image' ? (
            <div>
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 mb-1">
                    {uploading ? 'Uploading...' : 'Click to upload image'}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
              </label>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stimulus Content
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter text passage, data table, or other information students need..."
                rows={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <button
                onClick={handleTextStimulusSubmit}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Text Stimulus
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StimulusUploader;
