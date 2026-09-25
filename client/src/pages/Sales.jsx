import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { Gavel, Plus, Search, Filter, ShoppingBag, User, CheckCircle, Clock, FileText, ArrowRight, X, AlertCircle } from 'lucide-react';

export default function Sales() {
  const { language, t } = useLanguage();
  const [lots, setLots] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, ACTIVE, SOLD
  const [selectedLotForSale, setSelectedLotForSale] = useState(null);
  const [selectedSplitForPurcha, setSelectedSplitForPurcha] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const [saleForm, setSaleForm] = useState({
    buyer_party_id: '',
    buyer_name: '',
    bags_sold: '',
    sale_rate: '',
    rate_unit: 'quintal',
    brokerage_rate: '2.0',
    payment_terms: '15_days'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lotsRes, partiesRes] = await Promise.all([
        api.getSalesLots(),
        api.getParties()
      ]);
      setLots(lotsRes.lots || []);
      setParties(partiesRes.parties || []);
    } catch (err) {
      console.error('Failed to load sales lots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSaleModal = (lot) => {
    setSelectedLotForSale(lot);
    setSaleForm({
      buyer_party_id: parties.find(p => p.party_type === 'buyer')?.id || '',
      buyer_name: parties.find(p => p.party_type === 'buyer')?.name || '',
      bags_sold: lot.remaining_bags.toString(),
      sale_rate: '',
      rate_unit: lot.unit || 'quintal',
      brokerage_rate: '2.0',
      payment_terms: '15_days'
    });
    setMessage(null);
  };

  const handleBuyerSelect = (e) => {
    const pId = e.target.value;
    const party = parties.find(p => p.id === parseInt(pId, 10));
    setSaleForm(prev => ({
      ...prev,
      buyer_party_id: pId,
      buyer_name: party ? party.name : ''
    }));
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLotForSale) return;

    const bagsToSell = parseInt(saleForm.bags_sold, 10);
    if (bagsToSell > selectedLotForSale.remaining_bags) {
      setMessage({ type: 'error', text: `Cannot sell ${bagsToSell} bags. Only ${selectedLotForSale.remaining_bags} bags remaining.` });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await api.splitSaleLot(selectedLotForSale.id, {
        buyer_party_id: saleForm.buyer_party_id ? parseInt(saleForm.buyer_party_id, 10) : null,
        buyer_name: saleForm.buyer_name,
        bags_sold: bagsToSell,
        sale_rate: parseFloat(saleForm.sale_rate),
        rate_unit: saleForm.rate_unit,
        brokerage_rate: parseFloat(saleForm.brokerage_rate) || 0,
        payment_terms: saleForm.payment_terms
      });
      setMessage({ type: 'success', text: `Successfully auctioned & recorded ${bagsToSell} bags to ${saleForm.buyer_name}!` });
      setSelectedLotForSale(null);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Sale execution failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLots = lots.filter(lot => {
    const matchesSearch = 
      lot.lot_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.commodity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.truck_no?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'ACTIVE') return matchesSearch && lot.remaining_bags > 0;
    if (filterStatus === 'SOLD') return matchesSearch && lot.remaining_bags === 0;
    return matchesSearch;
  });

  const activeLotsCount = lots.filter(l => l.remaining_bags > 0).length;
  const totalBagsAvailable = lots.reduce((sum, l) => sum + (l.remaining_bags || 0), 0);

  // Live calculation for the modal
  const calcGross = (parseFloat(saleForm.bags_sold) || 0) * (parseFloat(saleForm.sale_rate) || 0);
  const calcBrokerage = (calcGross * (parseFloat(saleForm.brokerage_rate) || 0)) / 100;
  const calcTotalReceivable = calcGross + calcBrokerage;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Gavel className="w-7 h-7 text-indigo-600" />
            {t('Auction & Sales Lots', 'बोली एवं बिक्री रजिस्टर')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('Conduct live mandi auctions, split lots among multiple buyers, and issue buyer purcha slips.', 'लाइव मंडी नीलामी, कई खरीदारों में लॉट विभाजन, और खरीदार पर्चा जारी करें।')}
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Auction Lots</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-600">{activeLotsCount} Lots</span>
            <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded">Ready to Auction</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Produce on Yard</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">{totalBagsAvailable.toLocaleString()} Bags/Boxes</span>
            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">Available</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Buyers Network</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-gray-900">{parties.filter(p => p.party_type === 'buyer').length} Registered</span>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Mandi Verified</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search lot number, farmer, commodity, truck..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'ACTIVE', 'SOLD'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'ALL' ? 'All Lots' : status === 'ACTIVE' ? 'Active Lots (Live)' : 'Fully Sold'}
            </button>
          ))}
        </div>
      </div>

      {/* Lots Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Loading auction lots...</div>
        ) : filteredLots.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            No lots found matching your criteria.
          </div>
        ) : (
          filteredLots.map((lot) => {
            const isSoldOut = lot.remaining_bags === 0;
            const percentSold = Math.round(((lot.total_bags - lot.remaining_bags) / lot.total_bags) * 100);

            return (
              <div
                key={lot.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                  isSoldOut
                    ? 'border-gray-200 opacity-80'
                    : 'border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-300 ring-1 ring-indigo-50/50'
                }`}
              >
                <div>
                  {/* Top Badge Row */}
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
                    <div>
                      <span className="font-mono text-sm font-black text-gray-900">{lot.lot_number}</span>
                      <span className="text-xs text-gray-400 ml-2">Truck: {lot.truck_no}</span>
                    </div>
                    {isSoldOut ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3 h-3" /> Sold
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                        <Clock className="w-3 h-3" /> Open Yard
                      </span>
                    )}
                  </div>

                  {/* Lot Details */}
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{lot.commodity_name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        Farmer: <span className="font-semibold text-gray-700">{lot.farmer_name}</span> ({lot.source_location || 'Local'})
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-baseline justify-between text-xs mb-1.5">
                        <span className="text-gray-500 font-medium">Bags Inward: <b className="text-gray-800">{lot.total_bags}</b></span>
                        <span className="font-bold text-indigo-600">
                          {lot.remaining_bags} <span className="text-gray-400 font-normal">left ({100 - percentSold}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isSoldOut ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${percentSold}%` }}
                        />
                      </div>
                    </div>

                    {/* Splits History */}
                    {lot.splits && lot.splits.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 space-y-2">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Splits Recorded ({lot.splits.length})</div>
                        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                          {lot.splits.map((s, idx) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedSplitForPurcha({ ...s, lot })}
                              className="p-1.5 bg-gray-50 hover:bg-indigo-50 border border-gray-200/60 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors"
                              title="Click to view/print Purcha"
                            >
                              <div className="truncate pr-2">
                                <span className="font-bold text-gray-900">{s.buyer_name}</span>
                                <span className="text-gray-500 ml-1">({s.bags_sold} bags @ ₹{s.sale_rate})</span>
                              </div>
                              <FileText className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  {!isSoldOut ? (
                    <button
                      onClick={() => handleOpenSaleModal(lot)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Gavel className="w-4 h-4" />
                      {t('Auction / Hammer Lot', 'बोली लगाएं')}
                    </button>
                  ) : (
                    <div className="text-center text-xs font-semibold text-gray-400 py-1 flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Lot Fully Sold Out
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Hammer / Split Sale Modal */}
      {selectedLotForSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-indigo-700" />
                <div>
                  <h2 className="text-base font-bold text-indigo-950">{t('Record Split Auction', 'बोली विक्रय दर्ज करें')}</h2>
                  <div className="text-xs text-indigo-700">Lot #{selectedLotForSale.lot_number} • {selectedLotForSale.commodity_name}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLotForSale(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaleSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-center justify-between">
                <span>Total Available in Lot:</span>
                <span className="font-bold text-amber-950 text-sm">{selectedLotForSale.remaining_bags} Bags/Boxes</span>
              </div>

              {/* Buyer Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Select Registered Buyer *</label>
                <select
                  value={saleForm.buyer_party_id}
                  onChange={handleBuyerSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Choose Buyer Party --</option>
                  {parties.filter(p => p.party_type === 'buyer').map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.phone || b.city || 'Mandi Buyer'})</option>
                  ))}
                </select>
              </div>

              {/* Or Manual Buyer Name */}
              {!saleForm.buyer_party_id && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Or Enter Cash Buyer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Trading Co."
                    value={saleForm.buyer_name}
                    onChange={(e) => setSaleForm({ ...saleForm, buyer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {/* Bags & Rate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Bags / Crates to Sell *</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedLotForSale.remaining_bags}
                    required
                    value={saleForm.bags_sold}
                    onChange={(e) => setSaleForm({ ...saleForm, bags_sold: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{t('Hammer Rate (₹) *', 'नीलामी भाव (₹) *')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="₹ Rate"
                    value={saleForm.sale_rate}
                    onChange={(e) => setSaleForm({ ...saleForm, sale_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Brokerage & Terms */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Brokerage / Dami %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={saleForm.brokerage_rate}
                    onChange={(e) => setSaleForm({ ...saleForm, brokerage_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Payment Term</label>
                  <select
                    value={saleForm.payment_terms}
                    onChange={(e) => setSaleForm({ ...saleForm, payment_terms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  >
                    <option value="immediate">Immediate Cash</option>
                    <option value="7_days">7 Days Credit</option>
                    <option value="15_days">15 Days Standard</option>
                    <option value="30_days">30 Days Credit</option>
                  </select>
                </div>
              </div>

              {/* Live Calculation Preview */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1.5">
                <div className="flex justify-between text-gray-600">
                  <span>Gross Produce Value:</span>
                  <span className="font-mono font-bold">₹{calcGross.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Brokerage / Dami ({saleForm.brokerage_rate}%):</span>
                  <span className="font-mono font-bold">₹{calcBrokerage.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-indigo-950 font-bold text-sm pt-1 border-t border-gray-200">
                  <span>Net Buyer Bill (Receivable):</span>
                  <span className="font-mono text-indigo-600 font-black">₹{calcTotalReceivable.toFixed(2)}</span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLotForSale(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Executing Auction...' : 'Confirm Hammer & Create Purcha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Buyer Purcha Slip Preview Modal */}
      {selectedSplitForPurcha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-6 space-y-4 print:p-0">
              <div className="text-center border-b pb-3">
                <div className="text-xl font-black text-gray-900 uppercase">{t('MANDI BUYER PURCHA', 'मंडी खरीदार कच्चा पर्चा')}</div>
                <div className="text-xs text-gray-500">APMC Authorized Trading Voucher</div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Lot Number:</span> <span className="font-mono font-bold">{selectedSplitForPurcha.lot?.lot_number}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Buyer Name:</span> <span className="font-bold text-gray-900">{selectedSplitForPurcha.buyer_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Produce:</span> <span>{selectedSplitForPurcha.lot?.commodity_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Quantity Sold:</span> <span className="font-bold">{selectedSplitForPurcha.bags_sold} Bags/Boxes</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Sale Rate:</span> <span className="font-mono font-bold">₹{selectedSplitForPurcha.sale_rate}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Gross Total:</span> <span className="font-mono font-bold">₹{(selectedSplitForPurcha.bags_sold * selectedSplitForPurcha.sale_rate).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Terms:</span> <span>{selectedSplitForPurcha.payment_terms || '15 Days'}</span></div>
              </div>
              <div className="border-t pt-4 flex justify-between text-xs text-gray-500 font-semibold">
                <div>Buyer Ack: __________</div>
                <div>Arhatiya Stamp: __________</div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
              >
                Print Purcha
              </button>
              <button
                onClick={() => setSelectedSplitForPurcha(null)}
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
