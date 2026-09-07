# RestaurantPOS

Full-stack restaurant billing software — React + Tailwind (frontend), Node.js + Express (backend), MongoDB (database), JWT auth, Electron desktop wrapper.

## Kya-kya ready hai

- ✅ Login system with 3 roles: **Admin / Manager / Cashier** (JWT-based)
- ✅ Dashboard — today's sales, total orders, total revenue, popular items
- ✅ Billing/POS screen — item search, category filter, cart, **discount, service charge, split payment (Cash+UPI+Card), hold bill / resume held bills, reprint bill by number, split bill among people**, GST auto-calc, print-ready bill
- ✅ Kitchen Order Ticket (KOT) — separate kitchen screen, Preparing → Ready → Served status, auto-refreshes
- ✅ Menu management — categories, items, price/GST inline edit, delete
- ✅ Table management — add/delete tables, free/occupied status
- ✅ Inventory / stock — track raw materials (rice, oil, batter, coconut...), low-stock alerts
- ✅ Customers — captured at billing via phone number, visit history, total spent
- ✅ Staff management (Admin only) — add/deactivate cashiers & managers
- ✅ Reports — date-range sales summary, item-wise chart, GST report, CSV export
- ✅ Settings — restaurant name, address, GSTIN, FSSAI, UPI ID
- ✅ Audit log (backend ready — logs every product delete with who/when)
- ✅ Role-based permissions (cashier can't delete items, only admin can manage staff/settings)
- ✅ Electron wrapper so it runs as a desktop window, not a browser tab

## Baad me add karne wale modules (roadmap, abhi shamil nahi)

Table merge (backend field ready, UI pending) · Expense manager · Employee attendance/salary ·
Vendor management · WhatsApp/SMS bill · Loyalty points · QR self-order menu ·
Online order integration · Multi-branch · Cloud backup · AI sales insights

Ye sab isi codebase ke upar step-by-step add ho sakte hain — bata dena jab shuru karna ho.

---

## Setup (apne PC par pehli baar chalane ke liye)

### 1. Zaroori software install karo (ek baar)
- [Node.js](https://nodejs.org) (LTS version)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) — local database

### 2. Backend (server) setup
```bash
cd server
npm install
cp .env.example .env
# .env kholo aur JWT_SECRET ko koi bhi random lambi string se replace karo
npm run dev
```
Server `http://localhost:5000` par chalega. MongoDB local machine par already chalta hona chahiye.

### 3. Pehla Admin account banao
Server chalu hone ke baad, ek baar ye API call karo (Postman se ya browser se):
```
POST http://localhost:5000/api/auth/setup-admin
Body: { "name": "Owner", "username": "admin", "password": "yourpassword" }
```
Ye sirf ek baar chalega (pehli admin banane ke liye).

### 4. Frontend (client) setup
Naya terminal kholo:
```bash
cd client
npm install
npm run dev
```
Browser mein `http://localhost:5173` khulega — yahi tumhara billing software hai.

---

## Windows .exe Installer kaise banayein (Electron)

Isko apne (ya client ke) real Windows PC par karna hoga — sandbox environment mein ye nahi ban sakta.

```bash
# 1. Client ko production build karo
cd client
npm run build          # ye client/dist folder banayega

# 2. Electron dependencies install karo
cd ../electron
npm install

# 3. Windows installer banao
npx electron-builder --win
```

Isse ek `RestaurantPOS Setup.exe` file banegi (`electron/dist` folder mein). Client isko double-click karke install karega, desktop par icon ban jayega, aur ye Electron window mein khulega (backend apne aap start ho jayega).

**Important:** Client ke PC par bhi MongoDB install/running hona chahiye (ya tum MongoDB ko bhi installer ke sath bundle kar sakte ho — thoda advanced setup hai, bata dena agar chahiye).

---

## Folder Structure
```
RestaurantPOS/
  client/     → React + Tailwind frontend
  server/     → Node.js + Express + MongoDB backend
  electron/   → Desktop app wrapper + .exe build config
  docs/       → (future: user manual)
```

## Roles & Permissions
| Action | Cashier | Manager | Admin |
|---|---|---|---|
| Create bill | ✅ | ✅ | ✅ |
| Edit/delete menu items | ❌ | ✅ | ✅ |
| View reports | ❌ | ✅ | ✅ |
| Manage staff | ❌ | ❌ | ✅ |
| Change settings | ❌ | ❌ | ✅ |
| View audit log | ❌ | ❌ | ✅ |
