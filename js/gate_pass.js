/**
 * APMC Gate Pass, Weighbridge & Yard Traffic Management Module
 */

const GatePassManager = {
  logs: [],

  init: function() {
    this.logs = getStoredData('gate_logs', MandiData.gateLogs);
    this.renderGateLogs();
  },

  renderGateLogs: function() {
    const container = document.getElementById('gate-logs-table-body');
    const statsContainer = document.getElementById('gate-stats-container');
    if (!container) return;

    const inwardCount = this.logs.filter(l => l.direction === 'INWARD').length;
    const outwardCount = this.logs.filter(l => l.direction === 'OUTWARD').length;

    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-xs font-semibold text-slate-500 uppercase block">Inward Arrivals</span>
            <span class="text-2xl font-black text-emerald-700 mt-1 block">${inwardCount} Trucks</span>
            <span class="text-xs text-slate-400">Total 1,840 MT Today</span>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-xs font-semibold text-slate-500 uppercase block">Dispatches Cleared</span>
            <span class="text-2xl font-black text-blue-700 mt-1 block">${outwardCount} Vehicles</span>
            <span class="text-xs text-slate-400">Cess verified & exited</span>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-xs font-semibold text-slate-500 uppercase block">Vehicles in Yard</span>
            <span class="text-2xl font-black text-amber-700 mt-1 block">${Math.max(1, inwardCount - outwardCount)} Trucks</span>
            <span class="text-xs text-slate-400">Active in Sheds 1-12</span>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-xs font-semibold text-slate-500 uppercase block">Mandi Cess Collected</span>
            <span class="text-2xl font-black text-green-800 mt-1 block">₹4.82 Lakh</span>
            <span class="text-xs text-slate-400">Statutory 1% fee</span>
          </div>
        </div>
      `;
    }

    container.innerHTML = this.logs.map(log => {
      const isInward = log.direction === 'INWARD';
      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
          <td class="p-3">
            <span class="font-mono font-bold text-xs ${isInward ? 'text-emerald-700' : 'text-blue-700'}">${log.passId}</span>
            <span class="block text-[11px] text-slate-400">${log.entryTime || log.exitTime}</span>
          </td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded text-[11px] font-bold ${isInward ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}">
              ${log.direction}
            </span>
          </td>
          <td class="p-3">
            <div class="font-bold text-slate-800 text-xs">${log.truckNo}</div>
            <div class="text-[11px] text-slate-500">${log.driverName} • ${log.driverPhone}</div>
          </td>
          <td class="p-3 text-xs text-slate-700 font-medium">
            ${log.commodity}
            ${log.netWeightKg ? `<span class="block text-[11px] text-slate-400">Net: ${log.netWeightKg.toLocaleString()} kg</span>` : ''}
          </td>
          <td class="p-3 text-xs text-slate-600">
            ${isInward ? (log.assignedShed || 'General Yard') : (log.destination || 'Delhi NCR')}
          </td>
          <td class="p-3 text-center">
            <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
              ✓ Verified
            </span>
          </td>
          <td class="p-3 text-right">
            <button onclick="GatePassManager.viewGateSlip('${log.passId}')" 
              class="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
              View Slip / QR
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  openInwardModal: function() {
    const modal = document.getElementById('inward-entry-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeInwardModal: function() {
    const modal = document.getElementById('inward-entry-modal');
    if (modal) modal.classList.add('hidden');
  },

  submitInwardEntry: function(formData) {
    const gross = parseFloat(formData.grossWeight) || 0;
    const tare = parseFloat(formData.tareWeight) || 0;
    const net = Math.max(0, gross - tare);

    const newPass = {
      passId: "GP-IN-" + Math.floor(1000 + Math.random() * 9000),
      direction: "INWARD",
      truckNo: formData.truckNo.toUpperCase(),
      driverName: formData.driverName,
      driverPhone: formData.driverPhone,
      commodity: formData.commodity,
      grossWeightKg: gross,
      tareWeightKg: tare,
      netWeightKg: net,
      assignedShed: formData.assignedShed,
      arhatiyaShop: formData.arhatiyaShop,
      entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "In Mandi Yard",
      verified: true
    };

    this.logs.unshift(newPass);
    saveStoredData('gate_logs', this.logs);
    this.renderGateLogs();
    this.closeInwardModal();
    App.showToast(`Inward Pass ${newPass.passId} created for ${newPass.truckNo}!`, 'success');
  },

  viewGateSlip: function(passId) {
    const pass = this.logs.find(l => l.passId === passId);
    if (!pass) return;

    const modal = document.getElementById('gate-slip-modal');
    const container = document.getElementById('gate-slip-content');
    if (!modal || !container) return;

    container.innerHTML = `
      <div class="p-6 bg-white rounded-2xl border-2 border-slate-800 text-slate-800 font-mono text-xs max-w-sm mx-auto shadow-lg" id="print-container">
        <div class="text-center border-b-2 border-dashed border-slate-400 pb-3">
          <p class="font-bold text-sm tracking-wider">APMC AZADPUR DELHI</p>
          <p class="text-[10px]">VEHICLE GATE CLEARANCE PASS</p>
          <p class="font-bold text-xs mt-1 bg-slate-900 text-white py-0.5 rounded">${pass.passId} • ${pass.direction}</p>
        </div>

        <div class="py-3 space-y-1.5 border-b border-dashed border-slate-300">
          <div class="flex justify-between">
            <span class="text-slate-500">Vehicle No:</span>
            <span class="font-bold">${pass.truckNo}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Driver:</span>
            <span>${pass.driverName}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Time:</span>
            <span>${pass.entryTime || pass.exitTime}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Commodity:</span>
            <span class="font-bold">${pass.commodity}</span>
          </div>
          ${pass.netWeightKg ? `
            <div class="flex justify-between text-emerald-700 font-bold">
              <span>Net Weight:</span>
              <span>${pass.netWeightKg} KG</span>
            </div>
          ` : ''}
          <div class="flex justify-between">
            <span class="text-slate-500">Yard / Shed:</span>
            <span>${pass.assignedShed || pass.destination}</span>
          </div>
        </div>

        <div class="pt-4 text-center">
          <!-- Simulated QR Code Container -->
          <div id="qrcode-container" class="w-32 h-32 mx-auto bg-slate-50 border border-slate-300 p-2 flex items-center justify-center rounded"></div>
          <p class="text-[9px] text-slate-500 mt-2">Scan at Azadpur Gate 1 / 2 Security Booth</p>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');

    // Generate real QR code using QRCode library if available, else SVG fallback
    setTimeout(() => {
      const qrEl = document.getElementById('qrcode-container');
      if (qrEl) {
        qrEl.innerHTML = '';
        if (typeof QRCode !== 'undefined') {
          new QRCode(qrEl, {
            text: `APMC-AZD:${pass.passId}:${pass.truckNo}:${pass.direction}:VERIFIED`,
            width: 110,
            height: 110,
            colorDark: "#0f172a",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
          });
        } else {
          qrEl.innerHTML = `<span class="text-[9px] font-bold text-slate-600">[QR: ${pass.passId}]</span>`;
        }
      }
    }, 100);
  },

  closeGateSlipModal: function() {
    const modal = document.getElementById('gate-slip-modal');
    if (modal) modal.classList.add('hidden');
  },

  openQrScannerSimulator: function() {
    const mockPass = this.logs[Math.floor(Math.random() * this.logs.length)];
    alert(`📷 APMC Security Gate Scanner Simulation:\n\nScanned QR Code:\nPass ID: ${mockPass.passId}\nVehicle: ${mockPass.truckNo}\nDirection: ${mockPass.direction}\nStatus: VERIFIED & CLEARED FOR GATE PASSAGE`);
  }
};
