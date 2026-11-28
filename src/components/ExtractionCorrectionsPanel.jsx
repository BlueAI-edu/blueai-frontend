import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/services/api';
import { getApiErrorMessage } from '@/lib/handle-error';

// Field names as teachers would recognise them in the Past Paper review screen.
const FIELD_LABELS = {
  questionBody: 'Question text',
  partPrompt: 'Part text',
  maxMarks: 'Marks',
  markScheme: 'Mark scheme',
  levelDescriptors: 'Level descriptors',
  questionType: 'Question type',
  answerType: 'Answer type',
  topic: 'Topic',
  options: 'Multiple-choice options',
  stimulusBlock: 'Diagram',
  partStimulus: 'Part diagram',
  question: 'Whole question added/removed',
  part: 'Part added/removed',
};

/**
 * Past Paper extraction corrections (#350): what teachers changed after the
 * extraction, so recurring extraction problems can be found. Platform admins only.
 */
export function ExtractionCorrectionsPanel() {
  const [sinceDays, setSinceDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (days) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getExtractionCorrectionsSummary({ since_days: days });
      setSummary(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load extraction corrections'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(sinceDays);
  }, [load, sinceDays]);

  const download = async () => {
    setDownloading(true);
    try {
      const res = await adminApi.exportExtractionCorrections({ since_days: sinceDays });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `extraction_corrections_last_${sinceDays}_days.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not export extraction corrections'));
    } finally {
      setDownloading(false);
    }
  };

  const maxCount = Math.max(1, ...(summary?.by_field || []).map((r) => r.count));

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Past Paper Extraction Corrections</h3>
          <p className="text-xs text-gray-500 mt-1">
            Fields teachers corrected after a past paper was extracted. Logged automatically when they save.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sinceDays}
            onChange={(e) => setSinceDays(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <button
            onClick={download}
            disabled={downloading || !summary?.total}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {downloading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        {loading && !summary ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : !summary?.total ? (
          <p className="text-sm text-gray-400">No corrections logged in this period.</p>
        ) : (
          <>
            <p className="text-sm text-gray-700 mb-4">
              <span className="font-semibold">{summary.total}</span> corrected field
              {summary.total === 1 ? '' : 's'} across{' '}
              <span className="font-semibold">{summary.papers}</span> paper{summary.papers === 1 ? '' : 's'}.
            </p>
            <div className="space-y-2">
              {summary.by_field.map((row) => (
                <div key={row.field} className="flex items-center gap-3 text-sm">
                  <span className="w-48 shrink-0 text-gray-700">{FIELD_LABELS[row.field] || row.field}</span>
                  <div className="flex-1 bg-gray-100 rounded h-2">
                    <div className="bg-blue-500 h-2 rounded" style={{ width: `${(row.count / maxCount) * 100}%` }} />
                  </div>
                  <span className="w-10 text-right text-gray-600">{row.count}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ExtractionCorrectionsPanel;
