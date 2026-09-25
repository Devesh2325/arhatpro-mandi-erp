import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { Truck, Plus, Search, Filter, Printer, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';

export default function Arrivals() {
  const { t, isHindi } = useLanguage();
  const [arrivals, setArrivals] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    truck_no: '',
    driver_name: '',
    driver_mobile: '',
    farmer_name: '',
    source_location: '',
    commodity_id: '',
    bags: '',
    gross_weight: '',
    freight_amount: '',
    advance_paid: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [arrivalsRes, commsRes] = await Promise.all([
        api.getArrivals(),
        api.getCommodities()
      ]);
      setArrivals(arrivalsRes.arrivals || []);
      setCommodities(commsRes.commodities || []);
      if (commsRes.commodities?.length > 0 && !formData.commodity_id) {
        setFormData(prev => ({ ...prev, commodity_id: commsRes.commodities[0].id }));
      }
    } catch (err) {
      console.error('Error loading arrivals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.createArrival({
        ...formData,
        bags: parseInt(formData.bags, 10),
        gross_weight: parseFloat(formData.gross_weight) || 0,
        freight_amount: parseFloat(formData.freight_amount) || 0,
        advance_paid: parseFloat(formData.advance_paid) || 0
      });
      setMessage({ type: 'success', text: `Consignment registered successfully! Lot: ${res.lot?.lot_number || 'Generated'}` });
      setShowAddModal(false);
      setFormData({
        truck_no: '',
        driver_name: '',
        driver_mobile: '',
        farmer_name: '',
        source_location: '',
        commodity_id: commodities[0]?.id || '',
        bags: '',
        gross_weight: '',
        freight_amount: '',
        advance_paid: ''
      });
      loadData();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Truck className="w-7 h-7 text-indigo-600" />
            {t('Inward Consignments', 'गाड़ी आवक रजिस्टर')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('Track inward fruit & vegetable trucks, farmer consignments, driver freight & generated lots.', 'गाड़ी आवक, किसान चालान, चालक भाड़ा पेशगी और जनरेटेड यार्ड लॉट्स का प्रबंधन।')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            {t('New Truck Arrival', 'नई गाड़ी आवक')}
          </button>
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Consignments</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-gray-900">{arrivals.length} Trucks</span>
            <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">All-Time</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live / Unsold Bags</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">{remainingBags.toLocaleString()} <span className="text-sm font-normal text-gray-500">/ {totalBags.toLocaleString()}</span></span>
            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">On Yard</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Freight Recorded</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">₹{totalFreight.toLocaleString()}</span>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Paid / Payable</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search truck number, farmer name, lot number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === filter
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter === 'ALL' ? 'All' : filter === 'OPEN' ? 'Active Lots' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Consignments Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4">Lot & Date</th>
                <th className="py-3.5 px-4">Truck & Driver</th>
                <th className="py-3.5 px-4">Farmer & Origin</th>
                <th className="py-3.5 px-4">Commodity</th>
                <th className="py-3.5 px-4 text-center">Bags / Crates</th>
                <th className="py-3.5 px-4">Freight (₹)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-400">Loading consignments...</td>
                </tr>
              ) : filteredArrivals.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-400">
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
                        <div>{arr.lot_number || `LOT-#${arr.id}`}</div>
                        <div className="text-xs font-sans text-gray-400 font-normal mt-0.5">
                          {new Date(arr.arrival_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{arr.truck_no}</div>
                        <div className="text-xs text-gray-500">
                          {arr.driver_name || 'Driver'} {arr.driver_mobile ? `• ${arr.driver_mobile}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{arr.farmer_name}</div>
                        <div className="text-xs text-gray-500">{arr.source_location || 'Local Mandi'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-indigo-700">{arr.commodity_name || 'General Produce'}</span>
                        {arr.gross_weight > 0 && (
                          <div className="text-xs text-gray-400">{arr.gross_weight} Qntl</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-gray-900">{arr.remaining_bags}</span>
                        <span className="text-xs text-gray-400"> / {arr.bags} left</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">₹{arr.freight_amount?.toLocaleString() || 0}</div>
                        <div className="text-xs text-emerald-600">
                          Adv: ₹{arr.advance_paid || 0} {balanceFreight > 0 && `• Bal: ₹${balanceFreight}`}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isSoldOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3" /> Fully Sold
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" /> Active Lot
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedArrival(arr)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors title='Print Gate Pass'"
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

      {/* Add Consignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-900">{t('New Inward Truck Arrival', 'नई गाड़ी आवक')}</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{t('Truck Number *', 'गाड़ी नंबर *')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-01-AB-1234"
                    value={formData.truck_no}
                    onChange={(e) => setFormData({ ...formData, truck_no: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase font-mono font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{t('Driver Name', 'चालक का नाम')}</label>
                  <input
                    type="text"
                    placeholder={t('Driver Name', 'चालक का नाम')}
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{t('Driver Mobile', 'चालक मोबाइल')}</label>
                  <input
                    type="text"
                    placeholder="10-digit mobile"
                    value={formData.driver_mobile}
                    onChange={(e) => setFormData({ ...formData, driver_mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{t('Farmer / Consignor Name *', 'किसान / उत्पादक का नाम *')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Balwinder Singh"
                    value={formData.farmer_name}
                    onChange={(e) => setFormData({ ...formData, farmer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{t('Source Mandi / Location', 'उत्पत्ति मंडी / क्षेत्र')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Shimla / Abohar / Nashik"
                    value={formData.source_location}
                    onChange={(e) => setFormData({ ...formData, source_location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{t('Commodity *', 'फसल / जिंस *')}</label>
                  <select
                    value={formData.commodity_id}
                    onChange={(e) => setFormData({ ...formData, commodity_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {commodities.map((c) => (
                      <option key={c.id} value={c.id}>{isHindi ? (c.hindi_name || c.name) : c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{t('Total Bags / Crates *', 'कुल नग / बोरी *')}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 500"
                    value={formData.bags}
                    onChange={(e) => setFormData({ ...formData, bags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{t('Gross Weight (Qntl)', 'कुल वजन (क्विंटल)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 100.5"
                    value={formData.gross_weight}
                    onChange={(e) => setFormData({ ...formData, gross_weight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{t('Freight Total (₹)', 'गाड़ी भाड़ा (₹)')}</label>
                  <input
                    type="number"
                    placeholder="₹ 0"
                    value={formData.freight_amount}
                    onChange={(e) => setFormData({ ...formData, freight_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{t('Advance Paid to Driver (₹)', 'चालक को पेशगी (₹)')}</label>
                  <input
                    type="number"
                    placeholder="₹ 0"
                    value={formData.advance_paid}
                    onChange={(e) => setFormData({ ...formData, advance_paid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Creating Lot...' : 'Confirm Arrival & Generate Lot'}
                </button>
              </div>
            </form>
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
                <div className="text-xs text-gray-500">Mandi Yard Consignment Clearance & Bilti Voucher</div>
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
