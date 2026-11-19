import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { KeyRound, Rocket, AlertTriangle, Building2, Sparkles, CheckCircle2, ChevronRight, X } from 'lucide-react';

export default function AuthModal({
  initialTab = 'login',
  initialBusinessType = 'banana_store',
  isOpen = true,
  onClose = null,
  isModal = false
}) {
  const { login, signup } = useAuth();
  const { language, t } = useLanguage();
  const [tab, setTab] = useState(initialTab);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    firmName: '',
    proprietor: '',
    phone: '',
    pin: '',
    shopNo: '',
    mandiName: 'Kela Mandi, Azadpur & Jalgaon Terminal',
    businessType: initialBusinessType || 'banana_store',
    apmcLicenseNo: '',
    theme: 'amber',
    logoIcon: '🍌'
  });

  useEffect(() => {
    if (initialBusinessType) {
      handleBusinessTypeChange(initialBusinessType);
    }
  }, [initialBusinessType]);

  // Pre-configured Testing Mandis & Stores for Instant 1-Click Evaluation
  const demoMandis = [
    {
      id: 'banana',
      firm: 'Golden Banana Ripening Store & Co.',
      hindi: 'गोल्डन बनाना राइपनिंग स्टोर व क्रेट ट्रेडिंग',
      mandi: 'Kela Mandi & Jalgaon Banana Terminal',
      phone: '9820011223',
      pin: '1234',
      badge: '🍌 Banana Store & Chamber',
      color: 'border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 text-amber-950',
      tagColor: 'bg-amber-200/70 text-amber-900',
      icon: '🍌'
    },
    {
      id: 'apple',
      firm: 'Royal Apple Traders',
      hindi: 'रॉयल एप्पल ट्रेडर्स (आज़ादपुर सेब मंडी)',
      mandi: 'Azadpur Mandi, Delhi - Shop B-12',
      phone: '9811012345',
      pin: '1234',
      badge: '🍎 Azadpur Fruit Mandi',
      color: 'border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-rose-950',
      tagColor: 'bg-rose-200/70 text-rose-900',
      icon: '🍎'
    },
    {
      id: 'coldstorage',
      firm: 'Shree Ram Potato Cold Storage & Agency',
      hindi: 'श्री राम आलू कोल्ड स्टोरेज एवं आढ़त',
      mandi: 'Agra & Aligarh Cold Storage Belt, UP',
      phone: '9837012345',
      pin: '1234',
      badge: '❄️ Potato Cold Storage',
      color: 'border-slate-300 bg-slate-100/80 hover:bg-slate-200 text-slate-900',
      tagColor: 'bg-slate-300 text-slate-900',
      icon: '🥔'
    },
    {
      id: 'vashi',
      firm: 'Mumbai Agri Traders & Exporters',
      hindi: 'मुंबई एग्री ट्रेडर्स (वाशी एपीएमसी)',
      mandi: 'Vashi APMC Market, Navi Mumbai',
      phone: '9820098200',
      pin: '1234',
      badge: '🌊 Vashi APMC Mumbai',
      color: 'border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-blue-950',
      tagColor: 'bg-blue-200/70 text-blue-900',
      icon: '🥭'
    },
    {
      id: 'kolar',
      firm: 'Kolar Vegetable & Tomato Yard Agency',
      hindi: 'कोलार सब्जी व टमाटर मंडी यार्ड',
      mandi: 'APMC Market Yard, Kolar, Karnataka',
      phone: '9845012345',
      pin: '1234',
      badge: '🍅 Kolar Tomato Yard',
      color: 'border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 text-purple-950',
      tagColor: 'bg-purple-200/70 text-purple-900',
      icon: '🍅'
    },
    {
      id: 'grain',
      firm: 'Kisan Grain Trading Co.',
      hindi: 'किसान ग्रेन ट्रेडिंग कंपनी (अनाज मंडी)',
      mandi: 'New Grain Market, Khanna (Punjab)',
      phone: '9876543210',
      pin: '1234',
      badge: '🌾 Grain Mandi (गेहूं-धान)',
      color: 'border-yellow-200 bg-yellow-50/70 hover:bg-yellow-100/80 text-yellow-950',
      tagColor: 'bg-yellow-200/70 text-yellow-900',
      icon: '🌾'
    },
    {
      id: 'superadmin',
      firm: 'Platform Super Admin Console',
      hindi: 'सुपर एडमिन कंसोल (मास्टर कंट्रोल)',
      mandi: 'National Mandi Network Oversight',
      phone: 'dmchaturvedi@gmail.com',
      pin: 'Devesh@23251995',
      badge: '👑 Platform Super Admin',
      color: 'border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-950',
      tagColor: 'bg-indigo-200/70 text-indigo-900',
      icon: '👑'
    }
  ];

  const handleSelectDemoMandi = async (dm) => {
    setLoginIdentifier(dm.phone);
    setLoginPassword(dm.pin);
    setError('');
    setLoading(true);
    try {
      await login(dm.phone, dm.pin);
    } catch (err) {
      setError(err.message || 'Auto-login failed. Please click submit.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setError(t('Please enter your Mobile Number / Email and PIN / Password.', 'कृपया अपना मोबाइल नंबर / ईमेल और पिन / पासवर्ड दर्ज करें।'));
      return;
    }

    setLoading(true);
    try {
      await login(loginIdentifier.trim(), loginPassword.trim());
    } catch (err) {
      setError(err.message || t('Login failed. Please verify your credentials.', 'लॉगिन विफल रहा। कृपया अपनी क्रेडेंशियल जांचें।'));
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessTypeChange = (type) => {
    const defaults = {
      banana_store: {
        mandiName: 'Kela Mandi & Banana Terminal',
        theme: 'amber',
        logoIcon: '🍌'
      },
      cold_storage: {
        mandiName: 'Potato Cold Storage Complex, UP',
        theme: 'slate',
        logoIcon: '🥔'
      },
      fruit_vegetable: {
        mandiName: 'Azadpur Mandi, Delhi',
        theme: 'emerald',
        logoIcon: '🍎'
      },
      grain_mandi: {
        mandiName: 'Grain Market Yard, Punjab / Haryana',
        theme: 'amber',
        logoIcon: '🌾'
      },
      general: {
        mandiName: 'Wholesale APMC Market Yard',
        theme: 'emerald',
        logoIcon: '🏢'
      }
    };

    const d = defaults[type] || defaults.fruit_vegetable;
    setSignupForm(prev => ({
      ...prev,
      businessType: type,
      mandiName: d.mandiName,
      theme: d.theme,
      logoIcon: d.logoIcon
    }));
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!signupForm.firmName.trim() || !signupForm.proprietor.trim() || !signupForm.phone.trim() || !signupForm.pin.trim()) {
      setError(t('Firm Name, Proprietor Name, Mobile Number, and 4-Digit PIN are required.', 'फर्म का नाम, प्रोपराइटर का नाम, मोबाइल नंबर और 4-अंकीय पिन आवश्यक हैं।'));
      return;
    }

    setLoading(true);
    try {
      await signup(signupForm);
    } catch (err) {
      setError(err.message || t('Registration failed. Please try again.', 'पंजीकरण विफल रहा। कृपया पुन: प्रयास करें।'));
    } finally {
      setLoading(false);
    }
  };

  if (isModal && !isOpen) return null;

  const modalBody = (
    <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-100 text-gray-800 max-h-[92vh] overflow-y-auto relative my-auto">
      {/* Optional Close Button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          title="Close / बंद करें"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Brand Header */}
      <div className="text-center space-y-1.5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 flex items-center justify-center text-3xl mx-auto shadow-md text-white">
          🌾
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">ArhatPro Mandi ERP</h2>
        <p className="text-xs text-slate-500 font-medium">
          {t('Multi-Mandi Platform for Banana Stores, Cold Storages, Fruit & Grain APMC Yards', 'केला स्टोर, कोल्ड स्टोरेज, फल-सब्जी व अनाज मंडियों हेतु सम्पूर्ण व्यापार व बहीखाता')}
        </p>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1-Click Mandi Selector for Quick Testing & Evaluation */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {t('Instant Mandi Testing (1-Click Login):', 'तत्काल टेस्टिंग हेतु मंडी चुनें (1-क्लिक प्रवेश):')}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">PIN: 1234</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {demoMandis.map((dm) => (
            <button
              key={dm.id}
              type="button"
              onClick={() => handleSelectDemoMandi(dm)}
              disabled={loading}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer shadow-xs hover:shadow-sm flex flex-col justify-between gap-1 group ${dm.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base">{dm.icon}</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${dm.tagColor}`}>
                  {dm.badge.split(' ')[0]} {dm.badge.split(' ')[1]}
                </span>
              </div>
              <div>
                <p className="font-black text-[11px] leading-tight line-clamp-1 group-hover:text-black">
                  {dm.firm.split(' ')[0]} {dm.firm.split(' ')[1]}
                </p>
                <p className="text-[9px] text-slate-500 truncate mt-0.5">
                  {dm.mandi.split(',')[0]}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold gap-1">
        <button
          type="button"
          onClick={() => { setTab('login'); setError(''); }}
          className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            tab === 'login' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          {t('Login to Account', 'प्रवेश (Login)')}
        </button>
        <button
          type="button"
          onClick={() => { setTab('signup'); setError(''); }}
          className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            tab === 'signup' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Rocket className="w-3.5 h-3.5" />
          {t('New Store / Mandi Registration', 'नया स्टोर / मंडी खाता बनाएं')}
        </button>
      </div>

      {/* Tab 1: LOGIN FORM */}
      {tab === 'login' ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('Registered Mobile Number or Email', 'पंजीकृत मोबाइल नंबर या ईमेल')}
            </label>
            <input
              type="text"
              required
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              placeholder="e.g. 9820011223 or user@mandi.in"
              className="w-full p-3 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">{t('Security PIN or Password', 'सुरक्षा पिन या पासवर्ड')}</label>
              <span className="text-[10px] text-slate-400">{t('Default Demo PIN: 1234', 'डिफ़ॉल्ट पिन: 1234')}</span>
            </div>
            <input
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 border border-slate-300 rounded-xl font-mono text-sm font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? t('Authenticating...', 'सत्यापित हो रहा है...') : t('Secure Login to Mandi Workspace →', 'सुरक्षित लॉगिन करें →')}
          </button>
        </form>
      ) : (
        /* Tab 2: SIGN-UP FORM (MULTI-MANDI / MULTI-STORE PROVISIONING) */
        <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
            <strong>{t('Multi-Mandi Provisioning:', 'मल्टी-मंडी एवं स्टोर सेटअप:')}</strong> {t('Select your business type (Banana Store, Cold Storage, Grain Mandi, Fruit/Veg Yard). Provisions isolated partition, crates tracking, and commodities.', 'अपना व्यापार चुनें (केला स्टोर, कोल्ड स्टोरेज, अनाज मंडी आदि)। सिस्टम स्वतः क्रेट ट्रैकिंग व फसल सूची तैयार करता है।')}
          </div>

          {/* Business / Mandi Type Selector */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('Select Business / Store Category *', 'व्यापार / स्टोर श्रेणी चुनें *')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'banana_store', label: '🍌 Banana Store / Chamber', hindi: 'केला स्टोर / राइपनिंग' },
                { id: 'cold_storage', label: '❄️ Cold Storage / Godown', hindi: 'कोल्ड स्टोरेज / आलू' },
                { id: 'fruit_vegetable', label: '🍎 Fruit & Veg APMC', hindi: 'फल व सब्जी मंडी' },
                { id: 'grain_mandi', label: '🌾 Grain / Pulses Mandi', hindi: 'अनाज मंडी (गेहूं-धान)' },
                { id: 'general', label: '🏢 General Mandi Agency', hindi: 'सामान्य मंडी आढ़त' }
              ].map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleBusinessTypeChange(b.id)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer text-[11px] font-bold ${
                    signupForm.businessType === b.id 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20' 
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-black">{b.label}</p>
                  <p className="text-[9px] text-slate-500">{b.hindi}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('Firm / Store Name *', 'व्यापारिक फर्म / स्टोर का नाम *')}</label>
            <input
              type="text"
              required
              value={signupForm.firmName}
              onChange={(e) => setSignupForm({ ...signupForm, firmName: e.target.value })}
              placeholder={signupForm.businessType === 'banana_store' ? 'e.g. Golden Banana Ripening Store' : 'e.g. Kisan Kripa Fruit Trading Co.'}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('Proprietor Name *', 'मालिक / प्रोपराइटर का नाम *')}</label>
              <input
                type="text"
                required
                value={signupForm.proprietor}
                onChange={(e) => setSignupForm({ ...signupForm, proprietor: e.target.value })}
                placeholder="Owner Name"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('Mobile Number *', 'मोबाइल नंबर *')}</label>
              <input
                type="tel"
                required
                value={signupForm.phone}
                onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                placeholder="10-digit mobile"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('Set 4-Digit Login PIN *', '4-अंकीय लॉगिन पिन बनाएं *')}</label>
              <input
                type="password"
                required
                maxLength={6}
                value={signupForm.pin}
                onChange={(e) => setSignupForm({ ...signupForm, pin: e.target.value })}
                placeholder="e.g. 1234"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('Shop / Chamber / Shed No.', 'दुकान / चैंबर / शेड नं.')}</label>
              <input
                type="text"
                value={signupForm.shopNo}
                onChange={(e) => setSignupForm({ ...signupForm, shopNo: e.target.value })}
                placeholder={signupForm.businessType === 'banana_store' ? 'e.g. Chamber 4 & 5' : 'e.g. Shop C-42'}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('Mandi / Market Location', 'मंडी / शहर / क्षेत्र')}</label>
              <input
                type="text"
                value={signupForm.mandiName}
                onChange={(e) => setSignupForm({ ...signupForm, mandiName: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('Brand Theme', 'थीम का रंग')}</label>
              <select
                value={signupForm.theme}
                onChange={(e) => setSignupForm({ ...signupForm, theme: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
              >
                <option value="amber">{t('Golden Amber (Banana / Onion)', 'गोल्डन एम्बर (केला व प्याज)')}</option>
                <option value="emerald">{t('Emerald Green (Azadpur)', 'एमराल्ड हरा (आज़ादपुर)')}</option>
                <option value="slate">{t('Corporate Slate (Cold Storage)', 'कॉर्पोरेट स्लेट (कोल्ड स्टोरेज)')}</option>
                <option value="navy">{t('Royal Navy Blue (Vashi)', 'रॉयल नेवी ब्लू (वाशी)')}</option>
                <option value="purple">{t('Imperial Purple (Kolar)', 'इंपीरियल पर्पल (कोलार)')}</option>
                <option value="maroon">{t('Kashmiri Maroon (Apple)', 'कश्मीरी महरून (सेब)')}</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? t('Provisioning Agency...', 'खाता तैयार हो रहा है...') : t('🚀 Register & Launch Store / Mandi →', '🚀 स्टोर / मंडी पंजीकृत करें एवं शुरू करें →')}
          </button>
        </form>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
        {modalBody}
      </div>
    );
  }

  return modalBody;
}
