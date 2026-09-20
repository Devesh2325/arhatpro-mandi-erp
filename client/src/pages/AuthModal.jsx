import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Rocket, ShieldCheck } from 'lucide-react';

export default function AuthModal({ onAdminPortalClick }) {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginPhone, setLoginPhone] = useState('9810012345');
  const [loginPin, setLoginPin] = useState('1234');

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    firmName: '',
    proprietor: '',
    phone: '',
    pin: '1234',
    shopNo: 'Shop B-105',
    mandiName: 'Azadpur Mandi, Delhi',
    apmcLicenseNo: 'DL-APMC-2026-99',
    theme: 'emerald'
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginPhone, loginPin);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(signupForm);
    } catch (err) {
      setError(err.message || 'Sign-up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 my-6 max-h-[92vh] overflow-y-auto border border-slate-100">
        
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 flex items-center justify-center text-3xl mx-auto shadow-md">
            🌾
          </div>
          <h2 className="text-xl font-black text-slate-900 pt-2 tracking-tight">ArhatPro Mandi ERP</h2>
          <p className="text-xs text-slate-500">Azadpur Wholesale Mandi • React & SQL Cloud Edition</p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
            ⚠️ {error}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold gap-1">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'login' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Login (प्रवेश)
          </button>
          <button
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
              <label className="font-bold text-slate-700 block mb-1">Mobile Number or Email</label>
              <input
                type="text"
                required
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="e.g. 9810012345 or dmchaturvedi@gmail.com"
                className="w-full p-3 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700">Security PIN or Password</label>
                <span className="text-[10px] text-slate-400">PIN or Master Pass</span>
              </div>
              <input
                type="password"
                required
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                placeholder="••••"
                className="w-full p-3 border border-slate-300 rounded-xl font-mono text-base font-bold tracking-wider focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Secure Login to Workspace →'}
            </button>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-400">Platform Owner?</span>
              <button
                type="button"
                onClick={() => {
                  setLoginPhone('dmchaturvedi@gmail.com');
                  setLoginPin('Devesh@23251995');
                }}
                className="font-bold text-purple-700 hover:text-purple-900 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>👑</span> Fill Super Admin
              </button>
            </div>
          </form>
        ) : (
          /* Tab 2: SIGN-UP FORM */
          <form onSubmit={handleSignupSubmit} className="space-y-3 text-xs">
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-900 text-[11px]">
              <strong>Self-Serve Provisioning:</strong> Provisions an isolated agency with SQL database partitions, Monthly subscription, and default commodities.
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Mandi Firm Name (फर्म का नाम) *</label>
              <input
                type="text"
                required
                value={signupForm.firmName}
                onChange={(e) => setSignupForm({ ...signupForm, firmName: e.target.value })}
                placeholder="e.g. Kisan Kripa Fruit Trading Co."
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Proprietor Name *</label>
                <input
                  type="text"
                  required
                  value={signupForm.proprietor}
                  onChange={(e) => setSignupForm({ ...signupForm, proprietor: e.target.value })}
                  placeholder="Owner Name"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={signupForm.phone}
                  onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  placeholder="98XXXXXXXX"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Set 4-Digit PIN *</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={signupForm.pin}
                  onChange={(e) => setSignupForm({ ...signupForm, pin: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold tracking-widest"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Shop / Shed No.</label>
                <input
                  type="text"
                  value={signupForm.shopNo}
                  onChange={(e) => setSignupForm({ ...signupForm, shopNo: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Brand Theme Color (व्हाइट लेबल)</label>
              <select
                value={signupForm.theme}
                onChange={(e) => setSignupForm({ ...signupForm, theme: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
              >
                <option value="emerald">Emerald Green (Azadpur Standard)</option>
                <option value="navy">Royal Navy Blue</option>
                <option value="maroon">Kashmiri Maroon</option>
                <option value="purple">Imperial Purple</option>
                <option value="amber">Golden Amber</option>
                <option value="slate">Corporate Slate</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Provisioning Agency...' : '🚀 Launch My Agency ERP →'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
