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
  QrCode,
  Edit
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
    ifsc: '',
    logo_icon: '🍎',
    logo_url: ''
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

  // Modals state - Party Master
  const initialPartyState = {
    shortCode: '',
    name: '',
    type: 'Buyer',
    fatherName: '',
    mobile: '',
    alternateMobile: '',
    bankName: '',
    accountNo: '',
    ifsc: '',
    upiId: '',
    accountHolder: '',
    pan: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    creditLimit: '200000',
    openingBalance: '0',
    balanceType: 'Dr',
    paymentTermsDays: '15'
  };

  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [partyForm, setPartyForm] = useState(initialPartyState);
  const [partyModalTab, setPartyModalTab] = useState('BASIC'); // 'BASIC', 'BANK', 'TAX'

  const [showEditPartyModal, setShowEditPartyModal] = useState(false);
  const [editPartyForm, setEditPartyForm] = useState({ id: '', ...initialPartyState });
  const [editPartyModalTab, setEditPartyModalTab] = useState('BASIC');

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

  const [showEditCommodityModal, setShowEditCommodityModal] = useState(false);
  const [editCommodityForm, setEditCommodityForm] = useState({
    id: '',
    nameEn: '',
    nameHi: '',
    category: 'Fruit',
    defaultUnit: 'Box (20kg)',
    unitWeightKg: '20',
    tareDeductionKg: '1.0',
    standardCommissionPct: '6.0',
    palledariRatePerUnit: '10',
    active: 1
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
        ifsc: tenant.ifsc || '',
        logo_icon: tenant.logo_icon || '🍎',
        logo_url: tenant.logo_url || ''
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

  // Logo Image Upload Handler
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Logo image must be smaller than 2MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileForm(prev => ({ ...prev, logo_url: event.target.result }));
      setMessage({ type: 'success', text: 'Logo image loaded! Click "Save Profile & Banking" to apply permanently.' });
    };
    reader.readAsDataURL(file);
  };

  // 5. Add Party
  const handleAddPartySubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.addParty({
        ...partyForm,
        shortCode: partyForm.shortCode.toUpperCase().trim(),
        creditLimit: parseFloat(partyForm.creditLimit) || 0,
        openingBalance: parseFloat(partyForm.openingBalance) || 0,
        paymentTermsDays: parseInt(partyForm.paymentTermsDays) || 15
      });
      setMessage({ type: 'success', text: `Party "${partyForm.name}" [${partyForm.shortCode.toUpperCase()}] added successfully!` });
      setShowAddPartyModal(false);
      setPartyForm(initialPartyState);
      loadParties();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add party.' });
    }
  };

  // Edit Party Handlers
  const handleOpenEditParty = (p) => {
    setEditPartyForm({
      id: p.id,
      shortCode: p.short_code || '',
      name: p.name || '',
      type: p.type || 'Buyer',
      fatherName: p.father_name || '',
      mobile: p.mobile || '',
      alternateMobile: p.alternate_mobile || '',
      bankName: p.bank_name || '',
      accountNo: p.account_no || '',
      ifsc: p.ifsc || '',
      upiId: p.upi_id || '',
      accountHolder: p.account_holder || '',
      pan: p.pan || '',
      gstin: p.gstin || '',
      address: p.address || '',
      city: p.city || '',
      state: p.state || '',
      pincode: p.pincode || '',
      creditLimit: (p.credit_limit || 200000).toString(),
      openingBalance: (p.opening_balance || 0).toString(),
      balanceType: p.balance_type || 'Dr',
      paymentTermsDays: (p.payment_terms_days || 15).toString()
    });
    setEditPartyModalTab('BASIC');
    setShowEditPartyModal(true);
  };

  const handleSaveEditParty = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.updateParty(editPartyForm.id, {
        ...editPartyForm,
        shortCode: editPartyForm.shortCode.toUpperCase().trim(),
        creditLimit: parseFloat(editPartyForm.creditLimit) || 0,
        openingBalance: parseFloat(editPartyForm.openingBalance) || 0,
        paymentTermsDays: parseInt(editPartyForm.paymentTermsDays) || 15
      });
      setMessage({ type: 'success', text: `Party "${editPartyForm.name}" [${editPartyForm.shortCode.toUpperCase()}] updated successfully!` });
      setShowEditPartyModal(false);
      loadParties();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update party.' });
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

  // Edit Commodity Handlers
  const handleOpenEditCommodity = (c) => {
    setEditCommodityForm({
      id: c.id,
      nameEn: c.name_en || c.name || '',
      nameHi: c.name_hi || '',
      category: c.category || 'Fruit',
      defaultUnit: c.default_unit || 'Box (20kg)',
      unitWeightKg: (c.unit_weight_kg || 20).toString(),
      tareDeductionKg: (c.tare_deduction_kg || 1.0).toString(),
      standardCommissionPct: (c.standard_commission_pct || 6.0).toString(),
      palledariRatePerUnit: (c.palledari_rate_per_unit || 10).toString(),
      active: c.active !== undefined ? c.active : 1
    });
    setShowEditCommodityModal(true);
  };

  const handleSaveEditCommodity = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.updateCommodity(editCommodityForm.id, editCommodityForm);
      setMessage({ type: 'success', text: `Commodity "${editCommodityForm.nameEn}" updated successfully!` });
      setShowEditCommodityModal(false);
      loadCommodities();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update commodity.' });
    }
  };

  const handleDeleteCommodity = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete commodity "${name}"?`)) return;
    setMessage(null);
    try {
      await api.deleteCommodity(id);
      setMessage({ type: 'success', text: `Commodity "${name}" deleted successfully.` });
      loadCommodities();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete commodity.' });
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

          {/* Logo & Agency Brand Identity Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 text-xs block">Agency Logo &amp; Brand Icon (फर्म का लोगो व प्रतीक चिन्ह)</span>
                <span className="text-[11px] text-slate-500">Appears on sidebar, invoices, Form J vouchers, and letterhead headers.</span>
              </div>
              {profileForm.logo_url && (
                <button
                  type="button"
                  onClick={() => setProfileForm({ ...profileForm, logo_url: '' })}
                  className="text-rose-600 hover:text-rose-800 text-[11px] font-bold cursor-pointer"
                >
                  Remove Image Logo ✕
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Logo Preview */}
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl shadow-sm border border-slate-300 overflow-hidden shrink-0"
                style={{ backgroundColor: 'var(--primary-dark, #0f172a)', color: '#ffffff' }}
              >
                {profileForm.logo_url ? (
                  <img src={profileForm.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <span>{profileForm.logo_icon || '🍎'}</span>
                )}
              </div>

              {/* Upload & URL Inputs */}
              <div className="flex-1 space-y-2 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Upload Logo Image (PNG / JPG / WebP)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="w-full text-[11px] file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-black cursor-pointer text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Or Logo Image URL (वेब लिंक)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={profileForm.logo_url}
                      onChange={(e) => setProfileForm({ ...profileForm, logo_url: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Quick Emoji Picker */}
                <div>
                  <label className="font-bold text-slate-600 block mb-1 text-[11px]">Or Choose Standard Mandi Emoji Icon (प्रतीक इमोजी)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['🍎', '🥭', '🍇', '🍌', '🥔', '🧅', '🌾', '🌽', '🥦', '🥑', '🏢', '📦', '⚖️', '💰', '🚚'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, logo_icon: emoji })}
                        className={`w-7 h-7 text-base rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          profileForm.logo_icon === emoji && !profileForm.logo_url
                            ? 'bg-slate-900 text-white ring-2 ring-slate-900/30 shadow-xs'
                            : 'bg-white border border-slate-200 hover:bg-slate-100'
                        }`}
                        title={`Select ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
                  <th className="p-3">Party Name &amp; Details</th>
                  <th className="p-3 text-center">Type</th>
                  <th className="p-3">Mobile &amp; Bank / UPI</th>
                  <th className="p-3 text-right">Credit &amp; Terms</th>
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
                      <td className="p-3 font-mono font-black text-emerald-800 text-sm">{p.short_code}</td>
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.father_name && <span className="text-[10px] text-slate-500 font-normal">s/o {p.father_name}</span>}
                        </div>
                        {(p.address || p.city) && (
                          <span className="block text-[10px] font-normal text-slate-400">
                            {[p.address, p.city, p.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {(p.gstin || p.pan) && (
                          <span className="block text-[9px] font-mono text-slate-400">
                            {p.gstin ? `GST: ${p.gstin}` : `PAN: ${p.pan}`}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.type === 'Buyer' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">
                        <div className="font-mono text-xs">{p.mobile || '—'}</div>
                        {(p.bank_name || p.account_no) && (
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            <span>🏦 {p.bank_name || 'Bank'}</span>
                            {p.account_no && <span>• ...{p.account_no.slice(-4)}</span>}
                          </div>
                        )}
                        {p.upi_id && (
                          <div className="text-[10px] font-mono text-emerald-700 font-bold">
                            ⚡ {p.upi_id}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="font-mono font-bold text-slate-900">₹{(p.credit_limit || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.payment_terms_days ? `${p.payment_terms_days} days` : '15 days'} credit
                        </div>
                        {p.opening_balance > 0 && (
                          <div className="text-[9px] font-mono text-amber-700 font-bold">
                            Op: ₹{p.opening_balance} ({p.balance_type || 'Dr'})
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditParty(p)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors border border-blue-200"
                          title="Edit Party Details & Bank (विवरण संपादित करें)"
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteParty(p.id, p.name)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
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
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commodities.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-8 text-slate-400">No commodities registered yet.</td></tr>
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
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditCommodity(c)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors border border-blue-200"
                          title="Edit Commodity (फसल कॉन्फ़िगरेशन एडिट करें)"
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCommodity(c.id, c.name_en || c.name)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete Commodity"
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
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Add New Party Master (नई पार्टी प्रविष्टि)</h3>
                <p className="text-[11px] text-slate-500">Configure buyer / farmer profile, bank settlement, and credit limit.</p>
              </div>
              <button onClick={() => setShowAddPartyModal(false)} className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer">✕</button>
            </div>

            {/* Modal Internal Tabs */}
            <div className="flex border-b border-slate-200 gap-1 pb-1 text-xs font-bold">
              {[
                { id: 'BASIC', label: '1. Basic & Contact (संपर्क)' },
                { id: 'BANK', label: '2. Bank & UPI (खाता)' },
                { id: 'TAX', label: '3. Tax, Address & Credit (उधारी)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPartyModalTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    partyModalTab === tab.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddPartySubmit} className="space-y-3.5 text-xs">
              {/* TAB 1: BASIC & CONTACT */}
              {partyModalTab === 'BASIC' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Short Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AGW"
                        value={partyForm.shortCode}
                        onChange={(e) => setPartyForm({ ...partyForm, shortCode: e.target.value.toUpperCase() })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase font-black text-emerald-800 focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Type *</label>
                      <select
                        value={partyForm.type}
                        onChange={(e) => setPartyForm({ ...partyForm, type: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                      >
                        <option value="Buyer">Buyer (खरीदार / व्यापारी)</option>
                        <option value="Farmer">Farmer (किसान / उत्पादक)</option>
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
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Proprietor / Father's Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Aggarwal"
                        value={partyForm.fatherName}
                        onChange={(e) => setPartyForm({ ...partyForm, fatherName: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Primary Mobile Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98..."
                        value={partyForm.mobile}
                        onChange={(e) => setPartyForm({ ...partyForm, mobile: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Alternate Phone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="Optional alternate mobile"
                      value={partyForm.alternateMobile}
                      onChange={(e) => setPartyForm({ ...partyForm, alternateMobile: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: BANK & UPI */}
              {partyModalTab === 'BANK' && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px]">
                    Used for direct RTGS/NEFT online payments to farmers and collecting UPI payments from buyers.
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="As per bank passbook"
                      value={partyForm.accountHolder}
                      onChange={(e) => setPartyForm({ ...partyForm, accountHolder: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. State Bank of India, HDFC"
                        value={partyForm.bankName}
                        onChange={(e) => setPartyForm({ ...partyForm, bankName: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Account Number</label>
                      <input
                        type="text"
                        placeholder="Bank account number"
                        value={partyForm.accountNo}
                        onChange={(e) => setPartyForm({ ...partyForm, accountNo: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="e.g. SBIN0001234"
                        value={partyForm.ifsc}
                        onChange={(e) => setPartyForm({ ...partyForm, ifsc: e.target.value.toUpperCase() })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">UPI ID (VPA)</label>
                      <input
                        type="text"
                        placeholder="party@upi"
                        value={partyForm.upiId}
                        onChange={(e) => setPartyForm({ ...partyForm, upiId: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-emerald-800 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TAX, ADDRESS & CREDIT */}
              {partyModalTab === 'TAX' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">PAN Number</label>
                      <input
                        type="text"
                        placeholder="ABCDE1234F"
                        value={partyForm.pan}
                        onChange={(e) => setPartyForm({ ...partyForm, pan: e.target.value.toUpperCase() })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">GSTIN Number</label>
                      <input
                        type="text"
                        placeholder="07AAAAA0000A1Z5"
                        value={partyForm.gstin}
                        onChange={(e) => setPartyForm({ ...partyForm, gstin: e.target.value.toUpperCase() })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Address / Mandi Shop No.</label>
                    <input
                      type="text"
                      placeholder="Shop 14, New Subzi Mandi"
                      value={partyForm.address}
                      onChange={(e) => setPartyForm({ ...partyForm, address: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">City / District</label>
                      <input
                        type="text"
                        placeholder="Delhi / Shimla"
                        value={partyForm.city}
                        onChange={(e) => setPartyForm({ ...partyForm, city: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">State</label>
                      <input
                        type="text"
                        placeholder="Delhi / HP"
                        value={partyForm.state}
                        onChange={(e) => setPartyForm({ ...partyForm, state: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
                      <input
                        type="text"
                        placeholder="110033"
                        value={partyForm.pincode}
                        onChange={(e) => setPartyForm({ ...partyForm, pincode: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Credit Limit (₹)</label>
                      <input
                        type="number"
                        value={partyForm.creditLimit}
                        onChange={(e) => setPartyForm({ ...partyForm, creditLimit: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Opening Balance (₹)</label>
                      <input
                        type="number"
                        value={partyForm.openingBalance}
                        onChange={(e) => setPartyForm({ ...partyForm, openingBalance: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Balance Type</label>
                      <select
                        value={partyForm.balanceType}
                        onChange={(e) => setPartyForm({ ...partyForm, balanceType: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white"
                      >
                        <option value="Dr">Dr (लेना / Receivable)</option>
                        <option value="Cr">Cr (देना / Payable)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Payment Credit Terms (Days - उधार दिवस)</label>
                    <input
                      type="number"
                      value={partyForm.paymentTermsDays}
                      onChange={(e) => setPartyForm({ ...partyForm, paymentTermsDays: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                    />
                    <span className="text-[10px] text-slate-400">Standard APMC credit cycle is 15 calendar days.</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Party Code (पार्टी सुरक्षित करें)
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddPartyModal(false)} 
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 1B: EDIT PARTY ================= */}
      {showEditPartyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Edit Party Details (पार्टी विवरण संपादित करें)</h3>
                <p className="text-[11px] text-slate-500 font-mono">Code: {editPartyForm.shortCode} • ID: {editPartyForm.id}</p>
              </div>
              <button onClick={() => setShowEditPartyModal(false)} className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer">✕</button>
            </div>

            {/* Modal Internal Tabs */}
            <div className="flex border-b border-slate-200 gap-1 pb-1 text-xs font-bold">
              {[
                { id: 'BASIC', label: '1. Basic & Contact (संपर्क)' },
                { id: 'BANK', label: '2. Bank & UPI (खाता)' },
                { id: 'TAX', label: '3. Tax, Address & Credit (उधारी)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEditPartyModalTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    editPartyModalTab === tab.id
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveEditParty} className="space-y-3.5 text-xs">
              {/* TAB 1: BASIC & CONTACT */}
              {editPartyModalTab === 'BASIC' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Short Code *</label>
                      <input
                        type="text"
                        required
                        value={editPartyForm.shortCode}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, shortCode: e.target.value.toUpperCase() })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase font-black text-blue-900 focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Type *</label>
                      <select
                        value={editPartyForm.type}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, type: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                      >
                        <option value="Buyer">Buyer (खरीदार / व्यापारी)</option>
                        <option value="Farmer">Farmer (किसान / उत्पादक)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Full Legal / Trade Name *</label>
                    <input
                      type="text"
                      required
                      value={editPartyForm.name}
                      onChange={(e) => setEditPartyForm({ ...editPartyForm, name: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Proprietor / Father's Name</label>
                      <input
                        type="text"
                        value={editPartyForm.fatherName}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, fatherName: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Primary Mobile Phone *</label>
                      <input
                        type="tel"
                        required
                        value={editPartyForm.mobile}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, mobile: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Alternate Phone / WhatsApp</label>
                    <input
                      type="tel"
                      value={editPartyForm.alternateMobile}
                      onChange={(e) => setEditPartyForm({ ...editPartyForm, alternateMobile: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: BANK & UPI */}
              {editPartyModalTab === 'BANK' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 text-[11px]">
                    Banking information for farmer RTGS/NEFT payments and digital UPI settlement.
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="Account holder name"
                      value={editPartyForm.accountHolder}
                      onChange={(e) => setEditPartyForm({ ...editPartyForm, accountHolder: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. State Bank of India"
                        value={editPartyForm.bankName}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, bankName: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Account Number</label>
                      <input
                        type="text"
                        placeholder="Account Number"
                        value={editPartyForm.accountNo}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, accountNo: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="e.g. SBIN0001234"
                        value={editPartyForm.ifsc}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, ifsc: e.target.value.toUpperCase() })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">UPI ID (VPA)</label>
                      <input
                        type="text"
                        placeholder="party@upi"
                        value={editPartyForm.upiId}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, upiId: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-blue-900 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TAX, ADDRESS & CREDIT */}
              {editPartyModalTab === 'TAX' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">PAN Number</label>
                      <input
                        type="text"
                        placeholder="ABCDE1234F"
                        value={editPartyForm.pan}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, pan: e.target.value.toUpperCase() })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">GSTIN Number</label>
                      <input
                        type="text"
                        placeholder="07AAAAA0000A1Z5"
                        value={editPartyForm.gstin}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, gstin: e.target.value.toUpperCase() })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Address / Mandi Shop No.</label>
                    <input
                      type="text"
                      placeholder="Shop 14, Mandi Yard"
                      value={editPartyForm.address}
                      onChange={(e) => setEditPartyForm({ ...editPartyForm, address: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">City / District</label>
                      <input
                        type="text"
                        placeholder="City"
                        value={editPartyForm.city}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, city: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">State</label>
                      <input
                        type="text"
                        placeholder="State"
                        value={editPartyForm.state}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, state: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
                      <input
                        type="text"
                        placeholder="PIN"
                        value={editPartyForm.pincode}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, pincode: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Credit Limit (₹)</label>
                      <input
                        type="number"
                        value={editPartyForm.creditLimit}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, creditLimit: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Opening Balance (₹)</label>
                      <input
                        type="number"
                        value={editPartyForm.openingBalance}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, openingBalance: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Balance Type</label>
                      <select
                        value={editPartyForm.balanceType}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, balanceType: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white"
                      >
                        <option value="Dr">Dr (लेना / Receivable)</option>
                        <option value="Cr">Cr (देना / Payable)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Payment Credit Terms (Days - उधार दिवस)</label>
                    <input
                      type="number"
                      value={editPartyForm.paymentTermsDays}
                      onChange={(e) => setEditPartyForm({ ...editPartyForm, paymentTermsDays: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Update Party Details (विवरण अपडेट करें)
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowEditPartyModal(false)} 
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
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
                <button type="submit" className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer">
                  Save Commodity
                </button>
                <button type="button" onClick={() => setShowAddCommodityModal(false)} className="px-4 py-2.5 border rounded-xl cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2B: EDIT COMMODITY CONFIGURATION ================= */}
      {showEditCommodityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Edit Commodity Configuration (फसल कॉन्फ़िगरेशन एडिट करें)</h3>
                <p className="text-[11px] text-slate-500 font-mono">ID: {editCommodityForm.id}</p>
              </div>
              <button onClick={() => setShowEditCommodityModal(false)} className="text-slate-400 hover:text-slate-700 text-lg p-1 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveEditCommodity} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Commodity Name (English) *</label>
                <input
                  type="text"
                  required
                  value={editCommodityForm.nameEn}
                  onChange={(e) => setEditCommodityForm({ ...editCommodityForm, nameEn: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hindi Name (हिंदी नाम)</label>
                  <input
                    type="text"
                    value={editCommodityForm.nameHi}
                    onChange={(e) => setEditCommodityForm({ ...editCommodityForm, nameHi: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category (श्रेणी)</label>
                  <select
                    value={editCommodityForm.category}
                    onChange={(e) => setEditCommodityForm({ ...editCommodityForm, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  >
                    <option value="Fruit">Fruit (फल)</option>
                    <option value="Vegetable">Vegetable (सब्जी)</option>
                    <option value="Grain">Grain (अनाज)</option>
                    <option value="Exotic">Exotic Produce</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Default Unit (पैकिंग प्रकार)</label>
                  <input
                    type="text"
                    value={editCommodityForm.defaultUnit}
                    onChange={(e) => setEditCommodityForm({ ...editCommodityForm, defaultUnit: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Weight (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editCommodityForm.unitWeightKg}
                    onChange={(e) => setEditCommodityForm({ ...editCommodityForm, unitWeightKg: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tare Wt (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editCommodityForm.tareDeductionKg}
                    onChange={(e) => setEditCommodityForm({ ...editCommodityForm, tareDeductionKg: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Commission %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editCommodityForm.standardCommissionPct}
                    onChange={(e) => setEditCommodityForm({ ...editCommodityForm, standardCommissionPct: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Palledari (₹)</label>
                  <input
                    type="number"
                    step="1"
                    value={editCommodityForm.palledariRatePerUnit}
                    onChange={(e) => setEditCommodityForm({ ...editCommodityForm, palledariRatePerUnit: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="commodityActive"
                  checked={editCommodityForm.active === 1 || editCommodityForm.active === true}
                  onChange={(e) => setEditCommodityForm({ ...editCommodityForm, active: e.target.checked ? 1 : 0 })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="commodityActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Active Produce (व्यापार एवं नीलामी हेतु सक्रिय)
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Update Commodity Configuration
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowEditCommodityModal(false)} 
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
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
