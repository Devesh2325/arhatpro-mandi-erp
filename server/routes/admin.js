const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');

// Require Super Admin for all endpoints in this router
router.use(authenticate);
router.use(requireRole('super_admin'));

// 1. Super Admin Overview Metrics
router.get('/metrics', async (req, res) => {
  try {
    const tenants = await query(`SELECT t.*, s.plan, s.status as sub_status FROM tenants t LEFT JOIN subscriptions s ON t.id = s.tenant_id`);
    const pendingReqs = await query(`SELECT COUNT(*) as count FROM pending_requests WHERE status = 'Pending'`);

    const totalAgencies = tenants.length;
    const activeAgencies = tenants.filter(t => t.status !== 'Suspended').length;
    const monthlyCount = tenants.filter(t => (t.plan || 'Monthly') === 'Monthly').length;
    const yearlyCount = tenants.filter(t => t.plan === 'Yearly').length;
    const enterpriseCount = tenants.filter(t => t.plan === 'Enterprise').length;

    // Estimated MRR calculation
    const mrr = (monthlyCount * 1999) + (yearlyCount * (19999 / 12)) + (enterpriseCount * (49999 / 12));

    res.json({
      totalAgencies,
      activeAgencies,
      monthlyCount,
      yearlyCount,
      enterpriseCount,
      estimatedMrr: Math.round(mrr),
      pendingCount: pendingReqs[0] ? pendingReqs[0].count : 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch admin metrics.' });
  }
});

// 2. All Tenants Directory
router.get('/tenants', async (req, res) => {
  try {
    const list = await query(`
      SELECT t.*, s.plan, s.valid_until, s.price, s.status as sub_status 
      FROM tenants t 
      LEFT JOIN subscriptions s ON t.id = s.tenant_id 
      ORDER BY t.created_at DESC
    `);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch tenants.' });
  }
});

// 3. Update Subscription Plan
router.put('/subscriptions/:tenantId', async (req, res) => {
  try {
    const { plan } = req.body;
    const tenantId = req.params.tenantId;

    const prices = { Monthly: 1999, Yearly: 19999, Enterprise: 49999 };
    const price = prices[plan] || 1999;

    await run(`
      UPDATE subscriptions SET plan = ?, price = ?, status = 'Active' WHERE tenant_id = ?
    `, [plan, price, tenantId]);

    res.json({ message: `Subscription for agency updated to ${plan} (₹${price.toLocaleString('en-IN')})!` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update subscription.' });
  }
});

// 4. Extend Subscription Validity
router.post('/subscriptions/:tenantId/extend', async (req, res) => {
  try {
    const { days } = req.body;
    const tenantId = req.params.tenantId;

    const sub = await queryOne(`SELECT * FROM subscriptions WHERE tenant_id = ?`, [tenantId]);
    let currentExpiry = sub && sub.valid_until ? new Date(sub.valid_until) : new Date();
    if (isNaN(currentExpiry.getTime()) || currentExpiry < new Date()) {
      currentExpiry = new Date();
    }

    currentExpiry.setDate(currentExpiry.getDate() + (parseInt(days) || 30));
    const newValidUntil = currentExpiry.toISOString().split('T')[0];

    await run(`
      UPDATE subscriptions SET valid_until = ?, status = 'Active' WHERE tenant_id = ?
    `, [newValidUntil, tenantId]);

    res.json({ message: `Extended subscription by +${days} days! Valid till: ${newValidUntil}`, newValidUntil });
  } catch (err) {
    res.status(500).json({ error: 'Failed to extend subscription.' });
  }
});

// 5. Toggle Agency Status (Active / Suspended)
router.put('/tenants/:tenantId/status', async (req, res) => {
  try {
    const tenantId = req.params.tenantId;
    const t = await queryOne(`SELECT status FROM tenants WHERE id = ?`, [tenantId]);
    if (!t) return res.status(404).json({ error: 'Agency not found.' });

    const newStatus = t.status === 'Suspended' ? 'Active' : 'Suspended';
    await run(`UPDATE tenants SET status = ? WHERE id = ?`, [newStatus, tenantId]);
    await run(`UPDATE subscriptions SET status = ? WHERE tenant_id = ?`, [newStatus, tenantId]);

    res.json({ message: `Agency status changed to ${newStatus}.`, newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle agency status.' });
  }
});

// 6. Pending Access Applications
router.get('/requests', async (req, res) => {
  try {
    const list = await query(`SELECT * FROM pending_requests WHERE status = 'Pending' ORDER BY requested_at DESC`);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch requests.' });
  }
});

// 7. Approve Access Request
router.post('/requests/:id/approve', async (req, res) => {
  try {
    const reqItem = await queryOne(`SELECT * FROM pending_requests WHERE id = ?`, [req.params.id]);
    if (!reqItem) return res.status(404).json({ error: 'Request not found.' });

    const tenantId = 'tenant-' + Date.now();
    const userId = 'usr-' + Date.now();

    const now = new Date();
    now.setDate(now.getDate() + 30);
    const validUntil = now.toISOString().split('T')[0];

    // Create Tenant
    await run(`
      INSERT INTO tenants (id, firm_name, proprietor, shop_no, mandi_name, apmc_license_no, phone, theme_color, status, owner_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'emerald', 'Active', ?)
    `, [tenantId, reqItem.firm_name, reqItem.proprietor, reqItem.shop_no, reqItem.mandi_name, reqItem.apmc_license_no, reqItem.phone, userId]);

    // Create Subscription
    await run(`
      INSERT INTO subscriptions (id, tenant_id, plan, status, valid_until, price)
      VALUES (?, ?, 'Monthly', 'Active', ?, 1999)
    `, ['sub-' + Date.now(), tenantId, validUntil]);

    // Create Shop Admin User
    await run(`
      INSERT INTO users (id, tenant_id, name, email, phone, pin, password, role, role_label, permissions)
      VALUES (?, ?, ?, ?, ?, '1234', '1234', 'shop_admin', 'Agency Owner / Partner', 'Full Control')
    `, [userId, tenantId, `${reqItem.proprietor} (${reqItem.firm_name})`, `${reqItem.phone}@mandi.in`, reqItem.phone]);

    // Update request status
    await run(`UPDATE pending_requests SET status = 'Approved' WHERE id = ?`, [req.params.id]);

    res.json({ message: `Approved! Workspace for "${reqItem.firm_name}" is live.`, tenantId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve application: ' + err.message });
  }
});

module.exports = router;
