/**
 * Platform Super Admin Portal (मंडी प्लेटफॉर्म सुपर एडमिन)
 * Central management for Subscriptions (Monthly, Yearly, Enterprise),
 * View-Only Audit Impersonation, and Mandi Commission Agencies
 */

const AdminManager = {
  isSuperAdminMode: false,
  pendingRequests: [],

  defaultRequests: [
    {
      id: 'REQ-101',
      firmName: 'Kishan Lal Fruit Agency',
      proprietor: 'Kishan Lal Khatri',
      shopNo: 'Shop No. D-18, New Fruit Market',
      mandiName: 'Azadpur Mandi, Delhi',
      apmcLicenseNo: 'DL-APMC-F-11029',
      phone: '+91 98112 33445',
      requestedAt: '2026-09-20 07:15 AM',
      status: 'Pending'
    },
    {
      id: 'REQ-102',
      firmName: 'Haryana Sabzi Commission Agency',
      proprietor: 'Mukesh Saini',
      shopNo: 'Shop No. A-55, Subzi Mandi',
      mandiName: 'Azadpur Mandi, Delhi',
      apmcLicenseNo: 'DL-APMC-S-09412',
      phone: '+91 98120 77661',
      requestedAt: '2026-09-20 08:30 AM',
      status: 'Pending'
    }
  ],

  init: function() {
    const savedReqs = localStorage.getItem('mandi_agent_requests');
    this.pendingRequests = savedReqs ? JSON.parse(savedReqs) : this.defaultRequests;
    this.renderAdminDashboard();
  },

  saveRequests: function() {
    localStorage.setItem('mandi_agent_requests', JSON.stringify(this.pendingRequests));
  },

  toggleSuperAdminMode: function(forceState) {
    if (typeof forceState === 'boolean') {
      this.isSuperAdminMode = forceState;
    } else {
      this.isSuperAdminMode = !this.isSuperAdminMode;
    }
    
    const adminSection = document.getElementById('super-admin-portal');
    const toggleBtn = document.getElementById('super-admin-toggle-btn');

    if (this.isSuperAdminMode) {
      // Hide all standard operation sections
      const sections = [
        'quick-trade-section',
        'arrivals-section',
        'sales-section',
        'bahi-khata-section',
        'reports-section',
        'settings-section',
        'mandi-bhav-section'
      ];
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });

      if (adminSection) adminSection.classList.remove('hidden');

      if (toggleBtn) {
        toggleBtn.innerHTML = '🏢 Exit Super Admin';
        toggleBtn.className = 'w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all';
      }
      this.renderAdminDashboard();
      if (typeof App !== 'undefined') App.showToast('Super Admin Console Active', 'info');
    } else {
      if (adminSection) adminSection.classList.add('hidden');
      if (toggleBtn) {
        toggleBtn.innerHTML = '<span>👑</span> Super Admin Console';
        toggleBtn.className = 'w-full py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all';
      }
      if (typeof App !== 'undefined') App.switchTab('quick-trade');
    }
  },

  renderAdminDashboard: function() {
    const tenants = TenantManager.getAllTenants();
    const statsContainer = document.getElementById('admin-stats-summary');
    const tableContainer = document.getElementById('admin-agents-table-body');
    const requestsContainer = document.getElementById('admin-requests-table-body');
    if (!tableContainer) return;

    let totalAgents = tenants.length;
    let activeAgents = tenants.filter(t => t.status !== 'Suspended').length;
    let monthlyCount = tenants.filter(t => (t.subscription?.plan || 'Monthly') === 'Monthly').length;
    let yearlyCount = tenants.filter(t => t.subscription?.plan === 'Yearly').length;
    let enterpriseCount = tenants.filter(t => t.subscription?.plan === 'Enterprise').length;
    let pendingCount = this.pendingRequests.filter(r => r.status === 'Pending').length;

    // Monthly Recurring Revenue estimate
    let mrr = (monthlyCount * 1999) + (yearlyCount * (19999 / 12)) + (enterpriseCount * (49999 / 12));

    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-xs font-bold text-slate-400 uppercase block tracking-wider">Total Onboarded Agencies</span>
            <span class="text-2xl font-black text-purple-900 mt-1 block">${totalAgents} Firms</span>
            <span class="text-xs text-emerald-600 font-bold">${activeAgents} Active Workspaces</span>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-xs font-bold text-slate-400 uppercase block tracking-wider">Active Subscriptions</span>
            <span class="text-2xl font-black text-emerald-700 mt-1 block">${activeAgents} Paying</span>
            <span class="text-xs text-slate-500 font-semibold">${monthlyCount} Monthly • ${yearlyCount} Yearly • ${enterpriseCount} Enterprise</span>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-xs font-bold text-slate-400 uppercase block tracking-wider">Estimated Monthly MRR</span>
            <span class="text-2xl font-black text-slate-900 mt-1 block">₹${Math.round(mrr).toLocaleString('en-IN')}</span>
            <span class="text-xs text-purple-700 font-bold">Recurring SaaS Revenue</span>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-xs font-bold text-slate-400 uppercase block tracking-wider">Pending Access Applications</span>
            <span class="text-2xl font-black text-amber-700 mt-1 block">${pendingCount} Pending</span>
            <span class="text-xs text-amber-600 font-bold">Requires Super Admin Approval</span>
          </div>
        </div>
      `;
    }

    // Render Active Tenants & Subscriptions Table
    tableContainer.innerHTML = tenants.map(t => {
      const isSuspended = t.status === 'Suspended';
      const sub = t.subscription || { plan: 'Monthly', status: 'Active', validUntil: '2026-10-20', price: 1999 };
      const planStyles = {
        Monthly: 'bg-blue-100 text-blue-900 border-blue-300',
        Yearly: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        Enterprise: 'bg-purple-100 text-purple-900 border-purple-300'
      };

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
          <td class="p-3.5">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">${t.logoIcon || '🏢'}</span>
              <div>
                <span class="font-bold text-slate-900 text-sm block">${t.firmName}</span>
                <span class="text-xs text-slate-500">${t.shopNo}, ${t.mandiName}</span>
                <span class="text-[11px] font-mono text-purple-700 block">UPI: ${t.upiId}</span>
              </div>
            </div>
          </td>
          <td class="p-3.5">
            <div class="font-bold text-slate-800 text-xs">${t.proprietor}</div>
            <div class="text-xs text-slate-500">📞 ${t.phone}</div>
            <span class="font-mono text-[10px] text-slate-400 block">${t.apmcLicenseNo}</span>
          </td>
          <td class="p-3.5">
            <div class="space-y-1.5">
              <select onchange="AdminManager.updateSubscriptionPlan('${t.id}', this.value)" 
                class="text-xs font-bold p-1.5 border rounded-lg bg-white ${planStyles[sub.plan] || ''}">
                <option value="Monthly" ${sub.plan === 'Monthly' ? 'selected' : ''}>Monthly (₹1,999/mo)</option>
                <option value="Yearly" ${sub.plan === 'Yearly' ? 'selected' : ''}>Yearly (₹19,999/yr)</option>
                <option value="Enterprise" ${sub.plan === 'Enterprise' ? 'selected' : ''}>Enterprise (₹49,999/yr)</option>
              </select>
              <div class="flex items-center gap-1">
                <span class="text-[10px] font-bold text-slate-500">Till: ${sub.validUntil || 'Active'}</span>
                <button onclick="AdminManager.extendSubscription('${t.id}', 30)" title="Add 30 Days" 
                  class="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[9px] font-bold">+30D</button>
                <button onclick="AdminManager.extendSubscription('${t.id}', 365)" title="Add 1 Year" 
                  class="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[9px] font-bold">+1Y</button>
              </div>
            </div>
          </td>
          <td class="p-3.5 text-center">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold ${isSuspended ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">
              ${isSuspended ? 'Suspended' : 'Active'}
            </span>
          </td>
          <td class="p-3.5 text-right">
            <div class="flex items-center justify-end gap-2">
              <!-- View-Only Impersonation Button -->
              <button onclick="AdminManager.launchImpersonation('${t.id}')" 
                title="Inspect agency workspace in locked read-only audit mode"
                class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1">
                <span>👀</span> Impersonate (Audit)
              </button>
              <button onclick="AdminManager.toggleAgentStatus('${t.id}')" 
                class="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors">
                ${isSuspended ? 'Activate' : 'Suspend'}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Render Pending Requests Table
    if (requestsContainer) {
      const pending = this.pendingRequests.filter(r => r.status === 'Pending');
      if (pending.length === 0) {
        requestsContainer.innerHTML = `
          <tr>
            <td colspan="5" class="p-8 text-center bg-slate-50 rounded-xl">
              <div class="max-w-xs mx-auto text-center space-y-1">
                <span class="text-2xl block">✓</span>
                <p class="text-xs font-bold text-slate-700">All agency access requests reviewed</p>
                <p class="text-[11px] text-slate-400">New agents who request access will appear here for your approval.</p>
              </div>
            </td>
          </tr>
        `;
      } else {
        requestsContainer.innerHTML = pending.map(req => `
          <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="p-3">
              <div class="font-bold text-slate-900 text-xs">${req.firmName}</div>
              <div class="text-[11px] text-slate-500">${req.shopNo} • ${req.mandiName}</div>
              <span class="text-[10px] text-slate-400 font-mono">${req.requestedAt}</span>
            </td>
            <td class="p-3">
              <div class="font-bold text-slate-800 text-xs">${req.proprietor}</div>
              <div class="text-[11px] text-slate-500">${req.phone}</div>
            </td>
            <td class="p-3 font-mono text-xs font-bold text-purple-800">
              ${req.apmcLicenseNo}
            </td>
            <td class="p-3 text-center">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                Pending Approval
              </span>
            </td>
            <td class="p-3 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <button onclick="AdminManager.approveAgencyRequest('${req.id}')" 
                  class="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm">
                  ✓ Approve & Launch
                </button>
                <button onclick="AdminManager.rejectAgencyRequest('${req.id}')" 
                  class="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                  ✕ Reject
                </button>
              </div>
            </td>
          </tr>
        `).join('');
      }
    }
  },

  // ================= SUBSCRIPTION MANAGEMENT =================
  updateSubscriptionPlan: function(tenantId, newPlan) {
    const tenants = TenantManager.getAllTenants();
    const t = tenants.find(item => item.id === tenantId);
    if (!t) return;

    const prices = { Monthly: 1999, Yearly: 19999, Enterprise: 49999 };
    t.subscription = t.subscription || {};
    t.subscription.plan = newPlan;
    t.subscription.price = prices[newPlan] || 1999;
    t.subscription.status = 'Active';

    TenantManager.saveTenants(tenants);
    TenantManager.applyActiveTenant();
    this.renderAdminDashboard();

    const toastMsg = `Subscription plan for "${t.firmName}" updated to ${newPlan}!`;
    if (typeof App !== 'undefined') App.showToast(toastMsg, 'success');
    else alert(toastMsg);
  },

  extendSubscription: function(tenantId, days) {
    const tenants = TenantManager.getAllTenants();
    const t = tenants.find(item => item.id === tenantId);
    if (!t) return;

    t.subscription = t.subscription || { plan: 'Monthly', status: 'Active' };
    let currentExpiry = t.subscription.validUntil ? new Date(t.subscription.validUntil) : new Date();
    if (isNaN(currentExpiry.getTime()) || currentExpiry < new Date()) {
      currentExpiry = new Date();
    }

    currentExpiry.setDate(currentExpiry.getDate() + days);
    t.subscription.validUntil = currentExpiry.toISOString().split('T')[0];
    t.subscription.status = 'Active';

    TenantManager.saveTenants(tenants);
    TenantManager.applyActiveTenant();
    this.renderAdminDashboard();

    const toastMsg = `Extended subscription for "${t.firmName}" by +${days} days (Valid till: ${t.subscription.validUntil})!`;
    if (typeof App !== 'undefined') App.showToast(toastMsg, 'success');
    else alert(toastMsg);
  },

  toggleAgentStatus: function(tenantId) {
    const tenants = TenantManager.getAllTenants();
    const t = tenants.find(item => item.id === tenantId);
    if (!t) return;

    t.status = t.status === 'Suspended' ? 'Active' : 'Suspended';
    TenantManager.saveTenants(tenants);
    this.renderAdminDashboard();

    const toastMsg = `Agency "${t.firmName}" is now ${t.status}.`;
    if (typeof App !== 'undefined') App.showToast(toastMsg, 'info');
    else alert(toastMsg);
  },

  // ================= VIEW-ONLY AUDIT IMPERSONATION =================
  launchImpersonation: function(tenantId) {
    AuthManager.startImpersonation(tenantId);
  },

  approveAgencyRequest: function(requestId) {
    const req = this.pendingRequests.find(r => r.id === requestId);
    if (!req) return;

    const now = new Date();
    now.setDate(now.getDate() + 30);

    const newTenant = {
      firmName: req.firmName,
      proprietor: req.proprietor,
      shopNo: req.shopNo,
      mandiName: req.mandiName,
      apmcLicenseNo: req.apmcLicenseNo,
      phone: req.phone,
      bankName: 'State Bank of India, Azadpur',
      accountNo: '3000' + Math.floor(10000000 + Math.random() * 90000000),
      ifsc: 'SBIN0001289',
      upiId: req.firmName.toLowerCase().replace(/[^a-z0-9]/g, '') + '@sbi',
      standardCommission: 2.5,
      palledariRatePerBox: 12,
      billFormat: 'thermal',
      billDisclaimer: '1. Payment due in 7 days.\n2. Interest @ 1.5% p.m. charged after 15 days.\n3. Subject to APMC Delhi jurisdiction.',
      logoIcon: '🏢',
      status: 'Active',
      subscription: {
        plan: 'Monthly',
        status: 'Active',
        validUntil: now.toISOString().split('T')[0],
        price: 1999
      }
    };

    TenantManager.registerNewTenant(newTenant);
    req.status = 'Approved';
    this.saveRequests();
    this.renderAdminDashboard();

    if (typeof App !== 'undefined') App.showToast(`Approved & launched workspace for "${req.firmName}"!`, 'success');
  },

  rejectAgencyRequest: function(requestId) {
    const req = this.pendingRequests.find(r => r.id === requestId);
    if (!req) return;

    req.status = 'Rejected';
    this.saveRequests();
    this.renderAdminDashboard();

    if (typeof App !== 'undefined') App.showToast(`Request for "${req.firmName}" rejected.`, 'info');
  },

  submitAccessRequest: function(data) {
    const newReq = {
      id: 'REQ-' + Date.now(),
      firmName: data.firmName,
      proprietor: data.proprietor,
      shopNo: data.shopNo,
      mandiName: data.mandiName || 'Azadpur Mandi, Delhi',
      apmcLicenseNo: data.apmcLicenseNo,
      phone: data.phone,
      requestedAt: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Pending'
    };

    this.pendingRequests.unshift(newReq);
    this.saveRequests();
    this.closeRequestAccessModal();

    if (typeof App !== 'undefined') {
      App.showToast('Your agency access request has been sent to Super Admin for verification!', 'success');
    }
  },

  submitOnboardAgent: function(data) {
    const now = new Date();
    now.setDate(now.getDate() + 30);

    const newTenant = {
      ...data,
      subscription: {
        plan: data.subscriptionPlan || 'Monthly',
        status: 'Active',
        validUntil: now.toISOString().split('T')[0],
        price: data.subscriptionPlan === 'Yearly' ? 19999 : (data.subscriptionPlan === 'Enterprise' ? 49999 : 1999)
      }
    };

    TenantManager.registerNewTenant(newTenant);
    this.closeOnboardModal();
    this.renderAdminDashboard();
  },

  openRequestAccessModal: function() {
    const modal = document.getElementById('request-access-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeRequestAccessModal: function() {
    const modal = document.getElementById('request-access-modal');
    if (modal) modal.classList.add('hidden');
  },

  openOnboardModal: function() {
    const modal = document.getElementById('admin-onboard-agent-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeOnboardModal: function() {
    const modal = document.getElementById('admin-onboard-agent-modal');
    if (modal) modal.classList.add('hidden');
  }
};
