/**
 * System Settings & Configuration Suite
 * Manages White-Label Customization, Commodity Master, Party Short Codes, Mandi Rates, Printer Formats, Staff Roles, and Backups
 */

const SettingsManager = {
  currentSubTab: 'branding',
  editingPartyId: null,
  editingCommodityId: null,
  selectedTheme: 'emerald',

  init: function() {
    this.renderActiveSubTab();
  },

  switchSubTab: function(subTab) {
    this.currentSubTab = subTab;

    // Update subtab buttons
    document.querySelectorAll('.settings-subtab-btn').forEach(btn => {
      if (btn.getAttribute('data-subtab') === subTab) {
        btn.classList.add('bg-slate-900', 'text-white', 'font-bold', 'shadow-xs');
        btn.classList.remove('bg-slate-100', 'text-slate-700', 'hover:bg-slate-200');
      } else {
        btn.classList.remove('bg-slate-900', 'text-white', 'font-bold', 'shadow-xs');
        btn.classList.add('bg-slate-100', 'text-slate-700', 'hover:bg-slate-200');
      }
    });

    // Strictly hide ALL settings panels, then display only the chosen panel
    const allPanels = [
      'settings-branding',
      'settings-commodity-master',
      'settings-party-master',
      'settings-rates',
      'settings-printer',
      'settings-firm',
      'settings-team',
      'settings-backup'
    ];

    allPanels.forEach(panelId => {
      const el = document.getElementById(panelId);
      if (el) {
        if (panelId === `settings-${subTab}`) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    this.renderActiveSubTab();
  },

  renderActiveSubTab: function() {
    if (this.currentSubTab === 'branding') this.renderBrandingForm();
    if (this.currentSubTab === 'commodity-master') this.renderCommodityMasterTable();
    if (this.currentSubTab === 'party-master') this.renderPartyMasterTable();
    if (this.currentSubTab === 'rates') this.renderRatesForm();
    if (this.currentSubTab === 'printer') this.renderPrinterConfigForm();
    if (this.currentSubTab === 'firm') this.renderFirmProfileForm();
    if (this.currentSubTab === 'team') TeamManager.renderTeamTable();
  },

  // ================= 0. WHITE-LABEL & BRANDING SUITE =================
  renderBrandingForm: function() {
    const t = TenantManager.getActiveTenant();
    this.selectedTheme = t.themeColor || 'emerald';

    // Theme cards
    const themeContainer = document.getElementById('wl-theme-presets');
    if (themeContainer) {
      themeContainer.innerHTML = Object.entries(TenantManager.themePresets).map(([key, val]) => `
        <div onclick="SettingsManager.selectTheme('${key}')" 
          class="cursor-pointer p-3 rounded-2xl border-2 transition-all flex items-center gap-2.5 ${this.selectedTheme === key ? 'border-slate-900 bg-slate-50 shadow-xs' : 'border-slate-200 hover:border-slate-300'}">
          <span class="w-5 h-5 rounded-full shrink-0 shadow-xs" style="background-color: ${val.primary};"></span>
          <div>
            <span class="font-bold text-slate-800 text-xs block leading-tight">${val.label.split(' (')[0]}</span>
            <span class="text-[10px] text-slate-400 font-medium">(${val.label.split(' (')[1] || ''}</span>
          </div>
        </div>
      `).join('');
    }

    // Populate branding form fields
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setVal('wl-firm-name', t.firmName);
    setVal('wl-tagline', t.tagline);
    setVal('wl-logo-icon', t.logoIcon || '🍎');
    setVal('wl-shop-no', t.shopNo);
    setVal('wl-mandi-name', t.mandiName);
    setVal('wl-apmc-lic', t.apmcLicenseNo);
    setVal('wl-gstin', t.gstin);
    setVal('wl-phone', t.phone);
    setVal('wl-bank-name', t.bankName);
    setVal('wl-acc-no', t.accountNo);
    setVal('wl-ifsc', t.ifsc);
    setVal('wl-upi-id', t.upiId);
    setVal('wl-bill-format', t.billFormat || 'thermal');
    setVal('wl-disclaimer', t.billDisclaimer || '');
  },

  selectTheme: function(themeKey) {
    this.selectedTheme = themeKey;
    TenantManager.applyTheme(themeKey);
    this.renderBrandingForm();
  },

  saveBrandingForm: function() {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('save branding settings')) return;

    const updated = {
      firmName: document.getElementById('wl-firm-name').value.trim(),
      tagline: document.getElementById('wl-tagline').value.trim(),
      logoIcon: document.getElementById('wl-logo-icon').value.trim() || '🌾',
      shopNo: document.getElementById('wl-shop-no').value.trim(),
      mandiName: document.getElementById('wl-mandi-name').value.trim(),
      apmcLicenseNo: document.getElementById('wl-apmc-lic').value.trim(),
      gstin: document.getElementById('wl-gstin').value.trim(),
      phone: document.getElementById('wl-phone').value.trim(),
      bankName: document.getElementById('wl-bank-name').value.trim(),
      accountNo: document.getElementById('wl-acc-no').value.trim(),
      ifsc: document.getElementById('wl-ifsc').value.trim(),
      upiId: document.getElementById('wl-upi-id').value.trim(),
      billFormat: document.getElementById('wl-bill-format').value,
      billDisclaimer: document.getElementById('wl-disclaimer').value.trim(),
      themeColor: this.selectedTheme
    };

    if (!updated.firmName || !updated.shopNo) {
      App.showToast('Firm Name and Shop No are mandatory!', 'error');
      return;
    }

    TenantManager.saveTenantSettings(updated);
    if (typeof AuthManager !== 'undefined') AuthManager.applyUserContext();
    App.showToast('White-Label branding & theme applied successfully!', 'success');
  },

  // ================= 1. COMMODITY (फसल) MASTER =================
  renderCommodityMasterTable: function() {
    const container = document.getElementById('settings-commodity-table-body');
    if (!container) return;

    const list = CommodityManager.getAll();
    if (list.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" class="p-8 text-center bg-slate-50 text-slate-400 text-xs rounded-xl">
            No commodities configured. Click "+ Add New Commodity" to define crops.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = list.map(c => `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors text-xs">
        <td class="p-3">
          <span class="font-bold text-slate-900">${c.nameEn}</span>
          ${c.nameHi ? `<span class="block text-[11px] text-slate-500 font-medium">${c.nameHi}</span>` : ''}
        </td>
        <td class="p-3 text-center">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${c.category === 'Fruit' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
            ${c.category}
          </span>
        </td>
        <td class="p-3 font-medium">${c.defaultUnit} (${c.unitWeightKg} kg)</td>
        <td class="p-3 text-center font-mono">${c.tareDeductionKg || 1.0} kg</td>
        <td class="p-3 text-center font-bold text-purple-900">${c.standardCommissionPct || 2.5}%</td>
        <td class="p-3 text-right font-black text-slate-800">₹${c.palledariRatePerUnit || 10}</td>
        <td class="p-3 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="SettingsManager.openEditCommodityModal('${c.id}')" 
              class="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              ✏️ Edit
            </button>
            <button onclick="CommodityManager.toggleStatus('${c.id}')" 
              class="px-2 py-1 text-[11px] font-bold ${c.active ? 'text-emerald-700 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'} rounded-lg">
              ${c.active ? 'Active' : 'Inactive'}
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  openAddCommodityModal: function() {
    this.editingCommodityId = null;
    const modal = document.getElementById('commodity-modal');
    if (!modal) return;

    document.getElementById('comm-modal-title').textContent = 'Add New Commodity (नई फसल)';
    document.getElementById('comm-name-en').value = '';
    document.getElementById('comm-name-hi').value = '';
    document.getElementById('comm-category').value = 'Fruit';
    document.getElementById('comm-unit').value = 'Box (20kg)';
    document.getElementById('comm-weight').value = '20';
    document.getElementById('comm-tare').value = '1.2';
    document.getElementById('comm-commission').value = '2.5';
    document.getElementById('comm-palledari').value = '12';

    modal.classList.remove('hidden');
  },

  openEditCommodityModal: function(id) {
    const comm = CommodityManager.getById(id);
    if (!comm) return;

    this.editingCommodityId = id;
    const modal = document.getElementById('commodity-modal');
    if (!modal) return;

    document.getElementById('comm-modal-title').textContent = `Edit Commodity: ${comm.nameEn}`;
    document.getElementById('comm-name-en').value = comm.nameEn;
    document.getElementById('comm-name-hi').value = comm.nameHi || '';
    document.getElementById('comm-category').value = comm.category || 'Fruit';
    document.getElementById('comm-unit').value = comm.defaultUnit || 'Box (20kg)';
    document.getElementById('comm-weight').value = comm.unitWeightKg || 20;
    document.getElementById('comm-tare').value = comm.tareDeductionKg || 1.0;
    document.getElementById('comm-commission').value = comm.standardCommissionPct || 2.5;
    document.getElementById('comm-palledari').value = comm.palledariRatePerUnit || 10;

    modal.classList.remove('hidden');
  },

  closeCommodityModal: function() {
    const modal = document.getElementById('commodity-modal');
    if (modal) modal.classList.add('hidden');
    this.editingCommodityId = null;
  },

  submitCommodityForm: function() {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('modify commodities')) return;

    const formData = {
      nameEn: document.getElementById('comm-name-en').value,
      nameHi: document.getElementById('comm-name-hi').value,
      category: document.getElementById('comm-category').value,
      defaultUnit: document.getElementById('comm-unit').value,
      unitWeightKg: document.getElementById('comm-weight').value,
      tareDeductionKg: document.getElementById('comm-tare').value,
      standardCommissionPct: document.getElementById('comm-commission').value,
      palledariRatePerUnit: document.getElementById('comm-palledari').value
    };

    if (!formData.nameEn) {
      App.showToast('Commodity name is required', 'error');
      return;
    }

    if (this.editingCommodityId) {
      CommodityManager.updateCommodity(this.editingCommodityId, formData);
    } else {
      CommodityManager.addCommodity(formData);
    }

    this.closeCommodityModal();
    this.renderCommodityMasterTable();
  },

  // ================= 2. PARTY MASTER =================
  renderPartyMasterTable: function(searchQuery = '') {
    const container = document.getElementById('settings-party-table-body');
    if (!container) return;

    let list = PartyManager.parties;
    if (searchQuery && searchQuery.trim() !== '') {
      list = PartyManager.findByNameOrCode(searchQuery);
    }

    if (list.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center bg-slate-50 rounded-xl">
            <div class="max-w-xs mx-auto text-center space-y-2">
              <span class="text-3xl block">🏷️</span>
              <p class="text-xs font-bold text-slate-700">No parties found</p>
              <p class="text-[11px] text-slate-400">Add Farmers and Wholesale Buyers with short codes for rapid trade data entry.</p>
              <button onclick="SettingsManager.openAddPartyModal()" class="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
                + Add First Party Code
              </button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = list.map(p => {
      const isBuyer = p.type === 'Buyer';
      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
          <td class="p-3">
            <span class="font-mono font-black text-xs px-2.5 py-1 rounded-lg ${isBuyer ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'}">
              ${p.shortCode}
            </span>
          </td>
          <td class="p-3">
            <div class="font-bold text-slate-900 text-xs">${p.name}</div>
            <div class="text-[11px] text-slate-500">${p.address}</div>
          </td>
          <td class="p-3 text-center">
            <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full ${isBuyer ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}">
              ${isBuyer ? '🛒 Buyer' : '🧑‍🌾 Farmer'}
            </span>
          </td>
          <td class="p-3 text-xs font-mono text-slate-600">${p.mobile}</td>
          <td class="p-3 text-right">
            ${isBuyer ? `
              <span class="font-black text-xs ${p.currentBalance > 0 ? 'text-amber-800' : 'text-slate-600'}">
                ₹${(p.currentBalance || 0).toLocaleString('en-IN')}
              </span>
              <span class="block text-[10px] text-slate-400 font-medium">Limit: ₹${(p.creditLimit || 0).toLocaleString('en-IN')}</span>
            ` : '<span class="text-slate-400 font-mono">-</span>'}
          </td>
          <td class="p-3 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="SettingsManager.openEditPartyModal('${p.id}')" 
                class="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                ✏️ Edit
              </button>
              <button onclick="PartyManager.deleteParty('${p.id}')" 
                class="px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                ✕
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  openAddPartyModal: function() {
    const modal = document.getElementById('add-party-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeAddPartyModal: function() {
    const modal = document.getElementById('add-party-modal');
    if (modal) modal.classList.add('hidden');
  },

  submitNewParty: function(formData) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('create party')) return;

    const success = PartyManager.addParty(formData);
    if (success) {
      this.closeAddPartyModal();
      this.renderPartyMasterTable();
    }
  },

  openEditPartyModal: function(partyId) {
    const party = PartyManager.getPartyById(partyId);
    if (!party) return;

    this.editingPartyId = partyId;
    const modal = document.getElementById('edit-party-modal');
    if (!modal) return;

    document.getElementById('edit-party-code').value = party.shortCode;
    document.getElementById('edit-party-name').value = party.name;
    document.getElementById('edit-party-type').value = party.type;
    document.getElementById('edit-party-mobile').value = party.mobile;
    document.getElementById('edit-party-address').value = party.address;
    document.getElementById('edit-party-credit-limit').value = party.creditLimit || 0;

    modal.classList.remove('hidden');
  },

  closeEditPartyModal: function() {
    const modal = document.getElementById('edit-party-modal');
    if (modal) modal.classList.add('hidden');
    this.editingPartyId = null;
  },

  submitEditParty: function(formData) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('edit party')) return;

    if (!this.editingPartyId) return;

    const success = PartyManager.updateParty(this.editingPartyId, formData);
    if (success) {
      this.closeEditPartyModal();
      this.renderPartyMasterTable();
    }
  },

  // ================= 3. STATUTORY RATES FORM =================
  renderRatesForm: function() {
    const t = TenantManager.getActiveTenant();
    const commInput = document.getElementById('cfg-commission-pct');
    const apmcInput = document.getElementById('cfg-apmc-cess');
    const dambInput = document.getElementById('cfg-damb-fee');
    const palledariInput = document.getElementById('cfg-palledari-rate');
    const stationeryInput = document.getElementById('cfg-stationery');
    const interestInput = document.getElementById('cfg-interest-pct');

    if (commInput) commInput.value = t.standardCommission || 2.5;
    if (apmcInput) apmcInput.value = MandiData.mandiInfo.marketFeePercent || 1.0;
    if (dambInput) dambInput.value = MandiData.mandiInfo.developmentFeePercent || 1.0;
    if (palledariInput) palledariInput.value = t.palledariRatePerBox || 12;
    if (stationeryInput) stationeryInput.value = t.stationeryCharges || 15;
    if (interestInput) interestInput.value = 1.5;
  },

  saveRatesForm: function() {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('save mandi rates')) return;

    const updated = {
      standardCommission: parseFloat(document.getElementById('cfg-commission-pct').value) || 2.5,
      palledariRatePerBox: parseFloat(document.getElementById('cfg-palledari-rate').value) || 12,
      stationeryCharges: parseFloat(document.getElementById('cfg-stationery').value) || 15
    };
    TenantManager.saveTenantSettings(updated);
    App.showToast('Statutory rates and Palledari charges updated!', 'success');
  },

  // ================= 4. PRINTER & FORMAT SETTINGS =================
  renderPrinterConfigForm: function() {
    const t = TenantManager.getActiveTenant();
    const fmtSelect = document.getElementById('cfg-printer-format');
    const disclaimerArea = document.getElementById('cfg-bill-disclaimer');

    if (fmtSelect) fmtSelect.value = t.billFormat || 'thermal';
    if (disclaimerArea) disclaimerArea.value = t.billDisclaimer || '';
  },

  savePrinterConfigForm: function() {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('save printer configurations')) return;

    const updated = {
      billFormat: document.getElementById('cfg-printer-format').value,
      billDisclaimer: document.getElementById('cfg-bill-disclaimer').value
    };
    TenantManager.saveTenantSettings(updated);
    App.showToast('Printer layout & bill terms updated!', 'success');
  },

  // ================= 5. FIRM PROFILE =================
  renderFirmProfileForm: function() {
    const t = TenantManager.getActiveTenant();
    document.getElementById('cfg-firm-name').value = t.firmName;
    document.getElementById('cfg-shop-no').value = t.shopNo;
    document.getElementById('cfg-apmc-lic').value = t.apmcLicenseNo;
    document.getElementById('cfg-phone').value = t.phone;
    document.getElementById('cfg-gstin').value = t.gstin || '';
    document.getElementById('cfg-bank-name').value = t.bankName;
    document.getElementById('cfg-acc-no').value = t.accountNo;
    document.getElementById('cfg-ifsc').value = t.ifsc;
    document.getElementById('cfg-upi-id').value = t.upiId;
  },

  saveFirmProfileForm: function() {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('save firm profile')) return;

    const updated = {
      firmName: document.getElementById('cfg-firm-name').value,
      shopNo: document.getElementById('cfg-shop-no').value,
      apmcLicenseNo: document.getElementById('cfg-apmc-lic').value,
      phone: document.getElementById('cfg-phone').value,
      gstin: document.getElementById('cfg-gstin').value,
      bankName: document.getElementById('cfg-bank-name').value,
      accountNo: document.getElementById('cfg-acc-no').value,
      ifsc: document.getElementById('cfg-ifsc').value,
      upiId: document.getElementById('cfg-upi-id').value
    };
    TenantManager.saveTenantSettings(updated);
    App.showToast('Firm profile and bank details saved!', 'success');
  },

  // ================= 6. DATA EXPORT & BACKUP =================
  exportCompleteDataJSON: function() {
    const tenantId = TenantManager.currentTenantId;
    const backupData = {
      exportDate: new Date().toISOString(),
      tenant: TenantManager.getActiveTenant(),
      commodities: CommodityManager.commodities,
      parties: PartyManager.parties,
      team: TeamManager.teamMembers,
      arrivals: ArrivalsManager.arrivals,
      lots: AuctionEngine.lots,
      accounts: BahiKhata.accounts,
      cashbook: BahiKhata.cashTransactions,
      journal: BahiKhata.journalEntries
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MandiERP_Backup_${tenantId}_${Date.now()}.json`;
    link.click();
    App.showToast('Complete JSON backup downloaded!', 'success');
  }
};
