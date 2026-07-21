# Egypt Plugs Air Shipping Services — Backend API

Express.js + SQLite backend for the full logistics management system.

---

## Quick Start

```bash
npm install
cp .env.example .env
npm run seed      # initialise DB + seed demo data
npm run dev       # start with auto-reload (node --watch)
npm start         # production start
```

Server runs on **http://localhost:3001**

---

## Demo Credentials (after seed)

| Username | Password  | Role          | Office |
|----------|-----------|---------------|--------|
| admin    | admin123  | admin         | Cairo  |
| cairo1   | staff123  | cairo_staff   | Cairo  |
| kano1    | staff123  | kano_staff    | Kano   |
| abuja1   | staff123  | abuja_staff   | Abuja  |

---

## Complete API Reference

All authenticated routes require:
```
Authorization: Bearer <jwt_token>
```

---

### 🔐 Authentication

| Method | Endpoint                    | Auth | Description                     |
|--------|-----------------------------|------|----------------------------------|
| POST   | `/api/auth/login`           | ❌   | Login → returns JWT + user      |
| GET    | `/api/auth/me`              | ✅   | Get current user profile        |
| POST   | `/api/auth/change-password` | ✅   | Change own password             |

**POST /api/auth/login**
```json
{ "username": "admin", "password": "admin123" }
```
Response: `{ token, user: { id, username, name, role, office } }`

---

### 📦 Parcels

| Method | Endpoint                               | Auth | Role          | Description                    |
|--------|----------------------------------------|------|---------------|---------------------------------|
| GET    | `/api/parcels`                         | ✅   | All           | List parcels (filterable)      |
| POST   | `/api/parcels`                         | ✅   | Cairo/Admin   | Create new shipment            |
| GET    | `/api/parcels/:tracking_id`            | ✅   | All           | Full parcel + timeline         |
| PATCH  | `/api/parcels/:tracking_id/status`     | ✅   | Role-based    | Update parcel status           |
| PATCH  | `/api/parcels/:tracking_id/sack`       | ✅   | Cairo/Admin   | Assign parcel to sack          |

**GET /api/parcels** query params:
- `search` — tracking ID / customer name / receiver name
- `status` — `received_cairo | packed | shipped | arrived_destination | out_for_delivery | delivered | hold | returned`
- `destination` — `Kano | Abuja | Lagos`
- `sack_id` — integer
- `limit` (default 50), `offset` (default 0)

**POST /api/parcels** — `multipart/form-data` (also accepts JSON body):
```
customer_id: 1
receiver_name: Ibrahim Sani
receiver_phone: +234 801 234 5678
destination: Kano
parcel_type: Personal Items
quantity: 2
weight: 4.5
declared_value: 1250
description: Clothes, shoes
notes: Handle with care
total_amount: 1250
amount_paid: 1250
payment_method: Cash
photos: <file> <file> ...   (up to 5 images)
```
Response: `{ tracking_id, parcel_id }`

**PATCH /api/parcels/:tracking_id/status** body:
```json
{ "status": "shipped", "note": "Departed via EK-501", "collector_name": "John" }
```
`collector_name` is required (recommended) when `status = "delivered"`.

**PATCH /api/parcels/:tracking_id/sack** body:
```json
{ "sack_id": 3 }
```
Sets parcel status to `packed` and links it to the sack.

---

### 📮 Sacks / Manifests

| Method | Endpoint                     | Auth | Role          | Description                   |
|--------|------------------------------|------|---------------|---------------------------------|
| GET    | `/api/sacks`                 | ✅   | All           | List sacks                    |
| POST   | `/api/sacks`                 | ✅   | Cairo/Admin   | Create new sack               |
| GET    | `/api/sacks/:id`             | ✅   | All           | Sack detail + parcel list     |
| PATCH  | `/api/sacks/:id/status`      | ✅   | All           | Update sack status            |
| GET    | `/api/sacks/preview/next`    | ✅   | All           | Preview next sack number      |

**GET /api/sacks** query params: `status`, `destination`

**POST /api/sacks** body:
```json
{ "destination": "Kano", "flight_batch": "FL-CAI-KNO-210525", "capacity": 50 }
```
Response: `{ sack_number, sack_id }`

**PATCH /api/sacks/:id/status** body:
```json
{ "status": "shipped" }
```
Valid statuses: `open | closed | shipped | arrived | cancelled`

- status → `shipped`: all `packed` parcels in sack → `shipped`
- status → `arrived`: all `shipped` parcels in sack → `arrived_destination`

**GET /api/sacks/preview/next?destination=Kano**
```json
{ "sack_number": "SACK-KNO-260614-02" }
```

---

### 👥 Customers

| Method | Endpoint                  | Auth | Description                        |
|--------|---------------------------|------|--------------------------------------|
| GET    | `/api/customers`          | ✅   | List + search customers            |
| POST   | `/api/customers`          | ✅   | Create new customer                |
| GET    | `/api/customers/stats`    | ✅   | Aggregate stats                    |
| GET    | `/api/customers/:id`      | ✅   | Customer + parcels + payments      |
| PATCH  | `/api/customers/:id`      | ✅   | Update customer                    |

**GET /api/customers** query params: `search`, `status`, `type`, `city`, `limit`, `offset`

Response includes computed fields per customer: `total_shipments`, `total_weight`, `total_spent`, `total_paid`, `outstanding_balance`, `last_shipment_at`.

**POST /api/customers** body:
```json
{
  "name": "Amina Hassan",
  "phone": "+234 813 456 7890",
  "email": "amina@email.com",
  "city": "Lagos",
  "type": "New"
}
```
`type`: `Regular | VIP | Frequent | New | Dormant`

**GET /api/customers/stats** response:
```json
{ "total": 8, "active": 7, "vip": 1, "revenue": 12450, "thisMonth": 8 }
```

---

### 💳 Payments

| Method | Endpoint                    | Auth | Description                      |
|--------|-----------------------------|------|------------------------------------|
| GET    | `/api/payments`             | ✅   | List payments (filterable)       |
| POST   | `/api/payments`             | ✅   | Record a payment                 |
| GET    | `/api/payments/stats`       | ✅   | Revenue / balance KPIs           |
| GET    | `/api/payments/balances`    | ✅   | Per-customer balance summary     |

**GET /api/payments** query params: `customer_id`, `type`, `limit`, `offset`

**POST /api/payments** body:
```json
{
  "customer_id": 1,
  "parcel_id": 3,
  "amount": 500,
  "payment_method": "Cash",
  "type": "payment",
  "notes": "Partial payment for balance"
}
```
`type`: `payment | expense | balance_recorded`
`payment_method`: `Cash | Bank Transfer | Mobile Money | Other`

If `parcel_id` is given, that parcel's `amount_paid` is incremented automatically.

**GET /api/payments/stats** response:
```json
{
  "revenue": 12500,
  "thisMonth": 4500,
  "outstanding": 2300,
  "customersWithBalance": 4,
  "txCount": 28,
  "aging": { "d30": 800, "d60": 600, "d90": 500, "d90plus": 400 }
}
```

**GET /api/payments/balances** — returns array with `payment_status`: `Paid | Partial | Unpaid`

---

### 📊 Dashboard

| Method | Endpoint                    | Auth | Description                          |
|--------|------------------------------|------|----------------------------------------|
| GET    | `/api/dashboard/stats`      | ✅   | KPIs, activity feed, destinations    |
| GET    | `/api/dashboard/arrivals`   | ✅   | Arrived/out-for-delivery by office   |

**GET /api/dashboard/stats** response:
```json
{
  "parcelsToday": 6,
  "weightToday": 20.05,
  "pendingShipments": 1,
  "awaitingPickup": 3,
  "revenueToday": 7600,
  "changes": { "parcels": 0, "weight": 0, "revenue": 0 },
  "destinations": [{ "destination": "Kano", "count": 5 }],
  "activity": [{ "type": "parcel", "ref": "KNO-...", "status": "...", "created_at": "...", "customer_name": "...", "staff_name": "..." }]
}
```

**GET /api/dashboard/arrivals** — scoped to `req.user.office` (Kano/Abuja staff only see their office; Cairo/admin see all):
```json
{ "arrived": [...], "outForDelivery": [...], "deliveredToday": 2 }
```

---

### 📈 Reports

| Method | Endpoint                              | Auth | Role  | Description                    |
|--------|----------------------------------------|------|-------|----------------------------------|
| GET    | `/api/reports/summary`                | ✅   | All   | Period KPI summary             |
| GET    | `/api/reports/shipments-by-day`       | ✅   | All   | Daily volume (last N days)     |
| GET    | `/api/reports/revenue-by-day`         | ✅   | All   | Daily revenue (last N days)    |
| GET    | `/api/reports/by-destination`         | ✅   | All   | Stats grouped by destination   |
| GET    | `/api/reports/by-status`              | ✅   | All   | Parcel counts by status        |
| GET    | `/api/reports/by-parcel-type`         | ✅   | All   | Stats by parcel type           |
| GET    | `/api/reports/top-customers`          | ✅   | All   | Top N customers by revenue     |
| GET    | `/api/reports/staff-performance`      | ✅   | Admin | Per-staff shipment/payment KPIs|
| GET    | `/api/reports/sack-manifest/:sack_id` | ✅   | All   | Full printable manifest        |
| GET    | `/api/reports/outstanding-balances`   | ✅   | All   | All customers with balances    |
| GET    | `/api/reports/delivery-performance`   | ✅   | All   | Avg delivery time by dest      |
| GET    | `/api/reports/audit-log`              | ✅   | Admin | Full system audit log          |

Date-range endpoints (`summary`, `by-destination`, `by-parcel-type`, `top-customers`, `staff-performance`) accept `from` and `to` query params (YYYY-MM-DD). Defaults to current month (or current year for `by-parcel-type` / `top-customers`).

`shipments-by-day` and `revenue-by-day` accept `days` (default 30).
`delivery-performance` accepts `days` (default 30).
`audit-log` accepts `limit`, `offset`, `user_id`, `action`.

---

### 🌐 Public Tracking (no auth)

| Method | Endpoint                     | Auth | Description                             |
|--------|--------------------------------|------|--------------------------------------------|
| GET    | `/api/tracking/:tracking_id` | ❌   | Full timeline visible to customers      |

Response:
```json
{
  "tracking_id": "KNO-260614-0001",
  "destination": "Kano",
  "status": "packed",
  "status_label": "Packed in Sack",
  "parcel_type": "Documents",
  "quantity": 1,
  "weight": 1.5,
  "receiver_name": "Test Receiver",
  "collector_name": null,
  "registered_at": "2026-06-14 15:45:55",
  "last_updated": "2026-06-14 15:45:55",
  "timeline": [
    { "status": "received_cairo", "label": "Received in Cairo", "note": "...", "office": "Cairo", "timestamp": "...", "done": true },
    { "status": "packed", "label": "Packed in Sack", "note": "...", "office": "Cairo", "timestamp": "...", "done": true, "current": true },
    { "status": "shipped", "label": "Shipped from Cairo", "done": false },
    ...
  ],
  "is_delivered": false,
  "is_held": false
}
```
Returns `404` with a friendly `message` if the tracking ID doesn't exist.

---

### ⚙️ Settings

| Method | Endpoint                         | Auth | Role  | Description                    |
|--------|------------------------------------|------|-------|------------------------------------|
| GET    | `/api/settings`                  | ✅   | All   | Full app config                |
| PATCH  | `/api/settings`                  | ✅   | Admin | Update app config              |
| GET    | `/api/settings/destinations`     | ✅   | All   | List of active destinations    |
| GET    | `/api/settings/parcel-types`     | ✅   | All   | List of parcel types           |
| GET    | `/api/settings/rates`            | ✅   | All   | Shipping rates per destination |
| GET    | `/api/settings/users`            | ✅   | Admin | All staff accounts             |
| POST   | `/api/settings/users`            | ✅   | Admin | Create staff account           |
| PATCH  | `/api/settings/users/:id`        | ✅   | Admin | Update staff account           |
| DELETE | `/api/settings/users/:id`        | ✅   | Admin | Delete staff account           |
| GET    | `/api/settings/profile`          | ✅   | All   | Own profile                    |
| PATCH  | `/api/settings/profile`          | ✅   | All   | Update own name/email          |
| POST   | `/api/settings/change-password`  | ✅   | All   | Change own password            |

**POST /api/settings/users** body:
```json
{
  "username": "kano2",
  "password": "staff123",
  "name": "New Staff",
  "email": "newstaff@egyptplugs.com",
  "role": "kano_staff",
  "office": "Kano"
}
```
`role`: `cairo_staff | kano_staff | abuja_staff | admin`

---

### 👤 Users (admin shorthand)

| Method | Endpoint         | Auth | Role  | Description           |
|--------|------------------|------|-------|-------------------------|
| GET    | `/api/users`     | ✅   | Admin | All staff users       |
| POST   | `/api/users`     | ✅   | Admin | Create staff user     |
| DELETE | `/api/users/:id` | ✅   | Admin | Delete staff user     |

---

## RBAC — Role-Based Access

| Action                       | cairo_staff | kano_staff | abuja_staff | admin |
|--------------------------------|-------------|------------|-------------|-------|
| Create parcel                | ✅           | ❌          | ❌           | ✅     |
| Set status: packed, shipped, hold, returned | ✅ | ❌ | ❌ | ✅ |
| Set status: arrived_destination, out_for_delivery, delivered | ❌ | ✅ | ✅ | ✅ |
| Assign parcel to sack        | ✅           | ❌          | ❌           | ✅     |
| Create / update sack status  | ✅ (create) | ✅ (status) | ✅ (status) | ✅     |
| View all parcels/customers/payments | ✅    | ✅          | ✅           | ✅     |
| View reports                 | ✅           | ✅          | ✅           | ✅     |
| Staff performance report     | ❌           | ❌          | ❌           | ✅     |
| Audit log                    | ❌           | ❌          | ❌           | ✅     |
| Manage staff users            | ❌          | ❌          | ❌           | ✅     |

> Dashboard arrivals (`/api/dashboard/arrivals`) is automatically scoped: Kano staff see only Kano-bound parcels, Abuja staff see only Abuja-bound, Cairo staff/admin see all.

---

## Status Flow

```
received_cairo → packed → shipped → arrived_destination → out_for_delivery → delivered
                                                        ↘ hold / returned (any stage)
```

---

## Tracking ID & Sack Number Format

- Tracking ID: `{KNO|ABJ|LGS}-{YYMMDD}-{SERIAL}` — e.g. `KNO-260614-0001`
- Sack Number: `SACK-{KNO|ABJ|LGS}-{YYMMDD}-{SERIAL}` — e.g. `SACK-KNO-260614-01`

Both generated server-side, serial auto-increments per destination per day.

---

## Database Schema

8 tables: `users`, `customers`, `parcels`, `parcel_photos`, `sacks`, `payments`, `audit_logs`, `tracking_timeline`

The server now targets Supabase Postgres via the `SUPABASE_DB_URL` environment variable. The schema is initialized automatically on startup and the seed script can populate the same data into Supabase.

### users
```
id, username (unique), password_hash, name, email, role, office, created_at, last_login
```

### customers
```
id, name, phone, email, whatsapp, city, type, status, balance, created_at, created_by
```

### parcels
```
id, tracking_id (unique), customer_id, receiver_name, receiver_phone, destination,
parcel_type, quantity, weight, declared_value, description, notes,
total_amount, amount_paid, balance (computed), payment_method, status,
sack_id, collector_name, created_by, created_at, updated_by, updated_at
```

### sacks
```
id, sack_number (unique), destination, flight_batch, status, capacity,
created_by, created_at, shipped_at, arrived_at, updated_at
```

### payments
```
id, customer_id, parcel_id, amount, payment_method, type, notes, recorded_by, created_at
```

### tracking_timeline
```
id, parcel_id, status, note, office, updated_by, created_at
```

### parcel_photos
```
id, parcel_id, file_url, file_type, uploaded_by, uploaded_at
```

### audit_logs
```
id, action, entity_type, entity_id, user_id, details (JSON), ip_address, created_at
```
