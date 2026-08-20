import { Component } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary
 * Catches React rendering errors before they crash the entire app.
 * Displays a user-friendly error UI with retry functionality.
 *
 * Catches:
 * - Component rendering errors
 * - Lifecycle method errors
 * - Constructor errors
 * - Render method errors
 *
 * Does NOT catch:
 * - Event handlers (use try/catch instead)
 * - Async code (use .catch() instead)
 * - Server-side rendering errors
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // Update state with error details
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Optional: Send error to logging service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Full page reload as last resort
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorCount } = this.state;
      const isChunkLoadError = error?.message?.includes('Loading chunk');
      const errorMessage = isChunkLoadError
        ? 'A required file failed to load. This usually happens when the app updates. Please refresh to get the latest version.'
        : error?.message || 'Something went wrong. Please try refreshing the page.';

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-200 p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {isChunkLoadError ? 'Update Available' : 'Oops, Something Went Wrong'}
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 text-center mb-6">
              {errorMessage}
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg border border-gray-300">
                <p className="text-xs font-mono text-gray-700 break-words">
                  {error?.toString()}
                </p>
              </div>
            )}

            {/* Error Count Warning */}
            {errorCount > 2 && (
              <div className="mb-6 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Multiple errors detected.</strong> If this persists, please:
                  <br />
                  1. Clear your browser cache
                  <br />
                  2. Close and reopen your browser
                  <br />
                  3. Contact support if the issue continues
                </p>
              </div>
            )}

            {/* Retry Button */}
            <button
              onClick={this.handleRetry}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {isChunkLoadError ? 'Refresh Page' : 'Try Again'}
            </button>

            {/* Help Text */}
            <p className="text-xs text-gray-500 text-center mt-4">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;