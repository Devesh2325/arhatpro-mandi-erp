import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutDashboard,
  Zap, 
  Truck, 
  Tag, 
  BookOpen, 
  FileText, 
  Settings, 
  ShieldAlert, 
  LogOut 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, isImpersonating, logout } = useAuth();
  const { tenants, activeTenant, currentTenant, switchTenant } = useTenant();
  const { t } = useLanguage();
  const tenant = currentTenant || activeTenant;

  const subPlan = tenant?.plan || 'Monthly';
  const subStatus = tenant?.sub_status || 'Active';

  const planStyles = {
    Monthly: 'bg-blue-100 text-blue-900 border-blue-200',
    Yearly: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    Enterprise: 'bg-purple-100 text-purple-900 border-purple-200'
  };

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, shortcut: 'F1' },
    { id: 'quick-trade', label: t('quick_trade'), icon: Zap, shortcut: 'F2' },
    { id: 'arrivals', label: t('arrivals'), icon: Truck, shortcut: 'F3' },
    { id: 'sales', label: t('sales'), icon: Tag, shortcut: 'F4' },
    { id: 'bahi-khata', label: t('bahi_khata'), icon: BookOpen, shortcut: 'F5' },
    { id: 'reports', label: t('reports'), icon: FileText, shortcut: 'F6' },
    { id: 'settings', label: t('settings'), icon: Settings, shortcut: 'F9' }
  ];

  const userAvatars = {
    super_admin: '👑',
    shop_admin: '🏢',
    munshi: '👤',
    accountant: '💰'
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between sticky top-0 h-screen z-40 select-none no-print shrink-0 overflow-y-auto">
      
      {/* Top Section: Firm Card & Navigation */}
      <div className="p-4 space-y-4">
        
        {/* Agency Identity & Switcher */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-xs shrink-0 overflow-hidden border border-slate-300/40"
              style={{ backgroundColor: 'var(--primary-dark, #0f172a)', color: '#ffffff' }}
            >
              {tenant?.logo_url ? (
                <img src={tenant.logo_url} alt="Firm Logo" className="w-full h-full object-contain p-0.5" />
              ) : (
                <span>{tenant?.logo_icon || '🍎'}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-slate-900 text-sm leading-tight truncate">
                {tenant?.firm_name || 'Loading Firm...'}
              </h1>
              <span className="text-[10px] text-slate-500 font-medium block truncate">
                {tenant?.shop_no} • {tenant?.mandi_name}
              </span>
            </div>
          </div>

          {/* Subscription Badge & Switcher */}
          <div className="pt-2 border-t border-slate-200 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-400 uppercase tracking-wide">{t('agency_switcher')}</span>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide border ${planStyles[subPlan] || 'bg-slate-100 text-slate-700'}`}>
                ⭐ {subPlan.toUpperCase()} • {subStatus.toUpperCase()}
              </span>
            </div>
            
            <select
              value={tenant?.id || ''}
              onChange={(e) => switchTenant(e.target.value)}
              disabled={tenants.length <= 1}
              className="w-full text-xs font-bold bg-white border border-slate-300 text-slate-700 py-1.5 px-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
              title={tenants.length <= 1 ? t('single_agency') : t('agency_switcher')}
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>
                  {t.logo_icon || '🏢'} {t.firm_name} ({t.shop_no})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 text-xs">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 py-1">
            {t('operations')}
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={isActive ? {
                  backgroundColor: 'var(--primary, #15803d)',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.2)'
                } : {}}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                  isActive 
                    ? 'text-white' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="flex-1">{item.label}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-black/25 text-white' : 'opacity-60 bg-slate-200/50 text-slate-600'
                }`}>
                  {item.shortcut}
                </span>
              </button>
            );
          })}

          {/* Super Admin Console Button (Only for Platform Owner) */}
          {user?.role === 'super_admin' && (
            <div className="pt-3">
              <div className="text-[10px] font-black text-purple-400 uppercase tracking-wider px-3 py-1">
                {t('super_admin')}
              </div>
              <button
                onClick={() => setActiveTab('super-admin')}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  activeTab === 'super-admin'
                    ? 'bg-purple-900 text-white shadow-md'
                    : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <span>{t('super_admin')}</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Section: User Session Profile & Logout */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
        <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">
              {isImpersonating ? '👀' : (userAvatars[user?.role] || '👤')}
            </span>
            <div className="min-w-0">
              <span className="font-bold text-slate-800 text-xs block truncate leading-tight">
                {isImpersonating ? `${user?.name} (Auditing)` : user?.name}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {isImpersonating ? '🔒 View-Only Audit' : (user?.roleLabel || user?.role)}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title={t('logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
}
