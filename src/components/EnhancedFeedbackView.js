import { toBulletList } from '@/lib/feedback-format';

const EnhancedFeedbackView = ({ attempt, assessment }) => {
  const feedbackReleased = attempt.feedback_released || false;
  const isFormative = assessment.assessmentMode === 'FORMATIVE_SINGLE_LONG_RESPONSE';

  if (!feedbackReleased) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Submission Received!</h1>
            <p className="text-lg text-gray-600 mb-6">Thank you, {attempt.student_name}</p>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-gray-700">
                Your answers have been submitted successfully and are being reviewed by your teacher.
              </p>
              <p className="text-gray-700 mt-4">
                Your teacher will review your work and release feedback when ready. Please check back later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{isFormative ? 'Formative Feedback' : 'Assessment Results'}</h1>

          {attempt.score != null && !attempt.score_hidden && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 mb-1">
                {isFormative ? 'Marks Awarded' : 'Your Score'}
              </p>
              <p className={`${isFormative ? 'text-2xl' : 'text-4xl'} font-bold text-blue-600`}>
                {attempt.score} / {assessment.totalMarks}
              </p>
            </div>
          )}

         {attempt.www && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-green-700 mb-2">What went well</h3>
              <div className="text-gray-700">
                {toBulletList(attempt.www).map((item, i) => (
                  <p key={i}>• {item}</p>
                ))}
              </div>
            </div>
          )}

          {attempt.next_steps && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-orange-700 mb-2">Even better if</h3>
              <div className="text-gray-700">
                {toBulletList(attempt.next_steps).map((item, i) => (
                  <p key={i}>• {item}</p>
                ))}
              </div>
            </div>
          )}

          {isFormative && attempt.misconceptions_to_fix?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-red-700 mb-2">Misconceptions to fix</h3>
              <div className="text-gray-700 space-y-2">
                {attempt.misconceptions_to_fix.map((m, i) => (
                  <p key={i}>
                    <span className="text-red-700">"{m.student_wrote}"</span> → {m.correction}
                  </p>
                ))}
              </div>
            </div>
          )}

          {isFormative && attempt.next_step_targets?.length > 0 && (
            <div className="mb-6 border-2 border-blue-600 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-1">Your next steps</h3>
              <p className="text-sm font-semibold text-red-700 mb-2">Answer these on your feedback sheet in red pen.</p>
              <ol className="list-decimal ml-5 text-gray-700 space-y-1">
                {attempt.next_step_targets.map((task, i) => (
                  <li key={i}>{task}</li>
                ))}
              </ol>
            </div>
          )}

          {!isFormative && attempt.overall_feedback && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-700 mb-2">Overall Feedback</h3>
              <div className="text-gray-700">
                {toBulletList(attempt.overall_feedback).map((item, i) => (
                  <p key={i}>• {item}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedFeedbackView;
