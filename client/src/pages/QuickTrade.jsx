import React, { useState, useEffect } from 'react';
import { API } from '../api';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Zap, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Truck, 
  User, 
  RotateCcw, 
  Sparkles,
  Users,
  Info
} from 'lucide-react';

export default function QuickTrade() {
  const { activeTenant } = useTenant();
  const { t, isHindi } = useLanguage();

  // Fresh initial states - completely clean for new users
  const [manualLotNo, setManualLotNo] = useState('');
  const [truckNo, setTruckNo] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [commodity, setCommodity] = useState('');
  const [totalFreight, setTotalFreight] = useState('');
  const [freightAdvance, setFreightAdvance] = useState('');
  const [arrivalRate, setArrivalRate] = useState('');

  const [lots, setLots] = useState([
    { id: 'LOT-1', label: 'Lot 1 (Mark-1)', mark: '', variety: '', qty: '' }
  ]);

  const [buyerRows, setBuyerRows] = useState([
    { id: 1, targetLot: 'LOT-1', buyerName: '', buyerContact: '', qty: '', rate: '' }
  ]);

  const [commoditiesList, setCommoditiesList] = useState([]);
  const [varietiesList, setVarietiesList] = useState([]);
  const [farmerExpenses, setFarmerExpenses] = useState([]);
  const [buyerExpenses, setBuyerExpenses] = useState([]);
  const [partiesList, setPartiesList] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.getCommodities()
      .then(data => {
        setCommoditiesList(data);
        if (data && data.length > 0 && !commodity) {
          setCommodity(data[0].name_en || data[0].name);
        }
      })
      .catch(() => {});

    API.getVarieties()
      .then(data => {
        setVarietiesList(Array.isArray(data) ? data : []);
      })
      .catch(() => {});

    API.getExpenses()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        const f = list.filter(e => e.target === 'farmer' || e.target === 'both').map(e => ({
          id: e.id, name: e.name, hindi_name: e.hindi_name, type: e.type, amount: e.default_amount || 0, enabled: true
        }));
        const b = list.filter(e => e.target === 'buyer' || e.target === 'both').map(e => ({
          id: e.id, name: e.name, hindi_name: e.hindi_name, type: e.type, amount: e.default_amount || 0, enabled: true
        }));
        setFarmerExpenses(f);
        setBuyerExpenses(b);
      })
      .catch(() => {});

    API.getParties()
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.parties || []);
        setPartiesList(list);
      })
      .catch(() => {});
  }, [activeTenant]);

  const farmers = partiesList.filter(p => p.party_type === 'farmer' || p.party_type === 'both');
  const buyers = partiesList.filter(p => p.party_type === 'buyer' || p.party_type === 'both');

  const totalArrived = lots.reduce((acc, l) => acc + (parseInt(l.qty, 10) || 0), 0);
  const totalAllocated = buyerRows.reduce((acc, r) => acc + (parseInt(r.qty, 10) || 0), 0);
  const totalGrossValue = buyerRows.reduce((acc, r) => acc + ((parseInt(r.qty, 10) || 0) * (parseFloat(r.rate) || 0)), 0);
  const totalArrivalCost = totalArrived * (parseFloat(arrivalRate) || 0);
  const netTradingMargin = parseFloat(arrivalRate) > 0 ? (totalGrossValue - totalArrivalCost) : 0;
  const marginPercent = (totalArrivalCost > 0 && parseFloat(arrivalRate) > 0) ? ((netTradingMargin / totalArrivalCost) * 100).toFixed(1) : 0;

  const resetToFresh = () => {
    setTruckNo('');
    setFarmerName('');
    setFarmerPhone('');
    setTotalFreight('');
    setFreightAdvance('');
    setArrivalRate('');
    setLots([
      { id: 'LOT-1', label: 'Lot 1 (Mark-1)', mark: '', variety: '', qty: '' }
    ]);
    setBuyerRows([
      { id: Date.now(), targetLot: 'LOT-1', buyerName: '', buyerContact: '', qty: '', rate: '' }
    ]);
    setMessage('✓ Form cleared. Ready for fresh consignment entry.');
    setError('');
    setTimeout(() => setMessage(''), 3000);
  };

  const loadSampleDemo = () => {
    setTruckNo('HP-10-B-9812');
    setFarmerName('Harish Negi');
    setFarmerPhone('+91 98160 44321');
    setTotalFreight(36000);
    setFreightAdvance(15000);
    setArrivalRate(1800);
    if (commoditiesList.length > 0) {
      setCommodity(commoditiesList[0].name_en || commoditiesList[0].name);
    }
    setLots([
      { id: 'LOT-1', label: 'Lot 1 (Grade A / Mark-1)', mark: 'Mark HN-1', variety: 'Medium Size 24mm', qty: 150 },
      { id: 'LOT-2', label: 'Lot 2 (Grade B / Mark-2)', mark: 'Mark HN-2', variety: 'Small Size 20mm', qty: 150 }
    ]);
    setBuyerRows([
      { id: 1, targetLot: 'LOT-1', buyerName: 'Aggarwal Wholesale Mart', buyerContact: '+91 98110 55432', qty: 150, rate: 2150 },
      { id: 2, targetLot: 'LOT-2', buyerName: 'Rajdhani Hotel Supplies', buyerContact: '+91 99100 88776', qty: 150, rate: 1950 }
    ]);
    setMessage('Sample demo trade loaded. You can edit any field or submit to test.');
    setError('');
  };

  const handleFarmerChange = (val) => {
    setFarmerName(val);
    const matched = farmers.find(f => f.name.toLowerCase() === val.toLowerCase());
    if (matched && matched.mobile) {
      setFarmerPhone(matched.mobile);
    }
  };

  const handleBuyerNameChange = (idx, val) => {
    const updated = [...buyerRows];
    updated[idx].buyerName = val;
    const matched = buyers.find(b => b.name.toLowerCase() === val.toLowerCase());
    if (matched && matched.mobile) {
      updated[idx].buyerContact = matched.mobile;
    }
    setBuyerRows(updated);
  };

  const handleAddLot = () => {
    const nextNum = lots.length + 1;
    setLots([...lots, { id: `LOT-${nextNum}`, label: `Lot ${nextNum}`, mark: '', variety: '', qty: '' }]);
  };

  const handleRemoveLot = (id) => {
    if (lots.length <= 1) return;
    setLots(lots.filter(l => l.id !== id));
  };

  const handleAddBuyerRow = () => {
    setBuyerRows([...buyerRows, {
      id: Date.now(),
      targetLot: lots[0]?.id || 'LOT-1',
      buyerName: '',
      buyerContact: '',
      qty: Math.max(0, totalArrived - totalAllocated) || '',
      rate: ''
    }]);
  };

  const handleRemoveBuyerRow = (id) => {
    if (buyerRows.length <= 1) return;
    setBuyerRows(buyerRows.filter(r => r.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (totalArrived <= 0) {
      setError('Consignment lot quantities must be greater than 0.');
      return;
    }

    const activeBuyerRows = buyerRows.filter(r => (r.buyerName || '').trim() || (parseInt(r.qty, 10) || 0) > 0 || (parseFloat(r.rate) || 0) > 0);
    if (activeBuyerRows.length === 0) {
      setError('Please add at least one buyer sale with buyer name, quantity and rate.');
      return;
    }

    for (let i = 0; i < activeBuyerRows.length; i++) {
      const r = activeBuyerRows[i];
      if (!r.buyerName || !r.buyerName.trim()) {
        setError(`Buyer #${i + 1}: Please enter buyer name.`);
        return;
      }
      if ((parseInt(r.qty, 10) || 0) <= 0) {
        setError(`Buyer #${i + 1} (${r.buyerName}): Quantity must be greater than 0.`);
        return;
      }
      if ((parseFloat(r.rate) || 0) <= 0) {
        setError(`Buyer #${i + 1} (${r.buyerName}): Rate (₹) must be greater than 0.`);
        return;
      }
    }

    if (totalAllocated > totalArrived) {
      setError(`Allocated units (${totalAllocated}) cannot exceed arrived units (${totalArrived}).`);
      return;
    }

    setLoading(true);
    try {
      const res = await API.quickTrade({
        manualLotNo: manualLotNo ? manualLotNo.trim() : null,
        truckNo,
        farmerName,
        farmerPhone,
        arrivalRate: parseFloat(arrivalRate) || 0,
        commodity: commodity || (commoditiesList[0]?.name_en || 'Standard Produce'),
        totalFreight: parseFloat(totalFreight) || 0,
        freightAdvance: parseFloat(freightAdvance) || 0,
        lots: lots.map(l => ({ ...l, qty: parseInt(l.qty, 10) || 0, quantity: parseInt(l.qty, 10) || 0 })),
        splitSales: activeBuyerRows.map(r => ({
          ...r,
          buyerName: r.buyerName.trim(),
          qty: parseInt(r.qty, 10) || 0,
          quantity: parseInt(r.qty, 10) || 0,
          rate: parseFloat(r.rate) || 0
        })),
        customExpenses: {
          farmer: farmerExpenses.filter(e => e.enabled),
          buyer: buyerExpenses.filter(e => e.enabled)
        }
      });
      
      setMessage(`⚡ Consignment ${res.consignmentId || 'TC-' + Date.now().toString().slice(-4)} sealed & Teep generated for ${res.totalArrived || totalArrived} units! Auto-JV posted.`);
      
      // Auto-reset form for fresh next trade
      setManualLotNo('');
      setTruckNo('');
      setFarmerName('');
      setFarmerPhone('');
      setTotalFreight('');
      setFreightAdvance('');
      setArrivalRate('');
      setLots([
        { id: 'LOT-1', label: 'Lot 1 (Mark-1)', mark: '', variety: '', qty: '' }
      ]);
      setBuyerRows([
        { id: Date.now(), targetLot: 'LOT-1', buyerName: '', buyerContact: '', qty: '', rate: '' }
      ]);
    } catch (err) {
      setError(err.message || 'Trade submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HTML5 Datalists for instant party autocomplete */}
      <datalist id="farmers-datalist">
        {farmers.map(f => (
          <option key={f.id} value={f.name}>
            {f.name} {f.short_code ? `[${f.short_code}]` : ''} - {f.mobile || ''}
          </option>
        ))}
      </datalist>

      <datalist id="buyers-datalist">
        {buyers.map(b => (
          <option key={b.id} value={b.name}>
            {b.name} {b.short_code ? `[${b.short_code}]` : ''} - {b.mobile || ''}
          </option>
        ))}
      </datalist>

      <datalist id="quicktrade-varieties-list">
        {varietiesList.map(v => (
          <option key={v.id} value={v.name}>
            {v.commodity_name ? `${v.commodity_name} - ` : ''}{v.name} {v.grade ? `(${v.grade})` : ''}
          </option>
        ))}
      </datalist>

      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              ⚡
            </span>
            <h1 className="text-xl font-black text-slate-900">{t('Unified Trade & Single Form Engine', 'एकल व्यापार एवं त्वरित सौदा इंजन')}</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              {t('Fresh Trade Mode', 'नया सौदा मोड')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('Inward truck arrival, multi-lot split sales, palledari, and instant Teep generation in a single atomic form.', 'एकल फॉर्म: गाड़ी आवक, बहु-लॉट बिक्री, पल्लेदारी व तत्काल पक्का पर्चा निर्माण।')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={resetToFresh}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            title="Clear all fields for a fresh consignment"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            {t('fresh_form')}
          </button>

          <button
            type="button"
            onClick={loadSampleDemo}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-200"
            title="Fill sample demo data for quick testing"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            {t('sample_data')}
          </button>

          {parseFloat(arrivalRate) > 0 ? (
            <div className="flex items-center gap-2">
              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('Arrival Cost', 'आवक लागत')}</span>
                <span className="text-sm font-black text-slate-700">₹{totalArrivalCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('Gross Sale', 'सकल बिक्री')}</span>
                <span className="text-sm font-black text-emerald-800">₹{totalGrossValue.toLocaleString('en-IN')}</span>
              </div>
              <div className={`px-3 py-1.5 rounded-xl text-right border ${netTradingMargin >= 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
                <span className="text-[10px] font-bold uppercase block opacity-80">{t('Net Margin', 'व्यापारिक मुनाफा')}</span>
                <span className="text-base font-black">
                  ₹{netTradingMargin.toLocaleString('en-IN')} <span className="text-xs font-normal">({marginPercent}%)</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('Gross Realized Value', 'सकल बिक्री मूल्य')}</span>
              <span className="text-base font-black text-emerald-800">₹{totalGrossValue.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-900 font-bold text-xs flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Inward Consignment Details */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{t('1. Inward Truck & Farmer Details', '1. गाड़ी आवक व किसान विवरण')}</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {farmers.length > 0 && (
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {farmers.length} {t('Registered Farmers', 'पंजीकृत किसान')}
                </span>
              )}
              <span>{t('Step 1 of 3', 'चरण 1 / 3')}</span>
            </div>
          </div>

          {/* Row 0: Manual Lot Number */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="font-bold text-slate-800 text-xs block mb-1">
                  {t('Consignment Lot No. (Manual / Auto)', 'लॉट नंबर (वैकल्पिक / खाली छोड़ें तो स्वतः बनेगा)')}
                </label>
                <input
                  type="text"
                  value={manualLotNo}
                  onChange={(e) => setManualLotNo(e.target.value.toUpperCase())}
                  placeholder="e.g. LOT-QT101 (or leave blank for auto LOT-xxxx)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase font-black text-indigo-900 bg-white placeholder:font-normal placeholder:normal-case placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-xs"
                />
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="font-bold text-slate-700 block">💡 Manual Lot / Marka:</span>
                Custom lot identifier for this truck consignment. Auto-assigned if left empty.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('Truck / Vehicle No. *', 'गाड़ी / वाहन संख्या *')}</label>
              <input
                type="text"
                required
                value={truckNo}
                onChange={(e) => setTruckNo(e.target.value)}
                placeholder="e.g. DL-01-AB-1234"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold uppercase placeholder:font-normal placeholder:normal-case placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('Farmer / Producer Name *', 'किसान / उत्पादक का नाम *')}</label>
              <input
                type="text"
                required
                list="farmers-datalist"
                value={farmerName}
                onChange={(e) => handleFarmerChange(e.target.value)}
                placeholder={t('Type or select Kisan Name...', 'किसान का नाम चुनें या लिखें...')}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('Farmer Phone', 'किसान मोबाइल')}</label>
              <input
                type="text"
                value={farmerPhone}
                onChange={(e) => setFarmerPhone(e.target.value)}
                placeholder="e.g. 98160 44321"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('Commodity *', 'फसल / जिंस *')}</label>
              <select
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              >
                {commoditiesList.map(c => (
                  <option key={c.id} value={c.name_en || c.name}>
                    {isHindi ? (c.name_hi || c.name_en || c.name) : (c.name_en || c.name)}
                  </option>
                ))}
                {commoditiesList.length === 0 && (
                  <option value="Apple - Royal Delicious">{isHindi ? 'सेब - रॉयल डिलीशियस' : 'Apple - Royal Delicious'}</option>
                )}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('Total Truck Freight (₹)', 'कुल गाड़ी भाड़ा (₹)')}</label>
              <input
                type="number"
                value={totalFreight}
                onChange={(e) => setTotalFreight(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('Freight Advance Paid to Driver (₹)', 'चालक को पेशगी भाड़ा (₹)')}</label>
              <input
                type="number"
                value={freightAdvance}
                onChange={(e) => setFreightAdvance(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-amber-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          {/* Dynamic Mandi Expenses Checklist (Farmer & Buyer) */}
          {(farmerExpenses.length > 0 || buyerExpenses.length > 0) && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="text-emerald-700">⚖️</span> {t('Applicable Mandi Expenses & Deductions', 'लागू मंडी खर्चे व कटौतियां (Farmer & Buyer Expenses)')}
                </span>
                <span className="text-[11px] text-slate-500">Settings से स्वतः लोड (जरूरत अनुसार बदलें)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Farmer Deductions */}
                {farmerExpenses.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-600 text-[11px] block">किसान कटौतियां (Farmer Deductions):</span>
                    <div className="space-y-1.5">
                      {farmerExpenses.map((exp, idx) => (
                        <div key={exp.id || idx} className="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="checkbox"
                              checked={exp.enabled}
                              onChange={(e) => {
                                const updated = [...farmerExpenses];
                                updated[idx].enabled = e.target.checked;
                                setFarmerExpenses(updated);
                              }}
                              className="rounded text-emerald-600 cursor-pointer"
                            />
                            <span>{exp.name} {exp.hindi_name ? `(${exp.hindi_name})` : ''}</span>
                          </label>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-mono text-[10px]">
                              {exp.type === 'per_unit' ? '₹/नग' : exp.type === 'percentage' ? '%' : '₹'}
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={exp.amount}
                              onChange={(e) => {
                                const updated = [...farmerExpenses];
                                updated[idx].amount = parseFloat(e.target.value) || 0;
                                setFarmerExpenses(updated);
                              }}
                              className="w-16 px-1.5 py-1 border border-slate-300 rounded-lg font-mono text-right text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buyer Charges */}
                {buyerExpenses.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-600 text-[11px] block">खरीदार खर्चे (Buyer Charges):</span>
                    <div className="space-y-1.5">
                      {buyerExpenses.map((exp, idx) => (
                        <div key={exp.id || idx} className="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="checkbox"
                              checked={exp.enabled}
                              onChange={(e) => {
                                const updated = [...buyerExpenses];
                                updated[idx].enabled = e.target.checked;
                                setBuyerExpenses(updated);
                              }}
                              className="rounded text-emerald-600 cursor-pointer"
                            />
                            <span>{exp.name} {exp.hindi_name ? `(${exp.hindi_name})` : ''}</span>
                          </label>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-mono text-[10px]">
                              {exp.type === 'per_unit' ? '₹/नग' : exp.type === 'percentage' ? '%' : '₹'}
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={exp.amount}
                              onChange={(e) => {
                                const updated = [...buyerExpenses];
                                updated[idx].amount = parseFloat(e.target.value) || 0;
                                setBuyerExpenses(updated);
                              }}
                              className="w-16 px-1.5 py-1 border border-slate-300 rounded-lg font-mono text-right text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Kisan Arrival Rate (Awak Rate) */}
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-emerald-950 text-xs block">
                {t('Kisan Arrival Rate (किसान आवक भाव ₹ / नग)', 'किसान आवक भाव / खरीद दर (₹/नग)')}
              </label>
              <span className="text-[11px] text-emerald-700 font-semibold">
                {parseFloat(arrivalRate) > 0 ? 'पक्की आढ़त / व्यापारी खरीद' : 'खाली छोड़ें = कच्ची आढ़त (Commission)'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={arrivalRate}
                  onChange={(e) => setArrivalRate(e.target.value)}
                  placeholder="0 (Awak Rate per Bag/Nag)"
                  className="w-full pl-7 p-2 border border-emerald-300 rounded-xl font-mono font-bold text-emerald-950 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>
              <div className="text-xs bg-white px-3 py-2 rounded-xl border border-emerald-100 flex items-center justify-between font-mono">
                <span className="text-slate-500">{t('Total Inward Cost:', 'कुल आवक लागत:')}</span>
                <span className="font-black text-emerald-800 text-sm">
                  ₹{totalArrivalCost.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Consignment Lots */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{t('2. Multi-Lot Marks & Grading', '2. लॉट मार्का व ग्रेडिंग')}</h2>
              <span className="text-xs text-slate-500">{t('Total Arrived Units:', 'कुल आवक नग:')} <strong className="text-slate-900">{totalArrived} {t('Boxes / Bags', 'नग / बोरी')}</strong></span>
            </div>
            <button
              type="button"
              onClick={handleAddLot}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              + {t('Add Sub-Lot', 'नया लॉट जोड़ें')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lots.map((lot, idx) => (
              <div key={lot.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded-lg">
                    {lot.id}
                  </span>
                  {lots.length > 1 && (
                    <button type="button" onClick={() => handleRemoveLot(lot.id)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">{t('Farmer Mark', 'किसान मार्का')}</label>
                    <input
                      type="text"
                      value={lot.mark}
                      placeholder="e.g. Mark HN-1"
                      onChange={(e) => {
                        const updated = [...lots];
                        updated[idx].mark = e.target.value;
                        setLots(updated);
                      }}
                      className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">{t('Variety / Grade', 'किस्म / ग्रेड')}</label>
                    <input
                      type="text"
                      list="quicktrade-varieties-list"
                      value={lot.variety}
                      placeholder="e.g. Medium 24mm"
                      onChange={(e) => {
                        const updated = [...lots];
                        updated[idx].variety = e.target.value;
                        setLots(updated);
                      }}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">{t('Quantity (Units) *', 'मात्रा (नग/बोरी) *')}</label>
                    <input
                      type="number"
                      value={lot.qty}
                      placeholder="0"
                      onChange={(e) => {
                        const updated = [...lots];
                        updated[idx].qty = e.target.value;
                        setLots(updated);
                      }}
                      className="w-full p-2 border border-slate-300 rounded-xl font-bold font-mono text-slate-900 bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Buyer Split Allocations */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{t('3. Buyer Split Sales', '3. खरीदार बिक्री व आवंटन')}</h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs">
                <span className={`font-bold ${totalAllocated === totalArrived && totalArrived > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {t('Allocated:', 'आवंटित:')} {totalAllocated} / {totalArrived} {t('Units', 'नग')}
                </span>
                {totalAllocated === totalArrived && totalArrived > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    ✓ {t('100% Balanced', '100% संतुलित')}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddBuyerRow}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors border border-emerald-200"
            >
              <Plus className="w-3.5 h-3.5" />
              + {t('Add Buyer Split', 'नया खरीदार जोड़ें')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-2">{t('Target Lot', 'लॉट सं.')}</th>
                  <th className="p-2">{t('buyer_name')}</th>
                  <th className="p-2">{t('driver_phone', 'फोन')}</th>
                  <th className="p-2">{t('quantity')}</th>
                  <th className="p-2">{t('rate')}</th>
                  <th className="p-2 text-right">{t('gross_amount')}</th>
                  <th className="p-2 text-center">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {buyerRows.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="p-2">
                      <select
                        value={row.targetLot}
                        onChange={(e) => {
                          const updated = [...buyerRows];
                          updated[idx].targetLot = e.target.value;
                          setBuyerRows(updated);
                        }}
                        className="p-2 border border-slate-300 rounded-lg font-mono font-bold bg-white focus:border-emerald-600 outline-none"
                      >
                        {lots.map(l => (
                          <option key={l.id} value={l.id}>{l.id}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        list="buyers-datalist"
                        value={row.buyerName}
                        placeholder={t('Type or select Buyer...', 'खरीदार का नाम चुनें या लिखें...')}
                        onChange={(e) => handleBuyerNameChange(idx, e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg font-bold placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-600 outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.buyerContact}
                        placeholder="e.g. 98110 55432"
                        onChange={(e) => {
                          const updated = [...buyerRows];
                          updated[idx].buyerContact = e.target.value;
                          setBuyerRows(updated);
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono text-[11px] placeholder:text-slate-400 focus:border-emerald-600 outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.qty}
                        placeholder="0"
                        onChange={(e) => {
                          const updated = [...buyerRows];
                          updated[idx].qty = e.target.value;
                          setBuyerRows(updated);
                        }}
                        className="w-24 p-2 border border-slate-300 rounded-lg font-mono font-bold focus:border-emerald-600 outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.rate}
                        placeholder="0"
                        onChange={(e) => {
                          const updated = [...buyerRows];
                          updated[idx].rate = e.target.value;
                          setBuyerRows(updated);
                        }}
                        className="w-24 p-2 border border-slate-300 rounded-lg font-mono font-bold focus:border-emerald-600 outline-none"
                      />
                    </td>
                    <td className="p-2 text-right font-bold text-slate-900 font-mono text-sm">
                      ₹{((parseInt(row.qty, 10) || 0) * (parseFloat(row.rate) || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="p-2 text-center">
                      {buyerRows.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveBuyerRow(row.id)} 
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || totalArrived === 0}
          className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          {loading ? t('Processing Atomic Trade...', 'प्रक्रिया जारी है...') : t('⚡ Seal Consignment & Generate Teep Voucher →', '⚡ सौदा सुरक्षित करें व पक्का टीप बनाएं →')}
        </button>

      </form>
    </div>
  );
}
