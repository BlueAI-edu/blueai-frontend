import { useEffect, useState } from 'react';
import { adminApi } from '@/services/api';
import { getApiErrorMessage } from '@/lib/handle-error';
import { SCORE_VISIBILITY_LABELS } from '@/components/EnhancedAssessmentBuilder/ScoreVisibilityField';

const TYPES = [
  { key: 'formative', label: 'Formative tasks' },
  { key: 'summative', label: 'Summative tests and past papers' },
];

/** School-wide default for "Show score on student report" (#407). Teachers can override it per assessment. */
export function SchoolReportSettingsPanel() {
  const [defaults, setDefaults] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    adminApi.getSchoolSettings()
      .then((res) => setDefaults(res.data.score_visibility_defaults))
      .catch((err) => setMessage(getApiErrorMessage(err, 'Could not load report settings')));
  }, []);

  const save = async (key, value) => {
    const next = { ...defaults, [key]: value };
    setDefaults(next);
    setSaving(true);
    setMessage('');
    try {
      const res = await adminApi.updateSchoolSettings({ score_visibility_defaults: { [key]: value } });
      setDefaults(res.data.score_visibility_defaults);
      setMessage('Saved.');
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Could not save report settings'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900">Student report settings</h2>
      <p className="text-sm text-gray-500 mt-1 mb-4">
        Default for "Show score on student report". Teachers can change it for any assessment.
      </p>
      {!defaults ? (
        <p className="text-sm text-gray-400">{message || 'Loading...'}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {TYPES.map(({ key, label }) => (
            <label key={key} className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
              <select
                value={defaults[key]}
                disabled={saving}
                onChange={(e) => save(key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {Object.entries(SCORE_VISIBILITY_LABELS).map(([value, text]) => (
                  <option key={value} value={value}>{text}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
      {defaults && message && <p className="text-sm text-gray-500 mt-3">{message}</p>}
    </div>
  );
}

export default SchoolReportSettingsPanel;
