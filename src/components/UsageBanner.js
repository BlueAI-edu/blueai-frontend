import { useState, useEffect, useCallback } from 'react';
import { teacherApi } from '@/services/api';

const ACCOUNT_TYPE_LABELS = {
  free_tester: 'Free Trial',
  paid: 'Paid',
  extended: 'Extended',
  pilot: 'Pilot',
  internal: 'Internal',
};

function UsageMeter({ label, used, allowance, remaining, warning }) {
  const pct = allowance > 0 ? Math.min(100, Math.round((used / allowance) * 100)) : 0;
  const color =
    remaining === 0 ? 'bg-red-500' :
    pct >= 80 ? 'bg-amber-500' :
    'bg-blue-500';

  return (
    <div className="flex-1 min-w-[140px]">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className={`text-xs font-semibold ${remaining === 0 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-gray-700'}`}>
          {remaining} left
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {warning && (
        <p className="text-xs text-amber-600 mt-0.5">{warning}</p>
      )}
    </div>
  );
}

export default function UsageBanner() {
  const [quota, setQuota] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(false);

  const loadQuota = useCallback(async () => {
    try {
      const res = await teacherApi.getUsage();
      setQuota(res.data);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    loadQuota();
  }, [loadQuota]);

  if (dismissed || error || !quota) return null;

  // Unlimited accounts — show a simple badge, no meters
  if (quota.is_unlimited) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center justify-between text-sm mb-4">
        <span className="text-green-700 font-medium">
          {ACCOUNT_TYPE_LABELS[quota.account_type] || quota.account_type} account — unlimited usage
        </span>
        <button onClick={() => setDismissed(true)} className="text-green-500 hover:text-green-700 ml-4">✕</button>
      </div>
    );
  }

  const anyLimitReached = quota.ocr_pages_remaining === 0 || quota.ai_marking_remaining === 0 || quota.pdf_exports_remaining === 0;
  const trialExpired = quota.trial_expired;
  const trialWarning = !trialExpired && quota.days_remaining !== null && quota.days_remaining <= 5;

  if (trialExpired) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 flex items-start justify-between mb-4">
        <div>
          <p className="text-red-700 font-semibold text-sm">Your free tester access has ended.</p>
          <p className="text-red-600 text-xs mt-0.5">
            You can still view existing assessments and results. Contact your admin to request an extension.
          </p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-red-400 hover:text-red-600 ml-4 mt-0.5">✕</button>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border px-4 py-3 mb-4 ${anyLimitReached ? 'bg-red-50 border-red-200' : trialWarning ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${anyLimitReached ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
            {ACCOUNT_TYPE_LABELS[quota.account_type] || quota.account_type}
          </span>
          {quota.days_remaining !== null && (
            <span className={`text-xs ${trialWarning ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
              {quota.days_remaining === 0
                ? 'Trial expires today'
                : `${quota.days_remaining} day${quota.days_remaining !== 1 ? 's' : ''} remaining`}
            </span>
          )}
        </div>
        <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <UsageMeter
          label="OCR Pages"
          used={quota.ocr_pages_used}
          allowance={quota.ocr_pages_allowance}
          remaining={quota.ocr_pages_remaining}
        />
        <UsageMeter
          label="AI Marking"
          used={quota.ai_marking_runs_used}
          allowance={quota.ai_marking_allowance}
          remaining={quota.ai_marking_remaining}
        />
        <UsageMeter
          label="PDF Exports"
          used={quota.pdf_exports_used}
          allowance={quota.pdf_export_allowance}
          remaining={quota.pdf_exports_remaining}
        />
      </div>

      {anyLimitReached && (
        <p className="text-xs text-red-600 mt-2">
          One or more limits reached. Contact your admin to extend your allowance.
        </p>
      )}
    </div>
  );
}
