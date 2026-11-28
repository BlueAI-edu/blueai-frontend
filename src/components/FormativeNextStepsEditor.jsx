// Teacher review of the formative report's next-step tasks and misconceptions
// (#407). Controlled: the page saves these with the rest of the feedback.
const BANNED = /\b(review|revise|re-?study|go over|look over|re-?read)/i;

export function FormativeNextStepsEditor({ tasks, onTasksChange, misconceptions, onMisconceptionsChange }) {
  const setTask = (i, text) => onTasksChange(tasks.map((t, idx) => (idx === i ? text : t)));
  const setMisconception = (i, field, text) =>
    onMisconceptionsChange(misconceptions.map((m, idx) => (idx === i ? { ...m, [field]: text } : m)));

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-blue-700 mb-1">📝 Next-step tasks (student answers in red pen)</label>
        <p className="text-xs text-gray-500 mb-2">
          One or two short written tasks that make the student use the correct idea. Avoid "review" or "revise".
        </p>
        {tasks.map((task, i) => (
          <div key={i} className="mb-2">
            <div className="flex gap-2">
              <span className="text-sm text-gray-500 pt-2">{i + 1}.</span>
              <textarea
                value={task}
                onChange={(e) => setTask(i, e.target.value)}
                rows={3}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={() => onTasksChange(tasks.filter((_, idx) => idx !== i))}
                className="text-sm text-gray-400 hover:text-red-600 self-start pt-2"
                aria-label={`Remove task ${i + 1}`}
              >
                Remove
              </button>
            </div>
            {BANNED.test(task) && (
              <p className="text-xs text-amber-700 ml-6 mt-1">
                This asks the student to review or revise. Set a task they write instead, so there is evidence of response.
              </p>
            )}
          </div>
        ))}
        {tasks.length < 2 && (
          <button type="button" onClick={() => onTasksChange([...tasks, ''])} className="text-sm text-blue-600 hover:text-blue-700">
            + Add task
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-red-700 mb-1">⚠️ Misconceptions to fix</label>
        <p className="text-xs text-gray-500 mb-2">
          What the student wrote, and the correct idea. Shown on the report only when there is at least one.
        </p>
        {misconceptions.length === 0 && <p className="text-sm text-gray-400 mb-2">None detected.</p>}
        {misconceptions.map((m, i) => (
          <div key={i} className="grid gap-2 md:grid-cols-[1fr_1fr_auto] mb-2">
            <input
              value={m.student_wrote || ''}
              onChange={(e) => setMisconception(i, 'student_wrote', e.target.value)}
              placeholder="What the student wrote"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              value={m.correction || ''}
              onChange={(e) => setMisconception(i, 'correction', e.target.value)}
              placeholder="What is correct"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              type="button"
              onClick={() => onMisconceptionsChange(misconceptions.filter((_, idx) => idx !== i))}
              className="text-sm text-gray-400 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onMisconceptionsChange([...misconceptions, { question: '', student_wrote: '', correction: '', tag: '' }])}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          + Add misconception
        </button>
      </div>
    </div>
  );
}

export default FormativeNextStepsEditor;
