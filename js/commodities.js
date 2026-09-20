/**
 * Commodity (फसल) Master Engine
 * Manages tenant-specific commodities, packaging units, commission %, and palledari charges
 */

const CommodityManager = {
  commodities: [],

  defaultCommodities: {
    'tenant-sgfc': [
      { id: 'COMM-1', nameEn: 'Apple - Royal Delicious', nameHi: 'सेब - रॉयल डिलीशियस', category: 'Fruit', defaultUnit: 'Box (20kg)', unitWeightKg: 20, tareDeductionKg: 1.5, standardCommissionPct: 2.5, palledariRatePerUnit: 12, active: true },
      { id: 'COMM-2', nameEn: 'Apple - Golden Delicious', nameHi: 'सेब - गोल्डन डिलीशियस', category: 'Fruit', defaultUnit: 'Box (20kg)', unitWeightKg: 20, tareDeductionKg: 1.5, standardCommissionPct: 2.5, palledariRatePerUnit: 12, active: true },
      { id: 'COMM-3', nameEn: 'Apple - Red Chief', nameHi: 'सेब - रेड चीफ', category: 'Fruit', defaultUnit: 'Box (20kg)', unitWeightKg: 20, tareDeductionKg: 1.5, standardCommissionPct: 2.5, palledariRatePerUnit: 12, active: true },
      { id: 'COMM-4', nameEn: 'Pomegranate - Solapur Bhagwa', nameHi: 'अनार - सोलापुर भगवा', category: 'Fruit', defaultUnit: 'Crate (10kg)', unitWeightKg: 10, tareDeductionKg: 0.8, standardCommissionPct: 3.0, palledariRatePerUnit: 8, active: true },
      { id: 'COMM-5', nameEn: 'Mango - Safeda', nameHi: 'आम - सफेदा', category: 'Fruit', defaultUnit: 'Crate (25kg)', unitWeightKg: 25, tareDeductionKg: 1.2, standardCommissionPct: 2.5, palledariRatePerUnit: 10, active: true },
      { id: 'COMM-6', nameEn: 'Citrus - Punjab Kinnow', nameHi: 'किन्नू - पंजाब', category: 'Fruit', defaultUnit: 'Box (18kg)', unitWeightKg: 18, tareDeductionKg: 1.0, standardCommissionPct: 2.5, palledariRatePerUnit: 10, active: true }
    ],
    'tenant-csop': [
      { id: 'COMM-101', nameEn: 'Onion - Red Garwa (Nashik)', nameHi: 'प्याज - लाल गरवा (नासिक)', category: 'Vegetable', defaultUnit: 'Sack (50kg)', unitWeightKg: 50, tareDeductionKg: 1.0, standardCommissionPct: 2.0, palledariRatePerUnit: 8, active: true },
      { id: 'COMM-102', nameEn: 'Potato - Agra Chipsona', nameHi: 'आलू - आगरा चिपसोना', category: 'Vegetable', defaultUnit: 'Sack (50kg)', unitWeightKg: 50, tareDeductionKg: 0.8, standardCommissionPct: 2.0, palledariRatePerUnit: 7, active: true },
      { id: 'COMM-103', nameEn: 'Tomato - Hybrid (Bangalore)', nameHi: 'टमाटर - हाइब्रिड (बैंगलोर)', category: 'Vegetable', defaultUnit: 'Crate (25kg)', unitWeightKg: 25, tareDeductionKg: 1.5, standardCommissionPct: 2.5, palledariRatePerUnit: 6, active: true }
    ]
  },

  init: function() {
    const tenantId = TenantManager.currentTenantId;
    const key = `mandi_commodities_${tenantId}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      this.commodities = JSON.parse(saved);
    } else {
      this.commodities = this.defaultCommodities[tenantId] || this.defaultCommodities['tenant-sgfc'];
      localStorage.setItem(key, JSON.stringify(this.commodities));
    }

    this.populateCommodityDropdowns();
  },

  saveCommodities: function() {
    const tenantId = TenantManager.currentTenantId;
    localStorage.setItem(`mandi_commodities_${tenantId}`, JSON.stringify(this.commodities));
    this.populateCommodityDropdowns();
  },

  getAll: function() {
    return this.commodities;
  },

  getActive: function() {
    return this.commodities.filter(c => c.active !== false);
  },

  getById: function(id) {
    return this.commodities.find(c => c.id === id);
  },

  getByName: function(name) {
    if (!name) return null;
    const clean = name.trim().toLowerCase();
    return this.commodities.find(c => c.nameEn.toLowerCase() === clean || (c.nameHi && c.nameHi.toLowerCase() === clean));
  },

  addCommodity: function(data) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('add commodity')) return false;

    const newComm = {
      id: 'COMM-' + Date.now(),
      nameEn: data.nameEn.trim(),
      nameHi: data.nameHi ? data.nameHi.trim() : '',
      category: data.category || 'Fruit',
      defaultUnit: data.defaultUnit || 'Box (20kg)',
      unitWeightKg: parseFloat(data.unitWeightKg) || 20,
      tareDeductionKg: parseFloat(data.tareDeductionKg) || 1.0,
      standardCommissionPct: parseFloat(data.standardCommissionPct) || 2.5,
      palledariRatePerUnit: parseFloat(data.palledariRatePerUnit) || 10,
      active: true
    };

    this.commodities.unshift(newComm);
    this.saveCommodities();
    App.showToast(`Commodity "${newComm.nameEn}" added!`, 'success');
    return true;
  },

  updateCommodity: function(id, data) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('update commodity')) return false;

    const idx = this.commodities.findIndex(c => c.id === id);
    if (idx === -1) return false;

    this.commodities[idx] = {
      ...this.commodities[idx],
      nameEn: data.nameEn.trim(),
      nameHi: data.nameHi ? data.nameHi.trim() : '',
      category: data.category,
      defaultUnit: data.defaultUnit,
      unitWeightKg: parseFloat(data.unitWeightKg) || 20,
      tareDeductionKg: parseFloat(data.tareDeductionKg) || 1.0,
      standardCommissionPct: parseFloat(data.standardCommissionPct) || 2.5,
      palledariRatePerUnit: parseFloat(data.palledariRatePerUnit) || 10
    };

    this.saveCommodities();
    App.showToast(`Commodity "${this.commodities[idx].nameEn}" updated!`, 'success');
    return true;
  },

  toggleStatus: function(id) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('toggle commodity status')) return;

    const comm = this.getById(id);
    if (!comm) return;
    comm.active = !comm.active;
    this.saveCommodities();
    App.showToast(`Commodity ${comm.active ? 'Activated' : 'Deactivated'}!`, 'info');
  },

  populateCommodityDropdowns: function() {
    const activeList = this.getActive();
    
    // Quick Trade dropdown
    const quickSelect = document.getElementById('unified-commodity');
    if (quickSelect) {
      const currentVal = quickSelect.value;
      quickSelect.innerHTML = activeList.map(c => `
        <option value="${c.nameEn}">${c.nameEn} (${c.nameHi || c.category})</option>
      `).join('');
      if (currentVal && activeList.some(c => c.nameEn === currentVal)) {
        quickSelect.value = currentVal;
      }
    }

    // Arrivals modal dropdown
    const arvSelect = document.getElementById('arv-commodity');
    if (arvSelect && arvSelect.tagName === 'SELECT') {
      arvSelect.innerHTML = activeList.map(c => `
        <option value="${c.nameEn}">${c.nameEn} (${c.nameHi || c.category})</option>
      `).join('');
    }
  }
};
