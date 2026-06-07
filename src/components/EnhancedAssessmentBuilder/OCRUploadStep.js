
/**
 * OCRUploadStep
 *
 * Renders the "Upload Exam Documents" panel shown during Step 3 of the
 * Enhanced Assessment Builder when the mode is OCR_GENERATED_GCSE_PAST_PAPER
 * and ocrReviewState === 'uploading'.
 *
 * All state is owned by EnhancedAssessmentBuilderPage and passed in as props —
 * this component contains no local state or side-effects.
 */
const OCRUploadStep = ({
  // File state
  questionPaperFile,
  markSchemeFile,
  // Error state
  questionPaperError,
  markSchemeError,
  extractError,
  // Extraction progress state
  extracting,
  extractProgress,
  extractStuck,
  // Handlers
  onQuestionPaperChange,
  onMarkSchemeChange,
  onExtract,
  onRemoveQuestionPaper,
  onRemoveMarkScheme,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Upload Exam Documents</h3>
        <p className="text-sm text-gray-500 mt-1">
          Upload the question paper to extract questions automatically. Adding the mark scheme enables AI to pre-fill mark schemes for each question. PDF files only.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Question Paper */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Question Paper PDF <span className="text-gray-400 font-normal">(primary)</span></label>
          <label className={`flex flex-col items-center justify-center w-full py-6 border-2 border-dashed rounded-lg transition-colors ${
            extracting ? 'cursor-not-allowed opacity-60' :
            questionPaperFile ? 'border-green-400 bg-green-50 hover:bg-green-100 cursor-pointer' :
            'border-orange-300 bg-orange-50 hover:border-orange-400 hover:bg-orange-100 cursor-pointer'
          }`}>
            <span className="text-3xl mb-1">{questionPaperFile ? '✅' : '📄'}</span>
            <span className="font-medium text-sm text-gray-800 text-center px-2">
              {questionPaperFile ? questionPaperFile.name : 'Click to upload question paper'}
            </span>
            <span className="text-xs text-gray-500 mt-1">PDF only — up to 50 MB</span>
            <input type="file" accept=".pdf" className="hidden" disabled={extracting} onChange={onQuestionPaperChange} />
          </label>
          {questionPaperError && (
            <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{questionPaperError}</p>
          )}
          {questionPaperFile && !extracting && (
            <button onClick={onRemoveQuestionPaper} className="mt-1 text-xs text-gray-400 hover:text-red-500 underline">Remove</button>
          )}
        </div>

        {/* Mark Scheme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mark Scheme PDF <span className="text-gray-400 font-normal">(optional — pre-fills mark schemes)</span></label>
          <label className={`flex flex-col items-center justify-center w-full py-6 border-2 border-dashed rounded-lg transition-colors ${
            extracting ? 'cursor-not-allowed opacity-60' :
            markSchemeFile ? 'border-green-400 bg-green-50 hover:bg-green-100 cursor-pointer' :
            'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 cursor-pointer'
          }`}>
            <span className="text-3xl mb-1">{markSchemeFile ? '✅' : '📋'}</span>
            <span className="font-medium text-sm text-gray-800 text-center px-2">
              {markSchemeFile ? markSchemeFile.name : 'Click to upload mark scheme'}
            </span>
            <span className="text-xs text-gray-500 mt-1">PDF only — enables mark scheme pre-fill</span>
            <input type="file" accept=".pdf" className="hidden" disabled={extracting} onChange={onMarkSchemeChange} />
          </label>
          {markSchemeError && (
            <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{markSchemeError}</p>
          )}
          {markSchemeFile && !extracting && (
            <button onClick={onRemoveMarkScheme} className="mt-1 text-xs text-gray-400 hover:text-red-500 underline">Remove</button>
          )}
        </div>
      </div>

      {!questionPaperFile && markSchemeFile && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            ⚠️ No question paper uploaded. AI will infer questions from the mark scheme only — question text will be placeholder text that you must fill in manually after extraction.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-gray-500">
          {questionPaperFile && markSchemeFile ? '✓ Question paper + mark scheme ready' :
           questionPaperFile ? '✓ Question paper ready' :
           markSchemeFile ? '⚠ Mark scheme only' : 'No files selected'}
        </span>
        <button
          onClick={onExtract}
          disabled={extracting || (!questionPaperFile && !markSchemeFile)}
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
        >
          {extracting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Extracting…
            </>
          ) : (
            '🔍 Extract Questions'
          )}
        </button>
      </div>

      {extracting && (
        <div className="pt-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Extracting questions from PDF…</span>
            <span>{extractProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${extractProgress}%` }}
            />
          </div>
          {extractStuck && (
            <p className="mt-2 text-xs font-medium text-amber-700 flex items-center gap-1.5">
              <span>⚠</span>
              Large papers can take a while — do not refresh this page or your upload will be lost.
            </p>
          )}
        </div>
      )}

      {extractError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{extractError}</p>
      )}

      {!extracting && !questionPaperFile && !markSchemeFile && (
        <p className="text-sm text-gray-400 text-center">Upload at least one document above, then click Extract Questions to begin.</p>
      )}
    </div>
  );
};

export default OCRUploadStep;
