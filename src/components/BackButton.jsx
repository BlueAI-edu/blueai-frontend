import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ to, label }) {
  if (!to) return null;

  return (
    <Link
      to={to}
      className="text-sm font-semibold text-gray-800 hover:text-blue-600 mb-4 inline-flex items-center gap-1.5 transition-colors"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
      {label}
    </Link>
  );
}