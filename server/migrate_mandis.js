const { query, run } = require('./database/db');

async function migrateAndSeed() {
  console.log('⚡ Running Mandi & Storage Multi-Tenant Migrations...');

  // 1. Add columns to arrivals
  await run(`ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS inward_type TEXT DEFAULT 'direct'`);
  await run(`ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS storage_location TEXT`);
  await run(`ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS driver_crates_in INTEGER DEFAULT 0`);
  await run(`ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS driver_crates_out INTEGER DEFAULT 0`);
  await run(`ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS driver_crates_balance INTEGER DEFAULT 0`);

  // 2. Add columns to sales_lots
  await run(`ALTER TABLE sales_lots ADD COLUMN IF NOT EXISTS inward_type TEXT DEFAULT 'direct'`);
  await run(`ALTER TABLE sales_lots ADD COLUMN IF NOT EXISTS storage_location TEXT`);
  await run(`ALTER TABLE sales_lots ADD COLUMN IF NOT EXISTS crates_balance INTEGER DEFAULT 0`);

  // 3. Add columns to split_sales
  await run(`ALTER TABLE split_sales ADD COLUMN IF NOT EXISTS buyer_crates_issued INTEGER DEFAULT 0`);
  await run(`ALTER TABLE split_sales ADD COLUMN IF NOT EXISTS buyer_crates_returned INTEGER DEFAULT 0`);
  await run(`ALTER TABLE split_sales ADD COLUMN IF NOT EXISTS storage_location TEXT`);

  // 4. Add business_type to tenants
  await run(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'fruit_vegetable'`);

  console.log('✓ Database schema updated with Inward Type, Storage Chamber & Crate tracking columns.');

  // Helper to upsert tenant, user, commodities, and parties
  async function seedMandi({ tenant, user, commodities, parties, varieties }) {
    // Check if tenant exists
    const tExists = await query(`SELECT id FROM tenants WHERE id = ?`, [tenant.id]);
    if (tExists.length === 0) {
      await run(`
        INSERT INTO tenants (id, firm_name, hindi_name, tagline, proprietor, shop_no, mandi_name, apmc_license_no, phone, logo_icon, theme_color, status, business_type, standard_commission, palledari_rate_per_box)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)
      `, [
        tenant.id, tenant.firm_name, tenant.hindi_name, tenant.tagline || '', tenant.proprietor,
        tenant.shop_no, tenant.mandi_name, tenant.apmc_license_no, tenant.phone,
        tenant.logo_icon || '🏢', tenant.theme_color || 'emerald', tenant.business_type || 'fruit_vegetable',
        tenant.standard_commission || 2.5, tenant.palledari_rate_per_box || 10
      ]);
      console.log(`+ Created Tenant: ${tenant.firm_name}`);
    } else {
      await run(`
        UPDATE tenants SET 
          firm_name = ?, hindi_name = ?, proprietor = ?, shop_no = ?, mandi_name = ?, 
          phone = ?, logo_icon = ?, theme_color = ?, business_type = ?
        WHERE id = ?
      `, [
        tenant.firm_name, tenant.hindi_name, tenant.proprietor, tenant.shop_no, tenant.mandi_name,
        tenant.phone, tenant.logo_icon || '🏢', tenant.theme_color || 'emerald', tenant.business_type || 'fruit_vegetable',
        tenant.id
      ]);
      console.log(`~ Updated Tenant: ${tenant.firm_name}`);
    }

    // Ensure subscription
    const subExists = await query(`SELECT id FROM subscriptions WHERE tenant_id = ?`, [tenant.id]);
    if (subExists.length === 0) {
      const now = new Date();
      now.setFullYear(now.getFullYear() + 1);
      await run(`
        INSERT INTO subscriptions (id, tenant_id, plan, status, valid_until, price)
        VALUES (?, ?, 'Enterprise', 'Active', ?, 9999)
      `, ['sub-' + tenant.id, tenant.id, now.toISOString().split('T')[0]]);
    }

    // Check if user exists
    const uExists = await query(`SELECT id FROM users WHERE phone = ?`, [user.phone]);
    if (uExists.length === 0) {
      await run(`
        INSERT INTO users (id, tenant_id, name, email, phone, pin, password, role, role_label, permissions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id, tenant.id, user.name, user.email, user.phone, user.pin || '1234', user.pin || '1234',
        user.role || 'shop_admin', user.role_label || 'Agency Owner / Manager', 'Full Control'
      ]);
      console.log(`+ Created User: ${user.name} (${user.phone})`);
    } else {
      await run(`
        UPDATE users SET tenant_id = ?, name = ?, email = ?, pin = ?, password = ?
        WHERE phone = ?
      `, [tenant.id, user.name, user.email, user.pin || '1234', user.pin || '1234', user.phone]);
      console.log(`~ Updated User: ${user.name}`);
    }

    // Seed commodities
    for (const c of commodities) {
      const cExists = await query(`SELECT id FROM commodities WHERE tenant_id = ? AND name_en = ?`, [tenant.id, c.name_en]);
      if (cExists.length === 0) {
        await run(`
          INSERT INTO commodities (id, tenant_id, name_en, name_hi, category, default_unit, unit_weight_kg, tare_deduction_kg, standard_commission_pct, palledari_rate_per_unit, active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
          'COMM-' + Math.floor(100000 + Math.random() * 900000),
          tenant.id, c.name_en, c.name_hi, c.category || 'Fruit',
          c.default_unit || 'Crate (20kg)', c.unit_weight_kg || 20, c.tare_deduction_kg || 1,
          c.standard_commission_pct || 2.5, c.palledari_rate_per_unit || 10
        ]);
      }
    }

    // Seed varieties
    if (varieties && varieties.length > 0) {
      for (const v of varieties) {
        const vExists = await query(`SELECT id FROM varieties WHERE tenant_id = ? AND name = ?`, [tenant.id, v.name]);
        if (vExists.length === 0) {
          await run(`
            INSERT INTO varieties (id, tenant_id, commodity_name, name, name_hi, grade, default_rate)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            'VAR-' + Math.floor(100000 + Math.random() * 900000),
            tenant.id, v.commodity_name || '', v.name, v.name_hi || '', v.grade || 'Grade A', v.default_rate || 500
          ]);
        }
      }
    }

    // Seed parties
    for (const p of parties) {
      const pExists = await query(`SELECT id FROM parties WHERE tenant_id = ? AND name = ?`, [tenant.id, p.name]);
      if (pExists.length === 0) {
        await run(`
          INSERT INTO parties (id, tenant_id, short_code, name, type, mobile, city, state, credit_limit, current_balance)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `, [
          'P-' + Math.floor(100000 + Math.random() * 900000),
          tenant.id, p.short_code, p.name, p.type, p.mobile,
          p.city || 'Mandi Yard', p.state || 'Local', p.credit_limit || 100000
        ]);
      }
    }
  }

  // ── 1. BANANA STORE & RIPENING CHAMBER (केला स्टोर व राइपनिंग चैंबर) ──────────────
  await seedMandi({
    tenant: {
      id: 'tenant-banana-store',
      firm_name: 'Golden Banana Ripening Store & Co.',
      hindi_name: 'गोल्डन बनाना राइपनिंग स्टोर एवं ट्रेडिंग',
      tagline: 'Kela Ripening Chambers, Crate Management & Wholesale Trading',
      proprietor: 'Suresh Patil',
      shop_no: 'Chamber 4 & 5, Banana Complex',
      mandi_name: 'Kela Mandi, Azadpur & Jalgaon Terminal',
      apmc_license_no: 'DL-KELA-2024-99',
      phone: '9820011223',
      logo_icon: '🍌',
      theme_color: 'amber',
      business_type: 'banana_store',
      standard_commission: 3.0,
      palledari_rate_per_box: 8
    },
    user: {
      id: 'usr-banana-admin',
      name: 'Suresh Patil (Banana Store)',
      email: 'banana@mandi.in',
      phone: '9820011223',
      pin: '1234'
    },
    commodities: [
      { name_en: 'Banana - Grand Naine (G9)', name_hi: 'केला - जी9 सुपर', category: 'Fruit', default_unit: 'Crate (20kg)', unit_weight_kg: 20, tare_deduction_kg: 1.5, standard_commission_pct: 3.0, palledari_rate_per_unit: 8 },
      { name_en: 'Banana - Robusta Premium', name_hi: 'केला - रोबस्टा', category: 'Fruit', default_unit: 'Crate (15kg)', unit_weight_kg: 15, tare_deduction_kg: 1.0, standard_commission_pct: 3.0, palledari_rate_per_unit: 7 },
      { name_en: 'Banana - Elaichi / Yellaki', name_hi: 'केला - इलायची (येल्लक्की)', category: 'Fruit', default_unit: 'Crate (12kg)', unit_weight_kg: 12, tare_deduction_kg: 1.0, standard_commission_pct: 3.5, palledari_rate_per_unit: 6 },
      { name_en: 'Banana Raw Green Bunches', name_hi: 'कच्चा केला - लंगर/घहर', category: 'Fruit', default_unit: 'Bunch (घहर)', unit_weight_kg: 25, tare_deduction_kg: 0, standard_commission_pct: 3.0, palledari_rate_per_unit: 10 }
    ],
    varieties: [
      { commodity_name: 'Banana - Grand Naine (G9)', name: 'G9 Ripened Yellow', name_hi: 'जी9 पका पीला', grade: 'Grade A', default_rate: 650 },
      { commodity_name: 'Banana - Grand Naine (G9)', name: 'G9 Semi-Ripe Chamber', name_hi: 'जी9 अधपका चैंबर', grade: 'Grade B', default_rate: 550 },
      { commodity_name: 'Banana - Robusta Premium', name: 'Robusta Export Quality', name_hi: 'रोबस्टा एक्सपोर्ट', grade: 'Grade A', default_rate: 700 }
    ],
    parties: [
      { short_code: 'PBF', name: 'Patil Banana Plantation (Jalgaon)', type: 'Farmer', mobile: '9822012345', city: 'Raver, Jalgaon', state: 'Maharashtra' },
      { short_code: 'DFM', name: 'Daily Fresh Fruit Mart (Retailer)', type: 'Buyer', mobile: '9822054321', city: 'Delhi NCR', state: 'Delhi' },
      { short_code: 'KBT', name: 'Khandesh Crate Transport & Broker', type: 'Agent', mobile: '9822099887', city: 'Jalgaon', state: 'Maharashtra' }
    ]
  });

  // ── 2. AGRA POTATO COLD STORAGE (आलू कोल्ड स्टोरेज व मंडी) ──────────────────
  await seedMandi({
    tenant: {
      id: 'tenant-cold-storage',
      firm_name: 'Shree Ram Potato Cold Storage & Agency',
      hindi_name: 'श्री राम आलू कोल्ड स्टोरेज एवं आढ़त',
      tagline: 'Farmer Cold Storage Lots, Sack Management & Mandi Vyapar',
      proprietor: 'Chaudhary Rameshwar',
      shop_no: 'Chamber A & B, Cold Storage Complex',
      mandi_name: 'Agra & Aligarh Cold Storage Belt, UP',
      apmc_license_no: 'UP-COLD-2024-55',
      phone: '9837012345',
      logo_icon: '🥔',
      theme_color: 'slate',
      business_type: 'cold_storage',
      standard_commission: 2.0,
      palledari_rate_per_box: 10
    },
    user: {
      id: 'usr-coldstorage-admin',
      name: 'Chaudhary Rameshwar (Cold Storage)',
      email: 'coldstorage@mandi.in',
      phone: '9837012345',
      pin: '1234'
    },
    commodities: [
      { name_en: 'Potato - Kufri Pukhraj', name_hi: 'आलू - कुफरी पुखराज', category: 'Vegetable', default_unit: 'Sack (50kg)', unit_weight_kg: 50, tare_deduction_kg: 1.0, standard_commission_pct: 2.0, palledari_rate_per_unit: 10 },
      { name_en: 'Potato - Kufri Jyoti 3797', name_hi: 'आलू - 3797 ज्योति', category: 'Vegetable', default_unit: 'Sack (50kg)', unit_weight_kg: 50, tare_deduction_kg: 1.0, standard_commission_pct: 2.0, palledari_rate_per_unit: 10 },
      { name_en: 'Potato - Chipsona Premium', name_hi: 'आलू - चिप्सोना', category: 'Vegetable', default_unit: 'Sack (50kg)', unit_weight_kg: 50, tare_deduction_kg: 1.0, standard_commission_pct: 2.5, palledari_rate_per_unit: 10 }
    ],
    varieties: [
      { commodity_name: 'Potato - Kufri Pukhraj', name: 'Cold Stored Sugar-Free 3797', name_hi: 'कोल्ड स्टोर्ड 3797', grade: 'Grade A', default_rate: 950 },
      { commodity_name: 'Potato - Chipsona Premium', name: 'Factory Grade Chipsona', name_hi: 'फैक्ट्री ग्रेड चिप्सोना', grade: 'Grade A', default_rate: 1200 }
    ],
    parties: [
      { short_code: 'CCS', name: 'Chaudhary Charan Singh (Aligarh Farm)', type: 'Farmer', mobile: '9837011223', city: 'Aligarh', state: 'Uttar Pradesh' },
      { short_code: 'BCS', name: 'Balaji Chips & Snacks Pvt Ltd', type: 'Buyer', mobile: '9837044556', city: 'Kanpur', state: 'Uttar Pradesh' }
    ]
  });

  // ── 3. VASHI APMC MARKET, NAVI MUMBAI (महाराष्ट्र मंडी) ───────────────────────
  await seedMandi({
    tenant: {
      id: 'tenant-vashi-apmc',
      firm_name: 'Mumbai Agri Traders & Exporters',
      hindi_name: 'मुंबई एग्री ट्रेडर्स एवं एक्सपोर्टर्स',
      tagline: 'Vashi APMC Wholesale Trading & Port Consignments',
      proprietor: 'Milind Deshmukh',
      shop_no: 'Fruit & Onion Yard, Shop F-108',
      mandi_name: 'Vashi APMC Market, Navi Mumbai - 400703',
      apmc_license_no: 'MH-VASHI-2024-88',
      phone: '9820098200',
      logo_icon: '🥭',
      theme_color: 'navy',
      business_type: 'fruit_vegetable',
      standard_commission: 2.5,
      palledari_rate_per_box: 12
    },
    user: {
      id: 'usr-vashi-admin',
      name: 'Milind Deshmukh (Vashi APMC)',
      email: 'vashi@mandi.in',
      phone: '9820098200',
      pin: '1234'
    },
    commodities: [
      { name_en: 'Mango - Ratnagiri Alphonso (Hapus)', name_hi: 'आम - हापुस रत्नागिरी', category: 'Fruit', default_unit: 'Box (20kg)', unit_weight_kg: 20, tare_deduction_kg: 1.0, standard_commission_pct: 3.5, palledari_rate_per_unit: 15 },
      { name_en: 'Onion - Nashik Red Garwa', name_hi: 'प्याज - नासिक लाल गरवा', category: 'Vegetable', default_unit: 'Bag (50kg)', unit_weight_kg: 50, tare_deduction_kg: 1.0, standard_commission_pct: 2.0, palledari_rate_per_unit: 10 },
      { name_en: 'Pomegranate - Solapur Bhagwa', name_hi: 'अनार - सोलापुर भगवा', category: 'Fruit', default_unit: 'Crate (10kg)', unit_weight_kg: 10, tare_deduction_kg: 0.8, standard_commission_pct: 3.0, palledari_rate_per_unit: 8 }
    ],
    varieties: [
      { commodity_name: 'Mango - Ratnagiri Alphonso (Hapus)', name: 'Grade 1 GI Tag Alphonso', name_hi: 'हापुस जीआई टैग', grade: 'Grade A', default_rate: 2200 }
    ],
    parties: [
      { short_code: 'RMO', name: 'Ratnagiri Mango Orchards', type: 'Farmer', mobile: '9820011998', city: 'Ratnagiri', state: 'Maharashtra' },
      { short_code: 'KFW', name: 'Kalyan Fruit Wholesalers', type: 'Buyer', mobile: '9820022334', city: 'Thane', state: 'Maharashtra' }
    ]
  });

  // ── 4. KOLAR TOMATO & VEGETABLE MARKET, KARNATAKA ─────────────────────────
  await seedMandi({
    tenant: {
      id: 'tenant-kolar-yard',
      firm_name: 'Kolar Vegetable & Tomato Yard Agency',
      hindi_name: 'कोलार सब्जी व टमाटर मंडी एजेंसी',
      tagline: 'Direct Farmer Crate Auction & South India Distribution',
      proprietor: 'M. Venkatesh Gowda',
      shop_no: 'Vegetable Yard No. 22',
      mandi_name: 'APMC Market Yard, Kolar, Karnataka',
      apmc_license_no: 'KA-KOLAR-2024-34',
      phone: '9845012345',
      logo_icon: '🍅',
      theme_color: 'purple',
      business_type: 'fruit_vegetable',
      standard_commission: 2.5,
      palledari_rate_per_box: 10
    },
    user: {
      id: 'usr-kolar-admin',
      name: 'M. Venkatesh Gowda (Kolar Yard)',
      email: 'kolar@mandi.in',
      phone: '9845012345',
      pin: '1234'
    },
    commodities: [
      { name_en: 'Tomato - Hybrid Red 15kg Crate', name_hi: 'टमाटर - हाइब्रिड', category: 'Vegetable', default_unit: 'Crate (15kg)', unit_weight_kg: 15, tare_deduction_kg: 1.0, standard_commission_pct: 2.5, palledari_rate_per_unit: 8 },
      { name_en: 'Green Chilli - Fresh G4', name_hi: 'हरी मिर्च - जी4', category: 'Vegetable', default_unit: 'Bag (30kg)', unit_weight_kg: 30, tare_deduction_kg: 1.0, standard_commission_pct: 2.5, palledari_rate_per_unit: 10 }
    ],
    varieties: [
      { commodity_name: 'Tomato - Hybrid Red 15kg Crate', name: 'Firm Red Export Crate', name_hi: 'टमाटर लाल कड़क', grade: 'Grade A', default_rate: 450 }
    ],
    parties: [
      { short_code: 'VRF', name: 'Venkata Reddy Tomato Farms', type: 'Farmer', mobile: '9845099887', city: 'Malur, Kolar', state: 'Karnataka' },
      { short_code: 'CMW', name: 'Chennai Mofussil Wholesalers', type: 'Buyer', mobile: '9845033445', city: 'Koyambedu, Chennai', state: 'Tamil Nadu' }
    ]
  });

  // ── 5. PUNJAB GRAIN MANDI (अनाज मंडी - गेहूं व धान) ────────────────────────
  await seedMandi({
    tenant: {
      id: 'tenant-punjab-grain',
      firm_name: 'Kisan Grain Trading Co.',
      hindi_name: 'किसान ग्रेन ट्रेडिंग कंपनी (अनाज आढ़त)',
      tagline: 'Wheat, Paddy & Oilseeds Commission Agency',
      proprietor: 'S. Gurpreet Singh',
      shop_no: 'Kisan Mandi Yard Shop 45',
      mandi_name: 'New Grain Market, Khanna (Punjab)',
      apmc_license_no: 'PB-KHN-2024-12',
      phone: '9876543210',
      logo_icon: '🌾',
      theme_color: 'amber',
      business_type: 'grain_mandi',
      standard_commission: 2.5,
      palledari_rate_per_box: 15
    },
    user: {
      id: 'usr-grain-admin',
      name: 'Gurpreet Singh (Khanna Grain Mandi)',
      email: 'grain@mandi.in',
      phone: '9876543210',
      pin: '1234'
    },
    commodities: [
      { name_en: 'Wheat - Sharbati Premium', name_hi: 'गेहूं - शरबती उत्तम', category: 'Grain', default_unit: 'Quintal (क्विंटल)', unit_weight_kg: 100, tare_deduction_kg: 0.5, standard_commission_pct: 2.5, palledari_rate_per_unit: 15 },
      { name_en: 'Paddy - Basmati 1121', name_hi: 'धान - बासमती 1121', category: 'Grain', default_unit: 'Quintal (क्विंटल)', unit_weight_kg: 100, tare_deduction_kg: 0.5, standard_commission_pct: 2.5, palledari_rate_per_unit: 15 }
    ],
    varieties: [
      { commodity_name: 'Wheat - Sharbati Premium', name: 'Sharbati Bold Grain', name_hi: 'शरबती मोटा दाना', grade: 'Grade A', default_rate: 2600 }
    ],
    parties: [
      { short_code: 'GJS', name: 'Gurdial Singh Farmer', type: 'Farmer', mobile: '9876511223', city: 'Samrala, Ludhiana', state: 'Punjab' },
      { short_code: 'ARM', name: 'Aggarwal Rice & Flour Mills', type: 'Buyer', mobile: '9876599887', city: 'Khanna', state: 'Punjab' }
    ]
  });

  console.log('🎉 All 5 diverse Mandis, Banana Ripening Stores, and Cold Storages seeded and ready for deploy & testing!');
  process.exit(0);
}

migrateAndSeed().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
