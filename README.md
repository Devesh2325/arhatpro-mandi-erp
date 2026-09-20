# 🌾 ArhatPro Mandi ERP (Azadpur Mandi, Delhi)

Enterprise Commission Agent ERP, Multi-Tenant SaaS Platform, and APMC Trade Automation Suite.

## 🚀 Key Features

- **⚡ Unified Consignment & Multi-Lot Sales**: Real-time lot splitting, crate allocation, and instant Teep generation.
- **🚚 Inward Arrivals & Freight Advances**: Track truck arrivals, driver cash advances, unloading palledari, and empty crate accounting.
- **🏷️ Multi-Buyer Bidding & Hammer Sales**: Split lots across multiple buyers with customized rates, discounts, and payment terms.
- **📖 Automated Double-Entry General Journal (रोजनामचा बही)**: Real-time Debit-to-Credit auto-balancing (`Dr = Cr`) with multi-ledger synchronisation.
- **📑 Mandi Reports Suite**: Sealed owner Teep final sales, Buyer Purcha (I-Forms), Farmer J-Forms, Aging debt balance, and APMC Statutory Form 'M'.
- **👑 Platform Super Admin Portal (`admin.html`)**: Central portal for platform owner (`dmchaturvedi@gmail.com`) to manage subscriptions, audit tenants, and monitor platform metrics.
- **🔒 View-Only Audit Impersonation**: Inspect any agency's live workspace with strict mutation locks.
- **🏢 Strict Multi-Tenant Isolation**: Independent agency workspaces with custom white-label branding, isolated data stores, and role-based staff provisioning (Shop Admin, Munshi, Accountant).

## 🛠️ Tech Stack

- **Frontend**: HTML5, Modern Vanilla JavaScript (Modular ES6 Engines), Tailwind CSS
- **Visualization**: Chart.js, QRCode.js
- **Architecture**: Multi-Tenant Isolated Local Storage, Progressive Web App (PWA)
- **Local Server**: PowerShell Static Web Server (`server.ps1`)

## 💻 Quick Start

1. Start the local server:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\server.ps1
   ```
2. Open in browser:
   - Commission Agent Workspace: `http://localhost:8080/index.html`
   - Platform Super Admin Console: `http://localhost:8080/admin.html`
