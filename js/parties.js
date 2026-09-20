/**
 * Party Master & Short Code Engine (पार्टी शॉर्ट कोड)
 * Handles auto-completion, CRUD, and fast lookups for Farmers & Buyers
 */

const PartyManager = {
  parties: [],

  defaultParties: {
    'tenant-sgfc': [
      // Buyers
      { id: 'P-101', shortCode: 'AGW', name: 'Aggarwal Wholesale Mart', type: 'Buyer', mobile: '+91 98110 55432', address: 'Shop 14, Tilak Nagar Mandi', creditLimit: 200000, currentBalance: 125000 },
      { id: 'P-102', shortCode: 'RJD', name: 'Rajdhani Hotel Supplies', type: 'Buyer', mobile: '+91 99100 88776', address: 'B-21, Daryaganj, Delhi', creditLimit: 150000, currentBalance: 110000 },
      { id: 'P-103', shortCode: 'BLK', name: 'Blinkit Darkstore Hub 4', type: 'Buyer', mobile: '+91 98711 22334', address: 'Warehouse Block C, Narela', creditLimit: 500000, currentBalance: 40000 },
      { id: 'P-104', shortCode: 'KSH', name: 'Kishore Bros Veg Wholesalers', type: 'Buyer', mobile: '+91 98100 44332', address: 'Shop 28, Subzi Mandi', creditLimit: 100000, currentBalance: 35000 },
      { id: 'P-105', shortCode: 'DEL', name: 'Delhi Fresh Supply Co.', type: 'Buyer', mobile: '+91 98990 11223', address: 'Okhla Mandi Gate 2', creditLimit: 250000, currentBalance: 65000 },

      // Farmers
      { id: 'P-201', shortCode: 'NEG', name: 'Harish Negi', type: 'Farmer', mobile: '+91 98160 44321', address: 'Kotkhai, Shimla (HP)', creditLimit: 0, currentBalance: 0 },
      { id: 'P-202', shortCode: 'LON', name: 'Bashir Ahmed Lone', type: 'Farmer', mobile: '+91 97970 33412', address: 'Sopore, Baramulla (J&K)', creditLimit: 0, currentBalance: 0 },
      { id: 'P-203', shortCode: 'VER', name: 'Sohan Lal Verma', type: 'Farmer', mobile: '+91 98170 55441', address: 'Thanedhar, Kinnaur (HP)', creditLimit: 0, currentBalance: 0 }
    ],
    'tenant-csop': [
      { id: 'P-301', shortCode: 'DVW', name: 'Delhi Veg Wholesalers Association', type: 'Buyer', mobile: '+91 98111 22998', address: 'Okhla Mandi Yard 2', creditLimit: 250000, currentBalance: 130000 },
      { id: 'P-401', shortCode: 'JAD', name: 'Pandurang Jadhav', type: 'Farmer', mobile: '+91 94231 87211', address: 'Dindori, Nashik (MH)', creditLimit: 0, currentBalance: 0 }
    ]
  },

  init: function() {
    const tenantId = TenantManager.currentTenantId;
    const key = `mandi_parties_${tenantId}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      this.parties = JSON.parse(saved);
    } else {
      this.parties = this.defaultParties[tenantId] || [];
      localStorage.setItem(key, JSON.stringify(this.parties));
    }
  },

  saveParties: function() {
    const tenantId = TenantManager.currentTenantId;
    localStorage.setItem(`mandi_parties_${tenantId}`, JSON.stringify(this.parties));
  },

  getPartyById: function(id) {
    return this.parties.find(p => p.id === id);
  },

  findByCode: function(code) {
    if (!code) return null;
    const clean = code.trim().toUpperCase();
    return this.parties.find(p => p.shortCode.toUpperCase() === clean);
  },

  findByNameOrCode: function(query) {
    if (!query) return this.parties;
    const q = query.trim().toUpperCase();
    return this.parties.filter(p => 
      p.shortCode.toUpperCase().includes(q) || 
      p.name.toUpperCase().includes(q) ||
      p.mobile.includes(q)
    );
  },

  addParty: function(partyData) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('add party')) return false;

    const cleanCode = partyData.shortCode.trim().toUpperCase();
    if (this.findByCode(cleanCode)) {
      App.showToast(`Short Code "${cleanCode}" already exists! Please use another code.`, 'error');
      return false;
    }

    const newParty = {
      id: 'P-' + Date.now(),
      shortCode: cleanCode,
      name: partyData.name.trim(),
      type: partyData.type || 'Buyer',
      mobile: partyData.mobile.trim(),
      address: partyData.address.trim(),
      creditLimit: parseFloat(partyData.creditLimit) || 0,
      currentBalance: 0
    };

    this.parties.unshift(newParty);
    this.saveParties();
    App.showToast(`Party "${newParty.name}" [${newParty.shortCode}] added!`, 'success');
    return true;
  },

  updateParty: function(partyId, updatedData) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('update party')) return false;

    const idx = this.parties.findIndex(p => p.id === partyId);
    if (idx === -1) return false;

    const newCode = updatedData.shortCode.trim().toUpperCase();
    const existingWithSameCode = this.parties.find(p => p.shortCode.toUpperCase() === newCode && p.id !== partyId);
    if (existingWithSameCode) {
      App.showToast(`Short Code "${newCode}" is already used by another party!`, 'error');
      return false;
    }

    this.parties[idx] = {
      ...this.parties[idx],
      ...updatedData,
      shortCode: newCode,
      name: updatedData.name.trim(),
      mobile: updatedData.mobile.trim(),
      address: updatedData.address.trim(),
      creditLimit: parseFloat(updatedData.creditLimit) || 0
    };

    this.saveParties();
    App.showToast(`Party "${this.parties[idx].name}" updated successfully!`, 'success');
    return true;
  },

  deleteParty: function(partyId) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('delete party')) return;

    const party = this.getPartyById(partyId);
    if (!party) return;

    if (confirm(`Delete party "${party.name}" [${party.shortCode}] from master?`)) {
      this.parties = this.parties.filter(p => p.id !== partyId);
      this.saveParties();
      App.showToast('Party deleted from master', 'info');
      SettingsManager.renderPartyMasterTable();
    }
  }
};
