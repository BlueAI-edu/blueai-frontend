import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ConfidenceBadge({ confidence, size = 'default', showLabel = true }) {
  const confidencePercent = (confidence * 100).toFixed(0);
  
  const getConfidenceLevel = () => {
    if (confidence >= 0.95) return 'high';
    if (confidence >= 0.80) return 'medium';
    return 'low';
  };

  const level = getConfidenceLevel();

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    default: 'px-3 py-1 text-sm',
    large: 'px-4 py-1.5 text-base'
  };

  const levelConfig = {
    high: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      hover: 'hover:bg-emerald-200',
      icon: '✓'
    },
    medium: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-300',
      hover: 'hover:bg-amber-200',
      icon: '!'
    },
    low: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
      hover: 'hover:bg-red-200',
      icon: '⚠'
    }
  };

  const config = levelConfig[level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-full border transition-colors",
        config.bg,
        config.text,
        config.border,
        config.hover,
        sizeClasses[size]
      )}
      title={`Confidence: ${confidencePercent}%`}
    >
      {level !== 'high' && (
        <span className="font-bold text-sm">{config.icon}</span>
      )}
      {showLabel && (
        <>
          <span>{confidencePercent}%</span>
          {level === 'high' && (
            <span className="text-xs">{config.icon}</span>
          )}
        </>
      )}
      {!showLabel && level !== 'high' && (
        <span>{confidencePercent}%</span>
      )}
    </span>
  );
}