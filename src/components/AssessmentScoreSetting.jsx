import { useEffect, useState } from 'react';
import { teacherApi } from '@/services/api';
import { getApiErrorMessage } from '@/lib/handle-error';
import ScoreVisibilityField from '@/components/EnhancedAssessmentBuilder/ScoreVisibilityField';

/** "Show score on student report" on the assessment page (#407): changeable at any time, even after students have sat it. */
export function AssessmentScoreSetting({ assessmentId, assessmentMode }) {
  const [state, setState] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    teacherApi.getScoreVisibility(assessmentId)
      .then((res) => setState(res.data))
      .catch(() => setState(null));
  }, [assessmentId]);

  if (!state) return null;

  const change = async (value) => {
    setMessage('');
    try {
      const res = await teacherApi.setScoreVisibility(assessmentId, value);
      setState((prev) => ({ ...prev, scoreVisibility: value, effective: res.data.effective }));
      setMessage('Saved. Student reports will use this setting.');
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Could not save the setting'));
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg max-w-xl">
      <ScoreVisibilityField
        value={state.scoreVisibility}
        assessmentMode={assessmentMode}
        schoolDefault={state.default}
        onChange={change}
      />
      {message && <p className="text-xs text-gray-600 mt-2">{message}</p>}
    </div>
  );
}

export default AssessmentScoreSetting;
