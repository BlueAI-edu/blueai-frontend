import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API } from '@/config';
import { handleApiError } from '@/lib/handle-error';
import { LoadingSpinner } from '@/components/common';

/**
 * Microsoft Entra connector panel (#269, org-scoped in Phase A).
 *
 * Used in two places:
 * - Admin Dashboard → Organisations tab: pass `organisationId` (the platform
 *   admin must name the organisation they act for).
 * - SchoolAdminPage: omit `organisationId` — the backend scopes every call to
 *   the school_admin's own organisation.
 *
 * Connect a tenant via one-click admin consent, browse its directory, and
 * bulk-provision teacher accounts (optionally importing each teacher's owned
 * Entra groups — their class Teams — as BlueAI classes).
 */
export function EntraConnectorPanel({ organisationId = null }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [statusBanner, setStatusBanner] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [dirUsers, setDirUsers] = useState([]);
  const [dirLoading, setDirLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [checked, setChecked] = useState(new Set());
  const [includeClasses, setIncludeClasses] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionResult, setProvisionResult] = useState(null);

  const orgParams = useCallback(
    (extra = {}) => ({
      params: organisationId ? { organisation_id: organisationId, ...extra } : extra,
    }),
    [organisationId]
  );

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/entra/connections`, orgParams());
      setConnections(res.data.connections || []);
    } catch (error) {
      handleApiError(error, 'Failed to load Entra connections');
    } finally {
      setLoading(false);
    }
  }, [orgParams]);

  useEffect(() => {
    // Surface the consent-callback outcome (?entra_status=...) once, then
    // clean the URL so refreshes don't re-show it
    const params = new URLSearchParams(window.location.search);
    const status = params.get('entra_status');
    if (status) {
      setStatusBanner(status);
      params.delete('entra_status');
      const query = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
    }
    loadConnections();
  }, [loadConnections]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Remember which organisation this consent flow was started for, so the
      // admin Organisations tab can re-open it when the browser returns
      if (organisationId) sessionStorage.setItem('entra_connect_org', organisationId);
      const res = await axios.get(`${API}/admin/entra/consent-url`, orgParams());
      window.location.href = res.data.url;
    } catch (error) {
      handleApiError(error, 'Could not start the Entra consent flow');
      setConnecting(false);
    }
  };

  const handleDisconnect = async (tenantId) => {
    if (!window.confirm('Disconnect this tenant? Provisioned accounts and imported classes are kept; directory browsing stops working.')) return;
    try {
      await axios.delete(`${API}/admin/entra/connections/${tenantId}`, orgParams());
      if (selectedTenant === tenantId) {
        setSelectedTenant(null);
        setDirUsers([]);
        setChecked(new Set());
      }
      loadConnections();
    } catch (error) {
      handleApiError(error, 'Failed to disconnect tenant');
    }
  };

  const loadDirectory = async (tenantId, searchTerm) => {
    setDirLoading(true);
    setProvisionResult(null);
    try {
      const res = await axios.get(
        `${API}/admin/entra/users`,
        orgParams({ tenant_id: tenantId, search: searchTerm || '' })
      );
      setDirUsers(res.data.users || []);
    } catch (error) {
      handleApiError(error, 'Failed to load directory users');
      setDirUsers([]);
    } finally {
      setDirLoading(false);
    }
  };

  const openTenant = (tenantId) => {
    setSelectedTenant(tenantId);
    setSearch('');
    setChecked(new Set());
    loadDirectory(tenantId, '');
  };

  const toggleChecked = (email) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const handleProvision = async () => {
    const users = dirUsers
      .filter((u) => checked.has(u.email))
      .map((u) => ({ email: u.email, name: u.name, directory_id: u.id }));
    if (users.length === 0) return;
    const classNote = includeClasses ? ' Their Entra class groups will be imported as classes.' : '';
    if (!window.confirm(`Create ${users.length} teacher account(s)?${classNote} Existing accounts are skipped, never changed.`)) return;
    setProvisioning(true);
    try {
      const res = await axios.post(`${API}/admin/entra/provision`, {
        tenant_id: selectedTenant,
        users,
        include_classes: includeClasses,
        ...(organisationId ? { organisation_id: organisationId } : {}),
      });
      setProvisionResult(res.data);
      setChecked(new Set());
    } catch (error) {
      handleApiError(error, 'Provisioning failed');
    } finally {
      setProvisioning(false);
    }
  };

  const bannerStyles = {
    connected: 'bg-green-50 border-green-200 text-green-800',
    declined: 'bg-amber-50 border-amber-200 text-amber-800',
    invalid_state: 'bg-red-50 border-red-200 text-red-700',
    error: 'bg-red-50 border-red-200 text-red-700',
  };
  const bannerText = {
    connected: 'Tenant connected successfully. It now appears in the list below.',
    declined: 'The Microsoft admin declined the consent request.',
    invalid_state: 'The consent link had expired or was already used — start the connection again.',
    error: 'Something went wrong completing the connection. Try again.',
  };

  return (
    <div className="space-y-6">
      {statusBanner && (
        <div className={`rounded-lg border p-4 text-sm ${bannerStyles[statusBanner] || bannerStyles.error}`}>
          {bannerText[statusBanner] || bannerText.error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Microsoft Entra Connection</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-2xl">
              Connect the school&apos;s Microsoft tenant once, then add teachers and their classes
              straight from its directory.
            </p>
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
            data-testid="entra-connect-btn"
          >
            {connecting ? 'Redirecting…' : 'Connect a tenant'}
          </button>
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="text-center py-6"><LoadingSpinner /></div>
          ) : connections.length === 0 ? (
            <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-6 text-center">
              No tenant connected yet. Click &quot;Connect a tenant&quot; to start — the consent link
              is valid for 10 minutes.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {connections.map((c) => (
                <div key={c.tenant_id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{c.display_name || 'Unnamed organisation'}</p>
                    <p className="text-xs text-gray-500">
                      Tenant {c.tenant_id} · connected {c.connected_at ? new Date(c.connected_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => openTenant(c.tenant_id)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      selectedTenant === c.tenant_id
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Browse users
                  </button>
                  <button
                    onClick={() => handleDisconnect(c.tenant_id)}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTenant && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Provision teachers</h3>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadDirectory(selectedTenant, search)}
                placeholder="Search name or email…"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => loadDirectory(selectedTenant, search)}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Search
              </button>
              <button
                onClick={handleProvision}
                disabled={checked.size === 0 || provisioning}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
                data-testid="entra-provision-btn"
              >
                {provisioning ? 'Provisioning…' : `Provision selected (${checked.size})`}
              </button>
            </div>
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeClasses}
              onChange={(e) => setIncludeClasses(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Also import each teacher&apos;s classes (their owned Entra groups, e.g. class Teams)
          </label>

          {provisionResult && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <p className="font-semibold">{provisionResult.summary}</p>
              {provisionResult.failed?.length > 0 && (
                <p className="mt-1 text-red-700">Failed: {provisionResult.failed.join(', ')}</p>
              )}
            </div>
          )}

          <div className="mt-4">
            {dirLoading ? (
              <div className="text-center py-6"><LoadingSpinner /></div>
            ) : dirUsers.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No directory users found{search ? ' for this search' : ''}.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {dirUsers.map((u) => (
                  <label key={u.id || u.email} className="flex items-center gap-3 py-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked.has(u.email)}
                      onChange={() => toggleChecked(u.email)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{u.name}</p>
                      <p className="truncate text-xs text-gray-500">{u.email}</p>
                    </div>
                    {!u.enabled && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Disabled in Entra</span>
                    )}
                  </label>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-gray-400">
              Up to 50 results — use search to narrow down. Existing accounts are skipped.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EntraConnectorPanel;
