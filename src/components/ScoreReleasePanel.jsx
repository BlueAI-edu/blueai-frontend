import { useEffect, useState } from 'react';
import { teacherApi } from '@/services/api';
import { getApiErrorMessage } from '@/lib/handle-error';
import { SCORE_VISIBILITY_LABELS } from '@/components/EnhancedAssessmentBuilder/ScoreVisibilityField';

/**
 * What the student sees on their report (#407 "Show score on student report"),
 * and, for "Show after next-step response", the actions that release the score.
 */
export function ScoreReleasePanel({ assessmentId, attempt, onChanged }) {
  const [effective, setEffective] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    teacherApi.getScoreVisibility(assessmentId)
      .then((res) => live && setEffective(res.data.effective))
      .catch(() => live && setEffective(null));
    return () => { live = false; };
  }, [assessmentId]);

  if (!effective || attempt.status !== 'marked') return null;

  const released = Boolean(attempt.score_released);
  const visible = effective === 'show' || (effective === 'after_response' && released);

  const act = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      onChanged?.();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update the score release'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Score on the student report</h3>
      <p className="text-sm text-gray-600">
        Setting: <span className="font-medium">{SCORE_VISIBILITY_LABELS[effective]}</span>.{' '}
        {visible
          ? 'The student can see their marks.'
          : 'The student sees the feedback and tasks, but not the marks.'}
      </p>
      {effective === 'after_response' && (
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => act(() => teacherApi.setNextStepResponse(attempt.attempt_id, !attempt.next_step_response_done))}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {attempt.next_step_response_done ? 'Mark response as not done' : 'Next-step response done (release score)'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => act(() => teacherApi.releaseScore(attempt.attempt_id, !released))}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            {released ? 'Withdraw score' : 'Release score now'}
          </button>
          {attempt.next_step_response_done && <span className="text-sm text-green-700">Response marked as done</span>}
        </div>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}

export default ScoreReleasePanel;
