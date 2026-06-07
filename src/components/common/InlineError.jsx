export default function InlineError({ message, className = '' }) {
  if (!message) return null;
  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg ${className}`}>
      {message}
    </div>
  );
}

export function InlineSuccess({ message, className = '' }) {
  if (!message) return null;
  return (
    <div className={`bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg ${className}`}>
      {message}
    </div>
  );
}

export function InlineWarning({ message, className = '' }) {
  if (!message) return null;
  return (
    <div className={`bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-lg ${className}`}>
      {message}
    </div>
  );
}
