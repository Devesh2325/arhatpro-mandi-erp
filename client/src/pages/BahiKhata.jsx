import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { BookOpen, DollarSign, ArrowUpRight, ArrowDownLeft, ShieldCheck, Clock, Plus, Search, Filter, AlertTriangle, CheckCircle, RefreshCw, X, Receipt } from 'lucide-react';

export default function BahiKhata() {
  const { t, isHindi } = useLanguage();
  const [activeTab, setActiveTab] = useState('ACCOUNTS'); // ACCOUNTS, CASHBOOK, JOURNAL, AGING
  const [accounts, setAccounts] = useState([]);
  const [cashEntries, setCashEntries] = useState([]);
  const [agingData, setAgingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState(null);

  // Cashbook form state
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
        const res = await api.getAccounts();
        setAccounts(res.accounts || []);
      } else if (activeTab === 'CASHBOOK') {
        const [cashRes, accRes] = await Promise.all([
          api.getCashbook(),
          api.getAccounts()
        ]);
        setCashEntries(cashRes.entries || []);
        setAccounts(accRes.accounts || []);
      } else if (activeTab === 'AGING') {
        const res = await api.getDebtorAging();
        setAgingData(res.debtors || []);
      } else if (activeTab === 'JOURNAL') {
        const accRes = await api.getAccounts();
        setAccounts(accRes.accounts || []);
      }
    } catch (err) {
      console.error('Failed to load ledger data:', err);
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            {t('Bahi-Khata & Rokad Ledger', 'बही-खाता एवं रोकड़ बही')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('Indian Mandi double-entry accounting system with 15-day APMC debtor interest calculator.', 'मंडी द्वि-प्रविष्टि बहीखाता एवं 15-दिवसीय एपीएमसी विलंब ब्याज कैलकुलेटर।')}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
      <div className="flex border-b border-gray-200 gap-6">
        {[
          { id: 'ACCOUNTS', label: t('Khata Accounts', 'खाता बही'), icon: BookOpen },
          { id: 'CASHBOOK', label: t('Rokad / Cashbook', 'रोकड़ बही'), icon: DollarSign },
          { id: 'JOURNAL', label: t('Double-Entry Journal', 'जर्नल वाउचर'), icon: ShieldCheck },
          { id: 'AGING', label: t('15-Day Aging & Interest', 'ब्याज गणना व अवधि'), icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
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
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search account name, type, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button
              onClick={loadData}
              className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Account Name</th>
                  <th className="py-3.5 px-4">Account Type</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4 text-right">Balance</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-10 text-gray-400">Loading ledger accounts...</td></tr>
                ) : accounts.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-10 text-gray-400">No accounts registered yet.</td></tr>
                ) : (
                  accounts
                    .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.account_type.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(acc => {
                      const isDr = (acc.balance || 0) >= 0;
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

      {/* TAB 2: CASHBOOK / ROKAD */}
      {activeTab === 'CASHBOOK' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Daily Rokad Transactions / रोकड़ बही</span>
              <button
                onClick={() => setShowCashModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Cash Entry
              </button>
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
                    const isCashIn = entry.entry_type === 'cash_in';
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-xs font-mono text-gray-500">
                          {new Date(entry.transaction_date).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isCashIn ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isCashIn ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {isCashIn ? t('Cash In', 'रोकड़ जमा') : t('Cash Out', 'रोकड़ भुगतान')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{entry.account_name || 'Counter Cash'}</td>
                        <td className="py-3 px-4 text-xs text-gray-500">{entry.description || '—'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                          {isCashIn ? `₹${entry.amount.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                          {!isCashIn ? `₹${entry.amount.toLocaleString()}` : '—'}
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

      {/* TAB 3: JOURNAL (DR = CR) */}
      {activeTab === 'JOURNAL' && (
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-indigo-950 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" /> Double-Entry General Journal Guarantee
              </h3>
              <p className="text-xs text-indigo-800 mt-1 max-w-2xl leading-relaxed">
                Every transaction posted in Azadpur Mandi ERP requires exact equilibrium between Debit and Credit (Dr = Cr). Unbalanced entries are mathematically intercepted and rejected at the database level.
              </p>
            </div>
            <button
              onClick={() => setShowJournalModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Journal Voucher
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            <Receipt className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
            <div className="text-base font-bold text-gray-900">Audit-Compliant Voucher Recording</div>
            <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
              Click the button above to record bank settlements, supplier contra entries, freight disbursements or bad-debt provisions.
            </p>
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
    </div>
  );
}
