import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import Sidebar from './components/Sidebar';
import ImpersonationBanner from './components/ImpersonationBanner';
import AuthModal from './pages/AuthModal';
import QuickTrade from './pages/QuickTrade';
import Arrivals from './pages/Arrivals';
import Sales from './pages/Sales';
import BahiKhata from './pages/BahiKhata';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SuperAdmin from './pages/SuperAdmin';
import { Menu, ShieldAlert, Sparkles } from 'lucide-react';

function MandiApp() {
  const { user, isAuthenticated, loading } = useAuth();
  const { currentTenant, isImpersonating } = useTenant();

  const [activeTab, setActiveTab] = useState('quick-trade');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-base font-bold tracking-wider uppercase">Loading ArhatPro Mandi ERP...</div>
        <div className="text-xs text-indigo-400 mt-1">Connecting to Relational SQL Database &amp; Express API</div>
      </div>
    );
  }

  // If not logged in, show login screen / modal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Full-Stack Enterprise Mandi ERP
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">ARHATPRO MANDI ERP</h1>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Cloud-native Multi-Tenant APMC Trading Engine • React + Express + Relational SQL
          </p>
        </div>
        <AuthModal isOpen={true} onClose={() => {}} />
      </div>
    );
  }

  // If user is super_admin and clicked super-admin tab or default
  const renderActivePage = () => {
    switch (activeTab) {
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
        return user?.role === 'super_admin' ? <SuperAdmin /> : <QuickTrade />;
      default:
        return <QuickTrade />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col antialiased">
      {/* Impersonation Banner if active */}
      <ImpersonationBanner />

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop & Mobile Responsive Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 md:static transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } transition-transform duration-200 ease-in-out`}>
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
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Mobile Bar */}
          <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 text-slate-300 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="font-black text-sm uppercase tracking-wider">{currentTenant?.name || 'ArhatPro Mandi'}</div>
            {user?.role === 'super_admin' ? (
              <span className="p-1 text-amber-400 font-bold text-xs">SUPER</span>
            ) : <div className="w-6" />}
          </div>

          {/* Page Content Container */}
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
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
