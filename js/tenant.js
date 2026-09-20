/**
 * Multi-Tenant & White-Label Management Engine for Azadpur Mandi Commission Agents
 * Supports Custom Branding, Theme Presets, Subscriptions, and Strict Multi-Tenant Isolation
 */

const TenantManager = {
  currentTenantId: 'tenant-sgfc',

  // Subscription Plans
  subscriptionPlans: {
    Monthly: { name: 'Monthly', price: 1999, label: 'Standard Monthly (₹1,999/mo)' },
    Yearly: { name: 'Yearly', price: 19999, label: 'Annual Pro (₹19,999/yr)' },
    Enterprise: { name: 'Enterprise', price: 49999, label: 'Enterprise Custom (₹49,999/yr)' }
  },

  themePresets: {
    emerald: { primary: '#15803d', primaryDark: '#166534', light: '#dcfce7', label: 'Emerald Green (फल मंडी)', badgeClass: 'bg-emerald-100 text-emerald-800' },
    navy: { primary: '#1e3a8a', primaryDark: '#172554', light: '#dbeafe', label: 'Royal Navy (अनाज मंडी)', badgeClass: 'bg-blue-100 text-blue-800' },
    maroon: { primary: '#881337', primaryDark: '#4c0519', light: '#ffe4e6', label: 'Crimson Maroon (मसाला मंडी)', badgeClass: 'bg-rose-100 text-rose-800' },
    purple: { primary: '#6b21a8', primaryDark: '#3b0764', light: '#f3e8ff', label: 'Royal Purple (सब्जी मंडी)', badgeClass: 'bg-purple-100 text-purple-800' },
    amber: { primary: '#b45309', primaryDark: '#78350f', light: '#fef3c7', label: 'Amber Gold (प्याज-आलू मंडी)', badgeClass: 'bg-amber-100 text-amber-800' },
    slate: { primary: '#334155', primaryDark: '#0f172a', light: '#f1f5f9', label: 'Graphite Slate (कॉरपोरेट)', badgeClass: 'bg-slate-200 text-slate-800' }
  },

  defaultTenants: [
    {
      id: 'tenant-sgfc',
      firmName: 'Shree Ganesh Fruit Co.',
      hindiName: 'श्री गणेश फ्रूट कंपनी',
      tagline: 'Commission Agent & General Order Suppliers',
      proprietor: 'Ganesh Shanker',
      shopNo: 'Shop No. C-42, New Fruit Market',
      mandiName: 'Azadpur Mandi, Delhi - 110033',
      apmcLicenseNo: 'DL-APMC-F-10492',
      gstin: '07AABCU9812K1Z5',
      phone: '+91 98111 09876',
      altPhone: '+91 98710 12345',
      bankName: 'ICICI Bank, Azadpur Branch',
      accountNo: '010405001234',
      ifsc: 'ICIC0000104',
      upiId: 'shreeganesh.fruit@icici',
      standardCommission: 2.5,
      palledariRatePerBox: 12,
      stationeryCharges: 15,
      billFormat: 'thermal', // 'thermal' (80mm) or 'a4'
      billDisclaimer: '1. Payment strictly due within 7 days of sale.\n2. Interest @ 1.5% per month charged on delayed payments.\n3. Goods once sold will not be taken back.\n4. All disputes subject to Delhi APMC Jurisdiction.',
      logoIcon: '🍎',
      themeColor: 'emerald',
      ownerUserId: 'usr-sgfc-admin',
      status: 'Active',
      subscription: {
        plan: 'Monthly',
        status: 'Active',
        validUntil: '2026-10-20',
        price: 1999
      }
    },
    {
      id: 'tenant-csop',
      firmName: 'Choudhary & Sons Onion & Potato Agency',
      hindiName: 'चौधरी एंड संस प्याज व आलू आढ़त',
      tagline: 'Leading Commission Agent in Onion & Potato Yard',
      proprietor: 'Satish Choudhary',
      shopNo: 'Shop No. B-12, Onion Yard',
      mandiName: 'Azadpur Mandi, Delhi - 110033',
      apmcLicenseNo: 'DL-APMC-O-08812',
      gstin: '07BBPCU4321M2Z8',
      phone: '+91 94231 87211',
      altPhone: '+91 98110 99887',
      bankName: 'State Bank of India, Subzi Mandi',
      accountNo: '30491823901',
      ifsc: 'SBIN0001289',
      upiId: 'choudhary.onion@sbi',
      standardCommission: 2.5,
      palledariRatePerBox: 15,
      stationeryCharges: 10,
      billFormat: 'a4',
      billDisclaimer: '1. Goods sold on spot inspection.\n2. Payment terms 10 days credit.\n3. Weight verified at APMC Weighbridge.\n4. Subject to APMC Delhi Byelaws.',
      logoIcon: '🧅',
      themeColor: 'amber',
      ownerUserId: 'usr-csop-admin',
      status: 'Active',
      subscription: {
        plan: 'Yearly',
        status: 'Active',
        validUntil: '2027-09-20',
        price: 19999
      }
    }
  ],

  init: function() {
    this.loadTenants();
    this.applyActiveTenant();
  },

  loadTenants: function() {
    const saved = localStorage.getItem('mandi_tenants');
    if (!saved) {
      localStorage.setItem('mandi_tenants', JSON.stringify(this.defaultTenants));
    }
    const savedActive = localStorage.getItem('mandi_active_tenant_id');
    if (savedActive) {
      this.currentTenantId = savedActive;
    }
  },

  getAllTenants: function() {
    const data = localStorage.getItem('mandi_tenants');
    return data ? JSON.parse(data) : this.defaultTenants;
  },

  saveTenants: function(tenantsList) {
    localStorage.setItem('mandi_tenants', JSON.stringify(tenantsList));
  },

  get tenants() {
    return this.getAllTenants();
  },

  getActiveTenant: function() {
    const tenants = this.getAllTenants();
    return tenants.find(t => t.id === this.currentTenantId) || tenants[0];
  },

  // STRICT MULTI-TENANT ISOLATION FILTER
  getAccessibleTenants: function(user) {
    const all = this.getAllTenants();
    const u = user || (typeof AuthManager !== 'undefined' ? AuthManager.currentUser : null);

    // 1. Super Admin has full platform visibility
    if (u && u.role === 'super_admin') {
      return all;
    }

    // 2. In Impersonation Mode, locked to the impersonated tenant
    if (typeof AuthManager !== 'undefined' && AuthManager.isImpersonating && AuthManager.impersonatedTenantId) {
      return all.filter(t => t.id === AuthManager.impersonatedTenantId);
    }

    if (!u) {
      return [all[0]];
    }

    // 3. Tenant Admin (Shop Admin): ONLY see agencies they created or manage
    if (u.role === 'shop_admin') {
      const filtered = all.filter(t => 
        t.ownerUserId === u.id || 
        (u.managedTenantIds && u.managedTenantIds.includes(t.id)) ||
        t.id === u.tenantId
      );
      return filtered.length > 0 ? filtered : [all.find(t => t.id === u.tenantId) || all[0]];
    }

    // 4. Staff members (Munshi, Accountant, Cashier): locked strictly to their assigned shop
    const staffTenants = all.filter(t => t.id === u.tenantId);
    return staffTenants.length > 0 ? staffTenants : [all[0]];
  },

  switchTenant: function(tenantId) {
    // Check permission to access this tenant
    const accessible = this.getAccessibleTenants();
    const allowed = accessible.some(t => t.id === tenantId);
    if (!allowed && typeof AuthManager !== 'undefined' && AuthManager.currentUser && AuthManager.currentUser.role !== 'super_admin') {
      App.showToast('Access denied: You do not have permission to view this agency workspace.', 'error');
      return;
    }

    this.currentTenantId = tenantId;
    localStorage.setItem('mandi_active_tenant_id', tenantId);
    this.applyActiveTenant();
    
    // Refresh all child modules with tenant-isolated data
    if (typeof CommodityManager !== 'undefined') CommodityManager.init();
    if (typeof PartyManager !== 'undefined') PartyManager.init();
    if (typeof TeamManager !== 'undefined') TeamManager.init();
    if (typeof ArrivalsManager !== 'undefined') ArrivalsManager.init();
    if (typeof AuctionEngine !== 'undefined') AuctionEngine.init();
    if (typeof UnifiedTrade !== 'undefined') UnifiedTrade.init();
    if (typeof BahiKhata !== 'undefined') BahiKhata.init();
    if (typeof ReportsHub !== 'undefined') ReportsHub.renderActiveReport();
    if (typeof SettingsManager !== 'undefined') SettingsManager.renderActiveSubTab();
    
    App.showToast(`Active Agency: ${this.getActiveTenant().firmName}`, 'success');
  },

  applyActiveTenant: function() {
    const t = this.getActiveTenant();
    
    // Update navbar branding
    const nameEl = document.getElementById('tenant-firm-name');
    if (nameEl) nameEl.textContent = t.firmName;

    const subEl = document.getElementById('tenant-shop-sub');
    if (subEl) subEl.textContent = `${t.shopNo} • Lic: ${t.apmcLicenseNo}`;

    const iconEl = document.getElementById('tenant-logo-icon');
    if (iconEl) iconEl.textContent = t.logoIcon || '🌾';

    // Apply Brand Theme Color
    this.applyTheme(t.themeColor || 'emerald');

    // Update Subscription Badge
    const subBadge = document.getElementById('tenant-subscription-badge');
    if (subBadge) {
      const sub = t.subscription || { plan: 'Monthly', status: 'Active', validUntil: '2026-10-20' };
      const planStyles = {
        Monthly: 'bg-blue-100 text-blue-900 border-blue-200',
        Yearly: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        Enterprise: 'bg-purple-100 text-purple-900 border-purple-200'
      };
      const badgeClass = planStyles[sub.plan] || 'bg-slate-100 text-slate-800 border-slate-200';
      subBadge.className = `px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide border ${badgeClass}`;
      subBadge.textContent = `⭐ ${sub.plan.toUpperCase()} • ${sub.status.toUpperCase()}`;
      subBadge.title = `Valid Until: ${sub.validUntil || 'Active'}`;
    }

    // Populate dropdown switcher with STRICTLY ACCESSIBLE agencies
    const select = document.getElementById('tenant-switcher-select');
    if (select) {
      const accessibleTenants = this.getAccessibleTenants();
      select.innerHTML = accessibleTenants.map(item => `
        <option value="${item.id}" ${item.id === t.id ? 'selected' : ''}>
          ${item.logoIcon || '🏢'} ${item.firmName} (${item.shopNo})
        </option>
      `).join('');

      // If user only owns or has access to 1 agency, disable the dropdown so they cannot switch
      if (accessibleTenants.length <= 1) {
        select.disabled = true;
        select.title = 'Single Agency Workspace (Isolated)';
      } else {
        select.disabled = false;
        select.title = 'Switch Between Your Agencies';
      }
    }
  },

  applyTheme: function(themeKey) {
    const preset = this.themePresets[themeKey] || this.themePresets.emerald;
    document.documentElement.style.setProperty('--primary', preset.primary);
    document.documentElement.style.setProperty('--primary-dark', preset.primaryDark);
    document.documentElement.style.setProperty('--primary-light', preset.light);

    // Update branding badge in sidebar
    const logoContainer = document.getElementById('tenant-logo-icon');
    if (logoContainer) {
      logoContainer.style.background = `linear-gradient(135deg, ${preset.primary}, ${preset.primaryDark})`;
    }
  },

  saveTenantSettings: function(updatedData) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('save tenant configurations')) {
      return false;
    }

    const tenants = this.getAllTenants();
    const idx = tenants.findIndex(t => t.id === this.currentTenantId);
    if (idx !== -1) {
      tenants[idx] = { ...tenants[idx], ...updatedData };
      this.saveTenants(tenants);
      this.applyActiveTenant();
      App.showToast('Firm white-label branding & configurations saved!', 'success');
      return true;
    }
    return false;
  },

  registerNewTenant: function(newTenantData) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('onboard new agency')) {
      return null;
    }

    const tenants = this.getAllTenants();
    const newId = 'tenant-' + Date.now();
    const now = new Date();
    now.setDate(now.getDate() + 30);

    const tenantObj = {
      id: newId,
      ...newTenantData,
      logoIcon: newTenantData.logoIcon || '🏪',
      themeColor: newTenantData.themeColor || 'emerald',
      status: 'Active',
      subscription: newTenantData.subscription || {
        plan: 'Monthly',
        status: 'Active',
        validUntil: now.toISOString().split('T')[0],
        price: 1999
      }
    };

    tenants.push(tenantObj);
    this.saveTenants(tenants);
    this.switchTenant(newId);
    App.showToast(`New agency firm "${tenantObj.firmName}" onboarded successfully!`, 'success');
    return tenantObj;
  }
};
