/**
 * Main Application Orchestrator for Azadpur Mandi ERP
 * Coordinates Left Sidebar, Keyboard Shortcuts, Command Palette, Multi-Tenant Routing & Submodules
 */

const App = {
  currentTab: 'quick-trade',

  init: function() {
    TenantManager.init();
    if (typeof AuthManager !== 'undefined') AuthManager.init();
    CommodityManager.init();
    PartyManager.init();
    TeamManager.init();
    BillDesigner.init();
    ArrivalsManager.init();
    AuctionEngine.init();
    UnifiedTrade.init();
    BahiKhata.init();
    ReportsHub.init();
    SettingsManager.init();
    AdminManager.init();
    MandiBhav.init();

    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.updateLiveHeaderDate();
    this.switchTab('quick-trade');
    this.registerServiceWorker();
  },

  setupEventListeners: function() {
    // Tenant Switcher Dropdown
    const tenantSelect = document.getElementById('tenant-switcher-select');
    if (tenantSelect) {
      tenantSelect.addEventListener('change', (e) => {
        TenantManager.switchTenant(e.target.value);
        CommodityManager.init();
        PartyManager.init();
        TeamManager.init();
        UnifiedTrade.init();
        BahiKhata.init();
        ReportsHub.init();
        SettingsManager.init();
      });
    }

    // Sidebar Navigation Links
    document.querySelectorAll('.sidebar-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab-target');
        if (tab) {
          this.switchTab(tab);
          this.toggleSidebarDrawer(false); // Auto close on mobile
        }
      });
    });

    // Language Toggle
    const langToggleBtn = document.getElementById('lang-toggle-btn');
    if (langToggleBtn) {
      langToggleBtn.addEventListener('click', () => {
        const newLang = I18N.currentLang === 'en' ? 'hi' : 'en';
        I18N.setLanguage(newLang);
        langToggleBtn.textContent = newLang === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English';
      });
    }

    // New Arrival Form Submission
    const arrivalForm = document.getElementById('new-arrival-form');
    if (arrivalForm) {
      arrivalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {
          truckNo: document.getElementById('arv-truck-no').value,
          driverName: document.getElementById('arv-driver-name').value,
          driverPhone: document.getElementById('arv-driver-phone').value,
          farmerName: document.getElementById('arv-farmer-name').value,
          farmerPhone: document.getElementById('arv-farmer-phone').value,
          farmerLocation: document.getElementById('arv-farmer-loc').value,
          commodity: document.getElementById('arv-commodity').value,
          variety: document.getElementById('arv-variety').value,
          quantity: document.getElementById('arv-quantity').value,
          unit: document.getElementById('arv-unit').value,
          totalFreight: document.getElementById('arv-total-freight').value,
          freightAdvance: document.getElementById('arv-freight-adv').value,
          palledarToli: document.getElementById('arv-palledar-toli').value,
          bardanaLoaned: document.getElementById('arv-bardana').value
        };
        ArrivalsManager.submitNewArrival(formData);
      });
    }

    // Split Sale Form Submission
    const splitSaleForm = document.getElementById('split-sale-form');
    if (splitSaleForm) {
      splitSaleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {
          quantity: document.getElementById('split-modal-qty').value,
          rate: document.getElementById('split-modal-rate').value,
          buyerName: document.getElementById('split-modal-buyer').value,
          buyerPhone: document.getElementById('split-modal-phone').value,
          paymentMode: document.getElementById('split-modal-payment-mode').value
        };
        AuctionEngine.submitSplitSale(formData);
      });
    }

    // Rokad Cashbook Entry Form
    const rokadForm = document.getElementById('rokad-entry-form');
    if (rokadForm) {
      rokadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('rokad-entry-type').value;
        const title = document.getElementById('rokad-entry-title').value;
        const amount = parseFloat(document.getElementById('rokad-entry-amount').value);
        BahiKhata.submitRokadEntry(type, title, amount);
      });
    }
  },

  // ================= KEYBOARD SHORTCUTS ENGINE =================
  setupKeyboardShortcuts: function() {
    window.addEventListener('keydown', (e) => {
      // Ignore if user is currently typing inside an input/textarea/select
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInputFocused = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // F1: Help / Shortcuts
      if (e.key === 'F1') {
        e.preventDefault();
        this.openShortcutsModal();
        return;
      }

      // F2: Quick Trade
      if (e.key === 'F2') {
        e.preventDefault();
        this.switchTab('quick-trade');
        UnifiedTrade.resetForNextConsignment();
        return;
      }

      // F4: New Truck Arrival
      if (e.key === 'F4') {
        e.preventDefault();
        this.switchTab('arrivals');
        ArrivalsManager.openNewArrivalModal();
        return;
      }

      // Ctrl + K: Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openCommandPalette();
        return;
      }

      // Ctrl + J: New Journal Entry
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        BahiKhata.openJournalVoucherModal();
        return;
      }

      // Esc: Close any modal
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  },

  // ================= TAB ROUTING & SIDEBAR =================
  switchTab: function(tabName) {
    this.currentTab = tabName;

    // Update Sidebar links active indicator
    document.querySelectorAll('.sidebar-link').forEach(btn => {
      const target = btn.getAttribute('data-tab-target');
      if (target === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Hide Super Admin portal if visible
    const superAdminEl = document.getElementById('super-admin-portal');
    if (superAdminEl) superAdminEl.classList.add('hidden');

    // Hide all main sections, show active section
    const sections = [
      'quick-trade-section',
      'arrivals-section',
      'sales-section',
      'bahi-khata-section',
      'reports-section',
      'settings-section',
      'mandi-bhav-section'
    ];

    sections.forEach(secId => {
      const el = document.getElementById(secId);
      if (el) {
        if (secId === `${tabName}-section`) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // Refresh active section data
    if (tabName === 'quick-trade') { UnifiedTrade.recalculateTotals(); }
    if (tabName === 'arrivals') ArrivalsManager.renderArrivals();
    if (tabName === 'sales') AuctionEngine.renderLots();
    if (tabName === 'bahi-khata') { BahiKhata.renderLedger(); BahiKhata.renderRokad(); BahiKhata.renderJournalRegister(); }
    if (tabName === 'reports') ReportsHub.renderActiveReport();
    if (tabName === 'settings') SettingsManager.renderActiveSubTab();
    if (tabName === 'mandi-bhav') MandiBhav.renderCommodityGrid();
  },

  toggleSidebarDrawer: function(open) {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;

    if (open) {
      sidebar.classList.remove('-translate-x-full');
      backdrop?.classList.remove('hidden');
    } else {
      sidebar.classList.add('-translate-x-full');
      backdrop?.classList.add('hidden');
    }
  },

  // ================= COMMAND PALETTE (Ctrl+K) =================
  openCommandPalette: function() {
    const modal = document.getElementById('command-palette-modal');
    const input = document.getElementById('command-palette-input');
    if (!modal || !input) return;

    modal.classList.remove('hidden');
    input.value = '';
    input.focus();
    this.onCommandPaletteSearch('');
  },

  closeCommandPalette: function() {
    const modal = document.getElementById('command-palette-modal');
    if (modal) modal.classList.add('hidden');
  },

  onCommandPaletteSearch: function(query) {
    const container = document.getElementById('command-palette-results');
    if (!container) return;

    const q = query.trim().toUpperCase();
    const results = [];

    // 1. Navigation items
    const navs = [
      { type: 'Navigation', icon: '⚡', label: 'Quick Trade (एकल सौदा)', action: () => App.switchTab('quick-trade') },
      { type: 'Navigation', icon: '🚚', label: 'Inward Arrivals (गाड़ी आवक)', action: () => App.switchTab('arrivals') },
      { type: 'Navigation', icon: '🏷️', label: 'Sales Lots (दैनिक बिक्री)', action: () => App.switchTab('sales') },
      { type: 'Navigation', icon: '📒', label: 'Bahi-Khata & Rokad (खाता-बही)', action: () => App.switchTab('bahi-khata') },
      { type: 'Navigation', icon: '📊', label: 'Mandi Reports Hub (रिपोर्ट्स)', action: () => App.switchTab('reports') },
      { type: 'Navigation', icon: '📖', label: 'New Journal Entry (रोजनामचा)', action: () => BahiKhata.openJournalVoucherModal() },
      { type: 'Navigation', icon: '🌾', label: 'Commodity Master (फसल)', action: () => { App.switchTab('settings'); SettingsManager.switchSubTab('commodity-master'); } },
      { type: 'Navigation', icon: '⚙️', label: 'Settings & Short Codes', action: () => App.switchTab('settings') }
    ];

    navs.forEach(n => {
      if (!q || n.label.toUpperCase().includes(q)) results.push(n);
    });

    // 2. Parties
    PartyManager.parties.forEach(p => {
      if (!q || p.shortCode.includes(q) || p.name.toUpperCase().includes(q)) {
        results.push({
          type: p.type === 'Buyer' ? 'Buyer (खरीदार)' : 'Farmer (किसान)',
          icon: p.type === 'Buyer' ? '🛒' : '🧑‍🌾',
          label: `[${p.shortCode}] ${p.name} - ${p.address}`,
          action: () => {
            App.switchTab('settings');
            SettingsManager.switchSubTab('party-master');
            SettingsManager.openEditPartyModal(p.id);
          }
        });
      }
    });

    // 3. Consignments / Arrivals
    ArrivalsManager.arrivals.forEach(a => {
      if (!q || a.truckNo.includes(q) || a.farmerName.toUpperCase().includes(q) || a.id.includes(q)) {
        results.push({
          type: 'Truck Arrival',
          icon: '🚚',
          label: `${a.truckNo} • ${a.farmerName} (${a.commodity})`,
          action: () => {
            App.switchTab('arrivals');
          }
        });
      }
    });

    if (results.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">No matching results found for "${query}".</div>`;
      return;
    }

    container.innerHTML = results.slice(0, 8).map((r, idx) => `
      <div onclick="App.executeCommandResult(${idx})" 
        class="command-item p-2.5 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center justify-between transition-colors">
        <div class="flex items-center gap-2">
          <span>${r.icon}</span>
          <span class="font-bold text-slate-800">${r.label}</span>
        </div>
        <span class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">${r.type}</span>
      </div>
    `).join('');

    this.activeCommandResults = results.slice(0, 8);
  },

  executeCommandResult: function(idx) {
    if (this.activeCommandResults && this.activeCommandResults[idx]) {
      this.closeCommandPalette();
      this.activeCommandResults[idx].action();
    }
  },

  openShortcutsModal: function() {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeShortcutsModal: function() {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) modal.classList.add('hidden');
  },

  closeAllModals: function() {
    document.querySelectorAll('[id$="-modal"]').forEach(modal => {
      modal.classList.add('hidden');
    });
    this.toggleSidebarDrawer(false);
  },

  updateLiveHeaderDate: function() {
    const el = document.getElementById('header-live-date');
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }
  },

  showToast: function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-800 text-white',
      error: 'bg-rose-800 text-white',
      info: 'bg-slate-900 text-white'
    };

    toast.className = `toast px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ')}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  registerServiceWorker: function() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
