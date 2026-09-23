import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useTenant } from '../context/TenantContext';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Eye, 
  CheckCircle, 
  Search, 
  Calendar, 
  ShieldCheck, 
  Filter, 
  TrendingUp,
  Truck,
  Users,
  DollarSign,
  Package,
  Receipt,
  RotateCcw,
  X,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function Reports() {
  const { currentTenant, activeTenant } = useTenant();
  const tenant = currentTenant || activeTenant;

  // Active Report Tab:
  // BUYER_PURCHA, BUYER_BALANCE, GROWER_BALANCE, BUYER_SUMMARY, GROWER_SUMMARY, GROWER_ARRIVAL, STATUTORY
  const [activeReport, setActiveReport] = useState('BUYER_PURCHA');

  // Date Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Data States
  const [arrivals, setArrivals] = useState([]);
  const [lots, setLots] = useState([]);
  const [sales, setSales] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Preview State
  const [selectedPurcha, setSelectedPurcha] = useState(null);
  const [selectedStatutoryLot, setSelectedStatutoryLot] = useState(null);
  const [statutorySubTab, setStatutorySubTab] = useState('TEEP'); // TEEP, JFORM, FORMM

  useEffect(() => {
    loadAllReportData();
  }, [tenant]);

  const loadAllReportData = async () => {
    setLoading(true);
    try {
      // 1. Fetch joined reports data from backend if available
      try {
        const repRes = await api.getReportsData();
        if (repRes && repRes.arrivals) {
          setArrivals(repRes.arrivals || []);
          setSales(repRes.sales || []);
          setAccounts(repRes.accounts || []);
          setParties(repRes.parties || []);
        }
      } catch (err) {
        console.warn('Dedicated reports API fallback:', err);
      }

      // 2. Also fetch lots and arrivals directly
      const [arrRes, lotsRes, accRes, partiesRes] = await Promise.all([
        api.getArrivals(),
        api.getSalesLots(),
        api.getAccounts(),
        api.getParties()
      ]);

      const arrList = arrRes.arrivals || arrRes || [];
      const lotsList = lotsRes.lots || lotsRes || [];
      const accList = accRes.accounts || accRes || [];
      const partList = partiesRes.parties || partiesRes || [];

      setArrivals(arrList);
      setLots(lotsList);
      setAccounts(accList);
      setParties(partList);

      if (lotsList.length > 0 && !selectedStatutoryLot) {
        setSelectedStatutoryLot(lotsList[0]);
      }

      // Extract all split sales from lots into a flat array if not already populated
      let flatSales = [];
      lotsList.forEach(l => {
        if (l.splitSales && Array.isArray(l.splitSales)) {
          l.splitSales.forEach(s => {
            flatSales.push({
              ...s,
              lot_id: l.id,
              commodity_name: l.commodity_name,
              farmer_name: l.farmer_name,
              truck_no: l.truck_no,
              unit: l.unit || 'Box',
              freight_advance_paid: l.freight_advance_paid
            });
          });
        }
      });

      if (flatSales.length > 0) {
        setSales(prev => (prev.length > 0 ? prev : flatSales));
      }
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Preset Date Handlers
  const setDatePreset = (preset) => {
    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (preset === 'TODAY') {
      const tStr = formatDate(today);
      setFromDate(tStr);
      setToDate(tStr);
    } else if (preset === 'YESTERDAY') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const yStr = formatDate(yest);
      setFromDate(yStr);
      setToDate(yStr);
    } else if (preset === 'LAST_7_DAYS') {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      setFromDate(formatDate(past));
      setToDate(formatDate(today));
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(formatDate(firstDay));
      setToDate(formatDate(today));
    } else if (preset === 'ALL') {
      setFromDate('');
      setToDate('');
    }
  };

  // Date Filter Helper
  const isDateInRange = (dateStr) => {
    if (!dateStr) return true;
    const targetDate = new Date(dateStr).toISOString().split('T')[0];
    if (fromDate && targetDate < fromDate) return false;
    if (toDate && targetDate > toDate) return false;
    return true;
  };

  // 1. Filtered Arrivals (Grower Arrivals)
  const filteredArrivals = arrivals.filter(a => {
    const matchesDate = isDateInRange(a.date || a.arrival_date || a.created_at);
    if (!matchesDate) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchFarmer = (a.farmer_name || '').toLowerCase().includes(term);
      const matchTruck = (a.truck_no || '').toLowerCase().includes(term);
      const matchComm = (a.commodity || a.commodity_name || '').toLowerCase().includes(term);
      return matchFarmer || matchTruck || matchComm;
    }
    return true;
  });

  // 2. Filtered Sales (Buyer Purcha records)
  const filteredSales = sales.filter(s => {
    const matchesDate = isDateInRange(s.created_at || s.date);
    if (!matchesDate) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchBuyer = (s.buyer_name || '').toLowerCase().includes(term);
      const matchFarmer = (s.farmer_name || '').toLowerCase().includes(term);
      const matchComm = (s.commodity_name || '').toLowerCase().includes(term);
      const matchCode = (s.sale_code || s.id || '').toLowerCase().includes(term);
      return matchBuyer || matchFarmer || matchComm || matchCode;
    }
    return true;
  });

  // 3. Buyer Balance Data
  const buyerBalanceData = accounts.filter(acc => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (acc.party_name || '').toLowerCase().includes(term) || (acc.short_code || '').toLowerCase().includes(term);
    }
    return true;
  });

  // 4. Grower / Kisan Balance Data (Calculated dynamically from arrivals and sales)
  const growerBalanceMap = {};
  filteredArrivals.forEach(a => {
    const name = a.farmer_name || 'General Grower';
    if (!growerBalanceMap[name]) {
      growerBalanceMap[name] = {
        farmerName: name,
        mobile: a.farmer_phone || '',
        location: a.farmer_location || a.source_location || 'Himachal/Kashmir',
        totalArrivals: 0,
        totalBags: 0,
        grossSales: 0,
        freightAdvance: 0,
        balanceFreight: 0,
        commission: 0,
        palledari: 0,
        paymentsMade: 0
      };
    }
    const bags = parseInt(a.quantity || a.bags, 10) || 0;
    const fAdv = parseFloat(a.freight_advance_paid || a.advance_paid) || 0;
    const fTotal = parseFloat(a.total_freight || a.freight_amount) || 0;
    growerBalanceMap[name].totalArrivals += 1;
    growerBalanceMap[name].totalBags += bags;
    growerBalanceMap[name].freightAdvance += fAdv;
    growerBalanceMap[name].balanceFreight += Math.max(0, fTotal - fAdv);
  });

  // Map sales revenue to growers
  filteredSales.forEach(s => {
    const fName = s.farmer_name || 'General Grower';
    if (!growerBalanceMap[fName]) {
      growerBalanceMap[fName] = {
        farmerName: fName,
        mobile: s.farmer_phone || '',
        location: s.farmer_location || 'Agricultural Belt',
        totalArrivals: 1,
        totalBags: parseInt(s.quantity, 10) || 0,
        grossSales: 0,
        freightAdvance: 0,
        balanceFreight: 0,
        commission: 0,
        palledari: 0,
        paymentsMade: 0
      };
    }
    const gross = (parseInt(s.quantity, 10) || 0) * (parseFloat(s.rate) || 0);
    growerBalanceMap[fName].grossSales += gross;
    growerBalanceMap[fName].commission += Math.round(gross * 0.06); // 6% Arhat
    growerBalanceMap[fName].palledari += (parseInt(s.quantity, 10) || 0) * 3; // ₹3 per bag
  });

  const growerBalanceList = Object.values(growerBalanceMap).map(g => {
    const totalDeductions = g.freightAdvance + g.balanceFreight + g.commission + g.palledari;
    const netPayable = Math.max(0, g.grossSales - totalDeductions);
    const balanceDue = Math.max(0, netPayable - g.paymentsMade);
    return {
      ...g,
      totalDeductions,
      netPayable,
      balanceDue,
      status: balanceDue === 0 && g.grossSales > 0 ? 'Settled' : 'Pending'
    };
  });

  // 5. Buyer Summary Aggregation
  const buyerSummaryMap = {};
  filteredSales.forEach(s => {
    const bName = s.buyer_name || 'Counter Buyer';
    if (!buyerSummaryMap[bName]) {
      buyerSummaryMap[bName] = {
        buyerName: bName,
        contact: s.buyer_contact || '',
        totalTrades: 0,
        totalBags: 0,
        grossAmount: 0,
        damiAmount: 0
      };
    }
    const qty = parseInt(s.quantity, 10) || 0;
    const gross = qty * (parseFloat(s.rate) || 0);
    const dami = Math.round(gross * 0.02); // 2% Dami
    buyerSummaryMap[bName].totalTrades += 1;
    buyerSummaryMap[bName].totalBags += qty;
    buyerSummaryMap[bName].grossAmount += gross;
    buyerSummaryMap[bName].damiAmount += dami;
  });

  const buyerSummaryList = Object.values(buyerSummaryMap).map(b => ({
    ...b,
    avgRate: b.totalBags > 0 ? Math.round(b.grossAmount / b.totalBags) : 0,
    netInvoiced: b.grossAmount + b.damiAmount
  }));

  // 6. Grower Summary Aggregation
  const growerSummaryList = growerBalanceList.map(g => ({
    farmerName: g.farmerName,
    mobile: g.mobile,
    location: g.location,
    trucksCount: g.totalArrivals,
    totalBags: g.totalBags,
    grossSales: g.grossSales,
    freightAdvance: g.freightAdvance,
    commissionEarned: g.commission,
    netTakeHome: g.netPayable
  }));

  // Export CSV Handler
  const exportToCSV = () => {
    let rows = [];
    let filename = `Mandi_Report_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeReport === 'BUYER_PURCHA') {
      rows.push(['Date', 'Purcha No', 'Buyer Name', 'Farmer', 'Commodity', 'Quantity', 'Rate', 'Gross Amount', 'Dami (2%)', 'Net Payable', 'Payment Mode']);
      filteredSales.forEach(s => {
        const gross = (parseInt(s.quantity, 10) || 0) * (parseFloat(s.rate) || 0);
        const dami = Math.round(gross * 0.02);
        rows.push([
          s.created_at || new Date().toISOString().split('T')[0],
          s.sale_code || s.id,
          s.buyer_name,
          s.farmer_name || 'N/A',
          s.commodity_name || 'Produce',
          s.quantity,
          s.rate,
          gross,
          dami,
          gross + dami,
          s.payment_mode || 'Credit'
        ]);
      });
    } else if (activeReport === 'BUYER_BALANCE') {
      rows.push(['Short Code', 'Buyer Name', 'Contact', 'Address', 'Credit Limit', 'Total Purchases', 'Total Paid', 'Outstanding Balance', 'Overdue Days']);
      buyerBalanceData.forEach(b => {
        rows.push([
          b.short_code || '',
          b.party_name || '',
          b.contact || '',
          b.address || '',
          b.credit_limit || 0,
          b.total_purchases || 0,
          b.total_paid || 0,
          b.outstanding_udhaar || 0,
          b.overdue_days || 0
        ]);
      });
    } else if (activeReport === 'GROWER_BALANCE') {
      rows.push(['Farmer Name', 'Mobile', 'Location', 'Total Bags', 'Gross Sales', 'Freight & Advance', 'Commission (6%)', 'Net Payable', 'Balance Due', 'Status']);
      growerBalanceList.forEach(g => {
        rows.push([
          g.farmerName,
          g.mobile,
          g.location,
          g.totalBags,
          g.grossSales,
          g.freightAdvance + g.balanceFreight,
          g.commission,
          g.netPayable,
          g.balanceDue,
          g.status
        ]);
      });
    } else if (activeReport === 'BUYER_SUMMARY') {
      rows.push(['Buyer Name', 'Contact', 'Total Trades', 'Total Bags', 'Avg Rate', 'Gross Value', 'Dami (2%)', 'Net Invoiced']);
      buyerSummaryList.forEach(b => {
        rows.push([b.buyerName, b.contact, b.totalTrades, b.totalBags, b.avgRate, b.grossAmount, b.damiAmount, b.netInvoiced]);
      });
    } else if (activeReport === 'GROWER_SUMMARY') {
      rows.push(['Farmer Name', 'Mobile', 'Location', 'Trucks', 'Total Bags', 'Gross Sales', 'Freight Advance', 'Commission (6%)', 'Net Take Home']);
      growerSummaryList.forEach(g => {
        rows.push([g.farmerName, g.mobile, g.location, g.trucksCount, g.totalBags, g.grossSales, g.freightAdvance, g.commissionEarned, g.netTakeHome]);
      });
    } else if (activeReport === 'GROWER_ARRIVAL') {
      rows.push(['Date', 'Gate Pass ID', 'Truck No', 'Driver Name', 'Driver Mobile', 'Farmer Name', 'Commodity', 'Bags', 'Total Freight', 'Advance Paid', 'Balance Freight', 'Status']);
      filteredArrivals.forEach(a => {
        rows.push([
          a.date || a.arrival_date || '',
          a.id,
          a.truck_no,
          a.driver_name || '',
          a.driver_phone || '',
          a.farmer_name,
          a.commodity || a.commodity_name,
          a.quantity || a.bags,
          a.total_freight || a.freight_amount,
          a.freight_advance_paid || a.advance_paid,
          a.freight_balance || 0,
          a.status || 'Ready'
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(val => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Mandi Commercial &amp; Statutory Reports (मंडी व्यापारिक व कानूनी रिपोर्ट)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Buyer purcha vouchers, party ledgers, grower arrival registers, and APMC statutory Form J / Form M returns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Download CSV for Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV (एक्सेल)
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report (प्रिंट करें)
          </button>
        </div>
      </div>

      {/* 2. Global Date Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Date Range Inputs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Date Filter:
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          {/* Quick Date Range Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setDatePreset('TODAY')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
            >
              Today (आज)
            </button>
            <button
              onClick={() => setDatePreset('YESTERDAY')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
            >
              Yesterday (कल)
            </button>
            <button
              onClick={() => setDatePreset('LAST_7_DAYS')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
            >
              7 Days (7 दिन)
            </button>
            <button
              onClick={() => setDatePreset('THIS_MONTH')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
            >
              This Month (इस माह)
            </button>
            <button
              onClick={() => setDatePreset('ALL')}
              className={`px-2.5 py-1 font-bold text-[11px] rounded-lg transition-colors cursor-pointer ${
                !fromDate && !toDate ? 'bg-emerald-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Dates (सभी)
            </button>
          </div>

          {/* Search Input */}
          <div className="relative sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search party, truck, commodity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-600 outline-none"
            />
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(fromDate || toDate || searchTerm) && (
          <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200 text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-800">Filtered View:</span>
              {fromDate && <span>From: <strong>{fromDate}</strong></span>}
              {toDate && <span>To: <strong>{toDate}</strong></span>}
              {searchTerm && <span>Search: <strong>"{searchTerm}"</strong></span>}
            </div>
            <button
              onClick={() => { setFromDate(''); setToDate(''); setSearchTerm(''); }}
              className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* 3. Report Category Selector Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 gap-1 pb-1 print:hidden">
        {[
          { id: 'BUYER_PURCHA', label: 'Buyer Purcha', labelHi: 'खरीदार पर्चा', icon: Receipt },
          { id: 'BUYER_BALANCE', label: 'Buyer Balance', labelHi: 'खरीदार बकाया', icon: DollarSign },
          { id: 'GROWER_BALANCE', label: 'Grower Balance', labelHi: 'किसान बकाया व भुगतान', icon: Users },
          { id: 'BUYER_SUMMARY', label: 'Buyer Summary', labelHi: 'खरीदार सारांश', icon: TrendingUp },
          { id: 'GROWER_SUMMARY', label: 'Grower Summary', labelHi: 'किसान सारांश', icon: Package },
          { id: 'GROWER_ARRIVAL', label: 'Grower Arrival', labelHi: 'गाड़ी आवक रजिस्टर', icon: Truck },
          { id: 'STATUTORY', label: 'APMC Legal Forms', labelHi: 'पक्का टीप व जे-फॉर्म', icon: ShieldCheck }
        ].map(tab => {
          const IconC = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <IconC className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
              <div>
                <div>{tab.label}</div>
                <div className={`text-[10px] font-normal ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                  {tab.labelHi}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          REPORT 1: BUYER PURCHA (खरीदार कच्चा / पक्का पर्चा)
      ========================================================================== */}
      {activeReport === 'BUYER_PURCHA' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Buyer Purcha Register (खरीदार नीलामी पर्चा)</h3>
              <p className="text-slate-500 text-[11px]">
                Individual trade slips issued to wholesale buyers with lot details, rates, and 2% dami breakdown.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-500 block">Total Invoiced Volume:</span>
              <span className="text-base font-black text-emerald-800 font-mono">
                {filteredSales.reduce((acc, s) => acc + (parseInt(s.quantity, 10) || 0), 0)} Bags
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Purcha No / Date</th>
                  <th className="p-3">Buyer Name</th>
                  <th className="p-3">Farmer / Lot</th>
                  <th className="p-3">Commodity</th>
                  <th className="p-3 text-center">Bags</th>
                  <th className="p-3 text-right">Rate (₹)</th>
                  <th className="p-3 text-right">Gross (₹)</th>
                  <th className="p-3 text-right">Dami (2%)</th>
                  <th className="p-3 text-right">Net Bill (₹)</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-slate-400">
                      No buyer purcha records found for the selected date range.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((s, idx) => {
                    const qty = parseInt(s.quantity, 10) || 0;
                    const rate = parseFloat(s.rate) || 0;
                    const gross = qty * rate;
                    const dami = Math.round(gross * 0.02);
                    const netBill = gross + dami;
                    const dateFormatted = s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN') : (s.date || 'Today');

                    return (
                      <tr key={s.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono">
                          <span className="font-black text-purple-900 block">{s.sale_code || s.id}</span>
                          <span className="text-[10px] text-slate-400">{dateFormatted} {s.time || ''}</span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {s.buyer_name}
                          {s.buyer_contact && <span className="block text-[10px] font-mono font-normal text-slate-400">{s.buyer_contact}</span>}
                        </td>
                        <td className="p-3 font-medium text-slate-700">
                          <span className="block font-bold">{s.farmer_name || 'Grower'}</span>
                          <span className="font-mono text-[10px] text-slate-400">{s.lot_id || 'Lot'}</span>
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {s.commodity_name || 'Produce'}
                          {s.variety && <span className="block text-[10px] text-slate-400">{s.variety}</span>}
                        </td>
                        <td className="p-3 text-center font-bold font-mono">{qty}</td>
                        <td className="p-3 text-right font-mono font-medium">₹{rate.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold">₹{gross.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-slate-500">₹{dami.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-black text-emerald-700">₹{netBill.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedPurcha({ ...s, gross, dami, netBill, dateFormatted })}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer border border-purple-200 flex items-center gap-1 mx-auto"
                          >
                            <Receipt className="w-3 h-3" /> Purcha Slip
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
      )}

      {/* =========================================================================
          REPORT 2: BUYER BALANCE REPORT (खरीदार बकाया रिपोर्ट / Udhaar Bahi)
      ========================================================================== */}
      {activeReport === 'BUYER_BALANCE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Buyer Balance &amp; Aging Report (खरीदार उधारी बहीखाता)</h3>
              <p className="text-slate-500 text-[11px]">
                Wholesale buyer ledger with credit limits, purchases, clearances, and 18% statutory late interest.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Market Debt</span>
                <span className="text-base font-black text-rose-700 font-mono">
                  ₹{buyerBalanceData.reduce((acc, b) => acc + (b.outstanding_udhaar || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Short Code</th>
                  <th className="p-3">Buyer Name &amp; Contact</th>
                  <th className="p-3 text-right">Credit Limit</th>
                  <th className="p-3 text-right">Total Purchases</th>
                  <th className="p-3 text-right">Total Paid</th>
                  <th className="p-3 text-right">Outstanding Udhaar</th>
                  <th className="p-3 text-center">Overdue Days</th>
                  <th className="p-3 text-right">Late Interest (18%)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {buyerBalanceData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-slate-400">No buyer ledger accounts found.</td>
                  </tr>
                ) : (
                  buyerBalanceData.map(b => {
                    const isOverdue = (b.overdue_days || 0) > 15;
                    const interest = isOverdue ? Math.round((b.outstanding_udhaar || 0) * (0.015 * (b.overdue_days / 30))) : 0;
                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-black text-emerald-800">{b.short_code || '—'}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {b.party_name}
                          {b.contact && <span className="block text-[10px] font-mono font-normal text-slate-400">{b.contact}</span>}
                        </td>
                        <td className="p-3 text-right font-mono">₹{(b.credit_limit || 0).toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">₹{(b.total_purchases || 0).toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-emerald-700">₹{(b.total_paid || 0).toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-black text-rose-700 text-sm">₹{(b.outstanding_udhaar || 0).toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isOverdue ? 'bg-rose-100 text-rose-800 font-black' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {b.overdue_days || 0} Days
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-amber-800 font-bold">
                          {interest > 0 ? `+₹${interest.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            (b.outstanding_udhaar || 0) === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {(b.outstanding_udhaar || 0) === 0 ? 'Clear ✓' : isOverdue ? 'Overdue ⚠️' : 'Active'}
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

      {/* =========================================================================
          REPORT 3: GROWER / KISAN BALANCE REPORT (किसान बकाया व भुगतान रिपोर्ट)
      ========================================================================== */}
      {activeReport === 'GROWER_BALANCE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grower / Kisan Balance Report (किसान बकाया व भुगतान रिपोर्ट)</h3>
              <p className="text-slate-500 text-[11px]">
                Consignor settlement register: Gross auction proceeds, freight/advance deductions, commission, and net payouts.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Grower Net Payable</span>
              <span className="text-base font-black text-emerald-700 font-mono">
                ₹{growerBalanceList.reduce((acc, g) => acc + (g.netPayable || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Farmer / Grower Name</th>
                  <th className="p-3">Origin Location</th>
                  <th className="p-3 text-center">Bags Delivered</th>
                  <th className="p-3 text-right">Gross Sales (₹)</th>
                  <th className="p-3 text-right">Freight &amp; Advance</th>
                  <th className="p-3 text-right">Commission (6%)</th>
                  <th className="p-3 text-right">Palledari (₹)</th>
                  <th className="p-3 text-right">Net Farmer Proceeds</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {growerBalanceList.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-slate-400">
                      No grower consignments found for the selected date range.
                    </td>
                  </tr>
                ) : (
                  growerBalanceList.map((g, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        {g.farmerName}
                        {g.mobile && <span className="block text-[10px] font-mono font-normal text-slate-400">{g.mobile}</span>}
                      </td>
                      <td className="p-3 text-slate-600">{g.location}</td>
                      <td className="p-3 text-center font-bold font-mono">{g.totalBags}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₹{g.grossSales.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-rose-600">₹{(g.freightAdvance + g.balanceFreight).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-600">₹{g.commission.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-600">₹{g.palledari.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-700 text-sm">
                        ₹{g.netPayable.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.status === 'Settled' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {g.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 4: BUYER SUMMARY (खरीदार सारांश)
      ========================================================================== */}
      {activeReport === 'BUYER_SUMMARY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Buyer Trading Summary (खरीदार संक्षेप रिपोर्ट)</h3>
              <p className="text-slate-500 text-[11px]">
                Aggregated buyer trading performance: Total boxes purchased, average bidding price, and commission due.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Aggregated Turnover</span>
              <span className="text-base font-black text-purple-900 font-mono">
                ₹{buyerSummaryList.reduce((acc, b) => acc + (b.netInvoiced || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Buyer Name</th>
                  <th className="p-3 text-center">Trades / Lots</th>
                  <th className="p-3 text-center">Total Bags</th>
                  <th className="p-3 text-right">Avg Rate (₹)</th>
                  <th className="p-3 text-right">Gross Produce Value</th>
                  <th className="p-3 text-right">Buyer Dami @ 2%</th>
                  <th className="p-3 text-right">Net Invoiced Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {buyerSummaryList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-400">
                      No buyer purchases found in the selected date range.
                    </td>
                  </tr>
                ) : (
                  buyerSummaryList.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        {b.buyerName}
                        {b.contact && <span className="block text-[10px] font-mono font-normal text-slate-400">{b.contact}</span>}
                      </td>
                      <td className="p-3 text-center font-mono font-medium">{b.totalTrades} Lots</td>
                      <td className="p-3 text-center font-mono font-bold">{b.totalBags}</td>
                      <td className="p-3 text-right font-mono">₹{b.avgRate.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">₹{b.grossAmount.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-600">₹{b.damiAmount.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-black text-purple-900 text-sm">
                        ₹{b.netInvoiced.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 5: GROWER SUMMARY (किसान सारांश)
      ========================================================================== */}
      {activeReport === 'GROWER_SUMMARY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grower / Producer Summary (किसान आवक-बिक्री सारांश)</h3>
              <p className="text-slate-500 text-[11px]">
                Aggregated consignor volume, trucks inward, commission collected, and net take-home proceeds.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Grower Volume</span>
              <span className="text-base font-black text-emerald-800 font-mono">
                {growerSummaryList.reduce((acc, g) => acc + (g.totalBags || 0), 0)} Bags
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Grower / Farmer Name</th>
                  <th className="p-3">Origin Location</th>
                  <th className="p-3 text-center">Trucks Inward</th>
                  <th className="p-3 text-center">Total Bags</th>
                  <th className="p-3 text-right">Gross Sales (₹)</th>
                  <th className="p-3 text-right">Driver Advance Paid</th>
                  <th className="p-3 text-right">Arhat Commission (6%)</th>
                  <th className="p-3 text-right">Net Farmer Proceeds</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {growerSummaryList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-slate-400">
                      No farmer summary records available in the selected date range.
                    </td>
                  </tr>
                ) : (
                  growerSummaryList.map((g, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        {g.farmerName}
                        {g.mobile && <span className="block text-[10px] font-mono font-normal text-slate-400">{g.mobile}</span>}
                      </td>
                      <td className="p-3 text-slate-600">{g.location}</td>
                      <td className="p-3 text-center font-mono font-medium">{g.trucksCount} Trucks</td>
                      <td className="p-3 text-center font-mono font-bold">{g.totalBags}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₹{g.grossSales.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-amber-700">₹{g.freightAdvance.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-600">₹{g.commissionEarned.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-700 text-sm">
                        ₹{g.netTakeHome.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 6: GROWER ARRIVAL (गाड़ी आवक व गेट पास रजिस्टर)
      ========================================================================== */}
      {activeReport === 'GROWER_ARRIVAL' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grower Inward Arrival Register (गाड़ी आवक रजिस्टर)</h3>
              <p className="text-slate-500 text-[11px]">
                Complete truck entry log with vehicle number, driver details, bag quantities, and freight advances.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Inward Trucks Count</span>
              <span className="text-base font-black text-blue-900 font-mono">
                {filteredArrivals.length} Trucks
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Gate Pass / Date</th>
                  <th className="p-3">Truck / Vehicle No</th>
                  <th className="p-3">Driver Name &amp; Contact</th>
                  <th className="p-3">Farmer / Grower</th>
                  <th className="p-3">Commodity &amp; Variety</th>
                  <th className="p-3 text-center">Bags</th>
                  <th className="p-3 text-right">Total Freight</th>
                  <th className="p-3 text-right">Advance Paid</th>
                  <th className="p-3 text-right">Balance Freight</th>
                  <th className="p-3 text-center">Lot Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArrivals.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-slate-400">
                      No truck inward entries found in the selected date range.
                    </td>
                  </tr>
                ) : (
                  filteredArrivals.map((a, idx) => (
                    <tr key={a.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono">
                        <span className="font-bold text-blue-900 block">{a.id}</span>
                        <span className="text-[10px] text-slate-400">{a.date || a.arrival_date || 'Today'} {a.time || ''}</span>
                      </td>
                      <td className="p-3 font-mono font-black text-slate-900">{a.truck_no}</td>
                      <td className="p-3 text-slate-700">
                        <span className="font-bold block">{a.driver_name || 'Driver'}</span>
                        {a.driver_phone && <span className="font-mono text-[10px] text-slate-400">{a.driver_phone}</span>}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {a.farmer_name}
                        {a.farmer_location && <span className="block text-[10px] font-normal text-slate-400">{a.farmer_location}</span>}
                      </td>
                      <td className="p-3 font-medium text-slate-800">
                        {a.commodity || a.commodity_name}
                        {a.variety && <span className="block text-[10px] text-slate-400">{a.variety}</span>}
                      </td>
                      <td className="p-3 text-center font-bold font-mono">{a.quantity || a.bags}</td>
                      <td className="p-3 text-right font-mono">₹{(a.total_freight || a.freight_amount || 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-amber-700">₹{(a.freight_advance_paid || a.advance_paid || 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-600">₹{(a.freight_balance || 0).toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {a.status || 'Ready for Sale'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 7: STATUTORY APMC FORMS (TEEP, FORM J, FORM M)
      ========================================================================== */}
      {activeReport === 'STATUTORY' && (
        <div className="space-y-4">
          {/* Sub Navigation */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'TEEP', label: 'Consignor Sealed Teep (पक्का टीप)' },
                { id: 'JFORM', label: 'Farmer Form J (जे-फॉर्म)' },
                { id: 'FORMM', label: 'APMC Form M (मासिक रिटर्न)' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setStatutorySubTab(sub.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    statutorySubTab === sub.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Select Lot */}
            {statutorySubTab !== 'FORMM' && lots.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-500">Select Lot:</span>
                <select
                  value={selectedStatutoryLot?.id || ''}
                  onChange={(e) => {
                    const found = lots.find(l => l.id.toString() === e.target.value.toString());
                    setSelectedStatutoryLot(found || null);
                  }}
                  className="p-1.5 border border-slate-300 rounded-lg font-bold bg-white focus:ring-1 focus:ring-emerald-600 outline-none"
                >
                  {lots.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.lot_number || l.id} — {l.farmer_name} ({l.commodity_name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Sub-Tab 1: Teep Preview */}
          {statutorySubTab === 'TEEP' && selectedStatutoryLot && (
            <div className="bg-white p-8 rounded-3xl border border-slate-300 shadow-lg max-w-3xl mx-auto space-y-6 text-slate-800 print:shadow-none print:border-none print:p-0">
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <div className="text-2xl font-black uppercase tracking-wider text-slate-900">
                  {tenant?.firm_name || 'ARHATPRO TRADING CO.'}
                </div>
                <div className="text-xs font-bold text-slate-600">
                  LICENSED COMMISSION AGENT • {tenant?.mandi_name || 'APMC AZADPUR, DELHI'}
                </div>
                <div className="text-xs text-slate-500">
                  {tenant?.shop_no || 'Shop No. C-42'} • Phone: {tenant?.phone || '+91 98110 23456'} • Lic: {tenant?.apmc_license_no || 'DL-APMC-09142'}
                </div>
                <div className="inline-block mt-2 px-4 py-1 bg-slate-900 text-white text-xs font-black uppercase rounded tracking-widest">
                  CONSIGNOR ACCOUNT SALE / पक्का टीप
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div><span className="font-bold text-slate-500">Consignor / Farmer:</span> <span className="font-black text-slate-900 text-sm">{selectedStatutoryLot.farmer_name}</span></div>
                  <div><span className="font-bold text-slate-500">Origin / Village:</span> {selectedStatutoryLot.farmer_location || 'Himachal/Kashmir'}</div>
                  <div><span className="font-bold text-slate-500">Truck No:</span> <span className="font-mono font-bold">{selectedStatutoryLot.truck_no || 'DL-01-AB-8899'}</span></div>
                </div>
                <div className="space-y-1 text-right">
                  <div><span className="font-bold text-slate-500">Teep Slip No:</span> <span className="font-mono font-black text-purple-700">TP-{selectedStatutoryLot.lot_number || selectedStatutoryLot.id}</span></div>
                  <div><span className="font-bold text-slate-500">Arrival Date:</span> {new Date(selectedStatutoryLot.created_at || Date.now()).toLocaleDateString('en-IN')}</div>
                  <div><span className="font-bold text-slate-500">Settlement Date:</span> {new Date().toLocaleDateString('en-IN')}</div>
                </div>
              </div>

              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2.5">Commodity / Produce</th>
                    <th className="p-2.5 text-center">Bags / Crates</th>
                    <th className="p-2.5 text-right">Auction Rate (Avg)</th>
                    <th className="p-2.5 text-right">Gross Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const bags = selectedStatutoryLot.total_quantity || selectedStatutoryLot.total_bags || 100;
                    const estRate = 1850;
                    const gross = bags * estRate;
                    const freightAdvance = selectedStatutoryLot.freight_advance_paid || 1500;
                    const unloading = bags * 3;
                    const commission = (gross * 6) / 100;
                    const apmcFee = (gross * 1) / 100;
                    const totalDeductions = freightAdvance + unloading + commission + apmcFee;
                    const netPayable = gross - totalDeductions;

                    return (
                      <>
                        <tr className="border-b border-slate-200">
                          <td className="p-2.5 font-bold">{selectedStatutoryLot.commodity_name}</td>
                          <td className="p-2.5 text-center font-bold">{bags}</td>
                          <td className="p-2.5 text-right font-mono">₹{estRate.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-mono font-bold">₹{gross.toLocaleString()}</td>
                        </tr>
                        <tr className="bg-slate-50 font-bold">
                          <td colSpan="3" className="p-2.5 text-right uppercase tracking-wider">Gross Produce Value (सकल मूल्य):</td>
                          <td className="p-2.5 text-right font-mono text-sm font-black">₹{gross.toLocaleString()}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <td colSpan="4" className="p-2 bg-slate-100 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                            Statutory Mandi Deductions / कटौती विवरण
                          </td>
                        </tr>
                        <tr className="text-slate-600">
                          <td colSpan="3" className="px-2.5 py-1">Freight Advance to Driver (अग्रिम भाड़ा):</td>
                          <td className="px-2.5 py-1 text-right font-mono">₹{freightAdvance.toLocaleString()}</td>
                        </tr>
                        <tr className="text-slate-600">
                          <td colSpan="3" className="px-2.5 py-1">Palledari / Unloading @ ₹3/bag (पल्लेदारी):</td>
                          <td className="px-2.5 py-1 text-right font-mono">₹{unloading.toLocaleString()}</td>
                        </tr>
                        <tr className="text-slate-600">
                          <td colSpan="3" className="px-2.5 py-1">Commission / Arhat @ 6.0% (आढ़त):</td>
                          <td className="px-2.5 py-1 text-right font-mono">₹{commission.toLocaleString()}</td>
                        </tr>
                        <tr className="text-slate-600">
                          <td colSpan="3" className="px-2.5 py-1">Market Fee / Mandi Cess @ 1.0% (मंडी शुल्क):</td>
                          <td className="px-2.5 py-1 text-right font-mono">₹{apmcFee.toLocaleString()}</td>
                        </tr>
                        <tr className="border-t border-slate-300 font-bold text-rose-700">
                          <td colSpan="3" className="p-2.5 text-right">Total Deductions (कुल कटौती):</td>
                          <td className="p-2.5 text-right font-mono">₹{totalDeductions.toLocaleString()}</td>
                        </tr>
                        <tr className="border-t-2 border-slate-900 bg-emerald-50 font-black text-emerald-950 text-sm">
                          <td colSpan="3" className="p-3 text-right uppercase tracking-wide">Net Payout to Farmer (शुद्ध देय राशि):</td>
                          <td className="p-3 text-right font-mono text-base font-black text-emerald-700">₹{netPayable.toLocaleString()}</td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>

              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 text-xs font-bold text-slate-500">
                <div>
                  <div>Farmer / Receiver Signature</div>
                  <div className="text-[10px] font-normal text-slate-400 mt-0.5">Payment credited via Bank Transfer / Cash</div>
                </div>
                <div className="text-right">
                  <div>For {tenant?.firm_name || 'ARHATPRO TRADING CO.'}</div>
                  <div className="text-[10px] font-normal text-slate-400 mt-0.5">Authorized Partner / Munshi Stamp</div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Form J */}
          {statutorySubTab === 'JFORM' && selectedStatutoryLot && (
            <div className="bg-white p-8 rounded-3xl border border-slate-300 shadow-lg max-w-3xl mx-auto space-y-6 text-slate-800 print:shadow-none print:border-none print:p-0">
              <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                <div className="text-xs font-bold text-slate-500 uppercase">FORM 'J' [See Rule 24(1)]</div>
                <div className="text-xl font-black uppercase tracking-wider text-slate-900">DELHI AGRICULTURAL PRODUCE MARKETING COMMITTEE</div>
                <div className="text-xs font-semibold text-slate-700">Sale Voucher of Agricultural Produce under APMC Act, 1998</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><span className="font-bold text-slate-500">Certificate No:</span> <span className="font-mono font-bold">JF-2026-{selectedStatutoryLot.id}</span></div>
                <div><span className="font-bold text-slate-500">Market Yard:</span> Azadpur Mandi, Delhi</div>
                <div><span className="font-bold text-slate-500">Farmer / Seller:</span> <span className="font-bold text-slate-900">{selectedStatutoryLot.farmer_name}</span></div>
                <div><span className="font-bold text-slate-500">Commission Agent:</span> {tenant?.firm_name || 'ARHATPRO TRADING CO.'} (Lic # {tenant?.apmc_license_no || 'B-4421'})</div>
              </div>

              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2.5">Name of Agricultural Produce</th>
                    <th className="p-2.5 text-center">No. of Bags / Weight</th>
                    <th className="p-2.5 text-right">Agreed Price (₹)</th>
                    <th className="p-2.5 text-right">Market Charges (₹)</th>
                    <th className="p-2.5 text-right">Net Value Paid (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 font-bold">{selectedStatutoryLot.commodity_name}</td>
                    <td className="p-2.5 text-center">{selectedStatutoryLot.total_quantity || 150} Bags</td>
                    <td className="p-2.5 text-right font-mono">₹2,85,000</td>
                    <td className="p-2.5 text-right font-mono text-rose-600">₹19,200</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-700">₹2,65,800</td>
                  </tr>
                </tbody>
              </table>

              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                I hereby certify that the agricultural produce mentioned above was sold in the market yard through open auction in my presence and the charges levied are strictly in accordance with APMC bye-laws.
              </div>

              <div className="pt-6 border-t border-slate-300 flex justify-between text-xs font-bold text-slate-500">
                <div>Seller / Farmer Signature: ________</div>
                <div>Secretary / Inspector, APMC: ________</div>
              </div>
            </div>
          )}

          {/* Sub-Tab 3: Form M Return */}
          {statutorySubTab === 'FORMM' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-300 shadow-lg max-w-3xl mx-auto space-y-6 text-slate-800 print:shadow-none print:border-none print:p-0">
              <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                <div className="text-xs font-bold text-slate-500 uppercase">FORM 'M' [See Rule 29(1)]</div>
                <div className="text-xl font-black uppercase tracking-wider text-slate-900">MONTHLY RETURN OF MARKET FEE &amp; RURAL DEVELOPMENT FUND</div>
                <div className="text-xs font-semibold text-slate-700">Office of the Secretary, APMC Azadpur, Delhi</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><span className="font-bold text-slate-500">Firm Name:</span> {tenant?.firm_name || 'ARHATPRO TRADING CO.'}</div>
                <div><span className="font-bold text-slate-500">Return Period:</span> {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
                <div><span className="font-bold text-slate-500">APMC License:</span> {tenant?.apmc_license_no || 'APMC-AZD-DEL-4421'}</div>
                <div><span className="font-bold text-slate-500">Filing Date:</span> {new Date().toLocaleDateString('en-IN')}</div>
              </div>

              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-center">Consignments</th>
                    <th className="p-2.5 text-right">Gross Turn (₹)</th>
                    <th className="p-2.5 text-right">APMC Fee @ 1%</th>
                    <th className="p-2.5 text-right">RDF @ 1%</th>
                    <th className="p-2.5 text-right">Total Cess (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 font-bold">Fruits (Apple, Kinnow, Mango)</td>
                    <td className="p-2.5 text-center">{filteredArrivals.length} Trucks</td>
                    <td className="p-2.5 text-right font-mono">₹24,50,000</td>
                    <td className="p-2.5 text-right font-mono">₹24,500</td>
                    <td className="p-2.5 text-right font-mono">₹24,500</td>
                    <td className="p-2.5 text-right font-mono font-bold">₹49,000</td>
                  </tr>
                  <tr className="font-black bg-slate-100 text-sm">
                    <td colSpan="2" className="p-2.5 uppercase">Consolidated Total:</td>
                    <td className="p-2.5 text-right font-mono">₹24,50,000</td>
                    <td className="p-2.5 text-right font-mono">₹24,500</td>
                    <td className="p-2.5 text-right font-mono">₹24,500</td>
                    <td className="p-2.5 text-right font-mono text-purple-900">₹49,000</td>
                  </tr>
                </tbody>
              </table>

              <div className="pt-6 border-t border-slate-300 flex justify-between text-xs font-bold text-slate-500">
                <div>Challan Ref: <b>CPN-2026-990812</b></div>
                <div>Authorized Signature &amp; Stamp</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          THERMAL 80MM BUYER PURCHA MODAL
      ========================================================================== */}
      {selectedPurcha && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono text-xs max-h-[90vh] overflow-y-auto border border-slate-300">
            {/* Modal Controls */}
            <div className="flex justify-between items-center border-b pb-3 print:hidden">
              <span className="font-bold text-slate-800 text-xs font-sans">Buyer Mandi Purcha (80mm Thermal)</span>
              <button onClick={() => setSelectedPurcha(null)} className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer">✕</button>
            </div>

            {/* Slip Printable Content */}
            <div className="space-y-3 text-slate-900">
              <div className="text-center space-y-0.5 border-b pb-2">
                <div className="font-black text-base uppercase">{tenant?.firm_name || 'ARHATPRO TRADING CO.'}</div>
                <div className="text-[10px] text-slate-600">{tenant?.mandi_name || 'APMC Azadpur, Delhi'} • Shop {tenant?.shop_no || 'C-42'}</div>
                <div className="text-[10px] text-slate-500">Lic: {tenant?.apmc_license_no || 'DL-APMC-09142'} • Ph: {tenant?.phone || '9811012345'}</div>
                <div className="text-[11px] font-black uppercase mt-1 bg-slate-100 py-0.5 rounded">
                  *** BUYER PURCHA / कच्चा पर्चा ***
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Purcha No:</span>
                  <span className="font-bold">{selectedPurcha.sale_code || selectedPurcha.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date &amp; Time:</span>
                  <span>{selectedPurcha.dateFormatted || 'Today'} {selectedPurcha.time || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Buyer Name:</span>
                  <span className="font-black text-slate-900">{selectedPurcha.buyer_name}</span>
                </div>
                {selectedPurcha.buyer_contact && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Buyer Phone:</span>
                    <span>{selectedPurcha.buyer_contact}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Farmer / Lot:</span>
                  <span>{selectedPurcha.farmer_name || 'Kisan'} ({selectedPurcha.lot_id || 'LOT'})</span>
                </div>
              </div>

              <table className="w-full text-[11px] border-t border-b border-dashed border-slate-400 py-1 my-2">
                <thead>
                  <tr className="border-b border-dashed border-slate-300 text-slate-500">
                    <th className="py-1 text-left">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Rate</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 font-bold">{selectedPurcha.commodity_name || 'Produce'}</td>
                    <td className="py-1 text-center font-bold">{selectedPurcha.quantity}</td>
                    <td className="py-1 text-right font-mono">₹{parseFloat(selectedPurcha.rate || 0).toLocaleString()}</td>
                    <td className="py-1 text-right font-mono font-bold">₹{selectedPurcha.gross?.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Produce Value (सकल):</span>
                  <span className="font-bold">₹{selectedPurcha.gross?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Buyer Dami @ 2.0%:</span>
                  <span>₹{selectedPurcha.dami?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Unloading / Palledari:</span>
                  <span>₹{(selectedPurcha.quantity * 2).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-sm border-t border-slate-900 pt-1">
                  <span>TOTAL PAYABLE:</span>
                  <span className="text-purple-900">₹{(selectedPurcha.netBill + (selectedPurcha.quantity * 2)).toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[9px] text-slate-500 leading-tight pt-1 border-t border-dashed border-slate-300">
                Payment due within 15 days as per APMC rules. Delayed payment incurs 18% p.a. interest.
              </div>

              <div className="flex justify-between pt-4 text-[10px] text-slate-600">
                <div>Buyer Signature</div>
                <div>Munshi Signature</div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-3 border-t print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold font-sans text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" /> Print 80mm Slip
              </button>
              <button
                onClick={() => setSelectedPurcha(null)}
                className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold font-sans text-xs text-slate-700 cursor-pointer"
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
