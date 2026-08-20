import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * PanelErrorState
 * Renders a consistent, visually distinct error state for any data-dependent panel.
 * - Distinct styling: red/orange border, red icon, subtle background
 * - Always includes a retry button
 * - Customizable error message and title
 * - No full-page collapse; sits within the panel layout
 */
export const PanelErrorState = ({
  title = 'Could not load this section',
  message = 'Please check your connection and try again.',
  onRetry,
  icon: Icon = AlertCircle,
  retryLabel = 'Retry',
  testId = 'panel-error-state',
  loading = false
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 gap-3 text-center border border-red-200 bg-red-50/40 rounded-lg"
      data-testid={testId}
    >
      <Icon className="w-8 h-8 text-red-500" />
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
          data-testid="panel-retry-button"
        >
          <RefreshCw className="w-3.5 h-3.5" /> {retryLabel}
        </button>
      )}
    </div>
  );
};