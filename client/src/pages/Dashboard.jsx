import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  Calendar,
  Compass,
  CheckCircle2,
  ChevronRight,
  Sun,
  Sunrise,
  Sunset,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const { t, isHindi } = useLanguage();

  const [arrivals, setArrivals] = useState([]);
  const [lots, setLots] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [cashbook, setCashbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [journeyView, setJourneyView] = useState('workflow'); // 'workflow' or 'clock'
  const [journeyDismissed, setJourneyDismissed] = useState(() => {
    return localStorage.getItem('mandi_journey_dismissed') === 'true';
  });

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

  const isNewUser = arrivals.length === 0 && lots.length === 0;

  // Journey Steps Calculation
  const journeySteps = [
    {
      step: 1,
      id: 'settings',
      title: t('Shop & Master Registry', 'दुकान व मास्टर सेटअप'),
      desc: t('APMC license, bank details, produce catalog, and farmer/buyer registry.', 'एपीएमसी लाइसेंस, बैंक विवरण, फसल सूची, और किसान/खरीदार सेटअप।'),
      icon: Building2,
      status: t('Setup Ready', 'तैयार'),
      isCompleted: true,
      actionText: t('Configure Masters', 'मास्टर सेट करें'),
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      step: 2,
      id: 'arrivals',
      title: t('Inward Truck Arrival', 'गाड़ी आवक व गेट पास'),
      desc: t('Record vehicle challan, gross weight, driver advance, and print Mandi Gate Pass.', 'गाड़ी चालान, वजन, चालक पेशगी दर्ज करें और गेट पास जारी करें।'),
      icon: Truck,
      status: arrivals.length > 0 ? (isHindi ? `${arrivals.length} गाड़ियाँ दर्ज` : `${arrivals.length} Trucks Logged`) : t('Ready to Log', 'दर्ज करने हेतु तैयार'),
      isCompleted: arrivals.length > 0,
      actionText: t('Log Truck (F3)', 'गाड़ी आवक (F3)'),
      badgeColor: arrivals.length > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
    },
    {
      step: 3,
      id: 'sales',
      title: t('Yard Auction & Bidding', 'यार्ड नीलामी व खुली बोली'),
      desc: t('Stack lots on yard, announce farmer marks, conduct open auction, and hammer sales.', 'यार्ड पर लॉट लगाएं, खुली नीलामी करवाएं और बोली पर माल बेचें।'),
      icon: Gavel,
      status: lots.length > 0 ? (isHindi ? `${activeLotsCount} सक्रिय लॉट` : `${activeLotsCount} Active Lots`) : t('Ready for Auction', 'नीलामी हेतु तैयार'),
      isCompleted: lots.length > 0,
      actionText: t('Start Bidding (F4)', 'बोली लगाएं (F4)'),
      badgeColor: lots.length > 0 ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-slate-100 text-slate-700 border-slate-200'
    },
    {
      step: 4,
      id: 'quick-trade',
      title: t('Unified Quick Trade', 'एकल सौदा (फास्ट लेन)'),
      desc: t('Single-form inward arrival, multi-buyer allocation, freight deduction & instant Teep.', 'एकल फॉर्म: आवक, खरीदार आवंटन, भाड़ा कटौती व तत्काल पक्का पर्चा।'),
      icon: Zap,
      status: t('1-Click Fast Lane', '1-क्लिक फास्ट लेन'),
      isCompleted: arrivals.length > 0,
      actionText: t('Quick Trade (F2)', 'एकल सौदा (F2)'),
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    {
      step: 5,
      id: 'reports',
      title: t('APMC Teep & Invoicing', 'पक्का टीप व कानूनी बिल'),
      desc: t('Generate statutory Form J for farmers, Form I for buyers, and print 80mm POS slips.', 'किसानों हेतु फॉर्म जे, खरीदारों हेतु फॉर्म आई व थर्मल पर्चा प्रिंट करें।'),
      icon: FileText,
      status: t('Statutory Form J/I', 'वैधानिक फॉर्म जे/आई'),
      isCompleted: true,
      actionText: t('Generate Bills', 'बिल तैयार करें'),
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200'
    },
    {
      step: 6,
      id: 'bahi-khata',
      title: t('Rokad Closing & Khatoni', 'रोकड़ मिलान व बहीखाता'),
      desc: t('Evening cashbook reconciliation, Naqad Jama/Banam, debtor recovery & ledger balancing.', 'संध्या रोकड़ मिलान, नकद जमा/बनाम, उधारी वसूली व बहीखाता संतुलन।'),
      icon: DollarSign,
      status: isHindi ? `₹${rokadClosing.toLocaleString()} हाथ में रोकड़` : `₹${rokadClosing.toLocaleString()} in Hand`,
      isCompleted: true,
      actionText: t('Open Bahi-Khata', 'बहीखाता खोलें'),
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    }
  ];

  const completedCount = journeySteps.filter(s => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / journeySteps.length) * 100);
  const allMilestonesDone = completedCount >= journeySteps.length;
  const shouldShowJourney = !allMilestonesDone && !journeyDismissed;

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
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              Start Quick Trade (F2)
            </button>
            <button
              onClick={() => setActiveTab('arrivals')}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              Inward Truck (F3)
            </button>
          </div>
        </div>
      </div>

      {/* Milestone Completion & Dismissal Indicator */}
      {(allMilestonesDone || journeyDismissed) && (
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-slate-800">
              {allMilestonesDone ? t('🎉 All Mandi Milestones Completed', '🎉 सभी मंडी चरण पूर्ण') : t('Trading Milestones Section Hidden', 'व्यापारिक चरण सूची छुपाई गई')}
            </span>
            <span className="text-slate-400 font-mono">({completedCount}/{journeySteps.length} {t('Milestones', 'चरण')})</span>
          </div>
          <button
            onClick={() => {
              const nextState = !journeyDismissed;
              setJourneyDismissed(nextState);
              localStorage.setItem('mandi_journey_dismissed', nextState.toString());
            }}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
          >
            {journeyDismissed ? t('Show Milestones Journey', 'चरण सूची देखें') : t('Hide Milestones', 'चरण सूची छुपाएं')}
          </button>
        </div>
      )}

      {/* 2. New User Onboarding Highlight (Shown if workspace has no transactions yet) */}
      {isNewUser && (
        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border-2 border-emerald-500/30 p-5 rounded-3xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md">
                🌱
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">
                  {t('Welcome to Your Fresh Mandi Workspace!', 'आपके नए मंडी कार्यक्षेत्र में स्वागत है!')}
                </h3>
                <p className="text-xs text-slate-600">
                  {t('Follow your step-by-step Mandi Trading Journey below. You can start directly with a fresh Quick Trade or configure your Shop Masters.', 'नीचे दिए गए चरणों का पालन करें। आप सीधे एकल सौदा दर्ज कर सकते हैं या दुकान का मास्टर सेटअप कर सकते हैं।')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('quick-trade')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                {t('Fresh Quick Trade →', 'नया एकल सौदा →')}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer"
              >
                {t('Setup Masters →', 'मास्टर सेटअप →')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Mandi Trading User Journey & Workflow (Hidden once milestones done or dismissed) */}
      {shouldShowJourney && (
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Compass className="w-4 h-4" />
              </span>
              <h2 className="text-base font-black text-slate-900">
                {t('Mandi Trading User Journey', 'मंडी व्यापारिक यात्रा')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                {progressPercent}% {t('Complete', 'पूर्ण')}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {t('Guided end-to-end trading workflow: From morning truck arrival and yard lot hammer to instant settlement and evening rokad balancing.', 'गाड़ी आवक से लेकर खुली नीलामी, तत्काल बिलिंग और संध्या रोकड़ मिलान तक की संपूर्ण व्यापारिक यात्रा।')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold text-slate-600">
              <button
                onClick={() => setJourneyView('workflow')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  journeyView === 'workflow'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('Workflow Steps', 'कार्यप्रवाह चरण')}
              </button>
              <button
                onClick={() => setJourneyView('clock')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  journeyView === 'clock'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('Mandi Clock', 'मंडी समय चक्र')}
              </button>
            </div>
            <button
              onClick={() => {
                setJourneyDismissed(true);
                localStorage.setItem('mandi_journey_dismissed', 'true');
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              title="Hide milestone section from dashboard"
            >
              ✕ {t('close')}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">{t('Mandi Workflow Readiness', 'मंडी कार्यप्रवाह तैयारी')}</span>
            <span className="font-mono font-bold text-emerald-700">{completedCount} {t('of', 'में से')} {journeySteps.length} {t('Milestones Active', 'चरण सक्रिय')}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Workflow View */}
        {journeyView === 'workflow' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {journeySteps.map((step) => {
              const IconComp = step.icon;
              return (
                <div
                  key={step.step}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between group space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center justify-center font-mono">
                          {step.step}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${step.badgeColor}`}>
                          {step.status}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-white text-slate-700 border border-slate-200 flex items-center justify-center group-hover:scale-110 group-hover:text-emerald-700 transition-transform">
                        <IconComp className="w-4 h-4" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab(step.id)}
                    className="w-full py-2 bg-white hover:bg-emerald-600 hover:text-white text-slate-800 font-bold text-xs rounded-xl border border-slate-200 hover:border-emerald-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>{step.actionText}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* Mandi Operating Clock View */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Phase 1 */}
            <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3">
              <div className="flex items-center gap-2 text-amber-800">
                <Sunrise className="w-5 h-5" />
                <span className="font-black text-xs uppercase tracking-wider">Phase 1: Early Morning (4:00 AM – 8:00 AM)</span>
              </div>
              <h4 className="font-black text-slate-900 text-sm">Inward Consignments & Lot Stacking</h4>
              <p className="text-xs text-slate-600">
                Truck arrivals from agricultural belts, driver freight advance, weighbridge slip, Gate Pass issue, crate grading, and sample lot display on yard.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('arrivals')}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Log Truck Arrival (F3) →
                </button>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-3">
              <div className="flex items-center gap-2 text-purple-800">
                <Sun className="w-5 h-5" />
                <span className="font-black text-xs uppercase tracking-wider">Phase 2: Midday (8:00 AM – 1:00 PM)</span>
              </div>
              <h4 className="font-black text-slate-900 text-sm">Open Bidding & Quick Trades</h4>
              <p className="text-xs text-slate-600">
                High-energy yard auction, buyer price bidding, hammer lot split allocation, and unified single-form Quick Trades with automatic commission and palledari deduction.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('sales')}
                  className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Start Yard Bidding (F4) →
                </button>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <Sunset className="w-5 h-5" />
                <span className="font-black text-xs uppercase tracking-wider">Phase 3: Evening (2:00 PM – 7:00 PM)</span>
              </div>
              <h4 className="font-black text-slate-900 text-sm">Billing, Rokad & Ledger Khatoni</h4>
              <p className="text-xs text-slate-600">
                Printing statutory APMC Form J / Form I Teep, collection of Naqad Jama / Banam, cash-in-hand tally, and double-entry general ledger reconciliation.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('bahi-khata')}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Open Rokad Cashbook (F5) →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* 4. Quick Action Buttons Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>{t('⚡ Lightning Quick Actions', '⚡ त्वरित कार्य')}</span>
          <span className="text-[11px] font-normal text-slate-400">{t('Click any action to execute immediately', 'तत्काल निष्पादन हेतु किसी भी विकल्प पर क्लिक करें')}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setActiveTab('quick-trade')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/60 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs">{t('quick_trade')}</div>
            <div className="text-[10px] text-slate-500">{t('Instant Entry (F2)', 'त्वरित प्रविष्टि (F2)')}</div>
          </button>

          <button
            onClick={() => setActiveTab('arrivals')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/60 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs">{t('arrivals')}</div>
            <div className="text-[10px] text-slate-500">{t('Gate Pass (F3)', 'गेट पास (F3)')}</div>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/60 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Gavel className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs">{t('sales')}</div>
            <div className="text-[10px] text-slate-500">{t('Yard Bidding (F4)', 'यार्ड बोली (F4)')}</div>
          </button>

          <button
            onClick={() => setActiveTab('bahi-khata')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/60 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs">{t('Record Rokad', 'रोकड़ प्रविष्टि')}</div>
            <div className="text-[10px] text-slate-500">{t('Cash In / Out', 'जमा व नाम')}</div>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-rose-500 bg-slate-50 hover:bg-rose-50/60 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs">{t('APMC Teep / Bill', 'पक्का टीप व पर्चा')}</div>
            <div className="text-[10px] text-slate-500">{t('Legal Bills', 'कानूनी बिल')}</div>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-500 bg-slate-50 hover:bg-slate-100 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs">{t('Add Master Party', 'नया व्यापारी / किसान')}</div>
            <div className="text-[10px] text-slate-500">{t('Buyer / Farmer', 'थोक खरीदार / किसान')}</div>
          </button>
        </div>
      </div>

      {/* 5. Core KPI Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Consignments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>{t('Inward Consignments', 'गाड़ी आवक')}</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {arrivals.length} <span className="text-sm font-semibold text-slate-500">{t('Trucks', 'गाड़ियाँ')}</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>{t('Total Inward Bags:', 'कुल आवक नग:')}</span>
            <span className="font-bold text-slate-800">{totalInwardBags.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 2: Live Produce on Yard */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>{t('Live Produce on Yard', 'यार्ड पर कुल माल')}</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {totalRemainingBags.toLocaleString()} <span className="text-sm font-semibold text-slate-500">{t('Bags', 'नग/बोरी')}</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>{t('Active Auction Lots:', 'सक्रिय नीलामी लॉट:')}</span>
            <span className="font-bold text-emerald-700">{activeLotsCount} {t('of', 'में से')} {totalLotsCount} {t('Lots', 'लॉट')}</span>
          </div>
        </div>

        {/* Card 3: Rokad Cash in Hand */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>{t('Rokad Cash in Hand', 'हाथ में कुल रोकड़')}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            ₹{rokadClosing.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>{t('Counter Cashbook:', 'रोकड़ बही मिलान:')}</span>
            <span className="text-emerald-700 font-semibold font-mono">{t('Balanced', 'संतुलित')}</span>
          </div>
        </div>

        {/* Card 4: Outstanding Udhaar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>{t('Debtors Outstanding', 'कुल बकाया उधारी')}</span>
            <TrendingUp className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            ₹{totalOutstanding.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>{t('15+ Days Overdue:', '15+ दिन से अधिक बकाया:')}</span>
            <span className="font-bold text-rose-700">{overdueAccounts.length} {t('Buyers', 'खरीदार')}</span>
          </div>
        </div>
      </div>

      {/* 6. Yard Auction Snapshot & Recent Arrivals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Lots on Mandi Yard */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gavel className="w-4 h-4 text-purple-700" />
              <h3 className="font-bold text-slate-900 text-sm">{t('Active Auction Lots on Yard', 'मंडी यार्ड पर सक्रिय लॉट')}</h3>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {t('View All Lots', 'सभी लॉट देखें')} ({lots.length}) →
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-96">
            {lots.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                {t('No active lots on the yard yet. Log an inward truck or run a Quick Trade to begin.', 'यार्ड पर अभी कोई सक्रिय लॉट नहीं है। शुरुआत हेतु गाड़ी आवक दर्ज करें या एकल सौदा चलाएं।')}
              </div>
            ) : (
              lots.slice(0, 5).map((lot) => {
                const totalB = lot.total_bags || lot.bags || 1;
                const remB = lot.remaining_bags !== undefined ? lot.remaining_bags : totalB;
                const percentRemaining = Math.round((remB / totalB) * 100);
                const isSoldOut = remB === 0;

                return (
                  <div key={lot.id} className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {lot.lot_number || lot.id}
                        </span>
                        <span className="font-bold text-slate-900 text-sm truncate">{lot.commodity_name || 'Standard Produce'}</span>
                        {isSoldOut ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                            {t('Sold Out', 'बिक चुका')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                            {t('Live Yard', 'यार्ड लॉट')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {t('Farmer', 'किसान')}: <strong className="text-slate-700">{lot.farmer_name}</strong> • {t('Truck', 'गाड़ी')}: {lot.truck_no}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="font-black text-sm text-slate-900 font-mono">
                          {remB} <span className="text-xs font-normal text-slate-400">/ {totalB}</span>
                        </div>
                        <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${isSoldOut ? 'bg-emerald-500' : 'bg-purple-600'}`}
                            style={{ width: `${Math.min(100, Math.max(0, 100 - percentRemaining))}%` }}
                          />
                        </div>
                      </div>

                      {!isSoldOut && (
                        <button
                          onClick={() => setActiveTab('sales')}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                        >
                          {t('Hammer 🔨', 'बोली 🔨')}
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
            <span>{t('APMC Statutory Rates & Bye-Laws', 'मंडी कानून व निर्धारित दरें')}</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600 font-medium">{t('Commission / Arhat (6%)', 'आढ़त / कमीशन (6%)')}</span>
              <span className="font-mono font-bold text-emerald-700">6.0%</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600 font-medium">{t('Buyer Dami (2%)', 'खरीदार दामी (2%)')}</span>
              <span className="font-mono font-bold text-blue-700">2.0%</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600 font-medium">APMC Cess + RDF</span>
              <span className="font-mono font-bold text-slate-800">1.0% + 1.0%</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600 font-medium">{t('Palledari / Box Unloading', 'पल्लेदारी / नग उतराई')}</span>
              <span className="font-mono font-bold text-amber-700">₹3 / Box</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
              <span className="font-medium">{t('15-Day Late Payment Interest', '15-दिन उपरांत विलंब ब्याज')}</span>
              <span className="font-mono font-black text-rose-700">18.0% p.a.</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab('settings')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {t('Configure Agency Rates →', 'एजेंसी दरें सेट करें →')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
