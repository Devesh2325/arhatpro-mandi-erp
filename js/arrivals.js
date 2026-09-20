/**
 * Inward Produce & Freight Advance (गाड़ी आवक व भाड़ा) Module for Commission Agents
 */

const ArrivalsManager = {
  arrivals: [],

  defaultArrivals: {
    'tenant-sgfc': [
      {
        id: 'ARV-1001',
        date: '2026-09-20',
        time: '04:15 AM',
        truckNo: 'HP-10-B-9812',
        driverName: 'Surjeet Singh',
        driverPhone: '+91 98166 12345',
        farmerName: 'Harish Negi',
        farmerPhone: '+91 98160 44321',
        farmerLocation: 'Kotkhai, Shimla (HP)',
        commodity: 'Apple - Royal Delicious',
        variety: 'Medium Box (22-24mm)',
        quantity: 300,
        unit: 'Box (20kg)',
        totalFreight: 36000, // Total truck freight
        freightAdvancePaid: 15000, // Paid to driver on arrival at shop
        freightBalance: 21000,
        unloadingPalledari: 3600, // 300 * ₹12
        palledarToli: 'Raju & Gang (Toli No. 4)',
        bardanaCratesLoaned: 0,
        status: 'Ready for Sale', // 'Ready for Sale', 'Sold Out', 'Partially Sold'
        transferredToLot: true,
        lotId: 'LOT-AZD-101'
      },
      {
        id: 'ARV-1002',
        date: '2026-09-20',
        time: '05:30 AM',
        truckNo: 'JK-02-AT-4410',
        driverName: 'Ghulam Nabi',
        driverPhone: '+91 94190 88211',
        farmerName: 'Bashir Ahmed Lone',
        farmerPhone: '+91 97970 33412',
        farmerLocation: 'Sopore, Baramulla (J&K)',
        commodity: 'Apple - Delicious Super',
        variety: 'Grade A+ Large (28-30mm)',
        quantity: 450,
        unit: 'Box (20kg)',
        totalFreight: 54000,
        freightAdvancePaid: 25000,
        freightBalance: 29000,
        unloadingPalledari: 5400,
        palledarToli: 'Mithilesh Toli No. 2',
        bardanaCratesLoaned: 50,
        status: 'Ready for Sale',
        transferredToLot: false
      }
    ],
    'tenant-csop': [
      {
        id: 'ARV-2001',
        date: '2026-09-20',
        time: '03:45 AM',
        truckNo: 'MH-15-EG-4401',
        driverName: 'Sanjay More',
        driverPhone: '+91 98221 44556',
        farmerName: 'Pandurang Jadhav',
        farmerPhone: '+91 94231 87211',
        farmerLocation: 'Dindori, Nashik (MH)',
        commodity: 'Onion - Red Garwa',
        variety: 'Medium-Bold 55mm+',
        quantity: 220,
        unit: 'Quintal (100kg)',
        totalFreight: 44000,
        freightAdvancePaid: 20000,
        freightBalance: 24000,
        unloadingPalledari: 3300,
        palledarToli: 'Chotu Toli',
        bardanaCratesLoaned: 0,
        status: 'Ready for Sale',
        transferredToLot: true,
        lotId: 'LOT-AZD-102'
      }
    ]
  },

  init: function() {
    const tenantId = TenantManager.currentTenantId;
    const key = `mandi_arrivals_${tenantId}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      this.arrivals = JSON.parse(saved);
    } else {
      this.arrivals = this.defaultArrivals[tenantId] || [];
      localStorage.setItem(key, JSON.stringify(this.arrivals));
    }

    this.renderArrivals();
  },

  saveArrivals: function() {
    const tenantId = TenantManager.currentTenantId;
    localStorage.setItem(`mandi_arrivals_${tenantId}`, JSON.stringify(this.arrivals));
  },

  renderArrivals: function() {
    const container = document.getElementById('arrivals-table-body');
    const summaryContainer = document.getElementById('arrivals-summary-cards');
    if (!container) return;

    let totalBoxes = 0;
    let totalFreightAdvance = 0;
    let totalActiveTrucks = this.arrivals.length;

    this.arrivals.forEach(a => {
      totalBoxes += parseInt(a.quantity);
      totalFreightAdvance += parseFloat(a.freightAdvancePaid);
    });

    if (summaryContainer) {
      summaryContainer.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-xs font-semibold text-slate-500 uppercase block">Today's Inward Consignments</span>
            <span class="text-2xl font-black text-slate-800 mt-1 block">${totalActiveTrucks} Trucks</span>
            <span class="text-xs text-slate-500">${totalBoxes.toLocaleString()} boxes/units unloaded</span>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-xs font-semibold text-amber-700 uppercase block">Freight Advance Paid (भाड़ा पेशगी)</span>
            <span class="text-2xl font-black text-amber-800 mt-1 block">₹${totalFreightAdvance.toLocaleString('en-IN')}</span>
            <span class="text-xs text-slate-500">Paid to truck drivers (to deduct on J-Form)</span>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-xs font-semibold text-emerald-700 uppercase block">Active Commission Agent</span>
            <span class="text-lg font-black text-emerald-800 mt-1 block truncate">${TenantManager.getActiveTenant().firmName}</span>
            <span class="text-xs text-slate-500">${TenantManager.getActiveTenant().shopNo}</span>
          </div>
        </div>
      `;
    }

    if (this.arrivals.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-8 text-slate-400 font-medium text-xs">
            No truck arrivals recorded today for this firm. Click "+ Register New Truck Arrival" above.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = this.arrivals.map(arv => {
      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
          <td class="p-3">
            <span class="font-mono font-bold text-xs text-green-800">${arv.id}</span>
            <span class="block text-[11px] text-slate-400">${arv.time} • ${arv.date}</span>
          </td>
          <td class="p-3">
            <div class="font-bold text-slate-800 text-xs">${arv.truckNo}</div>
            <div class="text-[11px] text-slate-500">Driver: ${arv.driverName} (${arv.driverPhone})</div>
          </td>
          <td class="p-3">
            <div class="font-bold text-slate-800 text-xs">${arv.farmerName}</div>
            <div class="text-[11px] text-slate-500">${arv.farmerLocation} • ${arv.farmerPhone}</div>
          </td>
          <td class="p-3">
            <div class="font-semibold text-slate-800 text-xs">${arv.commodity}</div>
            <div class="text-[11px] text-slate-500">${arv.variety}</div>
            <span class="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[11px]">
              ${arv.quantity} ${arv.unit}
            </span>
          </td>
          <td class="p-3 text-right">
            <div class="text-xs font-bold text-amber-800">Adv: ₹${arv.freightAdvancePaid.toLocaleString('en-IN')}</div>
            <div class="text-[11px] text-slate-400">Total: ₹${arv.totalFreight.toLocaleString('en-IN')}</div>
            <div class="text-[10px] text-rose-600 font-medium">Bal: ₹${arv.freightBalance.toLocaleString('en-IN')}</div>
          </td>
          <td class="p-3 text-center">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold ${arv.transferredToLot ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              ${arv.transferredToLot ? '✓ Active in Sales' : 'Pending Sale'}
            </span>
          </td>
          <td class="p-3 text-right">
            <div class="flex items-center justify-end gap-1.5">
              ${!arv.transferredToLot ? `
                <button onclick="ArrivalsManager.moveToSalesLot('${arv.id}')" 
                  class="px-2.5 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold transition-colors">
                  + Create Lot
                </button>
              ` : `
                <button onclick="AuctionEngine.openMultiBuyerSaleModal('${arv.lotId}')" 
                  class="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors">
                  🏷️ Sell / Split
                </button>
              `}
              <button onclick="ArrivalsManager.viewArrivalParchi('${arv.id}')" 
                class="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors" title="Print Arrival Slip">
                🖨️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  openNewArrivalModal: function() {
    const modal = document.getElementById('new-arrival-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeNewArrivalModal: function() {
    const modal = document.getElementById('new-arrival-modal');
    if (modal) modal.classList.add('hidden');
  },

  submitNewArrival: function(formData) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('record truck arrival')) return;

    const totalFreight = parseFloat(formData.totalFreight) || 0;
    const advancePaid = parseFloat(formData.freightAdvance) || 0;
    const balance = Math.max(0, totalFreight - advancePaid);
    const quantity = parseInt(formData.quantity) || 1;
    const palledariRate = TenantManager.getActiveTenant().palledariRatePerBox || 12;

    const newArrival = {
      id: 'ARV-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      truckNo: formData.truckNo.toUpperCase(),
      driverName: formData.driverName,
      driverPhone: formData.driverPhone,
      farmerName: formData.farmerName,
      farmerPhone: formData.farmerPhone,
      farmerLocation: formData.farmerLocation,
      commodity: formData.commodity,
      variety: formData.variety,
      quantity: quantity,
      unit: formData.unit,
      totalFreight: totalFreight,
      freightAdvancePaid: advancePaid,
      freightBalance: balance,
      unloadingPalledari: quantity * palledariRate,
      palledarToli: formData.palledarToli || 'General Toli',
      bardanaCratesLoaned: parseInt(formData.bardanaLoaned) || 0,
      status: 'Ready for Sale',
      transferredToLot: false
    };

    this.arrivals.unshift(newArrival);
    this.saveArrivals();
    this.renderArrivals();
    this.closeNewArrivalModal();

    // Also prompt to immediately transfer to sales lot
    if (confirm(`Truck arrival ${newArrival.id} saved! Would you like to put these ${quantity} ${newArrival.unit} up for sale now?`)) {
      this.moveToSalesLot(newArrival.id);
    } else {
      App.showToast(`Inward truck ${newArrival.truckNo} logged successfully!`, 'success');
    }
  },

  moveToSalesLot: function(arrivalId) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('create sales lot from arrival')) return;

    const arv = this.arrivals.find(a => a.id === arrivalId);
    if (!arv) return;

    const tenant = TenantManager.getActiveTenant();
    const lotId = 'LOT-' + arv.id.replace('ARV-', '');

    const newLot = {
      id: lotId,
      arrivalId: arv.id,
      commodityId: arv.commodity.toLowerCase().includes('apple') ? 'apple-royal' : 'onion-nashik',
      commodityName: arv.commodity,
      variety: arv.variety,
      farmerName: arv.farmerName,
      farmerLocation: arv.farmerLocation,
      farmerPhone: arv.farmerPhone,
      arhatiyaShop: tenant.shopNo,
      arhatiyaName: tenant.firmName,
      totalQuantity: arv.quantity,
      remainingQuantity: arv.quantity,
      unit: arv.unit,
      grade: 'Grade A',
      reservePrice: arv.commodity.toLowerCase().includes('apple') ? 1900 : 2400,
      currentBid: arv.commodity.toLowerCase().includes('apple') ? 2100 : 2600,
      highestBidder: 'No bids yet',
      bidsCount: 0,
      status: 'live',
      timeRemainingSec: 300,
      truckNo: arv.truckNo,
      freightAdvancePaid: arv.freightAdvancePaid,
      palledariPerUnit: tenant.palledariRatePerBox,
      splitSales: [] // stores multi-buyer sales: [{buyerName, qty, rate, amount, date}]
    };

    arv.transferredToLot = true;
    arv.lotId = lotId;
    this.saveArrivals();
    this.renderArrivals();

    // Add into Auction Engine
    AuctionEngine.lots.unshift(newLot);
    AuctionEngine.saveLots();
    AuctionEngine.renderLots();

    App.switchTab('sales');
    App.showToast(`Consignment ${arv.id} converted into Sales Lot ${lotId}!`, 'success');
  },

  viewArrivalParchi: function(arrivalId) {
    const arv = this.arrivals.find(a => a.id === arrivalId);
    if (!arv) return;
    
    // View quick arrival receipt slip
    BillingEngine.renderArrivalThermalSlip(arv);
  }
};
