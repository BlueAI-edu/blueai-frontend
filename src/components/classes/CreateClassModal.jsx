import { useState } from 'react';
import { getApiErrorMessage } from '@/lib/handle-error';
import { teacherApi } from '@/services/api';
import { useAsync } from '@/hooks/use-async';

const CreateClassModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    class_name: '',
    subject: '',
    year_group: ''
  });
  const [runSave, saving] = useAsync();
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.class_name.trim()) {
      setError('Class name is required');
      return;
    }

    setError('');
    runSave(async () => {
      await teacherApi.createClass(formData);
      onCreated();
    }, (error) => {
      setError(getApiErrorMessage(error, 'Failed to create class'));
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Create New Class</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.class_name}
              onChange={(e) => setFormData({...formData, class_name: e.target.value})}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 10X1 Science"
              data-testid="class-name-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Physics"
              data-testid="subject-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year Group</label>
            <input
              type="text"
              value={formData.year_group}
              onChange={(e) => setFormData({...formData, year_group: e.target.value})}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 10"
              data-testid="year-group-input"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              data-testid="save-class-btn"
            >
              {saving ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClassModal;
