import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import AuthModal from './AuthModal';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Truck, 
  Package, 
  Receipt, 
  BookOpen, 
  ShieldCheck, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  MessageSquare, 
  Star, 
  Clock, 
  Zap, 
  ChevronRight, 
  Menu, 
  X,
  ExternalLink,
  Shield,
  Crown
} from 'lucide-react';

export default function LandingPage() {
  const { login } = useAuth();
  const { language, setLanguage, t, isHindi } = useLanguage();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [authModalBusinessType, setAuthModalBusinessType] = useState('banana_store');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Quick Contact Form state
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    mandiName: '',
    businessType: 'banana_store',
    message: ''
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const openAuth = (tab = 'login', bType = 'banana_store') => {
    setAuthModalTab(tab);
    setAuthModalBusinessType(bType);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone) {
      alert('Please fill your Name and Mobile Number.');
      return;
    }
    setContactSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* ──────────────────────────────────────────────────────────────────────────
          1. STICKY NAVBAR
      ────────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-amber-500 flex items-center justify-center text-2xl shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
              🌾
            </div>
            <div>
              <div className="font-black text-xl tracking-tight text-white flex items-center gap-2">
                ARHATPRO <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider">MANDI ERP</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                भारत का नंबर 1 क्लाउड मंडी प्लेटफ़ॉर्म
              </p>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-300">
            <a href="#solutions" className="hover:text-emerald-400 transition-colors">
              {isHindi ? 'व्यापार मॉडल' : 'Mandi Models'}
            </a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              {isHindi ? 'खासियतें' : 'Features'}
            </a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">
              {isHindi ? 'प्लान्स' : 'Pricing'}
            </a>
            <a href="#contact" className="hover:text-emerald-400 transition-colors">
              {isHindi ? 'संपर्क' : 'Contact Us'}
            </a>
          </nav>

          {/* Right Header Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800 border border-slate-700 px-2 py-1.5 rounded-xl text-xs font-bold text-slate-300">
              <span className="mr-1">🌐</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">
                    {lang.flag} {lang.nativeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Login Button */}
            <button
              onClick={() => openAuth('login')}
              className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer"
            >
              {isHindi ? 'लॉग इन' : 'Login'}
            </button>

            {/* Start Free Trial / Onboarding CTA */}
            <button
              onClick={() => openAuth('signup')}
              className="px-5 py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer hover:scale-[1.02] flex items-center gap-1.5"
            >
              <span>{isHindi ? 'निःशुल्क शुरू करें' : 'Start Free Trial'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900/95 p-4 space-y-3 animate-fade-in text-sm font-bold">
            <a 
              href="#solutions" 
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 hover:text-emerald-400"
            >
              {isHindi ? 'व्यापार मॉडल (Mandi Models)' : 'Mandi Models'}
            </a>
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 hover:text-emerald-400"
            >
              {isHindi ? 'मुख्य खासियतें (Features)' : 'Features'}
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 hover:text-emerald-400"
            >
              {isHindi ? 'प्लान्स व सब्सक्रिप्शन (Pricing)' : 'Pricing'}
            </a>
            <a 
              href="#contact" 
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 hover:text-emerald-400"
            >
              {isHindi ? 'संपर्क व सहायता (Contact)' : 'Contact Us'}
            </a>

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => openAuth('login')}
                className="w-full py-2.5 text-center bg-slate-800 text-white rounded-xl font-bold"
              >
                {isHindi ? 'लॉग इन (Login)' : 'Login'}
              </button>
              <button
                onClick={() => openAuth('signup')}
                className="w-full py-3 text-center bg-emerald-500 text-slate-950 rounded-xl font-black shadow-md flex items-center justify-center gap-2"
              >
                <span>{isHindi ? 'निःशुल्क ऑनबोर्डिंग शुरू करें' : 'Start Free Onboarding'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>


      {/* ──────────────────────────────────────────────────────────────────────────
          2. HERO SECTION
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        
        {/* Glow backdrop shapes */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>भारत का नंबर 1 क्लाउड मंडी ERP • APMC Compliant • Crate &amp; Chamber Ready</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              मंडी आढ़त व स्टोर का संपूर्ण <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
                डिजिटल प्लेटफ़ॉर्म
              </span>
            </h1>

            {/* Subhead */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              केला स्टोर, कोल्ड स्टोरेज, फल-सब्जी और अनाज मंडी आढ़ती के लिए विशेष रूप से निर्मित। 
              <span className="text-emerald-400 font-bold"> फड़ नीलामी, क्रेट हिसाब, चालक भाड़ा </span> 
              और <span className="text-amber-300 font-bold"> पक्का बही-खाता (रोकड़, तलपट, चिट्ठा) </span> 
              अब 1 मिनट में।
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <button
                onClick={() => openAuth('signup')}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/25 transition-all cursor-pointer hover:scale-105 flex items-center justify-center gap-2 group"
              >
                <span>{isHindi ? '🚀 तुरंत निःशुल्क शुरू करें (Onboard)' : '🚀 Start Free Onboarding Today'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => openAuth('login')}
                className="w-full sm:w-auto px-8 py-4 bg-slate-800/90 hover:bg-slate-700/90 text-white border border-slate-700 rounded-2xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🔐 {isHindi ? 'आढ़ती लॉग इन (Merchant Login)' : 'Merchant Login'}</span>
              </button>
            </div>

            {/* Trust Metrics Grid */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
                <div className="text-2xl font-black text-emerald-400">500+</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">सक्रिय आढ़त व स्टोर</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
                <div className="text-2xl font-black text-amber-400">100%</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">क्रेट व भाड़ा पारदर्शिता</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
                <div className="text-2xl font-black text-teal-400">₹100 Cr+</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">मासिक व्यापार सुरक्षित</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
                <div className="text-2xl font-black text-indigo-400">1 Click</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">व्हाट्सएप बिल व जे-फॉर्म</div>
              </div>
            </div>

          </div>

          {/* Interactive Hero Preview Card Mockup */}
          <div className="mt-14 max-w-5xl mx-auto bg-slate-800/80 rounded-3xl p-3 sm:p-5 border border-slate-700 shadow-2xl backdrop-blur-md">
            
            {/* Fake browser bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 px-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-400 font-mono text-[11px] ml-2">app.arhatpro.com/quick-trade</span>
              </div>
              <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Cloud DB Connected</span>
              </div>
            </div>

            {/* Mockup content */}
            <div className="pt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
              
              {/* Left Column: Truck Logistics & Crates */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <span>Inward Truck: DL-01-AB-1234</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                    🍌 Banana Ripening
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>किसान (Grower):</span>
                    <span className="font-bold text-white">Ramesh Patil (Jalgaon)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>आवक भाव (Rate):</span>
                    <span className="font-bold text-emerald-400">₹550 / Crate</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>स्टोरेज चैंबर (Chamber):</span>
                    <span className="font-bold text-indigo-400">Chamber-4 (Ripening)</span>
                  </div>
                </div>

                {/* Crates Tracker Chip */}
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/40 space-y-1">
                  <div className="flex justify-between text-[10px] text-amber-300 font-bold">
                    <span>📦 चालक क्रेट हिसाब (Driver Crates)</span>
                    <span>350 In - 50 Return</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black text-amber-400">
                    <span>बाकी क्रेट (Balance):</span>
                    <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-mono">300 Crates</span>
                  </div>
                </div>

                {/* Freight Chip */}
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 flex justify-between text-[11px]">
                  <span className="text-slate-400">कुल भाड़ा (Freight):</span>
                  <span className="font-bold text-white">₹25,000 (Advance ₹10k | Bal ₹15k)</span>
                </div>
              </div>

              {/* Middle & Right Column: Multi-Buyer Split Sales */}
              <div className="lg:col-span-2 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">⚡ 1-Minute Multi-Buyer Split Sales</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                      ✓ 100% Balanced (350 / 350 Units)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">Gross: ₹2,10,000</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="pb-2">खरीदार (Buyer)</th>
                        <th className="pb-2">नग (Qty)</th>
                        <th className="pb-2">दर (Rate)</th>
                        <th className="pb-2">सकल मूल्य (Amount)</th>
                        <th className="pb-2 text-right">व्हाट्सएप बिल</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      <tr>
                        <td className="py-2 text-white font-bold">Aggarwal Fruit Co. (Shop 24)</td>
                        <td className="py-2 text-amber-400 font-mono font-bold">150 Crates</td>
                        <td className="py-2">₹610</td>
                        <td className="py-2 font-mono text-emerald-400 font-bold">₹91,500</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-0.5 bg-emerald-600/30 text-emerald-400 rounded text-[10px] font-bold">
                            📱 Shared
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-white font-bold">Sharma Kela Bhandar</td>
                        <td className="py-2 text-amber-400 font-mono font-bold">120 Crates</td>
                        <td className="py-2">₹600</td>
                        <td className="py-2 font-mono text-emerald-400 font-bold">₹72,000</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-0.5 bg-emerald-600/30 text-emerald-400 rounded text-[10px] font-bold">
                            📱 Shared
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-white font-bold">Gupta Cold Store &amp; Retail</td>
                        <td className="py-2 text-amber-400 font-mono font-bold">80 Crates</td>
                        <td className="py-2">₹580</td>
                        <td className="py-2 font-mono text-emerald-400 font-bold">₹46,500</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-0.5 bg-emerald-600/30 text-emerald-400 rounded text-[10px] font-bold">
                            📱 Shared
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer KPI within Mockup */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex gap-4">
                    <span className="text-slate-400">Awak Cost: <strong className="text-white">₹1,92,500</strong></span>
                    <span className="text-slate-400">Commission: <strong className="text-emerald-400">₹8,400</strong></span>
                  </div>
                  <div className="text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800/60">
                    Net Trading Margin: +₹17,500 (+8.3%)
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>


      {/* ──────────────────────────────────────────────────────────────────────────
          3. TAILORED MANDI SOLUTIONS (THE 5 CORE MODELS)
      ────────────────────────────────────────────────────────────────────────── */}
      <section id="solutions" className="py-20 bg-slate-950 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
              Personalized Workspaces / अनुकूलित स्क्रीन
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              हर व्यापार और मंडी के लिए अनुकूलित प्लेटफ़ॉर्म
            </h2>
            <p className="text-sm text-slate-400">
              आपको केवल वही विकल्प और फील्ड दिखेंगे जो आपके व्यापार के लिए जरूरी हैं। 
              अनावश्यक चीजें छुप जाती हैं — कोई कन्फ्यूजन नहीं!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Banana Store */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-amber-500/20 hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-950/20 flex flex-col justify-between space-y-5 group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  🍌
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-black text-white">Banana Store &amp; Ripening</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">केला स्टोर</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  केला राइपनिंग चैंबर, दैनिक क्रेट इन/आउट, चालक भाड़ा पेशगी व शेष, और खरीदारों में त्वरित बिक्री आवंटन।
                </p>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Plastic Crate In/Out &amp; Circulation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Ripening Chamber Lot Allocation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Driver Freight Advance &amp; Ledger</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openAuth('signup', 'banana_store')}
                className="w-full py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>केला स्टोर शुरू करें (Start Now)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 2: Cold Storage */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-950/20 flex flex-col justify-between space-y-5 group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  ❄️
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-black text-white">Cold Storage &amp; Warehousing</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-400/20 text-blue-300 font-bold">कोल्ड स्टोरेज</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  आलू व सेब बोरी आवक, कोल्ड रूम चैंबर स्लॉट ट्रैकिंग, दीर्घकालिक स्टोरेज किराया और ट्रांसपोर्टर खाता।
                </p>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Inward Sack (50kg बोरी) Consignments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Chamber Lot Allocation &amp; Storage Rent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Gate Pass &amp; Delivery Purcha Print</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openAuth('signup', 'cold_storage')}
                className="w-full py-2.5 px-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl font-bold text-xs flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>कोल्ड स्टोरेज शुरू करें (Start Now)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 3: Grain Mandi */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-emerald-500/20 hover:border-emerald-500/40 transition-all hover:shadow-xl hover:shadow-emerald-950/20 flex flex-col justify-between space-y-5 group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  🌾
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-black text-white">Grain / Anaj Mandi Commission</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-bold">अनाज आढ़त</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  गेहूं, धान, सरसों व दालों की नीलामी, धर्मकांटा क्विंटल वजन, किसान भुगतान व आढ़त। क्रेट व चैंबर के बिना क्लीन स्क्रीन।
                </p>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Quintal (क्विंटल) Weighbridge Calculations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Clean Screen (No Crates/Chambers Clutter)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>J-Form, Farmer Passbook &amp; Brokerage</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openAuth('signup', 'grain_mandi')}
                className="w-full py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>अनाज आढ़त शुरू करें (Start Now)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 4: Fruit & Veg APMC Mandi */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-rose-500/20 hover:border-rose-500/40 transition-all hover:shadow-xl hover:shadow-rose-950/20 flex flex-col justify-between space-y-5 group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  🍎
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-black text-white">Fruit &amp; Vegetable APMC Yard</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-400/20 text-rose-300 font-bold">फल व सब्जी</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  आज़ादपुर, वाशी व कोलार जैसे बड़े यार्ड हेतु। सुबह की तेज फड़ नीलामी, सेब/टमाटर क्रेट और एपीएमसी मंडी टैक्स।
                </p>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Superfast Multi-Buyer Spot Auctions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Market Fees, Palledari &amp; RDF Statutory Cuts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Instant Teep &amp; WhatsApp Slip Share</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openAuth('signup', 'fruit_vegetable')}
                className="w-full py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>फल-सब्जी आढ़त शुरू करें (Start Now)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 5: General Wholesale */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all hover:shadow-xl hover:shadow-purple-950/20 flex flex-col justify-between space-y-5 group md:col-span-2 lg:col-span-2">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  📦
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-black text-white">General Wholesale &amp; Trading</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-400/20 text-purple-300 font-bold">सामान्य थोक</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  सरल थोक खरीद-बिक्री। न्यूनतम फील्ड, ग्राहक उधारी खाता, रोकड़ बही और 15-दिन ब्याज गणना।
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Clean Minimalist Interface</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Customer Udhaar Ledger &amp; Aging</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Opening Cash &amp; Daily Rokad Register</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Zero Complex Mandatory Steps</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openAuth('signup', 'general')}
                className="w-full py-2.5 px-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl font-bold text-xs flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>थोक व्यापार शुरू करें (Start Now)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </section>


      {/* ──────────────────────────────────────────────────────────────────────────
          4. CORE HIGHLIGHTED FEATURES
      ────────────────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-teal-400 bg-teal-950/60 px-3 py-1 rounded-full border border-teal-800/60">
              Complete Feature Suite / मुख्य विशेषताएं
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              आढ़त और मंडी संचालन के लिए शक्तिशाली टूल्स
            </h2>
            <p className="text-sm text-slate-400">
              कागजी बही-खाते और एक्सेल की गलतियों को अलविदा कहें। अब हर हिसाब सेकंडों में होगा।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-emerald-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">1-Minute Quick Trade (क्विक ट्रेड)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                एक ही पेज पर गाड़ी आवक, किसान रेट और कई खरीदारों में लॉट का बंटवारा 60 सेकंड में पूरा करें। अलग-अलग विंडो खोलने का कोई झंझट नहीं।
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-amber-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Plastic Crate Accounting (क्रेट खाता)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                चालक, किसान और खरीदारों के पास कितनी प्लास्टिक क्रेट बाकी हैं — 1 क्लिक में पूरा हिसाब। कोई भी क्रेट कभी गुम नहीं होगी।
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-indigo-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Driver Freight Head (चालक व भाड़ा)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                गाड़ी नंबर, चालक का मोबाइल, भाड़ा पेशगी और शेष भाड़ा। सीधे रोकड़ से भुगतान करें या चालक खाते में रखें।
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-teal-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Double-Entry Bahi-Khata (पक्का बहीखाता)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                दैनिक रोकड़ बही (Cashbook), स्वतः रोजनामचा (Journal), तलपट (Trial Balance), चिट्ठा (Balance Sheet) और 15-दिन ब्याज कैलकुलेटर।
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-green-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">WhatsApp Bills &amp; J-Forms (पर्चा शेयर)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                सौदा पूरा होते ही किसान और खरीदार को WhatsApp पर प्रोफेशनल पर्चा, बिल और जे-फॉर्म तुरंत पीडीएफ में भेजें।
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-purple-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Audit Logs &amp; Staff Tracking (ऑडिट ट्रैकिंग)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                मुनीम और कैशियर की हर गतिविधि रिकॉर्ड होती है — किसने कब कौन सी एंट्री की या बदली। संपूर्ण पारदर्शिता और सुरक्षा।
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* ──────────────────────────────────────────────────────────────────────────
          5. PRICING PLANS
      ────────────────────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-purple-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/60">
              Transparent Pricing / पारदर्शी मूल्य
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              किफायती व सरल सब्सक्रिप्शन प्लान्स
            </h2>
            <p className="text-sm text-slate-400">
              कोई छिपा हुआ चार्ज नहीं। हर आढ़ती और स्टोर के लिए उचित दर।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            {/* Plan 1: Starter */}
            <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Starter</span>
                <h3 className="text-xl font-bold text-white mt-1">शुरुआती आढ़त</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">₹999</span>
                  <span className="text-xs text-slate-400">/ माह (Monthly)</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">छोटे व्यापारियों और नई आढ़त के लिए बेस्ट।</p>

                <div className="mt-6 space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>2 Users (मुनीम + कैशियर)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>250 Consignments / माह</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Bahi-Khata Ledger &amp; Cashbook</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>WhatsApp Teep &amp; J-Form Share</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openAuth('signup')}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Starter शुरू करें
              </button>
            </div>

            {/* Plan 2: Pro (Popular) */}
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-3xl p-6 border-2 border-emerald-500 shadow-xl shadow-emerald-950/40 flex flex-col justify-between space-y-6 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                ⭐ Most Popular (बेस्ट सेलर)
              </span>

              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Mandi Pro</span>
                <h3 className="text-xl font-bold text-white mt-1">मंडी प्रो आढ़त</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">₹2,499</span>
                  <span className="text-xs text-slate-400">/ माह (Monthly)</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">पूर्ण आढ़त व केला स्टोर हेतु सर्वश्रेष्ठ।</p>

                <div className="mt-6 space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>5 Users (Admin, Cashier, Munshis)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-white">अनलिमिटेड गाड़ियां व सौदे (Unlimited)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Crate Ledger &amp; Driver Freight</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Double-Entry Journal &amp; Balance Sheet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Custom Mandi Expenses &amp; Varieties Master</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openAuth('signup')}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer hover:scale-105"
              >
                Mandi Pro चुनें (Recommended)
              </button>
            </div>

            {/* Plan 3: Enterprise */}
            <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Enterprise</span>
                <h3 className="text-xl font-bold text-white mt-1">कॉर्पोरेट मंडी लीडर</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">₹4,999</span>
                  <span className="text-xs text-slate-400">/ माह (Monthly)</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">मल्टी-ब्रांच व कोल्ड स्टोरेज नेटवर्क के लिए।</p>

                <div className="mt-6 space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited Staff Accounts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Multi-Branch &amp; Yard Storage Sync</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Cold Storage Integration Ready</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dedicated 24/7 Account Manager</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openAuth('signup')}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Enterprise शुरू करें
              </button>
            </div>

          </div>

        </div>
      </section>


      {/* ──────────────────────────────────────────────────────────────────────────
          7. CONTACT & SUPPORT SECTION
      ────────────────────────────────────────────────────────────────────────── */}
      <section id="contact" className="py-20 bg-slate-950 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Contact Info */}
            <div className="space-y-6">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
                Help &amp; Mandi Onboarding / सहायता व संपर्क
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                अपनी मंडी में डिजिटल शुरुआत के लिए संपर्क करें
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                हमारी टीम आपकी आढ़त या स्टोर के अनुसार संपूर्ण सेटअप, मुनीम ट्रेनिंग और डेटा माइग्रेशन में सहायता करती है।
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 p-3.5 bg-slate-900 rounded-2xl border border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">कॉल व व्हाट्सएप सहायता (Helpline)</div>
                    <div className="font-bold text-white text-sm">+91 98110 12345 / 98200 11223</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-slate-900 rounded-2xl border border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">ईमेल सपोर्ट (Email Support)</div>
                    <div className="font-bold text-white text-sm">support@arhatpro.com</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-slate-900 rounded-2xl border border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">मुख्य कार्यालय (Head Office)</div>
                    <div className="font-bold text-white text-sm">APMC Commercial Building, Azadpur Mandi, Delhi - 110033</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Inquiry Form */}
            <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-1">
                डेमो व पूछताछ फॉर्म (Request Demo &amp; Setup)
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                अपना विवरण भरें, हमारे मंडी विशेषज्ञ 30 मिनट में आपसे संपर्क करेंगे।
              </p>

              {contactSubmitted ? (
                <div className="p-6 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h4 className="text-base font-bold text-white">धन्यवाद! अनुरोध प्राप्त हुआ</h4>
                  <p className="text-xs text-slate-300">
                    हमारे प्रतिनिधि आपसे जल्द ही संपर्क करेंगे और आपकी मंडी के लिए लाइव डेमो सेटअप करेंगे।
                  </p>
                  <button
                    onClick={() => setContactSubmitted(false)}
                    className="text-xs font-bold text-emerald-400 hover:underline pt-2 cursor-pointer"
                  >
                    नया फॉर्म भरें (Submit another inquiry)
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">आपका नाम (Your Name) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">मोबाइल नंबर (Phone) *</label>
                      <input
                        type="text"
                        required
                        placeholder="10-digit mobile"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">मंडी का नाम (Mandi Name)</label>
                      <input
                        type="text"
                        placeholder="उदा. आज़ादपुर / वाशी / खन्ना"
                        value={contactForm.mandiName}
                        onChange={(e) => setContactForm({ ...contactForm, mandiName: e.target.value })}
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">व्यापार का प्रकार (Business Model)</label>
                    <select
                      value={contactForm.businessType}
                      onChange={(e) => setContactForm({ ...contactForm, businessType: e.target.value })}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="banana_store">🍌 Banana Store &amp; Ripening Chamber</option>
                      <option value="cold_storage">❄️ Potato / Apple Cold Storage</option>
                      <option value="grain_mandi">🌾 Grain / Anaj Mandi Commission</option>
                      <option value="fruit_vegetable">🍎 Fruit &amp; Vegetable APMC Yard</option>
                      <option value="general">📦 General Wholesale &amp; Trading</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">संदेश (Optional Message)</label>
                    <textarea
                      rows="3"
                      placeholder="आपकी दुकान नंबर, रोज़ाना गाड़ियां या विशेष आवश्यकता..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-all cursor-pointer"
                  >
                    डेमो व सेटअप कॉल बुक करें →
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>
      </section>


      {/* ──────────────────────────────────────────────────────────────────────────
          8. MODERN FOOTER
      ────────────────────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌾</span>
                <span className="font-black text-lg text-white">ARHATPRO MANDI ERP</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                भारत का प्रमुख बहु-मंडी ईआरपी प्लेटफ़ॉर्म। केला स्टोर, कोल्ड स्टोरेज, फल, सब्जी और अनाज आढ़त का सम्पूर्ण डिजिटल प्रबंधन।
              </p>
              <div className="text-[10px] text-emerald-400 font-bold">
                ✓ Cloud-Native • PostgreSQL • APMC Ready
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Mandi Models</h4>
              <ul className="space-y-2 text-[11px]">
                <li><a href="#solutions" className="hover:text-white">केला स्टोर व राइपनिंग चैंबर</a></li>
                <li><a href="#solutions" className="hover:text-white">आलू व सेब कोल्ड स्टोरेज</a></li>
                <li><a href="#solutions" className="hover:text-white">अनाज / गल्ला मंडी आढ़त</a></li>
                <li><a href="#solutions" className="hover:text-white">फल व सब्जी एपीएमसी मंडी</a></li>
                <li><a href="#solutions" className="hover:text-white">सामान्य थोक व्यापार</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Core Features</h4>
              <ul className="space-y-2 text-[11px]">
                <li><a href="#features" className="hover:text-white">1-Minute Quick Trade</a></li>
                <li><a href="#features" className="hover:text-white">Plastic Crate Circulation</a></li>
                <li><a href="#features" className="hover:text-white">Driver Freight Head &amp; Ledger</a></li>
                <li><a href="#features" className="hover:text-white">Double-Entry Rokad &amp; Bahi-Khata</a></li>
                <li><a href="#features" className="hover:text-white">Shift-wise Audit Logs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2 text-[11px]">
                <li><button onClick={() => openAuth('login')} className="hover:text-white text-left cursor-pointer">🔐 {isHindi ? 'आढ़ती लॉग इन (Login)' : 'Merchant Login'}</button></li>
                <li><button onClick={() => openAuth('signup')} className="hover:text-white text-left cursor-pointer">🚀 {isHindi ? 'नया खाता बनाएं (Sign Up)' : 'Create Free Account'}</button></li>
                <li><a href="#pricing" className="hover:text-white">💰 {isHindi ? 'प्लान्स व फीस' : 'Subscription Plans'}</a></li>
                <li><a href="#contact" className="hover:text-white">📞 {isHindi ? 'मंडी सहायता व संपर्क' : 'Help & Support'}</a></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © 2026 ArhatPro Mandi ERP. All rights reserved. Made for Indian Mandis with ❤️
            </div>
            <div className="flex gap-4">
              <span>APMC Act Compliant</span>
              <span>•</span>
              <span>100% Data Confidentiality</span>
              <span>•</span>
              <span>Daily Automated Backups</span>
            </div>
          </div>

        </div>
      </footer>


      {/* ──────────────────────────────────────────────────────────────────────────
          9. FLOATING WHATSAPP / CONTACT ACTION BUTTON
      ────────────────────────────────────────────────────────────────────────── */}
      <a
        href="https://wa.me/919811012345?text=Hello%20ArhatPro%20Team,%20I%20want%20to%20learn%20more%20about%20the%20Mandi%20ERP%20for%20my%20agency."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
        title="WhatsApp Mandi Helpdesk"
      >
        <span className="text-base">💬</span>
        <span className="hidden sm:inline">मंडी हेल्पलाइन (WhatsApp)</span>
      </a>


      {/* ──────────────────────────────────────────────────────────────────────────
          10. AUTH MODAL (LOGIN / SIGNUP POPUP)
      ────────────────────────────────────────────────────────────────────────── */}
      <AuthModal
        isModal={true}
        isOpen={authModalOpen}
        initialTab={authModalTab}
        initialBusinessType={authModalBusinessType}
        onClose={() => setAuthModalOpen(false)}
      />

    </div>
  );
}