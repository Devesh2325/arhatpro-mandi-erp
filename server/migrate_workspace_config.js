const { run } = require('./database/db');

async function migrate() {
  console.log('⚡ Adding workspace_config & onboarding_completed to tenants table...');
  await run(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS workspace_config TEXT`);
  await run(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_completed INTEGER DEFAULT 1`);

  // Update default workspace config for our seeded demo tenants based on their business_type
  await run(`
    UPDATE tenants 
    SET workspace_config = ? 
    WHERE id = 'tenant-banana-store'
  `, [JSON.stringify({
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
  })]);

  await run(`
    UPDATE tenants 
    SET workspace_config = ? 
    WHERE id = 'tenant-cold-storage'
  `, [JSON.stringify({
    businessCategory: 'cold_storage',
    businessTitle: 'Potato & Produce Cold Storage',
    businessTitleHi: 'आलू व कोल्ड स्टोरेज',
    icon: '🥔',
    showCrates: true,
    showChambers: true,
    showDriverFreight: true,
    showAgent: false,
    primaryFlow: 'arrivals',
    defaultUnit: 'Sack (50kg)'
  })]);

  await run(`
    UPDATE tenants 
    SET workspace_config = ? 
    WHERE id = 'tenant-punjab-grain'
  `, [JSON.stringify({
    businessCategory: 'grain_mandi',
    businessTitle: 'Grain & Pulses Mandi',
    businessTitleHi: 'अनाज, दलहन व तिलहन मंडी',
    icon: '🌾',
    showCrates: false,
    showChambers: false,
    showDriverFreight: true,
    showAgent: true,
    primaryFlow: 'quick-trade',
    defaultUnit: 'Quintal (क्विंटल)'
  })]);

  await run(`
    UPDATE tenants 
    SET workspace_config = ? 
    WHERE id = 'tenant-rat'
  `, [JSON.stringify({
    businessCategory: 'fruit_vegetable',
    businessTitle: 'Apple & Cold Fruit Yard',
    businessTitleHi: 'सेब व फल आढ़त',
    icon: '🍎',
    showCrates: true,
    showChambers: true,
    showDriverFreight: true,
    showAgent: true,
    primaryFlow: 'quick-trade',
    defaultUnit: 'Box (20kg)'
  })]);

  await run(`
    UPDATE tenants 
    SET workspace_config = ? 
    WHERE id = 'tenant-vashi-apmc'
  `, [JSON.stringify({
    businessCategory: 'fruit_vegetable',
    businessTitle: 'Fruit & Vegetable APMC Yard',
    businessTitleHi: 'फल व सब्जी मंडी आढ़त',
    icon: '🥭',
    showCrates: true,
    showChambers: false,
    showDriverFreight: true,
    showAgent: true,
    primaryFlow: 'quick-trade',
    defaultUnit: 'Crate (20kg)'
  })]);

  await run(`
    UPDATE tenants 
    SET workspace_config = ? 
    WHERE id = 'tenant-kolar-yard'
  `, [JSON.stringify({
    businessCategory: 'fruit_vegetable',
    businessTitle: 'Tomato & Vegetable Yard',
    businessTitleHi: 'टमाटर व सब्जी यार्ड',
    icon: '🍅',
    showCrates: true,
    showChambers: false,
    showDriverFreight: true,
    showAgent: false,
    primaryFlow: 'quick-trade',
    defaultUnit: 'Crate (20kg)'
  })]);

  console.log('✓ Migration of workspace_config completed successfully!');
  process.exit(0);
}

migrate().catch(e => {
  console.error(e);
  process.exit(1);
});
