import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useTenant, THEME_PRESETS } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Palette, 
  Scale, 
  Printer, 
  Users, 
  Tag, 
  Apple, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  X,
  CreditCard,
  QrCode
} from 'lucide-react';

export default function Settings() {
  const { currentTenant, activeTenant, applyTheme, refreshTenant } = useTenant();
  const tenant = currentTenant || activeTenant;
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('PROFILE'); // PROFILE, THEME, STATUTORY, PRINTER, PARTIES, COMMODITIES, TEAM
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Sub-data
  const [parties, setParties] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [members, setMembers] = useState([]);
  const [partySearch, setPartySearch] = useState('');

  // 1. Profile & Bank Form
  const [profileForm, setProfileForm] = useState({
    firm_name: '',
    hindi_name: '',
    tagline: '',
    proprietor: '',
    shop_no: '',
    mandi_name: '',
    apmc_license_no: '',
    gstin: '',
    phone: '',
    upi_id: '',
    bank_name: '',
    account_no: '',
    ifsc: ''
  });

  // 2. Statutory Rates Form
  const [ratesForm, setRatesForm] = useState({
    standard_commission: '6.0',
    palledari_rate_per_box: '10',
    apmc_cess: '1.0',
    rdf_fee: '1.0',
    interest_rate: '18.0'
  });

  // 3. Printer & Format Form
  const [printerForm, setPrinterForm] = useState({
    bill_format: 'thermal',
    bill_disclaimer: 'Payment is due within 15 calendar days as per Delhi APMC Act. Delayed payment incurs 18% p.a. statutory interest.'
  });

  // Modals state
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [partyForm, setPartyForm] = useState({
    shortCode: '',
    name: '',
    type: 'Buyer',
    mobile: '',
    address: '',
    creditLimit: '200000'
  });

  const [showAddCommodityModal, setShowAddCommodityModal] = useState(false);
  const [commodityForm, setCommodityForm] = useState({
    nameEn: '',
    nameHi: '',
    category: 'Fruit',
    defaultUnit: 'Box (20kg)',
    unitWeightKg: '20',
    tareDeductionKg: '1.0',
    standardCommissionPct: '6.0',
    palledariRatePerUnit: '10'
  });

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: '',
    role: 'Munshi (Data Entry)',
    mobile: '',
    pin: '1234'
  });

  useEffect(() => {
    if (tenant) {
      setProfileForm({
        firm_name: tenant.firm_name || '',
        hindi_name: tenant.hindi_name || '',
        tagline: tenant.tagline || '',
        proprietor: tenant.proprietor || '',
        shop_no: tenant.shop_no || '',
        mandi_name: tenant.mandi_name || '',
        apmc_license_no: tenant.apmc_license_no || '',
        gstin: tenant.gstin || '',
        phone: tenant.phone || '',
        upi_id: tenant.upi_id || '',
        bank_name: tenant.bank_name || '',
        account_no: tenant.account_no || '',
        ifsc: tenant.ifsc || ''
      });

      setRatesForm({
        standard_commission: tenant.standard_commission?.toString() || '6.0',
        palledari_rate_per_box: tenant.palledari_rate_per_box?.toString() || '10',
        apmc_cess: '1.0',
        rdf_fee: '1.0',
        interest_rate: '18.0'
      });

      setPrinterForm({
        bill_format: tenant.bill_format || 'thermal',
        bill_disclaimer: tenant.bill_disclaimer || 'Payment is due within 15 calendar days as per Delhi APMC Act. Delayed payment incurs 18% p.a. statutory interest.'
      });
    }
  }, [tenant]);

  useEffect(() => {
    if (activeTab === 'PARTIES') loadParties();
    if (activeTab === 'COMMODITIES') loadCommodities();
    if (activeTab === 'TEAM') loadMembers();
  }, [activeTab]);

  const loadParties = async () => {
    setLoading(true);
    try {
      const res = await api.getParties();
      setParties(res.parties || res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCommodities = async () => {
    setLoading(true);
    try {
      const res = await api.getCommodities();
      setCommodities(res.commodities || res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await api.getTenantMembers();
      setMembers(res.members || res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 1. Save Profile & Bank
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!tenant) return;
    setMessage(null);
    try {
      await api.updateTenant(tenant.id, profileForm);
      setMessage({ type: 'success', text: 'Firm identity and banking details saved successfully!' });
      refreshTenant();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save firm profile.' });
    }
  };

  // 2. Multi-Theme Switching
  const handleThemeSelect = async (themeKey) => {
    if (!tenant) return;
    setMessage(null);
    try {
      applyTheme(themeKey);
      await api.updateTenant(tenant.id, { theme_color: themeKey });
      localStorage.setItem('mandi_theme', themeKey);
      setMessage({ type: 'success', text: `Theme updated to ${themeKey.toUpperCase()} and applied across your workspace!` });
      refreshTenant();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save theme.' });
    }
  };

  // 3. Save Statutory Rates
  const handleSaveRates = async (e) => {
    e.preventDefault();
    if (!tenant) return;
    setMessage(null);
    try {
      await api.updateTenant(tenant.id, {
        standard_commission: parseFloat(ratesForm.standard_commission),
        palledari_rate_per_box: parseFloat(ratesForm.palledari_rate_per_box)
      });
      setMessage({ type: 'success', text: 'Statutory APMC rates and charges saved successfully!' });
      refreshTenant();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save rates.' });
    }
  };

  // 4. Save Printer Config
  const handleSavePrinter = async (e) => {
    e.preventDefault();
    if (!tenant) return;
    setMessage(null);
    try {
      await api.updateTenant(tenant.id, printerForm);
      setMessage({ type: 'success', text: 'Default invoice format & disclaimer saved!' });
      refreshTenant();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save printer settings.' });
    }
  };

  // 5. Add Party
  const handleAddPartySubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.addParty({
        shortCode: partyForm.shortCode.toUpperCase(),
        name: partyForm.name,
        type: partyForm.type,
        mobile: partyForm.mobile,
        address: partyForm.address,
        creditLimit: parseFloat(partyForm.creditLimit) || 0
      });
      setMessage({ type: 'success', text: `Party "${partyForm.name}" [${partyForm.shortCode.toUpperCase()}] added!` });
      setShowAddPartyModal(false);
      setPartyForm({ shortCode: '', name: '', type: 'Buyer', mobile: '', address: '', creditLimit: '200000' });
      loadParties();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add party.' });
    }
  };

  // Delete Party
  const handleDeleteParty = async (id, partyName) => {
    if (!window.confirm(`Delete party "${partyName}"?`)) return;
    try {
      await api.deleteParty(id);
      setMessage({ type: 'success', text: `Party deleted.` });
      loadParties();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete party.' });
    }
  };

  // 6. Add Commodity
  const handleAddCommoditySubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.addCommodity(commodityForm);
      setMessage({ type: 'success', text: `Commodity "${commodityForm.nameEn}" added to master catalog!` });
      setShowAddCommodityModal(false);
      setCommodityForm({
        nameEn: '',
        nameHi: '',
        category: 'Fruit',
        defaultUnit: 'Box (20kg)',
        unitWeightKg: '20',
        tareDeductionKg: '1.0',
        standardCommissionPct: '6.0',
        palledariRatePerUnit: '10'
      });
      loadCommodities();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add commodity.' });
    }
  };

  // 7. Add Member
  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.addTenantMember({
        name: memberForm.name,
        role: memberForm.role,
        phone: memberForm.mobile,
        password: memberForm.pin
      });
      setMessage({ type: 'success', text: `Staff member "${memberForm.name}" added with PIN ${memberForm.pin}!` });
      setShowAddMemberModal(false);
      setMemberForm({ name: '', role: 'Munshi (Data Entry)', mobile: '', pin: '1234' });
      loadMembers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add member.' });
    }
  };

  const handleDeleteMember = async (userId, memberName) => {
    if (!window.confirm(`Remove staff member "${memberName}"?`)) return;
    try {
      await api.deleteTenantMember(userId);
      setMessage({ type: 'success', text: `Staff member removed.` });
      loadMembers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove member.' });
    }
  };

  const filteredParties = parties.filter(p => 
    p.short_code?.toLowerCase().includes(partySearch.toLowerCase()) ||
    p.name?.toLowerCase().includes(partySearch.toLowerCase()) ||
    p.mobile?.includes(partySearch)
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Building2 className="w-7 h-7 text-emerald-700" />
          Mandi Settings &amp; Master Configuration (मास्टर सेटिंग्स)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Full control of your APMC agency identity, banking, multi-theme branding, party short codes, commodities &amp; team.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Settings Navigation Tabs (Same as previous system) */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-1 text-xs font-bold select-none">
        {[
          { id: 'PROFILE', label: '1. Firm Profile & Bank', icon: Building2 },
          { id: 'THEME', label: '2. Multi-Theme Palette', icon: Palette },
          { id: 'STATUTORY', label: '3. Statutory APMC Rates', icon: Scale },
          { id: 'PRINTER', label: '4. Printer & Formats', icon: Printer },
          { id: 'PARTIES', label: '5. Party Master (Short Code)', icon: Tag },
          { id: 'COMMODITIES', label: '6. Commodity Master', icon: Apple },
          { id: 'TEAM', label: '7. Staff & Munshis', icon: Users }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => { setActiveTab(t.id); setMessage(null); }}
              className={`px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ================= SUB-TAB 1: FIRM PROFILE & BANK ================= */}
      {activeTab === 'PROFILE' && (
        <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Firm Profile &amp; Banking Details (फर्म विवरण)</h3>
            <p className="text-slate-500 text-[11px]">Printed on official bills, J-Forms, Purcha slips and Teep vouchers.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Firm Legal Name *</label>
              <input
                type="text"
                required
                value={profileForm.firm_name}
                onChange={(e) => setProfileForm({ ...profileForm, firm_name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Hindi Name (हिंदी नाम)</label>
              <input
                type="text"
                placeholder="e.g. श्री गणेश फ्रूट कंपनी"
                value={profileForm.hindi_name}
                onChange={(e) => setProfileForm({ ...profileForm, hindi_name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Proprietor Name</label>
              <input
                type="text"
                value={profileForm.proprietor}
                onChange={(e) => setProfileForm({ ...profileForm, proprietor: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Shop / Shed No. *</label>
              <input
                type="text"
                required
                value={profileForm.shop_no}
                onChange={(e) => setProfileForm({ ...profileForm, shop_no: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">APMC License No. *</label>
              <input
                type="text"
                required
                value={profileForm.apmc_license_no}
                onChange={(e) => setProfileForm({ ...profileForm, apmc_license_no: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mandi Market Name</label>
              <input
                type="text"
                value={profileForm.mandi_name}
                onChange={(e) => setProfileForm({ ...profileForm, mandi_name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Official Mobile / Phone</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">GSTIN Number</label>
              <input
                type="text"
                value={profileForm.gstin}
                onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Bank & UPI Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Banking &amp; Digital UPI Settlement (बैंक खाता)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India"
                  value={profileForm.bank_name}
                  onChange={(e) => setProfileForm({ ...profileForm, bank_name: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Number</label>
                <input
                  type="text"
                  placeholder="Account No."
                  value={profileForm.account_no}
                  onChange={(e) => setProfileForm({ ...profileForm, account_no: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. SBIN0001234"
                  value={profileForm.ifsc}
                  onChange={(e) => setProfileForm({ ...profileForm, ifsc: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">UPI ID (Scan to Pay)</label>
                <input
                  type="text"
                  placeholder="mandi@upi"
                  value={profileForm.upi_id}
                  onChange={(e) => setProfileForm({ ...profileForm, upi_id: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-emerald-800 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Profile &amp; Banking
            </button>
          </div>
        </form>
      )}

      {/* ================= SUB-TAB 2: MULTI-THEME PALETTE ================= */}
      {activeTab === 'THEME' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Multi-Theme Palette (थीम रंग चयन)</h3>
            <p className="text-slate-500 text-[11px]">Select a tailored wholesale market color theme. Changes apply instantly across the entire interface and save permanently.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {THEME_PRESETS.map(preset => {
              const isSelected = (tenant?.theme_color === preset.id);
              return (
                <div
                  key={preset.id}
                  onClick={() => handleThemeSelect(preset.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'border-slate-900 bg-slate-50 shadow-md ring-2 ring-slate-900/10'
                      : 'border-slate-200 hover:border-slate-400 bg-white hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full shadow-inner border border-white" style={{ backgroundColor: preset.value }}></span>
                      <span className="font-bold text-slate-900 text-xs">{preset.name}</span>
                    </div>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-900 text-white flex items-center gap-1">
                        ✓ Active
                      </span>
                    )}
                  </div>

                  {/* Visual Swatch Preview */}
                  <div className="flex items-center gap-1 rounded-lg p-1.5 bg-white border border-slate-200">
                    <div className="w-8 h-4 rounded" style={{ backgroundColor: preset.value }} title="Primary"></div>
                    <div className="w-8 h-4 rounded" style={{ backgroundColor: preset.dark }} title="Dark"></div>
                    <div className="w-8 h-4 rounded" style={{ backgroundColor: preset.light }} title="Light"></div>
                    <span className="text-[10px] font-mono text-slate-400 ml-auto">{preset.value}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleThemeSelect(preset.id); }}
                    className={`w-full py-1.5 rounded-lg font-bold text-[11px] transition-colors ${
                      isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? 'Currently Applied' : 'Apply Theme →'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 3: STATUTORY APMC RATES ================= */}
      {activeTab === 'STATUTORY' && (
        <form onSubmit={handleSaveRates} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs max-w-2xl">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Statutory APMC Delhi Rates &amp; Bye-Laws (मंडी शुल्क दरें)</h3>
            <p className="text-slate-500 text-[11px]">Applied to auction lots, consignor settlement Teeps, and buyer purcha calculations.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Standard Arhat Commission (%)</label>
              <input
                type="number"
                step="0.1"
                required
                value={ratesForm.standard_commission}
                onChange={(e) => setRatesForm({ ...ratesForm, standard_commission: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold font-mono text-emerald-800"
              />
              <span className="text-[10px] text-slate-400">Delhi APMC standard is 6.0% (Fruit/Veg) or 2.5%</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Buyer Brokerage / Dami (%)</label>
              <input
                type="number"
                step="0.1"
                value="2.0"
                disabled
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold font-mono bg-slate-100 text-slate-600"
              />
              <span className="text-[10px] text-slate-400">Fixed at 2.0% per APMC Trade Byelaw</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Palledari / Box Unloading Rate (₹)</label>
              <input
                type="number"
                step="1"
                required
                value={ratesForm.palledari_rate_per_box}
                onChange={(e) => setRatesForm({ ...ratesForm, palledari_rate_per_box: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold font-mono"
              />
              <span className="text-[10px] text-slate-400">Per box / sack unloading labor charge</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">APMC Cess + RDF (%)</label>
              <input
                type="text"
                disabled
                value="1.0% + 1.0% = 2.0%"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold font-mono bg-slate-100 text-slate-600"
              />
              <span className="text-[10px] text-slate-400">Remitted monthly via Form 'M'</span>
            </div>

            <div className="sm:col-span-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <label className="font-bold text-rose-900 block mb-1">15-Day Debtor Delayed Payment Interest (% per annum)</label>
              <input
                type="number"
                step="0.5"
                value={ratesForm.interest_rate}
                onChange={(e) => setRatesForm({ ...ratesForm, interest_rate: e.target.value })}
                className="w-full p-2.5 border border-rose-300 rounded-xl font-bold font-mono text-rose-800 bg-white"
              />
              <span className="text-[10px] text-rose-700 mt-1 block">
                Per Delhi Agricultural Produce Marketing Regulation Act, buyer credit exceeding 15 calendar days incurs 18% p.a. interest.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Rates &amp; Charges
            </button>
          </div>
        </form>
      )}

      {/* ================= SUB-TAB 4: PRINTER & FORMATS ================= */}
      {activeTab === 'PRINTER' && (
        <form onSubmit={handleSavePrinter} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs max-w-2xl">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Printer Format &amp; Custom Disclaimers (प्रिंटर फॉर्मेट)</h3>
            <p className="text-slate-500 text-[11px]">Configure default invoice print layout for thermal receipt rolls or standard A4 documents.</p>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Default Bill / Slip Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPrinterForm({ ...printerForm, bill_format: 'thermal' })}
                className={`p-3.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                  printerForm.bill_format === 'thermal'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-base mb-1">🧾</div>
                <div>Thermal POS Receipt (80mm / 58mm)</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">High-speed roll printer for fast auction counter</div>
              </button>

              <button
                type="button"
                onClick={() => setPrinterForm({ ...printerForm, bill_format: 'a4' })}
                className={`p-3.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                  printerForm.bill_format === 'a4'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-base mb-1">📄</div>
                <div>Standard A4 / A5 Legal Bill</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">Full-page invoice for official accounting</div>
              </button>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Custom Bill Terms &amp; APMC Disclaimers</label>
            <textarea
              rows={4}
              value={printerForm.bill_disclaimer}
              onChange={(e) => setPrinterForm({ ...printerForm, bill_disclaimer: e.target.value })}
              className="w-full p-3 border border-slate-300 rounded-xl leading-relaxed"
            />
            <span className="text-[10px] text-slate-400">Printed at the bottom of Buyer Purcha and Farmer Teep slips.</span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Printer Settings
            </button>
          </div>
        </form>
      )}

      {/* ================= SUB-TAB 5: PARTY MASTER (SHORT CODES) ================= */}
      {activeTab === 'PARTIES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Party Master (शॉर्ट कोड मास्टर)</h3>
              <p className="text-slate-500 text-[11px]">Manage buyer short codes (AGW, RJD) and farmer accounts for instant auction allocation.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search short code or name..."
                  value={partySearch}
                  onChange={(e) => setPartySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>
              <button
                onClick={() => setShowAddPartyModal(true)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Party
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Short Code</th>
                  <th className="p-3">Party Name &amp; Address</th>
                  <th className="p-3 text-center">Type</th>
                  <th className="p-3">Mobile Phone</th>
                  <th className="p-3 text-right">Credit Limit (₹)</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-8 text-slate-400">Loading parties...</td></tr>
                ) : filteredParties.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-slate-400">No parties found matching criteria.</td></tr>
                ) : (
                  filteredParties.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-black text-emerald-800">{p.short_code}</td>
                      <td className="p-3 font-bold text-slate-900">
                        {p.name}
                        {p.address && <span className="block text-[10px] font-normal text-slate-400">{p.address}</span>}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.type === 'Buyer' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.type}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{p.mobile || '—'}</td>
                      <td className="p-3 text-right font-mono font-bold">₹{(p.credit_limit || 0).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteParty(p.id, p.name)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Delete Party"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 6: COMMODITY MASTER ================= */}
      {activeTab === 'COMMODITIES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Commodity Master Catalog (फसल व जिंस)</h3>
              <p className="text-slate-500 text-[11px]">Configured produce varieties with tare weights and commission rates.</p>
            </div>
            <button
              onClick={() => setShowAddCommodityModal(true)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Commodity
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Commodity Name</th>
                  <th className="p-3 text-center">Category</th>
                  <th className="p-3">Unit &amp; Wt (Kg)</th>
                  <th className="p-3 text-right">Tare Deduction</th>
                  <th className="p-3 text-right">Commission %</th>
                  <th className="p-3 text-right">Palledari (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commodities.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-slate-400">No commodities registered yet.</td></tr>
                ) : (
                  commodities.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">
                        {c.name_en || c.name}
                        {c.name_hi && <span className="block text-[10px] font-normal text-slate-500">{c.name_hi}</span>}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700">
                          {c.category || 'Produce'}
                        </span>
                      </td>
                      <td className="p-3 font-mono">{c.default_unit || 'Box'} ({c.unit_weight_kg || 20} kg)</td>
                      <td className="p-3 text-right font-mono">{c.tare_deduction_kg || 1.0} kg</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">{c.standard_commission_pct || 6.0}%</td>
                      <td className="p-3 text-right font-mono">₹{c.palledari_rate_per_unit || 10}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 7: STAFF & MUNSHI TEAM ================= */}
      {activeTab === 'TEAM' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Agency Team &amp; Munshis (स्टाफ प्रबंधन)</h3>
              <p className="text-slate-500 text-[11px]">Staff members authorized to enter trade consignments, auctions, and cash transactions.</p>
            </div>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Staff Member
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Role &amp; Responsibilities</th>
                  <th className="p-3">Mobile Phone</th>
                  <th className="p-3">Permissions</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-slate-400">No staff members found.</td></tr>
                ) : (
                  members.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{m.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {m.role_label || m.role}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{m.phone || '—'}</td>
                      <td className="p-3 text-slate-500 text-[11px]">{m.permissions || 'Standard Access'}</td>
                      <td className="p-3 text-right">
                        {m.role !== 'shop_admin' && (
                          <button
                            onClick={() => handleDeleteMember(m.id, m.name)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: ADD PARTY ================= */}
      {showAddPartyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add New Party (नया पार्टी कोड)</h3>
              <button onClick={() => setShowAddPartyModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleAddPartySubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Short Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AGW"
                    value={partyForm.shortCode}
                    onChange={(e) => setPartyForm({ ...partyForm, shortCode: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono uppercase font-black text-emerald-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type *</label>
                  <select
                    value={partyForm.type}
                    onChange={(e) => setPartyForm({ ...partyForm, type: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Buyer">Buyer (खरीदार)</option>
                    <option value="Farmer">Farmer (किसान)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Legal / Trade Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aggarwal Wholesale Mart"
                  value={partyForm.name}
                  onChange={(e) => setPartyForm({ ...partyForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98..."
                    value={partyForm.mobile}
                    onChange={(e) => setPartyForm({ ...partyForm, mobile: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={partyForm.creditLimit}
                    onChange={(e) => setPartyForm({ ...partyForm, creditLimit: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Address / Mandi Shop</label>
                <input
                  type="text"
                  placeholder="Shop 14, Mandi Yard"
                  value={partyForm.address}
                  onChange={(e) => setPartyForm({ ...partyForm, address: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold">
                  Save Party Code
                </button>
                <button type="button" onClick={() => setShowAddPartyModal(false)} className="px-4 py-2.5 border rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ADD COMMODITY ================= */}
      {showAddCommodityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add Commodity (फसल मास्टर)</h3>
              <button onClick={() => setShowAddCommodityModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleAddCommoditySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Commodity Name (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apple - Royal Delicious"
                  value={commodityForm.nameEn}
                  onChange={(e) => setCommodityForm({ ...commodityForm, nameEn: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hindi Name</label>
                  <input
                    type="text"
                    placeholder="सेब - रॉयल"
                    value={commodityForm.nameHi}
                    onChange={(e) => setCommodityForm({ ...commodityForm, nameHi: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={commodityForm.category}
                    onChange={(e) => setCommodityForm({ ...commodityForm, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Fruit">Fruit (फल)</option>
                    <option value="Vegetable">Vegetable (सब्जी)</option>
                    <option value="Grain">Grain (अनाज)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Default Unit</label>
                  <input
                    type="text"
                    value={commodityForm.defaultUnit}
                    onChange={(e) => setCommodityForm({ ...commodityForm, defaultUnit: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Weight (Kg)</label>
                  <input
                    type="number"
                    value={commodityForm.unitWeightKg}
                    onChange={(e) => setCommodityForm({ ...commodityForm, unitWeightKg: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold">
                  Save Commodity
                </button>
                <button type="button" onClick={() => setShowAddCommodityModal(false)} className="px-4 py-2.5 border rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ADD STAFF ================= */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add Staff / Munshi (मुनीम)</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleAddMemberSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhe Shyam"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Role *</label>
                <select
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Munshi (Data Entry)">Munshi / Data Entry (आवक-बिक्री)</option>
                  <option value="Accountant (Cashier)">Accountant / Cashier (रोकड़िया / मुनीम)</option>
                  <option value="Shop Admin">Shop Admin (मालिक / पार्टनर - Full Access)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98..."
                    value={memberForm.mobile}
                    onChange={(e) => setMemberForm({ ...memberForm, mobile: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">4-Digit PIN *</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={memberForm.pin}
                    onChange={(e) => setMemberForm({ ...memberForm, pin: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono text-center font-bold"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold">
                  Confirm &amp; Add Staff
                </button>
                <button type="button" onClick={() => setShowAddMemberModal(false)} className="px-4 py-2.5 border rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
