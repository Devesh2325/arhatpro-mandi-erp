import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, 
  Truck, 
  Gavel, 
  DollarSign, 
  FileText, 
  UserPlus, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  Scale, 
  ArrowUpRight, 
  ArrowDownLeft,
  Building2,
  Calendar
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const { currentTenant } = useTenant();
  const { user } = useAuth();

  const [arrivals, setArrivals] = useState([]);
  const [lots, setLots] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [cashbook, setCashbook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentTenant]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [arrRes, lotsRes, accRes, cashRes] = await Promise.all([
        api.getArrivals(),
        api.getSalesLots(),
        api.getAccounts(),
        api.getCashbook()
      ]);
      setArrivals(arrRes.arrivals || arrRes || []);
      setLots(lotsRes.lots || lotsRes || []);
      setAccounts(accRes.accounts || accRes || []);
      setCashbook(cashRes || {});
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics
  const totalInwardBags = arrivals.reduce((sum, a) => sum + (a.bags || 0), 0);
  const totalRemainingBags = lots.reduce((sum, l) => sum + (l.remaining_bags || 0), 0);
  const totalLotsCount = lots.length;
  const activeLotsCount = lots.filter(l => (l.remaining_bags || 0) > 0).length;

  const totalOutstanding = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const overdueAccounts = accounts.filter(a => (a.overdue_days || 0) > 15);
  const rokadClosing = cashbook?.closingBalance || 50000;

  const todayDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                APMC Live Trading Desk
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5" /> {todayDate}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {currentTenant?.firm_name || 'ArhatPro Mandi Firm'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{currentTenant?.shop_no || 'Shop No. C-42'} • {currentTenant?.mandi_name || 'Azadpur Mandi, Delhi'}</span>
              <span className="text-slate-500">|</span>
              <span className="font-mono text-emerald-300">Lic: {currentTenant?.apmc_license_no || 'DL-APMC-09142'}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('quick-trade')}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              Start Quick Trade (F2)
            </button>
            <button
              onClick={() => setActiveTab('arrivals')}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              Inward Truck (F3)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Buttons Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>⚡ Lightning Quick Actions (त्वरित कार्य)</span>
          <span className="text-[11px] font-normal text-slate-400">Click any action to execute immediately</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setActiveTab('quick-trade')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/60 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Quick Trade</div>
            <div className="text-[10px] text-slate-500">एकल सौदा (F2)</div>
          </button>

          <button
            onClick={() => setActiveTab('arrivals')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/60 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Log Truck Inward</div>
            <div className="text-[10px] text-slate-500">गाड़ी आवक (F3)</div>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/60 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Gavel className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Auction / Hammer</div>
            <div className="text-[10px] text-slate-500">बोली व बिक्री (F4)</div>
          </button>

          <button
            onClick={() => setActiveTab('bahi-khata')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/60 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Record Rokad</div>
            <div className="text-[10px] text-slate-500">रोकड़ प्रविष्टि</div>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-rose-500 bg-slate-50 hover:bg-rose-50/60 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs">APMC Teep / Bill</div>
            <div className="text-[10px] text-slate-500">पक्का टीप व पर्चा</div>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-500 bg-slate-50 hover:bg-slate-100 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Add Master Party</div>
            <div className="text-[10px] text-slate-500">नया खरीदार / किसान</div>
          </button>
        </div>
      </div>

      {/* 3. Core KPI Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Consignments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Inward Consignments</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {arrivals.length} <span className="text-sm font-semibold text-slate-500">Trucks</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Total Inward Bags:</span>
            <span className="font-bold text-slate-800">{totalInwardBags.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 2: Live Produce on Yard */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Live Produce on Yard</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {totalRemainingBags.toLocaleString()} <span className="text-sm font-semibold text-slate-500">Bags</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Active Auction Lots:</span>
            <span className="font-bold text-emerald-700">{activeLotsCount} of {totalLotsCount} Lots</span>
          </div>
        </div>

        {/* Card 3: Rokad Cash in Hand */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Rokad Cash in Hand</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            ₹{rokadClosing.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Counter Cashbook:</span>
            <span className="text-emerald-700 font-semibold font-mono">Balanced</span>
          </div>
        </div>

        {/* Card 4: Outstanding Udhaar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Debtors Outstanding</span>
            <TrendingUp className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            ₹{totalOutstanding.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>15+ Days Overdue:</span>
            <span className="font-bold text-rose-700">{overdueAccounts.length} Buyers</span>
          </div>
        </div>
      </div>

      {/* 4. Yard Auction Snapshot & Recent Arrivals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Lots on Mandi Yard */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gavel className="w-4 h-4 text-purple-700" />
              <h3 className="font-bold text-slate-900 text-sm">Active Auction Lots on Yard (मंडी यार्ड लॉट)</h3>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              View All Lots ({lots.length}) →
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-96">
            {lots.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No active lots on the yard. Log an inward truck to begin.</div>
            ) : (
              lots.slice(0, 5).map((lot) => {
                const percentRemaining = Math.round((lot.remaining_bags / lot.total_bags) * 100);
                const isSoldOut = lot.remaining_bags === 0;

                return (
                  <div key={lot.id} className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {lot.lot_number || lot.id}
                        </span>
                        <span className="font-bold text-slate-900 text-sm truncate">{lot.commodity_name}</span>
                        {isSoldOut ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                            Sold Out
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                            Live Yard
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        Farmer: <strong className="text-slate-700">{lot.farmer_name}</strong> • Truck: {lot.truck_no}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="font-black text-sm text-slate-900 font-mono">
                          {lot.remaining_bags} <span className="text-xs font-normal text-slate-400">/ {lot.total_bags}</span>
                        </div>
                        <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${isSoldOut ? 'bg-emerald-500' : 'bg-purple-600'}`}
                            style={{ width: `${100 - percentRemaining}%` }}
                          />
                        </div>
                      </div>

                      {!isSoldOut && (
                        <button
                          onClick={() => setActiveTab('sales')}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-xs shadow-xs"
                        >
                          Hammer 🔨
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: APMC Bye-Laws & Statutory Mandi Deductions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b pb-3">
            <Scale className="w-4 h-4 text-emerald-700" />
            <span>APMC Statutory Rates &amp; Bye-Laws</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600 font-medium">Commission / Arhat (आढ़त)</span>
              <span className="font-mono font-bold text-emerald-700">6.0%</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600 font-medium">Buyer Dami (दामी)</span>
              <span className="font-mono font-bold text-blue-700">2.0%</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600 font-medium">APMC Cess + RDF</span>
              <span className="font-mono font-bold text-slate-800">1.0% + 1.0%</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600 font-medium">Palledari / Box Unloading</span>
              <span className="font-mono font-bold text-amber-700">₹3 / Box</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
              <span className="font-medium">15-Day Late Payment Interest</span>
              <span className="font-mono font-black text-rose-700">18.0% p.a.</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab('settings')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Configure Agency Rates →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
