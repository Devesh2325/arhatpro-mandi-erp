const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../database/db');
const { authenticate } = require('../middleware/auth');

// 1. List Accessible Tenants for Current User (Strict Multi-Tenant Isolation)
router.get('/', authenticate, async (req, res) => {
  try {
    const { role, id, tenantId, isImpersonating } = req.user;

    // Super Admin auditing specific agency
    if (isImpersonating && tenantId) {
      const tenant = await query(`SELECT t.*, s.plan, s.valid_until, s.status as sub_status FROM tenants t LEFT JOIN subscriptions s ON t.id = s.tenant_id WHERE t.id = ?`, [tenantId]);
      return res.json(tenant);
    }

    // Platform Super Admin sees all
    if (role === 'super_admin') {
      const all = await query(`SELECT t.*, s.plan, s.valid_until, s.status as sub_status FROM tenants t LEFT JOIN subscriptions s ON t.id = s.tenant_id ORDER BY t.created_at DESC`);
      return res.json(all);
    }

    // Tenant Admin: sees agencies where they are owner
    if (role === 'shop_admin') {
      const owned = await query(`SELECT t.*, s.plan, s.valid_until, s.status as sub_status FROM tenants t LEFT JOIN subscriptions s ON t.id = s.tenant_id WHERE t.owner_user_id = ? OR t.id = ?`, [id, tenantId]);
      return res.json(owned);
    }

    // Staff member: strictly locked to their single shop
    const staffShop = await query(`SELECT t.*, s.plan, s.valid_until, s.status as sub_status FROM tenants t LEFT JOIN subscriptions s ON t.id = s.tenant_id WHERE t.id = ?`, [tenantId]);
    res.json(staffShop);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch agencies: ' + err.message });
  }
});

// 2. Get Single Tenant Info
router.get('/:id', authenticate, async (req, res) => {
  try {
    const tenant = await queryOne(
      `SELECT t.*, s.plan, s.valid_until, s.status as sub_status 
       FROM tenants t 
       LEFT JOIN subscriptions s ON t.id = s.tenant_id 
       WHERE t.id = ?`, 
      [req.params.id]
    );

    if (!tenant) return res.status(404).json({ error: 'Agency not found.' });

    // Isolation check: if not super admin and not matching tenant
    if (req.user.role !== 'super_admin' && tenant.owner_user_id !== req.user.id && req.user.tenantId !== tenant.id) {
      return res.status(403).json({ error: 'Access denied: You do not own this agency workspace.' });
    }

    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch agency details.' });
  }
});

// 3. Update White-Label Branding & Settings
router.put('/:id', authenticate, async (req, res) => {
  try {
    const tId = req.params.id;
    const {
      firm_name, hindi_name, tagline, proprietor, shop_no, mandi_name, apmc_license_no,
      gstin, phone, bank_name, account_no, ifsc, upi_id, standard_commission,
      palledari_rate_per_box, bill_format, bill_disclaimer, logo_icon, theme_color
    } = req.body;

    await run(`
      UPDATE tenants SET
        firm_name = COALESCE(?, firm_name),
        hindi_name = COALESCE(?, hindi_name),
        tagline = COALESCE(?, tagline),
        proprietor = COALESCE(?, proprietor),
        shop_no = COALESCE(?, shop_no),
        mandi_name = COALESCE(?, mandi_name),
        apmc_license_no = COALESCE(?, apmc_license_no),
        gstin = COALESCE(?, gstin),
        phone = COALESCE(?, phone),
        bank_name = COALESCE(?, bank_name),
        account_no = COALESCE(?, account_no),
        ifsc = COALESCE(?, ifsc),
        upi_id = COALESCE(?, upi_id),
        standard_commission = COALESCE(?, standard_commission),
        palledari_rate_per_box = COALESCE(?, palledari_rate_per_box),
        bill_format = COALESCE(?, bill_format),
        bill_disclaimer = COALESCE(?, bill_disclaimer),
        logo_icon = COALESCE(?, logo_icon),
        theme_color = COALESCE(?, theme_color)
      WHERE id = ?
    `, [
      firm_name, hindi_name, tagline, proprietor, shop_no, mandi_name, apmc_license_no,
      gstin, phone, bank_name, account_no, ifsc, upi_id, standard_commission,
      palledari_rate_per_box, bill_format, bill_disclaimer, logo_icon, theme_color,
      tId
    ]);

    const updated = await queryOne(`SELECT * FROM tenants WHERE id = ?`, [tId]);
    res.json({ message: 'White-Label branding and settings updated!', tenant: updated });
  } catch (err) {
    res.status(500).json({ error: 'Could not update settings: ' + err.message });
  }
});

// 4. Team & Staff List
router.get('/:id/team', authenticate, async (req, res) => {
  try {
    const members = await query(
      `SELECT id, tenant_id, name, email, phone, role, role_label, permissions, created_at 
       FROM users 
       WHERE tenant_id = ?`,
      [req.params.id]
    );
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch team members.' });
  }
});

// 5. Add Team Member (Munshi, Accountant, Cashier)
router.post('/:id/team', authenticate, async (req, res) => {
  try {
    const { name, role, phone, pin } = req.body;
    const tenantId = req.params.id;

    if (!name || !role || !phone) {
      return res.status(400).json({ error: 'Name, Role, and Mobile are required.' });
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const cleanPin = (pin || '1234').trim();

    // Check duplicate
    const existing = await queryOne(`SELECT id FROM users WHERE phone = ?`, [cleanPhone]);
    if (existing) {
      return res.status(409).json({ error: 'User with this mobile already exists.' });
    }

    const roleMap = {
      'Shop Admin': { code: 'shop_admin', label: 'मालिक / पार्टनर', perm: 'Full Control' },
      'Munshi (Data Entry)': { code: 'munshi', label: 'मुंशी / आवक-बिक्री', perm: 'Arrivals, Sales & Slips' },
      'Accountant (Cashier)': { code: 'accountant', label: 'मुनीम / रोकड़िया', perm: 'Bahi-Khata & Rokad' }
    };

    const rInfo = roleMap[role] || { code: 'munshi', label: 'स्टाफ सदस्य', perm: 'Standard Access' };
    const newStaffId = 'STAFF-' + Date.now();

    await run(`
      INSERT INTO users (id, tenant_id, name, email, phone, pin, password, role, role_label, permissions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newStaffId,
      tenantId,
      name.trim(),
      `${cleanPhone}@mandi.in`,
      cleanPhone,
      cleanPin,
      cleanPin,
      rInfo.code,
      role,
      rInfo.perm
    ]);

    res.status(201).json({
      message: `Staff member "${name}" added with role "${role}" and login enabled!`,
      member: {
        id: newStaffId,
        name: name.trim(),
        role: rInfo.code,
        role_label: role,
        phone: cleanPhone
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add staff member: ' + err.message });
  }
});

// 6. Delete Team Member
router.delete('/:id/team/:userId', authenticate, async (req, res) => {
  try {
    await run(`DELETE FROM users WHERE id = ? AND tenant_id = ?`, [req.params.userId, req.params.id]);
    res.json({ message: 'Staff member removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not remove staff member.' });
  }
});

module.exports = router;
