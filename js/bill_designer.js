/**
 * Custom Bill Format Designer & Dual Printer Engine (Thermal 80mm/58mm & Standard A4/A5)
 */

const BillDesigner = {
  currentFormat: 'thermal', // 'thermal' or 'a4'

  init: function() {
    const tenant = TenantManager.getActiveTenant();
    this.currentFormat = tenant.billFormat || 'thermal';
  },

  openDesignerModal: function() {
    const modal = document.getElementById('bill-designer-modal');
    if (!modal) return;

    const t = TenantManager.getActiveTenant();
    document.getElementById('designer-firm-name').value = t.firmName;
    document.getElementById('designer-shop-no').value = t.shopNo;
    document.getElementById('designer-apmc-lic').value = t.apmcLicenseNo;
    document.getElementById('designer-phone').value = t.phone;
    document.getElementById('designer-upi').value = t.upiId;
    document.getElementById('designer-default-format').value = t.billFormat || 'thermal';
    document.getElementById('designer-disclaimer').value = t.billDisclaimer || '';

    this.renderPreview();
    modal.classList.remove('hidden');
  },

  closeDesignerModal: function() {
    const modal = document.getElementById('bill-designer-modal');
    if (modal) modal.classList.add('hidden');
  },

  saveDesignerSettings: function() {
    const updated = {
      firmName: document.getElementById('designer-firm-name').value,
      shopNo: document.getElementById('designer-shop-no').value,
      apmcLicenseNo: document.getElementById('designer-apmc-lic').value,
      phone: document.getElementById('designer-phone').value,
      upiId: document.getElementById('designer-upi').value,
      billFormat: document.getElementById('designer-default-format').value,
      billDisclaimer: document.getElementById('designer-disclaimer').value
    };

    TenantManager.saveTenantSettings(updated);
    this.currentFormat = updated.billFormat;
    this.closeDesignerModal();
    App.showToast('Bill template format updated successfully!', 'success');
  },

  renderPreview: function() {
    const previewContainer = document.getElementById('bill-designer-preview');
    if (!previewContainer) return;

    const t = TenantManager.getActiveTenant();
    const format = document.getElementById('designer-default-format')?.value || this.currentFormat;
    const disclaimer = document.getElementById('designer-disclaimer')?.value || t.billDisclaimer;

    if (format === 'thermal') {
      previewContainer.innerHTML = `
        <div class="bg-white p-4 border border-dashed border-slate-400 font-mono text-[11px] text-slate-800 max-w-[280px] mx-auto shadow-sm">
          <div class="text-center pb-2 border-b border-dashed border-slate-400">
            <h4 class="font-bold text-xs uppercase">${t.firmName}</h4>
            <p class="text-[9px]">${t.shopNo}</p>
            <p class="text-[9px]">Lic: ${t.apmcLicenseNo} • Ph: ${t.phone}</p>
            <div class="inline-block mt-1 px-2 py-0.5 bg-slate-900 text-white text-[8px] font-bold">BIKRI PARCHI / INVOICE</div>
          </div>

          <div class="py-2 border-b border-dashed border-slate-300 text-[9px] space-y-0.5">
            <div class="flex justify-between"><span>Inv: I-101-A</span><span>Date: 20-Sep-2026</span></div>
            <div class="flex justify-between"><span>Buyer: Aggarwal Wholesalers</span></div>
          </div>

          <div class="py-2 border-b border-dashed border-slate-400">
            <table class="w-full text-[9px]">
              <thead>
                <tr class="text-slate-500"><th>Item</th><th class="text-center">Qty</th><th class="text-right">Rate</th><th class="text-right">Amt</th></tr>
              </thead>
              <tbody>
                <tr><td>Apple Royal</td><td class="text-center">100</td><td class="text-right">2,150</td><td class="text-right">2,15,000</td></tr>
              </tbody>
            </table>
          </div>

          <div class="py-2 border-b border-dashed border-slate-400 text-[9px] space-y-0.5">
            <div class="flex justify-between"><span>APMC Cess (1%):</span><span>+ ₹2,150</span></div>
            <div class="flex justify-between"><span>DAMB Fee (1%):</span><span>+ ₹2,150</span></div>
            <div class="flex justify-between font-bold text-[10px]"><span>TOTAL PAYABLE:</span><span>₹2,19,300</span></div>
          </div>

          <div class="pt-2 text-center">
            <div class="w-16 h-16 bg-slate-100 border border-slate-300 mx-auto flex items-center justify-center text-[7px] text-slate-500 font-bold">
              [ UPI QR CODE ]
            </div>
            <p class="text-[8px] mt-1 text-slate-600">Scan & Pay to: ${t.upiId}</p>
            <p class="text-[7px] text-slate-400 mt-1 whitespace-pre-line">${disclaimer}</p>
          </div>
        </div>
      `;
    } else {
      previewContainer.innerHTML = `
        <div class="bg-white p-4 border border-slate-300 text-xs text-slate-800 shadow-sm rounded-lg">
          <div class="text-center border-b pb-2">
            <h4 class="font-bold text-sm text-green-800 uppercase">${t.firmName}</h4>
            <p class="text-[10px] text-slate-500">${t.shopNo}, Azadpur Mandi • APMC Lic: ${t.apmcLicenseNo}</p>
            <span class="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-900 font-bold text-[9px] rounded">FORM 'I' (BUYER INVOICE)</span>
          </div>
          <p class="text-[10px] text-slate-500 mt-2 text-center">Standard A4 / A5 Layout with complete legal APMC compliance clauses and signature fields.</p>
        </div>
      `;
    }
  }
};
