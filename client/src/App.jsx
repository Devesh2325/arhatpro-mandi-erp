import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
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
import { Menu, Sparkles } from 'lucide-react';

function MandiApp() {
  const { user, isAuthenticated, loading } = useAuth();
  const { currentTenant, activeTenant } = useTenant();
  const tenant = currentTenant || activeTenant;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      setActiveTab('super-admin');
    } else {
      setActiveTab('dashboard');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-base font-bold tracking-wider uppercase">Loading ArhatPro Mandi ERP...</div>
        <div className="text-xs text-emerald-400 mt-1">Connecting to Relational SQL Database &amp; Express API</div>
      </div>
    );
  }

  // If not logged in, show clean enterprise login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Full-Stack Enterprise Mandi ERP
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">ARHATPRO MANDI ERP</h1>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Cloud-native Multi-Tenant APMC Trading Platform • React + Express + Relational SQL
          </p>
        </div>
        <AuthModal />
      </div>
    );
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
          
          {/* Top Bar for Mobile & Desktop Navigation */}
          <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                  {tenant?.firm_name || 'ArhatPro Mandi Firm'}
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="hidden sm:inline text-xs text-slate-500">
                  {tenant?.shop_no} ({tenant?.mandi_name || 'Azadpur Mandi'})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('quick-trade')}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>⚡</span>
                <span className="hidden sm:inline">Quick Trade</span>
              </button>
              {user?.role === 'super_admin' && (
                <button
                  onClick={() => setActiveTab('super-admin')}
                  className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <span>👑</span>
                  <span className="hidden sm:inline">Super Admin</span>
                </button>
              )}
            </div>
          </header>

          {/* Page Content Container (Scrolls smoothly while sidebar remains sticky) */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {renderActivePage()}
          </main>
        </div>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <MandiApp />
      </TenantProvider>
    </AuthProvider>
  );
}
