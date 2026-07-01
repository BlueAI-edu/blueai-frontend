import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';
import { handleApiError } from '@/lib/handle-error';
import { Navbar } from './Navbar';
import { LoadingSpinner } from '@/components/common';

const ACCOUNT_TYPES = ['free_tester', 'beta_tester', 'paid', 'extended', 'pilot', 'internal'];
const ACCOUNT_TYPE_LABELS = {
  free_tester: 'Free Trial',
  beta_tester: 'Beta Tester',
  paid: 'Paid',
  extended: 'Extended',
  pilot: 'Pilot',
  internal: 'Internal',
};
const ACCOUNT_TYPE_COLORS = {
  free_tester: 'bg-gray-100 text-gray-700',
  beta_tester: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-100 text-green-700',
  extended: 'bg-blue-100 text-blue-700',
  pilot: 'bg-purple-100 text-purple-700',
  internal: 'bg-indigo-100 text-indigo-700',
};

function QuotaBar({ used, allowance }) {
  if (!allowance) return <span className="text-gray-400 text-xs">—</span>;
  const pct = Math.min(100, Math.round((used / allowance) * 100));
  const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500';
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 whitespace-nowrap">{used}/{allowance}</span>
    </div>
  );
}

function UsageEditModal({ entry, onClose, onSave }) {
  const { user, raw_quota } = entry;
  const [form, setForm] = useState({
    account_type: raw_quota.account_type || 'free_tester',
    ocr_pages_allowance: raw_quota.ocr_pages_allowance ?? 50,
    ai_marking_allowance: raw_quota.ai_marking_allowance ?? 50,
    pdf_export_allowance: raw_quota.pdf_export_allowance ?? 20,
    max_assessments: raw_quota.max_assessments ?? 10,
    max_classes: raw_quota.max_classes ?? 5,
    trial_end_date: raw_quota.trial_end_date ? raw_quota.trial_end_date.split('T')[0] : '',
    notes: raw_quota.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form };
      if (payload.trial_end_date) {
        payload.trial_end_date = new Date(payload.trial_end_date).toISOString();
      } else {
        delete payload.trial_end_date;
      }
      await axios.put(`${API}/admin/usage/${user.user_id}`, payload);
      onSave();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(`Reset all usage counters for ${user.name} to zero?`)) return;
    setSaving(true);
    try {
      await axios.post(`${API}/admin/usage/${user.user_id}/reset`);
      onSave();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to reset');
    } finally {
      setSaving(false);
    }
  };

  const handleSetBeta = async () => {
    if (!window.confirm(`Upgrade ${user.name} to Beta Tester tier with default beta limits and a fresh 30-day trial?`)) return;
    setSaving(true);
    try {
      await axios.post(`${API}/admin/usage/${user.user_id}/set-beta`);
      onSave();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to set beta tier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Edit Quota</h3>
            <p className="text-sm text-gray-500">{user.name} — {user.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <select
              value={form.account_type}
              onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {ACCOUNT_TYPES.map(t => (
                <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'ocr_pages_allowance', label: 'OCR Pages Allowance' },
              { key: 'ai_marking_allowance', label: 'AI Marking Allowance' },
              { key: 'pdf_export_allowance', label: 'PDF Export Allowance' },
              { key: 'max_assessments', label: 'Max Assessments' },
              { key: 'max_classes', label: 'Max Classes' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="number"
                  min="0"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trial End Date</label>
              <input
                type="date"
                value={form.trial_end_date}
                onChange={e => setForm(f => ({ ...f, trial_end_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Optional internal notes..."
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={handleSetBeta}
              disabled={saving}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50"
            >
              Set Beta Tier
            </button>
            <button
              onClick={handleReset}
              disabled={saving}
              className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
            >
              Reset Usage Counters
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('teachers');
  const [teachers, setTeachers] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usageLoading, setUsageLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Activity log state
  const [activityLogs, setActivityLogs] = useState([]);
  const [activitySummary, setActivitySummary] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityFilter, setActivityFilter] = useState({ user_id: '', user_email: '', errors_only: false, since_hours: 24 });

  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const [teachersRes, assessmentsRes] = await Promise.all([
        axios.get(`${API}/admin/teachers`),
        axios.get(`${API}/admin/assessments`),
      ]);
      setTeachers(teachersRes.data);
      setAssessments(assessmentsRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsage = useCallback(async () => {
    setUsageLoading(true);
    try {
      const res = await axios.get(`${API}/admin/usage`);
      setUsageData(res.data);
    } catch {
      // silent
    } finally {
      setUsageLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async (filter = activityFilter) => {
    setActivityLoading(true);
    try {
      const params = new URLSearchParams({
        since_hours: filter.since_hours,
        errors_only: filter.errors_only,
        limit: 200,
      });
      if (filter.user_id) params.set('user_id', filter.user_id);
      if (filter.user_email) params.set('user_email', filter.user_email);
      const [logsRes, summaryRes] = await Promise.all([
        axios.get(`${API}/admin/activity/logs?${params}`),
        axios.get(`${API}/admin/activity/summary?since_hours=${filter.since_hours}`),
      ]);
      setActivityLogs(logsRes.data);
      setActivitySummary(summaryRes.data);
    } catch {
      // silent
    } finally {
      setActivityLoading(false);
    }
  }, [activityFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'usage') loadUsage();
    if (activeTab === 'activity') loadActivity();
  }, [activeTab]); // intentionally omit loadUsage/loadActivity — only re-run when tab changes

  const handleRoleChange = async (teacherId, newRole) => {
    try {
      await axios.put(`${API}/admin/teachers/${teacherId}/role?role=${newRole}`);
      loadData();
    } catch (error) {
      handleApiError(error, 'Failed to update role');
    }
  };

  const tabs = [
    { id: 'teachers', label: `Teachers (${teachers.length})` },
    { id: 'assessments', label: `Assessments (${assessments.length})` },
    { id: 'usage', label: 'Usage & Quotas' },
    { id: 'activity', label: 'Activity Log' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6" data-testid="admin-title">Admin Dashboard</h2>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Teachers tab */}
        {activeTab === 'teachers' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid="teachers-title">
              Teachers ({teachers.length})
            </h3>
            {loading ? (
              <div className="text-center py-8"><LoadingSpinner /></div>
            ) : teachers.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No teachers yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="teachers-table">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-gray-700 font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-gray-700 font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-gray-700 font-medium">Role</th>
                      <th className="text-left py-3 px-4 text-gray-700 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t) => (
                      <tr key={t.user_id} className="border-b" data-testid={`teacher-${t.user_id}`}>
                        <td className="py-3 px-4">{t.name}</td>
                        <td className="py-3 px-4 text-gray-600">{t.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${t.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {t.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {t.user_id !== user.user_id && (
                            <select
                              value={t.role}
                              onChange={(e) => handleRoleChange(t.user_id, e.target.value)}
                              className="px-2 py-1 border rounded text-sm"
                              data-testid={`role-select-${t.user_id}`}
                            >
                              <option value="teacher">Teacher</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Assessments tab */}
        {activeTab === 'assessments' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid="all-assessments-title">
              All Assessments ({assessments.length})
            </h3>
            {loading ? (
              <div className="text-center py-8"><LoadingSpinner /></div>
            ) : assessments.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No assessments yet</p>
            ) : (
              <div className="space-y-3" data-testid="all-assessments-list">
                {assessments.map((a) => (
                  <div key={a.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center" data-testid={`admin-assessment-${a.id}`}>
                    <div>
                      <p className="font-medium text-gray-900">Code: {a.join_code}</p>
                      <p className="text-sm text-gray-600">Teacher: {a.teacher_name}</p>
                      <p className="text-sm text-gray-500">Status: {a.status}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/teacher/assessments/${a.id}`)}
                      className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700"
                      data-testid={`view-assessment-${a.id}`}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Usage & Quotas tab */}
        {activeTab === 'usage' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Usage &amp; Quotas</h3>
              <button
                onClick={loadUsage}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Refresh
              </button>
            </div>

            {usageLoading ? (
              <div className="text-center py-12 text-gray-500">Loading usage data...</div>
            ) : usageData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No usage data found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">User</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Plan</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Trial Ends</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">OCR Pages</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">AI Marking</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">PDF Exports</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageData.map(entry => {
                      const { user: u, quota, raw_quota } = entry;
                      const expired = quota.trial_expired;
                      return (
                        <tr key={u.user_id} className={`border-b hover:bg-gray-50 ${expired ? 'bg-red-50' : ''}`}>
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACCOUNT_TYPE_COLORS[quota.account_type] || 'bg-gray-100 text-gray-700'}`}>
                              {ACCOUNT_TYPE_LABELS[quota.account_type] || quota.account_type}
                            </span>
                            {expired && (
                              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Expired</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {quota.trial_end_date
                              ? new Date(quota.trial_end_date).toLocaleDateString()
                              : '—'}
                            {!expired && quota.days_remaining !== null && (
                              <span className={`ml-1 text-xs ${quota.days_remaining <= 5 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                                ({quota.days_remaining}d)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {quota.is_unlimited
                              ? <span className="text-green-600 text-xs font-medium">Unlimited</span>
                              : <QuotaBar used={quota.ocr_pages_used} allowance={quota.ocr_pages_allowance} />}
                          </td>
                          <td className="py-3 px-4">
                            {quota.is_unlimited
                              ? <span className="text-green-600 text-xs font-medium">Unlimited</span>
                              : <QuotaBar used={quota.ai_marking_runs_used} allowance={quota.ai_marking_allowance} />}
                          </td>
                          <td className="py-3 px-4">
                            {quota.is_unlimited
                              ? <span className="text-green-600 text-xs font-medium">Unlimited</span>
                              : <QuotaBar used={quota.pdf_exports_used} allowance={quota.pdf_export_allowance} />}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => setEditingEntry(entry)}
                              className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Activity Log tab */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            {/* Summary cards */}
            {activitySummary && (
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Requests', value: activitySummary.total_requests },
                  { label: 'Errors', value: activitySummary.error_requests },
                  { label: 'Error Rate', value: `${activitySummary.error_rate_pct}%` },
                  { label: 'Avg Duration', value: `${activitySummary.avg_duration_ms}ms` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-lg shadow px-4 py-3">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow px-6 py-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">User ID</label>
                  <input
                    type="text"
                    placeholder="e.g. user_abc123"
                    value={activityFilter.user_id}
                    onChange={e => setActivityFilter(f => ({ ...f, user_id: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-44 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="text"
                    placeholder="teacher@school.com"
                    value={activityFilter.user_email}
                    onChange={e => setActivityFilter(f => ({ ...f, user_email: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-52 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Time window</label>
                  <select
                    value={activityFilter.since_hours}
                    onChange={e => setActivityFilter(f => ({ ...f, since_hours: Number(e.target.value) }))}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Last 1 hour</option>
                    <option value={6}>Last 6 hours</option>
                    <option value={24}>Last 24 hours</option>
                    <option value={72}>Last 3 days</option>
                    <option value={168}>Last 7 days</option>
                    <option value={720}>Last 30 days</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activityFilter.errors_only}
                    onChange={e => setActivityFilter(f => ({ ...f, errors_only: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  Errors only (4xx/5xx)
                </label>
                <button
                  onClick={() => loadActivity(activityFilter)}
                  disabled={activityLoading}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {activityLoading ? 'Loading...' : 'Apply'}
                </button>
              </div>
            </div>

            {/* Log table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-3 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  {activityLogs.length} entries
                </h3>
                <button onClick={() => loadActivity(activityFilter)} className="text-xs text-blue-600 hover:text-blue-700">
                  Refresh
                </button>
              </div>
              {activityLoading ? (
                <div className="text-center py-10 text-gray-500 text-sm">Loading activity logs...</div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No activity logs found for this filter.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-2 px-3 text-gray-600 font-medium">Timestamp</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-medium">Type</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-medium">User / Email</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-medium">Method / Event</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-medium">Path / Join Code</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-medium">Status</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-medium">Duration</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-medium">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLogs.map((log, i) => {
                        const isError = log.status_code >= 400;
                        const isStudent = log.principal_type === 'student';
                        const displayEmail = log.user_email || log.student_email;
                        const displayIdentity = isStudent
                          ? (log.student_email || '—')
                          : (log.user_id || '—');
                        return (
                          <tr key={log.log_id || i} className={`border-b hover:bg-gray-50 ${isError ? 'bg-red-50' : ''}`}>
                            <td className="py-1.5 px-3 text-gray-500 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-1.5 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                isStudent ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {isStudent ? 'Student' : 'Teacher'}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 max-w-[180px]" title={displayEmail || displayIdentity}>
                              <p className="font-mono text-gray-700 truncate">{displayIdentity}</p>
                              {displayEmail && !isStudent && (
                                <p className="text-gray-400 truncate">{displayEmail}</p>
                              )}
                            </td>
                            <td className="py-1.5 px-3">
                              {isStudent ? (
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  log.event === 'join_success' ? 'bg-green-100 text-green-700' :
                                  log.event === 'join_failed' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>{log.event || '—'}</span>
                              ) : (
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  log.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                                  log.method === 'POST' ? 'bg-green-100 text-green-700' :
                                  log.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                                  log.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>{log.method}</span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-gray-800 max-w-[200px] truncate"
                                title={log.path || log.join_code}>
                              {isStudent
                                ? (log.join_code ? <span className="font-bold">{log.join_code}</span> : '—')
                                : log.path}
                            </td>
                            <td className="py-1.5 px-3">
                              <span className={`font-medium ${isError ? 'text-red-600' : 'text-green-700'}`}>
                                {log.status_code}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-gray-500">{log.duration_ms}ms</td>
                            <td className="py-1.5 px-3 text-gray-400">{log.client_ip || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top paths */}
            {activitySummary?.top_paths?.length > 0 && (
              <div className="bg-white rounded-lg shadow px-6 py-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Endpoints</h4>
                <div className="space-y-2">
                  {activitySummary.top_paths.slice(0, 10).map(({ path, count }) => (
                    <div key={path} className="flex items-center gap-3">
                      <span className="font-mono text-xs text-gray-700 flex-1 truncate">{path}</span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{count} requests</span>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.round((count / activitySummary.top_paths[0].count) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {editingEntry && (
        <UsageEditModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={() => {
            setEditingEntry(null);
            loadUsage();
          }}
        />
      )}
    </div>
  );
};
