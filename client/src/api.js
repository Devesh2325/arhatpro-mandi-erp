const BASE_URL = '/api';

export async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('mandi_jwt_token');
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers
  };

  if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const API = {
  // Auth
  login: (identifier, pinOrPassword) => apiRequest('/auth/login', 'POST', { identifier, pinOrPassword }),
  signup: (formData) => apiRequest('/auth/signup', 'POST', formData),
  getMe: () => apiRequest('/auth/me'),
  startImpersonation: (targetTenantId) => apiRequest('/auth/impersonate/start', 'POST', { targetTenantId }),
  stopImpersonation: () => apiRequest('/auth/impersonate/stop', 'POST'),

  // Tenants
  getTenants: async () => {
    const data = await apiRequest('/tenants');
    const arr = Array.isArray(data) ? [...data] : (data?.tenants ? [...data.tenants] : []);
    arr.tenants = arr;
    return arr;
  },
  getTenant: (id) => apiRequest(`/tenants/${id}`),
  updateTenant: (id, data) => apiRequest(`/tenants/${id}`, 'PUT', data),
  updateTenantBranding: async (data) => {
    const me = await apiRequest('/auth/me');
    const tId = me.tenant?.id || me.user?.tenant_id;
    return apiRequest(`/tenants/${tId}`, 'PUT', data);
  },
  getTeam: (tenantId) => apiRequest(`/tenants/${tenantId}/team`),
  getTenantMembers: async () => {
    const me = await apiRequest('/auth/me');
    const tId = me.tenant?.id || me.user?.tenant_id;
    const list = await apiRequest(`/tenants/${tId}/team`);
    const arr = Array.isArray(list) ? [...list] : [];
    arr.members = arr;
    return arr;
  },
  addTeamMember: (tenantId, memberData) => apiRequest(`/tenants/${tenantId}/team`, 'POST', memberData),
  addTenantMember: async (memberData) => {
    const me = await apiRequest('/auth/me');
    const tId = me.tenant?.id || me.user?.tenant_id;
    return apiRequest(`/tenants/${tId}/team`, 'POST', {
      name: memberData.name,
      role: memberData.role === 'shop_admin' ? 'Shop Admin' : memberData.role === 'cashier' ? 'Accountant (Cashier)' : 'Munshi (Data Entry)',
      phone: memberData.email || memberData.phone || '9999999999',
      pin: memberData.password || '1234'
    });
  },
  deleteTeamMember: (tenantId, userId) => apiRequest(`/tenants/${tenantId}/team/${userId}`, 'DELETE'),
  deleteTenantMember: async (userId) => {
    const me = await apiRequest('/auth/me');
    const tId = me.tenant?.id || me.user?.tenant_id;
    return apiRequest(`/tenants/${tId}/team/${userId}`, 'DELETE');
  },

  // Trade
  getCommodities: async () => {
    const data = await apiRequest('/trade/commodities');
    const arr = Array.isArray(data) ? [...data] : (data?.commodities ? [...data.commodities] : []);
    arr.commodities = arr;
    return arr;
  },
  addCommodity: (data) => apiRequest('/trade/commodities', 'POST', data),
  updateCommodity: (id, data) => apiRequest(`/trade/commodities/${id}`, 'PUT', data),
  deleteCommodity: (id) => apiRequest(`/trade/commodities/${id}`, 'DELETE'),
  getReportsData: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/trade/reports/data${q ? '?' + q : ''}`);
  },

  // Varieties Master
  getVarieties: () => apiRequest('/trade/varieties'),
  addVariety: (data) => apiRequest('/trade/varieties', 'POST', data),
  updateVariety: (id, data) => apiRequest(`/trade/varieties/${id}`, 'PUT', data),
  deleteVariety: (id) => apiRequest(`/trade/varieties/${id}`, 'DELETE'),

  // Mandi Expense Heads
  getExpenses: () => apiRequest('/trade/expenses'),
  addExpense: (data) => apiRequest('/trade/expenses', 'POST', data),
  updateExpense: (id, data) => apiRequest(`/trade/expenses/${id}`, 'PUT', data),
  deleteExpense: (id) => apiRequest(`/trade/expenses/${id}`, 'DELETE'),

  getParties: async () => {
    const data = await apiRequest('/trade/parties');
    const arr = Array.isArray(data) ? [...data] : (data?.parties ? [...data.parties] : []);
    arr.parties = arr;
    return arr;
  },
  addParty: (data) => apiRequest('/trade/parties', 'POST', data),
  importParties: (parties) => apiRequest('/trade/parties/import', 'POST', { parties }),
  updateParty: (id, data) => apiRequest(`/trade/parties/${id}`, 'PUT', data),
  deleteParty: (id) => apiRequest(`/trade/parties/${id}`, 'DELETE'),
  getAuditLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/trade/audit-logs${q ? '?' + q : ''}`);
  },
  getArrivals: async () => {
    const data = await apiRequest('/trade/arrivals');
    const list = Array.isArray(data) ? data : (data?.arrivals || []);
    const mapped = list.map(a => ({
      ...a,
      truck_no: a.truck_no,
      farmer_name: a.farmer_name,
      source_location: a.farmer_location,
      agent_name: a.agent_name,
      agent_phone: a.agent_phone,
      commodity_name: a.commodity,
      variety: a.variety,
      bags: a.quantity,
      remaining_bags: a.quantity,
      arrival_rate: a.arrival_rate || 0,
      total_arrival_amount: a.total_arrival_amount || 0,
      freight_amount: a.total_freight,
      advance_paid: a.freight_advance_paid,
      lot_number: a.lot_id,
      manual_lot_no: a.manual_lot_no,
      custom_expenses: a.custom_expenses,
      arrival_date: a.date
    }));
    mapped.arrivals = mapped;
    return mapped;
  },
  createArrival: async (data) => {
    return apiRequest('/trade/arrivals', 'POST', {
      truckNo: data.truck_no,
      driverName: data.driver_name,
      driverPhone: data.driver_mobile,
      farmerName: data.farmer_name,
      farmerPhone: data.farmer_phone || data.farmer_mobile,
      farmerLocation: data.source_location,
      agentName: data.agent_name || data.agentName,
      agentPhone: data.agent_phone || data.agentPhone,
      commodity: data.commodity_name || 'General Produce',
      variety: data.variety || '',
      quantity: data.bags,
      arrivalRate: data.arrival_rate || 0,
      totalFreight: data.freight_amount,
      freightAdvance: data.advance_paid,
      manualLotNo: data.manual_lot_no || data.manualLotNo || data.lot_number,
      customExpenses: data.custom_expenses || data.customExpenses,
      entryDate: data.entry_date || data.entryDate || data.arrival_date || data.date
    });
  },
  addArrival: (data) => apiRequest('/trade/arrivals', 'POST', data),
  getLots: async () => {
    const data = await apiRequest('/trade/lots');
    const arr = Array.isArray(data) ? [...data] : (data?.lots ? [...data.lots] : []);
    arr.lots = arr;
    return arr;
  },
  getSalesLots: async () => {
    const data = await apiRequest('/trade/lots');
    const list = Array.isArray(data) ? data : (data?.lots || []);
    const mapped = list.map(l => ({
      ...l,
      lot_number: l.id,
      commodity_name: l.commodity_name,
      variety: l.variety,
      farmer_name: l.farmer_name,
      farmer_location: l.farmer_location,
      agent_name: l.agent_name,
      total_bags: l.total_quantity,
      remaining_bags: l.remaining_quantity,
      arrival_rate: l.arrival_rate || 0,
      truck_no: l.truck_no,
      splits: (l.splitSales || []).map(s => ({
        buyer_name: s.buyer_name,
        bags_sold: s.quantity,
        sale_rate: s.rate,
        arrival_rate: s.arrival_rate || l.arrival_rate || 0,
        payment_terms: s.payment_mode
      }))
    }));
    mapped.lots = mapped;
    return mapped;
  },
  splitSale: (lotId, data) => apiRequest(`/trade/lots/${lotId}/split`, 'POST', data),
  splitSaleLot: (lotId, data) => apiRequest(`/trade/lots/${lotId}/split`, 'POST', {
    buyerName: data.buyer_name || data.buyerName,
    quantity: data.bags_sold || data.quantity,
    rate: data.sale_rate || data.rate,
    paymentMode: data.payment_terms || data.paymentMode,
    customExpenses: data.customExpenses || data.custom_expenses,
    entryDate: data.entry_date || data.entryDate || data.date
  }),
  quickTrade: (data) => apiRequest('/trade/quick-trade', 'POST', data),

  // Ledger
  getAccounts: async () => {
    const data = await apiRequest('/ledger/accounts');
    const list = Array.isArray(data) ? data : (data?.accounts || []);
    const mapped = list.map(a => ({
      ...a,
      name: a.party_name,
      account_type: 'Buyer',
      balance: a.outstanding_udhaar,
      phone: a.contact,
      city: a.address
    }));
    mapped.accounts = mapped;
    return mapped;
  },
  recordPayment: (data) => apiRequest('/ledger/payment', 'POST', data),
  getCashbook: async () => {
    const data = await apiRequest('/ledger/cashbook');
    const txs = data?.transactions || [];
    const mapped = txs.map(t => ({
      ...t,
      transaction_date: t.created_at || new Date().toISOString(),
      entry_type: t.type === 'JAMA' ? 'cash_in' : 'cash_out',
      account_name: t.title,
      description: t.title,
      amount: t.amount
    }));
    return { ...data, entries: mapped };
  },
  addCashbookEntry: (data) => apiRequest('/ledger/cashbook', 'POST', data),
  setOpeningCash: (amount) => apiRequest('/ledger/opening-cash', 'POST', { amount }),
  createCashEntry: (data) => apiRequest('/ledger/cashbook', 'POST', {
    type: data.entry_type === 'cash_in' ? 'JAMA' : 'KHARCH',
    title: data.description || 'Counter Cash Entry',
    amount: data.amount
  }),
  getJournal: () => apiRequest('/ledger/journal'),
  postJournal: (data) => apiRequest('/ledger/journal', 'POST', data),
  createJournalEntry: (data) => {
    const dr = (data.entries || []).find(e => e.debit_amount > 0);
    const cr = (data.entries || []).find(e => e.credit_amount > 0);
    return apiRequest('/ledger/journal', 'POST', {
      debitAccount: dr ? `Account #${dr.account_id}` : 'General Debit',
      creditAccount: cr ? `Account #${cr.account_id}` : 'General Credit',
      debitAmount: dr ? dr.debit_amount : 0,
      creditAmount: cr ? cr.credit_amount : 0,
      narration: data.narration,
      date: data.voucher_date
    });
  },
  getTrialBalance: () => apiRequest('/ledger/trial-balance'),
  getBalanceSheet: () => apiRequest('/ledger/balance-sheet'),
  getDebtorAging: async () => {
    const data = await apiRequest('/ledger/accounts');
    const list = Array.isArray(data) ? data : [];
    const debtors = list.map(a => ({
      name: a.party_name,
      phone: a.contact,
      city: a.address,
      bucket_0_15: a.overdue_days <= 15 ? a.outstanding_udhaar : 0,
      bucket_16_30: (a.overdue_days > 15 && a.overdue_days <= 30) ? a.outstanding_udhaar : 0,
      bucket_30_plus: a.overdue_days > 30 ? a.outstanding_udhaar : 0,
      calculated_interest: a.accumulatedInterest || 0,
      total_balance: a.outstanding_udhaar
    }));
    return { debtors };
  },

  // Tenant Subscriptions
  subscribePlan: (tenantId, data) => apiRequest(`/tenants/${tenantId}/subscribe`, 'POST', data),

  // Super Admin
  getAdminMetrics: async () => {
    const data = await apiRequest('/admin/metrics');
    return { metrics: data };
  },
  getAdminTenants: async () => {
    const data = await apiRequest('/admin/tenants');
    const list = Array.isArray(data) ? data : (data?.tenants || []);
    const mapped = list.map(t => ({
      ...t,
      name: t.firm_name,
      apmc_license: t.apmc_license_no,
      subdomain: t.id,
      status: (t.status || 'active').toLowerCase(),
      plan: (t.plan || 'monthly').toLowerCase(),
      valid_until: t.valid_until
    }));
    return { tenants: mapped };
  },
  updateTenantSubscription: (tenantId, { plan }) => {
    const capitalized = plan.charAt(0).toUpperCase() + plan.slice(1);
    return apiRequest(`/admin/subscriptions/${tenantId}`, 'PUT', { plan: capitalized });
  },
  updateSubscription: (tenantId, plan) => apiRequest(`/admin/subscriptions/${tenantId}`, 'PUT', { plan }),
  extendSubscription: (tenantId, days) => apiRequest(`/admin/subscriptions/${tenantId}/extend`, 'POST', { days }),
  toggleTenantStatus: (tenantId) => apiRequest(`/admin/tenants/${tenantId}/status`, 'PUT'),
  getAdminRequests: async () => {
    const data = await apiRequest('/admin/requests');
    return { requests: Array.isArray(data) ? data : [] };
  },
  getRequests: () => apiRequest('/admin/requests'),
  approveRequest: (id) => apiRequest(`/admin/requests/${id}/approve`, 'POST'),
  resolveAdminRequest: (id, status) => {
    if (status === 'approved') {
      return apiRequest(`/admin/requests/${id}/approve`, 'POST');
    }
    return Promise.resolve({ message: 'Request updated' });
  }
};

export const api = API;
export default API;
