/**
 * Agency Team & Staff Management (स्टाफ व मुनीम प्रबंधन)
 * Supports role-based access: Shop Admin, Munshi (Data Entry), and Accountant (Cashier)
 */

const TeamManager = {
  teamMembers: [],

  defaultTeam: {
    'tenant-sgfc': [
      { id: 'STAFF-1', name: 'Ramesh Chawla', role: 'Shop Admin', roleHindi: 'मालिक / पार्टनर', mobile: '+91 98111 09876', pin: '1111', status: 'Active', permissions: 'Full Control' },
      { id: 'STAFF-2', name: 'Radhe Shyam (Munshi)', role: 'Munshi (Data Entry)', roleHindi: 'मुंशी / आवक-बिक्री', mobile: '+91 98710 44332', pin: '2222', status: 'Active', permissions: 'Arrivals, Sales & Slips' },
      { id: 'STAFF-3', name: 'Mithilesh Kumar (Muneem)', role: 'Accountant (Cashier)', roleHindi: 'मुनीम / रोकड़िया', mobile: '+91 98100 88776', pin: '3333', status: 'Active', permissions: 'Bahi-Khata & Rokad' }
    ],
    'tenant-csop': [
      { id: 'STAFF-4', name: 'Satish Choudhary', role: 'Shop Admin', roleHindi: 'मालिक / पार्टनर', mobile: '+91 94231 87211', pin: '1234', status: 'Active', permissions: 'Full Control' },
      { id: 'STAFF-5', name: 'Devendra Patil', role: 'Munshi (Data Entry)', roleHindi: 'मुंशी / आवक-बिक्री', mobile: '+91 98221 33445', pin: '5678', status: 'Active', permissions: 'Arrivals & Sales' }
    ]
  },

  init: function() {
    const tenantId = TenantManager.currentTenantId;
    const key = `mandi_team_${tenantId}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      this.teamMembers = JSON.parse(saved);
    } else {
      this.teamMembers = this.defaultTeam[tenantId] || [];
      localStorage.setItem(key, JSON.stringify(this.teamMembers));
    }
  },

  saveTeam: function() {
    const tenantId = TenantManager.currentTenantId;
    localStorage.setItem(`mandi_team_${tenantId}`, JSON.stringify(this.teamMembers));
  },

  renderTeamTable: function() {
    const container = document.getElementById('settings-team-table-body');
    if (!container) return;

    if (this.teamMembers.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="5" class="p-8 text-center bg-slate-50 rounded-xl">
            <div class="max-w-xs mx-auto text-center space-y-2">
              <span class="text-3xl block">👥</span>
              <p class="text-xs font-bold text-slate-700">No staff members added yet</p>
              <p class="text-[11px] text-slate-400">Add Munshis and Accountants to manage your mandi shop operations.</p>
              <button onclick="TeamManager.openInviteModal()" class="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
                + Add Staff Member
              </button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = this.teamMembers.map(m => {
      let roleBadge = 'bg-slate-100 text-slate-700';
      if (m.role.includes('Admin')) roleBadge = 'bg-purple-100 text-purple-800 border border-purple-200';
      if (m.role.includes('Munshi')) roleBadge = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      if (m.role.includes('Accountant')) roleBadge = 'bg-amber-100 text-amber-800 border border-amber-200';

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
          <td class="p-3">
            <div class="font-bold text-slate-900 text-xs">${m.name}</div>
            <div class="text-[11px] text-slate-500">PIN: <span class="font-mono font-bold text-slate-700">••••</span></div>
          </td>
          <td class="p-3">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold ${roleBadge}">
              ${m.role}
            </span>
            <span class="block text-[10px] text-slate-400 mt-0.5">${m.roleHindi || ''}</span>
          </td>
          <td class="p-3 text-xs font-mono text-slate-600">${m.mobile}</td>
          <td class="p-3 text-xs text-slate-600 font-medium">${m.permissions}</td>
          <td class="p-3 text-right">
            <button onclick="TeamManager.deleteMember('${m.id}')" class="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1 transition-colors">
              Remove
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  openInviteModal: function() {
    const modal = document.getElementById('invite-staff-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeInviteModal: function() {
    const modal = document.getElementById('invite-staff-modal');
    if (modal) modal.classList.add('hidden');
  },

  submitInviteMember: function(formData) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('add staff member')) return;

    const rolePermissions = {
      'Shop Admin': 'Full Control (Settings, Staff, Bills)',
      'Munshi (Data Entry)': 'Arrivals, Sales & Slips',
      'Accountant (Cashier)': 'Bahi-Khata, Payments & Rokad'
    };

    const roleMap = {
      'Shop Admin': 'shop_admin',
      'Munshi (Data Entry)': 'munshi',
      'Accountant (Cashier)': 'accountant'
    };

    const cleanMobile = formData.mobile.trim();
    const cleanPin = (formData.pin || '1234').trim();
    const currentTenantId = TenantManager.currentTenantId;

    const newMember = {
      id: 'STAFF-' + Date.now(),
      name: formData.name.trim(),
      role: formData.role,
      roleHindi: formData.role === 'Shop Admin' ? 'मालिक / पार्टनर' : (formData.role === 'Munshi (Data Entry)' ? 'मुंशी / आवक-बिक्री' : 'मुनीम / रोकड़िया'),
      mobile: cleanMobile,
      pin: cleanPin,
      status: 'Active',
      permissions: rolePermissions[formData.role] || 'Standard Access'
    };

    this.teamMembers.push(newMember);
    this.saveTeam();

    // Synchronize to platform authentication users so staff can log in
    try {
      const customUsers = JSON.parse(localStorage.getItem('mandi_custom_users') || '[]');
      const numericPhone = cleanMobile.replace(/[^0-9]/g, '');
      const assignedRole = roleMap[formData.role] || 'munshi';

      // Remove existing entry for same mobile if any
      const updatedUsers = customUsers.filter(u => u.phone !== cleanMobile && u.phone !== numericPhone);
      updatedUsers.push({
        id: newMember.id,
        name: newMember.name,
        phone: numericPhone || cleanMobile,
        email: `${numericPhone || 'staff'}@mandi.in`,
        pin: cleanPin,
        password: cleanPin,
        role: assignedRole,
        roleLabel: newMember.role,
        tenantId: currentTenantId,
        managedTenantIds: assignedRole === 'shop_admin' ? [currentTenantId] : []
      });
      localStorage.setItem('mandi_custom_users', JSON.stringify(updatedUsers));
    } catch (e) {
      console.warn('Could not sync user to mandi_custom_users:', e);
    }

    this.renderTeamTable();
    this.closeInviteModal();
    App.showToast(`Staff member "${newMember.name}" added & login enabled!`, 'success');
  },

  deleteMember: function(memberId) {
    if (typeof AuthManager !== 'undefined' && !AuthManager.assertCanMutate('remove staff member')) return;

    if (confirm('Are you sure you want to remove this staff member?')) {
      const target = this.teamMembers.find(m => m.id === memberId);
      this.teamMembers = this.teamMembers.filter(m => m.id !== memberId);
      this.saveTeam();

      // Clean from custom auth users
      if (target) {
        try {
          const customUsers = JSON.parse(localStorage.getItem('mandi_custom_users') || '[]');
          const numericPhone = target.mobile.replace(/[^0-9]/g, '');
          const filtered = customUsers.filter(u => u.id !== memberId && u.phone !== target.mobile && u.phone !== numericPhone);
          localStorage.setItem('mandi_custom_users', JSON.stringify(filtered));
        } catch (e) {}
      }

      this.renderTeamTable();
      App.showToast('Staff member removed', 'info');
    }
  }
};
