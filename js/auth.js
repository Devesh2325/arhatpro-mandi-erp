/**
 * Authentication, Multi-Tenant Role Enforcement & Impersonation Engine
 * Exclusive Platform Super Admin: dmchaturvedi@gmail.com
 * Supports Tenant Admins (Shop Admins), Staff, Subscription Context, and View-Only Audit Impersonation
 */

const AuthManager = {
  currentUser: null,
  isImpersonating: false,
  impersonatedTenantId: null,

  // Exclusive Platform Owner & Default Agency Users
  defaultUsers: [
    {
      id: 'usr-superadmin',
      name: 'Devesh Chaturvedi',
      email: 'dmchaturvedi@gmail.com',
      phone: '9999999999',
      pin: 'Devesh@23251995',
      password: 'Devesh@23251995',
      role: 'super_admin',
      roleLabel: 'Platform Super Admin',
      tenantId: null // Global platform oversight
    },
    {
      id: 'usr-sgfc-admin',
      name: 'Ganesh Shanker',
      email: 'ganesh@shreeganesh.com',
      phone: '9810012345',
      pin: '1234',
      password: '1234',
      role: 'shop_admin',
      roleLabel: 'Agency Owner / Partner',
      tenantId: 'tenant-sgfc',
      managedTenantIds: ['tenant-sgfc']
    },
    {
      id: 'usr-sgfc-munshi',
      name: 'Radhe Shyam',
      email: 'radhe@shreeganesh.com',
      phone: '9816612345',
      pin: '1111',
      password: '1111',
      role: 'munshi',
      roleLabel: 'Munshi (Data Entry)',
      tenantId: 'tenant-sgfc'
    },
    {
      id: 'usr-sgfc-accountant',
      name: 'Mohan Lal',
      email: 'mohan@shreeganesh.com',
      phone: '9817712345',
      pin: '2222',
      password: '2222',
      role: 'accountant',
      roleLabel: 'Accountant (Cashier)',
      tenantId: 'tenant-sgfc'
    }
  ],

  init: function() {
    // 1. Check saved auth session
    const savedSession = localStorage.getItem('mandi_auth_session');
    if (savedSession) {
      try {
        this.currentUser = JSON.parse(savedSession);
      } catch (e) {
        this.currentUser = null;
      }
    }

    // 2. Check saved impersonation session
    const impersonated = localStorage.getItem('mandi_impersonation_session');
    if (impersonated && this.currentUser && this.currentUser.role === 'super_admin') {
      this.isImpersonating = true;
      this.impersonatedTenantId = impersonated;
    } else {
      this.isImpersonating = false;
      this.impersonatedTenantId = null;
      localStorage.removeItem('mandi_impersonation_session');
    }

    this.checkAuth();
  },

  checkAuth: function() {
    const authOverlay = document.getElementById('auth-overlay');
    if (!this.currentUser) {
      // Not logged in -> Show Auth Gate
      if (authOverlay) authOverlay.classList.remove('hidden');
      return false;
    } else {
      // Logged in -> Hide Auth Gate & initialize tenant context
      if (authOverlay) authOverlay.classList.add('hidden');
      this.applyUserContext();
      return true;
    }
  },

  applyUserContext: function() {
    if (!this.currentUser) return;

    // 1. Handle Impersonation Banner in Header
    const impersonationBanner = document.getElementById('impersonation-banner');
    const impersonationFirmSpan = document.getElementById('impersonation-firm-name');

    if (this.isImpersonating && this.impersonatedTenantId) {
      if (impersonationBanner) impersonationBanner.classList.remove('hidden');
      const auditedTenant = TenantManager.getAllTenants().find(t => t.id === this.impersonatedTenantId);
      if (impersonationFirmSpan && auditedTenant) {
        impersonationFirmSpan.textContent = `"${auditedTenant.firmName}" (${auditedTenant.shopNo})`;
      }
    } else {
      if (impersonationBanner) impersonationBanner.classList.add('hidden');
    }

    // 2. Update Sidebar User Profile Card
    const userNameEl = document.getElementById('sidebar-user-name');
    const userRoleEl = document.getElementById('sidebar-user-role');
    const userAvatarEl = document.getElementById('sidebar-user-avatar');

    if (userNameEl) {
      userNameEl.textContent = this.isImpersonating 
        ? `${this.currentUser.name} (Auditing)` 
        : this.currentUser.name;
    }
    if (userRoleEl) {
      userRoleEl.textContent = this.isImpersonating 
        ? '🔒 View-Only Audit Mode' 
        : this.currentUser.roleLabel;
    }
    if (userAvatarEl) {
      const avatars = {
        super_admin: '👑',
        shop_admin: '🏢',
        munshi: '👤',
        accountant: '💰'
      };
      userAvatarEl.textContent = this.isImpersonating ? '👀' : (avatars[this.currentUser.role] || '👤');
    }

    // 3. Set active tenant
    if (this.isImpersonating && this.impersonatedTenantId) {
      TenantManager.switchTenant(this.impersonatedTenantId);
    } else if (this.currentUser.tenantId && typeof TenantManager !== 'undefined') {
      TenantManager.switchTenant(this.currentUser.tenantId);
    } else if (this.currentUser.role === 'super_admin' && typeof TenantManager !== 'undefined') {
      // Super admin defaults to current tenant or first tenant
      TenantManager.applyActiveTenant();
    }

    // 4. Toggle Super Admin button visibility (Only for dmchaturvedi@gmail.com)
    const adminToggleBtn = document.getElementById('super-admin-toggle-btn');
    if (adminToggleBtn) {
      if (this.currentUser.role === 'super_admin') {
        adminToggleBtn.classList.remove('hidden');
        adminToggleBtn.innerHTML = '<span>👑</span> Super Admin Console';
      } else {
        adminToggleBtn.classList.add('hidden');
      }
    }
  },

  login: function(identifier, pinOrPassword) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanSecret = (pinOrPassword || '').trim();

    // Fetch custom users and merge with default users
    const customUsers = JSON.parse(localStorage.getItem('mandi_custom_users') || '[]');
    const allUsers = [...this.defaultUsers, ...customUsers];

    // Find matching user by email, phone, or id
    const user = allUsers.find(u => {
      const emailMatch = u.email && u.email.toLowerCase() === cleanId;
      const phoneMatch = u.phone && u.phone === cleanId;
      const idMatch = u.id && u.id.toLowerCase() === cleanId;
      const credMatch = (u.pin === cleanSecret || u.password === cleanSecret);
      return (emailMatch || phoneMatch || idMatch) && credMatch;
    });

    if (!user) {
      App.showToast('Invalid Email/Mobile or Password. Please verify your credentials.', 'error');
      return false;
    }

    // Guarantee that ONLY dmchaturvedi@gmail.com can have role 'super_admin'
    if (user.role === 'super_admin' && (user.email !== 'dmchaturvedi@gmail.com' && user.id !== 'usr-superadmin')) {
      App.showToast('Security Error: Unauthorized Super Admin access attempt.', 'error');
      return false;
    }

    this.currentUser = user;
    this.isImpersonating = false;
    this.impersonatedTenantId = null;
    localStorage.removeItem('mandi_impersonation_session');
    localStorage.setItem('mandi_auth_session', JSON.stringify(user));

    this.checkAuth();
    App.showToast(`Welcome back, ${user.name}! (${user.roleLabel})`, 'success');

    // Route Super Admin vs Regular Tenant
    if (user.role === 'super_admin') {
      if (typeof AdminManager !== 'undefined') {
        AdminManager.toggleSuperAdminMode(true);
      }
    } else {
      App.switchTab('quick-trade');
    }

    return true;
  },

  signup: function(agencyData) {
    const firmName = (agencyData.firmName || '').trim();
    const propName = (agencyData.proprietor || '').trim();
    const shopNo = (agencyData.shopNo || '').trim();
    const apmcLic = (agencyData.apmcLicenseNo || '').trim();
    const phone = (agencyData.phone || '').trim();
    const pin = (agencyData.pin || '1234').trim();
    const theme = agencyData.theme || 'emerald';

    if (!firmName || !propName || !phone) {
      App.showToast('Firm Name, Proprietor Name, and Mobile Number are required!', 'error');
      return false;
    }

    try {
      const tenantId = 'tenant-' + Date.now();
      const userId = 'usr-' + Date.now();

      // Expiry date 30 days from now for Monthly plan
      const now = new Date();
      now.setDate(now.getDate() + 30);
      const validUntil = now.toISOString().split('T')[0];

      const newTenant = {
        id: tenantId,
        firmName: firmName,
        proprietor: propName,
        shopNo: shopNo || 'Shop 1, Subzi Mandi',
        mandiName: agencyData.mandiName || 'Azadpur Mandi, Delhi',
        apmcLicenseNo: apmcLic || `DL-APMC-${Math.floor(1000 + Math.random() * 9000)}`,
        gstin: agencyData.gstin || '',
        phone: phone,
        bankName: 'HDFC Bank, Azadpur',
        accountNo: '502000' + Math.floor(100000 + Math.random() * 900000),
        ifsc: 'HDFC0001234',
        upiId: `${phone}@upi`,
        standardCommission: 2.5,
        palledariRatePerBox: 12,
        billFormat: 'thermal',
        themeColor: theme,
        billDisclaimer: '1. माल की तौल मुंशी के समक्ष हुई है।\n2. 7 दिन के अंदर भुगतान अनिवार्य है।',
        status: 'Active',
        ownerUserId: userId,
        subscription: {
          plan: 'Monthly',
          status: 'Active',
          validUntil: validUntil,
          price: 1999
        }
      };

      // 1. Register new tenant
      const allTenants = TenantManager.getAllTenants();
      allTenants.push(newTenant);
      TenantManager.saveTenants(allTenants);

      // 2. Seed default commodities & starter parties for this new tenant
      this.seedStarterDataForTenant(tenantId, firmName);

      // 3. Create Shop Admin User (Tenant Admin)
      const newUser = {
        id: userId,
        name: `${propName} (${firmName})`,
        phone: phone,
        email: `${phone}@mandi.in`,
        pin: pin,
        password: pin,
        role: 'shop_admin', // Strictly Tenant Admin
        roleLabel: 'Agency Owner / Partner',
        tenantId: tenantId,
        managedTenantIds: [tenantId]
      };

      const customUsers = JSON.parse(localStorage.getItem('mandi_custom_users') || '[]');
      customUsers.push(newUser);
      localStorage.setItem('mandi_custom_users', JSON.stringify(customUsers));

      // 4. Set active user session
      this.currentUser = newUser;
      this.isImpersonating = false;
      this.impersonatedTenantId = null;
      localStorage.removeItem('mandi_impersonation_session');
      localStorage.setItem('mandi_auth_session', JSON.stringify(newUser));

      // 5. Switch to the newly created agency
      TenantManager.switchTenant(tenantId);

      // 6. Hide Auth Overlay
      const authOverlay = document.getElementById('auth-overlay');
      if (authOverlay) authOverlay.classList.add('hidden');

      // 7. Update UI context and open dashboard
      this.applyUserContext();
      App.switchTab('quick-trade');

      App.showToast(`🎉 Congratulations! Agency "${firmName}" created. Welcome, ${propName}!`, 'success');
      return true;
    } catch (err) {
      console.error('Sign-up failed:', err);
      App.showToast('Registration error: ' + err.message, 'error');
      return false;
    }
  },

  // ================= VIEW-ONLY AUDIT IMPERSONATION ENGINE =================
  startImpersonation: function(tenantId) {
    if (!this.currentUser || this.currentUser.role !== 'super_admin') {
      App.showToast('Access denied: Only Super Admin can impersonate agencies.', 'error');
      return false;
    }

    const tenant = TenantManager.getAllTenants().find(t => t.id === tenantId);
    if (!tenant) {
      App.showToast('Target agency not found.', 'error');
      return false;
    }

    this.isImpersonating = true;
    this.impersonatedTenantId = tenantId;
    localStorage.setItem('mandi_impersonation_session', tenantId);

    // If currently on admin.html, navigate to index.html to view the workspace
    if (window.location.pathname.endsWith('admin.html') || window.location.pathname.includes('admin')) {
      window.location.href = 'index.html';
      return true;
    }

    // Switch tenant to audited agency
    TenantManager.switchTenant(tenantId);

    // Hide super admin portal if visible in index.html
    const superAdminEl = document.getElementById('super-admin-portal');
    if (superAdminEl) superAdminEl.classList.add('hidden');

    this.applyUserContext();
    App.switchTab('quick-trade');
    App.showToast(`Entered View-Only Audit Mode for: ${tenant.firmName}. Modifications locked.`, 'warning');
    return true;
  },

  stopImpersonation: function() {
    this.isImpersonating = false;
    this.impersonatedTenantId = null;
    localStorage.removeItem('mandi_impersonation_session');

    const banner = document.getElementById('impersonation-banner');
    if (banner) banner.classList.add('hidden');

    App.showToast('Exited Impersonation Mode. Restoring Super Admin Console.', 'info');

    // Return to Super Admin Portal
    if (window.location.pathname.endsWith('index.html') && document.getElementById('super-admin-portal')) {
      AdminManager.toggleSuperAdminMode(true);
      this.applyUserContext();
    } else {
      window.location.href = 'admin.html';
    }
  },

  assertCanMutate: function(actionDescription) {
    if (this.isImpersonating) {
      const msg = `🔒 View-Only Audit Mode: Cannot ${actionDescription || 'modify data'} while impersonating an agency. Changes are strictly locked.`;
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(msg, 'warning');
      } else {
        alert(msg);
      }
      return false;
    }
    return true;
  },

  seedStarterDataForTenant: function(tenantId, firmName) {
    // Starter Commodities
    const starterCommodities = [
      { id: 'COMM-1', nameEn: 'Apple - Royal Delicious', nameHi: 'सेब - रॉयल', category: 'Fruit', defaultUnit: 'Box (20kg)', unitWeightKg: 20, tareDeductionKg: 1.5, standardCommissionPct: 2.5, palledariRatePerUnit: 12, active: true },
      { id: 'COMM-2', nameEn: 'Pomegranate - Solapur Bhagwa', nameHi: 'अनार - भगवा', category: 'Fruit', defaultUnit: 'Crate (10kg)', unitWeightKg: 10, tareDeductionKg: 0.8, standardCommissionPct: 3.0, palledariRatePerUnit: 8, active: true },
      { id: 'COMM-3', nameEn: 'Onion - Red Garwa', nameHi: 'प्याज - लाल गरवा', category: 'Vegetable', defaultUnit: 'Sack (50kg)', unitWeightKg: 50, tareDeductionKg: 1.0, standardCommissionPct: 2.0, palledariRatePerUnit: 8, active: true }
    ];
    localStorage.setItem(`mandi_commodities_${tenantId}`, JSON.stringify(starterCommodities));

    // Starter Parties
    const starterParties = [
      { id: 'P-1', shortCode: 'AGW', name: 'Aggarwal Wholesale Mart', type: 'Buyer', mobile: '+91 98110 55432', address: 'Shop 14, Mandi Yard', creditLimit: 200000, currentBalance: 0 },
      { id: 'P-2', shortCode: 'RJD', name: 'Rajdhani Hotel Supplies', type: 'Buyer', mobile: '+91 99100 88776', address: 'B-21, Daryaganj', creditLimit: 150000, currentBalance: 0 },
      { id: 'P-3', shortCode: 'NEG', name: 'Harish Negi', type: 'Farmer', mobile: '+91 98160 44321', address: 'Kotkhai, Shimla (HP)', creditLimit: 0, currentBalance: 0 }
    ];
    localStorage.setItem(`mandi_parties_${tenantId}`, JSON.stringify(starterParties));
  },

  logout: function() {
    this.currentUser = null;
    this.isImpersonating = false;
    this.impersonatedTenantId = null;
    localStorage.removeItem('mandi_auth_session');
    localStorage.removeItem('mandi_impersonation_session');
    
    // Show Auth Screen
    const authOverlay = document.getElementById('auth-overlay');
    if (authOverlay) authOverlay.classList.remove('hidden');

    const banner = document.getElementById('impersonation-banner');
    if (banner) banner.classList.add('hidden');

    App.showToast('You have been logged out safely.', 'info');
  },

  switchAuthTab: function(tabKey) {
    const tabLogin = document.getElementById('auth-tab-login');
    const tabSignup = document.getElementById('auth-tab-signup');
    const formLogin = document.getElementById('auth-form-login');
    const formSignup = document.getElementById('auth-form-signup');

    if (tabKey === 'login') {
      tabLogin?.classList.add('bg-slate-900', 'text-white');
      tabLogin?.classList.remove('bg-slate-100', 'text-slate-700');
      tabSignup?.classList.remove('bg-slate-900', 'text-white');
      tabSignup?.classList.add('bg-slate-100', 'text-slate-700');
      formLogin?.classList.remove('hidden');
      formSignup?.classList.add('hidden');
    } else {
      tabSignup?.classList.add('bg-slate-900', 'text-white');
      tabSignup?.classList.remove('bg-slate-100', 'text-slate-700');
      tabLogin?.classList.remove('bg-slate-900', 'text-white');
      tabLogin?.classList.add('bg-slate-100', 'text-slate-700');
      formSignup?.classList.remove('hidden');
      formLogin?.classList.add('hidden');
    }
  }
};
