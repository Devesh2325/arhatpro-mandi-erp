# 📋 ArhatPro Mandi ERP — Comprehensive QA Test Cases Sheet

**Document Version:** 2.1.0  
**Application:** ArhatPro Mandi ERP (APMC Trading Engine & Double-Entry Accounting)  
**Target Environment:** Local (`http://localhost:5000` / `http://localhost:5173`) & Cloud (`https://arhatpro-mandi-erp.vercel.app`)  
**Scope:** Functional Testing, Integration Testing, UI/UX Verification, Edge Cases & Security Auditing  

---

## 📑 Test Suite Index

| Module ID | Module Name | Test Case Count | Priority |
| :--- | :--- | :---: | :---: |
| **MOD-01** | Global Navigation & Header (Tenant Name, Buy Plan, Language) | 7 | High |
| **MOD-02** | Authentication & Role-Based Access Control (RBAC) | 8 | Critical |
| **MOD-03** | Inward Consignments / Arrivals (गाड़ी आवक) | 8 | Critical |
| **MOD-04** | Quick Trade (एकल सौदा - Rapid Auction Engine) | 8 | Critical |
| **MOD-05** | Sales & Multi-Buyer Lot Splitting (बिक्री व लॉट कटाई) | 6 | High |
| **MOD-06** | Parties Master (Farmer, Buyer, Agent) & CSV Import/Export | 7 | High |
| **MOD-07** | Commodities, Varieties & Mandi Expense Heads Configuration | 6 | Medium |
| **MOD-08** | Bahi Khata, Rokad Cashbook & Opening Balance | 8 | Critical |
| **MOD-09** | Double-Entry General Journal, Trial Balance & Balance Sheet | 6 | Critical |
| **MOD-10** | Super Admin Console & Audit Logging | 6 | High |
| **MOD-11** | Multi-Tenant Data Isolation & Security | 5 | Critical |
| **TOTAL** | **Comprehensive Scenarios** | **75 Scenarios** | — |

---

## 📌 Standard Test Preconditions (Environment Baseline)

Before executing manual or automated runs, verify the following baseline prerequisites:
1. **Database:** Supabase Cloud PostgreSQL connection is active and relational schema initialized (`users`, `tenants`, `commodities`, `varieties`, `expense_heads`, `parties`, `arrivals`, `sales_lots`, `split_sales`, `cash_transactions`, `journal_entries`, `audit_logs`).
2. **Server Status:** Backend API online on port `5000` (`GET /api/health` returns `{"status":"healthy"}`).
3. **Frontend Client:** React 18 client running on port `5173` or port `5000` with production bundle built.
4. **Pre-seeded Test Credentials:**
   - **Platform Super Admin:** `dmchaturvedi@gmail.com` / `Devesh@23251995`
   - **Shop Admin (Tenant 1):** `balwinder@mandi.in` / `1234` (Royal Apple Traders, Shop D-1102)
   - **Munshi / Data Entry:** `munshi@mandi.in` / `1234`
   - **Fresh Clean Tenant:** Tenant with zero initial transactions for testing Opening Cash = ₹0.

---

## 🏷️ Test Priority Legend
- **Critical (P0):** Core trade, money ledger balance, auth lockdown, or data-isolation leak. Blocks release.
- **High (P1):** Primary operational flows (Inward, Quick Trade, Buyer split, Party lookup).
- **Medium (P2):** Formatting, language switching, configuration defaults, sorting/filtering.
- **Low (P3):** Cosmetic badges, non-critical keyboard shortcuts, minor label alignments.

---

# 1. Global Navigation & Header (MOD-01)

| TC ID | Test Scenario | Preconditions | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-NAV-01** | Header displays Tenant Firm Name & Shop Info | User logged into Royal Apple Traders (`balwinder@mandi.in`) | 1. Open home screen (`/`).<br>2. Inspect the top-left area of the header bar. | Header prominently displays Firm Logo emoji (🍎), bold Firm Name (`Royal Apple Traders`), Shop No (`D-1102`), and Mandi Name (`Azadpur APMC`). | **P1** |
| **TC-NAV-02** | Buy Plan badge button presence & tier styling | User logged in with an active tenant | 1. Observe top-right section of header.<br>2. Check Buy Plan button appearance. | Button displays current plan badge (`Monthly`, `Starter`, `Pro`, etc.) with correct color styling (blue/emerald/purple) and an upgrade arrow indicator. | **P1** |
| **TC-NAV-03** | Buy Plan navigation to Settings Plans tab | User on Dashboard or Trade screen | 1. Click on the **Buy Plan** badge in the header.<br>2. Observe redirection and active sub-tab. | Navigates directly to `Settings` view with sub-tab pre-selected to `PLANS` (`sessionStorage.getItem('settings_active_subtab') === 'PLANS'`). | **P1** |
| **TC-NAV-04** | Super Admin header shows Crown badge without Buy Plan | Logged in as `dmchaturvedi@gmail.com` | 1. Inspect top-right header action bar. | Buy Plan button is hidden for Super Admin; replaced with distinct **Super Admin** purple button (`👑 Super Admin`). | **P2** |
| **TC-NAV-05** | Quick Trade header button shortcut | Logged in as any tenant user | 1. Click the `⚡ Quick Trade` button in the header. | Screen instantly changes from current page to `Quick Trade` without reloading the browser. | **P1** |
| **TC-NAV-06** | Multi-Language switcher in Header | User on any screen | 1. Click the Language dropdown in the header.<br>2. Select `हिन्दी (Hindi)`.<br>3. Select `English`. | UI strings update instantly across navigation, buttons, and summary cards between English and Hindi without network refresh. | **P2** |
| **TC-NAV-07** | Header User Profile Chip & Logout | User session active | 1. Check user avatar and role label in header.<br>2. Click the red Logout icon in header. | Shows user name, role icon/chip. Clicking Logout clears `mandi_jwt_token` from `localStorage` and redirects to the clean login screen. | **P0** |

---

# 2. Authentication & RBAC (MOD-02)

| TC ID | Test Scenario | Preconditions | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-AUTH-01** | Shop Admin Login via Phone & PIN | User exists in DB (`9811012345` / `1234`) | 1. Navigate to `/`.<br>2. Enter identifier `9811012345`.<br>3. Enter PIN `1234`.<br>4. Submit form. | Receives HTTP 200 with JWT token, stores token in `localStorage`, loads Dashboard with firm details. | **P0** |
| **TC-AUTH-02** | Super Admin Login via Email & Password | Master admin credentials | 1. Enter `dmchaturvedi@gmail.com`.<br>2. Enter `Devesh@23251995`.<br>3. Submit form. | Receives HTTP 200, JWT with `role: "super_admin"`, defaults directly to `Super Admin` control tab. | **P0** |
| **TC-AUTH-03** | Invalid Password / PIN rejection | Existing user record | 1. Enter `balwinder@mandi.in`.<br>2. Enter incorrect PIN `9999`.<br>3. Submit form. | Returns HTTP 401: *"Incorrect PIN or Password. Please check and try again."* Login denied. | **P0** |
| **TC-AUTH-04** | Non-existent User rejection | Clean session | 1. Enter `random_user@fake.com`.<br>2. Enter any password.<br>3. Submit. | Returns HTTP 401: *"Account not found. Please check your Email / Mobile Number."* | **P1** |
| **TC-AUTH-05** | Missing credentials validation | Clean session | 1. Leave PIN empty.<br>2. Click Login. | Returns HTTP 400 validation error; login request not submitted or rejected cleanly. | **P2** |
| **TC-AUTH-06** | Session persistence across browser reloads | User successfully authenticated | 1. Refresh page (`F5`).<br>2. Check if user stays logged in. | App calls `GET /api/auth/me` with stored Bearer token, validates token, keeps user logged in without prompting for login. | **P0** |
| **TC-AUTH-07** | Tampered or Expired Token handling | Token altered in `localStorage` | 1. Manually edit `mandi_jwt_token` to an invalid string in browser DevTools.<br>2. Reload page. | Returns HTTP 401/403, triggers `logout()`, clears token, and displays login modal. | **P1** |
| **TC-AUTH-08** | Unauthorized Super Admin escalation prevention | Non-super admin token | 1. Attempt to call `GET /api/admin/metrics` with Munshi or Shop Admin token. | API returns HTTP 403 Forbidden; access to Super Admin endpoints denied. | **P0** |

---

# 3. Inward Consignments / Arrivals (MOD-03)

| TC ID | Test Scenario | Preconditions | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ARV-01** | Full-Page Inward Entry Form UI Render (No Dialog) | Logged into Mandi app | 1. Click on **Arrivals (गाड़ी आवक)** or press `F3`. | Form renders inline full-page matching Quick Trade layout (no modal popup dialog), with two top tabs: *New Inward Entry Form* and *Inward Consignments Register*. | **P1** |
| **TC-ARV-02** | Create Inward Consignment with Live Lot Generation | Logged in, active commodity exists | 1. Select Entry Date (defaults to Today).<br>2. Enter Manual Lot Tag `LOT-PB-99`.<br>3. Enter Truck No `PB-02-X-1010`, Driver Name `Sardar Singh`, Mobile `9812345678`.<br>4. Freight Amount ₹8,000, Advance Paid ₹2,000.<br>5. Select Farmer via Search dropdown.<br>6. Select Agent `Sharma Bros`.<br>7. Enter Produce `Apple`, Variety `Royal Delicious`, Bags `200`, Rate ₹650.<br>8. Click **Confirm & Register Inward Arrival**. | HTTP 201 created. Generates `ARV-xxxx`, assigns `LOT-PB-99`, creates a live `sales_lots` record with 200 remaining bags, and logs freight advance in cashbook. | **P0** |
| **TC-ARV-03** | Dynamic Farmer Mandi Expenses Calculation | Inward form loaded | 1. Check expense checklist (e.g. Freight, Palledari, Mandi Cess).<br>2. Edit expense amounts directly in the input boxes. | Live calculated valuation card updates net payable to farmer taking deductions into account in real-time. | **P1** |
| **TC-ARV-04** | Freight Balance Due Live Badge Calculation | Truck freight entered | 1. Enter Total Freight = ₹10,000.<br>2. Enter Freight Advance = ₹3,500.<br>3. Observe header/form freight badge. | Badge immediately displays Freight Balance Due: ₹6,500 (`10,000 - 3,500`). | **P2** |
| **TC-ARV-05** | Entry Date Backdating Support | Inward form loaded | 1. Change Entry Date from today to `2026-09-15`.<br>2. Submit arrival. | Consignment is saved with historical date `2026-09-15`; lot register preserves backdated timestamp correctly. | **P1** |
| **TC-ARV-06** | Inline "Add New Party" for Farmer & Agent | Party not yet in directory | 1. In Farmer/Agent dropdown, type a new name `Kuldeep Singh Punjab`.<br>2. Click **+ Add Party** button inside the dropdown.<br>3. Complete quick popup with Phone & City.<br>4. Save party. | New party created in DB, auto-selected in the field without losing entered truck/produce data in the form. | **P0** |
| **TC-ARV-07** | Inward Consignments Register & Gate Pass Print | At least one arrival saved | 1. Click tab **Inward Consignments Register (गाड़ी आवक रजिस्टर)**.<br>2. Find consignment row.<br>3. Click **Print Gate Pass**. | Opens clean print voucher modal showing Truck No, Lot No, Farmer, Commodity, Bags, Freight details ready for printing. | **P1** |
| **TC-ARV-08** | Validation: Zero bags rejection | Fresh Inward form | 1. Leave Total Bags as 0 or empty.<br>2. Attempt to submit. | Submission blocked with validation error: *"Total Bags must be greater than 0."* | **P1** |

---

# 4. Quick Trade — Atomic Auction Engine (MOD-04)

| TC ID | Test Scenario | Preconditions | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-QT-01** | Atomic Quick Trade with Single Buyer Split | Active tenant, commodities setup | 1. Navigate to **Quick Trade** (`F2`).<br>2. Enter Truck `HR-26-9090`, Farmer `Devi Lal`.<br>3. Produce `Tomato`, Variety `Hybrid`, Rate ₹400.<br>4. Inward Bags = 100.<br>5. In Split Sale row: Select Buyer `Rajesh Veg`, Bags = 100, Rate = ₹480.<br>6. Click **Confirm & Complete Quick Trade**. | Transaction completes atomically: Arrival marked `Sold Out`, lot created and sold, Buyer ledger debited ₹48,000, Farmer credited, balanced Double-Entry Journal Voucher posted. | **P0** |
| **TC-QT-02** | Quick Trade with Multi-Buyer Split (3 Buyers) | Inward total bags = 150 | 1. Enter 150 bags arrived.<br>2. Buyer 1: 50 bags @ ₹500.<br>3. Buyer 2: 70 bags @ ₹520.<br>4. Buyer 3: 30 bags @ ₹490.<br>5. Submit trade. | System validates that split total (50+70+30 = 150) matches arrived total. Creates 3 separate split sale entries and posts journal vouchers for each buyer. | **P0** |
| **TC-QT-03** | Buyer & Farmer Mandi Expenses in Quick Trade | Expense heads configured in Settings | 1. Observe Farmer Expenses box in Farmer section.<br>2. Observe Buyer Expenses box in Buyer section.<br>3. Modify an expense rate. | Farmer net payout and Buyer gross bill correctly reflect respective deductions/additions. | **P1** |
| **TC-QT-04** | Manual Lot Number Assignment | Quick Trade form | 1. Enter Manual Lot No `LOT-MANUAL-77`.<br>2. Complete trade. | The trade and all split sales reference `LOT-MANUAL-77` instead of auto-generated ID. | **P1** |
| **TC-QT-05** | Split Row Validation: Null/Empty Quantity Rejected | Quick Trade form | 1. Add split sale row.<br>2. Leave quantity empty or 0.<br>3. Attempt to submit. | System returns 400 error: *"Please specify at least one buyer sale with buyer name, quantity and rate."* Prevents null constraint DB error. | **P0** |
| **TC-QT-06** | Custom Entry Date in Quick Trade | Quick Trade form | 1. Change Entry Date to yesterday's date.<br>2. Execute quick trade. | All generated records (arrival, split sales, journal entries, cashbook entries) are tagged with the selected entry date. | **P1** |
| **TC-QT-07** | Inline Quick Add Buyer & Farmer in Quick Trade | Buyer not in list | 1. Type new buyer short name `NEWBUY` in buyer field.<br>2. Click **+ Add Party**.<br>3. Save party. | Party saved to DB and immediately populated into the split sale row. | **P1** |
| **TC-QT-08** | Keyboard Navigation & Speed Entry | Desktop browser | 1. Use `Tab` and `Enter` keys to jump across Truck → Farmer → Bags → Rate → Buyer splits. | Focus moves sequentially without getting trapped in dropdowns or resetting form fields. | **P2** |

---

# 5. Sales & Multi-Buyer Lot Splitting (MOD-05)

| TC ID | Test Scenario | Preconditions | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-SL-01** | View Live Lots available for sale | At least one unsold/partial lot exists | 1. Navigate to **Sales (बिक्री व लॉट कटाई)** or press `F4`.<br>2. Check Live Lots table. | Lists active lots with Lot ID, Commodity, Farmer, Total Qty, and Remaining Qty. | **P1** |
| **TC-SL-02** | Split Sale from Existing Inward Lot | Lot has 100 bags remaining | 1. Select lot.<br>2. Select Buyer `Surinder Fruit Co`.<br>3. Enter Sale Qty = 40 bags @ ₹800.<br>4. Click **Confirm Sale**. | 40 bags deducted from lot (remaining: 60), lot status remains `live`, Buyer account debited ₹32,000, Journal Voucher posted. | **P0** |
| **TC-SL-03** | Full Lot Clearance (Status changes to Sold) | Lot has 60 bags remaining | 1. Sell remaining 60 bags to Buyer.<br>2. Confirm sale. | Remaining qty becomes 0. Lot status automatically updates to `sold`. Lot moves from Active to Completed section. | **P1** |
| **TC-SL-04** | Prevent Overselling Lot (Qty > Remaining) | Lot has 25 bags remaining | 1. Attempt to enter Sale Qty = 30 bags.<br>2. Click Confirm Sale. | UI disables button or API returns 400 error: *"Sale quantity exceeds remaining lot inventory."* | **P0** |
| **TC-SL-05** | Cash Sale automatic entry into Rokad | Lot sale execution | 1. Sell 20 bags @ ₹500 with Payment Mode = `Cash`. | Sale records debit in Buyer ledger AND auto-generates a `JAMA` (Cash In) transaction of ₹10,000 in Rokad Cashbook. | **P0** |
| **TC-SL-06** | Purcha (Sales Bill Voucher) Print Preview | Sale recorded | 1. Click **Print Purcha** on sales transaction. | Displays print-ready Purcha slip containing Mandi license no, buyer name, lot no, item, bags, rate, and total amount. | **P2** |

---

# 6. Parties Master & CSV Import/Export (MOD-06)

| TC ID | Test Scenario | Preconditions | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-PRT-01** | Create Party across all Types (Farmer, Buyer, Agent) | Logged into Settings > Party Master | 1. Create a Farmer: `Kisan Singh`, Phone `9876543211`.<br>2. Create a Buyer: `Gupta Traders`, Phone `9811223344`.<br>3. Create an Agent: `Dalaal Chaman Lal`, Phone `9877112233`. | All 3 parties saved with their respective `party_type` in `parties` table; available in search dropdowns across Inward and Sales. | **P1** |
| **TC-PRT-02** | Search Party by Short Code or Name | 50+ parties exist | 1. Open PartySearchSelect component.<br>2. Type short code (e.g. `TF01`).<br>3. Type partial phone number. | Dropdown filters instantly to matching records in < 50ms. | **P1** |
| **TC-PRT-03** | Download CSV Template for Parties | In Settings > Party Master | 1. Click **Download Template (CSV)** button. | Browser downloads `party_import_template.csv` with standard columns: `name,short_name,party_type,phone,city,state,opening_balance`. | **P1** |
| **TC-PRT-04** | Export Parties to CSV | Tenant has existing parties | 1. Click **Export Parties (CSV)** button. | Downloads `parties_export_YYYY-MM-DD.csv` containing all parties belonging to current tenant. | **P1** |
| **TC-PRT-05** | Bulk Import Parties via CSV | Valid CSV file prepared with 10 parties | 1. Click **Import Parties (CSV)**.<br>2. Select CSV file.<br>3. Confirm upload. | System parses CSV, inserts parties in DB, reports: *"Successfully imported 10 parties!"*. Parties appear in list immediately. | **P1** |
| **TC-PRT-06** | Import CSV with Invalid Rows (Error Tolerance) | CSV has missing name on row 3 | 1. Upload CSV with bad data. | System validates rows, skips invalid row, imports valid rows, and displays summary showing skipped rows with reasons. | **P2** |
| **TC-PRT-07** | Edit Existing Party Details | Party exists | 1. Edit Phone and City of an existing party.<br>2. Save changes. | Party record updated in DB and reflected across historical ledgers. | **P2** |

---

# 7. Commodities, Varieties & Mandi Expense Heads (MOD-07)

| TC ID | Test Scenario | Preconditions | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-CFG-01** | Add & Configure Commodity | In Settings > Commodities | 1. Add Commodity `Kashmiri Apple`, Category `Fruit`, Default Unit `Box (20kg)`.<br>2. Standard Commission = `2.5%`, Palledari = `₹12`.<br>3. Save. | Stored in `commodities` table. Pre-fills default rates when selected in Inward and Quick Trade. | **P1** |
| **TC-CFG-02** | Add Produce Varieties & Grades | Commodity exists | 1. In Varieties master, add `Royal Delicious`, Grade `A`, Default Rate `₹850`.<br>2. Add `Golden Apple`, Grade `B`, Default Rate `₹600`. | Varieties appear in the variety autocomplete datalist during trade entry. | **P2** |
| **TC-CFG-03** | Configure Farmer Expense Head (भाड़ा, पल्लेदारी) | In Settings > Mandi Expenses | 1. Add Expense Head `Freight (भाड़ा)`, Target = `Farmer`, Type = `per_unit`, Amount = `₹45`.<br>2. Save expense head. | Expense head renders with checkbox and ₹45/unit default in Farmer section of Inward and Quick Trade forms. | **P1** |
| **TC-CFG-04** | Configure Buyer Expense Head (स्टेशनरी, तुलाई) | In Settings > Mandi Expenses | 1. Add Expense Head `Weighment (तुलाई)`, Target = `Buyer`, Type = `flat`, Amount = `₹20`.<br>2. Save expense head. | Renders in Buyer expenses section of trade entry with ₹20 flat rate default. | **P1** |
| **TC-CFG-05** | Modify Expense Rate during Trade Entry | Expense head configured with ₹45 default | 1. In Inward or Quick Trade form, locate `Freight (भाड़ा)`.<br>2. Change ₹45 to ₹55 for this specific vehicle.<br>3. Submit trade. | System computes trade using the overridden ₹55 rate without altering the global master setting of ₹45. | **P1** |
| **TC-CFG-06** | Delete / Deactivate Expense Head | Existing expense head | 1. Delete an obsolete expense head. | Expense head is removed or flagged inactive; no longer appears on new trade entry forms. | **P2** |

---

# 8. Bahi Khata, Rokad Cashbook & Opening Balance (MOD-08)

| TC ID | Test Scenario | Preconditions | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-BK-01** | Fresh Tenant Cash in Hand defaults to ₹0 | Newly registered tenant with no transactions | 1. Log in as new tenant.<br>2. Navigate to **Bahi Khata (बही खाता)**.<br>3. Check Rokad Cash in Hand card. | Opening Cash shows **₹0** (NOT ₹50,000). Net Cash balance is **₹0**. | **P0** |
| **TC-BK-02** | Configure Opening Cash in Hand | Tenant logged in | 1. In Bahi Khata or Settings > Statutory Rates, click **Edit Opening Cash**.<br>2. Enter ₹75,000.<br>3. Save. | `tenants.opening_cash` updated to ₹75,000. Cashbook Closing Balance updates: `75,000 + Jama - Kharch`. | **P0** |
| **TC-BK-03** | Manual Cash In (JAMA) Entry | Bahi Khata screen | 1. Click **+ Cash In (जमा)**.<br>2. Title = `Cash received from Ram Lal`, Amount = ₹15,000.<br>3. Save. | HTTP 201 created. Transaction appears in cashbook list. Net Cash in Hand increases by ₹15,000. | **P0** |
| **TC-BK-04** | Manual Cash Out (KHARCH) Entry | Bahi Khata screen | 1. Click **- Cash Out (खर्च)**.<br>2. Title = `Office Chai & Stationery`, Amount = ₹350.<br>3. Save. | Transaction recorded with type `KHARCH`. Closing cash balance decreases by ₹350. | **P0** |
| **TC-BK-05** | Validation: Cashbook missing title / zero amount | Cash transaction form | 1. Leave Title blank.<br>2. Enter Amount = 0.<br>3. Submit. | Blocked with HTTP 400: *"Valid title and amount greater than 0 are required."* | **P1** |
| **TC-BK-06** | Party Khata / Ledger Aging & 15-Day Interest | Buyer has unpaid bills past 15 days | 1. Open Accounts / Sundry Debtors ledger.<br>2. Inspect overdue party row with > 15 days overdue. | System displays overdue days badge and calculates APMC statutory interest (1.5%/month) on the outstanding udhaar balance. | **P1** |
| **TC-BK-07** | Record Partial Payment from Debtor | Buyer owes ₹50,000 | 1. In party khata, click **Record Payment**.<br>2. Amount = ₹20,000, Mode = `Cash`.<br>3. Submit. | Outstanding udhaar reduces to ₹30,000, `total_paid` becomes ₹20,000, and a `JAMA` of ₹20,000 is logged in Cashbook. | **P0** |
| **TC-BK-08** | Cashbook Search & Date Filter | Multiple transactions exist | 1. Filter cashbook by date range or keyword search (e.g. `Freight`). | Table filters in real-time to matching records with subtotal summary. | **P2** |

---

# 9. Double-Entry General Journal, Trial Balance & Balance Sheet (MOD-09)

| TC ID | Test Scenario | Preconditions | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ACC-01** | Automated Double-Entry Voucher on Trade Entry (Dr = Cr) | Trade executed | 1. Complete an arrival or quick trade.<br>2. Navigate to **Bahi Khata > General Journal (रोज़नामचा)**. | Auto-generated voucher (`JV-SL-xxxxxx`) appears with Debit Account (`Sundry Debtors - Buyer`), Credit Account (`Sundry Creditors - Farmer`), and exact matching amounts (`Dr = Cr`). | **P0** |
| **TC-ACC-02** | Trial Balance Math Equilibrium (`Total Debit == Total Credit`) | Multiple trades and payments executed | 1. Navigate to **Trial Balance (तलपट)** tab.<br>2. Check footer totals for Total Debit (Dr) and Total Credit (Cr). | `Total Dr` matches `Total Cr` with ₹0 imbalance difference (`Diff = ₹0`). Balanced ledger verified. | **P0** |
| **TC-ACC-03** | Balance Sheet Integrity (Assets = Liabilities + Equity) | Active tenant with accounts | 1. Navigate to **Balance Sheet (आर्थिक चिट्ठा)** tab.<br>2. Inspect Total Assets (Current Assets, Debtors, Cash in Hand).<br>3. Inspect Total Liabilities & Capital. | Opening Cash and net trading balance flow into Assets correctly; Balance Sheet renders accounting equation accurately. | **P0** |
| **TC-ACC-04** | Manual Journal Entry Creation | Bahi Khata screen | 1. Click **+ New Journal Voucher**.<br>2. Enter Date, Voucher No, Debit Account `Rent Expense`, Credit Account `Cash in Hand`, Amount ₹12,000.<br>3. Save. | Manual journal voucher posted to general journal and reflected across affected account ledgers. | **P1** |
| **TC-ACC-05** | Party Ledger Statement Statement Export | Party with transactions | 1. Select specific party ledger.<br>2. Review running debit/credit balance column.<br>3. Click Print / PDF Statement. | Displays chronological voucher ledger with running balance for farmer or buyer statement. | **P1** |
| **TC-ACC-06** | Unauthenticated Ledger Access Blocked | No auth token | 1. Attempt `GET /api/ledger/cashbook` and `GET /api/ledger/trial-balance` without token. | API returns HTTP 401 Unauthorized; ledger data is fully protected. | **P0** |

---

# 10. Super Admin Console & Audit Logging (MOD-10)

| TC ID | Test Scenario | Preconditions | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ADM-01** | Super Admin Dashboard Metrics Overview | Logged in as `dmchaturvedi@gmail.com` | 1. Navigate to **Super Admin** view (`👑 Super Admin`). | Displays platform-wide metrics: Total Agencies Onboarded, Active Subscriptions, Total Platform Trade GMV, Active Traders. | **P1** |
| **TC-ADM-02** | Tenant Subscription Management (+30D / +1Y Extension) | Super admin console | 1. Locate tenant row.<br>2. Click `+30 Days` or `+1 Year` validity button. | Expiry date advances in DB; tenant subscription status remains `Active`. | **P1** |
| **TC-ADM-03** | View-Only Audit Impersonation Mode | Super admin logged in | 1. Click **Inspect Agency (Audit Mode)** on Royal Apple Traders. | Super Admin assumes tenant view; top of screen displays orange `ImpersonationBanner` ("Auditing Royal Apple Traders - Mutation Locked"). | **P0** |
| **TC-ADM-04** | Mutation Lock during Impersonation | Active audit mode | 1. While in impersonation mode, attempt to submit a new quick trade or edit opening cash. | Mutation interceptor rejects operation with message: *"Impersonation is view-only. Mutations locked."* Prevents unauthorized tampering. | **P0** |
| **TC-ADM-05** | Audit Logs Filter by User, Action & Date | Logged into Settings > Audit Logs | 1. Navigate to Sub-Tab 11: `Audit Logs`.<br>2. Filter by Action = `PAYMENT_RECEIVED` or `CREATE_ARRIVAL`.<br>3. Filter by User. | Displays timestamped log entries recording Who performed What action, target Entity ID, IP address, and details. | **P1** |
| **TC-ADM-06** | Automatic Audit Logging on Critical Events | Shop admin performs actions | 1. Update opening cash, record trade, or add user.<br>2. Check `audit_logs` table. | Event is automatically written to `audit_logs` without failing the parent transaction. | **P1** |

---

# 11. Multi-Tenant Data Isolation & Security (MOD-11)

| TC ID | Test Scenario | Preconditions | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-SEC-01** | Strict Tenant Scoping in Parties API | Two distinct tenants exist (Tenant A & Tenant B) | 1. Log in as Tenant A.<br>2. Call `GET /api/trade/parties`.<br>3. Inspect `tenant_id` on all returned records. | 100% of returned records belong to Tenant A. Zero records from Tenant B leaked. | **P0** |
| **TC-SEC-02** | Strict Tenant Scoping in Cashbook & Ledgers | Tenant A & Tenant B have cash entries | 1. Call `GET /api/ledger/cashbook` as Tenant A.<br>2. Check transactions and opening cash. | Returns only Tenant A's cash balance and entries. Tenant B transactions are completely invisible. | **P0** |
| **TC-SEC-03** | Cross-Tenant Modification Prevention (IDOR) | Tenant A authenticated | 1. Send `PUT /api/trade/commodities/{Tenant_B_Commodity_ID}` using Tenant A's token. | API returns HTTP 404 or 403; does not allow modifying records outside user's `tenant_id`. | **P0** |
| **TC-SEC-04** | SQL Injection Resistance in Trade & Party Names | Any authenticated user | 1. Submit party with name `Robert'); DROP TABLE parties; --`.<br>2. Submit arrival with vehicle no `' OR '1'='1`. | Parameterized SQL queries safely sanitize input; characters are stored as string literals; database schema remains intact. | **P0** |
| **TC-SEC-05** | Oversized Payload Resistance | Any authenticated user | 1. Submit party with a 500-character name string. | Handled gracefully without server process crash or unhandled 500 error. | **P1** |

---

## 🛠️ How to Execute the Automated Test Suite

The automated test runner executes **58 distinct integration tests** against the live backend and database:

```bash
# 1. Start the unified stack in one terminal
npm run runner

# 2. In another terminal, run the automated suite
npm test
# (Equivalent to: node tests/api.test.js)
```

### Automated Suite Coverage Breakdown:
```text
══ 1. HEALTH CHECK ══          (1 test)   ✓ GET /health
══ 2. AUTHENTICATION ══        (8 tests)  ✓ Login (Admin/Super), Wrong PW, /me, JWT Verify
══ 3. TENANT MANAGEMENT ══     (4 tests)  ✓ Tenant listing, Settings update, Auth guard
══ 4. COMMODITIES ══           (4 tests)  ✓ CRUD, Validation, 404 Handlers
══ 5. VARIETIES ══             (2 tests)  ✓ CRUD, Autocomplete Grade bindings
══ 6. EXPENSE HEADS ══         (3 tests)  ✓ Farmer & Buyer Mandi Expense configs
══ 7. PARTIES ══               (6 tests)  ✓ Farmer, Buyer, Agent creation & filtering
══ 8. INWARD ARRIVALS ══       (4 tests)  ✓ Full consignment logging, Lot generation
══ 9. QUICK TRADE ══           (4 tests)  ✓ Atomic auction, Multi-buyer splits, Sanitization
══ 10. LEDGER / BAHI KHATA ══  (11 tests) ✓ Cashbook JAMA/KHARCH, Opening Cash, Trial Balance
══ 11. ADMIN ══                (3 tests)  ✓ Metrics, Tenant oversight, Audit trail
══ 12. SUBSCRIPTION ══         (1 test)   ✓ Plan subscription upgrade flow
══ 13. MULTI-TENANT ISOLATION ══ (2 tests) ✓ Zero data leaks across tenant boundaries
══ 14. EDGE CASES & SECURITY ══ (5 tests)  ✓ Backdating, SQL injection safety, Long payloads
───────────────────────────────────────────────────────────────────────────
TOTAL PASSED: 58 / 58 (100% Success Rate)
```

---

*Sheet compiled and verified on ArhatPro Mandi ERP codebase.*
