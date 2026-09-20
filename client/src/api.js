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
    return Array.isArray(data) ? { tenants: data } : data;
  },
  getTenant: (id) => apiRequest(`/tenants/${id}`),
  updateTenant: (id, data) => apiRequest(`/tenants/${id}`, 'PUT', data),
  updateTenantBranding: async (data) => {
    // Current user's tenantId can be retrieved or passed
    const me = await apiRequest('/auth/me');
    const tId = me.tenant?.id || me.user?.tenant_id;
    return apiRequest(`/tenants/${tId}`, 'PUT', data);
  },
  getTeam: (tenantId) => apiRequest(`/tenants/${tenantId}/team`),
  getTenantMembers: async () => {
    const me = await apiRequest('/auth/me');
    const tId = me.tenant?.id || me.user?.tenant_id;
    const list = await apiRequest(`/tenants/${tId}/team`);
    return Array.isArray(list) ? { members: list } : list;
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
    return Array.isArray(data) ? { commodities: data } : data;
  },
  addCommodity: (data) => apiRequest('/trade/commodities', 'POST', data),
  getParties: async () => {
    const data = await apiRequest('/trade/parties');
    return Array.isArray(data) ? { parties: data } : data;
  },
  addParty: (data) => apiRequest('/trade/parties', 'POST', data),
  deleteParty: (id) => apiRequest(`/trade/parties/${id}`, 'DELETE'),
  getArrivals: async () => {
    const data = await apiRequest('/trade/arrivals');
    const list = Array.isArray(data) ? data : data.arrivals || [];
    // Normalize properties for UI
    const mapped = list.map(a => ({
      ...a,
      truck_no: a.truck_no,
      farmer_name: a.farmer_name,
      source_location: a.farmer_location,
      commodity_name: a.commodity,
      bags: a.quantity,
      remaining_bags: a.quantity,
      freight_amount: a.total_freight,
      advance_paid: a.freight_advance_paid,
      lot_number: a.lot_id,
      arrival_date: a.date
    }));
    return { arrivals: mapped };
  },
  createArrival: async (data) => {
    return apiRequest('/trade/arrivals', 'POST', {
      truckNo: data.truck_no,
      driverName: data.driver_name,
      driverPhone: data.driver_mobile,
      farmerName: data.farmer_name,
      farmerLocation: data.source_location,
      commodity: data.commodity_name || 'General Produce',
      variety: data.variety || '',
      quantity: data.bags,
      totalFreight: data.freight_amount,
      freightAdvance: data.advance_paid
    });
  },
  addArrival: (data) => apiRequest('/trade/arrivals', 'POST', data),
  getLots: async () => {
    const data = await apiRequest('/trade/lots');
    return Array.isArray(data) ? { lots: data } : data;
  },
  getSalesLots: async () => {
    const data = await apiRequest('/trade/lots');
    const list = Array.isArray(data) ? data : data.lots || [];
    const mapped = list.map(l => ({
      ...l,
      lot_number: l.id,
      commodity_name: l.commodity_name,
      farmer_name: l.farmer_name,
      source_location: l.farmer_location,
      total_bags: l.total_quantity,
      remaining_bags: l.remaining_quantity,
      truck_no: l.truck_no,
      splits: (l.splitSales || []).map(s => ({
        buyer_name: s.buyer_name,
        bags_sold: s.quantity,
        sale_rate: s.rate,
        payment_terms: s.payment_mode
      }))
    }));
    return { lots: mapped };
  },
  splitSale: (lotId, data) => apiRequest(`/trade/lots/${lotId}/split`, 'POST', data),
  splitSaleLot: (lotId, data) => apiRequest(`/trade/lots/${lotId}/split`, 'POST', {
    buyerName: data.buyer_name,
    quantity: data.bags_sold,
    rate: data.sale_rate,
    paymentMode: data.payment_terms
  }),
  quickTrade: (data) => apiRequest('/trade/quick-trade', 'POST', data),

  // Ledger
  getAccounts: async () => {
    const data = await apiRequest('/ledger/accounts');
    const list = Array.isArray(data) ? data : data.accounts || [];
    const mapped = list.map(a => ({
      ...a,
      name: a.party_name,
      account_type: 'Buyer',
      balance: a.outstanding_udhaar,
      phone: a.contact,
      city: a.address
    }));
    return { accounts: mapped };
  },
  recordPayment: (data) => apiRequest('/ledger/payment', 'POST', data),
  getCashbook: async () => {
    const data = await apiRequest('/ledger/cashbook');
    const txs = data.transactions || [];
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
  createCashEntry: (data) => apiRequest('/ledger/cashbook', 'POST', {
    type: data.entry_type === 'cash_in' ? 'JAMA' : 'KHARCH',
    title: data.description || 'Counter Cash Entry',
    amount: data.amount
  }),
  getJournal: () => apiRequest('/ledger/journal'),
  postJournal: (data) => apiRequest('/ledger/journal', 'POST', data),
  createJournalEntry: (data) => {
    // Take the first debit and first credit
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

  // Super Admin
  getAdminMetrics: async () => {
    const data = await apiRequest('/admin/metrics');
    return { metrics: data };
  },
  getAdminTenants: async () => {
    const data = await apiRequest('/admin/tenants');
    const list = Array.isArray(data) ? data : data.tenants || [];
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

// Aliases for both lowercase api and uppercase API
export const api = API;
export default API;
