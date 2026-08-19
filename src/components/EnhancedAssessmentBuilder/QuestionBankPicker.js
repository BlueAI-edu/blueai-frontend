import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API } from '@/config';
import { getApiErrorMessage } from '@/lib/handle-error';
import { useAsync } from '@/hooks/use-async';

/**
 * Question Bank picker for the assessment builder (#237).
 *
 * Lets a teacher select existing bank questions and inject them into the
 * assessment being built. Selected questions are converted server-side
 * (POST /teacher/questions/to-enhanced, services/question_bank_service.py)
 * into EnhancedQuestion-shaped copies — the original bank entries are never
 * touched, so the teacher is free to edit the injected copies afterwards via
 * the normal QuestionEditor.
 */
const QuestionBankPicker = ({ onQuestionsAdded, onCancel }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [runAdd, adding] = useAsync();
  const [addError, setAddError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get(`${API}/teacher/questions`);
        setQuestions(response.data || []);
      } catch (err) {
        setLoadError(getApiErrorMessage(err, 'Failed to load the question bank'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const subjects = useMemo(
    () => Array.from(new Set(questions.map((q) => q.subject).filter(Boolean))).sort(),
    [questions]
  );

  const filtered = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (subjectFilter !== 'all' && q.subject !== subjectFilter) return false;
      if (!searchLower) return true;
      return (
        q.question_text?.toLowerCase().includes(searchLower) ||
        q.topic?.toLowerCase().includes(searchLower) ||
        q.subject?.toLowerCase().includes(searchLower)
      );
    });
  }, [questions, search, subjectFilter]);

  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    setAddError('');
    runAdd(
      async () => {
        const response = await axios.post(`${API}/teacher/questions/to-enhanced`, {
          question_ids: Array.from(selectedIds),
        });
        onQuestionsAdded(response.data.questions);
      },
      (err) => setAddError(getApiErrorMessage(err, 'Failed to add selected questions'))
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-1">📚 Add from Question Bank</h3>
        <p className="text-sm text-gray-600">
          Select existing questions to reuse. Each one is copied into this assessment — you can
          still edit it afterwards without changing the original bank question.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by text, topic, or subject..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading question bank...</div>
      ) : loadError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{loadError}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No questions match your search.</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.map((q) => (
            <label
              key={q.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedIds.has(q.id) ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(q.id)}
                onChange={() => toggleSelection(q.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 mb-1">
                  <span className="font-medium text-gray-700">{q.subject}</span>
                  {q.topic && <span>· {q.topic}</span>}
                  <span>· {q.max_marks} mark{q.max_marks !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-sm text-gray-900 truncate">{q.question_text}</p>
              </div>
            </label>
          ))}
        </div>
      )}

      {addError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{addError}</div>
      )}

      <div className="flex justify-between items-center pt-2">
        <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={selectedIds.size === 0 || adding}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg hover:from-emerald-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {adding ? 'Adding...' : `Add Selected (${selectedIds.size})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionBankPicker;
