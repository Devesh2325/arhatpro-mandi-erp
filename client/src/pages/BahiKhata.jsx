import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { useTenant } from '../context/TenantContext';
import { 
  BookOpen, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  X, 
  Receipt,
  Scale,
  FileText,
  Printer,
  Download,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Truck,
  Package
} from 'lucide-react';

export default function BahiKhata() {
  const { t, isHindi } = useLanguage();
  const { workspaceConfig } = useTenant();
  const [activeTab, setActiveTab] = useState('ACCOUNTS'); // ACCOUNTS, CRATES, DRIVERS, CASHBOOK, JOURNAL, TRIAL_BALANCE, BALANCE_SHEET, AGING
  const [accounts, setAccounts] = useState([]);
  const [cashEntries, setCashEntries] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [trialBalance, setTrialBalance] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [agingData, setAgingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  // Driver Ledger state
  const [driversData, setDriversData] = useState({ summary: {}, drivers: [] });
  const [showDriverPaymentModal, setShowDriverPaymentModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverPaymentForm, setDriverPaymentForm] = useState({
    amount: '',
    paymentMode: 'Cash',
    narration: ''
  });
  const [expandedDriverTrips, setExpandedDriverTrips] = useState({});

  // Crate Ledger state
  const [cratesData, setCratesData] = useState({ summary: {}, partyCrates: [], driverCrates: [], recentTransactions: [] });
  const [crateFilter, setCrateFilter] = useState('ALL'); // 'ALL', 'FARMER', 'BUYER', 'DRIVER'
  const [showCrateModal, setShowCrateModal] = useState(false);
  const [crateForm, setCrateForm] = useState({
    entityType: 'party',
    entityName: '',
    entityPhone: '',
    partyType: 'Buyer',
    vehicleNo: '',
    movementType: 'RECEIVED',
    cratesCount: '',
    referenceType: 'empty_return',
    notes: ''
  });

  // Account Type Filter
  const [accountTypeFilter, setAccountTypeFilter] = useState('ALL'); // 'ALL', 'Buyer', 'Farmer', 'Driver', 'Agent'

  // Cashbook form state
  const [cashSummary, setCashSummary] = useState({ openingCash: 0, totalJama: 0, totalKharch: 0, closingBalance: 0 });
  const [showOpeningCashModal, setShowOpeningCashModal] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState('0');
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashForm, setCashForm] = useState({
    entry_type: 'cash_in',
    amount: '',
    account_id: '',
    description: ''
  });

  // Double-entry Journal form state
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [journalNarration, setJournalNarration] = useState('');
  const [journalRows, setJournalRows] = useState([
    { account_id: '', debit_amount: '', credit_amount: '' },
    { account_id: '', debit_amount: '', credit_amount: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (activeTab === 'ACCOUNTS') {
        const [accRes, partiesRes, crateRes] = await Promise.all([
          api.getAccounts(),
          api.getParties().catch(() => []),
          api.getCratesLedger().catch(() => ({ partyCrates: [] }))
        ]);
        const crateMap = {};
        (crateRes.partyCrates || []).forEach(cp => {
          crateMap[cp.name] = cp.netBalance;
        });

        const rawParties = Array.isArray(partiesRes) ? partiesRes : (partiesRes?.parties || []);
        const merged = (accRes.accounts || []).map(a => ({
          ...a,
          party_type: 'Buyer',
          crates_balance: crateMap[a.party_name] || 0
        }));

        rawParties.forEach(p => {
          if (p.type !== 'Buyer' && !merged.find(m => m.name === p.name)) {
            merged.push({
              id: p.id,
              name: p.name,
              party_name: p.name,
              account_type: p.type || 'Farmer',
              phone: p.mobile,
              city: p.city || p.address,
              balance: p.current_balance || 0,
              crates_balance: crateMap[p.name] || 0
            });
          }
        });

        setAccounts(merged);
      } else if (activeTab === 'DRIVERS') {
        const res = await api.getDriversLedger();
        setDriversData(res || { summary: {}, drivers: [] });
      } else if (activeTab === 'CRATES') {
        const res = await api.getCratesLedger();
        setCratesData(res || { summary: {}, partyCrates: [], driverCrates: [], recentTransactions: [] });
      } else if (activeTab === 'CASHBOOK') {
        const [cashRes, accRes] = await Promise.all([
          api.getCashbook(),
          api.getAccounts()
        ]);
        setCashEntries(cashRes.entries || cashRes.transactions || []);
        const opCash = cashRes.openingCash !== undefined ? (parseFloat(cashRes.openingCash) || 0) : 0;
        setCashSummary({
          openingCash: opCash,
          totalJama: parseFloat(cashRes.totalJama) || 0,
          totalKharch: parseFloat(cashRes.totalKharch) || 0,
          closingBalance: cashRes.closingBalance !== undefined ? (parseFloat(cashRes.closingBalance) || 0) : 0
        });
        setOpeningCashInput(opCash.toString());
        setAccounts(accRes.accounts || []);
      } else if (activeTab === 'AGING') {
        const res = await api.getDebtorAging();
        setAgingData(res.debtors || []);
      } else if (activeTab === 'JOURNAL') {
        const [accRes, jvRes] = await Promise.all([
          api.getAccounts(),
          api.getJournal()
        ]);
        setAccounts(accRes.accounts || []);
        setJournalEntries(Array.isArray(jvRes) ? jvRes : []);
      } else if (activeTab === 'TRIAL_BALANCE') {
        const tbRes = await api.getTrialBalance();
        setTrialBalance(tbRes);
      } else if (activeTab === 'BALANCE_SHEET') {
        const bsRes = await api.getBalanceSheet();
        setBalanceSheet(bsRes);
      }
    } catch (err) {
      console.error('Failed to load ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOpeningCash = async (e) => {
    e.preventDefault();
    try {
      const amt = Math.max(0, parseFloat(openingCashInput) || 0);
      await api.setOpeningCash(amt);
      setMessage({ type: 'success', text: `Opening cash balance updated to ₹${amt.toLocaleString()}!` });
      setShowOpeningCashModal(false);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update opening cash.' });
    }
  };

  // Cashbook Submit
  const handleCashSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await api.createCashEntry({
        entry_type: cashForm.entry_type,
        amount: parseFloat(cashForm.amount),
        account_id: cashForm.account_id ? parseInt(cashForm.account_id, 10) : null,
        description: cashForm.description
      });
      setMessage({ type: 'success', text: 'Rokad cash entry recorded successfully!' });
      setShowCashModal(false);
      setCashForm({ entry_type: 'cash_in', amount: '', account_id: '', description: '' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to record cash entry.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Journal Calculation
  const totalDebit = journalRows.reduce((sum, r) => sum + (parseFloat(r.debit_amount) || 0), 0);
  const totalCredit = journalRows.reduce((sum, r) => sum + (parseFloat(r.credit_amount) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleAddJournalRow = () => {
    setJournalRows([...journalRows, { account_id: '', debit_amount: '', credit_amount: '' }]);
  };

  const handleJournalRowChange = (index, field, value) => {
    const updated = [...journalRows];
    updated[index][field] = value;
    // Mutually exclusive debit and credit on single line
    if (field === 'debit_amount' && value) updated[index].credit_amount = '';
    if (field === 'credit_amount' && value) updated[index].debit_amount = '';
    setJournalRows(updated);
  };

  const handleJournalSubmit = async (e) => {
    e.preventDefault();
    if (!isBalanced) {
      setMessage({ type: 'error', text: 'Double-entry rule violation: Total Debit must exactly equal Total Credit (Dr = Cr).' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const payloadEntries = journalRows
        .filter(r => r.account_id && (parseFloat(r.debit_amount) > 0 || parseFloat(r.credit_amount) > 0))
        .map(r => ({
          account_id: parseInt(r.account_id, 10),
          debit_amount: parseFloat(r.debit_amount) || 0,
          credit_amount: parseFloat(r.credit_amount) || 0
        }));

      await api.createJournalEntry({
        voucher_date: journalDate,
        narration: journalNarration,
        entries: payloadEntries
      });
      setMessage({ type: 'success', text: 'Double-entry Journal Voucher posted successfully!' });
      setShowJournalModal(false);
      setJournalRows([
        { account_id: '', debit_amount: '', credit_amount: '' },
        { account_id: '', debit_amount: '', credit_amount: '' }
      ]);
      setJournalNarration('');
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to post journal voucher.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Driver Freight Payment Submit
  const handleDriverPaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const amt = parseFloat(driverPaymentForm.amount);
      if (!amt || amt <= 0) throw new Error('Please enter a valid amount.');
      await api.payDriverFreight({
        driverName: selectedDriver?.driverName || 'Driver',
        truckNo: selectedDriver?.truckNo || '',
        amount: amt,
        paymentMode: driverPaymentForm.paymentMode,
        narration: driverPaymentForm.narration
      });
      setMessage({ type: 'success', text: `Successfully paid ₹${amt.toLocaleString()} to driver ${selectedDriver?.driverName || ''} (${selectedDriver?.truckNo || ''})!` });
      setShowDriverPaymentModal(false);
      setDriverPaymentForm({ amount: '', paymentMode: 'Cash', narration: '' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Payment failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Crate Movement Submit
  const handleCrateMovementSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const count = parseInt(crateForm.cratesCount, 10);
      if (!count || count <= 0) throw new Error('Please enter valid crates count.');
      if (!crateForm.entityName.trim()) throw new Error('Please enter party or driver name.');

      await api.recordCrateMovement({
        ...crateForm,
        cratesCount: count
      });
      setMessage({ type: 'success', text: `Successfully recorded ${count} crates ${crateForm.movementType.toLowerCase()} for ${crateForm.entityName}!` });
      setShowCrateModal(false);
      setCrateForm({
        entityType: 'party',
        entityName: '',
        entityPhone: '',
        partyType: 'Buyer',
        vehicleNo: '',
        movementType: 'RECEIVED',
        cratesCount: '',
        referenceType: 'empty_return',
        notes: ''
      });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Crate entry failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            {t('Bahi-Khata, Crate & Driver Ledger', 'बही-खाता, क्रेट एवं चालक बही')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('Indian Mandi double-entry accounting with dedicated Banana Store & Cold Storage crate balances and driver freight ledger.', 'मंडी द्वि-प्रविष्टि बहीखाता, केला/कोल्ड स्टोर क्रेट खाता एवं चालक भाड़ा हिसाब।')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'CRATES' && (
            <button
              onClick={() => setShowCrateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-sm text-sm cursor-pointer"
            >
              <Package className="w-4 h-4" /> {t('Record Crate Movement', 'नया क्रेट वाउचर')}
            </button>
          )}
          {activeTab === 'DRIVERS' && (
            <button
              onClick={() => {
                setSelectedDriver(driversData.drivers[0] || null);
                setShowDriverPaymentModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm text-sm cursor-pointer"
            >
              <Truck className="w-4 h-4" /> {t('Pay Driver Freight', 'भाड़ा भुगतान करें')}
            </button>
          )}
          {activeTab === 'CASHBOOK' && (
            <button
              onClick={() => setShowCashModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> {t('Record Cash In / Out', 'रोकड़ प्रविष्टि')}
            </button>
          )}
          {activeTab === 'JOURNAL' && (
            <button
              onClick={() => setShowJournalModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm text-sm cursor-pointer"
            >
              <Receipt className="w-4 h-4" /> {t('New Journal Voucher (Dr = Cr)', 'नया जर्नल वाउचर')}
            </button>
          )}
          {(activeTab === 'TRIAL_BALANCE' || activeTab === 'BALANCE_SHEET') && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs cursor-pointer border border-slate-300"
              >
                <Printer className="w-3.5 h-3.5" /> {t('Print Statement', 'प्रिंट करें')}
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2 sm:gap-4 overflow-x-auto pb-1 text-xs sm:text-sm font-bold select-none">
        {[
          { id: 'ACCOUNTS', label: t('Party Accounts', 'खाता बही (पार्टी)'), icon: BookOpen },
          ...(workspaceConfig?.showCrates !== false ? [{ id: 'CRATES', label: t('Crates Ledger', 'क्रेट खाता (पार्टी/स्टोर)'), icon: Package }] : []),
          ...(workspaceConfig?.showDriverFreight !== false ? [{ id: 'DRIVERS', label: t('Driver Ledger', 'चालक/भाड़ा खाता'), icon: Truck }] : []),
          { id: 'CASHBOOK', label: t('Rokad / Cashbook', 'रोकड़ बही (नकद)'), icon: DollarSign },
          { id: 'JOURNAL', label: t('Double-Entry Journal', 'रोजनामचा (जर्नल)'), icon: ShieldCheck },
          { id: 'TRIAL_BALANCE', label: t('Trial Balance', 'तलपट (ट्रायल बैलेंस)'), icon: Scale },
          { id: 'BALANCE_SHEET', label: t('Balance Sheet', 'आर्थिक चिट्ठा (बैलेंस शीट)'), icon: FileText },
          { id: 'AGING', label: t('15-Day Aging & Interest', 'ब्याज व उधारी अवधि'), icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ACCOUNTS */}
      {activeTab === 'ACCOUNTS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { id: 'ALL', label: t('All Parties', 'सभी खाते') },
                { id: 'Buyer', label: t('Buyers', 'खरीदार (व्यापारी)') },
                { id: 'Farmer', label: t('Farmers', 'किसान (उत्पादक)') },
                { id: 'Agent', label: t('Agents', 'दलाल / एजेंट') }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAccountTypeFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    accountTypeFilter === f.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search account name, type, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button
                onClick={loadData}
                className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-xl hover:bg-gray-100 border border-slate-200"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">{t('Account / Party Name', 'खाता / पार्टी नाम')}</th>
                  <th className="py-3.5 px-4">{t('Account Type', 'पार्टी प्रकार')}</th>
                  <th className="py-3.5 px-4">{t('Contact Info', 'संपर्क / शहर')}</th>
                  <th className="py-3.5 px-4 text-right">{t('Financial Balance (₹)', 'खाता शेष (रुपये)')}</th>
                  {workspaceConfig?.showCrates !== false && (
                    <th className="py-3.5 px-4 text-center">{t('Crates Balance (📦)', 'क्रेट्स शेष (📦)')}</th>
                  )}
                  <th className="py-3.5 px-4 text-center">{t('Status', 'स्थिति')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-10 text-gray-400">Loading ledger accounts...</td></tr>
                ) : accounts.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-10 text-gray-400">No accounts registered yet.</td></tr>
                ) : (
                  accounts
                    .filter(a => {
                      if (accountTypeFilter !== 'ALL' && a.account_type?.toLowerCase() !== accountTypeFilter.toLowerCase()) {
                        return false;
                      }
                      if (!searchTerm) return true;
                      const s = searchTerm.toLowerCase();
                      return a.name?.toLowerCase().includes(s) || a.account_type?.toLowerCase().includes(s) || a.phone?.includes(s);
                    })
                    .map(acc => {
                      const isDr = (acc.balance || 0) >= 0;
                      const cBal = acc.crates_balance || 0;
                      return (
                        <tr key={acc.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900">{acc.name}</td>
                          <td className="py-3 px-4">
                            <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                              {acc.account_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500">{acc.phone || acc.city || '—'}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span className={isDr ? 'text-emerald-600' : 'text-rose-600'}>
                              ₹{Math.abs(acc.balance || 0).toLocaleString()} {isDr ? 'Dr (Lena)' : 'Cr (Dena)'}
                            </span>
                          </td>
                          {workspaceConfig?.showCrates !== false && (
                            <td className="py-3 px-4 text-center font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                cBal > 0 ? 'bg-amber-100 text-amber-900' : cBal < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {cBal !== 0 ? `${Math.abs(cBal)} 📦 ${cBal > 0 ? (acc.account_type === 'Buyer' ? 'लेना' : 'देना') : ''}` : '0 Nil'}
                              </span>
                            </td>
                          )}
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              Active
                            </span>
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

      {/* TAB: CRATES (PARTY & DRIVER CRATE LEDGER) */}
      {activeTab === 'CRATES' && (
        <div className="space-y-4">
          {/* Crate Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">{t('Circulating Crates', 'कुल चलित क्रेट')}</span>
                <span className="text-2xl font-black text-amber-700 font-mono mt-1 block">
                  {(cratesData.summary?.totalCirculatingCrates || 0).toLocaleString()} 📦
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">{t('Market & Store Crates', 'बाजार व स्टोर की कुल क्रेट')}</span>
              </div>
              <span className="text-3xl p-2 bg-amber-50 rounded-2xl border border-amber-100">📦</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">{t('Crates with Buyers', 'व्यापारियों पर बाकी क्रेट')}</span>
                <span className="text-2xl font-black text-rose-600 font-mono mt-1 block">
                  {(cratesData.summary?.totalCratesWithBuyers || 0).toLocaleString()} 📦
                </span>
                <span className="text-[10px] text-rose-500 mt-1 block font-bold">{t('To be recovered (लेना है)', 'वसूली योग्य (लेना है)')}</span>
              </div>
              <span className="text-3xl p-2 bg-rose-50 rounded-2xl border border-rose-100">🛒</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">{t('Crates with Farmers', 'किसानों के पास क्रेट')}</span>
                <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                  {(cratesData.summary?.totalCratesWithFarmers || 0).toLocaleString()} 📦
                </span>
                <span className="text-[10px] text-emerald-600 mt-1 block font-bold">{t('Grower crates held (देना है)', 'किसान अमानत (देना है)')}</span>
              </div>
              <span className="text-3xl p-2 bg-emerald-50 rounded-2xl border border-emerald-100">🌾</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">{t('Crates with Drivers', 'चालकों पर बाकी क्रेट')}</span>
                <span className="text-2xl font-black text-indigo-700 font-mono mt-1 block">
                  {(cratesData.summary?.totalCratesWithDrivers || 0).toLocaleString()} 📦
                </span>
                <span className="text-[10px] text-indigo-500 mt-1 block font-bold">{t('Vehicles in transit', 'ट्रांसपोर्ट गाड़ी में')}</span>
              </div>
              <span className="text-3xl p-2 bg-indigo-50 rounded-2xl border border-indigo-100">🚚</span>
            </div>
          </div>

          {/* Controls: Search, Filter & Quick Action */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Filter', 'फिल्टर')}:</span>
              {[
                { id: 'ALL', label: t('All Parties & Drivers', 'सभी (पार्टी व चालक)') },
                { id: 'BUYER', label: t('Buyers (खरीदार)', 'खरीदार (लेना है)') },
                { id: 'FARMER', label: t('Farmers (किसान)', 'किसान (देना है)') },
                { id: 'DRIVER', label: t('Drivers (चालक)', 'चालक') }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCrateFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    crateFilter === f.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search party or driver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCrateModal(true)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Record Crate Entry', 'क्रेट प्रविष्टि')}</span>
              </button>
            </div>
          </div>

          {/* Party Crates Register Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>📦 Mandi & Store Party Crate Ledger (पार्टी क्रेट हिसाब)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {t('Banana & Cold Storage Crate Tracking', 'केला व फल स्टोर क्रेट शेष')}
              </span>
            </div>

            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">{t('Party / Driver Name', 'नाम (पार्टी / चालक)')}</th>
                  <th className="py-3 px-4">{t('Type', 'प्रकार')}</th>
                  <th className="py-3 px-4">{t('Contact / Vehicle', 'संपर्क / गाड़ी नं.')}</th>
                  <th className="py-3 px-4 text-right">{t('Crates In (आवक)', 'कुल प्राप्त (आवक)')}</th>
                  <th className="py-3 px-4 text-right">{t('Crates Out (जावक)', 'कुल दी / लौटाई (जावक)')}</th>
                  <th className="py-3 px-4 text-right">{t('Net Crate Balance', 'बाकी क्रेट (शेष)')}</th>
                  <th className="py-3 px-4 text-center">{t('Status', 'स्थिति')}</th>
                  <th className="py-3 px-4 text-center">{t('Action', 'कार्य')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="8" className="text-center py-10 text-slate-400">Loading crate balances...</td></tr>
                ) : (
                  (() => {
                    const displayed = [];
                    (cratesData.partyCrates || []).forEach(p => {
                      if (crateFilter === 'DRIVER') return;
                      if (crateFilter === 'BUYER' && p.type !== 'Buyer') return;
                      if (crateFilter === 'FARMER' && p.type !== 'Farmer') return;
                      if (searchTerm) {
                        const s = searchTerm.toLowerCase();
                        if (!p.name?.toLowerCase().includes(s) && !p.mobile?.toLowerCase().includes(s)) return;
                      }
                      displayed.push({ ...p, isDriver: false });
                    });
                    if (crateFilter === 'ALL' || crateFilter === 'DRIVER') {
                      (cratesData.driverCrates || []).forEach(d => {
                        if (searchTerm) {
                          const s = searchTerm.toLowerCase();
                          if (!d.driverName?.toLowerCase().includes(s) && !d.vehicleNo?.toLowerCase().includes(s)) return;
                        }
                        displayed.push({
                          id: 'D-' + (d.vehicleNo || d.driverName),
                          name: `${d.driverName} (${d.vehicleNo})`,
                          type: 'Driver / Transporter',
                          mobile: d.phone || d.vehicleNo,
                          cratesReceived: d.cratesIn,
                          cratesGiven: d.cratesOut,
                          netBalance: d.netBalance,
                          isDriver: true,
                          rawDriver: d
                        });
                      });
                    }

                    if (displayed.length === 0) {
                      return <tr><td colSpan="8" className="text-center py-10 text-slate-400">{t('No crate records found matching filter.', 'कोई क्रेट रिकॉर्ड नहीं मिला।')}</td></tr>;
                    }

                    return displayed.map((row, idx) => {
                      const net = row.netBalance || 0;
                      return (
                        <tr key={row.id || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {row.name}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.type === 'Farmer'
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.type === 'Buyer'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">{row.mobile || '—'}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">{row.cratesReceived || 0}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">{row.cratesGiven || 0}</td>
                          <td className="py-3 px-4 text-right font-mono font-black text-sm">
                            <span className={net > 0 ? 'text-amber-800' : net < 0 ? 'text-rose-600' : 'text-slate-400'}>
                              {Math.abs(net)} Crates {net > 0 ? (row.type === 'Buyer' ? 'बाकी (लेना)' : 'बाकी (देना)') : ''}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {net !== 0 ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row.type === 'Buyer' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {row.type === 'Buyer' ? 'उधारी बाकी (लेना)' : 'जमा अमानत (देना)'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                चुकता (Nil)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setCrateForm({
                                  entityType: row.isDriver ? 'driver' : 'party',
                                  entityName: row.isDriver ? (row.rawDriver?.driverName || row.name) : row.name,
                                  entityPhone: row.mobile || '',
                                  partyType: row.type === 'Farmer' ? 'Farmer' : row.type === 'Buyer' ? 'Buyer' : 'Driver',
                                  vehicleNo: row.isDriver ? (row.rawDriver?.vehicleNo || '') : '',
                                  movementType: row.type === 'Buyer' ? 'RECEIVED' : 'GIVEN',
                                  cratesCount: Math.abs(net) || '',
                                  referenceType: 'empty_return',
                                  notes: `Crate return / settlement with ${row.name}`
                                });
                                setShowCrateModal(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              {row.type === 'Buyer' ? 'वापसी लें 📥' : 'वापस दें 📤'}
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>

          {/* Recent Crate Transactions Log */}
          {(cratesData.recentTransactions || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  📋 Recent Crate Movement Audit (हालिया क्रेट वाउचर लेनदेन)
                </span>
                <span className="text-[11px] text-slate-400">Latest 50 movements</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {cratesData.recentTransactions.map(tx => (
                  <div key={tx.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                        tx.movement_type === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {tx.movement_type === 'RECEIVED' ? '📥' : '📤'}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{tx.entity_name}</span>
                          {tx.vehicle_no && (
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">
                              {tx.vehicle_no}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">({tx.party_type || tx.entity_type})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{tx.notes || tx.reference_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-black text-sm block ${
                        tx.movement_type === 'RECEIVED' ? 'text-emerald-700' : 'text-amber-800'
                      }`}>
                        {tx.movement_type === 'RECEIVED' ? '+' : '-'}{tx.crates_count} Crates
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{tx.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: DRIVERS (DRIVER FREIGHT & LOGISTICS LEDGER) */}
      {activeTab === 'DRIVERS' && (
        <div className="space-y-4">
          {/* Driver Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">{t('Total Transporters / Trucks', 'पंजीकृत गाड़ियां / चालक')}</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                  {driversData.summary?.totalDrivers || (driversData.drivers || []).length}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">{t('Active Vehicles', 'सक्रिय वाहन')}</span>
              </div>
              <span className="text-3xl p-2 bg-slate-50 rounded-2xl border border-slate-100">🚚</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">{t('Total Freight Earned', 'कुल अर्जित भाड़ा')}</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                  ₹{(driversData.summary?.totalFreight || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">{t('Gross freight amount', 'कुल गाड़ी भाड़ा')}</span>
              </div>
              <span className="text-3xl p-2 bg-slate-50 rounded-2xl border border-slate-100">📋</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">{t('Total Freight Paid', 'कुल चुकाया गया भाड़ा')}</span>
                <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                  ₹{(driversData.summary?.totalPaid || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">{t('Advance & settlements', 'अग्रिम व नकद भुगतान')}</span>
              </div>
              <span className="text-3xl p-2 bg-emerald-50 rounded-2xl border border-emerald-100">✅</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">{t('Balance Freight Due', 'देय गाड़ी भाड़ा शेष')}</span>
                <span className="text-2xl font-black text-rose-600 font-mono mt-1 block">
                  ₹{(driversData.summary?.totalBalanceDue || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-rose-600 mt-1 block font-bold">{t('Outstanding Payable (देना है)', 'चालक बाकी (देना है)')}</span>
              </div>
              <span className="text-3xl p-2 bg-rose-50 rounded-2xl border border-rose-100">⏳</span>
            </div>
          </div>

          {/* Controls: Search & Pay Freight */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search driver name, truck number, mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedDriver(driversData.drivers[0] || null);
                setShowDriverPaymentModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('Pay Freight to Driver', 'भाड़ा भुगतान दर्ज करें')}</span>
            </button>
          </div>

          {/* Driver Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">{t('Vehicle & Driver', 'गाड़ी नं. व चालक')}</th>
                  <th className="py-3 px-4">{t('Contact Phone', 'मोबाइल')}</th>
                  <th className="py-3 px-4 text-center">{t('Trips', 'फेरे (Trips)')}</th>
                  <th className="py-3 px-4 text-right">{t('Total Freight (₹)', 'कुल भाड़ा (₹)')}</th>
                  <th className="py-3 px-4 text-right">{t('Paid Freight (₹)', 'चुकाया भाड़ा (₹)')}</th>
                  <th className="py-3 px-4 text-right">{t('Balance Due (₹)', 'शेष भाड़ा बाकी (₹)')}</th>
                  <th className="py-3 px-4 text-center">{t('Driver Crates (बाकी क्रेट)', 'चालक पास क्रेट')}</th>
                  <th className="py-3 px-4 text-center">{t('Action', 'कार्य')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="8" className="text-center py-10 text-slate-400">Loading driver accounts...</td></tr>
                ) : (driversData.drivers || []).length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-10 text-slate-400">No driver trip records found.</td></tr>
                ) : (
                  (driversData.drivers || [])
                    .filter(d => {
                      if (!searchTerm) return true;
                      const s = searchTerm.toLowerCase();
                      return (
                        d.driverName?.toLowerCase().includes(s) ||
                        d.truckNo?.toLowerCase().includes(s) ||
                        d.driverPhone?.toLowerCase().includes(s)
                      );
                    })
                    .map(driver => {
                      const isExpanded = expandedDriverTrips[driver.key];
                      const isDue = driver.freightBalance > 0;
                      return (
                        <React.Fragment key={driver.key}>
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-mono font-black text-slate-900 block text-xs">{driver.truckNo}</span>
                              <span className="text-[11px] text-slate-500">{driver.driverName}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500">{driver.driverPhone || '—'}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                                {driver.tripsCount} Trips
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                              ₹{(driver.totalFreight || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                              ₹{(driver.freightPaid || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-sm">
                              <span className={isDue ? 'text-rose-600' : 'text-slate-400'}>
                                ₹{(driver.freightBalance || 0).toLocaleString('en-IN')} {isDue ? 'देय' : 'Nil'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded text-[11px] ${
                                driver.cratesBalance !== 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {driver.cratesBalance} Crates
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDriver(driver);
                                    setDriverPaymentForm({ amount: driver.freightBalance || '', paymentMode: 'Cash', narration: '' });
                                    setShowDriverPaymentModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-xs"
                                >
                                  भुगतान 💳
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpandedDriverTrips(prev => ({ ...prev, [driver.key]: !prev[driver.key] }))}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                                  title="View delivery trips"
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Trip Rows */}
                          {isExpanded && (
                            <tr>
                              <td colSpan="8" className="p-3 bg-slate-50 border-y border-slate-200">
                                <div className="space-y-1.5">
                                  <span className="font-bold text-[11px] text-slate-600 block uppercase tracking-wide">
                                    🚚 Trip History for {driver.truckNo} ({driver.driverName})
                                  </span>
                                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left text-[11px] text-slate-600">
                                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                                        <tr>
                                          <th className="py-2 px-3">Date</th>
                                          <th className="py-2 px-3">Consignment</th>
                                          <th className="py-2 px-3">Farmer & Mal</th>
                                          <th className="py-2 px-3 text-right">Freight (₹)</th>
                                          <th className="py-2 px-3 text-right">Paid (₹)</th>
                                          <th className="py-2 px-3 text-right">Balance (₹)</th>
                                          <th className="py-2 px-3 text-center">Driver Crates</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 font-mono">
                                        {(driver.trips || []).map((t, idx) => (
                                          <tr key={idx} className="hover:bg-slate-50">
                                            <td className="py-1.5 px-3">{t.date}</td>
                                            <td className="py-1.5 px-3 font-bold text-slate-800">{t.arrivalId}</td>
                                            <td className="py-1.5 px-3 font-sans font-medium">{t.farmerName} - {t.quantity} {t.unit} of {t.commodity}</td>
                                            <td className="py-1.5 px-3 text-right font-bold">₹{t.totalFreight}</td>
                                            <td className="py-1.5 px-3 text-right text-emerald-700">₹{t.advancePaid}</td>
                                            <td className="py-1.5 px-3 text-right text-rose-600 font-bold">₹{t.balance}</td>
                                            <td className="py-1.5 px-3 text-center font-bold text-amber-800">
                                              +{t.cratesIn} / -{t.cratesOut} ({t.cratesBal})
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CASHBOOK / ROKAD */}
      {activeTab === 'CASHBOOK' && (
        <div className="space-y-4">
          {/* Cash Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">{t('Opening Cash in Hand', 'आरंभिक रोकड़ शेष')}</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                  ₹{cashSummary.openingCash.toLocaleString()}
                </span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">{t('Safe / Drawer Cash', 'गल्ले की रोकड़')}</span>
                <button
                  type="button"
                  onClick={() => setShowOpeningCashModal(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                >
                  {t('Edit Opening Cash ✎', 'आरंभिक शेष बदलें ✎')}
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">{t('Total Cash In (Jama)', 'कुल रोकड़ जमा')}</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                ₹{cashSummary.totalJama.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 mt-2 block">{t('Buyer collections & receipts', 'व्यापारियों से वसूली व नकद जमा')}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">{t('Total Cash Out (Kharch)', 'कुल रोकड़ खर्च')}</span>
              <span className="text-2xl font-black text-rose-600 font-mono mt-1 block">
                ₹{cashSummary.totalKharch.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 mt-2 block">{t('Farmer teep payouts & labor', 'किसान भुगतान व मंडी व्यय')}</span>
            </div>

            <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-4 rounded-2xl shadow-sm">
              <span className="text-xs text-emerald-200 font-medium block">{t('Net Cash in Hand (Rokad)', 'अंतिम रोकड़ बाकी (गल्ला)')}</span>
              <span className="text-2xl font-black font-mono mt-1 block">
                ₹{cashSummary.closingBalance.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-200 mt-2 block">{t('Current live till balance', 'वर्तमान वास्तविक रोकड़ शेष')}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Daily Rokad Transactions / रोकड़ बही</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowOpeningCashModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                >
                  ✎ {t('Opening Cash', 'आरंभिक शेष')}
                </button>
                <button
                  onClick={() => setShowCashModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Cash Entry
                </button>
              </div>
            </div>
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Entry Type</th>
                  <th className="py-3.5 px-4">Associated Party / Account</th>
                  <th className="py-3.5 px-4">{t('Description / Narration', 'विवरण / नरेशन')}</th>
                  <th className="py-3.5 px-4 text-right">{t('Cash In', 'रोकड़ जमा')}</th>
                  <th className="py-3.5 px-4 text-right">{t('Cash Out', 'रोकड़ नाम')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-10 text-gray-400">{t('Loading Rokad cashbook...', 'रोकड़ बही लोड हो रही है...')}</td></tr>
                ) : cashEntries.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-10 text-gray-400">{t('No cash transactions recorded yet.', 'अभी तक कोई रोकड़ प्रविष्टि नहीं है।')}</td></tr>
                ) : (
                  cashEntries.map(entry => {
                    const isCashIn = entry.entry_type === 'cash_in' || entry.type === 'JAMA';
                    const dt = entry.transaction_date || entry.created_at;
                    const amt = parseFloat(entry.amount) || 0;
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-xs font-mono text-gray-500">
                          {dt ? new Date(dt).toLocaleString('en-IN') : (entry.time || '—')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isCashIn ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isCashIn ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {isCashIn ? t('Cash In', 'रोकड़ जमा') : t('Cash Out', 'रोकड़ भुगतान')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{entry.account_name || entry.title || 'Counter Cash'}</td>
                        <td className="py-3 px-4 text-xs text-gray-500">{entry.description || entry.title || '—'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                          {isCashIn ? `₹${amt.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                          {!isCashIn ? `₹${amt.toLocaleString()}` : '—'}
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

      {/* TAB 3: JOURNAL REGISTER (DR = CR AUTO & MANUAL VOUCHERS) */}
      {activeTab === 'JOURNAL' && (
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-indigo-950 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" /> {t('Double-Entry General Journal (रोजनामचा)', 'द्वि-प्रविष्टि रोजनामचा (General Journal)')}
              </h3>
              <p className="text-xs text-indigo-800 mt-1 max-w-2xl leading-relaxed">
                {t(
                  'Every trade consignment (Quick Trade, Split Sales) and manual entry automatically records balanced double-entry vouchers (Dr = Cr). Audit-proof and APMC compliant.',
                  'प्रत्येक व्यापार (क्विक ट्रेड, लॉट बिक्री) और हस्त प्रविष्टि स्वतः संतुलित वाउचर (Dr = Cr) दर्ज करती है।'
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowJournalModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> {t('New Manual JV', 'नया वाउचर (JV)')}
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">Total Vouchers Logged</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{journalEntries.length}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">Total Journal Debit (₹ Dr)</span>
              <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">
                ₹{journalEntries.reduce((s, j) => s + (parseFloat(j.amount) || 0), 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">Total Journal Credit (₹ Cr)</span>
              <span className="text-xl font-black text-blue-700 font-mono mt-1 block">
                ₹{journalEntries.reduce((s, j) => s + (parseFloat(j.amount) || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search voucher no, account name, narration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button onClick={loadData} className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-gray-100 cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Journal Entries Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Voucher No</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Debit Account (नाम / Dr)</th>
                  <th className="py-3.5 px-4">Credit Account (जमा / Cr)</th>
                  <th className="py-3.5 px-4">Narration / Trade Ref</th>
                  <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-3.5 px-4 text-center">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-10 text-gray-400">Loading journal vouchers...</td></tr>
                ) : journalEntries.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-10 text-gray-400">No journal vouchers found. Make trade entries or create one!</td></tr>
                ) : (
                  journalEntries
                    .filter(j => {
                      const q = searchTerm.toLowerCase();
                      return (
                        j.voucher_no?.toLowerCase().includes(q) ||
                        j.debit_account?.toLowerCase().includes(q) ||
                        j.credit_account?.toLowerCase().includes(q) ||
                        j.narration?.toLowerCase().includes(q)
                      );
                    })
                    .map((j, i) => {
                      const isAuto = j.voucher_no?.includes('-SL-') || j.voucher_no?.includes('-QT-') || j.created_by?.includes('Auto');
                      return (
                        <tr key={j.id || i} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">{j.voucher_no}</td>
                          <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">{j.date}</td>
                          <td className="py-3 px-4 font-bold text-emerald-800 text-xs">{j.debit_account}</td>
                          <td className="py-3 px-4 font-bold text-blue-800 text-xs">{j.credit_account}</td>
                          <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate" title={j.narration}>{j.narration || '—'}</td>
                          <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">₹{parseFloat(j.amount).toLocaleString()}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isAuto ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-purple-100 text-purple-800 border border-purple-300'
                            }`}>
                              {isAuto ? '⚡ Auto Trade' : 'Manual JV'}
                            </span>
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

      {/* TAB 4: TRIAL BALANCE (तलपट - Dr = Cr Equilibrium) */}
      {activeTab === 'TRIAL_BALANCE' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-6 h-6 text-emerald-300" />
                <h3 className="text-xl font-bold tracking-tight">
                  {t('Mandi Trial Balance (तलपट)', 'मंडी तलपट (Trial Balance - Dr = Cr)')}
                </h3>
              </div>
              <p className="text-emerald-200 text-xs mt-1">
                {t(
                  'Summarized ledger balances of Cash in Hand, Sundry Debtors, Farmer Creditors, Stock and Revenue.',
                  'रोकड़, देनदार व्यापारी, लेनदार किसान, अंतिम स्टॉक एवं आढ़त आय का संपूर्ण सारांश।'
                )}
              </p>
              <div className="text-[11px] text-emerald-300 font-mono mt-2">
                As on Date: {trialBalance?.asOnDate || new Date().toISOString().split('T')[0]} • Agency Books
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                trialBalance?.isBalanced ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400' : 'bg-rose-500/40 text-rose-100 border border-rose-400'
              }`}>
                <CheckCircle className="w-4 h-4" />
                {trialBalance?.isBalanced ? 'Dr = Cr Equilibrium Balanced (संतुलित)' : 'Unbalanced Difference'}
              </div>
              <button
                onClick={() => {
                  if (!trialBalance?.rows) return;
                  const headers = ['Code', 'Account Particulars', 'Group', 'Debit (INR)', 'Credit (INR)'];
                  const rows = trialBalance.rows.map(r => [
                    r.code,
                    `"${r.name.replace(/"/g, '""')}"`,
                    r.group,
                    r.debit || 0,
                    r.credit || 0
                  ]);
                  rows.push(['TOTAL', 'Grand Total', '', trialBalance.totalDebit, trialBalance.totalCredit]);
                  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `Trial_Balance_${trialBalance.asOnDate || 'report'}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-600 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> CSV Export
              </button>
            </div>
          </div>

          {/* Trial Balance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="trial-balance-sheet">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-20">Code</th>
                  <th className="py-3 px-4">Account Particulars (खाता विवरण)</th>
                  <th className="py-3 px-4">Account Group (समूह)</th>
                  <th className="py-3 px-4 text-right">Debit (नाम / Dr ₹)</th>
                  <th className="py-3 px-4 text-right">Credit (जमा / Cr ₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-12 text-slate-400 font-medium">Generating Trial Balance from live ledgers...</td></tr>
                ) : !trialBalance?.rows || trialBalance.rows.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-12 text-slate-400 font-medium">No ledger data available to compute trial balance.</td></tr>
                ) : (
                  trialBalance.rows.map((row) => {
                    const hasSub = row.subItems && row.subItems.length > 0;
                    const isExpanded = expandedRows[row.code];
                    return (
                      <React.Fragment key={row.code}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-400 text-xs">{row.code}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{isHindi ? (row.hindi_name || row.name) : row.name}</span>
                              {hasSub && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedRows(prev => ({ ...prev, [row.code]: !prev[row.code] }))}
                                  className="text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5 cursor-pointer"
                                >
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  {row.subItems.length} parties
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {row.group}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                            {row.debit > 0 ? `₹${row.debit.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                            {row.credit > 0 ? `₹${row.credit.toLocaleString()}` : '—'}
                          </td>
                        </tr>

                        {/* Expandable Sub-items (Individual Buyers Breakdown) */}
                        {hasSub && isExpanded && (
                          <tr className="bg-slate-50/70">
                            <td colSpan="5" className="p-3 pl-12">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {row.subItems.map((sub, sIdx) => (
                                  <div key={sIdx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                                    <div>
                                      <span className="font-bold text-slate-800 block truncate max-w-[150px]">{sub.name}</span>
                                      <span className="text-[10px] font-mono text-slate-400">[{sub.code}]</span>
                                    </div>
                                    <span className="font-mono font-bold text-emerald-800">₹{sub.amount.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
              {trialBalance?.rows && (
                <tfoot className="bg-slate-900 text-white font-black text-sm">
                  <tr>
                    <td className="py-4 px-4 font-mono text-slate-400">TOTAL</td>
                    <td colSpan="2" className="py-4 px-4 uppercase tracking-wider">
                      Grand Total (कुल योग - Dr = Cr Equilibrium)
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-emerald-400 text-base">
                      ₹{trialBalance.totalDebit?.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-emerald-400 text-base">
                      ₹{trialBalance.totalCredit?.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: BALANCE SHEET (आर्थिक चिट्ठा / तुलन पत्र) */}
      {activeTab === 'BALANCE_SHEET' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold tracking-tight">
                  {t('Balance Sheet / Financial Statement', 'आर्थिक चिट्ठा (बैलेंस शीट / तुलन पत्र)')}
                </h3>
              </div>
              <p className="text-slate-300 text-xs mt-1">
                {t(
                  'Statement of Financial Position: Assets (Current & Fixed) vs Liabilities & Owner’s Equity.',
                  'वित्तीय स्थिति विवरण: कुल परिसंपत्तियां (रोकड़, उधारी, स्टॉक) बनाम कुल देनदारियां एवं मालिक की पूंजी।'
                )}
              </p>
              <div className="text-[11px] text-slate-400 font-mono mt-2">
                As on Date: {balanceSheet?.asOnDate || new Date().toISOString().split('T')[0]} • Azadpur APMC Standard
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                balanceSheet?.isBalanced ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                <CheckCircle className="w-4 h-4" />
                {balanceSheet?.isBalanced ? 'Tally Balanced (संतुलित)' : 'Review Required'}
              </div>
              <button
                onClick={() => {
                  if (!balanceSheet) return;
                  const rows = [
                    ['CATEGORY', 'ITEM', 'AMOUNT (INR)'],
                    ['ASSETS - Current', 'Cash in Hand', balanceSheet.assets?.currentAssets?.[0]?.amount || 0],
                    ['ASSETS - Current', 'Sundry Debtors', balanceSheet.assets?.currentAssets?.[1]?.amount || 0],
                    ['ASSETS - Current', 'Closing Stock', balanceSheet.assets?.currentAssets?.[2]?.amount || 0],
                    ['ASSETS - Total', 'Total Assets', balanceSheet.totalAssets || 0],
                    ['LIABILITIES - Current', 'Farmer Payables', balanceSheet.liabilities?.currentLiabilities?.[0]?.amount || 0],
                    ['LIABILITIES - Current', 'Freight Payable', balanceSheet.liabilities?.currentLiabilities?.[1]?.amount || 0],
                    ['EQUITY', "Proprietor's Capital", balanceSheet.equity?.capital?.[0]?.amount || 0],
                    ['EQUITY', 'Retained Earnings', balanceSheet.equity?.capital?.[1]?.amount || 0],
                    ['LIABILITIES & EQUITY - Total', 'Total Liabilities & Equity', balanceSheet.totalLiabilitiesAndEquity || 0]
                  ];
                  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `Balance_Sheet_${balanceSheet.asOnDate || 'report'}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> CSV Export
              </button>
            </div>
          </div>

          {/* 2-Column Balance Sheet Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="balance-sheet-print">
            {/* COLUMN 1: LIABILITIES & EQUITY */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
              <div>
                <div className="bg-rose-50/80 px-5 py-3.5 border-b border-rose-100 flex items-center justify-between">
                  <span className="font-black text-rose-950 text-sm uppercase tracking-wider">
                    {t('Liabilities & Capital', 'देनदारियां और पूंजी (Liabilities & Equity)')}
                  </span>
                  <span className="text-xs text-rose-800 font-bold">दायित्व पक्ष</span>
                </div>

                <div className="p-5 space-y-5">
                  {/* Current Liabilities */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                      1. Current Liabilities (चालू देनदारियां)
                    </h4>
                    <div className="divide-y divide-slate-100">
                      {(balanceSheet?.liabilities?.currentLiabilities || []).map((item, idx) => (
                        <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">{item.notes}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">₹{item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 flex justify-between text-xs font-bold text-slate-600 border-t border-slate-200">
                      <span>Subtotal Current Liabilities</span>
                      <span className="font-mono">₹{(balanceSheet?.totalCurrentLiabilities || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Owner's Capital & Equity */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                      2. Capital & Retained Earnings (मालिक की पूंजी व संचित लाभ)
                    </h4>
                    <div className="divide-y divide-slate-100">
                      {(balanceSheet?.equity?.capital || []).map((item, idx) => (
                        <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">{item.notes}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">₹{item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 flex justify-between text-xs font-bold text-slate-600 border-t border-slate-200">
                      <span>Subtotal Capital & Equity</span>
                      <span className="font-mono">₹{(balanceSheet?.totalEquity || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liabilities Total Footer */}
              <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-t border-slate-900">
                <span className="font-black text-xs uppercase tracking-wider">Total Liabilities & Equity (कुल देनदारियां)</span>
                <span className="font-mono font-black text-base text-rose-300">
                  ₹{(balanceSheet?.totalLiabilitiesAndEquity || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* COLUMN 2: ASSETS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
              <div>
                <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-100 flex items-center justify-between">
                  <span className="font-black text-emerald-950 text-sm uppercase tracking-wider">
                    {t('Assets & Inventory', 'संपत्तियां व स्टॉक (Assets & Inventory)')}
                  </span>
                  <span className="text-xs text-emerald-800 font-bold">संपत्ति पक्ष</span>
                </div>

                <div className="p-5 space-y-5">
                  {/* Current Assets */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                      1. Current Assets (चालू परिसंपत्तियां)
                    </h4>
                    <div className="divide-y divide-slate-100">
                      {(balanceSheet?.assets?.currentAssets || []).map((item, idx) => (
                        <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">{item.notes}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">₹{item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 flex justify-between text-xs font-bold text-slate-600 border-t border-slate-200">
                      <span>Subtotal Current Assets</span>
                      <span className="font-mono">₹{(balanceSheet?.totalCurrentAssets || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Fixed Assets */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                      2. Fixed / Mandi Assets (स्थाई परिसंपत्तियां)
                    </h4>
                    <div className="divide-y divide-slate-100">
                      {(balanceSheet?.assets?.fixedAssets || []).map((item, idx) => (
                        <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">{item.notes}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">₹{item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 flex justify-between text-xs font-bold text-slate-600 border-t border-slate-200">
                      <span>Subtotal Fixed Assets</span>
                      <span className="font-mono">₹{(balanceSheet?.totalFixedAssets || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assets Total Footer */}
              <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-t border-slate-900">
                <span className="font-black text-xs uppercase tracking-wider">Total Assets (कुल संपत्तियां)</span>
                <span className="font-mono font-black text-base text-emerald-400">
                  ₹{(balanceSheet?.totalAssets || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEBTOR AGING & 15-DAY INTEREST */}
      {activeTab === 'AGING' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-amber-900">
            <div>
              <div className="font-bold text-sm">APMC 15-Day Statutory Interest Clause</div>
              <div className="text-xs text-amber-800 mt-0.5">
                Per Delhi Agricultural Produce Marketing (Regulation) Act, buyers exceeding 15 calendar days credit incur 18% p.a. delayed payment interest.
              </div>
            </div>
            <button
              onClick={loadData}
              className="p-2 text-amber-700 hover:text-amber-900"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Debtor / Buyer Name</th>
                  <th className="py-3.5 px-4">Phone / City</th>
                  <th className="py-3.5 px-4 text-right">0-15 Days (Current)</th>
                  <th className="py-3.5 px-4 text-right">16-30 Days (Overdue)</th>
                  <th className="py-3.5 px-4 text-right">&gt;30 Days (Critical)</th>
                  <th className="py-3.5 px-4 text-right">Delayed Interest (₹)</th>
                  <th className="py-3.5 px-4 text-right">Total Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-10 text-gray-400">Calculating debtor aging...</td></tr>
                ) : agingData.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-10 text-gray-400">No overdue debtor balances detected. All clear!</td></tr>
                ) : (
                  agingData.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">{d.name}</td>
                      <td className="py-3 px-4 text-xs text-gray-500">{d.phone || d.city || '—'}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-700">₹{(d.bucket_0_15 || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-600 font-semibold">₹{(d.bucket_16_30 || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600 font-bold">₹{(d.bucket_30_plus || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 bg-rose-50/50">₹{(d.calculated_interest || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-gray-900">₹{(d.total_balance || 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cash Modal */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50">
              <h2 className="text-base font-bold text-emerald-950">{t('Record Rokad Entry', 'रोकड़ प्रविष्टि दर्ज करें')}</h2>
              <button onClick={() => setShowCashModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCashSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{t('Transaction Type', 'लेनदेन का प्रकार')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCashForm({ ...cashForm, entry_type: 'cash_in' })}
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      cashForm.entry_type === 'cash_in' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-700 border-gray-300'
                    }`}
                  >
                    {t('Cash In (Receipt)', 'रोकड़ जमा (आवक)')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashForm({ ...cashForm, entry_type: 'cash_out' })}
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      cashForm.entry_type === 'cash_out' ? 'bg-rose-600 text-white border-rose-600' : 'bg-gray-50 text-gray-700 border-gray-300'
                    }`}
                  >
                    {t('Cash Out (Payment)', 'रोकड़ भुगतान (जावक)')}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="₹ 0.00"
                  value={cashForm.amount}
                  onChange={(e) => setCashForm({ ...cashForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Related Party / Account</label>
                <select
                  value={cashForm.account_id}
                  onChange={(e) => setCashForm({ ...cashForm, account_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Counter Cash / Miscellaneous</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.account_type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Narration / Details</label>
                <input
                  type="text"
                  placeholder="e.g. Received token advance for Lot 104"
                  value={cashForm.description}
                  onChange={(e) => setCashForm({ ...cashForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCashModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm"
                >
                  {submitting ? 'Saving...' : 'Post Rokad Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Journal Modal */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50">
              <h2 className="text-base font-bold text-indigo-950">Double-Entry Journal Voucher (Dr = Cr)</h2>
              <button onClick={() => setShowJournalModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleJournalSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Voucher Date</label>
                  <input
                    type="date"
                    required
                    value={journalDate}
                    onChange={(e) => setJournalDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Narration / Voucher Note</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bank settlement against dispatch"
                    value={journalNarration}
                    onChange={(e) => setJournalNarration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Rows */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="col-span-6">Account Name</div>
                  <div className="col-span-3 text-right">Debit (Dr ₹)</div>
                  <div className="col-span-3 text-right">Credit (Cr ₹)</div>
                </div>
                {journalRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <select
                        value={row.account_id}
                        onChange={(e) => handleJournalRowChange(idx, 'account_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">-- Choose Account --</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.account_type})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={row.debit_amount}
                        onChange={(e) => handleJournalRowChange(idx, 'debit_amount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-right font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={row.credit_amount}
                        onChange={(e) => handleJournalRowChange(idx, 'credit_amount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-right font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleAddJournalRow}
                  className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Row
                </button>
                <div className="text-right space-y-1">
                  <div className="text-xs text-gray-500">
                    Total Dr: <b className="font-mono text-gray-900">₹{totalDebit.toFixed(2)}</b> | Total Cr: <b className="font-mono text-gray-900">₹{totalCredit.toFixed(2)}</b>
                  </div>
                  <div className={`text-xs font-bold ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isBalanced ? '✓ Balanced (Dr = Cr)' : `⚠ Unbalanced Difference: ₹${Math.abs(totalDebit - totalCredit).toFixed(2)}`}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced || submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm disabled:opacity-50"
                >
                  {submitting ? 'Validating & Posting...' : 'Post Balanced Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Opening Cash Setup Modal */}
      {showOpeningCashModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">{t('Configure Opening Cash', 'आरंभिक रोकड़ शेष सेट करें')}</h3>
              <button onClick={() => setShowOpeningCashModal(false)} className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveOpeningCash} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 text-xs block mb-1">
                  {t('Opening Cash in Hand (₹)', 'आरंभिक रोकड़ शेष (₹)')}
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold font-mono text-emerald-800 text-base focus:ring-2 focus:ring-emerald-600 outline-none"
                  placeholder="0"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {t('Set your initial cash balance in shop drawer/safe.', 'अपनी तिजोरी या गल्ले की आरंभिक रोकड़ राशि दर्ज करें।')}
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpeningCashModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                >
                  Save (सुरक्षित करें)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Freight Payment Modal */}
      {showDriverPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50">
              <h2 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>{t('Pay Freight to Driver', 'चालक को गाड़ी भाड़ा भुगतान')}</span>
              </h2>
              <button onClick={() => setShowDriverPaymentModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDriverPaymentSubmit} className="p-5 space-y-3.5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">{t('Vehicle / Truck', 'गाड़ी संख्या')}:</span>
                  <span className="font-mono font-black text-slate-800 text-sm">{selectedDriver?.truckNo || '—'}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-slate-500 font-bold">{t('Driver Name', 'चालक नाम')}:</span>
                  <span className="font-bold text-slate-700">{selectedDriver?.driverName || 'Driver'}</span>
                </div>
                <div className="flex justify-between items-center mt-1 border-t border-slate-200 pt-1">
                  <span className="text-rose-600 font-bold">{t('Outstanding Freight', 'कुल बाकी भाड़ा')}:</span>
                  <span className="font-mono font-black text-rose-700 text-sm">₹{(selectedDriver?.freightBalance || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('Payment Amount (₹) *', 'भुगतान राशि (₹) *')}
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  min="1"
                  placeholder="₹ 0"
                  value={driverPaymentForm.amount}
                  onChange={(e) => setDriverPaymentForm({ ...driverPaymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-mono font-black text-emerald-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('Payment Mode *', 'भुगतान माध्यम *')}
                </label>
                <select
                  value={driverPaymentForm.paymentMode}
                  onChange={(e) => setDriverPaymentForm({ ...driverPaymentForm, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Cash">💵 Cash in Hand / Rokad (रोकड़ बही से)</option>
                  <option value="Bank / UPI">📱 Bank Transfer / UPI (बैंक खाता)</option>
                  <option value="Cheque">📜 Cheque (चेक)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">नकद भुगतान स्वतः रोकड़ बही (Cashbook) में खर्च दर्ज करेगा।</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('Narration / Voucher Remark', 'विवरण / नरेशन')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared freight balance via UPI"
                  value={driverPaymentForm.narration}
                  onChange={(e) => setDriverPaymentForm({ ...driverPaymentForm, narration: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDriverPaymentModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {submitting ? 'Processing...' : 'Confirm Freight Payment (पुष्टि करें)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crate Movement / Voucher Modal */}
      {showCrateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-50">
              <h2 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-700" />
                <span>{t('Record Crate Movement Voucher', 'नया क्रेट वाउचर / जमा-निकासी')}</span>
              </h2>
              <button onClick={() => setShowCrateModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCrateMovementSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('Date (दिनांक) *', 'दिनांक *')}</label>
                  <input
                    type="date"
                    required
                    value={crateForm.date || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setCrateForm({ ...crateForm, date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('Entity Category *', 'प्रविष्टि श्रेणी *')}</label>
                  <select
                    value={crateForm.entityType}
                    onChange={(e) => setCrateForm({ ...crateForm, entityType: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="party">👤 Party (Farmer / Buyer / Store)</option>
                    <option value="driver">🚚 Driver / Vehicle Transporter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {crateForm.entityType === 'driver' ? t('Driver Name / Transporter *', 'चालक / ट्रांसपोर्टर नाम *') : t('Party Name (Farmer / Buyer) *', 'पार्टी नाम (किसान या व्यापारी) *')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={crateForm.entityType === 'driver' ? "e.g. Gurmel Singh" : "e.g. Azad Fruits or Ramesh Grower"}
                  value={crateForm.entityName}
                  onChange={(e) => setCrateForm({ ...crateForm, entityName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {crateForm.entityType === 'driver' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('Vehicle / Truck No. *', 'गाड़ी / वाहन संख्या *')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-01-AB-1234"
                    value={crateForm.vehicleNo}
                    onChange={(e) => setCrateForm({ ...crateForm, vehicleNo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('Party Type', 'पार्टी प्रकार')}</label>
                  <select
                    value={crateForm.partyType}
                    onChange={(e) => setCrateForm({ ...crateForm, partyType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Buyer">🛒 Buyer / Wholesale Trader (खरीदार)</option>
                    <option value="Farmer">🌾 Farmer / Grower Supplier (किसान)</option>
                    <option value="Agent">🤝 Commission Agent (आढ़ती)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('Movement Direction *', 'आवक / जावक *')}</label>
                  <select
                    value={crateForm.movementType}
                    onChange={(e) => setCrateForm({ ...crateForm, movementType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="RECEIVED">📥 Received / Inward (प्राप्त क्रेट)</option>
                    <option value="GIVEN">📤 Issued / Returned (दी गई क्रेट)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('Number of Crates *', 'क्रेट्स संख्या *')}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50"
                    value={crateForm.cratesCount}
                    onChange={(e) => setCrateForm({ ...crateForm, cratesCount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-black text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('Movement Type / Reason', 'कारण / वाउचर प्रकार')}</label>
                <select
                  value={crateForm.referenceType}
                  onChange={(e) => setCrateForm({ ...crateForm, referenceType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="empty_return">🔄 Empty Crate Return (खाली क्रेट वापसी)</option>
                  <option value="manual_adjustment">📝 Manual Crate Adjustment (समायोजन)</option>
                  <option value="new_issue">📦 New Crates Dispatched (नई क्रेट निकासी)</option>
                  <option value="damage_loss">⚠️ Damage / Breakage Loss (टूट-फूट)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('Challan / Remarks', 'चालान नं. / टिप्पणी')}</label>
                <input
                  type="text"
                  placeholder="उदा. Challan #104 - 50 empty crates returned"
                  value={crateForm.notes}
                  onChange={(e) => setCrateForm({ ...crateForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCrateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Crate Voucher (सुरक्षित करें)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
