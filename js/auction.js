/**
 * Sales, Auctions & Multi-Buyer Lot Splitting Engine for Commission Agents
 */

const AuctionEngine = {
  lots: [],
  timerInterval: null,

  defaultLots: {
    'tenant-sgfc': [
      {
        id: "LOT-AZD-101",
        arrivalId: "ARV-1001",
        commodityId: "apple-royal",
        commodityName: "Apple - Royal Delicious",
        variety: "Super Grade (Medium Size, 22-24mm)",
        farmerName: "Harish Negi",
        farmerLocation: "Kotkhai, Shimla (HP)",
        farmerPhone: "+91 98160 44321",
        arhatiyaShop: "Shop No. C-42, New Fruit Market",
        arhatiyaName: "Shree Ganesh Fruit Co.",
        totalQuantity: 300,
        remainingQuantity: 100, // 200 already sold
        unit: "Box (20kg)",
        grade: "Grade A",
        reservePrice: 1950,
        currentBid: 2150,
        highestBidder: "Blinkit Procurements / Delhi NCR",
        bidsCount: 7,
        status: "live",
        timeRemainingSec: 180,
        truckNo: "HP-10-B-9812",
        freightAdvancePaid: 15000,
        palledariPerUnit: 12,
        splitSales: [
          {
            saleId: "SL-101-A",
            buyerName: "Aggarwal Wholesale Mart",
            buyerContact: "+91 98110 55432",
            quantity: 100,
            rate: 2150,
            grossAmount: 215000,
            time: "06:15 AM",
            paymentMode: "Credit (7 Days)"
          },
          {
            saleId: "SL-101-B",
            buyerName: "Rajdhani Hotel Supplies",
            buyerContact: "+91 99100 88776",
            quantity: 100,
            rate: 2120,
            grossAmount: 212000,
            time: "06:30 AM",
            paymentMode: "Credit (15 Days)"
          }
        ]
      }
    ],
    'tenant-csop': [
      {
        id: "LOT-AZD-102",
        arrivalId: "ARV-2001",
        commodityId: "onion-nashik",
        commodityName: "Onion - Red Garwa",
        variety: "Medium-Bold 55mm+",
        farmerName: "Pandurang Jadhav",
        farmerLocation: "Dindori, Nashik (MH)",
        farmerPhone: "+91 94231 87211",
        arhatiyaShop: "Shop No. B-12, Onion Yard",
        arhatiyaName: "Choudhary & Sons Onion & Potato Agency",
        totalQuantity: 220,
        remainingQuantity: 70,
        unit: "Quintal (100kg)",
        grade: "Grade A+",
        reservePrice: 2500,
        currentBid: 2680,
        highestBidder: "Delhi Veg Wholesalers",
        bidsCount: 12,
        status: "live",
        timeRemainingSec: 120,
        truckNo: "MH-15-EG-4401",
        freightAdvancePaid: 20000,
        palledariPerUnit: 15,
        splitSales: [
          {
            saleId: "SL-102-A",
            buyerName: "Aggarwal Wholesale Mart",
            buyerContact: "+91 98110 55432",
            quantity: 150,
            rate: 2680,
            grossAmount: 402000,
            time: "05:40 AM",
            paymentMode: "Credit (10 Days)"
          }
        ]
      }
    ]
  },

  init: function() {
    const tenantId = TenantManager.currentTenantId;
    const key = `mandi_lots_${tenantId}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      this.lots = JSON.parse(saved);
    } else {
      this.lots = this.defaultLots[tenantId] || [];
      localStorage.setItem(key, JSON.stringify(this.lots));
    }

    this.renderLots();
    this.startGlobalTimer();
  },

  saveLots: function() {
    const tenantId = TenantManager.currentTenantId;
    localStorage.setItem(`mandi_lots_${tenantId}`, JSON.stringify(this.lots));
  },

  startGlobalTimer: function() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      let changed = false;
      this.lots.forEach(lot => {
        if (lot.status === 'live' && lot.timeRemainingSec > 0) {
          lot.timeRemainingSec -= 1;
          changed = true;
          if (lot.timeRemainingSec <= 0 && lot.remainingQuantity > 0) {
            lot.timeRemainingSec = 180; // refresh cycle
          }
        }
      });

      if (changed) {
        document.querySelectorAll('.lot-timer').forEach(el => {
          const lotId = el.getAttribute('data-lot-id');
          const lot = this.lots.find(l => l.id === lotId);
          if (lot && lot.status === 'live') {
            const minutes = Math.floor(lot.timeRemainingSec / 60);
            const seconds = lot.timeRemainingSec % 60;
            el.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
          }
        });
      }
    }, 1000);
  },

  renderLots: function() {
    const container = document.getElementById('sales-lots-container');
    if (!container) return;

    if (this.lots.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <p class="text-slate-500 font-medium">No sales lots active for this firm.</p>
          <button onclick="ArrivalsManager.openNewArrivalModal()" class="mt-2 text-xs font-bold text-green-700 underline">
            + Register an Inward Truck Arrival to Start Selling
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.lots.map(lot => {
      const isCompleted = (lot.remainingQuantity || 0) === 0;
      const soldQuantity = lot.totalQuantity - (lot.remainingQuantity || 0);

      const minutes = Math.floor((lot.timeRemainingSec || 0) / 60);
      const seconds = (lot.timeRemainingSec || 0) % 60;
      const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      return `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between" id="lot-card-${lot.id}">
          <div>
            <!-- Header -->
            <div class="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <span class="text-xs font-mono font-bold text-green-800">${lot.id}</span>
                <span class="text-[11px] text-slate-500 block">Truck: ${lot.truckNo}</span>
              </div>
              <div>
                ${!isCompleted ? `
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span class="w-2 h-2 rounded-full bg-emerald-600 live-pulse"></span>
                    ACTIVE LOT
                  </span>
                ` : `
                  <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                    100% SOLD OUT
                  </span>
                `}
              </div>
            </div>

            <!-- Body Details -->
            <div class="p-4 space-y-3">
              <div>
                <h4 class="font-bold text-slate-900 text-base">${lot.commodityName}</h4>
                <p class="text-xs text-slate-500">${lot.variety} • <span class="font-semibold text-emerald-700">${lot.grade}</span></p>
              </div>

              <!-- Farmer & Inventory Split -->
              <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span class="text-slate-400 block font-medium">Farmer / Sender</span>
                  <span class="font-bold text-slate-800">${lot.farmerName}</span>
                  <span class="text-[11px] text-slate-500 block truncate">${lot.farmerLocation}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-medium">Quantity Progress</span>
                  <div class="flex items-baseline gap-1 mt-0.5">
                    <span class="text-sm font-black ${isCompleted ? 'text-slate-400' : 'text-emerald-700'}">${lot.remainingQuantity}</span>
                    <span class="text-xs text-slate-500">/ ${lot.totalQuantity} ${lot.unit.split(' ')[0]}</span>
                  </div>
                  <span class="text-[10px] text-slate-400 block">${soldQuantity} sold so far</span>
                </div>
              </div>

              <!-- Split Sales History -->
              ${lot.splitSales && lot.splitSales.length > 0 ? `
                <div class="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 space-y-1.5">
                  <div class="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase">
                    <span>Sold Batches (${lot.splitSales.length})</span>
                    <span>Rate / Qty</span>
                  </div>
                  <div class="space-y-1 max-h-28 overflow-y-auto pr-1">
                    ${lot.splitSales.map(s => `
                      <div class="flex justify-between items-center text-xs p-1.5 bg-white rounded-lg border border-slate-100">
                        <div class="truncate max-w-[140px]">
                          <strong class="text-slate-800">${s.buyerName}</strong>
                          <span class="block text-[10px] text-slate-400">${s.time}</span>
                        </div>
                        <div class="text-right">
                          <span class="font-bold text-slate-800">₹${s.rate}</span>
                          <span class="text-[10px] text-slate-500 block">${s.quantity} ${lot.unit.split(' ')[0]}</span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : `
                <div class="p-2.5 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                  No lots sold yet. Ready for auction or spot split sale.
                </div>
              `}

              ${!isCompleted ? `
                <div class="flex items-center justify-between text-xs px-1 text-slate-600">
                  <span class="text-slate-500 font-medium">Reserve Floor: ₹${lot.reservePrice}</span>
                  <span class="font-mono text-emerald-800 font-bold">Top Bid: ₹${lot.currentBid}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Actions -->
          <div class="p-4 pt-0 space-y-2">
            ${!isCompleted ? `
              <div class="flex gap-2">
                <button onclick="AuctionEngine.openMultiBuyerSaleModal('${lot.id}')" 
                  class="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors">
                  🏷️ Sell / Split to Buyer
                </button>
                <button onclick="AuctionEngine.quickHammerAllRemaining('${lot.id}')" 
                  class="px-3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors" title="Quick Hammer at Top Bid">
                  🔨 Hammer
                </button>
              </div>
            ` : `
              <div class="text-center py-1 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-lg">
                Consignment Fully Liquidated
              </div>
            `}

            <div class="flex gap-2">
              <button onclick="BillingEngine.openJFormModal('${lot.id}')" 
                class="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                📄 Farmer J-Form
              </button>
              <button onclick="BillingEngine.openThermalSlipModal('${lot.id}')" 
                class="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                🧾 Thermal Slip
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  openMultiBuyerSaleModal: function(lotId) {
    const lot = this.lots.find(l => l.id === lotId);
    if (!lot) return;

    const modal = document.getElementById('split-sale-modal');
    if (!modal) return;

    document.getElementById('split-modal-lot-id').value = lot.id;
    document.getElementById('split-modal-title').textContent = `${lot.commodityName} (${lot.variety})`;
    document.getElementById('split-modal-avail').textContent = `${lot.remainingQuantity} ${lot.unit} remaining`;

    const qtyInput = document.getElementById('split-modal-qty');
    qtyInput.max = lot.remainingQuantity;
    qtyInput.value = lot.remainingQuantity;

    const rateInput = document.getElementById('split-modal-rate');
    rateInput.value = lot.currentBid || lot.reservePrice;

    modal.classList.remove('hidden');
  },

  closeMultiBuyerSaleModal: function() {
    const modal = document.getElementById('split-sale-modal');
    if (modal) modal.classList.add('hidden');
  },

  submitSplitSale: function(formData) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('record split sale')) return;

    const lotId = document.getElementById('split-modal-lot-id').value;
    const lot = this.lots.find(l => l.id === lotId);
    if (!lot) return;

    const sellQty = parseInt(formData.quantity);
    const sellRate = parseFloat(formData.rate);
    const buyerName = formData.buyerName;
    const paymentMode = formData.paymentMode;

    if (!sellQty || sellQty <= 0 || sellQty > lot.remainingQuantity) {
      App.showToast(`Quantity must be between 1 and ${lot.remainingQuantity}`, 'error');
      return;
    }

    if (!sellRate || sellRate <= 0) {
      App.showToast('Please enter a valid rate', 'error');
      return;
    }

    const saleAmount = sellQty * sellRate;
    const newSale = {
      saleId: 'SL-' + Math.floor(100 + Math.random() * 900),
      buyerName: buyerName,
      buyerContact: formData.buyerPhone || '+91 98110 55432',
      quantity: sellQty,
      rate: sellRate,
      grossAmount: saleAmount,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      paymentMode: paymentMode
    };

    if (!lot.splitSales) lot.splitSales = [];
    lot.splitSales.push(newSale);
    lot.remainingQuantity -= sellQty;

    if (lot.remainingQuantity === 0) {
      lot.status = 'sold';
      lot.timeRemainingSec = 0;
    }

    this.saveLots();
    this.renderLots();

    // Also automatically log into Buyer Bahi-Khata as an outstanding receivable
    BahiKhata.addBuyerTransaction(buyerName, saleAmount, sellQty, lot.commodityName);

    this.closeMultiBuyerSaleModal();
    App.showToast(`Sold ${sellQty} ${lot.unit} to ${buyerName} at ₹${sellRate}!`, 'success');
  },

  quickHammerAllRemaining: function(lotId) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('hammer auction sale')) return;

    const lot = this.lots.find(l => l.id === lotId);
    if (!lot || lot.remainingQuantity <= 0) return;

    const topBidder = lot.highestBidder && lot.highestBidder !== 'No bids yet' 
      ? lot.highestBidder 
      : 'Aggarwal Wholesale Mart';

    if (confirm(`Hammer remaining ${lot.remainingQuantity} ${lot.unit} to ${topBidder} at top bid ₹${lot.currentBid}?`)) {
      const saleAmount = lot.remainingQuantity * lot.currentBid;
      const newSale = {
        saleId: 'SL-' + Math.floor(100 + Math.random() * 900),
        buyerName: topBidder,
        buyerContact: '+91 98110 55432',
        quantity: lot.remainingQuantity,
        rate: lot.currentBid,
        grossAmount: saleAmount,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        paymentMode: 'Credit (7 Days)'
      };

      if (!lot.splitSales) lot.splitSales = [];
      lot.splitSales.push(newSale);
      lot.remainingQuantity = 0;
      lot.status = 'sold';
      lot.timeRemainingSec = 0;

      this.saveLots();
      this.renderLots();
      BahiKhata.addBuyerTransaction(topBidder, saleAmount, newSale.quantity, lot.commodityName);

      App.showToast(`🔨 Lot ${lot.id} hammered and fully sold to ${topBidder}!`, 'success');
    }
  }
};
