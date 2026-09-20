import React, { useState, useEffect } from 'react';
import { API } from '../api';
import { useTenant } from '../context/TenantContext';
import { Zap, Plus, Trash2, CheckCircle2, Truck, User } from 'lucide-react';

export default function QuickTrade() {
  const { activeTenant } = useTenant();
  const [truckNo, setTruckNo] = useState('HP-10-B-9812');
  const [farmerName, setFarmerName] = useState('Harish Negi');
  const [farmerPhone, setFarmerPhone] = useState('+91 98160 44321');
  const [commodity, setCommodity] = useState('Apple - Royal Delicious');
  const [totalFreight, setTotalFreight] = useState(36000);
  const [freightAdvance, setFreightAdvance] = useState(15000);

  const [lots, setLots] = useState([
    { id: 'LOT-1', label: 'Lot 1 (Grade A / Mark-1)', mark: 'Mark HN-1', variety: 'Medium Size 24mm', qty: 150 },
    { id: 'LOT-2', label: 'Lot 2 (Grade B / Mark-2)', mark: 'Mark HN-2', variety: 'Small Size 20mm', qty: 150 }
  ]);

  const [buyerRows, setBuyerRows] = useState([
    { id: 1, targetLot: 'LOT-1', buyerName: 'Aggarwal Wholesale Mart', buyerContact: '+91 98110 55432', qty: 150, rate: 2150 },
    { id: 2, targetLot: 'LOT-2', buyerName: 'Rajdhani Hotel Supplies', buyerContact: '+91 99100 88776', qty: 150, rate: 1950 }
  ]);

  const [commoditiesList, setCommoditiesList] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.getCommodities().then(data => setCommoditiesList(data)).catch(() => {});
  }, [activeTenant]);

  const totalArrived = lots.reduce((acc, l) => acc + (parseInt(l.qty) || 0), 0);
  const totalAllocated = buyerRows.reduce((acc, r) => acc + (parseInt(r.qty) || 0), 0);
  const totalGrossValue = buyerRows.reduce((acc, r) => acc + ((parseInt(r.qty) || 0) * (parseFloat(r.rate) || 0)), 0);

  const handleAddLot = () => {
    const nextNum = lots.length + 1;
    setLots([...lots, { id: `LOT-${nextNum}`, label: `Lot ${nextNum}`, mark: `Mark HN-${nextNum}`, variety: 'Grade A', qty: 100 }]);
  };

  const handleRemoveLot = (id) => {
    if (lots.length <= 1) return;
    setLots(lots.filter(l => l.id !== id));
  };

  const handleAddBuyerRow = () => {
    setBuyerRows([...buyerRows, {
      id: Date.now(),
      targetLot: lots[0]?.id || 'LOT-1',
      buyerName: 'Spot Wholesale Buyer',
      buyerContact: '+91 98110 55432',
      qty: Math.max(0, totalArrived - totalAllocated),
      rate: 2000
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
        commodity,
        totalFreight,
        freightAdvance,
        lots,
        splitSales: buyerRows
      });
      setMessage(`⚡ Consignment ${res.consignmentId} sealed & Teep generated for ${res.totalArrived} units!`);
    } catch (err) {
      setError(err.message || 'Trade submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              ⚡
            </span>
            <h1 className="text-xl font-black text-slate-900">Unified Trade & Single Form Engine</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            एकल आवक-बिक्री प्रपत्र: Inward truck arrival, multi-lot split sales, palledari, and instant Teep generation in a single atomic form.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Gross Realized Value</span>
            <span className="text-base font-black text-emerald-800">₹{totalGrossValue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-900 font-bold text-xs">
          ⚠️ {error}
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
            <span className="text-xs text-slate-400">Step 1 of 3</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Truck / Vehicle No. *</label>
              <input
                type="text"
                required
                value={truckNo}
                onChange={(e) => setTruckNo(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold uppercase"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Farmer / Producer Name *</label>
              <input
                type="text"
                required
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Farmer Phone</label>
              <input
                type="text"
                value={farmerPhone}
                onChange={(e) => setFarmerPhone(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Commodity (फसल) *</label>
              <select
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
              >
                {commoditiesList.map(c => (
                  <option key={c.id} value={c.name_en}>{c.name_en} ({c.name_hi || c.category})</option>
                ))}
                {commoditiesList.length === 0 && (
                  <option value="Apple - Royal Delicious">Apple - Royal Delicious</option>
                )}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Total Truck Freight (भाड़ा) ₹</label>
              <input
                type="number"
                value={totalFreight}
                onChange={(e) => setTotalFreight(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Freight Advance Paid to Driver ₹</label>
              <input
                type="number"
                value={freightAdvance}
                onChange={(e) => setFreightAdvance(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-amber-800"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Consignment Lots */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">2. Multi-Lot Marks & Grading</h2>
              <span className="text-xs text-slate-500">Total Arrived Units: <strong>{totalArrived} Boxes</strong></span>
            </div>
            <button
              type="button"
              onClick={handleAddLot}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
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
                    <button type="button" onClick={() => handleRemoveLot(lot.id)} className="text-rose-600 hover:text-rose-800">
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
                      onChange={(e) => {
                        const updated = [...lots];
                        updated[idx].mark = e.target.value;
                        setLots(updated);
                      }}
                      className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Variety / Grade</label>
                    <input
                      type="text"
                      value={lot.variety}
                      onChange={(e) => {
                        const updated = [...lots];
                        updated[idx].variety = e.target.value;
                        setLots(updated);
                      }}
                      className="w-full p-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Box Quantity</label>
                    <input
                      type="number"
                      value={lot.qty}
                      onChange={(e) => {
                        const updated = [...lots];
                        updated[idx].qty = parseInt(e.target.value) || 0;
                        setLots(updated);
                      }}
                      className="w-full p-2 border border-slate-300 rounded-xl font-bold font-mono text-slate-900"
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
                <span className={`font-bold ${totalAllocated === totalArrived ? 'text-emerald-700' : 'text-amber-700'}`}>
                  Allocated: {totalAllocated} / {totalArrived} Units
                </span>
                {totalAllocated === totalArrived && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    ✓ 100% Balanced
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddBuyerRow}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
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
                  <th className="p-2">Buyer Name</th>
                  <th className="p-2">Contact</th>
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
                        className="p-1.5 border border-slate-300 rounded-lg font-mono font-bold bg-white"
                      >
                        {lots.map(l => (
                          <option key={l.id} value={l.id}>{l.id}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.buyerName}
                        onChange={(e) => {
                          const updated = [...buyerRows];
                          updated[idx].buyerName = e.target.value;
                          setBuyerRows(updated);
                        }}
                        className="w-full p-1.5 border border-slate-300 rounded-lg font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.buyerContact}
                        onChange={(e) => {
                          const updated = [...buyerRows];
                          updated[idx].buyerContact = e.target.value;
                          setBuyerRows(updated);
                        }}
                        className="w-full p-1.5 border border-slate-300 rounded-lg font-mono text-[11px]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.qty}
                        onChange={(e) => {
                          const updated = [...buyerRows];
                          updated[idx].qty = parseInt(e.target.value) || 0;
                          setBuyerRows(updated);
                        }}
                        className="w-20 p-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.rate}
                        onChange={(e) => {
                          const updated = [...buyerRows];
                          updated[idx].rate = parseFloat(e.target.value) || 0;
                          setBuyerRows(updated);
                        }}
                        className="w-20 p-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </td>
                    <td className="p-2 text-right font-bold text-slate-900">
                      ₹{((row.qty || 0) * (row.rate || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="p-2 text-center">
                      {buyerRows.length > 1 && (
                        <button type="button" onClick={() => handleRemoveBuyerRow(row.id)} className="text-rose-500 hover:text-rose-700">
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
          disabled={loading}
          className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {loading ? 'Processing Atomic Trade...' : '⚡ Seal Consignment & Generate Teep Voucher →'}
        </button>

      </form>
    </div>
  );
}
