# Egypt Plugs Air Shipping Services — Setup & Installation Guide

A full-stack logistics management system for air freight operations between **Cairo (Egypt)** and **Kano / Abuja / Lagos (Nigeria)**.

```
egypt-plugs/
├── server/     ← Express.js + SQLite REST API
├── client/     ← React 18 + Vite multi-page app
└── SETUP_GUIDE.md  ← (this file)
```

---

## 1. Prerequisites

- **Node.js** v18+ (v20/v22 recommended)
- **npm** v9+

Check your versions:
```bash
node --version
npm --version
```

---

## 2. Backend Setup (`/server`)

### 2.1 Install dependencies
```bash
cd server
npm install
```

### 2.2 Configure environment
Copy the example env file and edit it:
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
JWT_SECRET=change-this-to-a-long-random-secret-string
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

> ⚠️ **Important:** Change `JWT_SECRET` to a long random string before deploying to production. You can generate one with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

### 2.3 Initialize & seed the database
This creates `egypt_plugs.db` (SQLite file) with the full schema and demo data:
```bash
npm run seed
```

You should see:
```
✅ Database schema initialized
🌱 Seeding database...
✅ Database seeded successfully
👤 Admin login: admin / admin123
👤 Cairo staff: cairo1 / staff123
👤 Kano staff:  kano1 / staff123
👤 Abuja staff: abuja1 / staff123
```

### 2.4 Run the server
```bash
npm run dev     # development, auto-restarts on file changes
# or
npm start       # production
```

The API will be running at **http://localhost:3001**

Test it:
```bash
curl http://localhost:3001/api/health
```

---

## 3. Frontend Setup (`/client`)

### 3.1 Install dependencies
```bash
cd client
npm install
```

### 3.2 Run in development
```bash
npm run dev
```

The app will be running at **http://localhost:5173**

The Vite dev server proxies all `/api/*` and `/uploads/*` requests to `http://localhost:3001` automatically (see `vite.config.js`), so **both servers must be running** during development.

### 3.3 Build for production
```bash
npm run build
```
This outputs a static bundle to `client/dist/`. Serve it with any static file server (nginx, Caddy, `serve`, etc.) and configure your reverse proxy to forward `/api` and `/uploads` to the backend on port 3001.

---

## 4. Running Both Together (Quick Start)

Open two terminals:

**Terminal 1 — Backend**
```bash
cd server
npm install
npm run seed      # only needed once
npm run dev
```

**Terminal 2 — Frontend**
```bash
cd client
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 5. Default Login Credentials

| Username | Password   | Role          | Office | Access                                      |
|----------|------------|---------------|--------|----------------------------------------------|
| `admin`  | `admin123` | Administrator | Cairo  | Full access — all pages, user management, audit log |
| `cairo1` | `staff123` | Cairo Staff   | Cairo  | Create shipments, sacks, mark as packed/shipped |
| `kano1`  | `staff123` | Kano Staff    | Kano   | Receive arrivals, mark out-for-delivery/delivered |
| `abuja1` | `staff123` | Abuja Staff   | Abuja  | Same as Kano staff, for Abuja office          |

> 🔒 **Change these passwords** before deploying publicly. Go to **Settings → Staff Users** (admin) or **Settings → Password** (any user).

---

## 6. Application Pages (Multi-Page Routes)

This is a **multi-page application** using React Router — every section has its own URL:

| Route | Page | Description |
|-------|------|--------------|
| `/login` | Login | Staff sign-in |
| `/track/:tracking_id` | Public Tracking | No login required — customer parcel tracking |
| `/dashboard` | Dashboard | Live KPIs, activity feed, destination breakdown |
| `/shipments` | Shipments | Searchable/filterable list of all parcels |
| `/shipments/new` | New Shipment | 4-step shipment registration form (Cairo staff) |
| `/shipments/:tracking_id` | Parcel Detail | Full tracking timeline + status update |
| `/sacks` | Sacks / Manifests | Create sacks, scan parcels in, mark shipped |
| `/sacks/:id` | Sack Manifest | Printable manifest for a sack |
| `/arrivals` | Arrivals & Delivery | Kano/Abuja staff — receive & deliver parcels |
| `/customers` | Customers | Customer database with stats |
| `/payments` | Payments & Balances | Revenue, balances, aging report |
| `/reports` | Reports & Analytics | Charts: volume, revenue, destinations, staff KPIs |
| `/settings` | Settings | Profile, password, staff users (admin), company info |

---

## 7. Typical Workflow (How the System Is Used)

1. **Cairo staff** logs in → goes to **New Shipment** → registers a customer's parcel → system generates a tracking ID like `KNO-260614-0001` (format: `{DEST}-{YYMMDD}-{SERIAL}`).
2. Cairo staff creates a **Sack** for a destination (e.g. Kano), scans parcel tracking numbers to add them to the sack.
3. When the sack is full/ready, Cairo staff clicks **Mark as Shipped** — all packed parcels in that sack automatically move to `shipped` status.
4. **Kano/Abuja staff** logs in → sees the sack arrive → marks parcels as **Arrived** (or marks the whole sack as arrived, cascading to all parcels).
5. Staff marks parcels **Out for Delivery**, then **Delivered** (prompts for collector's name).
6. At any point, customers can visit `/track/KNO-260614-0001` (no login) to see the live timeline.
7. **Payments** are recorded against customers; balances and aging reports update automatically.
8. **Admin** can view reports, staff performance, the full audit log, and manage staff accounts from **Settings**.

---

## 8. Role-Based Permissions

| Action | cairo_staff | kano_staff | abuja_staff | admin |
|---|---|---|---|---|
| Create shipment | ✅ | ❌ | ❌ | ✅ |
| Pack / Ship sack | ✅ | ❌ | ❌ | ✅ |
| Mark arrived / out-for-delivery / delivered | ❌ | ✅ (Kano) | ✅ (Abuja) | ✅ |
| View shipments, customers, payments, reports | ✅ | ✅ | ✅ | ✅ |
| Record payments | ✅ | ✅ | ✅ | ✅ |
| Staff performance report | ❌ | ❌ | ❌ | ✅ |
| Audit log | ❌ | ❌ | ❌ | ✅ |
| Manage staff users | ❌ | ❌ | ❌ | ✅ |

---

## 9. Database

SQLite database file: `server/egypt_plugs.db` (created automatically by `npm run seed`).

**Tables:** `users`, `customers`, `parcels`, `parcel_photos`, `sacks`, `payments`, `audit_logs`, `tracking_timeline`

To reset the database completely:
```bash
cd server
rm egypt_plugs.db
npm run seed
```

---

## 10. Tracking ID & Sack Number Formats

- **Tracking ID:** `{DEST}-{YYMMDD}-{SERIAL}` → e.g. `KNO-260614-0001`
  - `KNO` = Kano, `ABJ` = Abuja, `LGS` = Lagos
  - Serial auto-increments per destination per day
- **Sack Number:** `SACK-{DEST}-{YYMMDD}-{SERIAL}` → e.g. `SACK-KNO-260614-01`

Both are generated server-side and guaranteed unique.

---

## 11. File Uploads (Parcel Photos)

Uploaded item photos are stored in `server/uploads/` and served at `http://localhost:3001/uploads/<filename>`. The Vite dev proxy forwards `/uploads/*` requests automatically.

---

## 12. Troubleshooting

| Problem | Solution |
|---|---|
| `npm install` fails on `better-sqlite3` / `sqlite3` | This project uses `@libsql/client` instead — no native build tools needed. Make sure you're using the provided `package.json`. |
| Frontend shows "Network Error" on login | Make sure the backend is running on port 3001 and `vite.config.js` proxy target matches. |
| 401 errors after some time | JWT tokens expire after 12 hours — just log in again. |
| "Route not found" on page refresh (production build) | Configure your static server to fall back to `index.html` for all routes (SPA/multi-route fallback), since this is a client-side routed app. |
| Port 3001 or 5173 already in use | Change `PORT` in `server/.env` and update `vite.config.js` proxy target accordingly, or change `--port` for Vite. |

---

## 13. Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Axios |
| Backend | Express.js 5, JWT auth, bcryptjs, Multer (file uploads) |
| Database | SQLite via `@libsql/client` |
| Icons | Tabler Icons (CDN) |

---

Questions or issues? Check `server/README.md` for the full API reference (every endpoint, request/response shapes, and RBAC rules).
