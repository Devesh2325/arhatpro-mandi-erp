import React, { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../api';
import { useAuth } from './AuthContext';

const TenantContext = createContext(null);

export const THEME_PRESETS = [
  { id: 'emerald', name: 'Emerald Green (Azadpur Standard)', value: '#15803d', dark: '#14532d', light: '#dcfce7' },
  { id: 'navy', name: 'Royal Navy Blue (Grain Market)', value: '#1e3a8a', dark: '#172554', light: '#dbeafe' },
  { id: 'maroon', name: 'Kashmiri Maroon (Apple Market)', value: '#881337', dark: '#4c0519', light: '#ffe4e6' },
  { id: 'purple', name: 'Imperial Purple (Vegetable Yard)', value: '#6b21a8', dark: '#3b0764', light: '#f3e8ff' },
  { id: 'amber', name: 'Golden Amber (Onion/Potato Yard)', value: '#b45309', dark: '#78350f', light: '#fef3c7' },
  { id: 'slate', name: 'Corporate Slate (Corporate Mandi)', value: '#334155', dark: '#0f172a', light: '#f1f5f9' }
];

export function TenantProvider({ children }) {
  const { user, isImpersonating, startImpersonation: authStartImpersonation } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [activeTenant, setActiveTenant] = useState(null);
  const [loadingTenants, setLoadingTenants] = useState(false);

  const [currentTheme, setCurrentTheme] = useState(() => THEME_PRESETS[0]);

  const applyTheme = (themeKeyOrColor) => {
    const preset = THEME_PRESETS.find(p => p.id === themeKeyOrColor || p.value === themeKeyOrColor) || THEME_PRESETS[0];
    setCurrentTheme(preset);
    document.documentElement.style.setProperty('--primary', preset.value);
    document.documentElement.style.setProperty('--primary-dark', preset.dark);
    document.documentElement.style.setProperty('--primary-light', preset.light);
    document.documentElement.style.setProperty('--theme-primary', preset.value);
    document.documentElement.style.setProperty('--theme-active-bg', preset.value);
    document.documentElement.style.setProperty('--theme-accent', preset.value);
    document.documentElement.style.setProperty('--theme-light', preset.light);
    document.documentElement.style.setProperty('--theme-dark', preset.dark);
  };

  const loadTenants = async () => {
    if (!user) {
      setTenants([]);
      setActiveTenant(null);
      return;
    }

    try {
      setLoadingTenants(true);
      const res = await API.getTenants();
      const list = Array.isArray(res) ? res : (res?.tenants || []);
      setTenants(list);
      
      // Default to user's assigned tenant, or first accessible tenant
      if (list.length > 0) {
        const matched = list.find(t => t.id === user.tenantId) || list[0];
        setActiveTenant(matched);
        applyTheme(matched.theme_color || 'emerald');
      } else {
        setActiveTenant(null);
      }
    } catch (err) {
      console.error('Could not load tenants:', err);
    } finally {
      setLoadingTenants(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [user, isImpersonating]);

  const switchTenant = (tenantId) => {
    const target = tenants.find(t => t.id === tenantId);
    if (target) {
      setActiveTenant(target);
      applyTheme(target.theme_color || 'emerald');
    }
  };

  const refreshTenant = async () => {
    if (!activeTenant) return;
    try {
      const updated = await API.getTenant(activeTenant.id);
      if (updated) {
        setActiveTenant(updated);
        applyTheme(updated.theme_color || 'emerald');
      }
    } catch (e) {
      console.error('Failed to refresh tenant:', e);
    }
  };

  const startImpersonation = async (targetTenantId) => {
    if (authStartImpersonation) {
      const res = await authStartImpersonation(targetTenantId);
      await loadTenants();
      return res;
    }
  };

  return (
    <TenantContext.Provider value={{
      tenants,
      activeTenant,
      currentTenant: activeTenant, // convenient alias for currentTenant
      loadingTenants,
      switchTenant,
      refreshTenant,
      applyTheme,
      currentTheme,
      themeColors: THEME_PRESETS,
      startImpersonation,
      loadTenants
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    return {
      tenants: [],
      activeTenant: null,
      currentTenant: null,
      loadingTenants: false,
      switchTenant: () => {},
      refreshTenant: () => {},
      applyTheme: () => {},
      currentTheme: THEME_PRESETS[0],
      themeColors: THEME_PRESETS,
      startImpersonation: async () => {},
      loadTenants: async () => {}
    };
  }
  return context;
}
