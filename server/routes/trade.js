const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../database/db');
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

    res.status(201).json({ message: 'Party registered successfully!', id, shortCode: cleanCode });
  } catch (err) {
    res.status(500).json({ error: 'Could not create party: ' + err.message });
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

    res.json({ message: 'Party details updated successfully!', id });
  } catch (err) {
    res.status(500).json({ error: 'Could not update party: ' + err.message });
  }
});

router.delete('/parties/:id', authenticate, async (req, res) => {
  try {
    await run(`DELETE FROM parties WHERE id = ? AND tenant_id = ?`, [req.params.id, req.user.tenantId]);
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
    const { truckNo, driverName, driverPhone, farmerName, farmerPhone, farmerLocation, commodity, variety, quantity, unit, totalFreight, freightAdvance } = req.body;

    const totalF = parseFloat(totalFreight) || 0;
    const advF = parseFloat(freightAdvance) || 0;
    const balF = Math.max(0, totalF - advF);
    const qty = parseInt(quantity) || 1;
    const id = 'ARV-' + Math.floor(1000 + Math.random() * 9000);
    const lotId = 'LOT-' + id.replace('ARV-', '');

    await run(`
      INSERT INTO arrivals (id, tenant_id, date, time, truck_no, driver_name, driver_phone, farmer_name, farmer_phone, farmer_location, commodity, variety, quantity, unit, total_freight, freight_advance_paid, freight_balance, status, transferred_to_lot, lot_id)
      VALUES (?, ?, DATE('now'), TIME('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ready for Sale', 1, ?)
    `, [
      id, tenantId, truckNo.toUpperCase(), driverName || '', driverPhone || '',
      farmerName, farmerPhone || '', farmerLocation || '', commodity, variety || '',
      qty, unit || 'Box (20kg)', totalF, advF, balF, lotId
    ]);

    // Create corresponding sales lot
    await run(`
      INSERT INTO sales_lots (id, tenant_id, arrival_id, commodity_name, variety, farmer_name, farmer_location, farmer_phone, total_quantity, remaining_quantity, unit, truck_no, freight_advance_paid, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'live')
    `, [
      lotId, tenantId, id, commodity, variety || '', farmerName, farmerLocation || '',
      farmerPhone || '', qty, qty, unit || 'Box (20kg)', truckNo.toUpperCase(), advF
    ]);

    res.status(201).json({ message: 'Truck arrival logged & Sales Lot created!', id, lotId });
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
    const { buyerName, buyerContact, quantity, rate, paymentMode } = req.body;

    const lot = await queryOne(`SELECT * FROM sales_lots WHERE id = ? AND tenant_id = ?`, [lotId, tenantId]);
    if (!lot) return res.status(404).json({ error: 'Lot not found.' });

    const qty = parseInt(quantity);
    const r = parseFloat(rate);
    if (qty <= 0 || qty > lot.remaining_quantity) {
      return res.status(400).json({ error: `Quantity must be between 1 and ${lot.remaining_quantity}` });
    }

    const saleAmount = qty * r;
    const saleId = 'SL-' + Math.floor(100 + Math.random() * 900);

    // Insert split sale
    await run(`
      INSERT INTO split_sales (id, lot_id, tenant_id, sale_code, buyer_name, buyer_contact, quantity, rate, gross_amount, time, payment_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TIME('now'), ?)
    `, [saleId, lotId, tenantId, saleId, buyerName, buyerContact || '', qty, r, saleAmount, paymentMode || 'Credit (7 Days)']);

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

    res.json({ message: `Sold ${qty} units to ${buyerName} at ₹${r}!`, saleId, remaining: newRemaining });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record split sale: ' + err.message });
  }
});

// ================= 5. ATOMIC QUICK-TRADE (एकल सौदा) =================
router.post('/quick-trade', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { truckNo, farmerName, farmerPhone, commodity, totalFreight, freightAdvance, lots, splitSales } = req.body;

    const totalArrived = (lots || []).reduce((acc, l) => acc + (parseInt(l.qty) || 0), 0);
    const consignmentId = 'ARV-' + Math.floor(1000 + Math.random() * 9000);
    const lotId = 'LOT-' + consignmentId.replace('ARV-', '');

    const totalF = parseFloat(totalFreight) || 0;
    const advF = parseFloat(freightAdvance) || 0;

    // 1. Inward Arrival
    await run(`
      INSERT INTO arrivals (id, tenant_id, date, time, truck_no, farmer_name, farmer_phone, commodity, quantity, total_freight, freight_advance_paid, freight_balance, status, transferred_to_lot, lot_id)
      VALUES (?, ?, DATE('now'), TIME('now'), ?, ?, ?, ?, ?, ?, ?, ?, 'Sold Out', 1, ?)
    `, [consignmentId, tenantId, truckNo.toUpperCase(), farmerName, farmerPhone || '', commodity, totalArrived, totalF, advF, Math.max(0, totalF - advF), lotId]);

    // 2. Sales Lot
    await run(`
      INSERT INTO sales_lots (id, tenant_id, arrival_id, commodity_name, farmer_name, total_quantity, remaining_quantity, status, truck_no, freight_advance_paid)
      VALUES (?, ?, ?, ?, ?, ?, 0, 'sold', ?, ?)
    `, [lotId, tenantId, consignmentId, commodity, farmerName, totalArrived, truckNo.toUpperCase(), advF]);

    // 3. Buyer Split Sales & Ledger Updates
    for (let s of (splitSales || [])) {
      const sId = 'SL-' + Math.floor(1000 + Math.random() * 9000);
      const gross = s.quantity * s.rate;

      await run(`
        INSERT INTO split_sales (id, lot_id, tenant_id, sale_code, buyer_name, buyer_contact, quantity, rate, gross_amount, time, payment_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TIME('now'), ?)
      `, [sId, lotId, tenantId, sId, s.buyerName, s.buyerContact || '', s.quantity, s.rate, gross, s.paymentMode || 'Credit (7 Days)']);

      // Update buyer ledger
      await run(`
        UPDATE accounts SET 
          total_purchases = total_purchases + ?, 
          outstanding_udhaar = outstanding_udhaar + ? 
        WHERE tenant_id = ? AND party_name = ?
      `, [gross, gross, tenantId, s.buyerName]);
    }

    // 4. Log Driver Cash Advance in Rokad if paid
    if (advF > 0) {
      await run(`
        INSERT INTO cash_transactions (id, tenant_id, type, title, amount, time)
        VALUES (?, ?, 'KHARCH', ?, ?, TIME('now'))
      `, ['TX-' + Date.now(), tenantId, `Driver Freight Advance (${truckNo} / ${farmerName})`, advF]);
    }

    res.status(201).json({
      message: `⚡ Consignment ${consignmentId} sealed & Teep finalized!`,
      consignmentId,
      lotId,
      totalArrived
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

    // Fetch joined sales with lot information
    let salesQuery = `
      SELECT 
        s.id,
        s.lot_id,
        s.sale_code,
        s.buyer_name,
        s.buyer_contact,
        s.quantity,
        s.rate,
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

module.exports = router;
