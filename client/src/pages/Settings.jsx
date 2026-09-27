import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useTenant, THEME_PRESETS } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  Edit,
  Sparkles,
  Receipt,
  Crown,
  Check,
  Download,
  Upload,
  History,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';

export default function Settings() {
  const { currentTenant, activeTenant, applyTheme, refreshTenant } = useTenant();
  const tenant = currentTenant || activeTenant;
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('settings_active_subtab');
    if (saved) {
      sessionStorage.removeItem('settings_active_subtab');
      return saved;
    }
    return 'PROFILE';
  }); // PROFILE, THEME, STATUTORY, PRINTER, PARTIES, COMMODITIES, TEAM, VARIETIES, EXPENSES, PLANS
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Sub-data
  const [parties, setParties] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [members, setMembers] = useState([]);
  const [partySearch, setPartySearch] = useState('');

  // Varieties Master State
  const [varieties, setVarieties] = useState([]);
  const [showAddVarietyModal, setShowAddVarietyModal] = useState(false);
  const [showEditVarietyModal, setShowEditVarietyModal] = useState(false);
  const [varietyForm, setVarietyForm] = useState({ commodityName: '', name: '', nameHi: '', grade: 'Grade A', defaultRate: '' });
  const [editVarietyForm, setEditVarietyForm] = useState({ id: '', commodityName: '', name: '', nameHi: '', grade: 'Grade A', defaultRate: '' });

  // Mandi Expense Heads State
  const [expenseHeads, setExpenseHeads] = useState([]);
  const [expenseTargetFilter, setExpenseTargetFilter] = useState('ALL');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ name: '', hindiName: '', target: 'farmer', type: 'per_unit', defaultAmount: '', isMandatory: false });
  const [editExpenseForm, setEditExpenseForm] = useState({ id: '', name: '', hindiName: '', target: 'farmer', type: 'per_unit', defaultAmount: '', isMandatory: false, isActive: true });

  // Subscription Plans & Buy Plan Flow State
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [showBuyPlanModal, setShowBuyPlanModal] = useState(false);
  const [selectedPlanForBuy, setSelectedPlanForBuy] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [subscribing, setSubscribing] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditFromDate, setAuditFromDate] = useState('');
  const [auditToDate, setAuditToDate] = useState('');
  const [auditUserId, setAuditUserId] = useState('');
  const [auditSearchText, setAuditSearchText] = useState('');
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  // File input ref for Party Import
  const importFileRef = React.useRef(null);

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
    interest_rate: '18.0',
    opening_cash: '0'
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
        interest_rate: '18.0',
        opening_cash: (tenant.opening_cash !== undefined && tenant.opening_cash !== null) ? tenant.opening_cash.toString() : '0'
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
    if (activeTab === 'VARIETIES') loadVarieties();
    if (activeTab === 'EXPENSES') loadExpenses();
    if (activeTab === 'AUDIT_LOGS') loadAuditLogs();
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

  const loadVarieties = async () => {
    setLoading(true);
    try {
      const res = await api.getVarieties();
      setVarieties(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.getExpenses();
      setExpenseHeads(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const params = {};
      if (auditActionFilter) params.action = auditActionFilter;
      if (auditFromDate) params.fromDate = auditFromDate;
      if (auditToDate) params.toDate = auditToDate;
      if (auditUserId) params.userId = auditUserId;
      const res = await api.getAuditLogs(params);
      setAuditLogs(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  // Party Import / Export Handlers
  const handleExportParties = () => {
    if (!parties || parties.length === 0) {
      setMessage({ type: 'error', text: 'No parties to export.' });
      return;
    }
    const headers = [
      'Short Code', 'Party Name', 'Type', 'Father Name', 'Mobile', 'Alternate Mobile',
      'Address', 'City', 'State', 'Pincode', 'GSTIN', 'PAN',
      'Bank Name', 'Account No', 'IFSC', 'UPI ID', 'Credit Limit', 'Opening Balance', 'Balance Type', 'Payment Terms Days'
    ];
    
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    };

    const rows = parties.map(p => [
      p.short_code || '',
      p.name || '',
      p.type || 'Buyer',
      p.father_name || '',
      p.mobile || '',
      p.alternate_mobile || '',
      p.address || '',
      p.city || '',
      p.state || '',
      p.pincode || '',
      p.gstin || '',
      p.pan || '',
      p.bank_name || '',
      p.account_no || '',
      p.ifsc || '',
      p.upi_id || '',
      p.credit_limit || 0,
      p.opening_balance || 0,
      p.balance_type || 'Dr',
      p.payment_terms_days || 15
    ].map(escapeCsv).join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mandi_parties_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: `Exported ${parties.length} parties to CSV!` });
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'Short Code', 'Party Name', 'Type', 'Father Name', 'Mobile', 'Alternate Mobile',
      'Address', 'City', 'State', 'Pincode', 'GSTIN', 'PAN',
      'Bank Name', 'Account No', 'IFSC', 'UPI ID', 'Credit Limit', 'Opening Balance', 'Balance Type', 'Payment Terms Days'
    ];
    const sampleRows = [
      ['AGW', 'Aggarwal Traders', 'Buyer', 'Ram Kumar', '9811122233', '', 'Shop 24 Azadpur Mandi', 'Delhi', 'Delhi', '110033', '07AAAAA0000A1Z5', '', 'SBI', '12345678901', 'SBIN0001234', 'aggarwal@upi', '200000', '0', 'Dr', '15'],
      ['K-RAM', 'Ramesh Farmer', 'Farmer', 'Shyam Lal', '9822233344', '', 'Village Kotgarh', 'Shimla', 'HP', '172031', '', '', 'HDFC Bank', '98765432109', 'HDFC0001234', 'ramesh@okhdfcbank', '0', '0', 'Cr', '0'],
      ['AG-1', 'Suresh Broker', 'Agent', '', '9833344455', '', 'Azadpur Mandi Gate 2', 'Delhi', 'Delhi', '110033', '', '', '', '', '', '', '0', '0', 'Dr', '0']
    ];
    
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...sampleRows.map(r => r.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'parties_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const parseRow = (line) => {
      const row = [];
      let insideQuotes = false;
      let entry = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        if (char === '"') {
          if (insideQuotes && nextChar === '"') {
            entry += '"';
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          row.push(entry.trim());
          entry = '';
        } else {
          entry += char;
        }
      }
      row.push(entry.trim());
      return row;
    };

    const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const partiesData = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseRow(lines[i]);
      if (values.length === 0 || values.every(v => !v)) continue;

      const rowObj = {};
      headers.forEach((header, idx) => {
        rowObj[header] = values[idx] || '';
      });

      const party = {
        shortCode: rowObj['shortcode'] || rowObj['code'] || '',
        name: rowObj['partyname'] || rowObj['name'] || '',
        type: rowObj['type'] || 'Buyer',
        fatherName: rowObj['fathername'] || '',
        mobile: rowObj['mobile'] || rowObj['phone'] || '',
        alternateMobile: rowObj['alternatemobile'] || '',
        address: rowObj['address'] || '',
        city: rowObj['city'] || '',
        state: rowObj['state'] || '',
        pincode: rowObj['pincode'] || '',
        gstin: rowObj['gstin'] || rowObj['gst'] || '',
        pan: rowObj['pan'] || '',
        bankName: rowObj['bankname'] || rowObj['bank'] || '',
        accountNo: rowObj['accountno'] || rowObj['account'] || '',
        ifsc: rowObj['ifsc'] || '',
        upiId: rowObj['upiid'] || rowObj['upi'] || '',
        creditLimit: parseFloat(rowObj['creditlimit']) || 0,
        openingBalance: parseFloat(rowObj['openingbalance']) || 0,
        balanceType: rowObj['balancetype'] || 'Dr',
        paymentTermsDays: parseInt(rowObj['paymenttermsdays'] || rowObj['terms']) || 15
      };

      if (party.name) {
        partiesData.push(party);
      }
    }

    return partiesData;
  };

  const handleImportParties = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const parsedParties = parseCSV(text);
        if (parsedParties.length === 0) {
          setMessage({ type: 'error', text: 'No valid party rows found in CSV. Please verify file format.' });
          return;
        }
        setLoading(true);
        const res = await api.importParties(parsedParties);
        setMessage({ type: 'success', text: res.message || `Successfully imported ${parsedParties.length} parties!` });
        loadParties();
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Failed to import parties: ' + err.message });
      } finally {
        setLoading(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Varieties Handlers
  const handleAddVarietySubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.addVariety({
        commodityName: varietyForm.commodityName || 'Produce',
        name: varietyForm.name.trim(),
        nameHi: varietyForm.nameHi ? varietyForm.nameHi.trim() : '',
        grade: varietyForm.grade || 'Grade A',
        defaultRate: parseFloat(varietyForm.defaultRate) || 0
      });
      setMessage({ type: 'success', text: `Variety "${varietyForm.name}" added successfully!` });
      setShowAddVarietyModal(false);
      setVarietyForm({ commodityName: '', name: '', nameHi: '', grade: 'Grade A', defaultRate: '' });
      loadVarieties();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add variety.' });
    }
  };

  const handleOpenEditVariety = (v) => {
    setEditVarietyForm({
      id: v.id,
      commodityName: v.commodity_name || '',
      name: v.name || '',
      nameHi: v.name_hi || '',
      grade: v.grade || 'Grade A',
      defaultRate: (v.default_rate || '').toString()
    });
    setShowEditVarietyModal(true);
  };

  const handleSaveEditVariety = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.updateVariety(editVarietyForm.id, {
        commodityName: editVarietyForm.commodityName,
        name: editVarietyForm.name.trim(),
        nameHi: editVarietyForm.nameHi ? editVarietyForm.nameHi.trim() : '',
        grade: editVarietyForm.grade,
        defaultRate: parseFloat(editVarietyForm.defaultRate) || 0
      });
      setMessage({ type: 'success', text: `Variety "${editVarietyForm.name}" updated successfully!` });
      setShowEditVarietyModal(false);
      loadVarieties();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update variety.' });
    }
  };

  const handleDeleteVariety = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete variety "${name}"?`)) return;
    try {
      await api.deleteVariety(id);
      setMessage({ type: 'success', text: `Variety "${name}" deleted.` });
      loadVarieties();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete variety.' });
    }
  };

  // Expenses Handlers
  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.addExpense({
        name: expenseForm.name.trim(),
        hindiName: expenseForm.hindiName ? expenseForm.hindiName.trim() : '',
        target: expenseForm.target || 'farmer',
        type: expenseForm.type || 'per_unit',
        defaultAmount: parseFloat(expenseForm.defaultAmount) || 0,
        isMandatory: expenseForm.isMandatory
      });
      setMessage({ type: 'success', text: `Expense head "${expenseForm.name}" created successfully!` });
      setShowAddExpenseModal(false);
      setExpenseForm({ name: '', hindiName: '', target: 'farmer', type: 'per_unit', defaultAmount: '', isMandatory: false });
      loadExpenses();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to create expense head.' });
    }
  };

  const handleOpenEditExpense = (exp) => {
    setEditExpenseForm({
      id: exp.id,
      name: exp.name || '',
      hindiName: exp.hindi_name || '',
      target: exp.target || 'farmer',
      type: exp.type || 'per_unit',
      defaultAmount: (exp.default_amount || 0).toString(),
      isMandatory: !!exp.is_mandatory,
      isActive: exp.is_active !== 0
    });
    setShowEditExpenseModal(true);
  };

  const handleSaveEditExpense = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.updateExpense(editExpenseForm.id, {
        name: editExpenseForm.name.trim(),
        hindiName: editExpenseForm.hindiName ? editExpenseForm.hindiName.trim() : '',
        target: editExpenseForm.target,
        type: editExpenseForm.type,
        defaultAmount: parseFloat(editExpenseForm.defaultAmount) || 0,
        isMandatory: editExpenseForm.isMandatory,
        isActive: editExpenseForm.isActive
      });
      setMessage({ type: 'success', text: `Expense head "${editExpenseForm.name}" updated successfully!` });
      setShowEditExpenseModal(false);
      loadExpenses();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update expense head.' });
    }
  };

  const handleDeleteExpense = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete expense head "${name}"?`)) return;
    try {
      await api.deleteExpense(id);
      setMessage({ type: 'success', text: `Expense head "${name}" deleted.` });
      loadExpenses();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete expense head.' });
    }
  };

  // Buy Plan Flow Handlers
  const SUBSCRIPTION_PLANS = [
    {
      id: 'Free',
      name: 'Free Trial (मुफ़्त - परीक्षण)',
      priceMonthly: 0,
      priceAnnual: 0,
      tag: 'Free Forever',
      color: 'slate',
      features: [
        '1 Shop Munshi / User',
        'Up to 50 Consignments/month',
        'Basic Inward Arrivals & Truck Log',
        'Basic Rokad Cashbook',
        'Standard Thermal Slip Print'
      ]
    },
    {
      id: 'Starter',
      name: 'Mandi Starter (शुरुआती आढ़त)',
      priceMonthly: 999,
      priceAnnual: 9999,
      tag: 'Best for Small Agencies',
      color: 'blue',
      features: [
        '2 Users (Munshi + Cashier)',
        'Up to 250 Consignments/month',
        'Full Bahi-Khata Ledger & Udhaar Aging',
        'Multi-Buyer Lot Split Sales',
        'WhatsApp Teep & J-Form PDF Sharing',
        '15-Day Statutory APMC Interest'
      ]
    },
    {
      id: 'Pro',
      name: 'Mandi Pro (प्रो - बेस्ट सेलर)',
      priceMonthly: 2499,
      priceAnnual: 24999,
      tag: '⭐ Most Popular (बेस्ट चॉइस)',
      popular: true,
      color: 'emerald',
      features: [
        '5 Users (Admin, Cashier, Munshis)',
        'Unlimited Trucks & Consignments',
        'Automated Double-Entry Journal (Dr = Cr)',
        'Full Trial Balance (तलपट) & Balance Sheet',
        'Custom Mandi Expense Heads (Farmer & Buyer)',
        'Varieties & Grades Master Configuration',
        'Priority WhatsApp & Call Support'
      ]
    },
    {
      id: 'Enterprise',
      name: 'Corporate Mandi (मंडी लीडर)',
      priceMonthly: 4999,
      priceAnnual: 49999,
      tag: 'Multi-Branch & Cold Storage',
      color: 'purple',
      features: [
        'Unlimited Staff Accounts',
        'Multi-Branch & Yard Storage Sync',
        'Cold Storage Integration Ready',
        'Custom APMC Statutory Tax Engines',
        'Dedicated Account Manager (24/7)',
        'Data Backup & Custom Reports'
      ]
    }
  ];

  const handleOpenBuyPlan = (plan) => {
    setSelectedPlanForBuy(plan);
    setShowBuyPlanModal(true);
  };

  const handleConfirmSubscription = async (e) => {
    e.preventDefault();
    if (!tenant || !selectedPlanForBuy) return;
    setSubscribing(true);
    setMessage(null);
    try {
      const price = billingCycle === 'annual' ? selectedPlanForBuy.priceAnnual : selectedPlanForBuy.priceMonthly;
      const res = await api.subscribePlan(tenant.id, {
        plan: selectedPlanForBuy.id,
        billingCycle,
        paymentMethod,
        amountPaid: price
      });
      setMessage({
        type: 'success',
        text: `🎉 Congratulations! Successfully subscribed to ${selectedPlanForBuy.name} (${billingCycle.toUpperCase()})! Invoice: ${res.invoiceNo || 'INV-' + Date.now().toString().slice(-4)}`
      });
      setShowBuyPlanModal(false);
      refreshTenant();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Subscription failed.' });
    } finally {
      setSubscribing(false);
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
      if (ratesForm.opening_cash !== undefined && ratesForm.opening_cash !== '') {
        await api.setOpeningCash(parseFloat(ratesForm.opening_cash) || 0);
      }
      setMessage({ type: 'success', text: 'Statutory APMC rates and opening cash saved successfully!' });
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
          {t('Mandi Settings & Master Configuration', 'मंडी सेटिंग्स एवं मास्टर कॉन्फ़िगरेशन')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('Full control of your APMC agency identity, banking, multi-theme branding, party short codes, commodities & team.', 'अपनी एपीएमसी एजेंसी विवरण, बैंक खाता, थीम रंग, पार्टी शॉर्ट कोड, फसल सूची और मुनीम स्टाफ का पूर्ण प्रबंधन।')}
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
          { id: 'PROFILE', labelEn: '1. Firm Profile & Bank', labelHi: '1. फर्म विवरण व बैंक', icon: Building2 },
          { id: 'THEME', labelEn: '2. Multi-Theme Palette', labelHi: '2. थीम रंग चयन', icon: Palette },
          { id: 'STATUTORY', labelEn: '3. Statutory APMC Rates', labelHi: '3. मंडी शुल्क दरें', icon: Scale },
          { id: 'PRINTER', labelEn: '4. Printer & Formats', labelHi: '4. प्रिंटर व फॉर्मेट', icon: Printer },
          { id: 'PARTIES', labelEn: '5. Party Master', labelHi: '5. पार्टी मास्टर (शॉर्ट कोड)', icon: Tag },
          { id: 'COMMODITIES', labelEn: '6. Commodity Master', labelHi: '6. फसल मास्टर', icon: Apple },
          { id: 'TEAM', labelEn: '7. Staff & Munshis', labelHi: '7. स्टाफ एवं मुनीम', icon: Users },
          { id: 'VARIETIES', labelEn: '8. Varieties & Grades', labelHi: '8. किस्म व ग्रेड मास्टर', icon: Sparkles },
          { id: 'EXPENSES', labelEn: '9. Expense Heads', labelHi: '9. मंडी खर्चे (कटौतियां)', icon: Receipt },
          { id: 'PLANS', labelEn: '10. Subscription Plans', labelHi: '10. सब्सक्रिप्शन व प्लान', icon: Crown },
          { id: 'AUDIT_LOGS', labelEn: '11. Audit Logs', labelHi: '11. ऑडिट लॉग्स', icon: History }
        ].map(tItem => {
          const Icon = tItem.icon;
          const isActive = activeTab === tItem.id;
          return (
            <button
              key={tItem.id}
              type="button"
              onClick={() => { setActiveTab(tItem.id); setMessage(null); }}
              className={`px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {language === 'hi' ? tItem.labelHi : tItem.labelEn}
            </button>
          );
        })}
      </div>

      {/* ================= SUB-TAB 1: FIRM PROFILE & BANK ================= */}
      {activeTab === 'PROFILE' && (
        <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">{t('Firm Profile & Banking Details', 'फर्म विवरण एवं बैंक खाते की जानकारी')}</h3>
            <p className="text-slate-500 text-[11px]">Printed on official bills, J-Forms, Purcha slips and Teep vouchers.</p>
          </div>

          {/* Logo & Agency Brand Identity Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 text-xs block">{t('Agency Logo & Brand Icon', 'फर्म का लोगो एवं प्रतीक चिन्ह')}</span>
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
                    <label className="font-bold text-slate-700 block mb-1">{t('Or Logo Image URL', 'या लोगो इमेज यूआरएल')}</label>
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
                  <label className="font-bold text-slate-600 block mb-1 text-[11px]">{t('Or Choose Standard Mandi Emoji Icon', 'या मानक मंडी इमोजी प्रतीक चुनें')}</label>
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
              <label className="font-bold text-slate-700 block mb-1">{t('Hindi Name', 'हिंदी नाम')}</label>
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
              <span>{t('Banking & Digital UPI Settlement', 'बैंक खाता एवं डिजिटल यूपीआई विवरण')}</span>
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
            <h3 className="text-sm font-bold text-slate-900">{t('Multi-Theme Palette', 'थीम रंग चयन')}</h3>
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
            <h3 className="text-sm font-bold text-slate-900">{t('Statutory APMC Delhi Rates & Bye-Laws', 'मंडी शुल्क एवं कानूनी दरें')}</h3>
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

            <div className="sm:col-span-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <label className="font-bold text-emerald-950 block mb-1">
                {t('Opening Cash in Hand (आरंभिक रोकड़ शेष ₹)', 'आरंभिक रोकड़ शेष (₹) - गल्ला / तिजोरी')}
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={ratesForm.opening_cash}
                onChange={(e) => setRatesForm({ ...ratesForm, opening_cash: e.target.value })}
                className="w-full p-2.5 border border-emerald-300 rounded-xl font-bold font-mono text-emerald-900 bg-white"
                placeholder="0"
              />
              <span className="text-[10px] text-emerald-700 mt-1 block">
                {t('Default is ₹0 for new accounts. Enter the initial cash amount in your Mandi shop drawer or safe to initialize the Rokad cashbook.', 'नए खातों हेतु यह ₹0 रहेगा। अपनी दुकान के गल्ले की शुरुआत की नकद राशि यहाँ दर्ज करें।')}
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
            <h3 className="text-sm font-bold text-slate-900">{t('Printer Format & Custom Disclaimers', 'प्रिंटर फॉर्मेट एवं कानूनी नियम')}</h3>
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
              <h3 className="text-sm font-bold text-slate-900">{t('Party Master (Short Codes)', 'पार्टी मास्टर (शॉर्ट कोड)')}</h3>
              <p className="text-slate-500 text-[11px]">Manage buyer short codes (AGW, RJD) and farmer accounts for instant auction allocation.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-44">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search short code or name..."
                  value={partySearch}
                  onChange={(e) => setPartySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              {/* Download Template CSV */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold shadow-xs shrink-0 flex items-center gap-1 cursor-pointer transition-all"
                title="Download CSV format template with sample records"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('Template', 'टेम्पलेट')}</span>
              </button>

              {/* Export Parties CSV */}
              <button
                type="button"
                onClick={handleExportParties}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold shadow-xs shrink-0 flex items-center gap-1 cursor-pointer transition-all"
                title="Export all parties to Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-blue-700" />
                <span>{t('Export', 'एक्सपोर्ट')}</span>
              </button>

              {/* Import Parties CSV */}
              <input
                type="file"
                ref={importFileRef}
                accept=".csv"
                onChange={handleImportParties}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => importFileRef.current?.click()}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold shadow-xs shrink-0 flex items-center gap-1 cursor-pointer transition-all"
                title="Upload & Import Parties from Excel / CSV"
              >
                <Upload className="w-3.5 h-3.5 text-amber-700" />
                <span>{t('Import', 'इम्पोर्ट')}</span>
              </button>

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
                          p.type === 'Buyer' ? 'bg-blue-100 text-blue-800' : p.type === 'Agent' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
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

      {/* ================= SUB-TAB 8: VARIETIES & QUALITY GRADES ================= */}
      {activeTab === 'VARIETIES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Varieties & Quality Grades Master (किस्म व ग्रेड मास्टर)
              </h3>
              <p className="text-slate-500 text-[11px]">
                Configure produce variety names (e.g. Royal Delicious, Golden Grade A) and quality grades for quick autocomplete on Inward Arrivals and Sales.
              </p>
            </div>
            <button
              onClick={() => {
                setVarietyForm({ commodityName: commodities[0]?.name_en || commodities[0]?.name || 'Produce', name: '', nameHi: '', grade: 'Grade A', defaultRate: '' });
                setShowAddVarietyModal(true);
              }}
              className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Variety (नई किस्म)
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Variety / Quality Name</th>
                  <th className="p-3">Linked Commodity</th>
                  <th className="p-3 text-center">Grade</th>
                  <th className="p-3 text-right">Default Rate (₹)</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {varieties.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-slate-400">
                      <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      No produce varieties registered yet. Click &quot;Add Variety&quot; to configure your first quality grade.
                    </td>
                  </tr>
                ) : (
                  varieties.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">
                        {v.name}
                        {v.name_hi && <span className="block text-[10px] font-normal text-slate-500">{v.name_hi}</span>}
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {v.commodity_name || 'All Commodities'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {v.grade || 'Standard'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {v.default_rate ? `₹${Number(v.default_rate).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditVariety(v)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors border border-blue-200"
                          title="Edit Variety"
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteVariety(v.id, v.name)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete Variety"
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

      {/* ================= SUB-TAB 9: MANDI EXPENSE HEADS ================= */}
      {activeTab === 'EXPENSES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Mandi Expense Heads & Deductions (मंडी खर्चे व कटौतियां)
              </h3>
              <p className="text-slate-500 text-[11px]">
                Configure standard APMC charges, palledari (labour), freight, bardana, and custom deductions for Farmers (Inward) and Buyers (Sales Invoices).
              </p>
            </div>
            <button
              onClick={() => {
                setExpenseForm({ name: '', hindiName: '', target: 'farmer', type: 'per_unit', defaultAmount: '', isMandatory: false });
                setShowAddExpenseModal(true);
              }}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Expense Head (नया खर्च)
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 pt-1 border-b border-slate-100 pb-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Target:</span>
            {[
              { id: 'ALL', label: 'All Expenses (सभी खर्चे)' },
              { id: 'farmer', label: 'Farmer Deductions (किसान से कटौती)' },
              { id: 'buyer', label: 'Buyer Charges (खरीदार प्रभार)' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setExpenseTargetFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  expenseTargetFilter === f.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Expense Head</th>
                  <th className="p-3 text-center">Applied To (Target)</th>
                  <th className="p-3 text-center">Calculation Type</th>
                  <th className="p-3 text-right">Default Amount / Rate</th>
                  <th className="p-3 text-center">Mandatory</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenseHeads.filter(e => expenseTargetFilter === 'ALL' || e.target === expenseTargetFilter).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">
                      <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      No expense heads configured for this filter. Click &quot;Add Expense Head&quot; to define standard Mandi charges.
                    </td>
                  </tr>
                ) : (
                  expenseHeads
                    .filter(e => expenseTargetFilter === 'ALL' || e.target === expenseTargetFilter)
                    .map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">
                          {exp.name}
                          {exp.hindi_name && <span className="block text-[10px] font-normal text-slate-500">{exp.hindi_name}</span>}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            exp.target === 'farmer'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {exp.target === 'farmer' ? '🌾 Farmer (आवक)' : '🛒 Buyer (बिक्री)'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                            {exp.type === 'per_unit' && '₹ / Nag (प्रति नग)'}
                            {exp.type === 'percentage' && '% of Gross (प्रतिशत)'}
                            {exp.type === 'fixed' && 'Flat Fixed (एकमुश्त ₹)'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {exp.type === 'percentage' ? `${exp.default_amount}%` : `₹${exp.default_amount}`}
                        </td>
                        <td className="p-3 text-center">
                          {exp.is_mandatory ? (
                            <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Mandatory
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Optional</span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEditExpense(exp)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors border border-blue-200"
                            title="Edit Expense"
                          >
                            <Edit className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id, exp.name)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete Expense"
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

      {/* ================= SUB-TAB 10: SUBSCRIPTION PLANS & BUY PLAN ================= */}
      {activeTab === 'PLANS' && (
        <div className="space-y-6">
          {/* Active Plan Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                  <Crown className="w-3.5 h-3.5" /> Current Active Plan
                </span>
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  {(tenant?.subscription_plan || 'Free').toUpperCase()} TIER
                  <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    Active &bull; {tenant?.subscription_status || 'Active'}
                  </span>
                </h2>
                <p className="text-slate-300 text-xs mt-1 max-w-xl">
                  {tenant?.firm_name} is operating on the {tenant?.subscription_plan || 'Free'} tier. Upgrade to unlock unlimited consignments, double-entry automated trial balance & balance sheet, custom expense heads, and multi-user access.
                </p>
              </div>

              {/* Billing Cycle Toggle */}
              <div className="bg-white/10 p-1.5 rounded-2xl flex items-center gap-1 border border-white/10 shrink-0 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-slate-950 shadow-md'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  Monthly (मासिक)
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    billingCycle === 'annual'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  Annual (वार्षिक)
                  <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Tier Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUBSCRIPTION_PLANS.map(plan => {
              const isCurrent = (tenant?.subscription_plan || 'Free').toLowerCase() === plan.id.toLowerCase();
              const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
              const period = billingCycle === 'annual' ? '/year' : '/month';

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 ${
                    plan.popular
                      ? 'bg-white border-2 border-emerald-500 shadow-xl ring-2 ring-emerald-500/20'
                      : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-sm tracking-wider">
                      Most Popular
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        plan.id === 'Pro'
                          ? 'bg-emerald-100 text-emerald-800'
                          : plan.id === 'Enterprise'
                          ? 'bg-purple-100 text-purple-800'
                          : plan.id === 'Starter'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {plan.tag}
                      </span>
                    </div>

                    <h3 className="font-black text-slate-900 text-base">{plan.name}</h3>

                    {/* Price */}
                    <div className="mt-3 mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">
                          ₹{price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-slate-400 text-xs font-medium">{period}</span>
                      </div>
                      {billingCycle === 'annual' && plan.priceMonthly > 0 && (
                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                          Equivalent to ₹{Math.round(price / 12).toLocaleString('en-IN')}/mo &bull; 2 Months Free
                        </p>
                      )}
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-slate-600 font-medium leading-tight text-[11px]">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-5 mt-4 border-t border-slate-100">
                    {isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-500 cursor-default flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> Current Plan (सक्रिय)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenBuyPlan(plan)}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                          plan.popular
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : plan.id === 'Enterprise'
                            ? 'bg-purple-700 hover:bg-purple-800 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <Crown className="w-3.5 h-3.5" /> Buy Plan (प्लान खरीदें)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 11: AUDIT LOGS ================= */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-700" />
                {t('Audit Logs & Activity Trail', 'ऑडिट लॉग्स एवं सिस्टम गतिविधि')}
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {t('Track who made what entry, edits, deletions, timestamps, and IP addresses for full APMC transparency.', 'किस उपयोगकर्ता ने कौन सा सौदा, आवक, बिल या पार्टी प्रविष्टि दर्ज की, उसका समय और विवरण।')}
              </p>
            </div>
            <button
              type="button"
              onClick={loadAuditLogs}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditLogs ? 'animate-spin' : ''}`} />
              {t('Refresh Logs', 'रिफ्रेश करें')}
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-[11px]">{t('From Date', 'प्रारंभिक तिथि')}</label>
              <input
                type="date"
                value={auditFromDate}
                onChange={(e) => setAuditFromDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-[11px]">{t('To Date', 'अंतिम तिथि')}</label>
              <input
                type="date"
                value={auditToDate}
                onChange={(e) => setAuditToDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-[11px]">{t('Filter Action', 'गतिविधि प्रकार')}</label>
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
              >
                <option value="">{t('All Actions (सभी)', 'All Actions')}</option>
                <option value="CREATE_ARRIVAL">CREATE_ARRIVAL (गाड़ी आवक)</option>
                <option value="CREATE_SPLIT_SALE">CREATE_SPLIT_SALE (बिक्री लॉट)</option>
                <option value="QUICK_TRADE">QUICK_TRADE (एकल सौदा)</option>
                <option value="ADD_PARTY">ADD_PARTY (पार्टी जोड़ना)</option>
                <option value="UPDATE_PARTY">UPDATE_PARTY (पार्टी संशोधन)</option>
                <option value="DELETE_PARTY">DELETE_PARTY (पार्टी हटाना)</option>
                <option value="IMPORT_PARTIES">IMPORT_PARTIES (पार्टी इम्पोर्ट)</option>
                <option value="UPDATE_OPENING_CASH">UPDATE_OPENING_CASH (रोकड़ शेष)</option>
                <option value="PAYMENT_RECEIVED">PAYMENT_RECEIVED (भुगतान प्राप्ति)</option>
                <option value="CASH_RECEIPT">CASH_RECEIPT (रोकड़ जमा)</option>
                <option value="CASH_PAYMENT">CASH_PAYMENT (रोकड़ नाम)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-[11px]">{t('Filter Staff / Munshi', 'स्टाफ / मुनीम')}</label>
              <select
                value={auditUserId}
                onChange={(e) => setAuditUserId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
              >
                <option value="">{t('All Staff Members', 'सभी सदस्य')}</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-[11px]">{t('Search Details', 'विवरण में खोजें')}</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Lot, Party, Vehicle..."
                  value={auditSearchText}
                  onChange={(e) => setAuditSearchText(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>
              {t('Showing', 'दिखाए गए')} <b className="text-slate-900">{auditLogs.filter(l => !auditSearchText || l.details?.toLowerCase().includes(auditSearchText.toLowerCase()) || l.user_name?.toLowerCase().includes(auditSearchText.toLowerCase())).length}</b> {t('audit records', 'ऑडिट रिकॉर्ड्स')}
            </span>
            {(auditActionFilter || auditFromDate || auditToDate || auditUserId || auditSearchText) && (
              <button
                type="button"
                onClick={() => {
                  setAuditActionFilter('');
                  setAuditFromDate('');
                  setAuditToDate('');
                  setAuditUserId('');
                  setAuditSearchText('');
                }}
                className="text-rose-600 font-bold hover:underline cursor-pointer"
              >
                {t('Reset Filters ✕', 'फ़िल्टर हटाएं ✕')}
              </button>
            )}
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Timestamp / समय</th>
                  <th className="p-3">User &amp; Role / उपयोगकर्ता</th>
                  <th className="p-3">Action / गतिविधि</th>
                  <th className="p-3">Target Entity / इकाई</th>
                  <th className="p-3">Details / विवरण</th>
                  <th className="p-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingAuditLogs ? (
                  <tr><td colSpan="6" className="text-center py-10 text-slate-400">Loading audit records...</td></tr>
                ) : auditLogs.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-10 text-slate-400">No audit activity recorded for selected filters.</td></tr>
                ) : (
                  auditLogs
                    .filter(l => !auditSearchText || l.details?.toLowerCase().includes(auditSearchText.toLowerCase()) || l.user_name?.toLowerCase().includes(auditSearchText.toLowerCase()) || l.entity_id?.toLowerCase().includes(auditSearchText.toLowerCase()))
                    .map(log => {
                      const getActionBadge = (act) => {
                        if (act?.includes('CREATE') || act?.includes('QUICK_TRADE') || act === 'CASH_RECEIPT' || act === 'PAYMENT_RECEIVED') {
                          return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                        }
                        if (act?.includes('UPDATE')) {
                          return 'bg-amber-100 text-amber-800 border-amber-200';
                        }
                        if (act?.includes('DELETE')) {
                          return 'bg-rose-100 text-rose-800 border-rose-200';
                        }
                        if (act?.includes('IMPORT')) {
                          return 'bg-purple-100 text-purple-800 border-purple-200';
                        }
                        return 'bg-blue-100 text-blue-800 border-blue-200';
                      };

                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-[11px] font-mono text-slate-600 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{log.user_name || 'System / Admin'}</div>
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {log.user_role || 'Staff'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-600">
                            <span className="font-bold capitalize text-slate-800">{log.entity_type}</span>
                            {log.entity_id && <span className="text-slate-400 block text-[10px]">{log.entity_id}</span>}
                          </td>
                          <td className="p-3 text-[11px] text-slate-700 max-w-md font-medium">
                            {log.details || '—'}
                          </td>
                          <td className="p-3 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap">
                            {log.ip_address || '127.0.0.1'}
                          </td>
                        </tr>
                      );
                    })
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
                        <option value="Agent">Agent (कमीशन एजेंट / दलाल)</option>
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
                        <option value="Agent">Agent (कमीशन एजेंट / दलाल)</option>
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
                      <label className="font-bold text-slate-700 block mb-1">{t('Balance Type', 'बैलेंस प्रकार')}</label>
                      <select
                        value={editPartyForm.balanceType}
                        onChange={(e) => setEditPartyForm({ ...editPartyForm, balanceType: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white"
                      >
                        <option value="Dr">{t('Dr (Receivable)', 'Dr (लेना)')}</option>
                        <option value="Cr">{t('Cr (Payable)', 'Cr (देना)')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{t('Payment Credit Terms (Days)', 'उधार भुगतान अवधि (दिन)')}</label>
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
                  <Save className="w-4 h-4" /> {t('Update Party Details', 'विवरण अपडेट करें')}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowEditPartyModal(false)} 
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  {t('Cancel', 'रद्द करें')}
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
              <h3 className="font-bold text-slate-900 text-sm">{t('Add Commodity', 'नई फसल जोड़ें')}</h3>
              <button onClick={() => setShowAddCommodityModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleAddCommoditySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('Commodity Name (English) *', 'फसल का नाम (अंग्रेज़ी) *')}</label>
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
                  <label className="font-bold text-slate-700 block mb-1">{t('Hindi Name', 'हिन्दी नाम')}</label>
                  <input
                    type="text"
                    placeholder="सेब - रॉयल"
                    value={commodityForm.nameHi}
                    onChange={(e) => setCommodityForm({ ...commodityForm, nameHi: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('Category', 'श्रेणी')}</label>
                  <select
                    value={commodityForm.category}
                    onChange={(e) => setCommodityForm({ ...commodityForm, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Fruit">{t('Fruit', 'फल')}</option>
                    <option value="Vegetable">{t('Vegetable', 'सब्जी')}</option>
                    <option value="Grain">{t('Grain', 'अनाज')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('Default Unit', 'मानक इकाई')}</label>
                  <input
                    type="text"
                    value={commodityForm.defaultUnit}
                    onChange={(e) => setCommodityForm({ ...commodityForm, defaultUnit: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('Unit Weight (Kg)', 'इकाई वजन (किलो)')}</label>
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
                  {t('Save Commodity', 'फसल सुरक्षित करें')}
                </button>
                <button type="button" onClick={() => setShowAddCommodityModal(false)} className="px-4 py-2.5 border rounded-xl cursor-pointer">
                  {t('Cancel', 'रद्द करें')}
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
                <h3 className="font-bold text-slate-900 text-sm">{t('Edit Commodity Configuration', 'फसल कॉन्फ़िगरेशन एडिट करें')}</h3>
                <p className="text-[11px] text-slate-500 font-mono">ID: {editCommodityForm.id}</p>
              </div>
              <button onClick={() => setShowEditCommodityModal(false)} className="text-slate-400 hover:text-slate-700 text-lg p-1 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveEditCommodity} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('Commodity Name (English) *', 'फसल का नाम (अंग्रेज़ी) *')}</label>
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
                  <label className="font-bold text-slate-700 block mb-1">{t('Hindi Name', 'हिन्दी नाम')}</label>
                  <input
                    type="text"
                    value={editCommodityForm.nameHi}
                    onChange={(e) => setEditCommodityForm({ ...editCommodityForm, nameHi: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('Category', 'श्रेणी')}</label>
                  <select
                    value={editCommodityForm.category}
                    onChange={(e) => setEditCommodityForm({ ...editCommodityForm, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  >
                    <option value="Fruit">{t('Fruit', 'फल')}</option>
                    <option value="Vegetable">{t('Vegetable', 'सब्जी')}</option>
                    <option value="Grain">{t('Grain', 'अनाज')}</option>
                    <option value="Exotic">{t('Exotic Produce', 'विदेशी उत्पाद')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('Default Unit', 'पैकिंग प्रकार')}</label>
                  <input
                    type="text"
                    value={editCommodityForm.defaultUnit}
                    onChange={(e) => setEditCommodityForm({ ...editCommodityForm, defaultUnit: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('Unit Weight (Kg)', 'इकाई वजन (किलो)')}</label>
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
                  <label className="font-bold text-slate-700 block mb-1">{t('Tare Wt (Kg)', 'बारदाना वजन (किलो)')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editCommodityForm.tareDeductionKg}
                    onChange={(e) => setEditCommodityForm({ ...editCommodityForm, tareDeductionKg: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('Commission %', 'आढ़त %')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editCommodityForm.standardCommissionPct}
                    onChange={(e) => setEditCommodityForm({ ...editCommodityForm, standardCommissionPct: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('Palledari (₹)', 'पल्लेदारी (₹)')}</label>
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
                  {t('Active Produce for Trading & Auctions', 'व्यापार एवं नीलामी हेतु सक्रिय फसल')}
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> {t('Update Commodity Configuration', 'फसल कॉन्फ़िगरेशन अपडेट करें')}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowEditCommodityModal(false)} 
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  {t('Cancel', 'रद्द करें')}
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
              <h3 className="font-bold text-slate-900 text-sm">{t('Add Staff / Munshi', 'मुनीम / स्टाफ जोड़ें')}</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleAddMemberSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('Full Name *', 'पूरा नाम *')}</label>
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
                <label className="font-bold text-slate-700 block mb-1">{t('Role *', 'पद / भूमिका *')}</label>
                <select
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Munshi (Data Entry)">{t('Munshi / Data Entry (Arrivals & Sales)', 'मुनीम / आवक-बिक्री प्रविष्टि')}</option>
                  <option value="Accountant (Cashier)">{t('Accountant / Cashier (Ledgers & Cash)', 'रोकड़िया / मुनीम (खाता एवं रोकड़)')}</option>
                  <option value="Shop Admin">{t('Shop Admin / Partner (Full Access)', 'मालिक / पार्टनर (पूर्ण अधिकार)')}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('Mobile Phone *', 'मोबाइल फोन *')}</label>
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
                  <label className="font-bold text-slate-700 block mb-1">{t('4-Digit PIN *', '4-अंकीय पिन *')}</label>
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
                  {t('Confirm & Add Staff', 'पुष्टि करें और स्टाफ जोड़ें')}
                </button>
                <button type="button" onClick={() => setShowAddMemberModal(false)} className="px-4 py-2.5 border rounded-xl">
                  {t('Cancel', 'रद्द करें')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD VARIETY ================= */}
      {showAddVarietyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Add Variety &amp; Grade (नई किस्म जोड़ें)
                </h3>
                <p className="text-[11px] text-slate-500">Configure quality grade and benchmark rate for produce.</p>
              </div>
              <button onClick={() => setShowAddVarietyModal(false)} className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddVarietySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Linked Commodity (फसल / जिंस) *</label>
                <select
                  value={varietyForm.commodityName}
                  onChange={(e) => setVarietyForm({ ...varietyForm, commodityName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white font-bold"
                  required
                >
                  <option value="">-- Select Commodity --</option>
                  {commodities.map(c => (
                    <option key={c.id} value={c.name_en || c.name}>
                      {c.name_en || c.name} {c.name_hi ? `(${c.name_hi})` : ''}
                    </option>
                  ))}
                  <option value="Produce">Other Produce (अन्य)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Variety Name (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Delicious, Golden Grade A"
                  value={varietyForm.name}
                  onChange={(e) => setVarietyForm({ ...varietyForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hindi Name (हिंदी नाम - वैकल्पिक)</label>
                <input
                  type="text"
                  placeholder="उदा. रॉयल डिलीशियस, गोल्डन ए-ग्रेड"
                  value={varietyForm.nameHi}
                  onChange={(e) => setVarietyForm({ ...varietyForm, nameHi: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grade / Quality</label>
                  <select
                    value={varietyForm.grade}
                    onChange={(e) => setVarietyForm({ ...varietyForm, grade: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Grade A">Grade A (सुपीरियर)</option>
                    <option value="Grade B">Grade B (मध्यम)</option>
                    <option value="Grade C">Grade C (लोकल)</option>
                    <option value="Supreme">Supreme Premium</option>
                    <option value="Standard">Standard Medium</option>
                    <option value="Small">Small / Chhanta</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Default Rate (₹ / Nag)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1200"
                    value={varietyForm.defaultRate}
                    onChange={(e) => setVarietyForm({ ...varietyForm, defaultRate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button type="submit" className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-xs cursor-pointer">
                  Save Variety (किस्म सेव करें)
                </button>
                <button type="button" onClick={() => setShowAddVarietyModal(false)} className="px-4 py-2.5 border rounded-xl cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT VARIETY ================= */}
      {showEditVarietyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Edit className="w-4 h-4 text-blue-600" />
                  Edit Variety &amp; Grade (किस्म संपादित करें)
                </h3>
                <p className="text-[11px] text-slate-500">Update quality grade and rate configuration.</p>
              </div>
              <button onClick={() => setShowEditVarietyModal(false)} className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEditVariety} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Linked Commodity (फसल / जिंस) *</label>
                <select
                  value={editVarietyForm.commodityName}
                  onChange={(e) => setEditVarietyForm({ ...editVarietyForm, commodityName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white font-bold"
                  required
                >
                  <option value="">-- Select Commodity --</option>
                  {commodities.map(c => (
                    <option key={c.id} value={c.name_en || c.name}>
                      {c.name_en || c.name} {c.name_hi ? `(${c.name_hi})` : ''}
                    </option>
                  ))}
                  <option value="Produce">Other Produce (अन्य)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Variety Name (English) *</label>
                <input
                  type="text"
                  required
                  value={editVarietyForm.name}
                  onChange={(e) => setEditVarietyForm({ ...editVarietyForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hindi Name (हिंदी नाम - वैकल्पिक)</label>
                <input
                  type="text"
                  value={editVarietyForm.nameHi}
                  onChange={(e) => setEditVarietyForm({ ...editVarietyForm, nameHi: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grade / Quality</label>
                  <select
                    value={editVarietyForm.grade}
                    onChange={(e) => setEditVarietyForm({ ...editVarietyForm, grade: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Grade A">Grade A (सुपीरियर)</option>
                    <option value="Grade B">Grade B (मध्यम)</option>
                    <option value="Grade C">Grade C (लोकल)</option>
                    <option value="Supreme">Supreme Premium</option>
                    <option value="Standard">Standard Medium</option>
                    <option value="Small">Small / Chhanta</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Default Rate (₹ / Nag)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editVarietyForm.defaultRate}
                    onChange={(e) => setEditVarietyForm({ ...editVarietyForm, defaultRate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button type="submit" className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs cursor-pointer">
                  Update Variety (अपडेट करें)
                </button>
                <button type="button" onClick={() => setShowEditVarietyModal(false)} className="px-4 py-2.5 border rounded-xl cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD EXPENSE HEAD ================= */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  Add Mandi Expense Head (नया खर्च जोड़ें)
                </h3>
                <p className="text-[11px] text-slate-500">Configure standard deduction or charge rule.</p>
              </div>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Expense Name (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandi Fee, Palledari, Bardana, Freight"
                  value={expenseForm.name}
                  onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hindi Name (हिंदी नाम - वैकल्पिक)</label>
                <input
                  type="text"
                  placeholder="उदा. मंडी शुल्क, पल्लेदारी, बारदाना, भाड़ा"
                  value={expenseForm.hindiName}
                  onChange={(e) => setExpenseForm({ ...expenseForm, hindiName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Applies To (Target Party) *</label>
                  <select
                    value={expenseForm.target}
                    onChange={(e) => setExpenseForm({ ...expenseForm, target: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white font-bold"
                  >
                    <option value="farmer">🌾 Farmer (किसान आवक)</option>
                    <option value="buyer">🛒 Buyer (खरीदार बिक्री)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Calculation Type *</label>
                  <select
                    value={expenseForm.type}
                    onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white font-bold"
                  >
                    <option value="per_unit">₹ / Nag (प्रति नग)</option>
                    <option value="percentage">% of Gross (प्रतिशत)</option>
                    <option value="fixed">Flat Fixed (एकमुश्त ₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Default Amount / Rate ({expenseForm.type === 'percentage' ? '%' : '₹'}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder={expenseForm.type === 'percentage' ? 'e.g. 1.5' : 'e.g. 10'}
                  value={expenseForm.defaultAmount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, defaultAmount: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isMandatory"
                  checked={expenseForm.isMandatory}
                  onChange={(e) => setExpenseForm({ ...expenseForm, isMandatory: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="isMandatory" className="text-slate-700 font-bold cursor-pointer select-none">
                  Mandatory by default (डिफ़ॉल्ट रूप से अनिवार्य)
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button type="submit" className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs cursor-pointer">
                  Save Expense Head (खर्च सेव करें)
                </button>
                <button type="button" onClick={() => setShowAddExpenseModal(false)} className="px-4 py-2.5 border rounded-xl cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT EXPENSE HEAD ================= */}
      {showEditExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Edit className="w-4 h-4 text-blue-600" />
                  Edit Expense Head (खर्च संशोधित करें)
                </h3>
                <p className="text-[11px] text-slate-500">Update deduction rate and active status.</p>
              </div>
              <button onClick={() => setShowEditExpenseModal(false)} className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEditExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Expense Name (English) *</label>
                <input
                  type="text"
                  required
                  value={editExpenseForm.name}
                  onChange={(e) => setEditExpenseForm({ ...editExpenseForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hindi Name (हिंदी नाम - वैकल्पिक)</label>
                <input
                  type="text"
                  value={editExpenseForm.hindiName}
                  onChange={(e) => setEditExpenseForm({ ...editExpenseForm, hindiName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Applies To (Target Party) *</label>
                  <select
                    value={editExpenseForm.target}
                    onChange={(e) => setEditExpenseForm({ ...editExpenseForm, target: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white font-bold"
                  >
                    <option value="farmer">🌾 Farmer (किसान आवक)</option>
                    <option value="buyer">🛒 Buyer (खरीदार बिक्री)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Calculation Type *</label>
                  <select
                    value={editExpenseForm.type}
                    onChange={(e) => setEditExpenseForm({ ...editExpenseForm, type: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white font-bold"
                  >
                    <option value="per_unit">₹ / Nag (प्रति नग)</option>
                    <option value="percentage">% of Gross (प्रतिशत)</option>
                    <option value="fixed">Flat Fixed (एकमुश्त ₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Default Amount / Rate ({editExpenseForm.type === 'percentage' ? '%' : '₹'}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editExpenseForm.defaultAmount}
                  onChange={(e) => setEditExpenseForm({ ...editExpenseForm, defaultAmount: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-slate-700 font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editExpenseForm.isMandatory}
                    onChange={(e) => setEditExpenseForm({ ...editExpenseForm, isMandatory: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                  Mandatory by default
                </label>

                <label className="flex items-center gap-2 text-slate-700 font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editExpenseForm.isActive}
                    onChange={(e) => setEditExpenseForm({ ...editExpenseForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                  Active in Forms
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button type="submit" className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs cursor-pointer">
                  Update Expense (अपडेट करें)
                </button>
                <button type="button" onClick={() => setShowEditExpenseModal(false)} className="px-4 py-2.5 border rounded-xl cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: BUY PLAN / CHECKOUT ================= */}
      {showBuyPlanModal && selectedPlanForBuy && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Checkout &bull; प्लान खरीदें</span>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Crown className="w-5 h-5 text-emerald-600" />
                  Upgrade to {selectedPlanForBuy.name}
                </h3>
              </div>
              <button onClick={() => setShowBuyPlanModal(false)} className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleConfirmSubscription} className="space-y-4 text-xs">
              {/* Plan Pricing Summary Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">Selected Plan Tier:</span>
                  <span className="font-black text-slate-900 text-sm">{selectedPlanForBuy.id.toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">Billing Cycle:</span>
                  <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                        billingCycle === 'monthly' ? 'bg-slate-900 text-white' : 'text-slate-600'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('annual')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                        billingCycle === 'annual' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Annual (-20%)
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="font-black text-slate-900 text-sm">Total Payable (कुल देय):</span>
                  <span className="font-black text-emerald-700 text-lg">
                    ₹{(billingCycle === 'annual' ? selectedPlanForBuy.priceAnnual : selectedPlanForBuy.priceMonthly).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-2">Select Payment Method (भुगतान विधि) *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI / QR Code', desc: 'GPay, PhonePe, Paytm', icon: '📱' },
                    { id: 'NETBANKING', label: 'Net Banking / IMPS', desc: 'All Major Indian Banks', icon: '🏛️' },
                    { id: 'CARD', label: 'Debit / Credit Card', desc: 'Visa, Rupay, Mastercard', icon: '💳' },
                    { id: 'OFFLINE', label: 'Cheque / APMC Bank', desc: 'Direct Mandi Settlement', icon: '📝' }
                  ].map(pm => (
                    <div
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === pm.id
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{pm.icon}</span>
                        <div>
                          <p className="font-bold text-slate-900 text-[11px] leading-tight">{pm.label}</p>
                          <p className="text-[10px] text-slate-500">{pm.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Gateway Sandbox Note */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Instant Activation Demo Flow
                </p>
                <p className="text-amber-800 text-[10px] leading-relaxed">
                  Razorpay / Cashfree Mandi PG integration is scheduled for production release. In this release, clicking &quot;Confirm &amp; Activate Plan&quot; simulates payment approval and instantly updates your firm&apos;s subscription in Supabase with an auto-generated invoice.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="submit"
                  disabled={subscribing}
                  className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {subscribing ? (
                    <span>Activating Subscription...</span>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      Confirm &amp; Activate Plan (पुष्टि करें और प्लान शुरू करें)
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBuyPlanModal(false)}
                  disabled={subscribing}
                  className="px-4 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
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
