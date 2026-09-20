import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { ShieldAlert, Users, CreditCard, Calendar, Eye, CheckCircle, AlertTriangle, RefreshCw, Clock, ArrowUpRight, Search, Zap, Lock } from 'lucide-react';

export default function SuperAdmin() {
  const { user } = useAuth();
  const { startImpersonation } = useTenant();

  const [metrics, setMetrics] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [mRes, tRes, rRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminTenants(),
        api.getAdminRequests()
      ]);
      setMetrics(mRes.metrics || {});
      setTenants(tRes.tenants || []);
      setRequests(rRes.requests || []);
    } catch (err) {
      console.error('Failed to load super admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (tenantId, newPlan) => {
    setActionLoading(true);
    setMessage(null);
    try {
      await api.updateTenantSubscription(tenantId, { plan: newPlan });
      setMessage({ type: 'success', text: `Updated subscription plan to ${newPlan.toUpperCase()}!` });
      loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update plan.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendValidity = async (tenantId, days) => {
    setActionLoading(true);
    setMessage(null);
    try {
      await api.extendSubscription(tenantId, days);
      setMessage({ type: 'success', text: `Extended subscription validity by ${days} days!` });
      loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to extend subscription.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (tenantId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setActionLoading(true);
    setMessage(null);
    try {
      await api.toggleTenantStatus(tenantId, newStatus);
      setMessage({ type: 'success', text: `Tenant status set to ${newStatus.toUpperCase()}!` });
      loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update status.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestAction = async (requestId, status) => {
    setActionLoading(true);
    setMessage(null);
    try {
      await api.resolveAdminRequest(requestId, status);
      setMessage({ type: 'success', text: `Access request ${status}!` });
      loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to resolve request.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAuditImpersonate = async (tenant) => {
    try {
      await startImpersonation(tenant.id);
      setMessage({ type: 'success', text: `Entered View-Only Audit Impersonation mode for "${tenant.name}". Mutation lock active.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to impersonate tenant.' });
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.apmc_license?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subdomain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-indigo-900/50">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" /> Platform Owner HQ
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Super Admin Control Center
          </h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl">
            Logged in as <span className="font-bold text-white underline">{user?.email}</span>. Manage SaaS subscription tiers (Monthly, Yearly, Enterprise), extend validity, approve tenant requests, and launch view-only audit sessions.
          </p>
        </div>
        <button
          onClick={loadAll}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Telemetry
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Agencies</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{metrics?.total_tenants || tenants.length}</div>
          <div className="text-xs text-indigo-600 font-semibold mt-1">Multi-Tenant Isolated</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Subscriptions</span>
            <CreditCard className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {tenants.filter(t => t.status === 'active').length}
          </div>
          <div className="text-xs text-gray-400 mt-1">Monthly, Yearly &amp; Enterprise</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estimated ARR</span>
            <ArrowUpRight className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">
            ₹{((tenants.length * 2499 * 12) / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">+18.5% QoQ Run Rate</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Requests</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{requests.length}</div>
          <div className="text-xs text-amber-700 font-semibold mt-1">Awaiting APMC Verification</div>
        </div>
      </div>

      {/* Tenant Subscriptions Management Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50">
          <div>
            <h2 className="text-base font-bold text-gray-900">Tenant Agencies &amp; Subscription Tiers</h2>
            <p className="text-xs text-gray-500">Configure tier access, extend licensing validity, and initiate audit impersonation.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search agency name, license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Agency / Firm Name</th>
                <th className="py-3 px-4">APMC License</th>
                <th className="py-3 px-4">Subscription Plan</th>
                <th className="py-3 px-4">Validity Expiry</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-400">Loading tenants...</td></tr>
              ) : filteredTenants.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-400">No tenants found.</td></tr>
              ) : (
                filteredTenants.map((t) => {
                  const isActive = t.status === 'active';
                  const expiryDate = t.valid_until ? new Date(t.valid_until).toLocaleDateString('en-IN') : 'Lifetime';

                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{t.name}</div>
                        <div className="text-xs text-gray-400">ID: {t.id} • subdomain: {t.subdomain}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{t.apmc_license || '—'}</td>
                      <td className="py-3 px-4">
                        <select
                          value={t.plan || 'monthly'}
                          onChange={(e) => handleUpdatePlan(t.id, e.target.value)}
                          disabled={actionLoading}
                          className="px-2 py-1 text-xs font-bold rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="trial">Free Trial (7-Day)</option>
                          <option value="monthly">Monthly (₹2,499/mo)</option>
                          <option value="yearly">Yearly (₹24,999/yr)</option>
                          <option value="enterprise">Enterprise Custom</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-gray-800">{expiryDate}</div>
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={() => handleExtendValidity(t.id, 30)}
                            disabled={actionLoading}
                            className="px-1.5 py-0.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 rounded text-[10px] font-bold transition-colors"
                            title="Add 30 days"
                          >
                            +30D
                          </button>
                          <button
                            onClick={() => handleExtendValidity(t.id, 365)}
                            disabled={actionLoading}
                            className="px-1.5 py-0.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-600 text-gray-600 rounded text-[10px] font-bold transition-colors"
                            title="Add 1 year"
                          >
                            +1Y
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(t.id, t.status)}
                          disabled={actionLoading}
                          className={`px-2 py-0.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800'
                              : 'bg-rose-100 text-rose-800 hover:bg-emerald-100 hover:text-emerald-800'
                          }`}
                          title="Click to toggle active/suspend"
                        >
                          {isActive ? 'Active' : 'Suspended'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleAuditImpersonate(t)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                          title="Audit Impersonate (View-Only Mode Locked)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Audit View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Access Requests */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Pending Agency Registration Requests</h2>
            <p className="text-xs text-gray-500">Self-serve commission agent onboarding requests needing APMC clearance.</p>
          </div>
          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
            {requests.length} Requests
          </span>
        </div>

        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
            <tr>
              <th className="py-3 px-4">Applicant Name</th>
              <th className="py-3 px-4">Firm / Agency</th>
              <th className="py-3 px-4">APMC License</th>
              <th className="py-3 px-4">Tier</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-6 text-gray-400">No pending access requests.</td></tr>
            ) : (
              requests.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-900">{r.full_name}</div>
                    <div className="text-xs text-gray-400">{r.email} • {r.phone}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold">{r.firm_name}</td>
                  <td className="py-3 px-4 font-mono text-xs">{r.license_number || 'Under Process'}</td>
                  <td className="py-3 px-4">
                    <span className="capitalize px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700">
                      {r.requested_plan || 'monthly'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleRequestAction(r.id, 'approved')}
                      disabled={actionLoading}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRequestAction(r.id, 'rejected')}
                      disabled={actionLoading}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
