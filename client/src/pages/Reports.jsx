import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { language, t } = useLanguage();

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
  const [purchaFormat, setPurchaFormat] = useState('LETTERPAD'); // 'LETTERPAD' or 'THERMAL'

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
              {t('Mandi Commercial & Statutory Reports', 'मंडी व्यापारिक व कानूनी रिपोर्ट')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('Buyer purcha vouchers, party ledgers, grower arrival registers, and APMC statutory Form J / Form M returns.', 'खरीदार पर्चा वाउचर, लेजर, किसान आवक रजिस्टर, और एपीएमसी वैधानिक फॉर्म जे / फॉर्म एम रिटर्न।')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Download CSV for Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            {t('Export CSV', 'एक्सेल निर्यात')}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            {t('Print Report', 'रिपोर्ट प्रिंट करें')}
          </button>
        </div>
      </div>

      {/* 2. Global Date Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Date Range Inputs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" /> {t('Date Filter:', 'दिनांक फ़िल्टर:')}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">{t('From', 'से')}</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">{t('To', 'तक')}</span>
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
              {t('Today', 'आज')}
            </button>
            <button
              onClick={() => setDatePreset('YESTERDAY')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
            >
              {t('Yesterday', 'कल')}
            </button>
            <button
              onClick={() => setDatePreset('LAST_7_DAYS')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
            >
              {t('7 Days', '7 दिन')}
            </button>
            <button
              onClick={() => setDatePreset('THIS_MONTH')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
            >
              {t('This Month', 'इस माह')}
            </button>
            <button
              onClick={() => setDatePreset('ALL')}
              className={`px-2.5 py-1 font-bold text-[11px] rounded-lg transition-colors cursor-pointer ${
                !fromDate && !toDate ? 'bg-emerald-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {t('All Dates', 'सभी तिथियां')}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('Search party, truck, commodity...', 'पार्टी, गाड़ी, जिंस खोजें...')}
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
              <span className="font-bold text-emerald-800">{t('Filtered View:', 'फ़िल्टर दृश्य:')}</span>
              {fromDate && <span>{t('From', 'से')}: <strong>{fromDate}</strong></span>}
              {toDate && <span>{t('To', 'तक')}: <strong>{toDate}</strong></span>}
              {searchTerm && <span>{t('Search', 'खोज')}: <strong>"{searchTerm}"</strong></span>}
            </div>
            <button
              onClick={() => { setFromDate(''); setToDate(''); setSearchTerm(''); }}
              className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> {t('Reset Filter', 'फ़िल्टर हटाएं')}
            </button>
          </div>
        )}
      </div>

      {/* 3. Report Category Selector Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 gap-1 pb-1 print:hidden">
        {[
          { id: 'BUYER_PURCHA', labelEn: 'Buyer Purcha', labelHi: 'खरीदार पर्चा', icon: Receipt },
          { id: 'BUYER_BALANCE', labelEn: 'Buyer Balance', labelHi: 'खरीदार बकाया', icon: DollarSign },
          { id: 'GROWER_BALANCE', labelEn: 'Grower Balance', labelHi: 'किसान बकाया व भुगतान', icon: Users },
          { id: 'BUYER_SUMMARY', labelEn: 'Buyer Summary', labelHi: 'खरीदार सारांश', icon: TrendingUp },
          { id: 'GROWER_SUMMARY', labelEn: 'Grower Summary', labelHi: 'किसान सारांश', icon: Package },
          { id: 'GROWER_ARRIVAL', labelEn: 'Grower Arrival', labelHi: 'गाड़ी आवक रजिस्टर', icon: Truck },
          { id: 'STATUTORY', labelEn: 'APMC Legal Forms', labelHi: 'पक्का टीप व जे-फॉर्म', icon: ShieldCheck }
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
                <div>{language === 'hi' ? tab.labelHi : tab.labelEn}</div>
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
              <h3 className="text-sm font-bold text-slate-900">{t('Buyer Purcha Register', 'खरीदार नीलामी पर्चा रजिस्टर')}</h3>
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
          REPORT 2: BUYER BALANCE REPORT (Udhaar Bahi)
      ========================================================================== */}
      {activeReport === 'BUYER_BALANCE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('Buyer Balance & Aging Report', 'खरीदार उधारी बहीखाता')}</h3>
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
          REPORT 3: GROWER / KISAN BALANCE REPORT
      ========================================================================== */}
      {activeReport === 'GROWER_BALANCE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('Grower / Kisan Balance Report', 'किसान बकाया व भुगतान रिपोर्ट')}</h3>
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
          REPORT 4: BUYER SUMMARY
      ========================================================================== */}
      {activeReport === 'BUYER_SUMMARY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('Buyer Trading Summary', 'खरीदार संक्षेप रिपोर्ट')}</h3>
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
          REPORT 5: GROWER SUMMARY
      ========================================================================== */}
      {activeReport === 'GROWER_SUMMARY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('Grower / Producer Summary', 'किसान आवक-बिक्री सारांश')}</h3>
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
          REPORT 6: GROWER ARRIVAL
      ========================================================================== */}
      {activeReport === 'GROWER_ARRIVAL' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('Grower Inward Arrival Register', 'गाड़ी आवक रजिस्टर')}</h3>
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
                { id: 'TEEP', labelEn: 'Consignor Sealed Teep', labelHi: 'पक्का टीप (Teep)' },
                { id: 'JFORM', labelEn: 'Farmer Form J', labelHi: 'जे-फॉर्म (Form J)' },
                { id: 'FORMM', labelEn: 'APMC Form M', labelHi: 'मासिक रिटर्न (Form M)' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setStatutorySubTab(sub.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    statutorySubTab === sub.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {language === 'hi' ? sub.labelHi : sub.labelEn}
                </button>
              ))}
            </div>

            {/* Controls: Select Lot & Print */}
            <div className="flex items-center gap-2">
              {statutorySubTab !== 'FORMM' && lots.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-500">Lot:</span>
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
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer print:hidden transition-all"
                title="Print official letterpad document"
              >
                <Printer className="w-3.5 h-3.5" /> {t('Print Letterpad', 'प्रिंट लेटरपैड')}
              </button>
            </div>
          </div>

          {/* Sub-Tab 1: Consignor Sealed Teep Preview on Mandi Agency Letterpad */}
          {statutorySubTab === 'TEEP' && selectedStatutoryLot && (
            <div className="bg-white p-8 sm:p-10 rounded-3xl border-4 border-double border-slate-900 shadow-xl max-w-3xl mx-auto space-y-5 text-slate-800 print:shadow-none print:border-4 print:border-slate-900 print:p-6 print:m-0 print:max-w-none print:w-full">
              
              {/* Invocations */}
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 border-b border-slate-300 pb-1 px-1">
                <span>॥ श्री गणेशाय नमः ॥</span>
                <span>॥ शुभ लाभ ॥</span>
                <span>॥ ॐ नमो भगवते वासुदेवाय नमः ॥</span>
              </div>

              {/* Letterhead Top Row */}
              <div className="flex items-start justify-between gap-4 pt-1">
                {/* Logo */}
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl shadow-sm border-2 border-slate-400 overflow-hidden shrink-0"
                  style={{ backgroundColor: 'var(--primary-dark, #0f172a)', color: '#ffffff' }}
                >
                  {tenant?.logo_url ? (
                    <img src={tenant.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span>{tenant?.logo_icon || '🍎'}</span>
                  )}
                </div>

                {/* Firm Details (Center) */}
                <div className="text-center flex-1 space-y-0.5 min-w-0">
                  <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
                    {tenant?.hindi_name || 'श्री गणेश फ्रूट कंपनी'}
                  </div>
                  <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                    {tenant?.firm_name || 'SHREE GANESH FRUIT COMPANY'}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    {t('COMMISSION AGENT & GENERAL ORDER SUPPLIERS', 'थोक आढ़ती एवं कमीशन एजेंट')}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                    {tenant?.shop_no || 'Shop No. C-42'}, {tenant?.mandi_name || 'New Subzi Mandi, Azadpur, Delhi-110033'}
                  </div>
                </div>

                {/* Statutory Numbers (Right) */}
                <div className="text-right text-[10px] font-mono space-y-0.5 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-300">
                  <div><span className="text-slate-500">APMC Lic:</span> <span className="font-bold text-slate-900">{tenant?.apmc_license_no || 'DL-APMC-09142'}</span></div>
                  <div><span className="text-slate-500">GSTIN:</span> <span className="font-bold text-slate-900">{tenant?.gstin || '07AAAAA0000A1Z5'}</span></div>
                  <div><span className="text-slate-500">Phone:</span> <span className="font-bold text-slate-900">{tenant?.phone || '+91 98110 23456'}</span></div>
                  {tenant?.proprietor && <div><span className="text-slate-500">Prop:</span> <span className="font-bold text-slate-900">{tenant.proprietor}</span></div>}
                </div>
              </div>

              {/* Banking & Digital UPI Band */}
              <div className="bg-slate-50 border-t border-b border-slate-300 py-1.5 px-3 text-[10px] font-mono flex flex-wrap justify-between items-center text-slate-700 rounded-lg">
                <span><b>🏦 Bank:</b> {tenant?.bank_name || 'State Bank of India'} (A/C: {tenant?.account_no || '30492819201'})</span>
                <span><b>IFSC:</b> {tenant?.ifsc || 'SBIN0001234'}</span>
                <span className="text-emerald-800 font-bold"><b>⚡ UPI:</b> {tenant?.upi_id || 'mandi@upi'}</span>
              </div>

              {/* Title Banner */}
              <div className="text-center">
                <span className="inline-block px-5 py-1 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-xs">
                  {t('CONSIGNOR ACCOUNT SALE (TEEP)', 'पक्का टीप (कृषक विक्रय हिसाब पर्चा)')}
                </span>
              </div>

              {/* Consignor Particulars */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div><span className="font-bold text-slate-500">{t('Consignor / Farmer:', 'किसान:')}</span> <span className="font-black text-slate-900 text-sm ml-1">{selectedStatutoryLot.farmer_name}</span></div>
                  <div><span className="font-bold text-slate-500">{t('Origin / Village:', 'मूल स्थान:')}</span> <span className="ml-1">{selectedStatutoryLot.farmer_location || 'Himachal / Kashmir / Punjab'}</span></div>
                  <div><span className="font-bold text-slate-500">{t('Truck / Vehicle No:', 'गाड़ी नं:')}</span> <span className="font-mono font-bold ml-1">{selectedStatutoryLot.truck_no || 'DL-01-AB-8899'}</span></div>
                </div>
                <div className="space-y-1 text-right">
                  <div><span className="font-bold text-slate-500">{t('Teep Slip No:', 'टीप क्रमांक:')}</span> <span className="font-mono font-black text-purple-800 ml-1">TP-{selectedStatutoryLot.lot_number || selectedStatutoryLot.id}</span></div>
                  <div><span className="font-bold text-slate-500">{t('Arrival Date:', 'आवक तिथि:')}</span> <span className="ml-1">{new Date(selectedStatutoryLot.created_at || Date.now()).toLocaleDateString('en-IN')}</span></div>
                  <div><span className="font-bold text-slate-500">{t('Settlement Date:', 'भुगतान तिथि:')}</span> <span className="ml-1">{new Date().toLocaleDateString('en-IN')}</span></div>
                </div>
              </div>

              {/* Calculation Table */}
              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2.5">{t('Commodity / Produce', 'जिंस')}</th>
                    <th className="p-2.5 text-center">{t('Bags / Crates', 'नग')}</th>
                    <th className="p-2.5 text-right">{t('Auction Rate', 'औसत दर')}</th>
                    <th className="p-2.5 text-right">{t('Gross Amount', 'सकल राशि')}</th>
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
                          <td className="p-2.5 font-bold text-slate-900">{selectedStatutoryLot.commodity_name}</td>
                          <td className="p-2.5 text-center font-bold font-mono">{bags}</td>
                          <td className="p-2.5 text-right font-mono">₹{estRate.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-mono font-bold">₹{gross.toLocaleString()}</td>
                        </tr>
                        <tr className="bg-slate-50 font-bold">
                          <td colSpan="3" className="p-2.5 text-right uppercase tracking-wider">{t('Gross Produce Value:', 'सकल मूल्य:')}</td>
                          <td className="p-2.5 text-right font-mono text-sm font-black">₹{gross.toLocaleString()}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <td colSpan="4" className="p-2 bg-slate-100 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                            {t('Statutory Mandi Deductions', 'अधिकृत कटौती विवरण')}
                          </td>
                        </tr>
                        <tr className="text-slate-600">
                          <td colSpan="3" className="px-2.5 py-1">{t('Freight Advance paid to Driver:', 'गाड़ी भाड़ा अग्रिम:')}</td>
                          <td className="px-2.5 py-1 text-right font-mono text-slate-900">₹{freightAdvance.toLocaleString()}</td>
                        </tr>
                        <tr className="text-slate-600">
                          <td colSpan="3" className="px-2.5 py-1">{t('Palledari / Unloading Labor @ ₹3/bag:', 'हमाली / पल्लेदारी @ ₹3:')}</td>
                          <td className="px-2.5 py-1 text-right font-mono text-slate-900">₹{unloading.toLocaleString()}</td>
                        </tr>
                        <tr className="text-slate-600">
                          <td colSpan="3" className="px-2.5 py-1">{t('Commission / Arhat @ 6.0%:', 'आढ़त कमीशन @ 6.0%:')}</td>
                          <td className="px-2.5 py-1 text-right font-mono text-slate-900">₹{commission.toLocaleString()}</td>
                        </tr>
                        <tr className="text-slate-600">
                          <td colSpan="3" className="px-2.5 py-1">{t('APMC Market Fee Cess @ 1.0%:', 'मंडी शुल्क @ 1.0%:')}</td>
                          <td className="px-2.5 py-1 text-right font-mono text-slate-900">₹{apmcFee.toLocaleString()}</td>
                        </tr>
                        <tr className="border-t border-slate-300 font-bold text-rose-700 bg-rose-50/50">
                          <td colSpan="3" className="p-2.5 text-right uppercase">{t('Total Deductions:', 'कुल कटौती:')}</td>
                          <td className="p-2.5 text-right font-mono text-sm">₹{totalDeductions.toLocaleString()}</td>
                        </tr>
                        <tr className="border-t-2 border-slate-900 bg-emerald-50 font-black text-emerald-950 text-sm">
                          <td colSpan="3" className="p-3 text-right uppercase tracking-wide">{t('Net Payout to Farmer:', 'किसान को शुद्ध देय राशि:')}</td>
                          <td className="p-3 text-right font-mono text-base font-black text-emerald-700">₹{netPayable.toLocaleString()}</td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>

              {/* Signatures & Bank Acknowledgement */}
              <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 text-xs font-bold text-slate-600">
                <div className="space-y-1">
                  <div>Farmer / Receiver Signature: __________________</div>
                  <div className="text-[10px] font-normal text-slate-400">Payment credited via Bank RTGS / NEFT / Mandi Cash</div>
                </div>
                <div className="text-right space-y-1">
                  <div>For {tenant?.firm_name || 'SHREE GANESH FRUIT CO.'}</div>
                  <div className="text-[10px] font-normal text-slate-400">Authorized Partner / Munshi Stamp &amp; Sign</div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 2: APMC Form 'J' on Mandi Agency Letterpad */}
          {statutorySubTab === 'JFORM' && selectedStatutoryLot && (
            <div className="bg-white p-8 sm:p-10 rounded-3xl border-4 border-double border-slate-900 shadow-xl max-w-3xl mx-auto space-y-5 text-slate-800 print:shadow-none print:border-4 print:border-slate-900 print:p-6 print:m-0 print:max-w-none print:w-full">
              
              {/* Invocations */}
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 border-b border-slate-300 pb-1 px-1">
                <span>॥ श्री गणेशाय नमः ॥</span>
                <span>॥ सत्यमेव जयते ॥</span>
                <span>॥ APMC ACT, 1998 ॥</span>
              </div>

              {/* Letterhead Top Row */}
              <div className="flex items-start justify-between gap-4 pt-1">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl shadow-sm border-2 border-slate-400 overflow-hidden shrink-0"
                  style={{ backgroundColor: 'var(--primary-dark, #0f172a)', color: '#ffffff' }}
                >
                  {tenant?.logo_url ? (
                    <img src={tenant.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span>{tenant?.logo_icon || '⚖️'}</span>
                  )}
                </div>

                <div className="text-center flex-1 space-y-0.5 min-w-0">
                  <div className="text-xl sm:text-2xl font-black text-slate-950 uppercase">
                    DELHI AGRICULTURAL PRODUCE MARKETING COMMITTEE
                  </div>
                  <div className="text-xs sm:text-sm font-black uppercase text-slate-800">
                    {tenant?.firm_name || 'SHREE GANESH FRUIT COMPANY'}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-600">
                    {t('LICENSED COMMISSION AGENT (LIC NO. ' + (tenant?.apmc_license_no || 'DL-APMC-09142') + ')', 'कमीशन एजेंट (लाइसेंस नं. ' + (tenant?.apmc_license_no || 'DL-APMC-09142') + ')')}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Market Yard: {tenant?.mandi_name || 'New Subzi Mandi, Azadpur, Delhi-110033'} • Shop {tenant?.shop_no || 'C-42'}
                  </div>
                </div>

                <div className="text-right text-[10px] font-mono space-y-0.5 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-300">
                  <div><span className="text-slate-500">Cert No:</span> <span className="font-bold text-slate-900">JF-2026-{selectedStatutoryLot.id}</span></div>
                  <div><span className="text-slate-500">Date:</span> <span className="font-bold text-slate-900">{new Date().toLocaleDateString('en-IN')}</span></div>
                  <div><span className="text-slate-500">GSTIN:</span> <span className="font-bold text-slate-900">{tenant?.gstin || '07AAAAA0000A1Z5'}</span></div>
                </div>
              </div>

              {/* Title Banner */}
              <div className="text-center">
                <span className="inline-block px-5 py-1 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-xs">
                  {t("FORM 'J' [See Rule 24(1)] SALE VOUCHER", "प्रपत्र 'जे' [नियम 24(1)] कृषि उपज विक्रय प्रमाण पत्र")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div><span className="font-bold text-slate-500">{t('Seller / Producer:', 'विक्रेता कृषक:')}</span> <span className="font-bold text-slate-900 ml-1">{selectedStatutoryLot.farmer_name}</span></div>
                <div><span className="font-bold text-slate-500">Origin / Belts:</span> <span className="ml-1">{selectedStatutoryLot.farmer_location || 'Himachal Pradesh'}</span></div>
                <div><span className="font-bold text-slate-500">Commission Agent:</span> <span className="font-bold text-slate-900 ml-1">{tenant?.firm_name} (Shop {tenant?.shop_no})</span></div>
                <div><span className="font-bold text-slate-500">Auction Reference:</span> <span className="font-mono font-bold ml-1">AUC-LOT-{selectedStatutoryLot.lot_number || selectedStatutoryLot.id}</span></div>
              </div>

              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2.5">Name of Agricultural Produce</th>
                    <th className="p-2.5 text-center">No. of Bags / Weight</th>
                    <th className="p-2.5 text-right">Agreed Auction Rate (₹)</th>
                    <th className="p-2.5 text-right">Statutory Charges (₹)</th>
                    <th className="p-2.5 text-right">Net Realized Value (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 font-bold">{selectedStatutoryLot.commodity_name}</td>
                    <td className="p-2.5 text-center font-mono font-bold">{selectedStatutoryLot.total_quantity || 150} Bags</td>
                    <td className="p-2.5 text-right font-mono">₹2,85,000</td>
                    <td className="p-2.5 text-right font-mono text-rose-700">₹19,200</td>
                    <td className="p-2.5 text-right font-mono font-black text-emerald-800 text-sm">₹2,65,800</td>
                  </tr>
                </tbody>
              </table>

              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <b>Statutory Declaration:</b> I hereby certify that the agricultural produce described above was weighed, inspected, and sold through open auction in the market yard strictly in accordance with Delhi Agricultural Produce Marketing (Regulation) Act, 1998 and bye-laws thereunder.
              </div>

              <div className="pt-6 border-t-2 border-slate-300 flex justify-between text-xs font-bold text-slate-600">
                <div>Seller / Farmer Signature: ________________</div>
                <div>Secretary / Inspector, APMC Azadpur: ________________</div>
              </div>
            </div>
          )}

          {/* Sub-Tab 3: Form 'M' Monthly Return on Mandi Agency Letterpad */}
          {statutorySubTab === 'FORMM' && (
            <div className="bg-white p-8 sm:p-10 rounded-3xl border-4 border-double border-slate-900 shadow-xl max-w-3xl mx-auto space-y-5 text-slate-800 print:shadow-none print:border-4 print:border-slate-900 print:p-6 print:m-0 print:max-w-none print:w-full">
              
              {/* Invocations */}
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 border-b border-slate-300 pb-1 px-1">
                <span>॥ श्री गणेशाय नमः ॥</span>
                <span>॥ APMC DELHI STATUTORY RETURN ॥</span>
                <span>॥ शुभम् ॥</span>
              </div>

              {/* Letterhead Top Row */}
              <div className="flex items-start justify-between gap-4 pt-1">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl shadow-sm border-2 border-slate-400 overflow-hidden shrink-0"
                  style={{ backgroundColor: 'var(--primary-dark, #0f172a)', color: '#ffffff' }}
                >
                  {tenant?.logo_url ? (
                    <img src={tenant.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span>{tenant?.logo_icon || '🏢'}</span>
                  )}
                </div>

                <div className="text-center flex-1 space-y-0.5 min-w-0">
                  <div className="text-xl sm:text-2xl font-black text-slate-950 uppercase">
                    OFFICE OF THE SECRETARY, APMC AZADPUR, DELHI
                  </div>
                  <div className="text-xs sm:text-sm font-black uppercase text-slate-800">
                    {tenant?.firm_name || 'SHREE GANESH FRUIT COMPANY'}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-600">
                    {t('MONTHLY RETURN OF MARKET FEE & RDF', 'मासिक मंडी शुल्क एवं आरडीएफ विवरणी')}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {tenant?.shop_no}, {tenant?.mandi_name} • APMC Lic: {tenant?.apmc_license_no || 'DL-APMC-09142'}
                  </div>
                </div>

                <div className="text-right text-[10px] font-mono space-y-0.5 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-300">
                  <div><span className="text-slate-500">Period:</span> <span className="font-bold text-slate-900">{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span></div>
                  <div><span className="text-slate-500">Filing Date:</span> <span className="font-bold text-slate-900">{new Date().toLocaleDateString('en-IN')}</span></div>
                  <div><span className="text-slate-500">Challan Ref:</span> <span className="font-bold text-slate-900">CPN-2026-990812</span></div>
                </div>
              </div>

              {/* Title Banner */}
              <div className="text-center">
                <span className="inline-block px-5 py-1 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-xs">
                  {t("FORM 'M' [See Rule 29(1)] MONTHLY RETURN", "प्रपत्र 'एम' [नियम 29(1)] मासिक मंडी शुल्क विवरणी")}
                </span>
              </div>

              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2.5">Category of Produce</th>
                    <th className="p-2.5 text-center">Consignments Inward</th>
                    <th className="p-2.5 text-right">Gross Turnover (₹)</th>
                    <th className="p-2.5 text-right">Market Fee @ 1%</th>
                    <th className="p-2.5 text-right">RDF @ 1%</th>
                    <th className="p-2.5 text-right">Total Cess Remitted (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 font-bold">Fruits &amp; Vegetables Produce</td>
                    <td className="p-2.5 text-center font-mono">{filteredArrivals.length} Trucks</td>
                    <td className="p-2.5 text-right font-mono font-bold">₹24,50,000</td>
                    <td className="p-2.5 text-right font-mono">₹24,500</td>
                    <td className="p-2.5 text-right font-mono">₹24,500</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-800">₹49,000</td>
                  </tr>
                  <tr className="font-black bg-slate-100 text-sm">
                    <td colSpan="2" className="p-2.5 uppercase">Consolidated Monthly Total:</td>
                    <td className="p-2.5 text-right font-mono">₹24,50,000</td>
                    <td className="p-2.5 text-right font-mono">₹24,500</td>
                    <td className="p-2.5 text-right font-mono">₹24,500</td>
                    <td className="p-2.5 text-right font-mono text-purple-900 font-black">₹49,000</td>
                  </tr>
                </tbody>
              </table>

              <div className="pt-6 border-t-2 border-slate-300 flex justify-between text-xs font-bold text-slate-600">
                <div>Challan Ref: <b>CPN-2026-990812 (Remitted Online)</b></div>
                <div>Authorized Signatory &amp; Commission Agent Stamp</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          BUYER MANDI PURCHA MODAL (DUAL VIEW: LETTERPAD & THERMAL 80MM)
      ========================================================================== */}
      {selectedPurcha && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-slate-300">
            {/* Modal Controls Bar */}
            <div className="flex flex-wrap justify-between items-center border-b pb-3 print:hidden gap-2">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPurchaFormat('LETTERPAD')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    purchaFormat === 'LETTERPAD'
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📄 {t('Letterpad Invoice', 'लेटरपैड पक्का पर्चा')}
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaFormat('THERMAL')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    purchaFormat === 'THERMAL'
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🧾 {t('80mm Thermal POS', '80mm थर्मल कच्चा पर्चा')}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> {t('Print', 'प्रिंट')}
                </button>
                <button onClick={() => setSelectedPurcha(null)} className="text-slate-400 hover:text-slate-700 text-lg p-1 cursor-pointer">✕</button>
              </div>
            </div>

            {/* FORMAT 1: AUTHENTIC MANDI LETTERPAD PURCHA */}
            {purchaFormat === 'LETTERPAD' ? (
              <div className="border-4 border-double border-slate-900 p-6 sm:p-8 rounded-2xl space-y-5 text-slate-900 bg-white print:border-4 print:border-slate-900 print:shadow-none print:p-6 print:m-0">
                {/* Invocations */}
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 border-b border-slate-300 pb-1 px-1">
                  <span>॥ श्री गणेशाय नमः ॥</span>
                  <span>॥ शुभ लाभ ॥</span>
                  <span>॥ ॐ ॥</span>
                </div>

                {/* Letterhead Top Row */}
                <div className="flex items-start justify-between gap-4 pt-1">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm border border-slate-300 overflow-hidden shrink-0"
                    style={{ backgroundColor: 'var(--primary-dark, #0f172a)', color: '#ffffff' }}
                  >
                    {tenant?.logo_url ? (
                      <img src={tenant.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span>{tenant?.logo_icon || '🍎'}</span>
                    )}
                  </div>

                  <div className="text-center flex-1 space-y-0.5 min-w-0">
                    <div className="text-xl sm:text-2xl font-black text-slate-950">
                      {tenant?.hindi_name || 'श्री गणेश फ्रूट कंपनी'}
                    </div>
                    <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                      {tenant?.firm_name || 'SHREE GANESH FRUIT COMPANY'}
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 uppercase">
                      {t('COMMISSION AGENT & GENERAL ORDER SUPPLIERS', 'थोक आढ़ती एवं कमीशन एजेंट')}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {tenant?.shop_no || 'Shop No. C-42'}, {tenant?.mandi_name || 'New Subzi Mandi, Azadpur, Delhi-110033'}
                    </div>
                  </div>

                  <div className="text-right text-[10px] font-mono space-y-0.5 shrink-0 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <div><span className="text-slate-500">APMC Lic:</span> <span className="font-bold">{tenant?.apmc_license_no || 'DL-APMC-09142'}</span></div>
                    <div><span className="text-slate-500">GSTIN:</span> <span className="font-bold">{tenant?.gstin || '07AAAAA0000A1Z5'}</span></div>
                    <div><span className="text-slate-500">Phone:</span> <span className="font-bold">{tenant?.phone || '+91 98110 23456'}</span></div>
                  </div>
                </div>

                {/* Banking Band */}
                <div className="bg-slate-50 border-t border-b border-slate-300 py-1 px-3 text-[10px] font-mono flex flex-wrap justify-between items-center text-slate-700 rounded">
                  <span><b>Bank:</b> {tenant?.bank_name || 'State Bank of India'} (A/C: {tenant?.account_no || '30492819201'})</span>
                  <span><b>IFSC:</b> {tenant?.ifsc || 'SBIN0001234'}</span>
                  <span className="text-emerald-800 font-bold"><b>UPI:</b> {tenant?.upi_id || 'mandi@upi'}</span>
                </div>

                {/* Banner */}
                <div className="text-center">
                  <span className="inline-block px-4 py-1 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-xs">
                    {t('BUYER MANDI INVOICE', 'खरीदार पक्का पर्चा')}
                  </span>
                </div>

                {/* Particulars */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <div><span className="font-bold text-slate-500">{t('Buyer Name:', 'खरीदार:')}</span> <span className="font-black text-slate-900 text-sm ml-1">{selectedPurcha.buyer_name}</span></div>
                    {selectedPurcha.buyer_contact && <div><span className="font-bold text-slate-500">{t('Contact / Phone:', 'फोन नं:')}</span> <span className="font-mono ml-1">{selectedPurcha.buyer_contact}</span></div>}
                    <div><span className="font-bold text-slate-500">{t('Farmer Lot:', 'किसान लॉट:')}</span> <span className="ml-1">{selectedPurcha.farmer_name || 'Kisan'} ({selectedPurcha.lot_id || 'LOT'})</span></div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div><span className="font-bold text-slate-500">{t('Purcha Slip No:', 'पर्चा नं:')}</span> <span className="font-mono font-black text-purple-900 ml-1">{selectedPurcha.sale_code || selectedPurcha.id}</span></div>
                    <div><span className="font-bold text-slate-500">{t('Date & Time:', 'दिनांक व समय:')}</span> <span className="ml-1">{selectedPurcha.dateFormatted || 'Today'} {selectedPurcha.time || ''}</span></div>
                    <div><span className="font-bold text-slate-500">{t('Payment Terms:', 'भुगतान अवधि:')}</span> <span className="font-bold text-slate-800 ml-1">15 Days Credit</span></div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-xs text-left border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">{t('Produce Description', 'जिंस विवरण')}</th>
                      <th className="p-2.5 text-center">{t('Bags / Crates', 'नग')}</th>
                      <th className="p-2.5 text-right">{t('Rate / Bag', 'भाव')}</th>
                      <th className="p-2.5 text-right">{t('Produce Amount', 'सकल राशि')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-2.5 font-bold text-slate-900">{selectedPurcha.commodity_name || 'Produce'}</td>
                      <td className="p-2.5 text-center font-bold font-mono">{selectedPurcha.quantity}</td>
                      <td className="p-2.5 text-right font-mono">₹{parseFloat(selectedPurcha.rate || 0).toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">₹{selectedPurcha.gross?.toLocaleString()}</td>
                    </tr>
                    <tr className="text-slate-600 bg-slate-50/50">
                      <td colSpan="3" className="px-2.5 py-1 text-right font-medium">{t('Buyer Dami @ 2.0%:', 'दामी @ 2.0%:')}</td>
                      <td className="px-2.5 py-1 text-right font-mono font-bold text-slate-900">₹{selectedPurcha.dami?.toLocaleString()}</td>
                    </tr>
                    <tr className="text-slate-600 bg-slate-50/50">
                      <td colSpan="3" className="px-2.5 py-1 text-right font-medium">{t('Loading & Palledari Charges:', 'हमाली एवं पल्लेदारी:')}</td>
                      <td className="px-2.5 py-1 text-right font-mono font-bold text-slate-900">₹{(selectedPurcha.quantity * 2).toLocaleString()}</td>
                    </tr>
                    <tr className="border-t-2 border-slate-900 bg-purple-50 font-black text-purple-950 text-sm">
                      <td colSpan="3" className="p-3 text-right uppercase tracking-wide">{t('Total Net Payable:', 'कुल देय राशि:')}</td>
                      <td className="p-3 text-right font-mono text-base font-black text-purple-900">
                        ₹{(selectedPurcha.netBill + (selectedPurcha.quantity * 2)).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Disclaimers & Signatures */}
                <div className="text-[10px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <b>Statutory Notice:</b> Payment is due strictly within 15 calendar days per Delhi Agricultural Produce Marketing (Regulation) Act. Overdue accounts attract 18% p.a. delayed interest. All disputes subject to APMC Azadpur jurisdiction.
                </div>

                <div className="pt-4 border-t-2 border-slate-300 flex justify-between text-xs font-bold text-slate-600">
                  <div>Buyer / Consignee Signature: ________________</div>
                  <div>For {tenant?.firm_name} (Munshi Stamp)</div>
                </div>
              </div>
            ) : (
              /* FORMAT 2: THERMAL 80MM POS RECEIPT */
              <div className="max-w-sm mx-auto space-y-3 font-mono text-xs text-slate-900 p-4 border border-dashed border-slate-300 rounded-2xl bg-white print:border-none print:p-0">
                <div className="text-center space-y-0.5 border-b pb-2">
                  <div className="font-black text-base uppercase">{tenant?.firm_name || 'ARHATPRO TRADING CO.'}</div>
                  <div className="text-[10px] text-slate-600">{tenant?.mandi_name || 'APMC Azadpur, Delhi'} • Shop {tenant?.shop_no || 'C-42'}</div>
                  <div className="text-[10px] text-slate-500">Lic: {tenant?.apmc_license_no || 'DL-APMC-09142'} • Ph: {tenant?.phone || '9811012345'}</div>
                  <div className="text-[11px] font-black uppercase mt-1 bg-slate-100 py-0.5 rounded">
                    {t('*** BUYER PURCHA ***', '*** खरीदार कच्चा पर्चा ***')}
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('Purcha No:', 'पर्चा नं:')}</span>
                    <span className="font-bold">{selectedPurcha.sale_code || selectedPurcha.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('Date & Time:', 'दिनांक:')}</span>
                    <span>{selectedPurcha.dateFormatted || 'Today'} {selectedPurcha.time || ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('Buyer Name:', 'खरीदार:')}</span>
                    <span className="font-black text-slate-900">{selectedPurcha.buyer_name}</span>
                  </div>
                  {selectedPurcha.buyer_contact && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('Buyer Phone:', 'फोन:')}</span>
                      <span>{selectedPurcha.buyer_contact}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('Farmer / Lot:', 'किसान / लॉट:')}</span>
                    <span>{selectedPurcha.farmer_name || 'Kisan'} ({selectedPurcha.lot_id || 'LOT'})</span>
                  </div>
                </div>

                <table className="w-full text-[11px] border-t border-b border-dashed border-slate-400 py-1 my-2">
                  <thead>
                    <tr className="border-b border-dashed border-slate-300 text-slate-500">
                      <th className="py-1 text-left">{t('Item', 'जिंस')}</th>
                      <th className="py-1 text-center">{t('Qty', 'नग')}</th>
                      <th className="py-1 text-right">{t('Rate', 'भाव')}</th>
                      <th className="py-1 text-right">{t('Total', 'कुल')}</th>
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
                    <span className="text-slate-600">{t('Produce Value:', 'सकल मूल्य:')}</span>
                    <span className="font-bold">₹{selectedPurcha.gross?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t('Buyer Dami @ 2.0%:', 'खरीदार दामी @ 2.0%:')}</span>
                    <span>₹{selectedPurcha.dami?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t('Unloading / Palledari:', 'पल्लेदारी / हमाली:')}</span>
                    <span>₹{(selectedPurcha.quantity * 2).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm border-t border-slate-900 pt-1">
                    <span>{t('TOTAL PAYABLE:', 'कुल देय:')}</span>
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
            )}

            {/* Modal Bottom Close */}
            <div className="flex justify-end pt-3 border-t print:hidden">
              <button
                onClick={() => setSelectedPurcha(null)}
                className="px-5 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-xs text-slate-700 cursor-pointer"
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
