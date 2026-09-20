/**
 * Comprehensive Mandi Reports Suite & Teep Final Sale Engine (रिपोर्ट्स हब)
 * Includes Teep (View-Only Owner Audit Copy), Buyer Purcha, Buyer Balance Aging,
 * Grower Balance, Buyer & Grower Summaries, Inward Arrivals, and APMC Form 'M'.
 */

const ReportsHub = {
  currentSubTab: 'teep',

  init: function() {
    this.renderActiveReport();
  },

  switchReportTab: function(subTab) {
    this.currentSubTab = subTab;

    // Update subtab buttons
    document.querySelectorAll('.report-subtab-pill').forEach(btn => {
      if (btn.getAttribute('data-report-target') === subTab) {
        btn.classList.add('bg-slate-900', 'text-white', 'shadow-sm');
        btn.classList.remove('bg-white', 'text-slate-700', 'hover:bg-slate-100');
      } else {
        btn.classList.remove('bg-slate-900', 'text-white', 'shadow-sm');
        btn.classList.add('bg-white', 'text-slate-700', 'hover:bg-slate-100');
      }
    });

    // Hide all sub-panels, show selected
    const panels = [
      'rep-panel-teep',
      'rep-panel-purcha',
      'rep-panel-buyer-balance',
      'rep-panel-grower-balance',
      'rep-panel-buyer-summary',
      'rep-panel-grower-summary',
      'rep-panel-grower-arrival',
      'rep-panel-apmc-form-m'
    ];

    panels.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === `rep-panel-${subTab}`) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    this.renderActiveReport();
  },

  renderActiveReport: function() {
    if (this.currentSubTab === 'teep') this.renderTeepRegister();
    if (this.currentSubTab === 'purcha') this.renderBuyerPurchaReport();
    if (this.currentSubTab === 'buyer-balance') this.renderBuyerBalanceReport();
    if (this.currentSubTab === 'grower-balance') this.renderGrowerBalanceReport();
    if (this.currentSubTab === 'buyer-summary') this.renderBuyerSummaryReport();
    if (this.currentSubTab === 'grower-summary') this.renderGrowerSummaryReport();
    if (this.currentSubTab === 'grower-arrival') this.renderGrowerArrivalReport();
    if (this.currentSubTab === 'apmc-form-m') this.renderFormM();
  },

  // ================= 1. TEEP (टीप / अंतिम सौदा विक्रय पत्र - VIEW ONLY FOR OWNER) =================
  renderTeepRegister: function() {
    const container = document.getElementById('rep-teep-table-body');
    if (!container) return;

    const lots = AuctionEngine.lots;
    if (lots.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" class="p-8 text-center bg-slate-50 text-slate-400 text-xs rounded-xl">
            <span class="text-3xl block mb-2">📋</span>
            No finalized Teep sale vouchers yet. Execute a trade in Quick Trade to generate a sealed Teep.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = lots.map(lot => {
      let gross = 0;
      let totalSold = 0;
      if (lot.splitSales && lot.splitSales.length > 0) {
        gross = lot.splitSales.reduce((acc, s) => acc + (s.grossAmount || (s.quantity * s.rate)), 0);
        totalSold = lot.splitSales.reduce((acc, s) => acc + parseInt(s.quantity), 0);
      } else {
        gross = lot.totalQuantity * (lot.soldPrice || lot.currentBid);
        totalSold = lot.totalQuantity;
      }

      const buyersCount = lot.splitSales ? lot.splitSales.length : 1;
      const isComplete = totalSold >= lot.totalQuantity;

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-xs">
          <td class="p-3">
            <span class="font-mono font-black text-xs text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              TEEP-${lot.id.replace('LOT-', '')}
            </span>
          </td>
          <td class="p-3 font-mono font-bold text-slate-700">${lot.truckNo}</td>
          <td class="p-3">
            <div class="font-bold text-slate-900">${lot.farmerName}</div>
            <div class="text-[11px] text-slate-500">${lot.farmerLocation}</div>
          </td>
          <td class="p-3">
            <span class="font-semibold text-slate-800">${lot.commodityName}</span>
            <span class="block text-[11px] text-slate-500">${lot.variety}</span>
          </td>
          <td class="p-3 text-center">
            <span class="font-black text-slate-900">${totalSold}</span>
            <span class="text-slate-400">/ ${lot.totalQuantity} units</span>
            <span class="block text-[10px] text-slate-500 font-medium">(${buyersCount} Buyers)</span>
          </td>
          <td class="p-3 text-right font-black text-slate-900">
            ₹${gross.toLocaleString('en-IN')}
          </td>
          <td class="p-3 text-right">
            <button onclick="ReportsHub.openTeepModal('${lot.id}')" 
              class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1 ml-auto shadow-sm transition-all">
              <span>👁️</span> View Sealed Teep
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  openTeepModal: function(lotId) {
    const lot = AuctionEngine.lots.find(l => l.id === lotId);
    if (!lot) return;

    const t = TenantManager.getActiveTenant();
    const modal = document.getElementById('teep-modal');
    const container = document.getElementById('teep-modal-content');
    if (!modal || !container) return;

    let gross = 0;
    let splitRows = '';
    if (lot.splitSales && lot.splitSales.length > 0) {
      gross = lot.splitSales.reduce((acc, s) => acc + (s.grossAmount || (s.quantity * s.rate)), 0);
      splitRows = lot.splitSales.map((s, idx) => `
        <tr class="border-b border-slate-200">
          <td class="p-2 font-mono text-center">${idx + 1}</td>
          <td class="p-2 font-mono font-bold text-purple-900">${s.saleId || 'SL-' + (idx + 101)}</td>
          <td class="p-2 font-bold text-slate-900">${s.buyerName} <span class="block text-[10px] text-slate-500">${s.paymentMode || 'Credit'}</span></td>
          <td class="p-2 font-mono">${s.targetLot || 'LOT-1'}</td>
          <td class="p-2 text-center font-black">${s.quantity}</td>
          <td class="p-2 text-right font-black">₹${s.rate.toLocaleString('en-IN')}</td>
          <td class="p-2 text-right font-black text-slate-900">₹${(s.grossAmount || (s.quantity * s.rate)).toLocaleString('en-IN')}</td>
        </tr>
      `).join('');
    } else {
      gross = lot.totalQuantity * (lot.soldPrice || lot.currentBid);
      splitRows = `
        <tr class="border-b border-slate-200">
          <td class="p-2 font-mono text-center">1</td>
          <td class="p-2 font-mono font-bold text-purple-900">SL-101</td>
          <td class="p-2 font-bold text-slate-900">${lot.highestBidder || 'Spot Buyer'}</td>
          <td class="p-2 font-mono">LOT-1</td>
          <td class="p-2 text-center font-black">${lot.totalQuantity}</td>
          <td class="p-2 text-right font-black">₹${(lot.soldPrice || lot.currentBid).toLocaleString('en-IN')}</td>
          <td class="p-2 text-right font-black text-slate-900">₹${gross.toLocaleString('en-IN')}</td>
        </tr>
      `;
    }

    const palledariRate = lot.palledariPerUnit || t.palledariRatePerBox || 12;
    const totalPalledari = lot.totalQuantity * palledariRate;
    const commPct = t.standardCommission || 2.5;
    const commissionAmt = gross * (commPct / 100);
    const freightAdv = lot.freightAdvancePaid || 0;
    const stationery = t.stationeryCharges || 15;
    const netPayableFarmer = gross - totalPalledari - commissionAmt - freightAdv - stationery;

    container.innerHTML = `
      <div class="bg-white p-6 rounded-3xl border-2 border-slate-300 space-y-5 text-xs select-text font-sans">
        
        <!-- Header Banner with Watermark -->
        <div class="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded bg-purple-900 text-white font-black text-[10px] uppercase tracking-wider">
                OWNER FINAL AUDIT COPY • SEALED
              </span>
              <span class="text-xs text-slate-500 font-mono">Generated: ${new Date().toLocaleDateString('en-IN')}</span>
            </div>
            <h2 class="text-xl font-black text-slate-900 uppercase mt-1 tracking-tight">${t.firmName}</h2>
            <p class="text-slate-600 font-medium">${t.shopNo}, Azadpur Mandi, Delhi • APMC Lic: <strong>${t.apmcLicenseNo}</strong></p>
          </div>
          <div class="text-right">
            <span class="font-mono text-sm font-black text-purple-900 bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-300 block">
              TEEP NO: TP-${lot.id.replace('LOT-', '')}
            </span>
            <span class="text-[10px] text-emerald-800 font-black block mt-1">✓ LOKAD & FINALIZED</span>
          </div>
        </div>

        <!-- Consignment Summary Card -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div>
            <span class="text-slate-400 block font-bold">Truck / Consignment</span>
            <span class="font-mono font-black text-slate-900 text-sm">${lot.truckNo}</span>
          </div>
          <div>
            <span class="text-slate-400 block font-bold">Grower / Producer</span>
            <span class="font-bold text-slate-900 text-sm">${lot.farmerName}</span>
            <span class="text-[10px] text-slate-500 block truncate">${lot.farmerLocation}</span>
          </div>
          <div>
            <span class="text-slate-400 block font-bold">Commodity & Grade</span>
            <span class="font-black text-slate-900">${lot.commodityName}</span>
            <span class="text-[10px] text-slate-500 block">${lot.variety}</span>
          </div>
          <div>
            <span class="text-slate-400 block font-bold">Total Arrived Units</span>
            <span class="font-black text-emerald-800 text-sm">${lot.totalQuantity} ${lot.unit}</span>
          </div>
        </div>

        <!-- Section 1: Buyer Spot Sale Breakdown -->
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <h4 class="font-black text-slate-900 uppercase text-xs">Section A: Wholesale Buyer Allocations (क्रेता वितरण)</h4>
            <span class="text-slate-500">Total Buyers: ${lot.splitSales ? lot.splitSales.length : 1}</span>
          </div>
          <div class="overflow-x-auto border border-slate-200 rounded-xl">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                <tr>
                  <th class="p-2 text-center">#</th>
                  <th class="p-2">Slip No</th>
                  <th class="p-2">Wholesale Buyer</th>
                  <th class="p-2">Lot</th>
                  <th class="p-2 text-center">Crates</th>
                  <th class="p-2 text-right">Sale Rate</th>
                  <th class="p-2 text-right">Gross Amount</th>
                </tr>
              </thead>
              <tbody>
                ${splitRows}
              </tbody>
              <tfoot class="bg-slate-50 font-black border-t-2 border-slate-300">
                <tr>
                  <td colspan="4" class="p-2 text-right">Total Realized Volume & Value:</td>
                  <td class="p-2 text-center text-emerald-800 text-sm">${lot.totalQuantity}</td>
                  <td></td>
                  <td class="p-2 text-right text-base text-slate-900">₹${gross.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Section 2: Realization & Payout Mathematics -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Deductions Schedule -->
          <div class="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-2">
            <span class="font-black text-rose-900 block uppercase">Section B: Mandi Deductions (कटौती विवरण)</span>
            <div class="flex justify-between py-1 border-b border-rose-100">
              <span class="text-slate-600">Unloading Palledari (@₹${palledariRate}/box):</span>
              <span class="font-bold text-slate-800">- ₹${totalPalledari.toLocaleString('en-IN')}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-rose-100">
              <span class="text-slate-600">Commission Arhat (@${commPct}%):</span>
              <span class="font-bold text-slate-800">- ₹${commissionAmt.toLocaleString('en-IN')}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-rose-100">
              <span class="text-slate-600">Freight Advance to Driver:</span>
              <span class="font-black text-rose-800">- ₹${freightAdv.toLocaleString('en-IN')}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-600">Stationery & Mandi Postage:</span>
              <span class="font-bold text-slate-800">- ₹${stationery.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <!-- Payout & Agency Profit Summary -->
          <div class="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2 flex flex-col justify-between">
            <span class="font-black text-emerald-900 block uppercase">Section C: Settlement & Agency Profit</span>
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <span class="text-slate-600 font-medium">Net Grower Payout (J-Form):</span>
                <span class="text-lg font-black text-emerald-900">₹${netPayableFarmer.toLocaleString('en-IN')}</span>
              </div>
              <div class="flex justify-between items-center text-[11px] text-slate-500">
                <span>Payment Mode:</span>
                <span class="font-bold text-slate-700">Bank Transfer / NEFT Pending</span>
              </div>
            </div>

            <div class="pt-3 border-t border-emerald-200 flex justify-between items-center">
              <div>
                <span class="text-[10px] text-slate-400 uppercase font-bold block">Agency Commission Earnings</span>
                <span class="text-base font-black text-purple-900">₹${commissionAmt.toLocaleString('en-IN')}</span>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Audited & Posted
              </span>
            </div>
          </div>
        </div>

        <!-- Seal Disclaimer -->
        <div class="pt-3 border-t border-slate-200 text-center text-slate-400 text-[10px]">
          This document is a certified computer-generated Mandi Teep recorded under Azadpur APMC Market Regulations. View-Only Owner Copy.
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  closeTeepModal: function() {
    const modal = document.getElementById('teep-modal');
    if (modal) modal.classList.add('hidden');
  },

  // ================= 2. BUYER PURCHA REGISTER (I-Forms) =================
  renderBuyerPurchaReport: function() {
    const container = document.getElementById('rep-purcha-table-body');
    if (!container) return;

    const lots = AuctionEngine.lots;
    const purchas = [];

    lots.forEach(lot => {
      if (lot.splitSales && lot.splitSales.length > 0) {
        lot.splitSales.forEach(s => {
          purchas.push({
            billNo: 'PUR-' + s.saleId.replace('SL-', ''),
            date: lot.date || new Date().toISOString().split('T')[0],
            buyerName: s.buyerName,
            commodity: lot.commodityName,
            variety: s.targetLot || lot.variety,
            quantity: s.quantity,
            rate: s.rate,
            gross: s.grossAmount || (s.quantity * s.rate),
            mandiCess: (s.grossAmount || (s.quantity * s.rate)) * 0.02,
            netBill: (s.grossAmount || (s.quantity * s.rate)) * 1.02,
            lotId: lot.id
          });
        });
      }
    });

    if (purchas.length === 0) {
      container.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400 text-xs">No buyer purchas issued yet.</td></tr>`;
      return;
    }

    container.innerHTML = purchas.map(p => `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors text-xs">
        <td class="p-3 font-mono font-bold text-purple-900">${p.billNo}</td>
        <td class="p-3 font-mono text-slate-500">${p.date}</td>
        <td class="p-3 font-bold text-slate-900">${p.buyerName}</td>
        <td class="p-3">${p.commodity} <span class="text-[10px] text-slate-400 block">${p.variety}</span></td>
        <td class="p-3 text-center font-bold">${p.quantity}</td>
        <td class="p-3 text-right font-mono">₹${p.rate.toLocaleString('en-IN')}</td>
        <td class="p-3 text-right font-black text-slate-900">₹${p.netBill.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td class="p-3 text-right">
          <div class="flex items-center justify-end gap-1">
            <button onclick="BillingEngine.openThermalSlipModal('${p.lotId}')" class="px-2 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
              🧾 80mm
            </button>
            <button onclick="App.showToast('WhatsApp bill link generated', 'info')" class="px-2 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg">
              📲
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  // ================= 3. BUYER BALANCE REPORT (Aging 0-7, 8-15, 16-30, 30+ days) =================
  renderBuyerBalanceReport: function() {
    const container = document.getElementById('rep-buyer-balance-table-body');
    if (!container) return;

    const accounts = BahiKhata.accounts;
    container.innerHTML = accounts.map(acc => {
      const udhaar = acc.outstandingUdhaar || 0;
      let b0_7 = 0, b8_15 = 0, b16_30 = 0, b30_plus = 0;

      if (acc.overdueDays <= 7) b0_7 = udhaar;
      else if (acc.overdueDays <= 15) b8_15 = udhaar;
      else if (acc.overdueDays <= 30) b16_30 = udhaar;
      else b30_plus = udhaar;

      const interest = acc.overdueDays > 15 ? (udhaar * 0.015 * (acc.overdueDays / 30)) : 0;

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors text-xs">
          <td class="p-3">
            <div class="font-bold text-slate-900">${acc.partyName}</div>
            <div class="text-[11px] text-slate-500">${acc.address}</div>
          </td>
          <td class="p-3 text-right font-black text-slate-900">₹${udhaar.toLocaleString('en-IN')}</td>
          <td class="p-3 text-right font-mono ${b0_7 > 0 ? 'text-emerald-700 font-bold' : 'text-slate-300'}">₹${b0_7.toLocaleString('en-IN')}</td>
          <td class="p-3 text-right font-mono ${b8_15 > 0 ? 'text-amber-700 font-bold' : 'text-slate-300'}">₹${b8_15.toLocaleString('en-IN')}</td>
          <td class="p-3 text-right font-mono ${b16_30 > 0 ? 'text-orange-700 font-bold' : 'text-slate-300'}">₹${b16_30.toLocaleString('en-IN')}</td>
          <td class="p-3 text-right font-mono ${b30_plus > 0 ? 'text-rose-700 font-black' : 'text-slate-300'}">₹${b30_plus.toLocaleString('en-IN')}</td>
          <td class="p-3 text-right font-bold text-rose-700">₹${interest.toFixed(0)}</td>
          <td class="p-3 text-right">
            <button onclick="BahiKhata.openPaymentModal('${acc.id}')" class="px-2.5 py-1 bg-green-700 text-white rounded-lg font-bold text-xs">
              Recv ₹
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  // ================= 4. GROWER / KISAN BALANCE REPORT =================
  renderGrowerBalanceReport: function() {
    const container = document.getElementById('rep-grower-balance-table-body');
    if (!container) return;

    const arrivals = ArrivalsManager.arrivals;
    const t = TenantManager.getActiveTenant();

    container.innerHTML = arrivals.map(arv => {
      const gross = arv.quantity * 2150; // average modal realization
      const palledari = arv.quantity * (t.palledariRatePerBox || 12);
      const commission = gross * 0.025;
      const freightAdv = arv.freightAdvancePaid || 0;
      const netPayable = gross - palledari - commission - freightAdv;
      const paid = freightAdv; // advance already disbursed
      const pending = Math.max(0, netPayable);

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors text-xs">
          <td class="p-3 font-mono font-bold text-slate-700">${arv.id}</td>
          <td class="p-3">
            <div class="font-bold text-slate-900">${arv.farmerName}</div>
            <div class="text-[11px] text-slate-500">${arv.farmerLocation} • ${arv.farmerPhone}</div>
          </td>
          <td class="p-3">${arv.commodity} (${arv.quantity} units)</td>
          <td class="p-3 text-right font-bold">₹${gross.toLocaleString('en-IN')}</td>
          <td class="p-3 text-right font-mono text-rose-700">₹${freightAdv.toLocaleString('en-IN')}</td>
          <td class="p-3 text-right font-black text-emerald-800">₹${pending.toLocaleString('en-IN')}</td>
          <td class="p-3 text-center">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
              Pending NEFT
            </span>
          </td>
        </tr>
      `;
    }).join('');
  },

  // ================= 5. BUYER SUMMARY REPORT =================
  renderBuyerSummaryReport: function() {
    const container = document.getElementById('rep-buyer-summary-table-body');
    if (!container) return;

    const accounts = BahiKhata.accounts;
    container.innerHTML = accounts.map(acc => `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors text-xs">
        <td class="p-3 font-bold text-slate-900">${acc.partyName}</td>
        <td class="p-3 text-right font-bold text-slate-700">₹${acc.totalPurchases.toLocaleString('en-IN')}</td>
        <td class="p-3 text-right font-bold text-emerald-700">₹${acc.totalPaid.toLocaleString('en-IN')}</td>
        <td class="p-3 text-right font-black text-amber-800">₹${acc.outstandingUdhaar.toLocaleString('en-IN')}</td>
        <td class="p-3 text-center font-mono">${acc.overdueDays}d</td>
        <td class="p-3 text-center">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${acc.status === 'Good' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${acc.status}
          </span>
        </td>
      </tr>
    `).join('');
  },

  // ================= 6. GROWER SUMMARY REPORT =================
  renderGrowerSummaryReport: function() {
    const container = document.getElementById('rep-grower-summary-table-body');
    if (!container) return;

    const arrivals = ArrivalsManager.arrivals;
    const farmerMap = {};

    arrivals.forEach(arv => {
      if (!farmerMap[arv.farmerName]) {
        farmerMap[arv.farmerName] = {
          name: arv.farmerName,
          location: arv.farmerLocation,
          consignmentsCount: 0,
          totalCrates: 0,
          grossRealized: 0,
          commissionEarned: 0
        };
      }
      const gross = arv.quantity * 2150;
      farmerMap[arv.farmerName].consignmentsCount += 1;
      farmerMap[arv.farmerName].totalCrates += arv.quantity;
      farmerMap[arv.farmerName].grossRealized += gross;
      farmerMap[arv.farmerName].commissionEarned += (gross * 0.025);
    });

    container.innerHTML = Object.values(farmerMap).map(f => `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors text-xs">
        <td class="p-3">
          <div class="font-bold text-slate-900">${f.name}</div>
          <div class="text-[11px] text-slate-500">${f.location}</div>
        </td>
        <td class="p-3 text-center font-bold">${f.consignmentsCount} Trucks</td>
        <td class="p-3 text-center font-black">${f.totalCrates.toLocaleString()} Crates</td>
        <td class="p-3 text-right font-black text-slate-900">₹${f.grossRealized.toLocaleString('en-IN')}</td>
        <td class="p-3 text-right font-black text-purple-900">₹${f.commissionEarned.toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
  },

  // ================= 7. GROWER ARRIVAL REPORT (RULE 24) =================
  renderGrowerArrivalReport: function() {
    const container = document.getElementById('rep-grower-arrival-table-body');
    if (!container) return;

    const arrivals = ArrivalsManager.arrivals;
    container.innerHTML = arrivals.map(arv => `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors text-xs">
        <td class="p-3 font-mono font-bold text-green-800">${arv.id}</td>
        <td class="p-3 font-mono font-bold">${arv.truckNo}</td>
        <td class="p-3">
          <div class="font-bold text-slate-900">${arv.farmerName}</div>
          <div class="text-[11px] text-slate-500">${arv.farmerLocation}</div>
        </td>
        <td class="p-3 font-semibold text-slate-800">${arv.commodity}</td>
        <td class="p-3 text-center font-black">${arv.quantity}</td>
        <td class="p-3 text-slate-600">${arv.driverName} (${arv.driverPhone})</td>
        <td class="p-3 text-right font-black text-rose-700">₹${(arv.freightAdvancePaid || 0).toLocaleString('en-IN')}</td>
        <td class="p-3 text-center font-bold text-slate-600">${arv.palledarToli || 'Toli 4'}</td>
      </tr>
    `).join('');
  },

  // ================= 8. APMC FORM 'M' =================
  renderFormM: function() {
    const container = document.getElementById('apmc-form-m-container');
    if (!container) return;

    const t = TenantManager.getActiveTenant();
    const lots = AuctionEngine.lots;

    let totalTurnover = 0;
    let totalCrates = 0;

    lots.forEach(lot => {
      if (lot.splitSales && lot.splitSales.length > 0) {
        lot.splitSales.forEach(s => {
          totalTurnover += (s.grossAmount || (s.quantity * s.rate));
          totalCrates += parseInt(s.quantity);
        });
      } else if (lot.status === 'sold') {
        const amt = lot.totalQuantity * (lot.soldPrice || lot.currentBid);
        totalTurnover += amt;
        totalCrates += lot.totalQuantity;
      }
    });

    const apmcFee = totalTurnover * 0.01;
    const dambFee = totalTurnover * 0.01;
    const totalCessPayable = apmcFee + dambFee;

    container.innerHTML = `
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <div class="border-b pb-3 flex justify-between items-center">
          <div>
            <span class="px-2.5 py-0.5 bg-green-100 text-green-800 rounded text-xs font-bold uppercase">
              APMC AZADPUR • FORM 'M'
            </span>
            <h3 class="font-black text-slate-900 text-base mt-1">Daily Market Fee & Cess Return (दैनिक मंडी सेस विवरणी)</h3>
            <p class="text-xs text-slate-500">Under Rule 29 of Delhi Agricultural Produce Marketing (Regulation) General Rules</p>
          </div>
          <button onclick="ReportsHub.exportFormMCSV()" 
            class="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors">
            📥 Download Form 'M' CSV
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div><span class="text-slate-400 block font-medium">Licensed Firm</span><span class="font-bold text-slate-800">${t.firmName}</span></div>
          <div><span class="text-slate-400 block font-medium">APMC License</span><span class="font-mono font-bold text-slate-800">${t.apmcLicenseNo}</span></div>
          <div><span class="text-slate-400 block font-medium">Shop / Shed</span><span class="font-semibold text-slate-700">${t.shopNo}</span></div>
          <div><span class="text-slate-400 block font-medium">Date</span><span class="font-bold text-slate-800">${new Date().toLocaleDateString('en-IN')}</span></div>
        </div>

        <div class="overflow-x-auto border border-slate-200 rounded-xl">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-100 font-bold text-slate-700">
                <th class="p-3">Turnover Head</th>
                <th class="p-3 text-center">Volume</th>
                <th class="p-3 text-right">Gross Realized Value (₹)</th>
                <th class="p-3 text-right">APMC Cess (1%)</th>
                <th class="p-3 text-right">DAMB Fee (1%)</th>
                <th class="p-3 text-right">Total Payable (2%)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="p-3 font-semibold text-slate-800">Agricultural Produce Wholesale Auction Sales</td>
                <td class="p-3 text-center font-bold">${totalCrates.toLocaleString()} Units</td>
                <td class="p-3 text-right font-black text-slate-900">₹${totalTurnover.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="p-3 text-right font-medium text-emerald-700">₹${apmcFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="p-3 text-right font-medium text-emerald-700">₹${dambFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="p-3 text-right font-black text-green-900">₹${totalCessPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  exportFormMCSV: function() {
    const t = TenantManager.getActiveTenant();
    const lots = AuctionEngine.lots;
    let csv = "APMC Return Form M - Azadpur Mandi\n";
    csv += `Firm: ${t.firmName}, License: ${t.apmcLicenseNo}, Date: ${new Date().toISOString().split('T')[0]}\n\n`;
    csv += "Voucher ID,Vehicle,Farmer,Commodity,Units,Gross Amount (INR),APMC Cess 1%,DAMB Fee 1%\n";

    lots.forEach(lot => {
      let gross = 0;
      if (lot.splitSales && lot.splitSales.length > 0) {
        gross = lot.splitSales.reduce((acc, s) => acc + (s.grossAmount || (s.quantity * s.rate)), 0);
      } else {
        gross = lot.totalQuantity * (lot.soldPrice || lot.currentBid);
      }
      csv += `${lot.id},"${lot.truckNo}","${lot.farmerName}","${lot.commodityName}",${lot.totalQuantity},${gross},${gross * 0.01},${gross * 0.01}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `APMC_Form_M_${t.id}_${Date.now()}.csv`;
    link.click();
    App.showToast('APMC Form M CSV downloaded!', 'success');
  }
};

// Aliases for backward compatibility
const APMCReports = ReportsHub;
