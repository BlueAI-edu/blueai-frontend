// "Show score on student report" (#407). Empty value = the school's default
// for this assessment type (Hide for formative, Show otherwise, unless the
// school has changed it).
export const SCORE_VISIBILITY_LABELS = {
  show: 'Show',
  hide: 'Hide',
  after_response: 'Show after next-step response',
};

const FORMATIVE_MODE = 'FORMATIVE_SINGLE_LONG_RESPONSE';

export default function ScoreVisibilityField({ value, assessmentMode, onChange, schoolDefault, disabled = false }) {
  const typeDefault = schoolDefault || (assessmentMode === FORMATIVE_MODE ? 'hide' : 'show');
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Show score on student report</label>
      <select
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60"
      >
        <option value="">School default ({SCORE_VISIBILITY_LABELS[typeDefault]})</option>
        <option value="show">{SCORE_VISIBILITY_LABELS.show}</option>
        <option value="hide">{SCORE_VISIBILITY_LABELS.hide}</option>
        <option value="after_response">{SCORE_VISIBILITY_LABELS.after_response}</option>
      </select>
      <p className="text-xs text-gray-400 mt-1">
        Hidden scores are left off the student's report so they focus on the feedback. You always see the marks,
        and analytics are unaffected. "After next-step response" releases the score once you mark their response as done.
      </p>
    </div>
  );
}
