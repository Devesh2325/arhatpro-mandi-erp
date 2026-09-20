import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Rocket, ShieldCheck, CheckCircle, AlertTriangle, Building, User, Lock, Phone } from 'lucide-react';

export default function AuthModal() {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('dmchaturvedi@gmail.com');
  const [loginPassword, setLoginPassword] = useState('Devesh@23251995');

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    firmName: '',
    proprietor: '',
    phone: '',
    pin: '1234',
    shopNo: 'Shop No. C-45',
    mandiName: 'Azadpur Mandi, Delhi',
    apmcLicenseNo: '',
    theme: 'emerald'
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginIdentifier, loginPassword);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!signupForm.firmName.trim() || !signupForm.proprietor.trim() || !signupForm.phone.trim()) {
      setError('Firm Name, Proprietor Name, and Mobile Number are required.');
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
    <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 border border-slate-100 text-gray-800">
      {/* Brand Header */}
      <div className="text-center space-y-1">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-indigo-800 flex items-center justify-center text-3xl mx-auto shadow-md text-white">
          🌾
        </div>
        <h2 className="text-xl font-black text-slate-900 pt-2 tracking-tight">ArhatPro Mandi ERP</h2>
        <p className="text-xs text-slate-500">APMC Wholesale Market ERP • Cloud Edition</p>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
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
          Login (लॉग इन)
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

      {/* Quick Credentials Helpers */}
      {tab === 'login' && (
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
          <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Quick Demo Accounts:</div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setLoginIdentifier('dmchaturvedi@gmail.com');
                setLoginPassword('Devesh@23251995');
                setError('');
              }}
              className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg font-bold transition-colors"
            >
              👑 Super Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginIdentifier('9811012345');
                setLoginPassword('1234');
                setError('');
              }}
              className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg font-bold transition-colors"
            >
              🏢 Royal Apple (9811012345)
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginIdentifier('9810012345');
                setLoginPassword('1234');
                setError('');
              }}
              className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg font-bold transition-colors"
            >
              🏢 Shree Ganesh (9810012345)
            </button>
          </div>
        </div>
      )}

      {/* Tab 1: LOGIN FORM */}
      {tab === 'login' ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Email or Mobile Number</label>
            <div className="relative">
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="e.g. dmchaturvedi@gmail.com or 9811012345"
                className="w-full p-3 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">Password or 4-Digit PIN</label>
              <span className="text-[10px] text-slate-400">Default PIN: 1234</span>
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
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Secure Login to Workspace →'}
          </button>
        </form>
      ) : (
        /* Tab 2: SIGN-UP FORM */
        <form onSubmit={handleSignupSubmit} className="space-y-3 text-xs">
          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-900 text-[11px]">
            <strong>Self-Serve Agency Provisioning:</strong> Instantly provisions your own isolated Mandi workspace with Monthly subscription, default commodities, and shop admin rights.
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Mandi Firm Name (फर्म का नाम) *</label>
            <input
              type="text"
              required
              value={signupForm.firmName}
              onChange={(e) => setSignupForm({ ...signupForm, firmName: e.target.value })}
              placeholder="e.g. Kisan Kripa Fruit Trading Co."
              className="w-full p-2.5 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-600 outline-none"
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
                placeholder="e.g. Ramesh Chand"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Set 4-Digit PIN *</label>
              <input
                type="password"
                required
                maxLength={6}
                value={signupForm.pin}
                onChange={(e) => setSignupForm({ ...signupForm, pin: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Shop / Shed No.</label>
              <input
                type="text"
                value={signupForm.shopNo}
                onChange={(e) => setSignupForm({ ...signupForm, shopNo: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Brand Theme Color</label>
            <select
              value={signupForm.theme}
              onChange={(e) => setSignupForm({ ...signupForm, theme: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
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
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Provisioning Agency...' : '🚀 Register & Launch My Agency →'}
          </button>
        </form>
      )}
    </div>
  );
}
