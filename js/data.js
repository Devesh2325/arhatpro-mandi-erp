/**
 * Seed data and Master Repository for Azadpur Mandi Connect
 */

const MandiData = {
  mandiInfo: {
    name: "APMC Azadpur Wholesale Market",
    hindiName: "कृषि उपज विपणन समिति (एपीएमसी) आज़ादपुर मंडी",
    location: "Azadpur, New Delhi - 110033",
    apmcCode: "DL-AZD-001",
    totalSheds: 14,
    marketFeePercent: 1.0, // 1% APMC statutory cess
    developmentFeePercent: 1.0, // 1% Delhi Agricultural Marketing Board cess
    standardArhatCommission: 2.5 // 2.5% standard commission
  },

  sheds: [
    { id: "shed-1", name: "Shed No. 1 (Fruit Section - Apples)", commodity: "Apples", area: "New Fruit Market" },
    { id: "shed-2", name: "Shed No. 2 (Onion Market)", commodity: "Onion", area: "Onion Yard" },
    { id: "shed-3", name: "Shed No. 3 (Potato & Garlic Yard)", commodity: "Potato", area: "Potato Yard" },
    { id: "shed-4", name: "Shed No. 4 (Citrus & Oranges)", commodity: "Citrus", area: "Fruit Section" },
    { id: "shed-5", name: "Shed No. 5 (Tomato & Capsicum)", commodity: "Tomato", area: "Subzi Mandi" },
    { id: "shed-6", name: "Shed No. 6 (Green Vegetables)", commodity: "Green Veg", area: "Subzi Mandi" }
  ],

  commodities: [
    {
      id: "apple-royal",
      name: "Apple - Royal Delicious",
      hindiName: "सेब - रॉयल डिलीशियस",
      category: "Fruit",
      origin: "Shimla, Himachal Pradesh",
      unit: "Box (20kg)",
      minPrice: 1600,
      maxPrice: 2400,
      modalPrice: 2050,
      arrivalsToday: 4200, // Boxes
      trend: "up", // up, down, stable
      changePct: "+4.2%",
      image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=300&q=80",
      history: [1850, 1900, 1920, 1980, 2000, 2010, 2050]
    },
    {
      id: "onion-nashik",
      name: "Onion - Red Garwa",
      hindiName: "प्याज - लाल गारवा",
      category: "Vegetable",
      origin: "Lasalgaon / Nashik, Maharashtra",
      unit: "Quintal (100kg)",
      minPrice: 2200,
      maxPrice: 2900,
      modalPrice: 2650,
      arrivalsToday: 950, // Quintals
      trend: "down",
      changePct: "-2.1%",
      image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=300&q=80",
      history: [2800, 2750, 2700, 2720, 2680, 2660, 2650]
    },
    {
      id: "potato-pukhraj",
      name: "Potato - Pukhraj Fresh",
      hindiName: "आलू - पुखराज",
      category: "Vegetable",
      origin: "Agra, Uttar Pradesh",
      unit: "Sack (50kg)",
      minPrice: 750,
      maxPrice: 980,
      modalPrice: 880,
      arrivalsToday: 3100, // Sacks
      trend: "stable",
      changePct: "0.0%",
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=300&q=80",
      history: [870, 875, 880, 880, 885, 880, 880]
    },
    {
      id: "tomato-hybrid",
      name: "Tomato - Hybrid Red",
      hindiName: "टमाटर - हाइब्रिड लाल",
      category: "Vegetable",
      origin: "Kolar, Karnataka",
      unit: "Crate (25kg)",
      minPrice: 420,
      maxPrice: 650,
      modalPrice: 560,
      arrivalsToday: 5400, // Crates
      trend: "up",
      changePct: "+6.8%",
      image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80",
      history: [480, 500, 510, 530, 520, 545, 560]
    },
    {
      id: "mango-safeda",
      name: "Mango - Safeda / Banganapalle",
      hindiName: "आम - सफेदा",
      category: "Fruit",
      origin: "Vijayawada, Andhra Pradesh",
      unit: "Crate (18kg)",
      minPrice: 1100,
      maxPrice: 1750,
      modalPrice: 1450,
      arrivalsToday: 1800,
      trend: "down",
      changePct: "-3.5%",
      image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=300&q=80",
      history: [1600, 1550, 1520, 1500, 1480, 1460, 1450]
    },
    {
      id: "garlic-desi",
      name: "Garlic - Desi Mandsaur",
      hindiName: "लहसुन - देसी मंदसौर",
      category: "Vegetable",
      origin: "Mandsaur, Madhya Pradesh",
      unit: "Quintal (100kg)",
      minPrice: 9500,
      maxPrice: 13500,
      modalPrice: 11800,
      arrivalsToday: 420,
      trend: "up",
      changePct: "+1.9%",
      image: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=300&q=80",
      history: [11200, 11400, 11500, 11600, 11650, 11750, 11800]
    }
  ],

  // Pre-configured Lots currently in Mandi
  initialLots: [
    {
      id: "LOT-AZD-101",
      commodityId: "apple-royal",
      commodityName: "Apple - Royal Delicious",
      variety: "Super Grade (Medium Size, 22-24mm)",
      farmerName: "Harish Negi",
      farmerLocation: "Kotkhai, Shimla (HP)",
      farmerPhone: "+91 98160 44321",
      arhatiyaShop: "Shop No. C-42, Fruit Market",
      arhatiyaName: "Shree Ganesh Fruit Co. (Ramesh Chawla)",
      totalQuantity: 240,
      unit: "Box (20kg)",
      grade: "Grade A",
      reservePrice: 1950,
      currentBid: 2150,
      highestBidder: "Blinkit Procurements / Delhi NCR",
      bidsCount: 7,
      status: "live", // "live", "sold", "upcoming"
      timeRemainingSec: 180,
      truckNo: "HP-10-B-9812",
      palledariPerUnit: 12,
      createdTime: "06:15 AM"
    },
    {
      id: "LOT-AZD-102",
      commodityId: "onion-nashik",
      commodityName: "Onion - Red Garwa",
      variety: "Medium-Bold 55mm+",
      farmerName: "Pandurang Jadhav",
      farmerLocation: "Dindori, Nashik (MH)",
      farmerPhone: "+91 94231 87211",
      arhatiyaShop: "Shop No. B-12, Onion Yard",
      arhatiyaName: "Choudhary & Sons Onion Traders",
      totalQuantity: 180,
      unit: "Quintal (100kg)",
      grade: "Grade A+",
      reservePrice: 2500,
      currentBid: 2680,
      highestBidder: "Aggarwal Wholesale Mart, Tilak Nagar",
      bidsCount: 12,
      status: "live",
      timeRemainingSec: 95,
      truckNo: "MH-15-EG-4401",
      palledariPerUnit: 15,
      createdTime: "05:40 AM"
    },
    {
      id: "LOT-AZD-103",
      commodityId: "tomato-hybrid",
      commodityName: "Tomato - Hybrid Red",
      variety: "Firm Salad Grade (3-day shelf life)",
      farmerName: "M. Venkatesh",
      farmerLocation: "Chintamani, Kolar (KA)",
      farmerPhone: "+91 98450 12099",
      arhatiyaShop: "Shop No. A-88, Subzi Mandi",
      arhatiyaName: "Gupta Sabzi Commission Agency",
      totalQuantity: 350,
      unit: "Crate (25kg)",
      grade: "Grade A",
      reservePrice: 520,
      currentBid: 580,
      highestBidder: "Rajdhani Hotel Supplies, Connaught Place",
      bidsCount: 9,
      status: "sold",
      soldPrice: 580,
      soldTo: "Rajdhani Hotel Supplies",
      timeRemainingSec: 0,
      truckNo: "KA-07-A-8120",
      palledariPerUnit: 8,
      createdTime: "05:10 AM"
    }
  ],

  // Arhatiya Bahi-Khata (Ledgers & Receivables)
  bahiKhataAccounts: [
    {
      id: "ACC-BUYER-01",
      partyName: "Aggarwal Wholesale Mart",
      contact: "+91 98110 55432",
      address: "Shop 14, Tilak Nagar Sabzi Mandi, Delhi",
      totalPurchases: 485000,
      totalPaid: 360000,
      outstandingUdhaar: 125000,
      creditLimit: 200000,
      overdueDays: 12,
      lastPaymentDate: "2026-09-14",
      status: "Overdue"
    },
    {
      id: "ACC-BUYER-02",
      partyName: "Blinkit Darkstore Hub 4 (Narela)",
      contact: "+91 98711 22334",
      address: "Warehouse Block C, Narela Industrial Area",
      totalPurchases: 1420000,
      totalPaid: 1380000,
      outstandingUdhaar: 40000,
      creditLimit: 500000,
      overdueDays: 2,
      lastPaymentDate: "2026-09-19",
      status: "Good"
    },
    {
      id: "ACC-BUYER-03",
      partyName: "Rajdhani Hotel & Caterers Supply",
      contact: "+91 99100 88776",
      address: "B-21, Daryaganj, New Delhi",
      totalPurchases: 320000,
      totalPaid: 210000,
      outstandingUdhaar: 110000,
      creditLimit: 150000,
      overdueDays: 21,
      lastPaymentDate: "2026-08-30",
      status: "Critical"
    }
  ],

  // APMC Gate Log (Inward & Outward)
  gateLogs: [
    {
      passId: "GP-IN-9821",
      direction: "INWARD",
      truckNo: "HP-10-B-9812",
      driverName: "Surjeet Singh",
      driverPhone: "+91 98166 12345",
      commodity: "Apple - Royal",
      grossWeightKg: 18450,
      tareWeightKg: 6200,
      netWeightKg: 12250,
      assignedShed: "Shed No. 1 (Fruit Section)",
      arhatiyaShop: "Shop No. C-42 (Shree Ganesh Fruit Co.)",
      entryTime: "04:30 AM",
      status: "In Mandi Yard",
      verified: true
    },
    {
      passId: "GP-OUT-4412",
      direction: "OUTWARD",
      truckNo: "DL-1L-AA-3329",
      driverName: "Mohan Lal",
      driverPhone: "+91 98990 67890",
      commodity: "Tomato (Hybrid Red) - 350 Crates",
      destination: "Connaught Place / South Delhi",
      buyerName: "Rajdhani Hotel Supplies",
      issuedBy: "Gupta Sabzi Agency",
      cessPaid: true,
      exitTime: "08:15 AM",
      status: "Exited Yard",
      verified: true
    }
  ]
};

// Local storage helper
function getStoredData(key, defaultData) {
  try {
    const data = localStorage.getItem('azadpur_' + key);
    return data ? JSON.parse(data) : defaultData;
  } catch (e) {
    return defaultData;
  }
}

function saveStoredData(key, data) {
  try {
    localStorage.setItem('azadpur_' + key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to local storage', e);
  }
}
