import React, { useState, useEffect } from 'react';
import { API } from '../api';
import { useTenant } from '../context/TenantContext';
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

  // Fresh initial states - completely clean for new users
  const [truckNo, setTruckNo] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [commodity, setCommodity] = useState('');
  const [totalFreight, setTotalFreight] = useState('');
  const [freightAdvance, setFreightAdvance] = useState('');

  const [lots, setLots] = useState([
    { id: 'LOT-1', label: 'Lot 1 (Mark-1)', mark: '', variety: '', qty: '' }
  ]);

  const [buyerRows, setBuyerRows] = useState([
    { id: 1, targetLot: 'LOT-1', buyerName: '', buyerContact: '', qty: '', rate: '' }
  ]);

  const [commoditiesList, setCommoditiesList] = useState([]);
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

  const resetToFresh = () => {
    setTruckNo('');
    setFarmerName('');
    setFarmerPhone('');
    setTotalFreight('');
    setFreightAdvance('');
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
    if (totalAllocated > totalArrived) {
      setError(`Allocated units (${totalAllocated}) cannot exceed arrived units (${totalArrived}).`);
      return;
    }

    setLoading(true);
    try {
      const res = await API.quickTrade({
        truckNo,
        farmerName,
        farmerPhone,
        commodity: commodity || (commoditiesList[0]?.name_en || 'Standard Produce'),
        totalFreight: parseFloat(totalFreight) || 0,
        freightAdvance: parseFloat(freightAdvance) || 0,
        lots: lots.map(l => ({ ...l, qty: parseInt(l.qty, 10) || 0 })),
        splitSales: buyerRows.map(r => ({ ...r, qty: parseInt(r.qty, 10) || 0, rate: parseFloat(r.rate) || 0 }))
      });
      
      setMessage(`⚡ Consignment ${res.consignmentId || 'TC-' + Date.now().toString().slice(-4)} sealed & Teep generated for ${res.totalArrived || totalArrived} units! Ready for next trade.`);
      
      // Auto-reset form for fresh next trade
      setTruckNo('');
      setFarmerName('');
      setFarmerPhone('');
      setTotalFreight('');
      setFreightAdvance('');
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

      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              ⚡
            </span>
            <h1 className="text-xl font-black text-slate-900">Unified Trade & Single Form Engine</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              Fresh Trade Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            एकल आवक-बिक्री प्रपत्र: Inward truck arrival, multi-lot split sales, palledari, and instant Teep generation in a single atomic form.
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
            Fresh Form (साफ़ करें)
          </button>

          <button
            type="button"
            onClick={loadSampleDemo}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-200"
            title="Fill sample demo data for quick testing"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Sample Data (डेमो भरें)
          </button>

          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Gross Realized Value</span>
            <span className="text-base font-black text-emerald-800">₹{totalGrossValue.toLocaleString('en-IN')}</span>
          </div>
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
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">1. Inward Truck & Farmer Details</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {farmers.length > 0 && (
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {farmers.length} Registered Farmers
                </span>
              )}
              <span>Step 1 of 3</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Truck / Vehicle No. *</label>
              <input
                type="text"
                required
                value={truckNo}
                onChange={(e) => setTruckNo(e.target.value)}
                placeholder="e.g. DL-01-AB-1234 / HP-10-B-9812"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold uppercase placeholder:font-normal placeholder:normal-case placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Farmer / Producer Name *</label>
              <input
                type="text"
                required
                list="farmers-datalist"
                value={farmerName}
                onChange={(e) => handleFarmerChange(e.target.value)}
                placeholder="Type or select Kisan Name..."
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Farmer Phone</label>
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
              <label className="font-bold text-slate-700 block mb-1">Commodity (फसल) *</label>
              <select
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              >
                {commoditiesList.map(c => (
                  <option key={c.id} value={c.name_en || c.name}>
                    {c.name_en || c.name} ({c.name_hi || c.category || 'Mandi'})
                  </option>
                ))}
                {commoditiesList.length === 0 && (
                  <option value="Apple - Royal Delicious">Apple - Royal Delicious (सेब)</option>
                )}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Total Truck Freight (भाड़ा) ₹</label>
              <input
                type="number"
                value={totalFreight}
                onChange={(e) => setTotalFreight(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Freight Advance Paid to Driver ₹</label>
              <input
                type="number"
                value={freightAdvance}
                onChange={(e) => setFreightAdvance(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-amber-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Consignment Lots */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">2. Multi-Lot Marks & Grading</h2>
              <span className="text-xs text-slate-500">Total Arrived Units: <strong className="text-slate-900">{totalArrived} Boxes / Bags</strong></span>
            </div>
            <button
              type="button"
              onClick={handleAddLot}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              + Add Sub-Lot
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
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Farmer Mark</label>
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
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Variety / Grade</label>
                    <input
                      type="text"
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
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Quantity (Units) *</label>
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
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">3. Buyer Split Sales (खरीदार आवंटन)</h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs">
                <span className={`font-bold ${totalAllocated === totalArrived && totalArrived > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  Allocated: {totalAllocated} / {totalArrived} Units
                </span>
                {totalAllocated === totalArrived && totalArrived > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    ✓ 100% Balanced
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
              + Add Buyer Split
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-2">Target Lot</th>
                  <th className="p-2">Buyer Name (Select / Type)</th>
                  <th className="p-2">Buyer Phone</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Rate (₹)</th>
                  <th className="p-2 text-right">Gross Amount</th>
                  <th className="p-2 text-center">Action</th>
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
                        placeholder="Type or select Vyapari..."
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
          {loading ? 'Processing Atomic Trade...' : '⚡ Seal Consignment & Generate Teep Voucher →'}
        </button>

      </form>
    </div>
  );
}
