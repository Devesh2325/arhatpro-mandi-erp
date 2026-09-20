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

    await run(`
      UPDATE accounts SET 
        total_paid = ?, 
        outstanding_udhaar = ?, 
        overdue_days = ?, 
        last_payment_date = DATE('now')
      WHERE id = ?
    `, [newTotalPaid, newOutstanding, newOverdue, accountId]);

    // If payment mode is Cash, automatically log into Rokad Cashbook
    if ((mode || '').toLowerCase().includes('cash')) {
      await run(`
        INSERT INTO cash_transactions (id, tenant_id, type, title, amount, time)
        VALUES (?, ?, 'JAMA', ?, ?, TIME('now'))
      `, ['TX-' + Date.now(), tenantId, `Cash receipt from ${acc.party_name}`, amt]);
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
    await run(`
      INSERT INTO cash_transactions (id, tenant_id, type, title, amount, time)
      VALUES (?, ?, ?, ?, ?, TIME('now'))
    `, [id, tenantId, type === 'JAMA' ? 'JAMA' : 'KHARCH', title.trim(), amt]);

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
    // 1. If Cash is Debited -> Cash increases (JAMA in Rokad)
    if (debitAccount.includes('Cash in Hand')) {
      await run(`
        INSERT INTO cash_transactions (id, tenant_id, type, title, amount, time)
        VALUES (?, ?, 'JAMA', ?, ?, TIME('now'))
      `, ['TX-' + Date.now(), tenantId, `JV Receipt (${vNo}) - ${creditAccount} [${narration || ''}]`, drAmt]);
    }
    // If Cash is Credited -> Cash decreases (KHARCH in Rokad)
    if (creditAccount.includes('Cash in Hand')) {
      await run(`
        INSERT INTO cash_transactions (id, tenant_id, type, title, amount, time)
        VALUES (?, ?, 'KHARCH', ?, ?, TIME('now'))
      `, ['TX-' + Date.now(), tenantId, `JV Payment (${vNo}) - ${debitAccount} [${narration || ''}]`, drAmt]);
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

module.exports = router;
