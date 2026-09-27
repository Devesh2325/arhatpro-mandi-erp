import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  X, 
  Receipt, 
  Tag, 
  Calendar, 
  UserCheck,
  RotateCcw,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  Package,
  ArrowRight
} from 'lucide-react';
import PartySearchSelect from '../components/PartySearchSelect';

export default function Arrivals() {
  const { t, isHindi } = useLanguage();
  const [activeView, setActiveView] = useState('FORM'); // 'FORM' (Default: Inline full-page entry form) | 'REGISTER' (Consignments Register)
  const [arrivals, setArrivals] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [farmerExpenses, setFarmerExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const initialFormData = {
    entry_date: new Date().toISOString().split('T')[0],
    manual_lot_no: '',
    truck_no: '',
    driver_name: '',
    driver_mobile: '',
    farmer_name: '',
    farmer_phone: '',
    source_location: '',
    agent_name: '',
    agent_phone: '',
    commodity_id: '',
    variety: '',
    bags: '',
    gross_weight: '',
    arrival_rate: '',
    freight_amount: '',
    advance_paid: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [arrivalsRes, commsRes, varRes, expRes] = await Promise.all([
        api.getArrivals(),
        api.getCommodities(),
        api.getVarieties().catch(() => []),
        api.getExpenses().catch(() => [])
      ]);
      setArrivals(arrivalsRes.arrivals || []);
      setCommodities(commsRes.commodities || []);
      setVarieties(Array.isArray(varRes) ? varRes : []);

      const fExps = (Array.isArray(expRes) ? expRes : [])
        .filter(e => e.target === 'farmer' || e.target === 'both')
        .map(e => ({
          id: e.id,
          name: e.name,
          hindi_name: e.hindi_name,
          type: e.type,
          amount: e.default_amount || 0,
          enabled: true
        }));
      setFarmerExpenses(fExps);

      if (commsRes.commodities?.length > 0 && !formData.commodity_id) {
        setFormData(prev => ({ ...prev, commodity_id: commsRes.commodities[0].id }));
      }
    } catch (err) {
      console.error('Error loading arrivals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseToggle = (idx, checked) => {
    setFarmerExpenses(prev => {
      const updated = [...prev];
      updated[idx].enabled = checked;
      return updated;
    });
  };

  const handleExpenseRateChange = (idx, val) => {
    setFarmerExpenses(prev => {
      const updated = [...prev];
      updated[idx].amount = parseFloat(val) || 0;
      return updated;
    });
  };

  const resetToFresh = () => {
    setFormData({
      ...initialFormData,
      commodity_id: commodities[0]?.id || ''
    });
    setMessage(null);
  };

  const loadSampleDemo = () => {
    const demoTrucks = ['HP-01-A-4567', 'PB-08-BX-9021', 'DL-1L-8822', 'UK-07-TA-3310'];
    const demoDrivers = ['Jagjit Singh', 'Ramesh Kumar', 'Manjeet Sandhu'];
    const demoLocations = ['Kotgarh, Shimla', 'Thanedhar, HP', 'Kinnaur, HP', 'Solan, HP'];
    const randomTruck = demoTrucks[Math.floor(Math.random() * demoTrucks.length)];
    const randomDriver = demoDrivers[Math.floor(Math.random() * demoDrivers.length)];
    const randomLoc = demoLocations[Math.floor(Math.random() * demoLocations.length)];

    setFormData({
      entry_date: new Date().toISOString().split('T')[0],
      manual_lot_no: 'LOT-' + Math.floor(100 + Math.random() * 900),
      truck_no: randomTruck,
      driver_name: randomDriver,
      driver_mobile: '98160' + Math.floor(10000 + Math.random() * 90000),
      farmer_name: 'Devinder Thakur',
      farmer_phone: '9817012345',
      source_location: randomLoc,
      agent_name: 'Suresh Agent',
      agent_phone: '9833344455',
      commodity_id: commodities[0]?.id || '',
      variety: 'Royal Delicious Medium',
      bags: '350',
      gross_weight: '70.5',
      arrival_rate: '1400',
      freight_amount: '28000',
      advance_paid: '15000'
    });
    setMessage({ type: 'success', text: 'Loaded sample consignment data for rapid testing!' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const selectedComm = commodities.find(c => c.id === formData.commodity_id);
      const activeExpenses = farmerExpenses.filter(e => e.enabled);

      const res = await api.createArrival({
        ...formData,
        entryDate: formData.entry_date,
        farmer_phone: formData.farmer_phone,
        agent_name: formData.agent_name,
        agent_phone: formData.agent_phone,
        commodity_name: selectedComm?.name || selectedComm?.name_en || 'Produce',
        bags: parseInt(formData.bags, 10),
        gross_weight: parseFloat(formData.gross_weight) || 0,
        arrival_rate: parseFloat(formData.arrival_rate) || 0,
        freight_amount: parseFloat(formData.freight_amount) || 0,
        advance_paid: parseFloat(formData.advance_paid) || 0,
        manualLotNo: formData.manual_lot_no ? formData.manual_lot_no.trim() : null,
        variety: formData.variety ? formData.variety.trim() : '',
        customExpenses: activeExpenses
      });

      const lotCreated = res.lotId || res.manualLotNo || 'LOT-AUTO';
      setMessage({ 
        type: 'success', 
        text: `Consignment registered successfully! Generated Lot: ${lotCreated}`,
        lotId: lotCreated
      });
      loadData();
      resetToFresh();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to register consignment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredArrivals = arrivals.filter(arr => {
    const matchesSearch = 
      arr.truck_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arr.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arr.lot_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arr.commodity_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'OPEN') return matchesSearch && (arr.remaining_bags > 0);
    if (statusFilter === 'COMPLETED') return matchesSearch && (arr.remaining_bags === 0);
    return matchesSearch;
  });

  const totalBags = arrivals.reduce((sum, a) => sum + (a.bags || 0), 0);
  const remainingBags = arrivals.reduce((sum, a) => sum + (a.remaining_bags || 0), 0);
  const totalFreight = arrivals.reduce((sum, a) => sum + (a.freight_amount || 0), 0);
  const totalArrivalValue = arrivals.reduce((sum, a) => sum + ((a.bags || 0) * (parseFloat(a.arrival_rate) || 0)), 0);

  const totalInwardBagsEntered = parseInt(formData.bags, 10) || 0;
  const currentInwardValue = totalInwardBagsEntered * (parseFloat(formData.arrival_rate) || 0);
  const currentFreightDue = Math.max(0, (parseFloat(formData.freight_amount) || 0) - (parseFloat(formData.advance_paid) || 0));

  return (
    <div className="space-y-6">
      <datalist id="arrival-varieties-list">
        {varieties.map(v => (
          <option key={v.id} value={v.name}>
            {v.commodity_name ? `${v.commodity_name} - ` : ''}{v.name} {v.grade ? `(${v.grade})` : ''}
          </option>
        ))}
      </datalist>

      {/* Top Navigation Tabs: New Entry vs Register */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-1 text-xs font-bold select-none">
        <button
          type="button"
          onClick={() => { setActiveView('FORM'); setMessage(null); }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeView === 'FORM'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Truck className="w-4 h-4 text-emerald-400" />
          <span>{t('1. New Inward Entry Form', '1. नई गाड़ी आवक फॉर्म')}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
            Live Form
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveView('REGISTER'); setMessage(null); }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeView === 'REGISTER'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-blue-400" />
          <span>{t('2. Inward Consignments Register', '2. गाड़ी आवक रजिस्टर')}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold border border-slate-200">
            {arrivals.length} Trucks
          </span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold shadow-xs ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-rose-50 text-rose-900 border border-rose-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span>{message.text}</span>
          </div>
          {message.lotId && activeView === 'FORM' && (
            <button
              type="button"
              onClick={() => setActiveView('REGISTER')}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{t('View in Register', 'रजिस्टर में देखें')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ================= VIEW 1: DIRECT FULL-PAGE INWARD FORM (LIKE QUICK TRADE) ================= */}
      {activeView === 'FORM' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                  🚚
                </span>
                <h1 className="text-xl font-black text-slate-900">
                  {t('Inward Consignment & Truck Arrival Engine', 'गाड़ी आवक एवं यार्ड लॉट प्रविष्टि')}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {t('Direct Form Mode', 'प्रत्यक्ष फॉर्म मोड')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {t(
                  'Record vehicle entry, gate pass, farmer consignor, driver logistics & yard lot creation in a single full-page direct form.',
                  'एकल फॉर्म: गाड़ी आवक, किसान चालान, चालक भाड़ा पेशगी और यार्ड लॉट निर्माण बिना किसी डायलॉग विंडो के।'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={resetToFresh}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                title="Clear all fields for fresh consignment"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                {t('fresh_form', 'नया फॉर्म')}
              </button>

              <button
                type="button"
                onClick={loadSampleDemo}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-200"
                title="Fill sample demo truck data for quick testing"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                {t('sample_data', 'सैंपल डेटा')}
              </button>

              <button
                type="button"
                onClick={() => setActiveView('REGISTER')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <ClipboardList className="w-3.5 h-3.5 text-slate-300" />
                <span>{t('View Register', 'आवक रजिस्टर')} ({arrivals.length})</span>
              </button>
            </div>
          </div>

          {/* Quick Real-Time Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {t('Inward Bags / Crates', 'कुल आवक नग')}
                </span>
                <span className="text-xl font-black text-slate-800 font-mono mt-0.5 block">
                  {totalInwardBagsEntered ? `${totalInwardBagsEntered} Bags` : '0 Bags'}
                </span>
              </div>
              <span className="text-2xl p-2 bg-slate-50 rounded-xl border border-slate-100">📦</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {t('Total Inward Valuation', 'आवक लागत / मूल्य')}
                </span>
                <span className="text-xl font-black text-emerald-700 font-mono mt-0.5 block">
                  ₹{currentInwardValue.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-2xl p-2 bg-emerald-50 rounded-xl border border-emerald-100">💰</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {t('Freight Balance Payable', 'शेष भाड़ा देय')}
                </span>
                <span className="text-xl font-black text-amber-700 font-mono mt-0.5 block">
                  ₹{currentFreightDue.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-2xl p-2 bg-amber-50 rounded-xl border border-amber-100">🚚</span>
            </div>
          </div>

          {/* Direct Full-Page Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Card 1: Consignment Date & Lot Number */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {t('1. Consignment Date & Lot Identifier', '1. आवक दिनांक व लॉट पहचान')}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    {t('Entry Date (आवक दिनांक) *', 'आवक दिनांक *')}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">डिफ़ॉल्ट आज की तारीख (Default Today - पिछली तारीख भी चुन सकते हैं)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t('Lot Number (लॉट नंबर - Manual/Auto)', 'लॉट नंबर (वैकल्पिक / खाली छोड़ें तो स्वतः बनेगा)')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LOT-A101 (or blank for auto)"
                    value={formData.manual_lot_no}
                    onChange={(e) => setFormData({ ...formData, manual_lot_no: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono uppercase font-black text-indigo-900 bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">खाली छोड़ें तो सिस्टम स्वतः LOT-xxxx बना देगा</span>
                </div>
              </div>
            </div>

            {/* Card 2: Vehicle & Transport Logistics */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Truck className="w-4 h-4 text-emerald-700" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {t('2. Vehicle & Driver Transport Details', '2. वाहन व चालक परिवहन विवरण')}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('Truck Number *', 'गाड़ी नंबर *')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-01-AB-1234"
                    value={formData.truck_no}
                    onChange={(e) => setFormData({ ...formData, truck_no: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs uppercase font-mono font-bold focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('Driver Name', 'चालक का नाम')}</label>
                  <input
                    type="text"
                    placeholder="चालक का नाम"
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('Driver Mobile', 'चालक मोबाइल')}</label>
                  <input
                    type="text"
                    placeholder="10-digit mobile"
                    value={formData.driver_mobile}
                    onChange={(e) => setFormData({ ...formData, driver_mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('Total Freight (₹)', 'कुल गाड़ी भाड़ा (₹)')}</label>
                  <input
                    type="number"
                    placeholder="₹ 0"
                    value={formData.freight_amount}
                    onChange={(e) => setFormData({ ...formData, freight_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-600 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('Freight Advance (₹)', 'चालक पेशगी भाड़ा (₹)')}</label>
                  <input
                    type="number"
                    placeholder="₹ 0"
                    value={formData.advance_paid}
                    onChange={(e) => setFormData({ ...formData, advance_paid: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-600 outline-none bg-white text-amber-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">{t('Balance Freight Due (₹)', 'शेष भाड़ा देय (₹)')}</label>
                  <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-rose-700">
                    ₹{currentFreightDue.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Farmer & Agent Details */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {t('3. Farmer & Commission Agent Logistics', '3. किसान एवं कमीशन एजेंट विवरण')}
                </h2>
              </div>

              {/* Farmer Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <PartySearchSelect
                    partyType="Farmer"
                    label={t('Farmer / Producer *', 'किसान / उत्पादक *')}
                    required
                    value={formData.farmer_name}
                    placeholder="किसान खोजें या नया जोड़ें..."
                    onChange={(name, party) => {
                      setFormData(prev => ({
                        ...prev,
                        farmer_name: name,
                        farmer_phone: party?.mobile || prev.farmer_phone,
                        source_location: party?.city || prev.source_location
                      }));
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('Farmer Phone', 'किसान मोबाइल')}</label>
                  <input
                    type="text"
                    placeholder="e.g. 98160..."
                    value={formData.farmer_phone}
                    onChange={(e) => setFormData({ ...formData, farmer_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('Source Mandi / Location', 'उत्पत्ति मंडी / क्षेत्र')}</label>
                  <input
                    type="text"
                    placeholder="उदा. Shimla / Nashik"
                    value={formData.source_location}
                    onChange={(e) => setFormData({ ...formData, source_location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              {/* Agent Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <PartySearchSelect
                    partyType="Agent"
                    label={t('Agent / Broker (दलाल / एजेंट - यदि हो)', 'दलाल / एजेंट (वैकल्पिक)')}
                    value={formData.agent_name}
                    placeholder="एजेंट खोजें या नया जोड़ें..."
                    onChange={(name, party) => {
                      setFormData(prev => ({
                        ...prev,
                        agent_name: name,
                        agent_phone: party?.mobile || prev.agent_phone
                      }));
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('Agent Mobile', 'दलाल / एजेंट मोबाइल')}</label>
                  <input
                    type="text"
                    placeholder="e.g. 98765..."
                    value={formData.agent_phone}
                    onChange={(e) => setFormData({ ...formData, agent_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Card 4: Commodity, Variety & Quantity */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Package className="w-4 h-4 text-emerald-700" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {t('4. Commodity, Quality Grade & Quantity', '4. फसल, किस्म ग्रेड व मात्रा')}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">{t('Commodity *', 'फसल / जिंस *')}</label>
                  <select
                    value={formData.commodity_id}
                    onChange={(e) => setFormData({ ...formData, commodity_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none bg-white"
                  >
                    {commodities.map((c) => (
                      <option key={c.id} value={c.id}>{isHindi ? (c.hindi_name || c.name) : c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('Variety / Grade (किस्म व ग्रेड)', 'किस्म व ग्रेड')}
                  </label>
                  <input
                    type="text"
                    list="arrival-varieties-list"
                    placeholder="किस्म चुनें या लिखें (e.g. Royal Medium)"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('Total Bags / Crates *', 'कुल नग / बोरी *')}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 500"
                    value={formData.bags}
                    onChange={(e) => setFormData({ ...formData, bags: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('Gross Weight (Qntl)', 'कुल वजन (क्विंटल)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 100.5"
                    value={formData.gross_weight}
                    onChange={(e) => setFormData({ ...formData, gross_weight: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              {/* Kisan Awak Rate / Purchase Rate */}
              <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    {t('Kisan Arrival Rate (किसान आवक भाव / खरीद दर ₹)', 'किसान आवक भाव / खरीद दर (₹/नग)')}
                  </label>
                  <span className="text-xs text-emerald-700 font-medium">
                    {Number(formData.arrival_rate) > 0 ? 'पक्की आढ़त / व्यापारी खरीद' : 'खाली छोड़ें = कच्ची आढ़त (Commission Consignment)'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0 (Awak Rate per Bag/Nag)"
                      value={formData.arrival_rate}
                      onChange={(e) => setFormData({ ...formData, arrival_rate: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 border border-emerald-300 rounded-xl text-sm font-mono font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    />
                  </div>
                  <div className="text-xs bg-white px-3.5 py-2.5 rounded-xl border border-emerald-100 flex items-center justify-between font-mono">
                    <span className="text-slate-500">कुल आवक लागत (Total Inward):</span>
                    <span className="font-black text-emerald-800 text-base">
                      ₹{currentInwardValue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Mandi Farmer Expenses & Deductions Checklist */}
            {farmerExpenses.length > 0 && (
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-700" />
                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      {t('5. Farmer Expenses & Mandi Deductions', '5. किसान खर्चे व मंडी कटौतियां')}
                    </h2>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {t('Settings से लोड (जरूरत अनुसार राशि बदल सकते हैं)', 'Settings से लोड (एडिट करें)')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {farmerExpenses.map((exp, idx) => (
                    <div key={exp.id || idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                        <input
                          type="checkbox"
                          checked={exp.enabled}
                          onChange={(e) => handleExpenseToggle(idx, e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
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
                          onChange={(e) => handleExpenseRateChange(idx, e.target.value)}
                          className="w-16 px-1.5 py-0.5 border border-slate-300 rounded-lg font-mono text-right text-xs bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Form Actions Bar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {t(
                  'Submitting will record vehicle arrival, create a tradeable Yard Lot, and log an audit trail.',
                  'आवक दर्ज होते ही स्वतः यार्ड लॉट आईडी बन जाएगी, स्टॉक में जुड़ जाएगा और ऑडिट लॉग हो जाएगा।'
                )}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={resetToFresh}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  {t('Reset Form', 'फॉर्म खाली करें')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  {submitting ? 'Registering Consignment...' : t('Confirm & Register Inward Arrival (F3)', 'गाड़ी आवक दर्ज करें व लॉट बनाएं')}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ================= VIEW 2: INWARD REGISTER & CONSIGNMENT HISTORY ================= */}
      {activeView === 'REGISTER' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Truck className="w-7 h-7 text-indigo-600" />
                {t('Inward Consignments Register', 'गाड़ी आवक रजिस्टर')}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {t('Track inward fruit & vegetable trucks, farmer consignments, driver freight & generated lots.', 'गाड़ी आवक, किसान चालान, चालक भाड़ा पेशगी और जनरेटेड यार्ड लॉट्स का प्रबंधन।')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setActiveView('FORM'); setMessage(null); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" />
                {t('New Truck Arrival Form', 'नई गाड़ी आवक फॉर्म')}
              </button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Consignments</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-gray-900">{arrivals.length} Trucks</span>
                <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">All-Time</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live / Unsold Bags</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-600">{remainingBags.toLocaleString()} <span className="text-sm font-normal text-gray-500">/ {totalBags.toLocaleString()}</span></span>
                <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">On Yard</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Inward Value</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-700 font-mono">₹{totalArrivalValue.toLocaleString()}</span>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Arrival Cost</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Freight Recorded</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-800">₹{totalFreight.toLocaleString()}</span>
                <span className="text-xs text-slate-700 font-semibold bg-slate-50 px-2 py-0.5 rounded">Paid/Due</span>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search truck number, farmer name, lot number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <Filter className="w-4 h-4" /> Filter:
              </div>
              {['ALL', 'OPEN', 'COMPLETED'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : filter === 'OPEN' ? 'Active Lots' : 'Completed'}
                </button>
              ))}
            </div>
          </div>

          {/* Consignments Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-4">Lot &amp; Date</th>
                    <th className="py-3.5 px-4">Truck &amp; Driver</th>
                    <th className="py-3.5 px-4">Farmer &amp; Origin</th>
                    <th className="py-3.5 px-4">Commodity</th>
                    <th className="py-3.5 px-4 text-center">Bags / Crates</th>
                    <th className="py-3.5 px-4 text-right">Arrival Rate (₹)</th>
                    <th className="py-3.5 px-4">Freight (₹)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="text-center py-10 text-gray-400">Loading consignments...</td>
                    </tr>
                  ) : filteredArrivals.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-10 text-gray-400">
                        No inward consignments found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredArrivals.map((arr) => {
                      const balanceFreight = (arr.freight_amount || 0) - (arr.advance_paid || 0);
                      const isSoldOut = arr.remaining_bags === 0;

                      return (
                        <tr key={arr.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-gray-900">
                            <div className="flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{arr.manual_lot_no || arr.lot_number}</span>
                            </div>
                            <span className="text-[11px] font-normal text-gray-400 block mt-0.5">
                              {new Date(arr.arrival_date).toLocaleDateString('en-IN')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-800 uppercase font-mono">{arr.truck_no}</span>
                            {arr.driver_name && (
                              <span className="text-xs text-gray-500 block">
                                {arr.driver_name} {arr.driver_mobile ? `(${arr.driver_mobile})` : ''}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-gray-900">{arr.farmer_name}</span>
                            {arr.source_location && (
                              <span className="text-xs text-gray-400 block">{arr.source_location}</span>
                            )}
                            {arr.agent_name && (
                              <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-bold block w-fit mt-0.5">
                                Agent: {arr.agent_name}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900">{arr.commodity_name}</span>
                            {arr.variety && (
                              <span className="text-xs text-gray-500 block">{arr.variety}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-gray-900">{arr.remaining_bags}</span>
                            <span className="text-xs text-gray-400 block">/ {arr.bags} total</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold">
                            {Number(arr.arrival_rate) > 0 ? (
                              <div>
                                <span className="text-emerald-700 font-bold">₹{arr.arrival_rate}/nag</span>
                                <span className="text-[10px] text-gray-400 block font-normal">
                                  Tot: ₹{(Number(arr.total_arrival_amount) || (Number(arr.arrival_rate) * Number(arr.bags))).toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic font-sans">कच्ची आढ़त</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">
                            <div className="font-semibold text-gray-800">Tot: ₹{arr.freight_amount || 0}</div>
                            {balanceFreight > 0 ? (
                              <span className="text-rose-600 font-bold block">Due: ₹{balanceFreight}</span>
                            ) : (
                              <span className="text-emerald-600 font-bold block">Paid Full</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isSoldOut 
                                ? 'bg-gray-100 text-gray-700' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {isSoldOut ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {isSoldOut ? 'Sold Out' : 'Active Yard'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedArrival(arr)}
                              className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                              title="Print Gate Inward Pass"
                            >
                              <Printer className="w-4 h-4" />
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
        </div>
      )}

      {/* Print Gate Pass Modal */}
      {selectedArrival && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-6 space-y-4 print:p-0" id="gate-pass-print">
              <div className="text-center border-b pb-4">
                <div className="text-xl font-black text-gray-900 tracking-wide uppercase">APMC GATE INWARD SLIP</div>
                <div className="text-xs text-gray-500">Mandi Yard Consignment Clearance &amp; Bilti Voucher</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="font-bold text-gray-500">Lot No:</span> <span className="font-mono font-black">{selectedArrival.lot_number}</span></div>
                <div><span className="font-bold text-gray-500">Date:</span> {new Date(selectedArrival.arrival_date).toLocaleString('en-IN')}</div>
                <div><span className="font-bold text-gray-500">Truck No:</span> <span className="font-bold">{selectedArrival.truck_no}</span></div>
                <div><span className="font-bold text-gray-500">Driver:</span> {selectedArrival.driver_name || 'N/A'}</div>
                <div><span className="font-bold text-gray-500">Farmer:</span> <span className="font-bold">{selectedArrival.farmer_name}</span></div>
                <div><span className="font-bold text-gray-500">Origin:</span> {selectedArrival.source_location || 'N/A'}</div>
                <div><span className="font-bold text-gray-500">Produce:</span> {selectedArrival.commodity_name}</div>
                <div><span className="font-bold text-gray-500">Inward Bags:</span> <span className="font-bold">{selectedArrival.bags}</span></div>
                <div><span className="font-bold text-gray-500">Arrival Rate:</span> <span className="font-bold text-emerald-700">{Number(selectedArrival.arrival_rate) > 0 ? `₹${selectedArrival.arrival_rate}/Nag` : 'कच्ची आढ़त (Consignment)'}</span></div>
                <div><span className="font-bold text-gray-500">Inward Value:</span> <span className="font-bold text-emerald-700">{Number(selectedArrival.arrival_rate) > 0 ? `₹${(Number(selectedArrival.total_arrival_amount) || (Number(selectedArrival.arrival_rate) * Number(selectedArrival.bags))).toLocaleString()}` : 'N/A'}</span></div>
                <div><span className="font-bold text-gray-500">Freight Total:</span> ₹{selectedArrival.freight_amount}</div>
                <div><span className="font-bold text-gray-500">Advance Paid:</span> ₹{selectedArrival.advance_paid}</div>
              </div>
              <div className="border-t pt-3 flex justify-between text-xs font-semibold text-gray-500">
                <div>Driver Signature: ____________</div>
                <div>Munshi / Arhatiya: ____________</div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
              >
                <Printer className="w-4 h-4" /> Print Gate Slip
              </button>
              <button
                onClick={() => setSelectedArrival(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
