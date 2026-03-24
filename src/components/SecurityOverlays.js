const SecurityOverlays = ({
  showWarningModal,
  showFullscreenPrompt,
  showFeedback,
  fullscreenSupported,
  fullscreenExitCount,
  isLockedOut,
  warningMessage,
  onEnterFullscreen,
  onDismissWarning,
}) => {
  // Warning modal for fullscreen violations
  if (showWarningModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" data-testid="warning-modal">
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
          <div className={`w-16 h-16 ${isLockedOut ? 'bg-red-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <svg className={`w-8 h-8 ${isLockedOut ? 'text-red-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold ${isLockedOut ? 'text-red-600' : 'text-yellow-600'} mb-2`}>
            {isLockedOut ? 'Assessment Terminated' : 'Security Warning'}
          </h2>
          <p className="text-gray-700 mb-6">{warningMessage}</p>
          {!isLockedOut && (
            <button
              onClick={onDismissWarning}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              data-testid="acknowledge-warning-btn"
            >
              I Understand - Return to Fullscreen
            </button>
          )}
          {isLockedOut && (
            <p className="text-sm text-gray-500">Redirecting in 3 seconds...</p>
          )}
        </div>
      </div>
    );
  }

  // Fullscreen prompt overlay
  if (showFullscreenPrompt && !showFeedback && fullscreenSupported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" data-testid="fullscreen-prompt">
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fullscreen Required</h2>
          <p className="text-gray-600 mb-6">
            This assessment must be taken in fullscreen mode to ensure exam integrity.
            Please click the button below to enter fullscreen.
          </p>
          {fullscreenExitCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                <strong>Warnings: {fullscreenExitCount}/3</strong> - {3 - fullscreenExitCount} attempt(s) remaining before automatic submission.
              </p>
            </div>
          )}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Exiting fullscreen 3 times will automatically submit your assessment and log you out.
            </p>
          </div>
          <button
            onClick={onEnterFullscreen}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            data-testid="enter-fullscreen-btn"
          >
            Enter Fullscreen Mode
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default SecurityOverlays;
