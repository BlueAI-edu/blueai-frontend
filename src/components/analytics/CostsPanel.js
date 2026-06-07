import { useState, useEffect } from 'react';
import { teacherApi } from '@/services/api';

const ACCOUNT_TYPE_LABELS = {
  free_tester: 'Free Trial',
  paid: 'Paid',
  starter: 'Starter',
  professional: 'Professional',
  department: 'Department',
  school: 'School',
  enterprise: 'Enterprise',
  extended: 'Extended',
  pilot: 'Pilot',
  internal: 'Internal',
};

// AI cost rates (£ per unit, mid-range estimates)
const COST_RATES = {
  ocr_per_page: 0.02,       // £0.02 per OCR page (GPT-4o Vision)
  marking_per_run: 0.02,    // £0.02 per AI marking run
  pdf_per_export: 0.00,     // PDF is local — no API cost
};

function UsageMeterBar({ label, used, allowance, remaining, isUnlimited }) {
  const pct = allowance > 0 ? Math.min(100, Math.round((used / allowance) * 100)) : 0;
  const color = remaining === 0 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500';
  const textColor = remaining === 0 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-blue-600';

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        {isUnlimited ? (
          <span className="text-teal-600 font-semibold">Unlimited</span>
        ) : (
          <span className={`font-semibold ${textColor}`}>
            {used.toLocaleString()} / {allowance.toLocaleString()}
            <span className="text-gray-400 font-normal ml-1">({remaining.toLocaleString()} left)</span>
          </span>
        )}
      </div>
      {!isUnlimited && (
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function CostRow({ label, used, rate, sublabel }) {
  const cost = (used * rate).toFixed(2);
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">£{cost}</p>
        <p className="text-xs text-gray-400">{used.toLocaleString()} × £{rate.toFixed(3)}</p>
      </div>
    </div>
  );
}

const CostsPanel = () => {
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    teacherApi.getUsage()
      .then(r => setQuota(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
      <p className="text-gray-600">Loading usage data...</p>
    </div>
  );

  if (error || !quota) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700 text-sm">
      Could not load usage data. Please refresh the page.
    </div>
  );

  const isUnlimited = quota.is_unlimited;

  // Cost estimates for current month
  const ocrCost     = quota.ocr_pages_used     * COST_RATES.ocr_per_page;
  const markingCost = quota.ai_marking_runs_used * COST_RATES.marking_per_run;
  const pdfCost     = 0; // local
  const totalThisMonth = ocrCost + markingCost + pdfCost;

  // Forecast: project current burn rate to full month
  // Use trial_start_date (or created_at) to estimate days elapsed
  const now = new Date();
  let daysElapsed = 30;
  if (quota.trial_end_date) {
    const endDate = new Date(quota.trial_end_date);
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    daysElapsed = Math.max(1, Math.round((now - startDate) / (1000 * 60 * 60 * 24)));
  }
  const daysInMonth = 30;
  const burnMultiplier = daysElapsed < daysInMonth ? daysInMonth / daysElapsed : 1;
  const forecastedMonth = totalThisMonth * burnMultiplier;

  // Tier pricing map
  const tierPricing = {
    free_tester: 0, starter: 19, professional: 39,
    department: 149, school: 349, paid: 0, internal: 0,
    extended: 0, pilot: 0, enterprise: 0,
  };
  const subscriptionCost = tierPricing[quota.account_type] ?? 0;
  const totalBill = subscriptionCost + totalThisMonth;
  const forecastedBill = subscriptionCost + forecastedMonth;

  const trialExpired = quota.trial_expired;
  const trialWarning = !trialExpired && quota.days_remaining !== null && quota.days_remaining <= 7;

  return (
    <div className="space-y-6">

      {/* Trial status banner */}
      {trialExpired && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-start gap-3">
          <div className="text-red-500 text-xl">⚠</div>
          <div>
            <p className="font-semibold text-red-700">Your free trial has expired</p>
            <p className="text-sm text-red-600 mt-0.5">
              You can still view existing assessments and results. Contact your admin to upgrade and restore full access.
            </p>
          </div>
        </div>
      )}
      {trialWarning && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
          <div className="text-amber-500 text-xl">⏳</div>
          <div>
            <p className="font-semibold text-amber-700">
              {quota.days_remaining === 0 ? 'Your trial expires today' : `${quota.days_remaining} day${quota.days_remaining !== 1 ? 's' : ''} left on your free trial`}
            </p>
            <p className="text-sm text-amber-600 mt-0.5">Upgrade to keep uninterrupted access after your trial ends.</p>
          </div>
        </div>
      )}

      {/* Account & subscription */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Account &amp; Subscription</h3>
        <p className="text-sm text-gray-500 mb-5">Your current plan and billing commitments</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Current Plan</p>
            <p className="text-2xl font-bold text-blue-800">{ACCOUNT_TYPE_LABELS[quota.account_type] || quota.account_type}</p>
            {subscriptionCost > 0 && (
              <p className="text-sm text-blue-600 mt-1">£{subscriptionCost}/month</p>
            )}
            {subscriptionCost === 0 && !isUnlimited && (
              <p className="text-sm text-blue-600 mt-1">No subscription cost</p>
            )}
            {isUnlimited && (
              <p className="text-sm text-teal-600 font-medium mt-1">Unlimited usage</p>
            )}
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">This Month's Bill</p>
            <p className="text-2xl font-bold text-green-800">£{totalBill.toFixed(2)}</p>
            <p className="text-xs text-green-600 mt-1">
              £{subscriptionCost.toFixed(2)} subscription + £{totalThisMonth.toFixed(2)} usage
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-xs text-purple-600 font-medium uppercase tracking-wide mb-1">Next Month Forecast</p>
            <p className="text-2xl font-bold text-purple-800">£{forecastedBill.toFixed(2)}</p>
            <p className="text-xs text-purple-600 mt-1">Based on {daysElapsed} day{daysElapsed !== 1 ? 's' : ''} of usage so far</p>
          </div>
        </div>

        {quota.trial_end_date && !isUnlimited && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {trialExpired ? 'Trial ended' : 'Trial ends'}:{' '}
              <span className={`font-medium ${trialExpired ? 'text-red-600' : trialWarning ? 'text-amber-600' : 'text-gray-700'}`}>
                {new Date(quota.trial_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </span>
            {!isUnlimited && quota.account_type === 'free_tester' && !trialExpired && (
              <span className="text-blue-600 font-medium">
                {quota.days_remaining !== null ? `${quota.days_remaining} day${quota.days_remaining !== 1 ? 's' : ''} remaining` : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Usage meters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Usage This Period</h3>
        <p className="text-sm text-gray-500 mb-5">Consumption against your plan limits</p>
        <div className="space-y-5">
          <UsageMeterBar
            label="AI Marking Runs"
            used={quota.ai_marking_runs_used}
            allowance={quota.ai_marking_allowance}
            remaining={quota.ai_marking_remaining}
            isUnlimited={isUnlimited}
          />
          <UsageMeterBar
            label="OCR Pages"
            used={quota.ocr_pages_used}
            allowance={quota.ocr_pages_allowance}
            remaining={quota.ocr_pages_remaining}
            isUnlimited={isUnlimited}
          />
          <UsageMeterBar
            label="PDF Exports"
            used={quota.pdf_exports_used}
            allowance={quota.pdf_export_allowance}
            remaining={quota.pdf_exports_remaining}
            isUnlimited={isUnlimited}
          />
        </div>

        {!isUnlimited && (
          <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
            <div>
              <p className="text-lg font-bold text-gray-800">{quota.max_assessments}</p>
              <p>Max assessments</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{quota.max_classes}</p>
              <p>Max classes</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{quota.days_remaining ?? '—'}</p>
              <p>Days remaining</p>
            </div>
          </div>
        )}
      </div>

      {/* Cost breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Cost Breakdown</h3>
        <p className="text-sm text-gray-500 mb-5">
          Estimated AI processing costs based on your usage.
          {isUnlimited ? ' Your plan absorbs these costs.' : ' These costs are covered by your subscription.'}
        </p>

        <div className="divide-y divide-gray-100">
          <CostRow
            label="AI Marking"
            used={quota.ai_marking_runs_used}
            rate={COST_RATES.marking_per_run}
            sublabel={`${quota.ai_marking_runs_used.toLocaleString()} submission${quota.ai_marking_runs_used !== 1 ? 's' : ''} marked`}
          />
          <CostRow
            label="OCR Processing"
            used={quota.ocr_pages_used}
            rate={COST_RATES.ocr_per_page}
            sublabel={`${quota.ocr_pages_used.toLocaleString()} page${quota.ocr_pages_used !== 1 ? 's' : ''} processed (includes past paper extraction)`}
          />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-800">PDF Report Generation</p>
              <p className="text-xs text-gray-500">{quota.pdf_exports_used.toLocaleString()} export{quota.pdf_exports_used !== 1 ? 's' : ''} — generated locally, no API cost</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">£0.00</p>
              <p className="text-xs text-gray-400">Included</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total AI costs this period</p>
            <p className="text-xs text-gray-400">Subscription fee not included</p>
          </div>
          <p className="text-xl font-bold text-gray-900">£{totalThisMonth.toFixed(2)}</p>
        </div>

        {subscriptionCost > 0 && (
          <div className="mt-3 flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-blue-800">Subscription ({ACCOUNT_TYPE_LABELS[quota.account_type]})</p>
              <p className="text-xs text-blue-600">Monthly recurring charge</p>
            </div>
            <p className="text-lg font-bold text-blue-800">£{subscriptionCost.toFixed(2)}</p>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between bg-gray-800 text-white rounded-lg px-4 py-3">
          <p className="font-semibold">Total estimated this month</p>
          <p className="text-xl font-bold">£{totalBill.toFixed(2)}</p>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Cost estimates: AI marking ~£0.02/run, OCR ~£0.02/page (GPT-4o Vision, mid-range). Actual API costs may vary with usage patterns. Figures are indicative only.
        </p>
      </div>

      {/* Forecast */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Next Month Forecast</h3>
        <p className="text-sm text-gray-500 mb-5">Projected usage based on your current burn rate ({daysElapsed} days of data)</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Forecasted AI Marking', count: Math.round(quota.ai_marking_runs_used * burnMultiplier), unit: 'runs', cost: Math.round(quota.ai_marking_runs_used * burnMultiplier) * COST_RATES.marking_per_run },
            { label: 'Forecasted OCR Pages', count: Math.round(quota.ocr_pages_used * burnMultiplier), unit: 'pages', cost: Math.round(quota.ocr_pages_used * burnMultiplier) * COST_RATES.ocr_per_page },
            { label: 'Forecasted PDF Exports', count: Math.round(quota.pdf_exports_used * burnMultiplier), unit: 'exports', cost: 0 },
          ].map(({ label, count, unit, cost }) => (
            <div key={label} className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{count.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">{unit} · est. £{cost.toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between bg-purple-50 rounded-lg px-4 py-3">
          <div>
            <p className="font-semibold text-purple-800">Forecasted total next month</p>
            <p className="text-xs text-purple-600">Subscription + projected AI costs</p>
          </div>
          <p className="text-xl font-bold text-purple-800">£{forecastedBill.toFixed(2)}</p>
        </div>

        {!isUnlimited && quota.account_type === 'free_tester' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">Ready to upgrade?</p>
            <p className="text-sm text-blue-700">
              The <strong>Starter plan</strong> at £19/month gives you 300 AI marking runs, 150 OCR pages, and 100 PDF exports —
              perfect for a solo teacher. <strong>Professional</strong> at £39/month covers up to 1,000 marking runs and 500 OCR pages.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default CostsPanel;
