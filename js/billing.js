/**
 * White-Labeled Statutory Billing Engine (Thermal 80mm POS Slip & Standard A4/A5)
 */

const BillingEngine = {
  currentModalView: 'thermal', // 'thermal' or 'a4'
  activeLotId: null,

  openJFormModal: function(lotId) {
    this.activeLotId = lotId;
    this.renderJForm();
    document.getElementById('invoice-modal').classList.remove('hidden');
  },

  openThermalSlipModal: function(lotId) {
    this.activeLotId = lotId;
    this.currentModalView = 'thermal';
    this.renderBuyerThermalSlip();
    document.getElementById('invoice-modal').classList.remove('hidden');
  },

  setModalViewFormat: function(format) {
    this.currentModalView = format;
    const btnThermal = document.getElementById('btn-format-thermal');
    const btnA4 = document.getElementById('btn-format-a4');

    if (format === 'thermal') {
      btnThermal?.classList.add('bg-slate-900', 'text-white');
      btnThermal?.classList.remove('bg-slate-100', 'text-slate-700');
      btnA4?.classList.remove('bg-slate-900', 'text-white');
      btnA4?.classList.add('bg-slate-100', 'text-slate-700');
    } else {
      btnA4?.classList.add('bg-slate-900', 'text-white');
      btnA4?.classList.remove('bg-slate-100', 'text-slate-700');
      btnThermal?.classList.remove('bg-slate-900', 'text-white');
      btnThermal?.classList.add('bg-slate-100', 'text-slate-700');
    }

    this.renderJForm();
  },

  renderJForm: function() {
    const lotId = this.activeLotId;
    const lot = AuctionEngine.lots.find(l => l.id === lotId) || MandiData.initialLots.find(l => l.id === lotId);
    if (!lot) return;

    const t = TenantManager.getActiveTenant();
    const container = document.getElementById('invoice-render-area');
    if (!container) return;

    // Calculate total gross realized across split sales or base price
    let grossAmount = 0;
    if (lot.splitSales && lot.splitSales.length > 0) {
      grossAmount = lot.splitSales.reduce((acc, s) => acc + (s.grossAmount || (s.quantity * s.rate)), 0);
    } else {
      grossAmount = lot.totalQuantity * (lot.soldPrice || lot.currentBid);
    }

    const palledariRate = lot.palledariPerUnit || t.palledariRatePerBox || 12;
    const totalPalledari = lot.totalQuantity * palledariRate;
    const commissionPct = t.standardCommission || 2.5;
    const arhatCommission = (grossAmount * (commissionPct / 100));
    const freightAdvance = lot.freightAdvancePaid || 0;
    const stationery = t.stationeryCharges || 15;
    const netFarmerPayable = grossAmount - totalPalledari - arhatCommission - freightAdvance - stationery;

    if (this.currentModalView === 'thermal') {
      // 80mm Thermal Receipt Layout
      container.innerHTML = `
        <div class="thermal-print-area bg-white p-5 border-2 border-dashed border-slate-400 font-mono text-xs text-slate-900 max-w-[320px] mx-auto shadow-md" id="print-container">
          <!-- Firm Letterhead -->
          <div class="text-center pb-2 border-b-2 border-dashed border-slate-400">
            <span class="text-xl">${t.logoIcon || '🍎'}</span>
            <h3 class="font-black text-sm uppercase tracking-wider">${t.firmName}</h3>
            <p class="text-[10px] text-slate-600">${t.shopNo}</p>
            <p class="text-[10px] text-slate-600">${t.mandiName}</p>
            <p class="text-[10px] font-bold">APMC Lic: ${t.apmcLicenseNo} • Ph: ${t.phone}</p>
            <div class="inline-block mt-1 px-2.5 py-0.5 bg-slate-900 text-white text-[9px] font-black tracking-widest rounded">
              FORM 'J' • FARMER SALE SLIP
            </div>
          </div>

          <!-- Metadata -->
          <div class="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
            <div class="flex justify-between"><span>Voucher: J-${lot.id.replace('LOT-', '')}</span><span>Date: ${new Date().toLocaleDateString('en-IN')}</span></div>
            <div class="flex justify-between"><span>Farmer: <strong>${lot.farmerName}</strong></span></div>
            <div class="flex justify-between text-slate-500"><span>Origin: ${lot.farmerLocation}</span></div>
            <div class="flex justify-between text-slate-500"><span>Vehicle: ${lot.truckNo}</span></div>
          </div>

          <!-- Commodity -->
          <div class="py-2 border-b border-dashed border-slate-400">
            <table class="w-full text-[10px]">
              <thead>
                <tr class="text-slate-500 border-b border-dashed border-slate-300 pb-1">
                  <th class="text-left">Particulars</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Gross (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="pt-1.5 font-bold">${lot.commodityName}<span class="block text-[8px] font-normal text-slate-500">${lot.variety}</span></td>
                  <td class="text-center pt-1.5 font-bold">${lot.totalQuantity}</td>
                  <td class="text-right pt-1.5 font-bold">₹${grossAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Deductions -->
          <div class="py-2 border-b-2 border-dashed border-slate-400 text-[10px] space-y-1">
            <div class="flex justify-between">
              <span>Gross Realized:</span>
              <span>₹${grossAmount.toLocaleString('en-IN')}</span>
            </div>
            <div class="flex justify-between text-rose-700">
              <span>Less: Unloading Palledari (@₹${palledariRate}):</span>
              <span>- ₹${totalPalledari.toLocaleString('en-IN')}</span>
            </div>
            <div class="flex justify-between text-rose-700">
              <span>Less: Arhat Commission (${commissionPct}%):</span>
              <span>- ₹${arhatCommission.toLocaleString('en-IN')}</span>
            </div>
            ${freightAdvance > 0 ? `
              <div class="flex justify-between text-rose-700 font-bold">
                <span>Less: Truck Freight Advance (भाड़ा):</span>
                <span>- ₹${freightAdvance.toLocaleString('en-IN')}</span>
              </div>
            ` : ''}
            <div class="flex justify-between text-slate-600">
              <span>Less: Stationery / Post:</span>
              <span>- ₹${stationery}</span>
            </div>
            <div class="border-t border-dashed border-slate-400 pt-1.5 flex justify-between font-black text-xs text-green-900">
              <span>NET PAYABLE TO KISAN:</span>
              <span>₹${netFarmerPayable.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <!-- Terms & Footer -->
          <div class="pt-2 text-center text-[8px] text-slate-500 space-y-1">
            <p class="whitespace-pre-line">${t.billDisclaimer}</p>
            <div class="pt-3 flex justify-between text-[9px] font-bold">
              <span>Farmer Sig.</span>
              <span>For ${t.firmName}</span>
            </div>
          </div>
        </div>
      `;
    } else {
      // Standard A4 / A5 Layout
      container.innerHTML = `
        <div class="a4-print-area p-8 rounded-2xl bg-white border border-slate-300 max-w-2xl mx-auto text-slate-800 shadow-sm" id="print-container">
          <div class="border-b-2 border-slate-900 pb-4 text-center">
            <span class="text-2xl">${t.logoIcon || '🌾'}</span>
            <h2 class="text-xl font-black text-slate-900 tracking-wide uppercase">${t.firmName}</h2>
            <p class="text-xs text-slate-600 font-medium">${t.shopNo}, ${t.mandiName}</p>
            <p class="text-xs text-slate-600 font-medium">APMC Lic: ${t.apmcLicenseNo} • GSTIN: ${t.gstin} • Ph: ${t.phone}</p>
            <div class="mt-2 inline-block px-3 py-1 bg-green-800 text-white font-bold text-xs rounded-full uppercase">
              APMC FORM 'J' • FARMER SALE VOUCHER
            </div>
            <div class="mt-2 flex justify-between text-xs font-mono text-slate-500 border-t border-slate-200 pt-2">
              <span><strong>Book Voucher No:</strong> J-${lot.id.replace('LOT-', '')}</span>
              <span><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          <!-- Parties Info -->
          <div class="grid grid-cols-2 gap-4 py-3 text-xs border-b border-slate-200">
            <div>
              <span class="text-slate-400 block uppercase font-bold text-[10px]">Seller / Producer Details</span>
              <p class="font-bold text-slate-800 text-sm">${lot.farmerName}</p>
              <p class="text-slate-600">${lot.farmerLocation}</p>
              <p class="text-slate-500">Ph: ${lot.farmerPhone}</p>
            </div>
            <div class="text-right">
              <span class="text-slate-400 block uppercase font-bold text-[10px]">Consignment Vehicle</span>
              <p class="font-mono font-bold text-slate-800 text-sm">${lot.truckNo}</p>
              <p class="text-slate-500">Unloaded at: ${t.shopNo}</p>
              <p class="text-slate-500">Palledari Gang: Raju Toli No. 4</p>
            </div>
          </div>

          <!-- Table -->
          <div class="py-3">
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="border-b border-slate-300 font-bold text-slate-700 bg-slate-50">
                  <th class="p-2">Commodity Description</th>
                  <th class="p-2 text-center">Quantity</th>
                  <th class="p-2 text-right">Gross Realized (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-slate-100">
                  <td class="p-2 font-semibold">
                    ${lot.commodityName}
                    <span class="block text-[10px] text-slate-500 font-normal">${lot.variety} (${lot.grade})</span>
                  </td>
                  <td class="p-2 text-center font-bold">${lot.totalQuantity} ${lot.unit.split(' ')[0]}</td>
                  <td class="p-2 text-right font-black text-slate-900">₹${grossAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Detailed Deductions -->
          <div class="border-t border-slate-200 pt-3 pb-3 text-xs space-y-1.5 bg-slate-50 p-4 rounded-xl">
            <div class="flex justify-between text-slate-600">
              <span>Gross Sale Value:</span>
              <span class="font-semibold text-slate-800">₹${grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="flex justify-between text-rose-600">
              <span>Less: Unloading Palledari (@₹${palledariRate}/${lot.unit.split(' ')[0]}):</span>
              <span class="font-semibold">- ₹${totalPalledari.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="flex justify-between text-rose-600">
              <span>Less: Statutory Arhat Commission (${commissionPct}%):</span>
              <span class="font-semibold">- ₹${arhatCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            ${freightAdvance > 0 ? `
              <div class="flex justify-between text-rose-700 font-bold">
                <span>Less: Truck Freight Advance Paid to Driver:</span>
                <span>- ₹${freightAdvance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            ` : ''}
            <div class="flex justify-between text-slate-600">
              <span>Less: Stationery & Handling:</span>
              <span class="font-semibold">- ₹${stationery.toFixed(2)}</span>
            </div>
            <div class="border-t-2 border-slate-300 pt-2 flex justify-between text-sm font-black text-green-900">
              <span>NET AMOUNT PAYABLE TO FARMER:</span>
              <span>₹${netFarmerPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <!-- Footer & Signatures -->
          <div class="pt-6 flex justify-between items-end text-[11px] text-slate-500">
            <div class="text-center">
              <div class="w-32 border-b border-slate-400 mb-1"></div>
              <span>Farmer / Producer Signature</span>
            </div>
            <div class="text-center text-[10px]">
              <p class="whitespace-pre-line text-slate-400">${t.billDisclaimer}</p>
            </div>
            <div class="text-center">
              <div class="w-32 border-b border-slate-400 mb-1 ml-auto"></div>
              <span>For ${t.firmName}</span>
            </div>
          </div>
        </div>
      `;
    }
  },

  renderBuyerThermalSlip: function() {
    const lotId = this.activeLotId;
    const lot = AuctionEngine.lots.find(l => l.id === lotId) || MandiData.initialLots.find(l => l.id === lotId);
    if (!lot) return;

    const t = TenantManager.getActiveTenant();
    const container = document.getElementById('invoice-render-area');
    if (!container) return;

    const sale = (lot.splitSales && lot.splitSales.length > 0) ? lot.splitSales[0] : {
      buyerName: lot.soldTo || 'Aggarwal Wholesale Mart',
      quantity: lot.totalQuantity,
      rate: lot.soldPrice || lot.currentBid,
      grossAmount: lot.totalQuantity * (lot.soldPrice || lot.currentBid),
      time: '06:30 AM'
    };

    const apmcFee = (sale.grossAmount * 0.01);
    const dambFee = (sale.grossAmount * 0.01);
    const loadingCharge = sale.quantity * 8;
    const totalPayable = sale.grossAmount + apmcFee + dambFee + loadingCharge;

    container.innerHTML = `
      <div class="thermal-print-area bg-white p-5 border-2 border-dashed border-slate-400 font-mono text-xs text-slate-900 max-w-[320px] mx-auto shadow-md" id="print-container">
        <!-- Header -->
        <div class="text-center pb-2 border-b-2 border-dashed border-slate-400">
          <span class="text-xl">${t.logoIcon || '🏪'}</span>
          <h3 class="font-black text-sm uppercase tracking-wider">${t.firmName}</h3>
          <p class="text-[10px] text-slate-600">${t.shopNo}</p>
          <p class="text-[10px] text-slate-600">APMC Lic: ${t.apmcLicenseNo} • Ph: ${t.phone}</p>
          <div class="inline-block mt-1 px-2.5 py-0.5 bg-blue-900 text-white text-[9px] font-black tracking-widest rounded">
            FORM 'I' • BUYER INVOICE
          </div>
        </div>

        <!-- Info -->
        <div class="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
          <div class="flex justify-between"><span>Inv: I-${lot.id.replace('LOT-', '')}</span><span>Date: ${new Date().toLocaleDateString('en-IN')}</span></div>
          <div class="flex justify-between"><span>Buyer: <strong>${sale.buyerName}</strong></span></div>
        </div>

        <!-- Items -->
        <div class="py-2 border-b border-dashed border-slate-400">
          <table class="w-full text-[10px]">
            <thead>
              <tr class="text-slate-500 border-b border-dashed border-slate-300 pb-1">
                <th class="text-left">Item</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="pt-1.5 font-bold">${lot.commodityName}</td>
                <td class="text-center pt-1.5">${sale.quantity}</td>
                <td class="text-right pt-1.5">₹${sale.rate}</td>
                <td class="text-right pt-1.5 font-bold">₹${sale.grossAmount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Taxes & Fees -->
        <div class="py-2 border-b-2 border-dashed border-slate-400 text-[10px] space-y-1">
          <div class="flex justify-between"><span>Base Purchase:</span><span>₹${sale.grossAmount.toLocaleString('en-IN')}</span></div>
          <div class="flex justify-between text-blue-800"><span>APMC Mandi Cess (1%):</span><span>+ ₹${apmcFee.toFixed(2)}</span></div>
          <div class="flex justify-between text-blue-800"><span>DAMB Dev. Fee (1%):</span><span>+ ₹${dambFee.toFixed(2)}</span></div>
          <div class="flex justify-between text-slate-600"><span>Loading Palledari:</span><span>+ ₹${loadingCharge.toFixed(2)}</span></div>
          <div class="border-t border-dashed border-slate-400 pt-1.5 flex justify-between font-black text-xs text-blue-900">
            <span>TOTAL BUYER DUE:</span>
            <span>₹${totalPayable.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <!-- Dynamic Scan & Pay UPI QR -->
        <div class="pt-3 text-center">
          <div id="buyer-upi-qr" class="w-28 h-28 mx-auto bg-slate-50 border border-slate-300 p-1 flex items-center justify-center rounded"></div>
          <p class="text-[9px] font-bold text-slate-800 mt-1">Scan to Pay via UPI</p>
          <p class="text-[8px] text-slate-500 font-mono">${t.upiId}</p>
          <p class="text-[7px] text-slate-400 mt-2 whitespace-pre-line">${t.billDisclaimer}</p>
        </div>
      </div>
    `;

    // Render UPI QR Code using QRCode.js
    setTimeout(() => {
      const qrEl = document.getElementById('buyer-upi-qr');
      if (qrEl && typeof QRCode !== 'undefined') {
        qrEl.innerHTML = '';
        const upiUrl = `upi://pay?pa=${encodeURIComponent(t.upiId)}&pn=${encodeURIComponent(t.firmName)}&am=${totalPayable.toFixed(2)}&cu=INR&tn=Invoice%20I-${lot.id}`;
        new QRCode(qrEl, {
          text: upiUrl,
          width: 100,
          height: 100,
          colorDark: "#0f172a",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    }, 100);
  },

  renderArrivalThermalSlip: function(arv) {
    const t = TenantManager.getActiveTenant();
    const modal = document.getElementById('invoice-modal');
    const container = document.getElementById('invoice-render-area');
    if (!modal || !container) return;

    container.innerHTML = `
      <div class="thermal-print-area bg-white p-5 border-2 border-dashed border-slate-400 font-mono text-xs text-slate-900 max-w-[320px] mx-auto shadow-md" id="print-container">
        <div class="text-center pb-2 border-b-2 border-dashed border-slate-400">
          <span class="text-xl">${t.logoIcon || '🚚'}</span>
          <h3 class="font-black text-sm uppercase">${t.firmName}</h3>
          <p class="text-[10px] text-slate-600">${t.shopNo}</p>
          <div class="inline-block mt-1 px-2 py-0.5 bg-green-800 text-white text-[9px] font-bold rounded">
            GAADI AAWAK PARCHI (गाड़ी आवक)
          </div>
        </div>

        <div class="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-1">
          <div class="flex justify-between"><span>Voucher: ${arv.id}</span><span>Date: ${arv.date} ${arv.time}</span></div>
          <div class="flex justify-between"><span>Truck No: <strong>${arv.truckNo}</strong></span></div>
          <div class="flex justify-between"><span>Driver: ${arv.driverName} (${arv.driverPhone})</span></div>
          <div class="flex justify-between"><span>Farmer: ${arv.farmerName}</span></div>
          <div class="flex justify-between"><span>Commodity: ${arv.commodity}</span></div>
          <div class="flex justify-between font-bold"><span>Total Crates:</span><span>${arv.quantity} ${arv.unit}</span></div>
        </div>

        <div class="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-1">
          <div class="flex justify-between"><span>Total Freight:</span><span>₹${arv.totalFreight}</span></div>
          <div class="flex justify-between font-bold text-amber-800"><span>Advance Paid:</span><span>₹${arv.freightAdvancePaid}</span></div>
          <div class="flex justify-between text-rose-700"><span>Freight Due:</span><span>₹${arv.freightBalance}</span></div>
        </div>

        <div class="pt-4 flex justify-between text-[9px] font-bold">
          <span>Driver Signature</span>
          <span>Munshi Signature</span>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  closeInvoiceModal: function() {
    const modal = document.getElementById('invoice-modal');
    if (modal) modal.classList.add('hidden');
  },

  printInvoice: function() {
    window.print();
  }
};
