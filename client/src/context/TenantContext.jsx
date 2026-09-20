import React, { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../api';
import { useAuth } from './AuthContext';

const TenantContext = createContext(null);

export const THEME_PRESETS = {
  emerald: { label: 'Emerald Green (Azadpur Standard)', primary: '#15803d', dark: '#14532d', light: '#dcfce7' },
  navy: { label: 'Royal Navy Blue (Grain Market)', primary: '#1e3a8a', dark: '#172554', light: '#dbeafe' },
  maroon: { label: 'Kashmiri Maroon (Apple Market)', primary: '#881337', dark: '#4c0519', light: '#ffe4e6' },
  purple: { label: 'Imperial Purple (Vegetable Yard)', primary: '#6b21a8', dark: '#3b0764', light: '#f3e8ff' },
  amber: { label: 'Golden Amber (Onion/Potato Yard)', primary: '#b45309', dark: '#78350f', light: '#fef3c7' },
  slate: { label: 'Corporate Slate (Corporate Mandi)', primary: '#334155', dark: '#0f172a', light: '#f1f5f9' }
};

export function TenantProvider({ children }) {
  const { user, isImpersonating } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [activeTenant, setActiveTenant] = useState(null);
  const [loadingTenants, setLoadingTenants] = useState(false);

  const loadTenants = async () => {
    if (!user) {
      setTenants([]);
      setActiveTenant(null);
      return;
    }

    try {
      setLoadingTenants(true);
      const list = await API.getTenants();
      setTenants(list);
      
      // Default to user's assigned tenant, or first accessible tenant
      if (list.length > 0) {
        const matched = list.find(t => t.id === user.tenantId) || list[0];
        setActiveTenant(matched);
        applyTheme(matched.theme_color || 'emerald');
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

  const applyTheme = (themeKey) => {
    const preset = THEME_PRESETS[themeKey] || THEME_PRESETS.emerald;
    document.documentElement.style.setProperty('--primary', preset.primary);
    document.documentElement.style.setProperty('--primary-dark', preset.dark);
    document.documentElement.style.setProperty('--primary-light', preset.light);
  };

  const switchTenant = (tenantId) => {
    const target = tenants.find(t => t.id === tenantId);
    if (target) {
      setActiveTenant(target);
      applyTheme(target.theme_color || 'emerald');
    }
  };

  const refreshTenant = async () => {
    if (!activeTenant) return;
    const updated = await API.getTenant(activeTenant.id);
    setActiveTenant(updated);
    applyTheme(updated.theme_color || 'emerald');
  };

  return (
    <TenantContext.Provider value={{
      tenants,
      activeTenant,
      loadingTenants,
      switchTenant,
      refreshTenant,
      applyTheme,
      loadTenants
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
