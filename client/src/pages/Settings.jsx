import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Building, Palette, Users, Scale, Save, CheckCircle, AlertCircle, Plus, Trash2, Shield } from 'lucide-react';

export default function Settings() {
  const { currentTenant, themeColors, applyTheme, refreshTenant } = useTenant();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('BRANDING'); // BRANDING, STATUTORY, TEAM
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Tenant branding form
  const [brandForm, setBrandForm] = useState({
    name: '',
    tagline: '',
    apmc_license: '',
    shop_no: '',
    market_name: '',
    phone: '',
    email: '',
    primary_color: '#4f46e5'
  });

  // Team member form modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'accountant'
  });
  const [submittingMember, setSubmittingMember] = useState(false);

  useEffect(() => {
    if (currentTenant) {
      setBrandForm({
        name: currentTenant.name || '',
        tagline: currentTenant.tagline || '',
        apmc_license: currentTenant.apmc_license || '',
        shop_no: currentTenant.shop_no || '',
        market_name: currentTenant.market_name || '',
        phone: currentTenant.phone || '',
        email: currentTenant.email || '',
        primary_color: currentTenant.primary_color || '#4f46e5'
      });
    }
  }, [currentTenant]);

  useEffect(() => {
    if (activeTab === 'TEAM') {
      loadMembers();
    }
  }, [activeTab]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await api.getTenantMembers();
      setMembers(res.members || []);
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.updateTenantBranding(brandForm);
      setMessage({ type: 'success', text: 'Firm branding and white-label settings updated successfully!' });
      applyTheme(brandForm.primary_color);
      refreshTenant();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update branding.' });
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSubmittingMember(true);
    setMessage(null);
    try {
      await api.addTenantMember(memberForm);
      setMessage({ type: 'success', text: `Added staff member ${memberForm.name} (${memberForm.role}) successfully!` });
      setShowAddMemberModal(false);
      setMemberForm({ name: '', email: '', password: '', role: 'accountant' });
      loadMembers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add member.' });
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleRemoveMember = async (id, memberName) => {
    if (!window.confirm(`Are you sure you want to remove staff member ${memberName}?`)) return;
    try {
      await api.deleteTenantMember(id);
      setMessage({ type: 'success', text: `Member removed successfully.` });
      loadMembers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove member.' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-indigo-600" />
          Mandi Firm Settings / फर्म कॉन्फ़िगरेशन
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Customize your agency white-label branding, APMC statutory percentages, and staff access roles.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        {[
          { id: 'BRANDING', label: 'Agency Branding (व्हाइट-लेबल)', icon: Building },
          { id: 'STATUTORY', label: 'Statutory APMC Rates (मंडी दरें)', icon: Scale },
          { id: 'TEAM', label: 'Staff & Munshi Team (स्टाफ प्रबंधन)', icon: Users }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`pb-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BRANDING */}
      {activeTab === 'BRANDING' && (
        <form onSubmit={handleSaveBranding} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Agency Identity & Header Settings</h3>
            <p className="text-xs text-gray-500">These details appear on all APMC gate slips, Purchas, Teep sheets, and J-Forms.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Trading Agency / Firm Name *</label>
              <input
                type="text"
                required
                value={brandForm.name}
                onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tagline / Sub-heading</label>
              <input
                type="text"
                placeholder="e.g. Apple & Vegetable Commission Agents"
                value={brandForm.tagline}
                onChange={(e) => setBrandForm({ ...brandForm, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">APMC License Number *</label>
              <input
                type="text"
                required
                value={brandForm.apmc_license}
                onChange={(e) => setBrandForm({ ...brandForm, apmc_license: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Shop / Shed Number</label>
              <input
                type="text"
                value={brandForm.shop_no}
                onChange={(e) => setBrandForm({ ...brandForm, shop_no: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Market Committee</label>
              <input
                type="text"
                value={brandForm.market_name}
                onChange={(e) => setBrandForm({ ...brandForm, market_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Official Contact Phone</label>
              <input
                type="text"
                value={brandForm.phone}
                onChange={(e) => setBrandForm({ ...brandForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Official Email</label>
              <input
                type="email"
                value={brandForm.email}
                onChange={(e) => setBrandForm({ ...brandForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Theme Picker */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-indigo-600" /> Agency Brand Color Theme
            </label>
            <div className="flex flex-wrap gap-3">
              {themeColors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setBrandForm({ ...brandForm, primary_color: color.value })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    brandForm.primary_color === color.value
                      ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: color.value }} />
                  <span>{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" /> Save Agency Branding
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: STATUTORY RATES */}
      {activeTab === 'STATUTORY' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Delhi APMC Statutory Mandi Deductions</h3>
            <p className="text-xs text-gray-500">Configured per Delhi Agricultural Produce Marketing (Regulation) Act.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase">Commission / Arhat (आढ़त)</span>
              <div className="text-2xl font-black text-indigo-600 font-mono">6.0%</div>
              <p className="text-[11px] text-gray-500">Statutory commission agent brokerage on gross sale proceed.</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase">Buyer Brokerage / Dami (दामी)</span>
              <div className="text-2xl font-black text-indigo-600 font-mono">2.0%</div>
              <p className="text-[11px] text-gray-500">Added to Buyer auction purcha bill value.</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase">APMC Mandi Cess + RDF</span>
              <div className="text-2xl font-black text-emerald-600 font-mono">2.0% <span className="text-xs font-normal text-gray-500">(1% Fee + 1% RDF)</span></div>
              <p className="text-[11px] text-gray-500">Remitted monthly to Secretary, APMC Azadpur via Form 'M'.</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase">Debtor Late Payment Interest</span>
              <div className="text-2xl font-black text-rose-600 font-mono">18.0% p.a.</div>
              <p className="text-[11px] text-gray-500">Applied automatically to buyer ledger balances exceeding 15 calendar days.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STAFF & MUNSHI TEAM */}
      {activeTab === 'TEAM' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div>
              <h3 className="text-base font-bold text-gray-900">Agency Team & Staff Roles</h3>
              <p className="text-xs text-gray-500">Munshis, accountants and cashiers with scoped permissions for this firm.</p>
            </div>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Team Member
            </button>
          </div>

          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400">Loading members...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400">No staff members found.</td></tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">{m.name}</td>
                    <td className="py-3 px-4 font-mono text-xs">{m.email}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {m.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {m.role !== 'shop_admin' && (
                        <button
                          onClick={() => handleRemoveMember(m.id, m.name)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50">
              <h2 className="text-base font-bold text-indigo-950">Add Staff / Munshi</h2>
              <button onClick={() => setShowAddMemberModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Login Email *</label>
                <input
                  type="email"
                  required
                  placeholder="suresh@mandi.com"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={memberForm.password}
                  onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Role / Designation *</label>
                <select
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="accountant">Accountant / Munshi (Full Trade &amp; Ledger)</option>
                  <option value="cashier">Cashier (Rokad Cashbook &amp; Counter)</option>
                  <option value="viewer">Viewer (Read-Only Audit &amp; Reports)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMember}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm disabled:opacity-50"
                >
                  {submittingMember ? 'Adding...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
