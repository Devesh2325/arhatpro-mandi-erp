import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import { LanguageProvider, useLanguage, SUPPORTED_LANGUAGES } from './context/LanguageContext';
import Sidebar from './components/Sidebar';
import ImpersonationBanner from './components/ImpersonationBanner';
import AuthModal from './pages/AuthModal';
import Dashboard from './pages/Dashboard';
import QuickTrade from './pages/QuickTrade';
import Arrivals from './pages/Arrivals';
import Sales from './pages/Sales';
import BahiKhata from './pages/BahiKhata';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SuperAdmin from './pages/SuperAdmin';
import OnboardingModal from './components/OnboardingModal';
import LandingPage from './pages/LandingPage';
import { Menu, Sparkles, Languages, Crown, Zap, LogOut } from 'lucide-react';

const PLAN_STYLES = {
  Free:       { badge: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-400' },
  Starter:    { badge: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500' },
  Monthly:    { badge: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500' },
  Pro:        { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
  Yearly:     { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
  Enterprise: { badge: 'bg-purple-100 text-purple-800 border-purple-300', dot: 'bg-purple-500' },
};

function MandiApp() {
  const { user, isAuthenticated, loading, logout, isImpersonating } = useAuth();
  const { currentTenant, activeTenant, workspaceConfig, isOnboardingModalOpen, setIsOnboardingModalOpen } = useTenant();
  const { language, setLanguage, t } = useLanguage();
  const tenant = currentTenant || activeTenant;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      setActiveTab('super-admin');
    } else if (workspaceConfig?.primaryFlow) {
      setActiveTab(workspaceConfig.primaryFlow);
    } else {
      setActiveTab('dashboard');
    }
  }, [user, workspaceConfig?.primaryFlow]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-base font-bold tracking-wider uppercase">Loading ArhatPro Mandi ERP...</div>
        <div className="text-xs text-emerald-400 mt-1">Connecting to Relational SQL Database &amp; Express API</div>
      </div>
    );
  }

  // If not logged in, show modern public Mandi ERP Landing Page with CTAs & Onboarding
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'quick-trade':
        return <QuickTrade />;
      case 'arrivals':
        return <Arrivals />;
      case 'sales':
        return <Sales />;
      case 'bahi-khata':
        return <BahiKhata />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'super-admin':
        return user?.role === 'super_admin' ? <SuperAdmin /> : <Dashboard setActiveTab={setActiveTab} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased">
      {/* Impersonation Banner if active */}
      <ImpersonationBanner />

      {/* Main Layout: Sticky Sidebar on Left, Scrolling Main on Right */}
      <div className="flex flex-1 relative min-h-screen">
        
        {/* Responsive Sidebar (Sticky on md/lg, drawer on mobile) */}
        <div className={`fixed inset-y-0 left-0 z-40 md:sticky md:top-0 md:h-screen transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } transition-transform duration-200 ease-in-out shrink-0`}>
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setMobileMenuOpen(false);
            }}
          />
        </div>

        {/* Mobile backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          />
        )}

        {/* Main Scrolling Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Top Bar — Firm Identity, Buy Plan, Quick Actions */}
          <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-3 sm:px-6 shadow-xs gap-2">

            {/* LEFT: Mobile hamburger + Firm identity */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 shrink-0"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Firm logo + name + mandi details */}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black shadow-xs shrink-0 border border-slate-200"
                  style={{ backgroundColor: 'var(--primary-dark, #0f172a)', color: '#fff' }}
                >
                  {tenant?.logo_icon || '🍎'}
                </div>
                <div className="min-w-0">
                  <div className="font-black text-slate-900 text-sm leading-tight truncate max-w-[140px] sm:max-w-xs">
                    {tenant?.firm_name || 'ArhatPro Mandi'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate hidden sm:block">
                    {tenant?.shop_no && <span>{tenant.shop_no} • </span>}
                    {tenant?.mandi_name || 'Azadpur APMC'}
                    {isImpersonating && <span className="ml-1 text-amber-500 font-bold">👀 Audit Mode</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-1.5 shrink-0">

              {/* Language Selector */}
              <div className="hidden sm:flex items-center bg-slate-100 hover:bg-slate-200 transition-colors px-2 py-1.5 rounded-xl border border-slate-200">
                <Languages className="w-3.5 h-3.5 text-slate-500 mr-1 shrink-0" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-0.5"
                  aria-label="Select Language"
                  title="Switch Language / भाषा बदलें"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">
                      {lang.flag} {lang.nativeName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Business Mode Pill / Switcher */}
              {user?.role === 'super_admin' ? (
                <button
                  type="button"
                  onClick={() => setIsOnboardingModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                  title="Super Admin: Change Mandi Business Type & Personalize Screens / व्यापार श्रेणी बदलें"
                >
                  <span>{workspaceConfig?.icon || '🏢'}</span>
                  <span className="hidden lg:inline text-slate-700">{workspaceConfig?.businessTitle || 'Mandi Mode'}</span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                    ⚡ Mode
                  </span>
                </button>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200"
                  title={workspaceConfig?.businessTitle || 'Mandi Mode'}
                >
                  <span>{workspaceConfig?.icon || '🏢'}</span>
                  <span className="hidden lg:inline text-slate-700">{workspaceConfig?.businessTitle || 'Mandi Mode'}</span>
                </div>
              )}

              {/* Buy Plan / Upgrade Button — shows current plan, click to upgrade */}
              {user?.role !== 'super_admin' && (
                <button
                  onClick={() => {
                    sessionStorage.setItem('settings_active_subtab', 'PLANS');
                    setActiveTab('settings');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-black transition-all hover:shadow-sm cursor-pointer ${
                    (PLAN_STYLES[tenant?.plan] || PLAN_STYLES.Free).badge
                  }`}
                  title="Upgrade / Buy Plan — प्लान अपग्रेड करें"
                >
                  <Crown className="w-3 h-3 shrink-0" />
                  <span className="hidden xs:inline">{tenant?.plan || 'Free'}</span>
                  <span className="hidden sm:inline text-[9px] opacity-70">↑ Upgrade</span>
                </button>
              )}

              {/* Quick Trade shortcut */}
              <button
                onClick={() => setActiveTab('quick-trade')}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Quick Trade (F2)"
              >
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Quick Trade</span>
              </button>

              {/* Super Admin button */}
              {user?.role === 'super_admin' && (
                <button
                  onClick={() => setActiveTab('super-admin')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Super Admin</span>
                </button>
              )}

              {/* User name + role chip */}
              <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <span className="text-sm">
                  {isImpersonating ? '👀' : (user?.role === 'super_admin' ? '👑' : user?.role === 'accountant' ? '💰' : user?.role === 'munshi' ? '📝' : '🏢')}
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[90px]">{user?.name}</div>
                  <div className="text-[9px] text-slate-400 truncate">{user?.roleLabel || user?.role}</div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Logout / लॉग आउट"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Page Content Container (Scrolls smoothly while sidebar remains sticky) */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {renderActivePage()}
          </main>
        </div>

      </div>

      {/* Workspace Personalization & Business Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <TenantProvider>
          <MandiApp />
        </TenantProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
