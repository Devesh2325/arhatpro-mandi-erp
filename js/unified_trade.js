/**
 * Unified Arrival & Multi-Lot Sale Single Form Engine (एकल आवक-बिक्री प्रपत्र)
 * Supports dynamic multi-lot configurations (Lot 1, Lot 2, Lot 3...), live crate allocation gauge,
 * smart party type-ahead auto-complete, and post-trade action hub with Teep generation.
 */

const UnifiedTrade = {
  lots: [
    { id: 'LOT-1', label: 'Lot 1 (Grade A / Mark-1)', mark: 'Mark HN-1', variety: 'Medium Size 24mm', qty: 150 },
    { id: 'LOT-2', label: 'Lot 2 (Grade B / Mark-2)', mark: 'Mark HN-2', variety: 'Small Size 20mm', qty: 150 }
  ],
  saleRowsCount: 1,

  init: function() {
    this.renderLotInputs();
    this.renderInitialBuyerRows();
    this.setupPartyAutoCompletes();
    this.recalculateTotals();
  },

  // ================= 1. DYNAMIC CONSIGNMENT LOTS (Part 1) =================
  renderLotInputs: function() {
    const container = document.getElementById('unified-lots-container');
    if (!container) return;

    container.innerHTML = this.lots.map((lot, idx) => `
      <div class="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs relative" data-lot-id="${lot.id}">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-1.5">
            <span class="font-mono font-black text-xs text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
              ${lot.id}
            </span>
            <span class="text-[11px] font-bold text-slate-700">${lot.label}</span>
          </div>
          ${this.lots.length > 1 ? `
            <button type="button" onclick="UnifiedTrade.removeLot('${lot.id}')" class="text-rose-500 hover:text-rose-700 font-bold text-xs p-1">
              ✕
            </button>
          ` : ''}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div>
            <label class="text-[10px] text-slate-400 font-bold block mb-0.5">Farmer Mark / Lota</label>
            <input type="text" class="lot-mark-input w-full p-2 border border-slate-300 rounded-xl font-bold" 
              value="${lot.mark}" placeholder="e.g. Mark HN-1" oninput="UnifiedTrade.updateLotField('${lot.id}', 'mark', this.value)">
          </div>
          <div>
            <label class="text-[10px] text-slate-400 font-bold block mb-0.5">Variety / Grade / Size</label>
            <input type="text" class="lot-variety-input w-full p-2 border border-slate-300 rounded-xl" 
              value="${lot.variety}" placeholder="e.g. Medium 24mm" oninput="UnifiedTrade.updateLotField('${lot.id}', 'variety', this.value)">
          </div>
          <div>
            <label class="text-[10px] text-slate-400 font-bold block mb-0.5">Crates / Box Quantity</label>
            <input type="number" class="lot-qty-input w-full p-2 border border-slate-300 rounded-xl font-black text-slate-900" 
              value="${lot.qty}" placeholder="150" oninput="UnifiedTrade.updateLotField('${lot.id}', 'qty', this.value)">
          </div>
        </div>
      </div>
    `).join('');

    this.updateBuyerLotDropdowns();
    this.recalculateTotals();
  },

  addLot: function() {
    const nextNum = this.lots.length + 1;
    const lotId = `LOT-${nextNum}`;
    const gradeLetter = String.fromCharCode(64 + nextNum); // A, B, C...
    this.lots.push({
      id: lotId,
      label: `Lot ${nextNum} (Grade ${gradeLetter} / Mark-${nextNum})`,
      mark: `Mark HN-${nextNum}`,
      variety: 'Commercial Grade',
      qty: 100
    });
    this.renderLotInputs();
    App.showToast(`Added ${lotId} to consignment`, 'info');
  },

  removeLot: function(lotId) {
    if (this.lots.length <= 1) {
      App.showToast('At least one lot is required per truck', 'error');
      return;
    }
    this.lots = this.lots.filter(l => l.id !== lotId);
    this.renderLotInputs();
    this.recalculateTotals();
  },

  updateLotField: function(lotId, field, value) {
    const lot = this.lots.find(l => l.id === lotId);
    if (!lot) return;
    if (field === 'qty') {
      lot.qty = parseInt(value) || 0;
    } else {
      lot[field] = value;
    }
    this.recalculateTotals();
  },

  updateBuyerLotDropdowns: function() {
    const lotOptionsHtml = this.lots.map(l => `
      <option value="${l.id}">${l.id}: ${l.label} (${l.qty} crates)</option>
    `).join('');

    document.querySelectorAll('.buyer-lot-select').forEach(select => {
      const cur = select.value;
      select.innerHTML = lotOptionsHtml;
      if (cur && this.lots.some(l => l.id === cur)) {
        select.value = cur;
      }
    });
  },

  // ================= 2. MULTI-BUYER SPOT ROWS (Part 2) =================
  renderInitialBuyerRows: function() {
    const container = document.getElementById('unified-buyer-rows');
    if (!container) return;

    container.innerHTML = this.createBuyerRowHtml(1, 'LOT-1', 'AGW', 'Aggarwal Wholesale Mart', 150, 2150);
    this.saleRowsCount = 1;
    this.updateBuyerLotDropdowns();
    this.setupPartyAutoCompletes();
    this.recalculateTotals();
  },

  createBuyerRowHtml: function(idx, targetLot, bCode, bName, qty, rate) {
    return `
      <div class="buyer-sale-row p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 mb-2 hover:border-green-300 transition-colors relative" data-row-idx="${idx}">
        <div class="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
          <div>
            <label class="font-bold text-slate-700 block mb-1">Target Lot (लॉट)</label>
            <select class="buyer-lot-select w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold bg-white focus:ring-2 focus:ring-green-600" onchange="UnifiedTrade.recalculateTotals()">
              ${this.lots.map(l => `<option value="${l.id}" ${l.id === targetLot ? 'selected' : ''}>${l.id}: ${l.label}</option>`).join('')}
            </select>
          </div>

          <div class="relative">
            <div class="flex justify-between items-center mb-1">
              <label class="font-bold text-slate-700">Buyer Code (शॉर्ट कोड)</label>
              <button type="button" onclick="SettingsManager.openAddPartyModal()" class="text-[10px] text-green-700 font-bold hover:underline">
                + New
              </button>
            </div>
            <input type="text" class="buyer-code-input w-full p-2.5 border border-slate-300 rounded-xl uppercase font-mono font-black text-blue-900 focus:ring-2 focus:ring-green-600 bg-white" 
              value="${bCode}" placeholder="e.g. AGW, RJD" required oninput="UnifiedTrade.onBuyerCodeInput(this)">
            <span class="buyer-resolved-name block text-[11px] font-semibold text-slate-500 mt-1 truncate">
              ${bName ? `✓ ${bName}` : 'Type short code above'}
            </span>
            <div class="buyer-suggestions-dropdown hidden absolute top-full left-0 right-0 z-50 bg-white border border-slate-300 rounded-xl shadow-xl max-h-40 overflow-y-auto mt-1"></div>
          </div>

          <div>
            <label class="font-bold text-slate-700 block mb-1">Crates / Quantity</label>
            <input type="number" class="buyer-qty-input w-full p-2.5 border border-slate-300 rounded-xl font-black text-slate-900 bg-white" 
              value="${qty}" placeholder="100" required oninput="UnifiedTrade.recalculateTotals()">
          </div>

          <div>
            <label class="font-bold text-slate-700 block mb-1">Sale Rate (₹/unit)</label>
            <input type="number" class="buyer-rate-input w-full p-2.5 border border-slate-300 rounded-xl font-black text-emerald-800 bg-white" 
              value="${rate}" placeholder="2150" required oninput="UnifiedTrade.recalculateTotals()">
          </div>

          <div>
            <label class="font-bold text-slate-700 block mb-1">Row Total (₹)</label>
            <div class="flex items-center justify-between mt-1">
              <span class="buyer-row-total font-black text-base text-slate-900">₹${(qty * rate).toLocaleString('en-IN')}</span>
              <button type="button" onclick="UnifiedTrade.removeBuyerRow(this)" class="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors">
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  addBuyerRow: function() {
    this.saleRowsCount += 1;
    const container = document.getElementById('unified-buyer-rows');
    if (!container) return;

    const div = document.createElement('div');
    const defaultLot = this.lots[this.saleRowsCount % this.lots.length]?.id || 'LOT-1';
    div.innerHTML = this.createBuyerRowHtml(this.saleRowsCount, defaultLot, '', '', 100, 2100);
    container.appendChild(div.firstElementChild);
    this.updateBuyerLotDropdowns();
    this.setupPartyAutoCompletes();
    this.recalculateTotals();
  },

  removeBuyerRow: function(btn) {
    const rows = document.querySelectorAll('.buyer-sale-row');
    if (rows.length <= 1) {
      App.showToast('At least one buyer row is required', 'info');
      return;
    }
    const row = btn.closest('.buyer-sale-row');
    row?.remove();
    this.recalculateTotals();
  },

  // ================= 3. AUTO-COMPLETE & PARTY SUGGESTIONS =================
  setupPartyAutoCompletes: function() {
    // Farmer input
    const farmerInput = document.getElementById('unified-farmer-code');
    if (farmerInput) {
      farmerInput.addEventListener('input', (e) => {
        const code = e.target.value.trim().toUpperCase();
        e.target.value = code;
        const party = PartyManager.findByCode(code);
        const nameDisplay = document.getElementById('unified-farmer-resolved');
        const phoneInput = document.getElementById('unified-farmer-phone');

        if (party) {
          if (nameDisplay) {
            nameDisplay.textContent = `✓ ${party.name} (${party.address})`;
            nameDisplay.className = 'text-[11px] font-bold text-emerald-700 block mt-1 truncate';
          }
          if (phoneInput) phoneInput.value = party.mobile;
        } else {
          if (nameDisplay) {
            nameDisplay.textContent = code ? 'New / Unregistered Farmer' : 'Enter short code';
            nameDisplay.className = 'text-[11px] font-medium text-slate-400 block mt-1 truncate';
          }
        }
      });
    }
  },

  onBuyerCodeInput: function(inputEl) {
    const code = inputEl.value.trim().toUpperCase();
    inputEl.value = code;
    const row = inputEl.closest('.buyer-sale-row');
    const nameEl = row.querySelector('.buyer-resolved-name');
    const party = PartyManager.findByCode(code);

    if (party) {
      nameEl.textContent = `✓ ${party.name} (Due: ₹${(party.currentBalance || 0).toLocaleString('en-IN')})`;
      nameEl.className = 'buyer-resolved-name block text-[11px] font-bold text-emerald-700 mt-1 truncate';
    } else {
      nameEl.textContent = code ? 'Unregistered Buyer (Direct sale)' : 'Type code above';
      nameEl.className = 'buyer-resolved-name block text-[11px] font-medium text-slate-400 mt-1 truncate';
    }
    this.recalculateTotals();
  },

  // ================= 4. TOTALS & LIVE ALLOCATION GAUGE =================
  recalculateTotals: function() {
    // Calculate total arrived across all lots
    const totalArrived = this.lots.reduce((acc, l) => acc + (parseInt(l.qty) || 0), 0);
    const totalDisplay = document.getElementById('unified-total-crates-display');
    if (totalDisplay) totalDisplay.textContent = `${totalArrived} Crates Total (${this.lots.length} Lots)`;

    const rows = document.querySelectorAll('.buyer-sale-row');
    let totalAllocated = 0;
    let totalSaleValue = 0;

    rows.forEach(row => {
      const qty = parseInt(row.querySelector('.buyer-qty-input')?.value) || 0;
      const rate = parseFloat(row.querySelector('.buyer-rate-input')?.value) || 0;
      const rowAmt = qty * rate;
      totalAllocated += qty;
      totalSaleValue += rowAmt;

      const amtEl = row.querySelector('.buyer-row-total');
      if (amtEl) amtEl.textContent = `₹${rowAmt.toLocaleString('en-IN')}`;
    });

    const unallocated = totalArrived - totalAllocated;
    const balanceEl = document.getElementById('unified-balance-crates');
    const progressEl = document.getElementById('unified-allocation-progress');

    if (balanceEl) {
      if (unallocated === 0 && totalArrived > 0) {
        balanceEl.textContent = `✓ 100% Sold (${totalArrived} Crates Allocated)`;
        balanceEl.className = 'text-xs font-black text-emerald-800 bg-emerald-100 px-3.5 py-1.5 rounded-full';
      } else if (unallocated > 0) {
        balanceEl.textContent = `${unallocated} / ${totalArrived} crates unallocated`;
        balanceEl.className = 'text-xs font-bold text-amber-800 bg-amber-100 px-3.5 py-1.5 rounded-full';
      } else {
        balanceEl.textContent = `⚠️ Over-allocated by ${Math.abs(unallocated)} crates!`;
        balanceEl.className = 'text-xs font-black text-rose-800 bg-rose-100 px-3.5 py-1.5 rounded-full';
      }
    }

    if (progressEl && totalArrived > 0) {
      const pct = Math.min(100, Math.round((totalAllocated / totalArrived) * 100));
      progressEl.style.width = `${pct}%`;
      progressEl.className = `h-full rounded-full transition-all duration-300 ${unallocated < 0 ? 'bg-rose-500' : (pct === 100 ? 'bg-emerald-600' : 'bg-amber-500')}`;
    }

    const grossDisplay = document.getElementById('unified-gross-sale-display');
    if (grossDisplay) {
      grossDisplay.textContent = `₹${totalSaleValue.toLocaleString('en-IN')}`;
    }
  },

  // ================= 5. TRADE SUBMISSION & POST-TRADE HUB =================
  submitUnifiedTrade: function() {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('save consignment trade')) return;

    const totalArrived = this.lots.reduce((acc, l) => acc + (parseInt(l.qty) || 0), 0);
    if (totalArrived <= 0) {
      App.showToast('Please enter crate quantities for consignment lots', 'error');
      return;
    }

    const truckNo = document.getElementById('unified-truck-no').value.trim().toUpperCase();
    const farmerCode = document.getElementById('unified-farmer-code').value.trim().toUpperCase();
    const farmerParty = PartyManager.findByCode(farmerCode);
    const farmerName = farmerParty ? farmerParty.name : (farmerCode || 'Direct Producer');
    const farmerPhone = farmerParty ? farmerParty.mobile : (document.getElementById('unified-farmer-phone')?.value || '+91 98160 44321');
    const commodity = document.getElementById('unified-commodity').value;
    const totalFreight = parseFloat(document.getElementById('unified-total-freight')?.value) || 0;
    const freightAdvance = parseFloat(document.getElementById('unified-freight-adv')?.value) || 0;

    // Collect buyer split rows
    const rows = document.querySelectorAll('.buyer-sale-row');
    const splitSales = [];
    let totalAllocated = 0;

    for (let row of rows) {
      const targetLot = row.querySelector('.buyer-lot-select').value;
      const bCode = row.querySelector('.buyer-code-input').value.trim().toUpperCase();
      const bParty = PartyManager.findByCode(bCode);
      const bName = bParty ? bParty.name : (bCode || 'Spot Wholesale Buyer');
      const bPhone = bParty ? bParty.mobile : '+91 98110 55432';
      const qty = parseInt(row.querySelector('.buyer-qty-input').value) || 0;
      const rate = parseFloat(row.querySelector('.buyer-rate-input').value) || 0;

      if (qty <= 0 || rate <= 0) {
        App.showToast('All buyer rows must have valid quantity and rate', 'error');
        return;
      }

      totalAllocated += qty;
      splitSales.push({
        saleId: 'SL-' + Math.floor(1000 + Math.random() * 9000),
        targetLot: targetLot,
        buyerName: bName,
        buyerContact: bPhone,
        quantity: qty,
        rate: rate,
        grossAmount: qty * rate,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        paymentMode: 'Credit (7 Days)'
      });
    }

    if (totalAllocated > totalArrived) {
      App.showToast(`Allocated crates (${totalAllocated}) cannot exceed arrived crates (${totalArrived})`, 'error');
      return;
    }

    const tenant = TenantManager.getActiveTenant();
    const consignmentId = 'ARV-' + Math.floor(1000 + Math.random() * 9000);
    const lotId = 'LOT-' + consignmentId.replace('ARV-', '');
    const varietyStr = this.lots.map(l => `${l.id}: ${l.variety} (${l.qty})`).join(' + ');

    // 1. Inward Arrival Record
    const arrivalRecord = {
      id: consignmentId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      truckNo: truckNo,
      driverName: document.getElementById('unified-driver-name')?.value || 'Surjeet Singh',
      driverPhone: document.getElementById('unified-driver-phone')?.value || '+91 98166 12345',
      farmerName: farmerName,
      farmerPhone: farmerPhone,
      farmerLocation: farmerParty ? farmerParty.address : 'Kotkhai, Shimla (HP)',
      commodity: commodity,
      variety: varietyStr,
      quantity: totalArrived,
      unit: 'Box (20kg)',
      totalFreight: totalFreight,
      freightAdvancePaid: freightAdvance,
      freightBalance: Math.max(0, totalFreight - freightAdvance),
      unloadingPalledari: totalArrived * (tenant.palledariRatePerBox || 12),
      status: totalAllocated === totalArrived ? 'Sold Out' : 'Partially Sold',
      transferredToLot: true,
      lotId: lotId
    };
    ArrivalsManager.arrivals.unshift(arrivalRecord);
    ArrivalsManager.saveArrivals();

    // 2. Sales Lot Record with Split Sales
    const lotRecord = {
      id: lotId,
      arrivalId: consignmentId,
      commodityName: commodity,
      variety: varietyStr,
      farmerName: farmerName,
      farmerLocation: arrivalRecord.farmerLocation,
      farmerPhone: farmerPhone,
      arhatiyaShop: tenant.shopNo,
      arhatiyaName: tenant.firmName,
      totalQuantity: totalArrived,
      remainingQuantity: Math.max(0, totalArrived - totalAllocated),
      unit: 'Box (20kg)',
      grade: 'Multi-Lot Consignment',
      reservePrice: splitSales[0]?.rate || 2000,
      currentBid: splitSales[0]?.rate || 2000,
      highestBidder: splitSales[0]?.buyerName || 'Sold',
      bidsCount: splitSales.length,
      status: totalAllocated === totalArrived ? 'sold' : 'live',
      timeRemainingSec: 0,
      truckNo: truckNo,
      freightAdvancePaid: freightAdvance,
      palledariPerUnit: tenant.palledariRatePerBox || 12,
      splitSales: splitSales
    };
    AuctionEngine.lots.unshift(lotRecord);
    AuctionEngine.saveLots();

    // 3. Debit each buyer's Bahi-Khata ledger
    splitSales.forEach(s => {
      BahiKhata.addBuyerTransaction(s.buyerName, s.grossAmount, s.quantity, commodity);
    });

    // 4. Log Driver Freight Advance in Rokad Cashbook if paid in cash
    if (freightAdvance > 0) {
      BahiKhata.cashTransactions.unshift({
        id: 'TX-' + Date.now(),
        type: 'KHARCH',
        title: `Driver Freight Advance (${truckNo} / ${farmerName})`,
        amount: freightAdvance,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      BahiKhata.saveCashbook();
    }

    App.showToast(`⚡ Consignment ${consignmentId} sealed & Teep generated!`, 'success');
    this.openPostTradeHub(lotId, consignmentId, totalArrived, splitSales);
  },

  openPostTradeHub: function(lotId, consignmentId, totalUnits, splitSales) {
    const modal = document.getElementById('trade-success-modal');
    if (!modal) {
      BillingEngine.openJFormModal(lotId);
      return;
    }

    const summaryEl = document.getElementById('trade-success-summary');
    if (summaryEl) {
      const grossVal = splitSales.reduce((acc, s) => acc + s.grossAmount, 0);
      summaryEl.innerHTML = `
        <div class="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2 text-xs">
          <div class="flex justify-between items-center">
            <span class="font-mono font-bold text-emerald-900">Consignment: ${consignmentId}</span>
            <span class="font-bold text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-full text-[10px]">100% Finalized</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-600">Total Produce Sold:</span>
            <span class="font-black text-slate-900">${totalUnits} Units (${splitSales.length} Buyers)</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-600">Gross Realized Value:</span>
            <span class="text-base font-black text-emerald-900">₹${grossVal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      `;
    }

    // Set lot ID for buttons
    modal.setAttribute('data-active-lot', lotId);
    modal.classList.remove('hidden');
  },

  closePostTradeHub: function() {
    const modal = document.getElementById('trade-success-modal');
    if (modal) modal.classList.add('hidden');
  },

  resetForNextConsignment: function() {
    this.closePostTradeHub();
    document.getElementById('unified-truck-no').value = 'HP-10-B-' + Math.floor(1000 + Math.random() * 9000);
    this.lots = [
      { id: 'LOT-1', label: 'Lot 1 (Grade A / Mark-1)', mark: 'Mark HN-1', variety: 'Medium Size 24mm', qty: 150 },
      { id: 'LOT-2', label: 'Lot 2 (Grade B / Mark-2)', mark: 'Mark HN-2', variety: 'Small Size 20mm', qty: 150 }
    ];
    this.renderLotInputs();
    this.renderInitialBuyerRows();
    App.showToast('Ready for new truck consignment entry', 'info');
  }
};
