import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { Check, Sparkles, Sliders, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export default function OnboardingModal({ isOpen, onClose }) {
  const { workspaceConfig, updateWorkspaceConfig, businessPresets, activeTenant } = useTenant();
  
  const [selectedCategory, setSelectedCategory] = useState('fruit_vegetable');
  const [customConfig, setCustomConfig] = useState({
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
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workspaceConfig) {
      setSelectedCategory(workspaceConfig.businessCategory || 'fruit_vegetable');
      setCustomConfig(workspaceConfig);
    }
  }, [workspaceConfig, isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset) => {
    setSelectedCategory(preset.id);
    setCustomConfig({
      ...preset.config
    });
  };

  const handleToggle = (key) => {
    setCustomConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateWorkspaceConfig(customConfig, selectedCategory);
      if (onClose) onClose();
    } catch (err) {
      alert('Error saving configuration: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 relative">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/10 rounded-xl text-2xl backdrop-blur-md">
              <Sparkles className="w-7 h-7 text-amber-300 animate-pulse" />
            </span>
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                Select Your Mandi Business Type / व्यापार श्रेणी चुनें
              </h2>
              <p className="text-emerald-100 text-xs md:text-sm mt-0.5">
                Screens & fields will be personalized to your business flow. Irrelevant options will be hidden to prevent confusion.
              </p>
            </div>
          </div>
          {activeTenant?.onboarding_completed === 1 && onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 text-xl font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Step 1: Business Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                Choose your Primary Business Model / अपना व्यापार मॉडल चुनें
              </label>
              <span className="text-xs text-slate-500 font-medium">Click to select preset</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {businessPresets.map(preset => {
                const isSelected = selectedCategory === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`cursor-pointer rounded-xl p-4 transition-all duration-200 border relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-md'
                        : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 bg-emerald-600 text-white rounded-full p-1 shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}

                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-2xl">{preset.icon}</span>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">{preset.name}</h4>
                          <span className="text-[11px] text-emerald-800 font-semibold">{preset.nameHi}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                        {preset.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1">
                      {preset.config.showCrates && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-medium">
                          📦 Crates
                        </span>
                      )}
                      {preset.config.showChambers && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-medium">
                          ❄️ Chambers
                        </span>
                      )}
                      {preset.config.showDriverFreight && (
                        <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-medium">
                          🚚 Freight
                        </span>
                      )}
                      {!preset.config.showCrates && !preset.config.showChambers && (
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                          ⚡ Clean / Fast
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: What you get preview & Fine tuning */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                <h3 className="font-bold text-slate-800 text-sm">
                  Active Features & Screen Simplification Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-emerald-700 font-bold hover:text-emerald-800 flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                {showAdvanced ? 'Hide Customizer' : 'Customize Options (कस्टमाइज़ करें)'}
              </button>
            </div>

            {/* Live screen badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className={`p-3 rounded-lg border ${customConfig.showCrates ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'}`}>
                <div className="font-bold flex items-center gap-1.5">
                  <span>📦</span> Crate Ledger
                </div>
                <div className="text-[11px] mt-0.5 font-medium">
                  {customConfig.showCrates ? '✓ Visible in Inward & BahiKhata' : '✕ Hidden to avoid confusion'}
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${customConfig.showChambers ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'}`}>
                <div className="font-bold flex items-center gap-1.5">
                  <span>❄️</span> Ripening Chambers
                </div>
                <div className="text-[11px] mt-0.5 font-medium">
                  {customConfig.showChambers ? '✓ Chamber storage active' : '✕ Hidden (Direct trade only)'}
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${customConfig.showDriverFreight ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'}`}>
                <div className="font-bold flex items-center gap-1.5">
                  <span>🚚</span> Driver Freight Head
                </div>
                <div className="text-[11px] mt-0.5 font-medium">
                  {customConfig.showDriverFreight ? '✓ Driver advance & ledger' : '✕ Hidden in entry forms'}
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${customConfig.showAgent ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'}`}>
                <div className="font-bold flex items-center gap-1.5">
                  <span>🤝</span> Broker / Agent
                </div>
                <div className="text-[11px] mt-0.5 font-medium">
                  {customConfig.showAgent ? '✓ Agent commission active' : '✕ Hidden (Direct farmer)'}
                </div>
              </div>
            </div>

            {/* Advanced toggle switches if opened */}
            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Field Toggles:</h4>
                  
                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={customConfig.showCrates}
                      onChange={() => handleToggle('showCrates')}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800">Track Plastic Crates (क्रेट हिसाब)</span>
                      <p className="text-slate-500 text-[11px]">Enables Crate in/out and buyer/farmer crate balances</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={customConfig.showChambers}
                      onChange={() => handleToggle('showChambers')}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800">Ripening Chamber / Cold Storage (चैंबर स्टोरेज)</span>
                      <p className="text-slate-500 text-[11px]">Enables stock storage in chambers before final sale</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={customConfig.showDriverFreight}
                      onChange={() => handleToggle('showDriverFreight')}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800">Driver & Transporter Freight (चालक व भाड़ा)</span>
                      <p className="text-slate-500 text-[11px]">Enables vehicle freight advance, driver balance, and driver ledger</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={customConfig.showAgent}
                      onChange={() => handleToggle('showAgent')}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800">Agent / Broker Selection (दलाल / एजेंट)</span>
                      <p className="text-slate-500 text-[11px]">Allows assigning third-party commission agents</p>
                    </div>
                  </label>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Defaults & Units:</h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Default Unit / मुख्य इकाई:
                    </label>
                    <select
                      value={customConfig.defaultUnit || 'Box (20kg)'}
                      onChange={(e) => setCustomConfig(prev => ({ ...prev, defaultUnit: e.target.value }))}
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Banana Crate (15kg)">Banana Crate (केला क्रेट - 15kg)</option>
                      <option value="Sack (50kg)">Sack / Bora (बोरी - 50kg)</option>
                      <option value="Quintal (क्विंटल)">Quintal (क्विंटल - 100kg)</option>
                      <option value="Box (20kg)">Box (पेटी / बॉक्स - 20kg)</option>
                      <option value="Kg">Kilogram (किलो)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Primary Entry Flow / मुख्य एंट्री पेज:
                    </label>
                    <select
                      value={customConfig.primaryFlow || 'quick-trade'}
                      onChange={(e) => setCustomConfig(prev => ({ ...prev, primaryFlow: e.target.value }))}
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="quick-trade">Quick Trade (One-Page Fast Inward + Direct Sale)</option>
                      <option value="arrivals">Inward Consignments (Storage / Chamber Inward First)</option>
                      <option value="dashboard">Dashboard (Business Overview First)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>You can change or fine-tune this anytime from <b>Admin Configuration</b>.</span>
          </div>

          <div className="flex items-center gap-3">
            {activeTenant?.onboarding_completed === 1 && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : (
                <>
                  <span>Apply & Personalize My Screens</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}