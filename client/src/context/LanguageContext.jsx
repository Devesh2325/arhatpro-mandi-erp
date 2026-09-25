import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' }
];

export const TRANSLATIONS = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    quick_trade: 'Quick Trade',
    arrivals: 'Inward Arrivals',
    sales: 'Auction & Sales',
    bahi_khata: 'Bahi-Khata & Rokad',
    reports: 'Mandi Reports',
    settings: 'Settings & Masters',
    super_admin: 'Super Admin HQ',
    operations: 'Mandi Operations',
    agency_switcher: 'Agency Switcher',
    single_agency: 'Single Agency (Isolated)',

    // Actions & Common
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    submit: 'Submit',
    print: 'Print',
    print_report: 'Print Report',
    export_csv: 'Export CSV',
    search: 'Search',
    filter: 'Filter',
    refresh: 'Refresh',
    clear: 'Clear',
    fresh_form: 'Fresh Form',
    sample_data: 'Sample Data',
    add: 'Add',
    close: 'Close',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    total: 'Total',
    loading: 'Loading...',
    logout: 'Log Out',
    active: 'Active',
    inactive: 'Inactive',
    all: 'All',
    view: 'View',
    download: 'Download',

    // User Roles
    role_super_admin: 'Super Admin',
    role_shop_admin: 'Agency Admin',
    role_munshi: 'Lead Munshi',
    role_accountant: 'Accountant',

    // Mandi Terms
    farmer: 'Farmer / Grower',
    farmer_name: 'Farmer Name',
    buyer: 'Wholesale Buyer',
    buyer_name: 'Buyer Name',
    commodity: 'Commodity',
    variety: 'Variety',
    quantity: 'Quantity (Bags/Boxes)',
    unit: 'Unit',
    weight: 'Weight (Kg)',
    rate: 'Auction Rate (₹)',
    gross_amount: 'Gross Amount (₹)',
    net_amount: 'Net Amount (₹)',
    commission: 'Commission / Arhat (6%)',
    buyer_dami: 'Buyer Dami (2%)',
    palledari: 'Palledari / Labor',
    freight: 'Total Freight (₹)',
    freight_advance: 'Freight Advance to Driver',
    freight_balance: 'Balance Freight',
    truck_no: 'Truck Registration No.',
    driver_name: 'Driver Name',
    driver_phone: 'Driver Mobile',
    lot_no: 'Lot Number',
    gate_pass: 'Gate Pass ID',
    purcha: 'Buyer Purcha',
    teep: 'Consignor Teep (Account Sale)',
    form_j: 'APMC Form J (Sale Certificate)',
    form_m: 'APMC Form M (Monthly Return)',
    udhaar: 'Outstanding Udhaar',
    credit_limit: 'Credit Limit',
    cash_in: 'Cash In (Receipt)',
    cash_out: 'Cash Out (Payment)',
    rokad: 'Rokad Cashbook',
    bahi_khata_title: 'Bahi-Khata Ledger',
    journal: 'Double-Entry Journal',
    aging: '15-Day Aging & Interest',

    // Date Presets
    today: 'Today',
    yesterday: 'Yesterday',
    last_7_days: 'Last 7 Days',
    this_month: 'This Month',
    all_dates: 'All Dates',

    // Reports Tabs
    tab_buyer_purcha: 'Buyer Purcha',
    tab_buyer_balance: 'Buyer Balance',
    tab_grower_balance: 'Grower Balance',
    tab_buyer_summary: 'Buyer Summary',
    tab_grower_summary: 'Grower Summary',
    tab_grower_arrival: 'Grower Arrival',
    tab_statutory: 'APMC Legal Forms',

    // Settings Tabs
    tab_firm_profile: 'Firm Profile & Bank',
    tab_commodities: 'Commodity Master',
    tab_parties: 'Party Master (Farmers & Buyers)',
    tab_billing: 'Bill & Invoicing Setup',
    tab_staff: 'Staff & Team Access'
  },
  hi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    quick_trade: 'एकल सौदा',
    arrivals: 'गाड़ी आवक',
    sales: 'बोली व बिक्री',
    bahi_khata: 'बही-खाता एवं रोकड़',
    reports: 'मंडी रिपोर्ट्स',
    settings: 'सेटिंग्स व मास्टर',
    super_admin: 'सुपर एडमिन',
    operations: 'मंडी व्यापार',
    agency_switcher: 'एजेंसी बदलें',
    single_agency: 'एकल एजेंसी (सुरक्षित)',

    // Actions & Common
    save: 'सुरक्षित करें',
    saving: 'सुरक्षित हो रहा है...',
    cancel: 'रद्द करें',
    edit: 'संशोधित करें',
    delete: 'हटाएँ',
    submit: 'जमा करें',
    print: 'प्रिंट करें',
    print_report: 'प्रिंट रिपोर्ट',
    export_csv: 'एक्सेल निर्यात',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    refresh: 'ताज़ा करें',
    clear: 'साफ़ करें',
    fresh_form: 'साफ़ करें',
    sample_data: 'डेमो भरें',
    add: 'नया जोड़ें',
    close: 'बंद करें',
    actions: 'कार्रवाई',
    status: 'स्थिति',
    date: 'दिनांक',
    total: 'कुल योग',
    loading: 'लोड हो रहा है...',
    logout: 'लॉग आउट',
    active: 'सक्रिय',
    inactive: 'निष्क्रिय',
    all: 'सभी',
    view: 'देखें',
    download: 'डाउनलोड',

    // User Roles
    role_super_admin: 'सुपर एडमिन',
    role_shop_admin: 'आढ़त मालिक',
    role_munshi: 'मुख्य मुंशी',
    role_accountant: 'मुनीम जी / अकाउंटेंट',

    // Mandi Terms
    farmer: 'किसान / उत्पादक',
    farmer_name: 'किसान का नाम',
    buyer: 'थोक खरीदार',
    buyer_name: 'खरीदार का नाम',
    commodity: 'फसल / जिंस',
    variety: 'किस्म',
    quantity: 'मात्रा (नग/बोरी)',
    unit: 'इकाई',
    weight: 'वजन (किलो)',
    rate: 'नीलामी भाव (₹)',
    gross_amount: 'सकल राशि (₹)',
    net_amount: 'शुद्ध देय राशि (₹)',
    commission: 'आढ़त / कमीशन (6%)',
    buyer_dami: 'खरीदार दामी (2%)',
    palledari: 'पल्लेदारी / मजदूरी',
    freight: 'गाड़ी भाड़ा (₹)',
    freight_advance: 'चालक को पेशगी भाड़ा',
    freight_balance: 'बकाया भाड़ा',
    truck_no: 'गाड़ी नंबर',
    driver_name: 'चालक का नाम',
    driver_phone: 'चालक का फोन',
    lot_no: 'ढेरी / लॉट संख्या',
    gate_pass: 'गेट पास संख्या',
    purcha: 'खरीदार पर्चा',
    teep: 'पक्का टीप (खाता बिक्री)',
    form_j: 'फॉर्म जे (विक्रय प्रमाण पत्र)',
    form_m: 'फॉर्म एम (मासिक रिटर्न)',
    udhaar: 'बकाया उधार',
    credit_limit: 'साख सीमा',
    cash_in: 'रोकड़ आवक (जमा)',
    cash_out: 'रोकड़ जावक (नाम/भुगतान)',
    rokad: 'रोकड़ बही',
    bahi_khata_title: 'बही-खाता लेजर',
    journal: 'जर्नल वाउचर (रोजनामचा)',
    aging: '15-दिवसीय ब्याज गणना',

    // Date Presets
    today: 'आज',
    yesterday: 'कल',
    last_7_days: 'पिछले 7 दिन',
    this_month: 'इस माह',
    all_dates: 'सभी तिथियाँ',

    // Reports Tabs
    tab_buyer_purcha: 'खरीदार पर्चा',
    tab_buyer_balance: 'खरीदार बकाया',
    tab_grower_balance: 'किसान बकाया व भुगतान',
    tab_buyer_summary: 'खरीदार सारांश',
    tab_grower_summary: 'किसान सारांश',
    tab_grower_arrival: 'गाड़ी आवक रजिस्टर',
    tab_statutory: 'पक्का टीप व जे-फॉर्म',

    // Settings Tabs
    tab_firm_profile: 'फर्म विवरण व बैंक',
    tab_commodities: 'फसल मास्टर व दरें',
    tab_parties: 'व्यापारी व किसान डायरेक्टरी',
    tab_billing: 'बिल व इनवॉइसिंग प्रारूप',
    tab_staff: 'कर्मचारी व मुंशी अधिकार'
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('mandi_lang') || 'en';
  });

  const setLanguage = (lang) => {
    if (TRANSLATIONS[lang]) {
      setLanguageState(lang);
      localStorage.setItem('mandi_lang', lang);
      document.documentElement.lang = lang;
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  /**
   * Flexible translation helper:
   * 1. t('key') -> looks up key in dictionary
   * 2. t('English Text', 'हिन्दी टेक्स्ट') -> returns appropriate text based on language
   * 3. t({ en: 'English', hi: 'हिन्दी' }) -> returns appropriate localized string
   */
  const t = (enOrKey, hiOrFallback) => {
    if (!enOrKey) return '';

    // Passed as object { en: '...', hi: '...' }
    if (typeof enOrKey === 'object') {
      return enOrKey[language] || enOrKey.en || '';
    }

    // Passed as t('English Text', 'हिन्दी टेक्स्ट')
    if (hiOrFallback !== undefined) {
      return language === 'hi' ? hiOrFallback : enOrKey;
    }

    // Passed as key string: t('dashboard')
    if (TRANSLATIONS[language] && TRANSLATIONS[language][enOrKey]) {
      return TRANSLATIONS[language][enOrKey];
    }
    if (TRANSLATIONS.en && TRANSLATIONS.en[enOrKey]) {
      return TRANSLATIONS.en[enOrKey];
    }

    return enOrKey;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      toggleLanguage,
      isHindi: language === 'hi',
      isEnglish: language === 'en',
      t,
      supportedLanguages: SUPPORTED_LANGUAGES
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
