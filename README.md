# ArhatPro Mandi ERP — Full-Stack Enterprise Platform

> **Modern Multi-Tenant APMC Trading Engine & Accounting ERP**
> Built with **React 18 + Tailwind CSS** (Frontend), **Node.js + Express REST API** (Backend), and **Relational SQL** (SQLite / PostgreSQL Database).

---

## 🌟 Tech Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend (FE)** | **React 18**, **Vite**, **Tailwind CSS**, **Lucide Icons** | Ultra-responsive Mandi UI, live auction hammer, gate pass & purcha print vouchers, dynamic multi-tenant theme switcher |
| **Backend (BE)** | **Node.js**, **Express REST API**, **JWT**, **Bcrypt** | Multi-tenant isolation middleware, atomic trade transaction locks, view-only audit impersonation mutation interceptors |
| **Database (DB)** | **Relational SQL** (`server/database/mandi.sqlite`) | 12 relational tables with foreign keys, double-entry general journal (`Dr = Cr`), 15-day APMC statutory debtor interest calculator |
| **Authentication** | **Role-Based Access Control (RBAC)** + **Audit Lock** | Platform Super Admin (`dmchaturvedi@gmail.com`), Shop Admin, Munshi (Data Entry), Accountant (Cashier), Viewer |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js (v18+)** and **npm**

### 2. Install Dependencies
```bash
# Install root, backend, and frontend packages
npm run install-all
```

### 3. Run the Production Stack (Single Port 5000)
```bash
npm start
```
👉 Open your browser at: **`http://localhost:5000`**

### 4. Run Development Stack (Hot-Reload)
In one terminal (Backend):
```bash
npm run server
```
In a second terminal (Vite Dev Server):
```bash
npm run client
```
👉 Open your browser at: **`http://localhost:5173`** (proxies `/api` to port `5000`)

---

## 🔑 Default Credentials

### 1. Platform Super Admin (Master HQ)
- **Email**: `dmchaturvedi@gmail.com`
- **Password**: `Devesh@23251995`
- **Capabilities**: Full platform overview, multi-tier subscription management (`Monthly`, `Yearly`, `Enterprise`), subscription validity extensions (`+30D`, `+1Y`), agency onboarding approval, and **View-Only Audit Impersonation** (mutation-locked).

### 2. Agency Owner / Shop Admin
- **Email / Phone**: `balwinder@mandi.in` / `9811012345`
- **Password / PIN**: `1234`
- **Firm**: Royal Apple Traders (APMC Azadpur, Delhi)

---

## 📂 Project Structure

```
azadpur-mandi-app/
├── client/                     # React 18 + Vite Frontend
│   ├── src/
│   │   ├── components/         # Sidebar, ImpersonationBanner
│   │   ├── context/            # AuthContext, TenantContext
│   │   ├── pages/
│   │   │   ├── Arrivals.jsx    # Inward truck consignments & freight advances
│   │   │   ├── AuthModal.jsx   # Login & self-serve agency signup
│   │   │   ├── BahiKhata.jsx   # Double-entry general journal (Dr=Cr), Rokad cashbook
│   │   │   ├── QuickTrade.jsx  # Atomic single-screen trade engine
│   │   │   ├── Reports.jsx     # APMC Teep, Purcha, J-Form, Form 'M'
│   │   │   ├── Sales.jsx       # Lot auction, split sales & buyer purcha slips
│   │   │   ├── Settings.jsx    # White-label agency branding, themes, staff
│   │   │   └── SuperAdmin.jsx  # SaaS tier management & audit impersonation
│   │   ├── App.jsx             # Main layout & navigation orchestrator
│   │   ├── api.js              # Unified REST API client
│   │   └── main.jsx            # React root mount
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Node.js + Express REST API Backend
│   ├── database/
│   │   ├── db.js               # Relational SQL schema, tables & auto-seed
│   │   └── mandi.sqlite        # SQLite relational database
│   ├── middleware/
│   │   └── auth.js             # JWT authentication & view-only mutation lock
│   ├── routes/
│   │   ├── admin.js            # Super admin metrics, tiers, validity & requests
│   │   ├── auth.js             # Login, signup, impersonate start/stop, /me
│   │   ├── ledger.js           # Bahi-Khata, Rokad, Double-entry Dr=Cr Journal
│   │   ├── tenants.js          # Multi-tenant isolation, branding, staff team
│   │   └── trade.js            # Commodities, parties, arrivals, lots, quick-trade
│   ├── index.js                # Express app entrypoint & static client serve
│   └── package.json
│
├── index.html                  # Original Vanilla JS standalone version
├── admin.html                  # Original Vanilla JS standalone admin
├── package.json                # Root orchestration scripts
└── README.md                   # System documentation
```

---

## ⚖️ Statutory APMC Mandi Compliance Features
- **Statutory Deductions**: Pre-configured with Delhi APMC Bye-Laws (6% Commission/Arhat, 2% Buyer Dami, 1% Market Fee, 1% RDF, ₹3/box Palledari).
- **15-Day Debtor Interest**: Automatic 18% p.a. interest calculation on overdue buyer credit exceeding 15 days.
- **Double-Entry Equilibrium Guarantee**: Journal vouchers strictly reject unbalanced entries (`Total Debit === Total Credit`).
- **Audit-Proof Impersonation**: Platform Super Admin can audit any tenant shop with a hardware-level view-only mutation lock (blocks `POST`, `PUT`, `DELETE`).
