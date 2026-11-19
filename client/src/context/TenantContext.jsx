import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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

export const BUSINESS_PRESETS = [
  {
    id: 'banana_store',
    name: 'Banana Store & Ripening Chamber',
    nameHi: 'केला स्टोर व राइपनिंग चैंबर',
    icon: '🍌',
    desc: 'Ripening chambers, daily crate in/out, driver freight advances, multi-buyer direct & cold store sale.',
    config: {
      businessCategory: 'banana_store',
      businessTitle: 'Banana Store & Ripening Chamber',
      businessTitleHi: 'केला स्टोर व राइपनिंग चैंबर',
      icon: '🍌',
      showCrates: true,
      showChambers: true,
      showDriverFreight: true,
      showAgent: true,
      primaryFlow: 'quick-trade',
      defaultUnit: 'Banana Crate (15kg)'
    }
  },
  {
    id: 'cold_storage',
    name: 'Potato / Apple Cold Storage',
    nameHi: 'आलू / सेब कोल्ड स्टोरेज',
    icon: '❄️',
    desc: 'Bora/sack inward consignments, chamber lot tracking, cold store storage, driver transport.',
    config: {
      businessCategory: 'cold_storage',
      businessTitle: 'Cold Storage & Warehousing',
      businessTitleHi: 'कोल्ड स्टोरेज व वेयरहाउसिंग',
      icon: '❄️',
      showCrates: true,
      showChambers: true,
      showDriverFreight: true,
      showAgent: false,
      primaryFlow: 'arrivals',
      defaultUnit: 'Sack (50kg)'
    }
  },
  {
    id: 'grain_mandi',
    name: 'Grain / Anaj Mandi Commission Agent',
    nameHi: 'अनाज / गल्ला मंडी आढ़त',
    icon: '🌾',
    desc: 'Wheat, paddy, pulses, quintal weighbridge, kisan auction, agent brokerage. No crates/chambers.',
    config: {
      businessCategory: 'grain_mandi',
      businessTitle: 'Grain / Anaj Mandi Commission Agent',
      businessTitleHi: 'अनाज / गल्ला मंडी आढ़त',
      icon: '🌾',
      showCrates: false,
      showChambers: false,
      showDriverFreight: true,
      showAgent: true,
      primaryFlow: 'quick-trade',
      defaultUnit: 'Quintal (क्विंटल)'
    }
  },
  {
    id: 'fruit_vegetable',
    name: 'Fruit & Vegetable APMC Mandi Agent',
    nameHi: 'फल व सब्जी मंडी आढ़ती (APMC)',
    icon: '🍎',
    desc: 'Fast spot auctions, tomato/apple crates, buyer lot distributions, APMC fees & deductions.',
    config: {
      businessCategory: 'fruit_vegetable',
      businessTitle: 'Fruit & Vegetable APMC Mandi Agent',
      businessTitleHi: 'फल व सब्जी मंडी आढ़ती (APMC)',
      icon: '🍎',
      showCrates: true,
      showChambers: false,
      showDriverFreight: true,
      showAgent: true,
      primaryFlow: 'quick-trade',
      defaultUnit: 'Box (20kg)'
    }
  },
  {
    id: 'general_wholesale',
    name: 'General Wholesale & Trading',
    nameHi: 'सामान्य थोक व व्यापार',
    icon: '📦',
    desc: 'Simple direct buying and selling with party khata. Minimal fields to avoid confusion.',
    config: {
      businessCategory: 'general_wholesale',
      businessTitle: 'General Wholesale & Trading',
      businessTitleHi: 'सामान्य थोक व व्यापार',
      icon: '📦',
      showCrates: false,
      showChambers: false,
      showDriverFreight: false,
      showAgent: false,
      primaryFlow: 'quick-trade',
      defaultUnit: 'Pieces/Kg'
    }
  }
];

export function TenantProvider({ children }) {
  const { user, isImpersonating, startImpersonation: authStartImpersonation } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [activeTenant, setActiveTenant] = useState(null);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

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

        // Auto-popup removed: Mandi Business Type is configured by Super Admin
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

  // Derived workspace config based on tenant settings
  const workspaceConfig = useMemo(() => {
    const defaultConfig = BUSINESS_PRESETS[3].config; // default Fruit & Veg
    if (!activeTenant) return defaultConfig;

    if (activeTenant.workspace_config) {
      try {
        const parsed = typeof activeTenant.workspace_config === 'string'
          ? JSON.parse(activeTenant.workspace_config)
          : activeTenant.workspace_config;
        return { ...defaultConfig, ...parsed };
      } catch (e) {
        console.warn('Failed to parse workspace_config:', e);
      }
    }

    // Fallback based on business_type
    const matchingPreset = BUSINESS_PRESETS.find(p => p.id === activeTenant.business_type);
    if (matchingPreset) return matchingPreset.config;

    return defaultConfig;
  }, [activeTenant]);

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

  const updateWorkspaceConfig = async (newConfig, businessCategory) => {
    if (!activeTenant) return;
    const cat = businessCategory || newConfig.businessCategory || activeTenant.business_type || 'fruit_vegetable';
    const configStr = typeof newConfig === 'string' ? newConfig : JSON.stringify(newConfig);

    try {
      const res = await API.updateTenant(activeTenant.id, {
        workspace_config: configStr,
        business_type: cat,
        onboarding_completed: 1
      });

      // Update in local state immediately
      setActiveTenant(prev => ({
        ...prev,
        workspace_config: configStr,
        business_type: cat,
        onboarding_completed: 1
      }));

      // Also update tenants array
      setTenants(prev => prev.map(t => t.id === activeTenant.id ? {
        ...t,
        workspace_config: configStr,
        business_type: cat,
        onboarding_completed: 1
      } : t));

      setIsOnboardingModalOpen(false);
      return res;
    } catch (err) {
      console.error('Failed to update workspace configuration:', err);
      throw err;
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
      currentTenant: activeTenant,
      workspaceConfig,
      updateWorkspaceConfig,
      isOnboardingModalOpen,
      setIsOnboardingModalOpen,
      loadingTenants,
      switchTenant,
      refreshTenant,
      applyTheme,
      currentTheme,
      themeColors: THEME_PRESETS,
      businessPresets: BUSINESS_PRESETS,
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
      workspaceConfig: BUSINESS_PRESETS[3].config,
      updateWorkspaceConfig: async () => {},
      isOnboardingModalOpen: false,
      setIsOnboardingModalOpen: () => {},
      loadingTenants: false,
      switchTenant: () => {},
      refreshTenant: () => {},
      applyTheme: () => {},
      currentTheme: THEME_PRESETS[0],
      themeColors: THEME_PRESETS,
      businessPresets: BUSINESS_PRESETS,
      startImpersonation: async () => {},
      loadTenants: async () => {}
    };
  }
  return context;
}
