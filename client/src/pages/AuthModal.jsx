import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { KeyRound, Rocket, AlertTriangle, Building2 } from 'lucide-react';

export default function AuthModal() {
  const { login, signup } = useAuth();
  const { language, t } = useLanguage();
  const [tab, setTab] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login form state (clean without demo prefill)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    firmName: '',
    proprietor: '',
    phone: '',
    pin: '',
    shopNo: '',
    mandiName: 'Azadpur Mandi, Delhi',
    apmcLicenseNo: '',
    theme: 'emerald'
  });

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

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-100 text-gray-800">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-slate-900 flex items-center justify-center text-3xl mx-auto shadow-md text-white">
          🌾
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">ArhatPro Mandi ERP</h2>
        <p className="text-xs text-slate-500">{t('APMC Wholesale Market Trading & Accounting Platform', 'एपीएमसी थोक कृषि उपज मंडी व्यापार एवं लेखा प्रणाली')}</p>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

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
          {t('Login', 'प्रवेश')}
        </button>
        <button
          type="button"
          onClick={() => { setTab('signup'); setError(''); }}
          className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            tab === 'signup' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Rocket className="w-3.5 h-3.5" />
          {t('New Agency Sign-Up', 'नई आढ़त फर्म पंजीकरण')}
        </button>
      </div>

      {/* Tab 1: LOGIN FORM */}
      {tab === 'login' ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('Registered Mobile Number or Email', 'पंजीकृत मोबाइल नंबर या ईमेल')}</label>
            <input
              type="text"
              required
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              placeholder="e.g. 9811012345 or user@mandi.com"
              className="w-full p-3 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">{t('Security PIN or Password', 'सुरक्षा पिन या पासवर्ड')}</label>
              <span className="text-[10px] text-slate-400">{t('4-Digit PIN or Password', '4-अंकीय पिन या पासवर्ड')}</span>
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
            {loading ? t('Authenticating...', 'सत्यापित हो रहा है...') : t('Secure Login to Workspace →', 'सुरक्षित लॉगिन करें →')}
          </button>
        </form>
      ) : (
        /* Tab 2: SIGN-UP FORM */
        <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
            <strong>{t('Self-Serve Agency Provisioning:', 'स्वचालित आढ़त सेटअप:')}</strong> {t('Instantly provisions your own isolated APMC Mandi workspace with relational database partitions, default commodities, and shop admin rights.', 'आपकी फर्म हेतु अलग डेटाबेस, मानक फसल सूची और एडमिन अधिकारों के साथ तत्काल खाता तैयार करता है।')}
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('Mandi Firm Name *', 'व्यापारिक फर्म का नाम *')}</label>
            <input
              type="text"
              required
              value={signupForm.firmName}
              onChange={(e) => setSignupForm({ ...signupForm, firmName: e.target.value })}
              placeholder="e.g. Kisan Kripa Fruit Trading Co."
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
              <label className="font-bold text-slate-700 block mb-1">{t('Shop / Shed No.', 'दुकान / शेड नं.')}</label>
              <input
                type="text"
                value={signupForm.shopNo}
                onChange={(e) => setSignupForm({ ...signupForm, shopNo: e.target.value })}
                placeholder="e.g. Shop C-42"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('Market Name', 'मंडी का नाम')}</label>
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
                <option value="emerald">{t('Emerald Green (Azadpur)', 'एमराल्ड हरा (आज़ादपुर)')}</option>
                <option value="navy">{t('Royal Navy Blue', 'रॉयल नेवी ब्लू')}</option>
                <option value="maroon">{t('Kashmiri Maroon', 'कश्मीरी महरून')}</option>
                <option value="purple">{t('Imperial Purple', 'इंपीरियल पर्पल')}</option>
                <option value="amber">{t('Golden Amber', 'गोल्डन एम्बर')}</option>
                <option value="slate">{t('Corporate Slate', 'कॉर्पोरेट स्लेट')}</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? t('Provisioning Agency...', 'खाता तैयार हो रहा है...') : t('🚀 Register & Launch My Agency →', '🚀 फर्म पंजीकृत करें एवं शुरू करें →')}
          </button>
        </form>
      )}
    </div>
  );
}
