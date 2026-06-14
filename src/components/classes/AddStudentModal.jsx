import { useState } from 'react';
import axios from 'axios';
import { API } from '@/config';
import { getApiErrorMessage } from '@/lib/handle-error';
import { useAsync } from '@/hooks/use-async';

const AddStudentModal = ({ classId, onClose, onAdded }) => {
  const [formData, setFormData] = useState({
    class_id: classId,
    first_name: '',
    last_name: '',
    preferred_name: '',
    student_code: '',
    email: '',
    sen_flag: false,
    pupil_premium_flag: false,
    eal_flag: false,
    notes: ''
  });
  const [runSave, saving] = useAsync();
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('First name and last name are required');
      return;
    }

    setError('');
    runSave(async () => {
      await axios.post(`${API}/teacher/students`, formData);
      onAdded();
    }, (error) => {
      setError(getApiErrorMessage(error, 'Failed to add student'));
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Add Student</h2>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                data-testid="student-first-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                data-testid="student-last-name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Name</label>
              <input
                type="text"
                value={formData.preferred_name}
                onChange={(e) => setFormData({...formData, preferred_name: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Code</label>
              <input
                type="text"
                value={formData.student_code}
                onChange={(e) => setFormData({...formData, student_code: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="e.g., STU001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
              <span className="text-gray-400 font-normal ml-1">(for sending reports)</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="student@school.edu"
              data-testid="student-email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Flags</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.sen_flag}
                  onChange={(e) => setFormData({...formData, sen_flag: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">SEN</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.pupil_premium_flag}
                  onChange={(e) => setFormData({...formData, pupil_premium_flag: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">Pupil Premium</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.eal_flag}
                  onChange={(e) => setFormData({...formData, eal_flag: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">EAL</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              rows="2"
              placeholder="Optional notes about the student"
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
              data-testid="save-student-btn"
            >
              {saving ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudentModal;
