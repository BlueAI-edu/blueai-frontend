import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/config';
import { getApiErrorMessage } from '@/lib/handle-error';

const AssignAssessmentModal = ({ classId, onClose, onAssigned }) => {
  const [assessments, setAssessments] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    axios.get(`${API}/teacher/assessments`)
      .then(res => setAssessments(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAssign = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError('');
    try {
      const res = await axios.post(`${API}/teacher/assessments/${selectedId}/assignments`, { class_id: classId });
      setResult(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to assign assessment'));
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Assign Assessment to Class</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {result ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900">Assessment assigned!</p>
              <p className="text-gray-600 text-sm">{result.assessment_title}</p>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Student join code</p>
                <p className="text-3xl font-mono font-bold text-blue-700 tracking-widest">{result.assignment.join_code}</p>
                <p className="text-xs text-gray-500 mt-2">Share this code with your students.</p>
              </div>
              <button onClick={onAssigned} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 mt-2">
                Done
              </button>
            </div>
          ) : (
            <>
              {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Assessment</label>
                {loading ? (
                  <p className="text-sm text-gray-500">Loading assessments...</p>
                ) : assessments.length === 0 ? (
                  <p className="text-sm text-gray-500">No assessments found. Create an assessment first.</p>
                ) : (
                  <select
                    value={selectedId}
                    onChange={e => setSelectedId(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select an assessment --</option>
                    {assessments.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.title || `Assessment #${a.id.slice(0, 8)}`}
                        {a.assessmentMode && a.assessmentMode !== 'CLASSIC' ? '' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
                <button
                  onClick={handleAssign}
                  disabled={!selectedId || saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Assigning...' : 'Assign & Generate Code'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignAssessmentModal;
