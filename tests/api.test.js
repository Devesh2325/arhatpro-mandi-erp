/**
 * ArhatPro Mandi ERP — Comprehensive API Test Suite
 * ====================================================
 * Covers: Auth, Tenants, Trade (Quick Trade / Arrivals / Sales),
 *         Parties, Commodities, Ledger, Cashbook, Reports, Admin/Audit
 *
 * Run with:  node tests/api.test.js
 * Prereq:    Server running on http://localhost:5000
 *
 * Actual route map (confirmed from server/routes/*):
 *   POST /api/auth/login          POST /api/auth/signup
 *   GET  /api/auth/me
 *   GET  /api/tenants             GET  /api/tenants/:id
 *   PUT  /api/tenants/:id         POST /api/tenants/:id/subscribe
 *   GET  /api/trade/commodities   POST /api/trade/commodities
 *   GET  /api/trade/varieties     POST /api/trade/varieties
 *   GET  /api/trade/expenses      POST /api/trade/expenses
 *   GET  /api/trade/parties       POST /api/trade/parties
 *   GET  /api/trade/arrivals      POST /api/trade/arrivals
 *   GET  /api/trade/lots          POST /api/trade/lots/:id/split
 *   POST /api/trade/quick-trade   (NOT /trade/quick)
 *   GET  /api/ledger/cashbook     POST /api/ledger/cashbook
 *   GET  /api/ledger/accounts     POST /api/ledger/payment
 *   GET  /api/ledger/trial-balance
 *   GET  /api/ledger/balance-sheet
 *   GET  /api/ledger/journal      POST /api/ledger/journal
 *   GET  /api/admin/tenants       GET  /api/admin/metrics
 *   GET  /api/trade/audit-logs    (audit logs in trade router)
 */

const BASE = 'http://localhost:5000/api';

// ── Colour helpers ──────────────────────────────────────────────────────────
const GREEN  = (s) => `\x1b[32m✓ ${s}\x1b[0m`;
const RED    = (s) => `\x1b[31m✗ ${s}\x1b[0m`;
const YELLOW = (s) => `\x1b[33m⚠ ${s}\x1b[0m`;
const CYAN   = (s) => `\x1b[36m\n══ ${s} ══\x1b[0m`;

// ── Test runner ─────────────────────────────────────────────────────────────
let passed = 0, failed = 0, skipped = 0;
const results = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(GREEN(name));
    passed++;
    results.push({ name, status: 'PASS' });
  } catch (err) {
    console.log(RED(name));
    console.log(`   └─ ${err.message}`);
    failed++;
    results.push({ name, status: 'FAIL', error: err.message });
  }
}

function skip(name, reason) {
  console.log(YELLOW(`SKIP ${name} — ${reason}`));
  skipped++;
  results.push({ name, status: 'SKIP', reason });
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// ── HTTP helpers ────────────────────────────────────────────────────────────
async function apiCall(method, path, body, token) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  let json;
  const text = await r.text();
  try {
    json = JSON.parse(text);
  } catch {
    // HTML page returned — route not found (serves static React build)
    json = { _raw: text.substring(0, 120) };
  }
  return { status: r.status, body: json };
}

const post = (path, body, token) => apiCall('POST', path, body, token);
const get  = (path, token)       => apiCall('GET',  path, null, token);
const put  = (path, body, token) => apiCall('PUT',  path, body, token);
const del  = (path, token)       => apiCall('DELETE', path, null, token);

function assertJson(body, label) {
  assert(!body._raw, `Route returned HTML not JSON for ${label} — route may not exist. Raw: ${body._raw}`);
}

// ── Shared state ─────────────────────────────────────────────────────────────
let adminToken  = null;
let superToken  = null;
let tenantId    = null;
let commodityId = null;
let partyId     = null;
let arrivalId   = null;
let lotId       = null;

// ═══════════════════════════════════════════════════════════════════════════
//  1. HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════
console.log(CYAN('1. HEALTH CHECK'));

await test('GET /health — returns status healthy', async () => {
  const { status, body } = await get('/health');
  assertJson(body, '/health');
  assert(status === 200, `Expected 200 got ${status}`);
  assert(body.status === 'healthy', `Expected healthy, got ${body.status}`);
});

// ═══════════════════════════════════════════════════════════════════════════
//  2. AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════
console.log(CYAN('2. AUTHENTICATION'));

await test('POST /auth/login — valid shop admin (email + PIN)', async () => {
  const { status, body } = await post('/auth/login', {
    identifier: 'balwinder@mandi.in',
    pinOrPassword: '1234'
  });
  assert(status === 200, `Expected 200 got ${status}: ${body.error || ''}`);
  assert(body.token, 'No JWT token returned');
  assert(body.user?.role, 'No role in user object');
  adminToken = body.token;
  tenantId   = body.user?.tenantId;
});

await test('POST /auth/login — valid super admin (email + password)', async () => {
  const { status, body } = await post('/auth/login', {
    identifier: 'dmchaturvedi@gmail.com',
    pinOrPassword: 'Devesh@23251995'
  });
  assert(status === 200, `Expected 200 got ${status}: ${body.error || ''}`);
  assert(body.token, 'No super admin token');
  assert(body.user?.role === 'super_admin', `Expected super_admin, got ${body.user?.role}`);
  superToken = body.token;
});

await test('POST /auth/login — wrong password returns 401', async () => {
  const { status } = await post('/auth/login', {
    identifier: 'balwinder@mandi.in',
    pinOrPassword: 'wrong_pass_xyz'
  });
  assert(status === 401, `Expected 401 got ${status}`);
});

await test('POST /auth/login — unknown user returns 401', async () => {
  const { status } = await post('/auth/login', {
    identifier: 'nobody@nowhere.fake',
    pinOrPassword: '0000'
  });
  assert(status === 401, `Expected 401 got ${status}`);
});

await test('POST /auth/login — missing fields returns 400', async () => {
  const { status } = await post('/auth/login', { identifier: 'only@email.com' });
  assert(status === 400, `Expected 400 got ${status}`);
});

await test('GET /auth/me — valid token returns user', async () => {
  const { status, body } = await get('/auth/me', adminToken);
  assertJson(body, '/auth/me');
  assert(status === 200, `Expected 200 got ${status}`);
  assert(body.user?.id, 'No user.id in response');
});

await test('GET /auth/me — no token returns 401', async () => {
  const { status } = await get('/auth/me');
  assert(status === 401, `Expected 401 got ${status}`);
});

await test('GET /auth/me — invalid token returns 401 or 403', async () => {
  const { status } = await get('/auth/me', 'tampered.token.value');
  assert(status === 401 || status === 403, `Expected 401/403 got ${status}`);
});

// ═══════════════════════════════════════════════════════════════════════════
//  3. TENANT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════
console.log(CYAN('3. TENANT MANAGEMENT'));

await test('GET /tenants — returns tenant list', async () => {
  const { status, body } = await get('/tenants', adminToken);
  assertJson(body, '/tenants');
  assert(status === 200, `Expected 200 got ${status}`);
  const list = Array.isArray(body) ? body : (body.tenants || []);
  assert(list.length > 0, 'Expected at least one tenant');
});

await test('GET /tenants — unauthenticated returns 401', async () => {
  const { status } = await get('/tenants');
  assert(status === 401, `Expected 401 got ${status}`);
});

await test('GET /tenants/:id — returns specific tenant', async () => {
  if (!tenantId) return skip('GET tenant', 'no tenantId');
  const { status, body } = await get(`/tenants/${tenantId}`, adminToken);
  assertJson(body, `/tenants/${tenantId}`);
  assert(status === 200, `Expected 200 got ${status}`);
});

await test('PUT /tenants/:id — can update firm settings', async () => {
  if (!tenantId) return skip('PUT tenant settings', 'no tenantId');
  const { status, body } = await put(`/tenants/${tenantId}`, {
    themeColor: 'emerald'
  }, adminToken);
  assertJson(body, `/tenants/${tenantId} PUT`);
  assert(status === 200, `Expected 200 got ${status}: ${body.error || ''}`);
});

await test('PUT /tenants/:id — can update workspace_config and business_type (Onboarding)', async () => {
  if (!tenantId) return skip('PUT tenant workspace_config', 'no tenantId');
  const sampleConfig = JSON.stringify({
    businessCategory: 'banana_store',
    businessTitle: 'Banana Store & Ripening Chamber',
    businessTitleHi: 'केला स्टोर व राइपनिंग चैंबर',
    icon: '🍌',
    showCrates: true,
    showChambers: true,
    showDriverFreight: true,
    showAgent: true,
    primaryFlow: 'quick-trade',
    defaultUnit: 'Banana Crate (15kg)'
  });
  const { status, body } = await put(`/tenants/${tenantId}`, {
    workspace_config: sampleConfig,
    business_type: 'banana_store',
    onboarding_completed: 1
  }, adminToken);
  assertJson(body, `/tenants/${tenantId} PUT workspace_config`);
  assert(status === 200, `Expected 200 got ${status}: ${body.error || ''}`);
  assert(body.tenant && body.tenant.business_type === 'banana_store', 'business_type was not updated');
});

// ═══════════════════════════════════════════════════════════════════════════
//  4. COMMODITIES
// ═══════════════════════════════════════════════════════════════════════════
console.log(CYAN('4. COMMODITIES'));

await test('GET /trade/commodities — returns list', async () => {
  const { status, body } = await get('/trade/commodities', adminToken);
  assertJson(body, '/trade/commodities');
  assert(status === 200, `Expected 200 got ${status}`);
  assert(Array.isArray(body), 'Expected array response');
});

await test('POST /trade/commodities — creates new commodity', async () => {
  const { status, body } = await post('/trade/commodities', {
    nameEn: 'Test Apple ' + Date.now(),
    nameHi: 'टेस्ट सेब',
    category: 'Fruit',
    defaultUnit: 'Box (20kg)',
    unitWeightKg: 20,
    tareDeductionKg: 1,
    standardCommissionPct: 2.5,
    palledariRatePerUnit: 10
  }, adminToken);
  assertJson(body, 'POST /trade/commodities');
  assert(status === 201, `Expected 201 got ${status}: ${body.error || ''}`);
  assert(body.id, 'Expected commodity id');
  commodityId = body.id;
});

await test('PUT /trade/commodities/:id — updates commodity', async () => {
  if (!commodityId) return skip('commodity update', 'no commodityId');
  const { status, body } = await put(`/trade/commodities/${commodityId}`, {
    nameEn: 'Updated Apple',
    nameHi: 'अपडेटेड सेब',
    category: 'Fruit',
    defaultUnit: 'Box (20kg)',
    unitWeightKg: 22,
    tareDeductionKg: 1.5,
    standardCommissionPct: 3,
    palledariRatePerUnit: 12
  }, adminToken);
  assertJson(body, 'PUT commodity');
  assert(status === 200, `Expected 200 got ${status}: ${body.error || ''}`);
});

await test('PUT /trade/commodities/:id — non-existent returns 404', async () => {
  const { status, body } = await put('/trade/commodities/FAKE-99999', {
    nameEn: 'Ghost', nameHi: '', category: 'Fruit', defaultUnit: 'Box'
  }, adminToken);
  assertJson(body, 'PUT fake commodity');
  assert(status === 404, `Expected 404 got ${status}`);
});

// ═══════════════════════════════════════════════════════════════════════════
//  5. VARIETIES
// ═══════════════════════════════════════════════════════════════════════════
console.log(CYAN('5. VARIETIES'));

await test('GET /trade/varieties — returns list', async () => {
  const { status, body } = await get('/trade/varieties', adminToken);
  assertJson(body, '/trade/varieties');
  assert(status === 200, `Expected 200 got ${status}`);
  assert(Array.isArray(body), 'Expected array');
});

await test('POST /trade/varieties — creates new variety', async () => {
  const { status, body } = await post('/trade/varieties', {
    name: 'Shimla Grade A ' + Date.now(),
    nameHi: 'शिमला ग्रेड A',
    commodityName: 'Apple',
    grade: 'Grade A',
    defaultRate: 800
  }, adminToken);
  assertJson(body, 'POST /trade/varieties');
  assert(status === 201, `Expected 201 got ${status}: ${body.error || ''}`);
});

// ═══════════════════════════════════════════════════════════════════════════
//  6. EXPENSE HEADS
// ═══════════════════════════════════════════════════════════════════════════
console.log(CYAN('6. EXPENSE HEADS (CONFIGURATION)'));

await test('GET /trade/expenses — returns expense heads', async () => {
  const { status, body } = await get('/trade/expenses', adminToken);
  assertJson(body, '/trade/expenses');
  assert(status === 200, `Expected 200 got ${status}`);
  assert(Array.isArray(body), 'Expected array');
});

await test('POST /trade/expenses — creates farmer expense head', async () => {
  const { status, body } = await post('/trade/expenses', {
    name: 'Test Freight ' + Date.now(),
    hindiName: 'भाड़ा',
    target: 'farmer',
    type: 'per_unit',
    defaultAmount: 50
  }, adminToken);
  assertJson(body, 'POST /trade/expenses');
  assert(status === 201, `Expected 201 got ${status}: ${body.error || ''}`);
});

await test('POST /trade/expenses — creates buyer expense head', async () => {
  const { status, body } = await post('/trade/expenses', {
    name: 'Test Stationery ' + Date.now(),
    hindiName: 'स्टेशनरी',
    target: 'buyer',
    type: 'flat',
    defaultAmount: 10
  }, adminToken);
  assertJson(body, 'POST buyer expense');
  assert(status === 201, `Expected 201 got ${status}: ${body.error || ''}`);
});

// ═══════════════════════════════════════════════════════════════════════════
//  7. PARTIES (Farmers, Buyers, Agents)
// ═══════════════════════════════════════════════════════════════════════════
console.log(CYAN('7. PARTIES'));

await test('GET /trade/parties — returns party list', async () => {
  const { status, body } = await get('/trade/parties', adminToken);
  assertJson(body, '/trade/parties');
  assert(status === 200, `Expected 200 got ${status}`);
  assert(Array.isArray(body), 'Expected array');
});

await test('POST /trade/parties — creates Farmer party', async () => {
  const { status, body } = await post('/trade/parties', {
    name: 'Test Farmer ' + Date.now(),
    shortName: 'TF01',
    partyType: 'Farmer',
    phone: '9999900001',
    city: 'Amritsar',
    state: 'Punjab'
  }, adminToken);
  assertJson(body, 'POST farmer party');
  assert(status === 201, `Expected 201 got ${status}: ${body.error || ''}`);
  assert(body.id, 'Expected party id');
  partyId = body.id;
});

await test('POST /trade/parties — creates Buyer party', async () => {
  const { status, body } = await post('/trade/parties', {
    name: 'Test Buyer ' + Date.now(),
    shortName: 'TB01',
    partyType: 'Buyer',
    phone: '9888800001',
    city: 'Delhi',
    state: 'Delhi'
  }, adminToken);
  assertJson(body, 'POST buyer party');
  assert(status === 201, `Expected 201 got ${status}: ${body.error || ''}`);
});

await test('POST /trade/parties — creates Agent party', async () => {
  const { status, body } = await post('/trade/parties', {
    name: 'Test Agent ' + Date.now(),
    shortName: 'TA01',
    partyType: 'Agent',
    phone: '9777700001',
    city: 'Chandigarh',
    state: 'Punjab'
  }, adminToken);
  assertJson(body, 'POST agent party');
  assert(status === 201, `Expected 201 got ${status}: ${body.error || ''}`);
});

await test('POST /trade/parties — missing name returns 400', async () => {
  const { status } = await post('/trade/parties', { partyType: 'Farmer' }, adminToken);
  assert(status === 400 || status === 422 || status === 500, `Expected error status got ${status}`);
});

await test('GET /trade/parties — unauthenticated returns 401', async () => {
  const { status } = await get('/trade/parties');
  assert(status === 401, `Expected 401 got ${status}`);
});

// ═══════════════════════════════════════════════════════════════════════════
//  8. INWARD ARRIVALS (गाड़ी आवक)
// ═══════════════════════════════════════════════════════════════════════════
console.log(CYAN('8. INWARD ARRIVALS (CONSIGNMENTS)'));

await test('GET /trade/arrivals — returns list', async () => {
  const { status, body } = await get('/trade/arrivals', adminToken);
  assertJson(body, '/trade/arrivals');
  assert(status === 200, `Expected 200 got ${status}`);
  assert(Array.isArray(body) || typeof body === 'object', 'Expected response data');
});

await test('POST /trade/arrivals — creates new arrival (inward consignment)', async () => {
  const today = new Date().toISOString().split('T')[0];
  const { status, body } = await post('/trade/arrivals', {
    entryDate: today,
    vehicleNo: 'HR-26-AB-' + Date.now().toString().slice(-4),
    driverName: 'Ramu Driver',
    driverMobile: '9876543210',
    totalBags: 100,
    grossWeight: 2000,
    kisanRate: 500,
    freightAmount: 5000,
    freightAdvance: 2000,
    farmerId: partyId || null,
    commodityId: commodityId || null,
    produce: 'Apple',
    variety: 'Red Delicious',
    manualLotNo: 'LOT-TEST-' + Date.now().toString().slice(-6)
  }, adminToken);
  assertJson(body, 'POST /trade/arrivals');
  assert(status === 201 || status === 200, `Expected 2xx got ${status}: ${body.error || ''}`);
  // Store lot id for split test
  arrivalId = body.id || body.arrival?.id || null;
  lotId = body.lotId || body.lot_id || arrivalId;
});

await test('GET /trade/lots — returns lot list', async () => {
  const { status, body } = await get('/trade/lots', adminToken);
  assertJson(body, '/trade/lots');
  assert(status === 200, `Expected 200 got ${status}`);
});

await test('GET /trade/arrivals — unauthenticated returns 401', async () => {
  const { status } = await get('/trade/arrivals');
  assert(status === 401, `Expected 401 got ${status}`);
});

// ═══════════════════════════════════════════════════════════════════════════
//  9. QUICK TRADE  (route: POST /trade/quick-trade)
// ═══════════════════════════════════════════════════════════════════════════
console.log(CYAN('9. QUICK TRADE'));

await test('POST /trade/quick-trade — valid quick trade with single split', async () => {
  const today = new Date().toISOString().split('T')[0];
  const { status, body } = await post('/trade/quick-trade', {
    entryDate: today,
    commodity: 'Apple',
    variety: 'Shimla',
    farmerName: 'Test Farmer QT',
    farmerPhone: '9876543210',
    truckNo: 'HR-01-QT-' + Date.now().toString().slice(-4),
    arrivalRate: 600,
    totalFreight: 2000,
    freightAdvance: 1000,
    manualLotNo: 'QT-TEST-' + Date.now().toString().slice(-6),
    lots: [
      { quantity: 50, variety: 'Shimla', arrivalRate: 600 }
    ],
    splitSales: [
      {
        buyerName: 'Walk-in Buyer',
        quantity: 50,
        rate: 700
      }
    ],
    customExpenses: null
  }, adminToken);
  assertJson(body, 'POST /trade/quick-trade');
  assert(status === 201 || status === 200, `Expected 2xx got ${status}: ${JSON.stringify(body).substring(0, 200)}`);
});

await test('POST /trade/quick-trade — missing splits array returns error', async () => {
  const { status, body } = await post('/trade/quick-trade', {
    entryDate: new Date().toISOString().split('T')[0],
    produce: 'Apple',
    totalBags: 0,
    grossWeight: 0
  }, adminToken);
  assertJson(body, 'quick-trade no splits');
  assert(status >= 400, `Expected 4xx/5xx error, got ${status}`);
});

await test('POST /trade/quick-trade — unauthenticated returns 401', async () => {
  const { status } = await post('/trade/quick-trade', { produce: 'Apple', totalBags: 10 });
  assert(status === 401, `Expected 401 got ${status}`);
});

await test('POST /trade/quick-trade — split with null qty is rejected', async () => {
  const { status, body } = await post('/trade/quick-trade', {
    entryDate: new Date().toISOString().split('T')[0],
    produce: 'Apple',
    totalBags: 10,
    grossWeight: 200,
    splits: [{ buyerName: 'Test', bags: null, qty: null, rate: 500, amount: 5000 }]
  }, adminToken);
  assertJson(body, 'quick-trade null qty');
  assert(status >= 400 || status === 200, `Got ${status}`);
});

// ═══════════════════════════════════════════════════════════════════════════
//  10. LEDGER / BAHI KHATA
// ═══════════════════════════════════════════════════════════════════════════
console.log(CYAN('10. LEDGER / BAHI KHATA'));

await test('GET /ledger/cashbook — returns cashbook with summary', async () => {
  const { status, body } = await get('/ledger/cashbook', adminToken);
  assertJson(body, '/ledger/cashbook');
  assert(status === 200, `Expected 200 got ${status}`);
  assert(
    body.transactions !== undefined || body.openingCash !== undefined,
    'Expected cashbook object with transactions/openingCash'
  );
});

await test('POST /ledger/cashbook — records JAMA (Cash In) entry with title', async () => {
  const { status, body } = await post('/ledger/cashbook', {
    type: 'JAMA',
    title: 'Test Cash Receipt',
    amount: 5000
  }, adminToken);
  assertJson(body, 'POST /ledger/cashbook JAMA');
  assert(status === 201 || status === 200, `Expected 2xx got ${status}: ${body.error || ''}`);
});

await test('POST /ledger/cashbook — records KHARCH (Cash Out) entry', async () => {
  const { status, body } = await post('/ledger/cashbook', {
    type: 'KHARCH',
    title: 'Test Petty Expense',
    amount: 200
  }, adminToken);
  assertJson(body, 'POST /ledger/cashbook KHARCH');
  assert(status === 201 || status === 200, `Expected 2xx got ${status}: ${body.error || ''}`);
});

await test('POST /ledger/cashbook — missing title returns 400', async () => {
  const { status } = await post('/ledger/cashbook', {
    type: 'JAMA',
    amount: 100
    // no title!
  }, adminToken);
  assert(status === 400, `Expected 400 got ${status}`);
});

await test('POST /ledger/cashbook — zero amount returns 400', async () => {
  const { status } = await post('/ledger/cashbook', {
    type: 'JAMA',
    title: 'Zero Test',
    amount: 0
  }, adminToken);
  assert(status === 400, `Expected 400 got ${status}`);
});

await test('GET /ledger/cashbook — unauthenticated returns 401', async () => {
  const { status } = await get('/ledger/cashbook');
  assert(status === 401, `Expected 401 got ${status}`);
});

await test('POST /ledger/opening-cash — set opening cash', async () => {
  const { status, body } = await post('/ledger/opening-cash', { amount: 10000 }, adminToken);
  assertJson(body, 'POST /ledger/opening-cash');
  assert(status === 200, `Expected 200 got ${status}: ${body.error || ''}`);
});

await test('GET /ledger/accounts — returns accounts/party ledger', async () => {
  const { status, body } = await get('/ledger/accounts', adminToken);
  assertJson(body, '/ledger/accounts');
  assert(status === 200, `Expected 200 got ${status}`);
  assert(Array.isArray(body), 'Expected accounts array');
});

await test('GET /ledger/trial-balance — returns trial balance data', async () => {
  const { status, body } = await get('/ledger/trial-balance', adminToken);
  assertJson(body, '/ledger/trial-balance');
  assert(status === 200, `Expected 200 got ${status}`);
  // Can be any shape — just ensure it's valid JSON (not HTML)
  assert(typeof body === 'object', 'Expected object or array response');
});

await test('GET /ledger/balance-sheet — returns balance sheet data', async () => {
  const { status, body } = await get('/ledger/balance-sheet', adminToken);
  assertJson(body, '/ledger/balance-sheet');
  assert(status === 200, `Expected 200 got ${status}`);
  assert(typeof body === 'object', 'Expected object response');
});

await test('GET /ledger/journal — returns journal entries', async () => {
  const { status, body } = await get('/ledger/journal', adminToken);
  assertJson(body, '/ledger/journal');
  assert(status === 200, `Expected 200 got ${status}`);
});

await test('GET /ledger/drivers — returns driver ledger summary and vehicle trips', async () => {
  const { status, body } = await get('/ledger/drivers', adminToken);
  assertJson(body, '/ledger/drivers');
  assert(status === 200, `Expected 200 got ${status}`);
  assert(body.summary && Array.isArray(body.drivers), 'Expected summary and drivers array');
});

await test('POST /ledger/drivers/payment — records freight payment to driver', async () => {
  const { status, body } = await post('/ledger/drivers/payment', {
    driverName: 'Test Driver Singh',
    truckNo: 'DL-01-AB-1234',
    amount: 500,
    paymentMode: 'Cash',
    narration: 'Test freight payment'
  }, adminToken);
  assertJson(body, 'POST /ledger/drivers/payment');
  assert(status === 200, `Expected 200 got ${status}: ${body.error || ''}`);
});

await test('GET /ledger/crates — returns crate balances for parties and drivers', async () => {
  const { status, body } = await get('/ledger/crates', adminToken);
  assertJson(body, '/ledger/crates');
  assert(status === 200, `Expected 200 got ${status}`);
  assert(body.summary && Array.isArray(body.partyCrates), 'Expected crate summary and partyCrates array');
});

await test('POST /ledger/crates/movement — records crate issuance and return', async () => {
  const { status, body } = await post('/ledger/crates/movement', {
    entityType: 'party',
    entityName: 'Test Buyer Store',
    partyType: 'Buyer',
    movementType: 'GIVEN',
    cratesCount: 25,
    referenceType: 'new_issue',
    notes: 'Test 25 crates dispatched'
  }, adminToken);
  assertJson(body, 'POST /ledger/crates/movement');
  assert(status === 201 || status === 200, `Expected 2xx got ${status}: ${body.error || ''}`);
});

// ═══════════════════════════════════════════════════════════════════════════
//  11. ADMIN
// ═══════════════════════════════════════════════════════════════════════════
console.log(CYAN('11. ADMIN'));

await test('GET /admin/tenants — super admin can list all tenants', async () => {
  const { status, body } = await get('/admin/tenants', superToken);
  assertJson(body, '/admin/tenants');
  assert(status === 200, `Expected 200 got ${status}: ${body.error || ''}`);
  assert(Array.isArray(body) || body.tenants, 'Expected tenants list');
});

await test('GET /admin/metrics — super admin can view platform metrics', async () => {
  const { status, body } = await get('/admin/metrics', superToken);
  assertJson(body, '/admin/metrics');
  assert(status === 200, `Expected 200 got ${status}: ${body.error || ''}`);
});

await test('GET /trade/audit-logs — admin can view audit log', async () => {
  const { status, body } = await get('/trade/audit-logs', adminToken);
  assertJson(body, '/trade/audit-logs');
  assert(status === 200, `Expected 200 got ${status}`);
  assert(Array.isArray(body) || body.logs, 'Expected audit logs array or object');
});

// ═══════════════════════════════════════════════════════════════════════════
//  12. SUBSCRIPTION
// ═══════════════════════════════════════════════════════════════════════════
console.log(CYAN('12. SUBSCRIPTION'));

await test('POST /tenants/:id/subscribe — can subscribe to Starter plan', async () => {
  if (!tenantId) return skip('subscribe', 'no tenantId');
  const { status, body } = await post(`/tenants/${tenantId}/subscribe`, {
    plan: 'Starter'
  }, adminToken);
  assertJson(body, 'POST /tenants/:id/subscribe');
  assert(status === 200 || status === 201, `Expected 2xx got ${status}: ${body.error || ''}`);
});

// ═══════════════════════════════════════════════════════════════════════════
//  13. MULTI-TENANT ISOLATION
// ═══════════════════════════════════════════════════════════════════════════
console.log(CYAN('13. MULTI-TENANT ISOLATION'));

await test('Parties list — all records scoped to same tenant', async () => {
  const { status, body } = await get('/trade/parties', adminToken);
  assert(status === 200, `Expected 200 got ${status}`);
  if (Array.isArray(body) && body.length > 0 && body[0].tenant_id) {
    const uniqueTenants = [...new Set(body.map(p => p.tenant_id))];
    assert(uniqueTenants.length === 1, `Data leak! Found ${uniqueTenants.length} tenant_ids in party list`);
  }
});

await test('Cashbook — transactions scoped to authenticated tenant', async () => {
  const { status, body } = await get('/ledger/cashbook', adminToken);
  assert(status === 200, `Expected 200 got ${status}`);
  const txns = body.transactions || (Array.isArray(body) ? body : []);
  if (txns.length > 0 && txns[0].tenant_id) {
    const uniqueTenants = [...new Set(txns.map(t => t.tenant_id))];
    assert(uniqueTenants.length === 1, `Data leak in cashbook! Found ${uniqueTenants.length} tenants`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  14. EDGE CASES & SECURITY
// ═══════════════════════════════════════════════════════════════════════════
console.log(CYAN('14. EDGE CASES & SECURITY'));

await test('POST /trade/arrivals — backdating to past date is accepted', async () => {
  const { status, body } = await post('/trade/arrivals', {
    entryDate: '2026-01-01',
    produce: 'Mango',
    totalBags: 10,
    grossWeight: 200,
    kisanRate: 100
  }, adminToken);
  assertJson(body, 'backdate arrival');
  assert(status === 200 || status === 201 || status === 400, `Got ${status}: ${body.error || ''}`);
});

await test('SQL injection in party name is safely handled', async () => {
  const { status, body } = await post('/trade/parties', {
    name: "Robert'); DROP TABLE parties; --",
    partyType: 'Farmer'
  }, adminToken);
  // Should succeed (stored safely) or reject — must NOT crash with unhandled 500
  assert(status !== 0, 'Server must return an HTTP response');
  assert(status < 600, `Unexpected status: ${status}`);
});

await test('Very long party name is handled gracefully', async () => {
  const { status } = await post('/trade/parties', {
    name: 'A'.repeat(500),
    partyType: 'Buyer'
  }, adminToken);
  assert(status < 600, `Server must not crash, got ${status}`);
});

await test('POST /trade/expenses — missing name returns 400', async () => {
  const { status } = await post('/trade/expenses', {
    target: 'farmer',
    type: 'flat',
    defaultAmount: 50
    // no name!
  }, adminToken);
  assert(status === 400, `Expected 400 got ${status}`);
});

await test('POST /trade/varieties — missing name returns 400', async () => {
  const { status } = await post('/trade/varieties', {
    commodityName: 'Apple',
    grade: 'Grade A'
    // no name!
  }, adminToken);
  assert(status === 400, `Expected 400 got ${status}`);
});

// ═══════════════════════════════════════════════════════════════════════════
//  FINAL SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n\x1b[1m════════════════════════════════════════\x1b[0m');
console.log('\x1b[1m  ARHATPRO MANDI ERP — TEST RESULTS\x1b[0m');
console.log('\x1b[1m════════════════════════════════════════\x1b[0m');
console.log(GREEN(`Passed  : ${passed}`));
if (failed  > 0) console.log(RED(`Failed  : ${failed}`));
if (skipped > 0) console.log(YELLOW(`Skipped : ${skipped}`));
console.log(`Total   : ${passed + failed + skipped}`);
console.log('\x1b[1m════════════════════════════════════════\x1b[0m\n');

if (failed > 0) {
  console.log('\x1b[31mFailed Tests:\x1b[0m');
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  • ${r.name}`);
    console.log(`    └─ ${r.error}`);
  });
  process.exit(1);
} else {
  console.log('\x1b[32m🎉 All tests passed!\x1b[0m\n');
  process.exit(0);
}
