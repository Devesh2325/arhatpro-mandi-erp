/**
 * Internationalization (i18n) dictionary for Azadpur Mandi Connect (English & Hindi)
 */

const I18N = {
  currentLang: 'en', // 'en' or 'hi'

  translations: {
    en: {
      appName: "Azadpur Mandi Connect",
      apmcSubTitle: "APMC Wholesale Market, Azadpur, Delhi",
      roleFarmer: "Kisan (Farmer)",
      roleArhatiya: "Kachha Arhatiya (Agent)",
      roleBuyer: "Vyapari (Buyer)",
      roleGate: "APMC Gate Security",
      
      // Tabs & Sections
      tabMandiBhav: "Live Mandi Bhav",
      tabAuctions: "e-Auctions",
      tabBahiKhata: "Bahi-Khata Ledger",
      tabInvoices: "J/I-Form Bills",
      tabGatePass: "Gate Entry & Pass",
      
      // Mandi Bhav Cards
      liveRatesTitle: "Today's Wholesale Rates (Azadpur)",
      arrivalsCount: "Arrivals Today",
      modalRate: "Modal Rate (औसत भाव)",
      minMaxRate: "Min / Max Range",
      priceTrend: "7-Day Price Trend",
      viewChart: "View Trend",
      
      // Auction section
      activeLots: "Live Auctions in Sheds",
      placeBid: "Place Bid",
      highestBid: "Highest Bid",
      reservePrice: "Reserve Price",
      timeRemaining: "Time Left",
      bidNow: "Bid Now",
      createLot: "+ Create New Lot",
      hammerAuction: "Close & Finalize Deal (Hammer)",
      auctionWon: "Lot Sold!",
      
      // Billing / Forms
      generateJForm: "Issue Farmer J-Form",
      generateIForm: "Issue Buyer I-Form",
      grossAmount: "Gross Sale Value",
      mandiCess: "APMC Mandi Fee (1%)",
      palledariCharge: "Palledari / Hamali Charge",
      arhatCommission: "Arhatiya Commission (2.5%)",
      netPayableFarmer: "Net Payable to Farmer",
      totalBuyerInvoice: "Total Buyer Payable",
      downloadPdf: "Download PDF",
      printSlip: "Print Slip",

      // Bahi-Khata
      totalUdhaar: "Total Outstanding (उधारी)",
      overdueWarning: "Overdue Receivables",
      sendWhatsAppReminder: "WhatsApp Reminder",
      recordPayment: "Receive Payment",

      // Gate Pass
      inwardTrucks: "Inward Produce Trucks",
      outwardTrucks: "Dispatched Vehicles",
      newInwardPass: "+ New Truck Gate Entry",
      scanQrPass: "Scan Outward Gate Pass",
      weighbridgeSlip: "Weighbridge Tare / Net Weight"
    },

    hi: {
      appName: "आज़ादपुर मंडी कनेक्ट",
      apmcSubTitle: "कृषि उपज विपणन समिति (APMC), आज़ादपुर, दिल्ली",
      roleFarmer: "किसान (विक्रेता)",
      roleArhatiya: "कच्चा आढ़ती (कमीशन एजेंट)",
      roleBuyer: "थोक व्यापारी (खरीदार)",
      roleGate: "मंडी गेट व सुरक्षा",
      
      // Tabs & Sections
      tabMandiBhav: "लाइव मंडी भाव",
      tabAuctions: "ई-नीलामी (बोली)",
      tabBahiKhata: "बही-खाता (उधारी)",
      tabInvoices: "जे-फॉर्म / आई-फॉर्म",
      tabGatePass: "गेट पास व आवक",
      
      // Mandi Bhav Cards
      liveRatesTitle: "आज के थोक मंडी भाव (आज़ादपुर)",
      arrivalsCount: "आज की कुल आवक",
      modalRate: "औसत भाव (Modal Rate)",
      minMaxRate: "न्यूनतम / अधिकतम भाव",
      priceTrend: "7 दिनों का भाव रुझान",
      viewChart: "रुझान देखें",
      
      // Auction section
      activeLots: "शेडों में चालू लाइव नीलामियां",
      placeBid: "बोली लगाएं",
      highestBid: "उच्चतम बोली",
      reservePrice: "न्यूनतम मूल्य (Reserve)",
      timeRemaining: "शेष समय",
      bidNow: "बोली लगाएं",
      createLot: "+ नया माल (Lot) दर्ज करें",
      hammerAuction: "नीलामी बंद करें व सौदा पक्का करें",
      auctionWon: "सौदा फाइनल हुआ!",
      
      // Billing / Forms
      generateJForm: "किसान जे-फॉर्म (J-Form) बनाएं",
      generateIForm: "व्यापारी आई-फॉर्म (I-Form) बनाएं",
      grossAmount: "कुल बिक्री राशि",
      mandiCess: "मंडी शुल्क (1% APMC)",
      palledariCharge: "पल्लेदारी / मजदूरी खर्च",
      arhatCommission: "आढ़त कमीशन (2.5%)",
      netPayableFarmer: "किसान को देय शुद्ध राशि",
      totalBuyerInvoice: "व्यापारी कुल भुगतान",
      downloadPdf: "पीडीएफ डाउनलोड करें",
      printSlip: "पर्ची प्रिंट करें",

      // Bahi-Khata
      totalUdhaar: "कुल बकाया उधारी (Udhaari)",
      overdueWarning: "समय सीमा पार उधारी",
      sendWhatsAppReminder: "व्हाट्सएप तकादा भेजें",
      recordPayment: "भुगतान दर्ज करें",

      // Gate Pass
      inwardTrucks: "आवक ट्रक (मंडी प्रवेश)",
      outwardTrucks: "जावक गाड़ियां (मंडी निकास)",
      newInwardPass: "+ नई गाड़ी गेट एंट्री दर्ज करें",
      scanQrPass: "आउटवर्ड गेट पास स्कैन करें",
      weighbridgeSlip: "कांटा पर्ची (वजन माप)"
    }
  },

  t: function(key) {
    const lang = this.currentLang;
    if (this.translations[lang] && this.translations[lang][key]) {
      return this.translations[lang][key];
    }
    return this.translations['en'][key] || key;
  },

  setLanguage: function(lang) {
    if (lang === 'en' || lang === 'hi') {
      this.currentLang = lang;
      localStorage.setItem('azadpur_lang', lang);
      document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }
  },

  init: function() {
    const saved = localStorage.getItem('azadpur_lang');
    if (saved && (saved === 'en' || saved === 'hi')) {
      this.currentLang = saved;
    }
  }
};

I18N.init();
