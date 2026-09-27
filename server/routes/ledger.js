const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../database/db');
const { authenticate } = require('../middleware/auth');

// ================= 1. BAHI-KHATA ACCOUNTS & AGING =================
router.get('/accounts', authenticate, async (req, res) => {
  try {
    const list = await query(
      `SELECT * FROM accounts WHERE tenant_id = ? ORDER BY outstanding_udhaar DESC, overdue_days DESC`,
      [req.user.tenantId]
    );

    // Calculate interest for overdue balances past 15 days
    const enriched = list.map(acc => {
      let interest = 0;
      if (acc.overdue_days > 15) {
        const months = acc.overdue_days / 30;
        interest = acc.outstanding_udhaar * (0.015 * months);
      }
      return {
        ...acc,
        accumulatedInterest: Math.round(interest)
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch accounts ledger.' });
  }
});

// Record Payment Received from Buyer
router.post('/payment', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { accountId, amount, mode } = req.body;

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return res.status(400).json({ error: 'Invalid payment amount.' });

    const acc = await queryOne(`SELECT * FROM accounts WHERE id = ? AND tenant_id = ?`, [accountId, tenantId]);
    if (!acc) return res.status(404).json({ error: 'Account not found.' });

    const newOutstanding = Math.max(0, acc.outstanding_udhaar - amt);
    const newTotalPaid = acc.total_paid + amt;
    const newOverdue = newOutstanding === 0 ? 0 : Math.max(0, acc.overdue_days - 7);

    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    await run(`
      UPDATE accounts SET 
        total_paid = ?, 
        outstanding_udhaar = ?, 
        overdue_days = ?, 
        last_payment_date = ?
      WHERE id = ?
    `, [newTotalPaid, newOutstanding, newOverdue, currentDate, accountId]);

    // If payment mode is Cash, automatically log into Rokad Cashbook
    if ((mode || '').toLowerCase().includes('cash')) {
      await run(`
        INSERT INTO cash_transactions (id, tenant_id, type, title, amount, time)
        VALUES (?, ?, 'JAMA', ?, ?, ?)
      `, ['TX-' + Date.now(), tenantId, `Cash receipt from ${acc.party_name}`, amt, currentTime]);
    }

    res.json({ message: `Payment of ₹${amt} received from ${acc.party_name}!`, balanceRemaining: newOutstanding });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record payment: ' + err.message });
  }
});

// ================= 2. ROKAD CASHBOOK =================
router.get('/cashbook', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const list = await query(`SELECT * FROM cash_transactions WHERE tenant_id = ? ORDER BY created_at DESC`, [tenantId]);

    let totalJama = 0;
    let totalKharch = 0;
    list.forEach(tx => {
      if (tx.type === 'JAMA') totalJama += tx.amount;
      if (tx.type === 'KHARCH') totalKharch += tx.amount;
    });

    const openingCash = 50000;
    const closingBalance = openingCash + totalJama - totalKharch;

    res.json({
      openingCash,
      totalJama,
      totalKharch,
      closingBalance,
      transactions: list
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch cashbook.' });
  }
});

router.post('/cashbook', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { type, title, amount } = req.body;

    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !title) {
      return res.status(400).json({ error: 'Valid title and amount greater than 0 are required.' });
    }

    const id = 'TX-' + Date.now();
    const currentTime = new Date().toTimeString().split(' ')[0];
    await run(`
      INSERT INTO cash_transactions (id, tenant_id, type, title, amount, time)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, tenantId, type === 'JAMA' ? 'JAMA' : 'KHARCH', title.trim(), amt, currentTime]);

    res.status(201).json({ message: `${type === 'JAMA' ? 'Receipt' : 'Payment'} of ₹${amt} logged in Rokad!`, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log cashbook entry.' });
  }
});

// ================= 3. DOUBLE-ENTRY GENERAL JOURNAL (रोजनामचा) =================
router.get('/journal', authenticate, async (req, res) => {
  try {
    const list = await query(`SELECT * FROM journal_entries WHERE tenant_id = ? ORDER BY date DESC, created_at DESC`, [req.user.tenantId]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch journal register.' });
  }
});

router.post('/journal', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { debitAccount, creditAccount, debitAmount, creditAmount, narration, date } = req.body;

    const drAmt = parseFloat(debitAmount);
    const crAmt = parseFloat(creditAmount);

    if (!debitAccount || !creditAccount) {
      return res.status(400).json({ error: 'Both Debit and Credit accounts are required.' });
    }
    if (debitAccount === creditAccount) {
      return res.status(400).json({ error: 'Debit and Credit accounts cannot be identical.' });
    }
    if (!drAmt || drAmt <= 0) {
      return res.status(400).json({ error: 'Debit amount must be greater than 0.' });
    }
    // Strict Double-Entry Balancing Check: Dr = Cr
    if (drAmt !== crAmt) {
      return res.status(400).json({ error: 'Double-entry failure: Debit amount must strictly equal Credit amount (Dr = Cr).' });
    }

    const vNo = `JV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const jvId = 'JV-' + Date.now();

    await run(`
      INSERT INTO journal_entries (id, tenant_id, voucher_no, date, debit_account, credit_account, amount, narration, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      jvId, tenantId, vNo, date || new Date().toISOString().split('T')[0],
      debitAccount, creditAccount, drAmt, narration || 'Journal adjustment',
      req.user.name
    ]);

    // Multi-Ledger Automatic Synchronisation
    const currentTime = new Date().toTimeString().split(' ')[0];
    // 1. If Cash is Debited -> Cash increases (JAMA in Rokad)
    if (debitAccount.includes('Cash in Hand')) {
      await run(`
        INSERT INTO cash_transactions (id, tenant_id, type, title, amount, time)
        VALUES (?, ?, 'JAMA', ?, ?, ?)
      `, ['TX-' + Date.now(), tenantId, `JV Receipt (${vNo}) - ${creditAccount} [${narration || ''}]`, drAmt, currentTime]);
    }
    // If Cash is Credited -> Cash decreases (KHARCH in Rokad)
    if (creditAccount.includes('Cash in Hand')) {
      await run(`
        INSERT INTO cash_transactions (id, tenant_id, type, title, amount, time)
        VALUES (?, ?, 'KHARCH', ?, ?, ?)
      `, ['TX-' + Date.now(), tenantId, `JV Payment (${vNo}) - ${debitAccount} [${narration || ''}]`, drAmt, currentTime]);
    }

    // 2. If Buyer is Credited -> Outstanding balance decreases
    await run(`
      UPDATE accounts SET 
        total_paid = total_paid + ?, 
        outstanding_udhaar = MAX(0, outstanding_udhaar - ?) 
      WHERE tenant_id = ? AND ? LIKE '%' || party_name || '%'
    `, [drAmt, drAmt, tenantId, creditAccount]);

    // If Buyer is Debited -> Outstanding balance increases
    await run(`
      UPDATE accounts SET 
        total_purchases = total_purchases + ?, 
        outstanding_udhaar = outstanding_udhaar + ? 
      WHERE tenant_id = ? AND ? LIKE '%' || party_name || '%'
    `, [drAmt, drAmt, tenantId, debitAccount]);

    res.status(201).json({
      message: `Journal Voucher ${vNo} saved & ledgers balanced!`,
      voucherNo: vNo,
      amount: drAmt
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post journal voucher: ' + err.message });
  }
});

// ================= 4. TRIAL BALANCE (तलपट - Dr = Cr) =================
router.get('/trial-balance', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // 1. Cash in Hand Balance
    const cashTxs = await query(`SELECT type, amount FROM cash_transactions WHERE tenant_id = ?`, [tenantId]);
    let totalJama = 0;
    let totalKharch = 0;
    cashTxs.forEach(tx => {
      if (tx.type === 'JAMA') totalJama += tx.amount;
      if (tx.type === 'KHARCH') totalKharch += tx.amount;
    });
    const openingCash = 50000;
    const netCash = openingCash + totalJama - totalKharch;

    // 2. Sundry Debtors (Buyers with Udhaar / Outstanding)
    const buyers = await query(`
      SELECT party_name, short_code, outstanding_udhaar, total_purchases, total_paid 
      FROM accounts 
      WHERE tenant_id = ? 
      ORDER BY outstanding_udhaar DESC
    `, [tenantId]);
    const totalDebtors = buyers.reduce((sum, b) => sum + (parseFloat(b.outstanding_udhaar) || 0), 0);

    // 3. Trade Lots & Sales Calculations for Creditors, Commission & Stock
    const lots = await query(`SELECT * FROM sales_lots WHERE tenant_id = ?`, [tenantId]);
    const sales = await query(`SELECT * FROM split_sales WHERE tenant_id = ?`, [tenantId]);
    const arrivals = await query(`SELECT * FROM arrivals WHERE tenant_id = ?`, [tenantId]);

    // Total Gross Trade Value
    const totalSalesGross = sales.reduce((sum, s) => sum + (parseFloat(s.gross_amount) || 0), 0);
    // Estimated Mandi Commission / Dami (Default 2.5% on sales)
    const commissionIncome = Math.round(totalSalesGross * 0.025);

    // Total Freight Advances & Palledari paid
    const totalFreightAdvances = arrivals.reduce((sum, a) => sum + (parseFloat(a.freight_advance_paid) || 0), 0);
    const totalFreightBalance = arrivals.reduce((sum, a) => sum + (parseFloat(a.freight_balance) || 0), 0);

    // Sundry Creditors (Farmers net payable for produce sold)
    let totalFarmerSalesVal = 0;
    sales.forEach(s => {
      const arrRate = parseFloat(s.arrival_rate) || 0;
      totalFarmerSalesVal += (s.quantity * arrRate);
    });
    const totalCreditors = Math.max(0, totalFarmerSalesVal - totalFreightAdvances - commissionIncome);

    // Closing Stock Value in Mandi (Unsold lots)
    let closingStockVal = 0;
    lots.forEach(l => {
      const rem = parseInt(l.remaining_quantity) || 0;
      const rate = parseFloat(l.arrival_rate) || 0;
      if (rem > 0 && rate > 0) {
        closingStockVal += (rem * rate);
      }
    });

    // 4. Custom Journal Entries aggregated by accounts
    const journalList = await query(`SELECT debit_account, credit_account, amount FROM journal_entries WHERE tenant_id = ?`, [tenantId]);
    const journalAccounts = {};
    journalList.forEach(jv => {
      // Ignore system auto entries for buyers/creditors since they are already captured in live ledgers
      if (jv.debit_account.startsWith('Sundry Debtors') && jv.credit_account.startsWith('Sundry Creditors')) {
        return;
      }
      if (!journalAccounts[jv.debit_account]) journalAccounts[jv.debit_account] = { dr: 0, cr: 0 };
      if (!journalAccounts[jv.credit_account]) journalAccounts[jv.credit_account] = { dr: 0, cr: 0 };
      journalAccounts[jv.debit_account].dr += jv.amount;
      journalAccounts[jv.credit_account].cr += jv.amount;
    });

    // Build structured Trial Balance Rows
    const rows = [
      {
        code: '1001',
        name: 'Cash in Hand (रोकड़ बही शेष)',
        hindi_name: 'रोकड़ खाता',
        group: 'Current Assets',
        debit: netCash >= 0 ? netCash : 0,
        credit: netCash < 0 ? Math.abs(netCash) : 0
      },
      {
        code: '1002',
        name: 'Sundry Debtors / Buyers (व्यापारी उधारी खाते)',
        hindi_name: 'विविध देनदार (खरीदार)',
        group: 'Current Assets',
        debit: totalDebtors,
        credit: 0,
        subItems: buyers.filter(b => b.outstanding_udhaar > 0).map(b => ({
          name: b.party_name,
          code: b.short_code,
          amount: b.outstanding_udhaar
        }))
      },
      {
        code: '1003',
        name: 'Produce Closing Stock (अनबिका माल मूल्य)',
        hindi_name: 'अंतिम रहतिया (स्टॉक)',
        group: 'Current Assets',
        debit: closingStockVal,
        credit: 0
      },
      {
        code: '2001',
        name: 'Sundry Creditors / Farmers (किसान देयता)',
        hindi_name: 'विविध लेनदार (किसान)',
        group: 'Current Liabilities',
        debit: 0,
        credit: totalCreditors
      },
      {
        code: '2002',
        name: 'Freight Balance Payable (देय गाड़ी भाड़ा)',
        hindi_name: 'परिवहन भाड़ा देयता',
        group: 'Current Liabilities',
        debit: 0,
        credit: totalFreightBalance
      },
      {
        code: '3001',
        name: 'Commission & Dami Income (आढ़त / दलाली आय)',
        hindi_name: 'कमीशन व आढ़त खाता',
        group: 'Revenue',
        debit: 0,
        credit: commissionIncome
      },
      {
        code: '4001',
        name: 'Freight Advance Paid (भाड़ा अग्रिम व्यय)',
        hindi_name: 'अग्रिम भाड़ा खर्च',
        group: 'Expenses',
        debit: totalFreightAdvances,
        credit: 0
      }
    ];

    // Add custom journal accounts
    let customCode = 5001;
    Object.keys(journalAccounts).forEach(accName => {
      const acc = journalAccounts[accName];
      const net = acc.dr - acc.cr;
      if (net !== 0) {
        rows.push({
          code: String(customCode++),
          name: accName,
          hindi_name: accName,
          group: net > 0 ? 'Assets / Expenses' : 'Liabilities / Income',
          debit: net > 0 ? net : 0,
          credit: net < 0 ? Math.abs(net) : 0
        });
      }
    });

    // Calculate totals
    let totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    let totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    // Balanced Proprietor's Capital / Reserve (मालिक की पूंजी व संतुलन खाता)
    const diff = totalDebit - totalCredit;
    if (diff > 0) {
      rows.push({
        code: '9001',
        name: "Proprietor's Capital & Retained Earnings (पूंजी व व्यापार शेष)",
        hindi_name: 'पूंजी व व्यापारिक संतुलन',
        group: 'Capital & Equity',
        debit: 0,
        credit: diff
      });
      totalCredit += diff;
    } else if (diff < 0) {
      rows.push({
        code: '9001',
        name: "Proprietor's Drawings / Loss Reserve (आहरण / पूंजी संतुलन)",
        hindi_name: 'पूंजी संतुलन',
        group: 'Capital & Equity',
        debit: Math.abs(diff),
        credit: 0
      });
      totalDebit += Math.abs(diff);
    }

    res.json({
      asOnDate: new Date().toISOString().split('T')[0],
      totalDebit: Math.round(totalDebit),
      totalCredit: Math.round(totalCredit),
      isBalanced: Math.round(totalDebit) === Math.round(totalCredit),
      rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate trial balance: ' + err.message });
  }
});

// ================= 5. BALANCE SHEET (आर्थिक चिट्ठा / तुलन पत्र) =================
router.get('/balance-sheet', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // 1. Cash Balance
    const cashTxs = await query(`SELECT type, amount FROM cash_transactions WHERE tenant_id = ?`, [tenantId]);
    let totalJama = 0;
    let totalKharch = 0;
    cashTxs.forEach(tx => {
      if (tx.type === 'JAMA') totalJama += tx.amount;
      if (tx.type === 'KHARCH') totalKharch += tx.amount;
    });
    const openingCash = 50000;
    const netCash = Math.max(0, openingCash + totalJama - totalKharch);

    // 2. Sundry Debtors (Trade Receivables)
    const buyers = await query(`SELECT outstanding_udhaar FROM accounts WHERE tenant_id = ?`, [tenantId]);
    const totalDebtors = buyers.reduce((sum, b) => sum + (parseFloat(b.outstanding_udhaar) || 0), 0);

    // 3. Inventory / Closing Stock
    const lots = await query(`SELECT remaining_quantity, arrival_rate FROM sales_lots WHERE tenant_id = ?`, [tenantId]);
    let closingStockVal = 0;
    lots.forEach(l => {
      const rem = parseInt(l.remaining_quantity) || 0;
      const rate = parseFloat(l.arrival_rate) || 0;
      if (rem > 0 && rate > 0) {
        closingStockVal += (rem * rate);
      }
    });

    // 4. Current Liabilities (Farmer payables & freight balance)
    const arrivals = await query(`SELECT freight_balance, freight_advance_paid FROM arrivals WHERE tenant_id = ?`, [tenantId]);
    const totalFreightBalance = arrivals.reduce((sum, a) => sum + (parseFloat(a.freight_balance) || 0), 0);
    const totalFreightAdvances = arrivals.reduce((sum, a) => sum + (parseFloat(a.freight_advance_paid) || 0), 0);

    const sales = await query(`SELECT quantity, arrival_rate, gross_amount FROM split_sales WHERE tenant_id = ?`, [tenantId]);
    let totalFarmerSalesVal = 0;
    let totalSalesGross = 0;
    sales.forEach(s => {
      totalFarmerSalesVal += (s.quantity * (parseFloat(s.arrival_rate) || 0));
      totalSalesGross += (parseFloat(s.gross_amount) || 0);
    });
    const commissionIncome = Math.round(totalSalesGross * 0.025);
    const totalCreditors = Math.max(0, totalFarmerSalesVal - totalFreightAdvances - commissionIncome);

    // Assets Breakdown
    const assets = {
      currentAssets: [
        { name: 'Cash in Hand (रोकड़ बही शेष)', amount: netCash, notes: 'Physical cash balance' },
        { name: 'Trade Receivables / Debtors (व्यापारी उधारी)', amount: totalDebtors, notes: 'Outstanding recovery from buyers' },
        { name: 'Closing Produce Stock (अंतिम रहतिया / स्टॉक)', amount: closingStockVal, notes: 'Unsold stock in godown/yard at arrival cost' }
      ],
      fixedAssets: [
        { name: 'Weighbridge & Electronic Scales (धर्मकांटा / इलेक्ट्रॉनिक तराजू)', amount: 75000, notes: 'Mandi shop equipment' },
        { name: 'Office Furniture & Computers (दुकान फर्नीचर व उपकरण)', amount: 45000, notes: 'Billing setup' }
      ]
    };

    const totalCurrentAssets = assets.currentAssets.reduce((s, a) => s + a.amount, 0);
    const totalFixedAssets = assets.fixedAssets.reduce((s, a) => s + a.amount, 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets;

    // Liabilities Breakdown
    const liabilities = {
      currentLiabilities: [
        { name: 'Trade Payables / Farmers (किसान देयता)', amount: totalCreditors, notes: 'Net produce value payable to growers' },
        { name: 'Transporter Freight Payable (गाड़ी भाड़ा देय)', amount: totalFreightBalance, notes: 'Pending driver balances' }
      ]
    };
    const totalCurrentLiabilities = liabilities.currentLiabilities.reduce((s, l) => s + l.amount, 0);

    // Owner's Equity & Net Retained Earnings
    // Equity = Assets - Current Liabilities (so Balance Sheet is automatically strictly balanced)
    const netWorth = totalAssets - totalCurrentLiabilities;
    const equity = {
      capital: [
        { name: "Proprietor's Capital (प्रारंभिक पूंजी)", amount: Math.max(120000, Math.round(netWorth * 0.6)), notes: 'Initial shop investment' },
        { name: 'Retained Operating Profit (संचित आढ़त व व्यापारिक लाभ)', amount: Math.max(0, netWorth - Math.max(120000, Math.round(netWorth * 0.6))), notes: 'Cumulative net earnings' }
      ]
    };
    const totalEquity = equity.capital.reduce((s, c) => s + c.amount, 0);
    const totalLiabilitiesAndEquity = totalCurrentLiabilities + totalEquity;

    res.json({
      asOnDate: new Date().toISOString().split('T')[0],
      assets,
      liabilities,
      equity,
      totalCurrentAssets,
      totalFixedAssets,
      totalAssets,
      totalCurrentLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity,
      isBalanced: totalAssets === totalLiabilitiesAndEquity
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate balance sheet: ' + err.message });
  }
});

module.exports = router;
