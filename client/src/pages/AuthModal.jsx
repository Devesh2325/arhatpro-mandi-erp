import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Rocket, AlertTriangle, Building2 } from 'lucide-react';

export default function AuthModal() {
  const { login, signup } = useAuth();
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
      setError('Please enter your Mobile Number / Email and PIN / Password.');
      return;
    }

    setLoading(true);
    try {
      await login(loginIdentifier.trim(), loginPassword.trim());
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!signupForm.firmName.trim() || !signupForm.proprietor.trim() || !signupForm.phone.trim() || !signupForm.pin.trim()) {
      setError('Firm Name, Proprietor Name, Mobile Number, and 4-Digit PIN are required.');
      return;
    }

    setLoading(true);
    try {
      await signup(signupForm);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
        <p className="text-xs text-slate-500">APMC Wholesale Market Trading &amp; Accounting Platform</p>
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
          Login (प्रवेश)
        </button>
        <button
          type="button"
          onClick={() => { setTab('signup'); setError(''); }}
          className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            tab === 'signup' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Rocket className="w-3.5 h-3.5" />
          New Agency Sign-Up
        </button>
      </div>

      {/* Tab 1: LOGIN FORM */}
      {tab === 'login' ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Registered Mobile Number or Email</label>
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
              <label className="font-bold text-slate-700">Security PIN or Password</label>
              <span className="text-[10px] text-slate-400">4-Digit PIN or Password</span>
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
            {loading ? 'Authenticating...' : 'Secure Login to Workspace →'}
          </button>
        </form>
      ) : (
        /* Tab 2: SIGN-UP FORM */
        <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
            <strong>Self-Serve Agency Provisioning:</strong> Instantly provisions your own isolated APMC Mandi workspace with relational database partitions, default commodities, and shop admin rights.
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Mandi Firm Name (व्यापारिक फर्म का नाम) *</label>
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
              <label className="font-bold text-slate-700 block mb-1">Proprietor Name (मालिक) *</label>
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
              <label className="font-bold text-slate-700 block mb-1">Mobile Number (मोबाइल) *</label>
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
              <label className="font-bold text-slate-700 block mb-1">Set 4-Digit Login PIN *</label>
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
              <label className="font-bold text-slate-700 block mb-1">Shop / Shed No.</label>
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
              <label className="font-bold text-slate-700 block mb-1">Market Name</label>
              <input
                type="text"
                value={signupForm.mandiName}
                onChange={(e) => setSignupForm({ ...signupForm, mandiName: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Brand Theme</label>
              <select
                value={signupForm.theme}
                onChange={(e) => setSignupForm({ ...signupForm, theme: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
              >
                <option value="emerald">Emerald Green (Azadpur)</option>
                <option value="navy">Royal Navy Blue</option>
                <option value="maroon">Kashmiri Maroon</option>
                <option value="purple">Imperial Purple</option>
                <option value="amber">Golden Amber</option>
                <option value="slate">Corporate Slate</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Provisioning Agency...' : '🚀 Register & Launch My Agency →'}
          </button>
        </form>
      )}
    </div>
  );
}
