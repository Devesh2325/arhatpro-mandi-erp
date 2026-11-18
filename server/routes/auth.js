const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { queryOne, query, run } = require('../database/db');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

// 1. User Login (Email or Phone + PIN/Password)
router.post('/login', async (req, res) => {
  try {
    const { identifier, pinOrPassword } = req.body;
    if (!identifier || !pinOrPassword) {
      return res.status(400).json({ error: 'Identifier (Email/Phone) and PIN/Password are required.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const digitsOnly = identifier.replace(/[^0-9]/g, '');
    const cleanSecret = pinOrPassword.trim();

    // Look up user by Email, Phone, Digits-only Phone, or ID
    let user = await queryOne(
      `SELECT u.*, t.firm_name, t.shop_no, t.theme_color 
       FROM users u 
       LEFT JOIN tenants t ON u.tenant_id = t.id 
       WHERE LOWER(u.email) = ? OR u.phone = ? OR (LENGTH(?) >= 5 AND u.phone LIKE '%' || ? || '%') OR u.id = ?`,
      [cleanId, cleanId, digitsOnly, digitsOnly, cleanId]
    );

    if (!user) {
      return res.status(401).json({ error: 'Account not found. Please check your Email / Mobile Number.' });
    }

    const isPinMatch = user.pin && (user.pin.trim() === cleanSecret);
    const isPassMatch = user.password && (user.password.trim() === cleanSecret);

    if (!isPinMatch && !isPassMatch) {
      return res.status(401).json({ error: 'Incorrect PIN or Password. Please check and try again.' });
    }

    // Strict Super Admin Check: Only dmchaturvedi@gmail.com can be super_admin
    if (user.role === 'super_admin' && user.email !== 'dmchaturvedi@gmail.com' && user.id !== 'usr-superadmin') {
      return res.status(403).json({ error: 'Security Exception: Unauthorized Super Admin role.' });
    }

    // Sign JWT
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        roleLabel: user.role_label,
        tenantId: user.tenant_id,
        isImpersonating: false
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        roleLabel: user.role_label,
        tenantId: user.tenant_id,
        firmName: user.firm_name,
        themeColor: user.theme_color || 'emerald'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// 2. Self-Serve Tenant Admin Sign-Up (नया आढ़त खाता)
router.post('/signup', async (req, res) => {
  try {
    const { firmName, proprietor, phone, pin, shopNo, mandiName, apmcLicenseNo, theme, businessType, logoIcon } = req.body;

    if (!firmName || !proprietor || !phone) {
      return res.status(400).json({ error: 'Firm Name, Proprietor Name, and Mobile are required.' });
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const cleanPin = (pin || '1234').trim();
    const bType = businessType || 'fruit_vegetable';
    const icon = logoIcon || (bType === 'banana_store' ? '🍌' : bType === 'cold_storage' ? '🥔' : bType === 'grain_mandi' ? '🌾' : '🍎');

    // Check if phone already registered
    const existing = await queryOne(`SELECT id FROM users WHERE phone = ?`, [cleanPhone]);
    if (existing) {
      return res.status(409).json({ error: `Mobile number ${cleanPhone} is already registered. Please login.` });
    }

    const tenantId = 'tenant-' + Date.now();
    const userId = 'usr-' + Date.now();

    // 30 days monthly plan default
    const now = new Date();
    now.setDate(now.getDate() + 30);
    const validUntil = now.toISOString().split('T')[0];

    // Create Tenant
    await run(`
      INSERT INTO tenants (id, firm_name, proprietor, shop_no, mandi_name, apmc_license_no, phone, theme_color, status, owner_user_id, business_type, logo_icon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)
    `, [
      tenantId,
      firmName.trim(),
      proprietor.trim(),
      shopNo ? shopNo.trim() : 'Shop No. 1, Mandi',
      mandiName ? mandiName.trim() : 'Azadpur Mandi, Delhi',
      apmcLicenseNo ? apmcLicenseNo.trim() : `APMC-${Math.floor(1000 + Math.random() * 9000)}`,
      cleanPhone,
      theme || (bType === 'banana_store' ? 'amber' : bType === 'cold_storage' ? 'slate' : 'emerald'),
      userId,
      bType,
      icon
    ]);

    // Create Subscription
    await run(`
      INSERT INTO subscriptions (id, tenant_id, plan, status, valid_until, price)
      VALUES (?, ?, 'Monthly', 'Active', ?, 1999)
    `, ['sub-' + Date.now(), tenantId, validUntil]);

    // Create Tenant Admin User (shop_admin)
    await run(`
      INSERT INTO users (id, tenant_id, name, email, phone, pin, password, role, role_label, permissions)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'shop_admin', 'Agency Owner / Partner', 'Full Control')
    `, [
      userId,
      tenantId,
      `${proprietor.trim()} (${firmName.trim()})`,
      `${cleanPhone}@mandi.in`,
      cleanPhone,
      cleanPin,
      cleanPin
    ]);

    // Seed tailored commodities based on business type
    if (bType === 'banana_store') {
      await run(`
        INSERT INTO commodities (id, tenant_id, name_en, name_hi, category, default_unit, unit_weight_kg, tare_deduction_kg, standard_commission_pct, palledari_rate_per_unit, active)
        VALUES 
          (?, ?, 'Banana - Grand Naine (G9)', 'केला - जी9 सुपर', 'Fruit', 'Crate (20kg)', 20, 1.5, 3.0, 8, 1),
          (?, ?, 'Banana - Robusta Premium', 'केला - रोबस्टा', 'Fruit', 'Crate (15kg)', 15, 1.0, 3.0, 7, 1),
          (?, ?, 'Banana - Elaichi / Yellaki', 'केला - इलायची', 'Fruit', 'Crate (12kg)', 12, 1.0, 3.5, 6, 1),
          (?, ?, 'Banana Raw Green Bunches', 'कच्चा केला - लंगर/घहर', 'Fruit', 'Bunch (घहर)', 25, 0.0, 3.0, 10, 1)
      `, [
        'COMM-' + Date.now() + '-1', tenantId,
        'COMM-' + Date.now() + '-2', tenantId,
        'COMM-' + Date.now() + '-3', tenantId,
        'COMM-' + Date.now() + '-4', tenantId
      ]);
    } else if (bType === 'cold_storage') {
      await run(`
        INSERT INTO commodities (id, tenant_id, name_en, name_hi, category, default_unit, unit_weight_kg, tare_deduction_kg, standard_commission_pct, palledari_rate_per_unit, active)
        VALUES 
          (?, ?, 'Potato - Kufri Pukhraj', 'आलू - पुखराज', 'Vegetable', 'Sack (50kg)', 50, 1.0, 2.0, 10, 1),
          (?, ?, 'Potato - Kufri Jyoti 3797', 'आलू - 3797 ज्योति', 'Vegetable', 'Sack (50kg)', 50, 1.0, 2.0, 10, 1),
          (?, ?, 'Potato - Chipsona Premium', 'आलू - चिप्सोना', 'Vegetable', 'Sack (50kg)', 50, 1.0, 2.5, 10, 1)
      `, [
        'COMM-' + Date.now() + '-1', tenantId,
        'COMM-' + Date.now() + '-2', tenantId,
        'COMM-' + Date.now() + '-3', tenantId
      ]);
    } else if (bType === 'grain_mandi') {
      await run(`
        INSERT INTO commodities (id, tenant_id, name_en, name_hi, category, default_unit, unit_weight_kg, tare_deduction_kg, standard_commission_pct, palledari_rate_per_unit, active)
        VALUES 
          (?, ?, 'Wheat - Sharbati Premium', 'गेहूं - शरबती उत्तम', 'Grain', 'Quintal (क्विंटल)', 100, 0.5, 2.5, 15, 1),
          (?, ?, 'Paddy - Basmati 1121', 'धान - बासमती 1121', 'Grain', 'Quintal (क्विंटल)', 100, 0.5, 2.5, 15, 1)
      `, [
        'COMM-' + Date.now() + '-1', tenantId,
        'COMM-' + Date.now() + '-2', tenantId
      ]);
    } else {
      await run(`
        INSERT INTO commodities (id, tenant_id, name_en, name_hi, category, default_unit, unit_weight_kg, tare_deduction_kg, standard_commission_pct, palledari_rate_per_unit, active)
        VALUES 
          (?, ?, 'Apple - Royal Delicious', 'सेब - रॉयल', 'Fruit', 'Box (20kg)', 20, 1.5, 2.5, 12, 1),
          (?, ?, 'Pomegranate - Solapur Bhagwa', 'अनार - भगवा', 'Fruit', 'Crate (10kg)', 10, 0.8, 3.0, 8, 1),
          (?, ?, 'Onion - Red Garwa', 'प्याज - लाल गरवा', 'Vegetable', 'Sack (50kg)', 50, 1.0, 2.0, 8, 1)
      `, [
        'COMM-' + Date.now() + '-1', tenantId,
        'COMM-' + Date.now() + '-2', tenantId,
        'COMM-' + Date.now() + '-3', tenantId
      ]);
    }

    // Seed starter parties
    await run(`
      INSERT INTO parties (id, tenant_id, short_code, name, type, mobile, address, credit_limit, current_balance)
      VALUES 
        (?, ?, 'AGW', 'Aggarwal Wholesale Mart', 'Buyer', '+91 98110 55432', 'Shop 14, Mandi Yard', 200000, 0),
        (?, ?, 'NEG', 'Harish Negi', 'Farmer', '+91 98160 44321', 'Kotkhai, Shimla (HP)', 0, 0)
    `, [
      'P-' + Date.now() + '-1', tenantId,
      'P-' + Date.now() + '-2', tenantId
    ]);

    // Sign JWT
    const token = jwt.sign(
      {
        id: userId,
        name: `${proprietor.trim()} (${firmName.trim()})`,
        email: `${cleanPhone}@mandi.in`,
        phone: cleanPhone,
        role: 'shop_admin',
        roleLabel: 'Agency Owner / Partner',
        tenantId: tenantId,
        isImpersonating: false
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: `🎉 Agency "${firmName}" created! Welcome, ${proprietor}!`,
      token,
      tenantId,
      user: {
        id: userId,
        name: `${proprietor.trim()} (${firmName.trim()})`,
        phone: cleanPhone,
        role: 'shop_admin',
        roleLabel: 'Agency Owner / Partner',
        tenantId,
        firmName
      }
    });
  } catch (err) {
    console.error('Sign-up error:', err);
    res.status(500).json({ error: 'Failed to provision agency workspace: ' + err.message });
  }
});

// 3. Start Super Admin View-Only Impersonation
router.post('/impersonate/start', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied: Only Platform Super Admin can impersonate agencies.' });
    }

    const { targetTenantId } = req.body;
    const targetTenant = await queryOne(`SELECT * FROM tenants WHERE id = ?`, [targetTenantId]);
    if (!targetTenant) {
      return res.status(404).json({ error: 'Target agency not found.' });
    }

    // Sign impersonation token with isImpersonating flag set to true
    const token = jwt.sign(
      {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: 'super_admin',
        tenantId: targetTenantId,
        isImpersonating: true,
        auditedFirmName: targetTenant.firm_name
      },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({
      message: `Entered View-Only Audit Mode for "${targetTenant.firm_name}". Mutations locked.`,
      token,
      targetTenant
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not initiate impersonation.' });
  }
});

// 4. Stop Impersonation
router.post('/impersonate/stop', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    // Restore standard Super Admin token
    const token = jwt.sign(
      {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: 'super_admin',
        tenantId: null,
        isImpersonating: false
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Exited View-Only Audit Mode. Restored Platform Super Admin context.',
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not exit impersonation.' });
  }
});

// 5. Get Active Profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await queryOne(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    let tenant = null;
    let subscription = null;

    if (req.user.tenantId) {
      tenant = await queryOne(`SELECT * FROM tenants WHERE id = ?`, [req.user.tenantId]);
      subscription = await queryOne(`SELECT * FROM subscriptions WHERE tenant_id = ?`, [req.user.tenantId]);
    }

    res.json({
      user,
      tenant,
      subscription,
      isImpersonating: req.user.isImpersonating || false
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch profile.' });
  }
});

// 6. Get Public Demo & Testing Mandis
router.get('/demo-mandis', async (req, res) => {
  try {
    const list = await query(`
      SELECT 
        t.id, t.firm_name, t.hindi_name, t.mandi_name, t.shop_no, t.logo_icon, 
        t.business_type, t.theme_color,
        u.phone as demo_phone, u.name as demo_user
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'shop_admin'
      WHERE t.id IN (
        'tenant-banana-store', 
        'tenant-cold-storage', 
        'tenant-rat', 
        'tenant-vashi-apmc', 
        'tenant-kolar-yard', 
        'tenant-punjab-grain'
      )
      ORDER BY t.created_at ASC
    `);

    // Add super admin demo card
    const demoCards = [
      {
        id: 'super-admin',
        firm_name: 'Platform Super Admin Console',
        hindi_name: 'सुपर एडमिन कंसोल',
        mandi_name: 'National APMC Network Overview',
        shop_no: 'Headquarters',
        logo_icon: '👑',
        business_type: 'super_admin',
        theme_color: 'purple',
        demo_phone: 'dmchaturvedi@gmail.com',
        demo_user: 'Devesh Chaturvedi',
        pin: 'Devesh@23251995',
        badge: 'Master Control'
      },
      ...list.map(m => ({
        ...m,
        pin: '1234',
        badge: m.business_type === 'banana_store' ? '🍌 Banana & Crates' :
               m.business_type === 'cold_storage' ? '❄️ Cold Storage' :
               m.business_type === 'grain_mandi' ? '🌾 Grain Mandi' : '🍎 APMC Yard'
      }))
    ];

    res.json(demoCards);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch demo mandis: ' + err.message });
  }
});

module.exports = router;
