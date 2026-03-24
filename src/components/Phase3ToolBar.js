const Phase3ToolBar = ({
  question,
  showGraphPlotter,
  onToggleGraphPlotter,
  useStepByStep,
  onToggleStepByStep,
  onShowFormulaSheet,
}) => {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <button
        onClick={onShowFormulaSheet}
        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium text-sm flex items-center gap-2"
      >
        Formula Sheet
      </button>

      {(question.answer_type === 'maths' || question.answer_type === 'mixed') && (
        <>
          <button
            onClick={onToggleGraphPlotter}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm flex items-center gap-2"
          >
            {showGraphPlotter ? 'Hide' : 'Show'} Graph Plotter
          </button>

          <button
            onClick={onToggleStepByStep}
            className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 ${
              useStepByStep
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {useStepByStep ? 'Using' : 'Use'} Step-by-Step Mode
          </button>
        </>
      )}
    </div>
  );
};

export default Phase3ToolBar;
