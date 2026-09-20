/**
 * Commission Agent Bahi-Khata, Rokad Cashbook & Automated Double-Entry Journal Engine (रोजनामचा)
 * Includes automated Debit-to-Credit balancing, multi-ledger posting, and aging reports.
 */

const BahiKhata = {
  accounts: [],
  cashTransactions: [],
  journalEntries: [],

  defaultAccounts: {
    'tenant-sgfc': [
      {
        id: "ACC-BUYER-01",
        partyName: "Aggarwal Wholesale Mart",
        shortCode: "AGW",
        contact: "+91 98110 55432",
        address: "Shop 14, Tilak Nagar Sabzi Mandi, Delhi",
        totalPurchases: 485000,
        totalPaid: 360000,
        outstandingUdhaar: 125000,
        creditLimit: 200000,
        overdueDays: 14,
        monthlyInterestRate: 1.5,
        lastPaymentDate: "2026-09-14",
        status: "Warning"
      },
      {
        id: "ACC-BUYER-02",
        partyName: "Blinkit Darkstore Hub 4 (Narela)",
        shortCode: "BLK",
        contact: "+91 98711 22334",
        address: "Warehouse Block C, Narela Industrial Area",
        totalPurchases: 1420000,
        totalPaid: 1380000,
        outstandingUdhaar: 40000,
        creditLimit: 500000,
        overdueDays: 2,
        monthlyInterestRate: 1.5,
        lastPaymentDate: "2026-09-19",
        status: "Good"
      },
      {
        id: "ACC-BUYER-03",
        partyName: "Rajdhani Hotel & Caterers Supply",
        shortCode: "RJD",
        contact: "+91 99100 88776",
        address: "B-21, Daryaganj, New Delhi",
        totalPurchases: 320000,
        totalPaid: 210000,
        outstandingUdhaar: 110000,
        creditLimit: 150000,
        overdueDays: 22,
        monthlyInterestRate: 1.5,
        lastPaymentDate: "2026-08-30",
        status: "Critical"
      }
    ],
    'tenant-csop': [
      {
        id: "ACC-CSOP-01",
        partyName: "Delhi Veg Wholesalers Association",
        shortCode: "DVW",
        contact: "+91 98111 22998",
        address: "Okhla Mandi Yard 2",
        totalPurchases: 780000,
        totalPaid: 650000,
        outstandingUdhaar: 130000,
        creditLimit: 250000,
        overdueDays: 8,
        monthlyInterestRate: 1.5,
        lastPaymentDate: "2026-09-12",
        status: "Warning"
      }
    ]
  },

  defaultCashbook: [
    { id: "TX-1", type: "JAMA", title: "Cash received from Aggarwal Mart", amount: 45000, time: "06:10 AM" },
    { id: "TX-2", type: "KHARCH", title: "Freight Advance paid to Driver (HP-10-B-9812)", amount: 15000, time: "04:30 AM" },
    { id: "TX-3", type: "KHARCH", title: "Palledari labour gang daily advance", amount: 4000, time: "05:15 AM" }
  ],

  defaultJournals: [
    {
      id: "JV-101",
      voucherNo: "JV-2026-001",
      date: "2026-09-20",
      debitAccount: "Cash in Hand (रोकड़)",
      creditAccount: "Aggarwal Wholesale Mart (AGW)",
      amount: 45000,
      narration: "Spot cash received towards Bill #I-101 partial payment",
      createdBy: "Radhe Shyam (Munshi)"
    },
    {
      id: "JV-102",
      voucherNo: "JV-2026-002",
      date: "2026-09-20",
      debitAccount: "Freight & Transport Expense (भाड़ा)",
      creditAccount: "Cash in Hand (रोकड़)",
      amount: 15000,
      narration: "Advance paid to Truck driver HP-10-B-9812 for Harish Negi apple consignment",
      createdBy: "Radhe Shyam (Munshi)"
    }
  ],

  init: function() {
    const tenantId = TenantManager.currentTenantId;
    const accKey = `mandi_accounts_${tenantId}`;
    const savedAcc = localStorage.getItem(accKey);
    this.accounts = savedAcc ? JSON.parse(savedAcc) : (this.defaultAccounts[tenantId] || []);

    const cashKey = `mandi_cashbook_${tenantId}`;
    const savedCash = localStorage.getItem(cashKey);
    this.cashTransactions = savedCash ? JSON.parse(savedCash) : this.defaultCashbook;

    const jvKey = `mandi_journal_${tenantId}`;
    const savedJv = localStorage.getItem(jvKey);
    this.journalEntries = savedJv ? JSON.parse(savedJv) : this.defaultJournals;

    this.renderLedger();
    this.renderRokad();
    this.renderJournalRegister();
  },

  saveAccounts: function() {
    const tenantId = TenantManager.currentTenantId;
    localStorage.setItem(`mandi_accounts_${tenantId}`, JSON.stringify(this.accounts));
  },

  saveCashbook: function() {
    const tenantId = TenantManager.currentTenantId;
    localStorage.setItem(`mandi_cashbook_${tenantId}`, JSON.stringify(this.cashTransactions));
  },

  saveJournal: function() {
    const tenantId = TenantManager.currentTenantId;
    localStorage.setItem(`mandi_journal_${tenantId}`, JSON.stringify(this.journalEntries));
  },

  // ================= AUTOMATED DOUBLE-ENTRY JOURNAL VOUCHER (Debit -> Auto Credit) =================
  getAvailableAccounts: function() {
    const tenant = TenantManager.getActiveTenant();
    const buyers = PartyManager.parties.filter(p => p.type === 'Buyer').map(p => ({
      group: 'Debtors (थोक खरीदार)',
      name: `${p.name} [${p.shortCode}]`,
      type: 'Buyer',
      id: p.id,
      balance: p.currentBalance || 0
    }));

    const farmers = PartyManager.parties.filter(p => p.type === 'Farmer').map(p => ({
      group: 'Creditors (किसान उत्पादक)',
      name: `${p.name} [${p.shortCode}]`,
      type: 'Farmer',
      id: p.id,
      balance: p.currentBalance || 0
    }));

    const generalAccounts = [
      { group: 'Cash & Bank', name: 'Cash in Hand (रोकड़)', type: 'Cash' },
      { group: 'Cash & Bank', name: `Bank Current A/c (${tenant.bankName || 'HDFC Bank'})`, type: 'Bank' },
      { group: 'Income (आय)', name: 'Arhat Commission Income (आढ़त कमीशन)', type: 'Income' },
      { group: 'Expenses (खर्च)', name: 'Palledari & Hamali Labor (पल्लेदारी मजदूरी)', type: 'Expense' },
      { group: 'Expenses (खर्च)', name: 'Freight & Transport Expense (गाड़ी भाड़ा)', type: 'Expense' },
      { group: 'Expenses (खर्च)', name: 'Shop Tea & Misc Expense (दुकान खर्च)', type: 'Expense' },
      { group: 'Expenses (खर्च)', name: 'Discount & Kasar Allowed (कसर/छूट)', type: 'Expense' }
    ];

    return { generalAccounts, buyers, farmers };
  },

  openJournalVoucherModal: function() {
    const modal = document.getElementById('journal-voucher-modal');
    if (!modal) return;

    const { generalAccounts, buyers, farmers } = this.getAvailableAccounts();
    const drSelect = document.getElementById('jv-debit-account');
    const crSelect = document.getElementById('jv-credit-account');

    const generateOptions = () => {
      let html = '<option value="">-- Select Account --</option>';
      html += '<optgroup label="💵 Cash & Bank Accounts">';
      generalAccounts.filter(a => a.group === 'Cash & Bank').forEach(a => {
        html += `<option value="${a.name}">${a.name}</option>`;
      });
      html += '</optgroup>';

      html += '<optgroup label="🛒 Buyer Accounts (खरीदार)">';
      buyers.forEach(b => {
        html += `<option value="${b.name}">${b.name} (Due: ₹${b.balance.toLocaleString('en-IN')})</option>`;
      });
      html += '</optgroup>';

      html += '<optgroup label="🧑‍🌾 Farmer Accounts (किसान)">';
      farmers.forEach(f => {
        html += `<option value="${f.name}">${f.name}</option>`;
      });
      html += '</optgroup>';

      html += '<optgroup label="📈 Income & Expense Accounts">';
      generalAccounts.filter(a => a.group !== 'Cash & Bank').forEach(a => {
        html += `<option value="${a.name}">${a.name}</option>`;
      });
      html += '</optgroup>';
      return html;
    };

    if (drSelect) drSelect.innerHTML = generateOptions();
    if (crSelect) crSelect.innerHTML = generateOptions();

    // Default Date to Today
    const dateInput = document.getElementById('jv-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    // Reset amounts
    const drAmtInput = document.getElementById('jv-debit-amount');
    const crAmtInput = document.getElementById('jv-credit-amount');
    if (drAmtInput) drAmtInput.value = '';
    if (crAmtInput) crAmtInput.value = '';

    const narrationInput = document.getElementById('jv-narration');
    if (narrationInput) narrationInput.value = '';

    const balanceNotice = document.getElementById('jv-balance-notice');
    if (balanceNotice) {
      balanceNotice.innerHTML = `<span class="text-slate-400">Enter Debit amount above; Credit will auto-balance (Dr = Cr).</span>`;
    }

    modal.classList.remove('hidden');
  },

  closeJournalVoucherModal: function() {
    const modal = document.getElementById('journal-voucher-modal');
    if (modal) modal.classList.add('hidden');
  },

  // CRITICAL REQUIREMENT: "if entry debit they make automate credit"
  onDebitAmountChange: function(val) {
    const num = parseFloat(val) || 0;
    const crInput = document.getElementById('jv-credit-amount');
    const balanceNotice = document.getElementById('jv-balance-notice');

    if (crInput) {
      crInput.value = num > 0 ? num : '';
    }

    if (balanceNotice) {
      if (num > 0) {
        balanceNotice.innerHTML = `
          <div class="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <span>✓ Auto-Balanced Double Entry:</span>
            <span>Total Debit: ₹${num.toLocaleString('en-IN')} = Total Credit: ₹${num.toLocaleString('en-IN')}</span>
          </div>
        `;
      } else {
        balanceNotice.innerHTML = `<span class="text-slate-400 text-xs">Enter Debit amount above; Credit will auto-balance (Dr = Cr).</span>`;
      }
    }
  },

  submitJournalVoucher: function() {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('post journal voucher')) return;

    const drAcc = document.getElementById('jv-debit-account').value;
    const crAcc = document.getElementById('jv-credit-account').value;
    const amount = parseFloat(document.getElementById('jv-debit-amount').value) || 0;
    const date = document.getElementById('jv-date').value || new Date().toISOString().split('T')[0];
    const narration = document.getElementById('jv-narration').value.trim();

    if (!drAcc || !crAcc) {
      App.showToast('Please select both Debit and Credit accounts', 'error');
      return;
    }
    if (drAcc === crAcc) {
      App.showToast('Debit and Credit accounts cannot be identical', 'error');
      return;
    }
    if (amount <= 0) {
      App.showToast('Please enter a valid amount greater than 0', 'error');
      return;
    }

    const vNo = `JV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newJv = {
      id: 'JV-' + Date.now(),
      voucherNo: vNo,
      date: date,
      debitAccount: drAcc,
      creditAccount: crAcc,
      amount: amount,
      narration: narration || 'Journal adjustment entry',
      createdBy: 'Shop Admin'
    };

    this.journalEntries.unshift(newJv);
    this.saveJournal();

    // Multi-Ledger Impact
    // 1. If Cash is Debited -> Cash increases (JAMA in Rokad)
    if (drAcc.includes('Cash in Hand')) {
      this.cashTransactions.unshift({
        id: "TX-" + Date.now(),
        type: "JAMA",
        title: `JV Receipt (${vNo}) - ${crAcc} [${narration}]`,
        amount: amount,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.saveCashbook();
      this.renderRokad();
    }
    // If Cash is Credited -> Cash decreases (KHARCH in Rokad)
    if (crAcc.includes('Cash in Hand')) {
      this.cashTransactions.unshift({
        id: "TX-" + Date.now(),
        type: "KHARCH",
        title: `JV Payment (${vNo}) - ${drAcc} [${narration}]`,
        amount: amount,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.saveCashbook();
      this.renderRokad();
    }

    // 2. If Buyer is Credited -> Outstanding Udhaari decreases (Payment received)
    const buyerInCr = this.accounts.find(a => crAcc.includes(a.partyName));
    if (buyerInCr) {
      buyerInCr.totalPaid += amount;
      buyerInCr.outstandingUdhaar = Math.max(0, buyerInCr.outstandingUdhaar - amount);
      this.saveAccounts();
      this.renderLedger();
    }
    // If Buyer is Debited -> Outstanding Udhaari increases
    const buyerInDr = this.accounts.find(a => drAcc.includes(a.partyName));
    if (buyerInDr) {
      buyerInDr.totalPurchases += amount;
      buyerInDr.outstandingUdhaar += amount;
      this.saveAccounts();
      this.renderLedger();
    }

    this.closeJournalVoucherModal();
    this.renderJournalRegister();
    App.showToast(`Journal Voucher ${vNo} saved & ledgers balanced!`, 'success');
  },

  renderJournalRegister: function() {
    const container = document.getElementById('journal-register-table-body');
    if (!container) return;

    if (this.journalEntries.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center bg-slate-50 rounded-xl text-slate-400 text-xs">
            <span class="text-3xl block mb-2">📖</span>
            No journal entries logged yet. Click <strong>+ New Journal Entry</strong> to create an automated balanced entry.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = this.journalEntries.map(jv => `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors text-xs">
        <td class="p-3 font-mono font-bold text-slate-700">${jv.date}</td>
        <td class="p-3 font-mono font-black text-purple-900">${jv.voucherNo}</td>
        <td class="p-3">
          <div class="font-bold text-rose-800 flex items-center gap-1">
            <span class="px-1.5 py-0.5 rounded bg-rose-50 text-[10px] font-black">Dr</span>
            <span>${jv.debitAccount}</span>
          </div>
          <div class="font-bold text-emerald-800 flex items-center gap-1 mt-1">
            <span class="px-1.5 py-0.5 rounded bg-emerald-50 text-[10px] font-black">Cr</span>
            <span>${jv.creditAccount}</span>
          </div>
        </td>
        <td class="p-3 text-slate-600 max-w-xs truncate">${jv.narration}</td>
        <td class="p-3 text-right font-black text-slate-900">₹${jv.amount.toLocaleString('en-IN')}</td>
        <td class="p-3 text-right">
          <button onclick="App.showToast('Voucher slip printed', 'info')" class="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
            🖨️ Slip
          </button>
        </td>
      </tr>
    `).join('');
  },

  // ================= BUYER CREDIT LEDGER =================
  addBuyerTransaction: function(buyerName, saleAmount, qty, commodity) {
    let acc = this.accounts.find(a => a.partyName.toLowerCase() === buyerName.toLowerCase());
    if (!acc) {
      acc = {
        id: "ACC-" + Math.floor(1000 + Math.random() * 9000),
        partyName: buyerName,
        shortCode: buyerName.substring(0, 3).toUpperCase(),
        contact: "+91 98110 55432",
        address: "Azadpur Sub-Yard / Delhi NCR",
        totalPurchases: 0,
        totalPaid: 0,
        outstandingUdhaar: 0,
        creditLimit: 200000,
        overdueDays: 0,
        monthlyInterestRate: 1.5,
        lastPaymentDate: new Date().toISOString().split('T')[0],
        status: "Good"
      };
      this.accounts.push(acc);
    }

    acc.totalPurchases += saleAmount;
    acc.outstandingUdhaar += saleAmount;
    this.saveAccounts();
    this.renderLedger();
  },

  renderLedger: function() {
    const container = document.getElementById('bahi-khata-table-body');
    const summaryContainer = document.getElementById('bahi-khata-summary');
    if (!container) return;

    let totalOutstanding = 0;
    let totalOverdue = 0;
    let totalInterestAccumulated = 0;

    this.accounts.forEach(acc => {
      totalOutstanding += acc.outstandingUdhaar;
      if (acc.overdueDays > 7) totalOverdue += acc.outstandingUdhaar;
      if (acc.overdueDays > 15) {
        const months = acc.overdueDays / 30;
        totalInterestAccumulated += acc.outstandingUdhaar * (0.015 * months);
      }
    });

    if (summaryContainer) {
      summaryContainer.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Active Udhaari (बकाया)</span>
            <span class="text-2xl font-black text-amber-800 mt-1 block">₹${totalOutstanding.toLocaleString('en-IN')}</span>
            <span class="text-xs text-slate-400">Across ${this.accounts.length} registered buyers</span>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-xs font-bold text-rose-600 uppercase tracking-wider block">Overdue (>7 Days)</span>
            <span class="text-2xl font-black text-rose-700 mt-1 block">₹${totalOverdue.toLocaleString('en-IN')}</span>
            <span class="text-xs text-rose-500 font-medium">Payment follow-up required</span>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Interest Accrued</span>
            <span class="text-2xl font-black text-emerald-800 mt-1 block">₹${totalInterestAccumulated.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span class="text-xs text-slate-400">@ 1.5% p.m. past 15 days overdue</span>
          </div>
        </div>
      `;
    }

    container.innerHTML = this.accounts.map(acc => {
      let statusBadge = 'badge-active';
      let interestAmount = 0;

      if (acc.overdueDays > 15) {
        statusBadge = 'badge-danger';
        const months = acc.overdueDays / 30;
        interestAmount = acc.outstandingUdhaar * (0.015 * months);
      } else if (acc.overdueDays > 7) {
        statusBadge = 'badge-pending';
      }

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
          <td class="p-3.5">
            <div class="font-bold text-slate-900 text-sm">${acc.partyName}</div>
            <div class="text-xs text-slate-500">${acc.address}</div>
            <div class="text-xs font-mono text-slate-600 mt-0.5">📞 ${acc.contact}</div>
          </td>
          <td class="p-3.5 text-right font-medium text-slate-700">
            ₹${acc.totalPurchases.toLocaleString('en-IN')}
          </td>
          <td class="p-3.5 text-right font-medium text-emerald-700">
            ₹${acc.totalPaid.toLocaleString('en-IN')}
          </td>
          <td class="p-3.5 text-right">
            <span class="text-base font-black ${acc.outstandingUdhaar > 0 ? 'text-amber-800' : 'text-slate-700'}">
              ₹${acc.outstandingUdhaar.toLocaleString('en-IN')}
            </span>
            ${interestAmount > 0 ? `
              <span class="block text-[10px] text-rose-600 font-bold">+ ₹${interestAmount.toFixed(0)} int.</span>
            ` : ''}
          </td>
          <td class="p-3.5 text-center">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold ${statusBadge}">
              ${acc.overdueDays} Days
            </span>
          </td>
          <td class="p-3.5 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="BahiKhata.sendBrandedWhatsApp('${acc.id}')" 
                class="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                📲 WhatsApp
              </button>
              <button onclick="BahiKhata.openPaymentModal('${acc.id}')" 
                class="px-2.5 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold transition-colors">
                + Recv ₹
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  sendBrandedWhatsApp: function(accountId) {
    const acc = this.accounts.find(a => a.id === accountId);
    if (!acc) return;

    const t = TenantManager.getActiveTenant();
    const upiLink = `upi://pay?pa=${encodeURIComponent(t.upiId)}&pn=${encodeURIComponent(t.firmName)}&am=${acc.outstandingUdhaar}&cu=INR`;

    const msg = `*${t.firmName.toUpperCase()}* (${t.shopNo}, Azadpur Mandi, Delhi)\n` +
      `APMC Lic: ${t.apmcLicenseNo}\n\n` +
      `Respected ${acc.partyName},\n` +
      `Your current mandi balance with us is: *₹${acc.outstandingUdhaar.toLocaleString('en-IN')}* (Overdue by ${acc.overdueDays} days).\n\n` +
      `Kindly clear the payment via RTGS/NEFT or scan UPI:\n` +
      `UPI ID: *${t.upiId}*\n` +
      `Bank: ${t.bankName} | A/c: ${t.accountNo} | IFSC: ${t.ifsc}\n\n` +
      `_Terms: Interest @ 1.5% p.m. charged on balances overdue past 15 days._\n` +
      `Thank you,\n${t.proprietor} (${t.phone})`;

    const cleanPhone = acc.contact.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    App.showToast(`Branded reminder prepared for ${acc.partyName}`, 'info');
  },

  openPaymentModal: function(accountId) {
    const acc = this.accounts.find(a => a.id === accountId);
    if (!acc) return;

    const modal = document.getElementById('payment-record-modal');
    if (!modal) return;

    document.getElementById('payment-modal-account-id').value = acc.id;
    document.getElementById('payment-modal-party-name').textContent = acc.partyName;
    document.getElementById('payment-modal-outstanding').textContent = `₹${acc.outstandingUdhaar.toLocaleString('en-IN')}`;
    document.getElementById('payment-modal-amount').value = acc.outstandingUdhaar;

    modal.classList.remove('hidden');
  },

  closePaymentModal: function() {
    const modal = document.getElementById('payment-record-modal');
    if (modal) modal.classList.add('hidden');
  },

  recordPaymentSubmit: function() {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('record buyer payment')) return;

    const accountId = document.getElementById('payment-modal-account-id').value;
    const amount = parseFloat(document.getElementById('payment-modal-amount').value);
    const mode = document.getElementById('payment-modal-mode').value;

    const acc = this.accounts.find(a => a.id === accountId);
    if (!acc || !amount || amount <= 0) {
      App.showToast('Please enter a valid payment amount', 'error');
      return;
    }

    acc.totalPaid += amount;
    acc.outstandingUdhaar = Math.max(0, acc.outstandingUdhaar - amount);
    acc.overdueDays = acc.outstandingUdhaar === 0 ? 0 : Math.max(0, acc.overdueDays - 7);
    acc.lastPaymentDate = new Date().toISOString().split('T')[0];

    // If payment is Cash, automatically record in Rokad Bahi
    if (mode.toLowerCase().includes('cash')) {
      this.cashTransactions.unshift({
        id: "TX-" + Date.now(),
        type: "JAMA",
        title: `Cash receipt from ${acc.partyName}`,
        amount: amount,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.saveCashbook();
      this.renderRokad();
    }

    this.saveAccounts();
    this.renderLedger();
    this.closePaymentModal();
    App.showToast(`Received ₹${amount.toLocaleString('en-IN')} via ${mode} from ${acc.partyName}!`, 'success');
  },

  // ================= ROKAD CASHBOOK =================
  renderRokad: function() {
    const container = document.getElementById('rokad-transactions-body');
    const cashTotalEl = document.getElementById('rokad-closing-balance');
    if (!container) return;

    let openingCash = 50000;
    let totalJama = 0;
    let totalKharch = 0;

    this.cashTransactions.forEach(tx => {
      if (tx.type === 'JAMA') totalJama += tx.amount;
      if (tx.type === 'KHARCH') totalKharch += tx.amount;
    });

    const closingBalance = openingCash + totalJama - totalKharch;
    if (cashTotalEl) {
      cashTotalEl.textContent = `₹${closingBalance.toLocaleString('en-IN')}`;
    }

    container.innerHTML = this.cashTransactions.map(tx => {
      const isJama = tx.type === 'JAMA';
      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
          <td class="p-3 text-xs font-mono text-slate-500">${tx.time}</td>
          <td class="p-3 text-xs font-bold text-slate-800">${tx.title}</td>
          <td class="p-3 text-center">
            <span class="px-2 py-0.5 text-[10px] font-bold rounded ${isJama ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
              ${isJama ? '+ जमा (Receipt)' : '- खर्च (Payment)'}
            </span>
          </td>
          <td class="p-3 text-right font-black text-xs ${isJama ? 'text-emerald-700' : 'text-rose-700'}">
            ${isJama ? '+' : '-'} ₹${tx.amount.toLocaleString('en-IN')}
          </td>
        </tr>
      `;
    }).join('');
  },

  openRokadEntryModal: function() {
    const modal = document.getElementById('rokad-entry-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeRokadEntryModal: function() {
    const modal = document.getElementById('rokad-entry-modal');
    if (modal) modal.classList.add('hidden');
  },

  submitRokadEntry: function(type, title, amount) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('record rokad cash transaction')) return;

    if (!amount || amount <= 0 || !title) {
      App.showToast('Please enter valid description and amount', 'error');
      return;
    }

    this.cashTransactions.unshift({
      id: "TX-" + Date.now(),
      type: type,
      title: title,
      amount: amount,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.saveCashbook();
    this.renderRokad();
    this.closeRokadEntryModal();
    App.showToast(`Logged ${type === 'JAMA' ? 'Receipt' : 'Payment'} of ₹${amount} in Rokad Bahi!`, 'success');
  }
};
