const express = require('express');
const router = express.Router();
const { query, queryOne, run, auditLog } = require('../database/db');
const { authenticate } = require('../middleware/auth');

// ================= 1. COMMODITIES =================
router.get('/commodities', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const list = await query(`SELECT * FROM commodities WHERE tenant_id = ? ORDER BY name_en ASC`, [tenantId]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch commodities.' });
  }
});

router.post('/commodities', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { nameEn, nameHi, category, defaultUnit, unitWeightKg, tareDeductionKg, standardCommissionPct, palledariRatePerUnit } = req.body;
    const id = 'COMM-' + Date.now();

    await run(`
      INSERT INTO commodities (id, tenant_id, name_en, name_hi, category, default_unit, unit_weight_kg, tare_deduction_kg, standard_commission_pct, palledari_rate_per_unit, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      id, tenantId, nameEn.trim(), nameHi || '', category || 'Fruit', defaultUnit || 'Box (20kg)',
      parseFloat(unitWeightKg) || 20, parseFloat(tareDeductionKg) || 1.0,
      parseFloat(standardCommissionPct) || 2.5, parseFloat(palledariRatePerUnit) || 10
    ]);

    res.status(201).json({ message: 'Commodity added!', id });
  } catch (err) {
    res.status(500).json({ error: 'Could not add commodity.' });
  }
});

router.put('/commodities/:id', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { nameEn, nameHi, category, defaultUnit, unitWeightKg, tareDeductionKg, standardCommissionPct, palledariRatePerUnit, active } = req.body;

    const existing = await queryOne(`SELECT id FROM commodities WHERE id = ? AND tenant_id = ?`, [id, tenantId]);
    if (!existing) {
      return res.status(404).json({ error: 'Commodity not found.' });
    }

    await run(`
      UPDATE commodities SET
        name_en = ?,
        name_hi = ?,
        category = ?,
        default_unit = ?,
        unit_weight_kg = ?,
        tare_deduction_kg = ?,
        standard_commission_pct = ?,
        palledari_rate_per_unit = ?,
        active = ?
      WHERE id = ? AND tenant_id = ?
    `, [
      nameEn ? nameEn.trim() : 'Produce',
      nameHi || '',
      category || 'Fruit',
      defaultUnit || 'Box (20kg)',
      parseFloat(unitWeightKg) || 20,
      parseFloat(tareDeductionKg) || 1.0,
      parseFloat(standardCommissionPct) || 2.5,
      parseFloat(palledariRatePerUnit) || 10,
      active !== undefined ? (active ? 1 : 0) : 1,
      id,
      tenantId
    ]);

    res.json({ message: 'Commodity configuration updated successfully!', id });
  } catch (err) {
    res.status(500).json({ error: 'Could not update commodity: ' + err.message });
  }
});

router.delete('/commodities/:id', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    await run(`DELETE FROM commodities WHERE id = ? AND tenant_id = ?`, [id, tenantId]);
    res.json({ message: 'Commodity deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete commodity: ' + err.message });
  }
});

// ================= 1.1 VARIETIES & GRADES MASTER =================
router.get('/varieties', authenticate, async (req, res) => {
  try {
    const list = await query(`SELECT * FROM varieties WHERE tenant_id = ? ORDER BY name ASC`, [req.user.tenantId]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch varieties.' });
  }
});

router.post('/varieties', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { commodityId, commodityName, name, nameHi, grade, defaultRate } = req.body;
    if (!name) return res.status(400).json({ error: 'Variety name is required.' });

    const id = 'VAR-' + Date.now();
    await run(`
      INSERT INTO varieties (id, tenant_id, commodity_id, commodity_name, name, name_hi, grade, default_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, tenantId, commodityId || null, commodityName || '', name.trim(), nameHi || '', grade || 'Grade A', parseFloat(defaultRate) || 0]);

    res.status(201).json({ message: 'Variety added successfully!', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add variety: ' + err.message });
  }
});

router.put('/varieties/:id', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { commodityId, commodityName, name, nameHi, grade, defaultRate } = req.body;

    await run(`
      UPDATE varieties SET
        commodity_id = COALESCE(?, commodity_id),
        commodity_name = COALESCE(?, commodity_name),
        name = COALESCE(?, name),
        name_hi = COALESCE(?, name_hi),
        grade = COALESCE(?, grade),
        default_rate = COALESCE(?, default_rate)
      WHERE id = ? AND tenant_id = ?
    `, [commodityId || null, commodityName || null, name ? name.trim() : null, nameHi || null, grade || null, defaultRate !== undefined ? parseFloat(defaultRate) : null, id, tenantId]);

    res.json({ message: 'Variety updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update variety: ' + err.message });
  }
});

router.delete('/varieties/:id', authenticate, async (req, res) => {
  try {
    await run(`DELETE FROM varieties WHERE id = ? AND tenant_id = ?`, [req.params.id, req.user.tenantId]);
    res.json({ message: 'Variety removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete variety.' });
  }
});

// ================= 1.2 EXPENSE HEADS MASTER (कटौती व खर्चे) =================
router.get('/expenses', authenticate, async (req, res) => {
  try {
    const list = await query(`SELECT * FROM expense_heads WHERE tenant_id = ? ORDER BY target ASC, name ASC`, [req.user.tenantId]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch expense heads.' });
  }
});

router.post('/expenses', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, hindiName, target, type, defaultAmount, isMandatory } = req.body;
    if (!name) return res.status(400).json({ error: 'Expense head name is required.' });

    const id = 'EXP-' + Date.now();
    await run(`
      INSERT INTO expense_heads (id, tenant_id, name, hindi_name, target, type, default_amount, is_mandatory, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [id, tenantId, name.trim(), hindiName || '', target || 'farmer', type || 'per_unit', parseFloat(defaultAmount) || 0, isMandatory ? 1 : 0]);

    res.status(201).json({ message: 'Expense head created!', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create expense head: ' + err.message });
  }
});

router.put('/expenses/:id', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { name, hindiName, target, type, defaultAmount, isMandatory, isActive } = req.body;

    await run(`
      UPDATE expense_heads SET
        name = COALESCE(?, name),
        hindi_name = COALESCE(?, hindi_name),
        target = COALESCE(?, target),
        type = COALESCE(?, type),
        default_amount = COALESCE(?, default_amount),
        is_mandatory = COALESCE(?, is_mandatory),
        is_active = COALESCE(?, is_active)
      WHERE id = ? AND tenant_id = ?
    `, [
      name ? name.trim() : null,
      hindiName || null,
      target || null,
      type || null,
      defaultAmount !== undefined ? parseFloat(defaultAmount) : null,
      isMandatory !== undefined ? (isMandatory ? 1 : 0) : null,
      isActive !== undefined ? (isActive ? 1 : 0) : null,
      id,
      tenantId
    ]);

    res.json({ message: 'Expense head updated!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update expense head: ' + err.message });
  }
});

router.delete('/expenses/:id', authenticate, async (req, res) => {
  try {
    await run(`DELETE FROM expense_heads WHERE id = ? AND tenant_id = ?`, [req.params.id, req.user.tenantId]);
    res.json({ message: 'Expense head deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense head.' });
  }
});

// ================= 2. PARTIES (Farmers & Buyers) =================
router.get('/parties', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const list = await query(`SELECT * FROM parties WHERE tenant_id = ? ORDER BY name ASC`, [tenantId]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch parties.' });
  }
});

router.post('/parties', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { 
      shortCode, name, type, mobile, address, creditLimit,
      bankName, accountNo, ifsc, upiId, accountHolder,
      pan, gstin, state, city, pincode, fatherName, alternateMobile,
      paymentTermsDays, openingBalance, balanceType
    } = req.body;

    const cleanCode = (shortCode || ('P' + Date.now().toString().slice(-4))).trim().toUpperCase();
    const existing = await queryOne(`SELECT id FROM parties WHERE tenant_id = ? AND short_code = ?`, [tenantId, cleanCode]);
    if (existing) {
      return res.status(409).json({ error: `Short code "${cleanCode}" already exists.` });
    }

    const id = 'P-' + Date.now();
    await run(`
      INSERT INTO parties (
        id, tenant_id, short_code, name, type, mobile, address, credit_limit, current_balance,
        bank_name, account_no, ifsc, upi_id, account_holder,
        pan, gstin, state, city, pincode, father_name, alternate_mobile,
        payment_terms_days, opening_balance, balance_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, tenantId, cleanCode, name.trim(), type || 'Buyer', (mobile || '').trim(), address || '', 
      parseFloat(creditLimit) || 0, parseFloat(openingBalance) || 0,
      bankName || '', accountNo || '', ifsc || '', upiId || '', accountHolder || name.trim(),
      pan || '', gstin || '', state || 'Delhi', city || 'Delhi', pincode || '', 
      fatherName || '', alternateMobile || '', parseInt(paymentTermsDays) || 15,
      parseFloat(openingBalance) || 0, balanceType || 'Dr'
    ]);

    // If Buyer, also create entry in accounts table
    if (type === 'Buyer') {
      await run(`
        INSERT INTO accounts (id, tenant_id, party_name, short_code, contact, address, credit_limit, outstanding_udhaar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'ACC-' + Date.now(), tenantId, name.trim(), cleanCode, (mobile || '').trim(), address || '', 
        parseFloat(creditLimit) || 0, parseFloat(openingBalance) || 0
      ]);
    }

    await auditLog({
      tenantId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CREATE_PARTY',
      entityType: 'party',
      entityId: id,
      details: `Created party ${name.trim()} (${type || 'Buyer'}) [${cleanCode}]`,
      ipAddress: req.ip
    });

    res.status(201).json({ message: 'Party registered successfully!', id, shortCode: cleanCode });
  } catch (err) {
    res.status(500).json({ error: 'Could not create party: ' + err.message });
  }
});

router.post('/parties/import', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { parties } = req.body;
    if (!Array.isArray(parties) || parties.length === 0) {
      return res.status(400).json({ error: 'No parties provided for import.' });
    }

    let importedCount = 0;
    const existingList = await query(`SELECT short_code FROM parties WHERE tenant_id = ?`, [tenantId]);
    const existingCodes = new Set(existingList.map(p => (p.short_code || '').toUpperCase()));

    for (const p of parties) {
      const name = (p.name || '').trim();
      if (!name) continue;

      let type = (p.type || 'Buyer').trim();
      if (!['Buyer', 'Farmer', 'Agent'].includes(type)) {
        type = 'Buyer';
      }

      // Generate or normalize short code
      let code = (p.shortCode || p.short_code || '').trim().toUpperCase();
      if (!code) {
        const initials = name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'PTY';
        code = initials + Math.floor(100 + Math.random() * 900);
      }
      // Ensure unique code
      let counter = 1;
      let finalCode = code;
      while (existingCodes.has(finalCode)) {
        finalCode = `${code.slice(0, 4)}${counter++}`;
      }
      existingCodes.add(finalCode);

      const id = 'P-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900);
      const creditLimit = parseFloat(p.creditLimit || p.credit_limit) || 0;
      const openingBalance = parseFloat(p.openingBalance || p.opening_balance) || 0;
      const balanceType = p.balanceType || p.balance_type || 'Dr';

      await run(`
        INSERT INTO parties (
          id, tenant_id, short_code, name, type, mobile, address, credit_limit, current_balance,
          bank_name, account_no, ifsc, upi_id, account_holder,
          pan, gstin, state, city, pincode, father_name, alternate_mobile,
          payment_terms_days, opening_balance, balance_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, tenantId, finalCode, name, type, (p.mobile || '').toString().trim(), (p.address || '').trim(),
        creditLimit, openingBalance,
        p.bankName || p.bank_name || '', p.accountNo || p.account_no || '', p.ifsc || '', p.upiId || p.upi_id || '', p.accountHolder || p.account_holder || name,
        p.pan || '', p.gstin || '', p.state || 'Delhi', p.city || 'Delhi', p.pincode || '',
        p.fatherName || p.father_name || '', p.alternateMobile || p.alternate_mobile || '', parseInt(p.paymentTermsDays || p.payment_terms_days) || 15,
        openingBalance, balanceType
      ]);

      if (type === 'Buyer') {
        const accExists = await queryOne(`SELECT id FROM accounts WHERE tenant_id = ? AND party_name = ?`, [tenantId, name]);
        if (!accExists) {
          await run(`
            INSERT INTO accounts (id, tenant_id, party_name, short_code, contact, address, credit_limit, outstanding_udhaar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            'ACC-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900), tenantId, name, finalCode, (p.mobile || '').toString().trim(), (p.address || '').trim(),
            creditLimit, openingBalance
          ]);
        }
      }

      importedCount++;
    }

    await auditLog({
      tenantId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'IMPORT_PARTIES',
      entityType: 'party',
      entityId: null,
      details: `Batch imported ${importedCount} parties`,
      ipAddress: req.ip
    });

    res.json({ message: `Successfully imported ${importedCount} parties!`, importedCount });
  } catch (err) {
    res.status(500).json({ error: 'Party import failed: ' + err.message });
  }
});

router.put('/parties/:id', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { 
      shortCode, name, type, mobile, address, creditLimit,
      bankName, accountNo, ifsc, upiId, accountHolder,
      pan, gstin, state, city, pincode, fatherName, alternateMobile,
      paymentTermsDays, openingBalance, balanceType
    } = req.body;

    await run(`
      UPDATE parties SET
        short_code = COALESCE(?, short_code),
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        mobile = COALESCE(?, mobile),
        address = COALESCE(?, address),
        credit_limit = COALESCE(?, credit_limit),
        bank_name = COALESCE(?, bank_name),
        account_no = COALESCE(?, account_no),
        ifsc = COALESCE(?, ifsc),
        upi_id = COALESCE(?, upi_id),
        account_holder = COALESCE(?, account_holder),
        pan = COALESCE(?, pan),
        gstin = COALESCE(?, gstin),
        state = COALESCE(?, state),
        city = COALESCE(?, city),
        pincode = COALESCE(?, pincode),
        father_name = COALESCE(?, father_name),
        alternate_mobile = COALESCE(?, alternate_mobile),
        payment_terms_days = COALESCE(?, payment_terms_days),
        opening_balance = COALESCE(?, opening_balance),
        balance_type = COALESCE(?, balance_type)
      WHERE id = ? AND tenant_id = ?
    `, [
      shortCode ? shortCode.trim().toUpperCase() : null,
      name ? name.trim() : null,
      type || null,
      mobile || null,
      address || null,
      creditLimit !== undefined ? parseFloat(creditLimit) : null,
      bankName || null,
      accountNo || null,
      ifsc || null,
      upiId || null,
      accountHolder || null,
      pan || null,
      gstin || null,
      state || null,
      city || null,
      pincode || null,
      fatherName || null,
      alternateMobile || null,
      paymentTermsDays !== undefined ? parseInt(paymentTermsDays) : null,
      openingBalance !== undefined ? parseFloat(openingBalance) : null,
      balanceType || null,
      id,
      tenantId
    ]);

    // Update corresponding account if exists
    if (shortCode || name) {
      await run(`
        UPDATE accounts SET
          party_name = COALESCE(?, party_name),
          short_code = COALESCE(?, short_code),
          contact = COALESCE(?, contact),
          address = COALESCE(?, address),
          credit_limit = COALESCE(?, credit_limit)
        WHERE tenant_id = ? AND (short_code = ? OR party_name = ?)
      `, [
        name ? name.trim() : null,
        shortCode ? shortCode.trim().toUpperCase() : null,
        mobile || null,
        address || null,
        creditLimit !== undefined ? parseFloat(creditLimit) : null,
        tenantId,
        shortCode ? shortCode.trim().toUpperCase() : '',
        name ? name.trim() : ''
      ]);
    }

    await auditLog({
      tenantId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_PARTY',
      entityType: 'party',
      entityId: id,
      details: `Updated party ${name || id}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Party details updated successfully!', id });
  } catch (err) {
    res.status(500).json({ error: 'Could not update party: ' + err.message });
  }
});

router.delete('/parties/:id', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    await run(`DELETE FROM parties WHERE id = ? AND tenant_id = ?`, [req.params.id, tenantId]);

    await auditLog({
      tenantId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DELETE_PARTY',
      entityType: 'party',
      entityId: req.params.id,
      details: `Deleted party ID: ${req.params.id}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Party deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete party.' });
  }
});

// ================= 3. INWARD ARRIVALS (गाड़ी आवक) =================
router.get('/arrivals', authenticate, async (req, res) => {
  try {
    const list = await query(`SELECT * FROM arrivals WHERE tenant_id = ? ORDER BY date DESC, time DESC`, [req.user.tenantId]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch arrivals.' });
  }
});

router.post('/arrivals', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const truck = (req.body.truckNo || req.body.truck_no || '').trim().toUpperCase();
    const dName = req.body.driverName || req.body.driver_name || '';
    const dPhone = req.body.driverPhone || req.body.driver_mobile || '';
    const fName = req.body.farmerName || req.body.farmer_name || 'Farmer';
    const fPhone = req.body.farmerPhone || req.body.farmer_mobile || '';
    const fLoc = req.body.farmerLocation || req.body.source_location || '';
    const agentName = (req.body.agentName || req.body.agent_name || '').trim();
    const agentPhone = (req.body.agentPhone || req.body.agent_phone || '').trim();
    const comm = req.body.commodity || req.body.commodity_name || 'Produce';
    const varName = req.body.variety || '';
    const qty = parseInt(req.body.quantity || req.body.bags, 10) || 1;
    const u = req.body.unit || 'Box (20kg)';
    const totalF = parseFloat(req.body.totalFreight || req.body.freight_amount) || 0;
    const advF = parseFloat(req.body.freightAdvance || req.body.advance_paid) || 0;
    const balF = Math.max(0, totalF - advF);
    const arrRate = parseFloat(req.body.arrivalRate || req.body.arrival_rate) || 0;
    const totalArrAmount = qty * arrRate;
    const id = 'ARV-' + Math.floor(1000 + Math.random() * 9000);
    const manualLotNo = (req.body.manualLotNo || req.body.lotNumber || req.body.manual_lot_no || '').trim();
    const lotId = manualLotNo ? manualLotNo : ('LOT-' + id.replace('ARV-', ''));
    const customExpStr = req.body.customExpenses ? (typeof req.body.customExpenses === 'string' ? req.body.customExpenses : JSON.stringify(req.body.customExpenses)) : null;

    const entryDate = req.body.entryDate || req.body.date || new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    await run(`
      INSERT INTO arrivals (id, tenant_id, date, time, truck_no, driver_name, driver_phone, farmer_name, farmer_phone, farmer_location, commodity, variety, quantity, unit, total_freight, freight_advance_paid, freight_balance, arrival_rate, total_arrival_amount, status, transferred_to_lot, lot_id, manual_lot_no, custom_expenses, agent_name, agent_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ready for Sale', 1, ?, ?, ?, ?, ?)
    `, [
      id, tenantId, entryDate, currentTime, truck, dName, dPhone,
      fName, fPhone, fLoc, comm, varName,
      qty, u, totalF, advF, balF, arrRate, totalArrAmount, lotId,
      manualLotNo || null, customExpStr, agentName || null, agentPhone || null
    ]);

    // Create corresponding sales lot
    await run(`
      INSERT INTO sales_lots (id, tenant_id, arrival_id, commodity_name, variety, farmer_name, farmer_location, farmer_phone, total_quantity, remaining_quantity, unit, arrival_rate, truck_no, freight_advance_paid, custom_expenses, status, agent_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'live', ?)
    `, [
      lotId, tenantId, id, comm, varName, fName, fLoc,
      fPhone, qty, qty, u, arrRate, truck, advF, customExpStr, agentName || null
    ]);

    // If freight advance paid in cash, record in cashbook
    if (advF > 0) {
      await run(`
        INSERT INTO cash_transactions (id, tenant_id, type, title, amount, time)
        VALUES (?, ?, 'KHARCH', ?, ?, ?)
      `, ['TX-' + Date.now(), tenantId, `Driver Freight Advance (${truck} - ${fName})`, advF, currentTime]);
    }

    await auditLog({
      tenantId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CREATE_ARRIVAL',
      entityType: 'arrival',
      entityId: id,
      details: `Arrival logged: ${truck} - ${fName}${agentName ? ` (Agent: ${agentName})` : ''}, ${qty} ${u} of ${comm}, Lot #${lotId}, Date: ${entryDate}`,
      ipAddress: req.ip
    });

    res.status(201).json({ message: 'Truck arrival logged & Sales Lot created!', id, lotId, arrivalRate: arrRate, totalArrivalAmount: totalArrAmount, manualLotNo, entryDate });
  } catch (err) {
    res.status(500).json({ error: 'Could not log truck arrival: ' + err.message });
  }
});

// ================= 4. SALES LOTS & MULTI-BUYER SPLIT SALES =================
router.get('/lots', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const lots = await query(`SELECT * FROM sales_lots WHERE tenant_id = ? ORDER BY created_at DESC`, [tenantId]);
    
    // Fetch split sales for each lot
    for (let lot of lots) {
      lot.splitSales = await query(`SELECT * FROM split_sales WHERE lot_id = ?`, [lot.id]);
    }

    res.json(lots);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch sales lots.' });
  }
});

router.post('/lots/:id/split', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const lotId = req.params.id;
    const { buyerName, buyerContact, quantity, rate, paymentMode, customExpenses } = req.body;

    const lot = await queryOne(`SELECT * FROM sales_lots WHERE id = ? AND tenant_id = ?`, [lotId, tenantId]);
    if (!lot) return res.status(404).json({ error: 'Lot not found.' });

    const qty = parseInt(quantity !== undefined ? quantity : req.body.qty, 10) || 0;
    const r = parseFloat(rate) || 0;
    const lotArrRate = parseFloat(lot.arrival_rate) || 0;
    if (qty <= 0 || qty > lot.remaining_quantity) {
      return res.status(400).json({ error: `Quantity must be between 1 and ${lot.remaining_quantity}` });
    }

    const saleAmount = qty * r;
    const saleId = 'SL-' + Math.floor(100 + Math.random() * 900);
    const customExpStr = customExpenses ? (typeof customExpenses === 'string' ? customExpenses : JSON.stringify(customExpenses)) : null;

    const entryDate = req.body.entryDate || req.body.date || new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    // Insert split sale with date
    await run(`
      INSERT INTO split_sales (id, lot_id, tenant_id, sale_code, buyer_name, buyer_contact, quantity, rate, arrival_rate, gross_amount, time, payment_mode, custom_expenses, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [saleId, lotId, tenantId, saleId, buyerName, buyerContact || '', qty, r, lotArrRate, saleAmount, currentTime, paymentMode || 'Credit (7 Days)', customExpStr, entryDate]);

    // Update remaining lot quantity
    const newRemaining = lot.remaining_quantity - qty;
    const newStatus = newRemaining === 0 ? 'sold' : 'live';

    await run(`
      UPDATE sales_lots SET remaining_quantity = ?, status = ? WHERE id = ?
    `, [newRemaining, newStatus, lotId]);

    // Update Buyer Ledger debt
    await run(`
      UPDATE accounts SET 
        total_purchases = total_purchases + ?, 
        outstanding_udhaar = outstanding_udhaar + ? 
      WHERE tenant_id = ? AND party_name = ?
    `, [saleAmount, saleAmount, tenantId, buyerName]);

    // Automatic Balanced Double-Entry Journal Voucher (Dr = Cr)
    const autoVoucherNo = `JV-SL-${Date.now().toString().slice(-6)}`;
    await run(`
      INSERT INTO journal_entries (id, tenant_id, voucher_no, date, debit_account, credit_account, amount, narration, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'JV-' + Date.now(),
      tenantId,
      autoVoucherNo,
      entryDate,
      `Sundry Debtors - ${buyerName}`,
      `Sundry Creditors - ${lot.farmer_name || 'Farmer Produce'}`,
      saleAmount,
      `Lot Sale: ${qty} ${lot.unit || 'units'} of ${lot.commodity_name} (${lot.variety || 'Grade A'}) @ ₹${r}/unit [Lot #${lotId}]`,
      req.user.name || 'System Auto Trade'
    ]);

    await auditLog({
      tenantId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'SPLIT_SALE',
      entityType: 'split_sale',
      entityId: saleId,
      details: `Sale ${saleId} from Lot #${lotId}: ${qty} units to ${buyerName} @ ₹${r} (Total: ₹${saleAmount}), Date: ${entryDate}`,
      ipAddress: req.ip
    });

    res.json({ message: `Sold ${qty} units to ${buyerName} at ₹${r}! Journal Voucher ${autoVoucherNo} posted.`, saleId, remaining: newRemaining, voucherNo: autoVoucherNo });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record split sale: ' + err.message });
  }
});

// ================= 5. ATOMIC QUICK-TRADE (एकल सौदा) =================
router.post('/quick-trade', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { truckNo, farmerName, farmerPhone, commodity, variety, totalFreight, freightAdvance, lots, splitSales, arrivalRate, manualLotNo, customExpenses } = req.body;
    const agentName = (req.body.agentName || req.body.agent_name || '').trim();
    const agentPhone = (req.body.agentPhone || req.body.agent_phone || '').trim();
    const entryDate = req.body.entryDate || req.body.date || new Date().toISOString().split('T')[0];

    // 1. Sanitize and validate lots
    const rawLots = Array.isArray(lots) ? lots : [];
    let totalArrived = rawLots.reduce((acc, l) => acc + (parseInt(l.quantity !== undefined ? l.quantity : l.qty, 10) || 0), 0);

    // 2. Sanitize and validate split sales
    const rawSales = Array.isArray(splitSales) ? splitSales : [];
    const validSales = rawSales
      .map(s => {
        const qty = parseInt(s.quantity !== undefined ? s.quantity : s.qty, 10) || 0;
        const rate = parseFloat(s.rate) || 0;
        const bName = (s.buyerName || '').trim();
        return {
          ...s,
          buyerName: bName,
          quantity: qty,
          rate: rate,
          gross: qty * rate
        };
      })
      .filter(s => s.buyerName && s.quantity > 0);

    if (totalArrived <= 0 && validSales.length > 0) {
      totalArrived = validSales.reduce((sum, s) => sum + s.quantity, 0);
    }

    if (totalArrived <= 0) {
      return res.status(400).json({ error: 'Consignment total arrived quantity must be greater than 0.' });
    }

    if (validSales.length === 0) {
      return res.status(400).json({ error: 'Please specify at least one buyer sale with buyer name, quantity and rate.' });
    }

    const consignmentId = 'ARV-' + Math.floor(1000 + Math.random() * 9000);
    const customLot = (manualLotNo || (rawLots[0] && (rawLots[0].manualLotNo || rawLots[0].manual_lot_no)) || '').trim();
    const lotId = customLot ? customLot : ('LOT-' + consignmentId.replace('ARV-', ''));

    const totalF = parseFloat(totalFreight) || 0;
    const advF = parseFloat(freightAdvance) || 0;
    const arrRate = parseFloat(arrivalRate || (rawLots[0] && (rawLots[0].arrivalRate || rawLots[0].arrival_rate))) || 0;
    const totalArrAmount = totalArrived * arrRate;
    const customExpStr = customExpenses ? (typeof customExpenses === 'string' ? customExpenses : JSON.stringify(customExpenses)) : null;
    const selectedVariety = variety || (rawLots[0] && rawLots[0].variety) || '';

    const currentTime = new Date().toTimeString().split(' ')[0];

    // 1. Inward Arrival with agent and custom entryDate
    await run(`
      INSERT INTO arrivals (id, tenant_id, date, time, truck_no, farmer_name, farmer_phone, commodity, variety, quantity, total_freight, freight_advance_paid, freight_balance, arrival_rate, total_arrival_amount, status, transferred_to_lot, lot_id, manual_lot_no, custom_expenses, agent_name, agent_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Sold Out', 1, ?, ?, ?, ?, ?)
    `, [consignmentId, tenantId, entryDate, currentTime, (truckNo || 'LOCAL-TRUCK').toUpperCase(), farmerName || 'Produce Consignor', farmerPhone || '', commodity || 'Produce', selectedVariety, totalArrived, totalF, advF, Math.max(0, totalF - advF), arrRate, totalArrAmount, lotId, customLot || null, customExpStr, agentName || null, agentPhone || null]);

    // 2. Sales Lot
    await run(`
      INSERT INTO sales_lots (id, tenant_id, arrival_id, commodity_name, variety, farmer_name, total_quantity, remaining_quantity, arrival_rate, status, truck_no, freight_advance_paid, custom_expenses, agent_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'sold', ?, ?, ?, ?)
    `, [lotId, tenantId, consignmentId, commodity || 'Produce', selectedVariety, farmerName || 'Produce Consignor', totalArrived, arrRate, (truckNo || 'LOCAL-TRUCK').toUpperCase(), advF, customExpStr, agentName || null]);

    // 3. Buyer Split Sales, Ledgers & Auto Double-Entry Journal Vouchers
    const postedVouchers = [];
    for (let s of validSales) {
      const sId = 'SL-' + Math.floor(1000 + Math.random() * 9000);
      const gross = s.gross;
      const sExpStr = s.customExpenses ? (typeof s.customExpenses === 'string' ? s.customExpenses : JSON.stringify(s.customExpenses)) : null;

      await run(`
        INSERT INTO split_sales (id, lot_id, tenant_id, sale_code, buyer_name, buyer_contact, quantity, rate, arrival_rate, gross_amount, time, payment_mode, custom_expenses, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [sId, lotId, tenantId, sId, s.buyerName, s.buyerContact || '', s.quantity, s.rate, arrRate, gross, currentTime, s.paymentMode || 'Credit (7 Days)', sExpStr, entryDate]);

      // Update buyer ledger
      await run(`
        UPDATE accounts SET 
          total_purchases = total_purchases + ?, 
          outstanding_udhaar = outstanding_udhaar + ? 
        WHERE tenant_id = ? AND party_name = ?
      `, [gross, gross, tenantId, s.buyerName]);

      // Automatic Double Entry Journal Voucher (Dr = Cr)
      const autoVoucherNo = `JV-QT-${Date.now().toString().slice(-6)}`;
      await run(`
        INSERT INTO journal_entries (id, tenant_id, voucher_no, date, debit_account, credit_account, amount, narration, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'JV-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        tenantId,
        autoVoucherNo,
        entryDate,
        `Sundry Debtors - ${s.buyerName}`,
        `Sundry Creditors - ${farmerName || 'Farmer Produce'}`,
        gross,
        `Quick Trade Sale: ${s.quantity} units ${commodity || 'Produce'} (${selectedVariety || 'Standard'}) @ ₹${s.rate}/unit to ${s.buyerName} [Consignment #${consignmentId}]`,
        req.user.name || 'System Auto Trade'
      ]);
      postedVouchers.push(autoVoucherNo);
    }

    // 4. Log Driver Cash Advance in Rokad if paid
    if (advF > 0) {
      await run(`
        INSERT INTO cash_transactions (id, tenant_id, type, title, amount, time)
        VALUES (?, ?, 'KHARCH', ?, ?, ?)
      `, ['TX-' + Date.now(), tenantId, `Driver Freight Advance (${truckNo} / ${farmerName})`, advF, currentTime]);
    }

    await auditLog({
      tenantId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'QUICK_TRADE',
      entityType: 'arrival',
      entityId: consignmentId,
      details: `Quick trade consignment ${consignmentId} (Lot #${lotId}): ${totalArrived} units ${commodity || 'Produce'}${agentName ? ` (Agent: ${agentName})` : ''}, ${validSales.length} buyers, Date: ${entryDate}`,
      ipAddress: req.ip
    });

    res.status(201).json({
      message: `⚡ Consignment ${consignmentId} sealed & Teep finalized! Auto JV posted.`,
      consignmentId,
      lotId,
      totalArrived,
      arrivalRate: arrRate,
      totalArrivalAmount: totalArrAmount,
      postedVouchers,
      entryDate
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process quick trade: ' + err.message });
  }
});

// ================= 6. MANDI COMPREHENSIVE REPORTS =================
router.get('/reports/data', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { fromDate, toDate } = req.query;

    let arrivalQuery = `SELECT * FROM arrivals WHERE tenant_id = ?`;
    let arrivalParams = [tenantId];
    if (fromDate) {
      arrivalQuery += ` AND date >= ?`;
      arrivalParams.push(fromDate);
    }
    if (toDate) {
      arrivalQuery += ` AND date <= ?`;
      arrivalParams.push(toDate);
    }
    arrivalQuery += ` ORDER BY date DESC, time DESC`;
    const arrivals = await query(arrivalQuery, arrivalParams);

    // Fetch joined sales with lot information and margin
    let salesQuery = `
      SELECT 
        s.id,
        s.lot_id,
        s.sale_code,
        s.buyer_name,
        s.buyer_contact,
        s.quantity,
        s.rate,
        COALESCE(s.arrival_rate, l.arrival_rate, 0) as arrival_rate,
        (s.rate - COALESCE(s.arrival_rate, l.arrival_rate, 0)) as unit_margin,
        ((s.rate - COALESCE(s.arrival_rate, l.arrival_rate, 0)) * s.quantity) as gross_margin,
        s.gross_amount,
        s.time,
        s.payment_mode,
        s.created_at,
        l.commodity_name,
        l.variety,
        l.farmer_name,
        l.farmer_location,
        l.farmer_phone,
        l.truck_no,
        l.unit,
        l.freight_advance_paid
      FROM split_sales s
      JOIN sales_lots l ON s.lot_id = l.id
      WHERE s.tenant_id = ?
    `;
    let salesParams = [tenantId];
    if (fromDate) {
      salesQuery += ` AND DATE(s.created_at) >= ?`;
      salesParams.push(fromDate);
    }
    if (toDate) {
      salesQuery += ` AND DATE(s.created_at) <= ?`;
      salesParams.push(toDate);
    }
    salesQuery += ` ORDER BY s.created_at DESC`;
    const sales = await query(salesQuery, salesParams);

    const accounts = await query(`SELECT * FROM accounts WHERE tenant_id = ? ORDER BY party_name ASC`, [tenantId]);
    const parties = await query(`SELECT * FROM parties WHERE tenant_id = ? ORDER BY name ASC`, [tenantId]);

    res.json({
      arrivals,
      sales,
      accounts,
      parties
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports data: ' + err.message });
  }
});

// ================= 7. AUDIT LOGS (ऑडिट लॉग्स) =================
router.get('/audit-logs', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { fromDate, toDate, userId, action } = req.query;
    let q = `SELECT * FROM audit_logs WHERE tenant_id = ?`;
    const params = [tenantId];
    if (fromDate) {
      q += ` AND created_at >= ?`;
      params.push(fromDate + ' 00:00:00');
    }
    if (toDate) {
      q += ` AND created_at <= ?`;
      params.push(toDate + ' 23:59:59');
    }
    if (userId) {
      q += ` AND user_id = ?`;
      params.push(userId);
    }
    if (action) {
      q += ` AND action = ?`;
      params.push(action);
    }
    q += ` ORDER BY created_at DESC LIMIT 300`;
    const logs = await query(q, params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch audit logs: ' + err.message });
  }
});

module.exports = router;
