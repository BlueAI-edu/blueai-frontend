import { API } from "@/config";

const AttemptFeedbackView = ({ attempt, question, attemptId }) => {
  const feedbackReleased = attempt.feedback_released || false;

  if (!feedbackReleased) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div
          className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8"
          data-testid="submission-confirmation"
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Submission Received!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you, {attempt.student_name}
            </p>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-gray-700">
                Your answer has been submitted successfully and is being
                reviewed by your teacher.
              </p>
              <p className="text-gray-700 mt-4">
                Your teacher will review your work and release feedback when
                ready. Please check back later or wait for your teacher to share
                the results with you.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div
        className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8"
        data-testid="feedback-container"
      >
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1
            className="text-3xl font-bold text-gray-900 mb-2"
            data-testid="feedback-title"
          >
            Feedback for {attempt.student_name}
          </h1>
          <p className="text-gray-600">Your answer has been marked</p>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Your Score</p>
            <p
              className="text-4xl font-bold text-blue-600"
              data-testid="feedback-score"
            >
              {attempt.score}/{question.max_marks}
            </p>
          </div>

          <div>
            <h3
              className="text-lg font-semibold text-gray-900 mb-2"
              data-testid="www-title"
            >
              What Went Well
            </h3>
            <p className="text-gray-700" data-testid="www-content">
              {attempt.www}
            </p>
          </div>

          <div>
            <h3
              className="text-lg font-semibold text-gray-900 mb-2"
              data-testid="next-steps-title"
            >
              Next Steps
            </h3>
            <p className="text-gray-700" data-testid="next-steps-content">
              {attempt.next_steps}
            </p>
          </div>

          <div>
            <h3
              className="text-lg font-semibold text-gray-900 mb-2"
              data-testid="overall-title"
            >
              Overall Feedback
            </h3>
            <p className="text-gray-700" data-testid="overall-content">
              {attempt.overall_feedback}
            </p>
          </div>

          {/* Step-by-Step Feedback */}
          {attempt.step_feedback && attempt.step_feedback.step_feedback && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Step-by-Step Feedback
              </h3>
              <div className="space-y-3">
                {attempt.step_feedback.step_feedback.map((step, idx) => (
                  <div
                    key={idx}
                    className={`border-l-4 p-4 rounded ${
                      step.isCorrect === true
                        ? "bg-green-50 border-green-500"
                        : step.isCorrect === false
                          ? "bg-red-50 border-red-500"
                          : "bg-yellow-50 border-yellow-500"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-900">
                        Step {step.stepNumber}:
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{step.feedback}</p>
                        {step.marks !== undefined && (
                          <p className="text-xs text-gray-600 mt-1">
                            Marks: {step.marks}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {attempt.pdf_url && (
            <div className="pt-4">
              <a
                href={`${API}/public/attempt/${attemptId}/download-pdf`}
                download
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                data-testid="download-pdf-btn"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Feedback PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttemptFeedbackView;
