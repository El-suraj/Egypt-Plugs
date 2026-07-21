# Egypt Plugs — Frontend (Client)

React 18 + Vite multi-page application for the Egypt Plugs Air Shipping Services logistics platform.

## Quick Start

```bash
npm install
npm run dev
```

Runs at **http://localhost:5173**. Requires the backend (`/server`) running on **http://localhost:3001** — the Vite dev server proxies `/api/*` and `/uploads/*` to it (see `vite.config.js`).

## Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

Output goes to `dist/`. Deploy this as a static site and configure your web server / reverse proxy to:
1. Serve `dist/index.html` as a fallback for all client-side routes (SPA history fallback)
2. Proxy `/api/*` and `/uploads/*` to the backend server

## Project Structure

```
src/
├── main.jsx              ← Router setup, all routes defined here
├── lib/api.js             ← Axios instance with JWT interceptor
├── hooks/useAuth.jsx       ← Auth context (login, logout, current user)
├── components/
│   ├── Layout.jsx          ← Sidebar + TopBar shell used on every authenticated page
│   └── ui.jsx               ← Shared design tokens & components (Badge, Btn, Table, etc.)
└── pages/
    ├── Login.jsx            ← /login
    ├── Track.jsx             ← /track/:tracking_id (public, no auth)
    ├── Dashboard.jsx         ← /dashboard
    ├── Shipments.jsx          ← /shipments
    ├── NewShipment.jsx        ← /shipments/new
    ├── ParcelDetail.jsx        ← /shipments/:tracking_id and /search
    ├── Sacks.jsx               ← /sacks
    ├── SackDetail.jsx           ← /sacks/:id (printable manifest)
    ├── Customers.jsx            ← /customers
    ├── Payments.jsx              ← /payments
    ├── Arrivals.jsx               ← /arrivals
    ├── Reports.jsx                ← /reports
    └── Settings.jsx                ← /settings
```

## Authentication

- JWT stored in `localStorage` under `token` and `user`.
- `src/lib/api.js` attaches `Authorization: Bearer <token>` to every request automatically.
- On `401` responses, the user is redirected to `/login` and local storage is cleared.
- `ProtectedRoute` (in `main.jsx`) wraps all authenticated pages and redirects to `/login` if not signed in.

## Design System

All shared visual primitives live in `src/components/ui.jsx`:

- `C` — color palette object (navy, blue, green, orange, purple, teal, red, amber, gray)
- `Badge`, `StatCard`, `Btn`, `Input`, `Select`, `Card`, `Table`/`TR`/`TD`, `Spinner`, `Empty`, `PageHeader`
- `STATUS_COLORS` / `STATUS_LABELS` — maps parcel status → badge color / human label
- `formatCurrency`, `formatDate`, `timeAgo` — formatting helpers

Icons are from [Tabler Icons](https://tabler.io/icons) loaded via CDN in `index.html` (`<i className="ti ti-xxx" />`).

## Notable Implementation Details

- **Multi-page, not SPA-feel**: every section is its own route (`/dashboard`, `/shipments`, `/sacks`, etc.) via React Router — no tab-switching state, fully linkable/bookmarkable.
- **New Shipment** form (`NewShipment.jsx`) does live customer search/autocomplete, photo upload (multipart), and a live running summary + balance calculation.
- **Parcel Detail** (`ParcelDetail.jsx`) renders the full 6-step tracking timeline and includes a status-update modal with role-aware status options and collector-name capture.
- **Sacks** (`Sacks.jsx`) supports scan-to-add (enter tracking ID + Enter), live sack totals, and sack status transitions (open → closed → shipped → arrived) which cascade to all contained parcels server-side.
- **Track** (`Track.jsx`) is the public, no-auth tracking page matching the login screen's "Track Your Parcel" design — accessible at `/track/:tracking_id`.
- **Reports** (`Reports.jsx`) renders bar charts, destination breakdowns, and (for admins) staff performance — all via lightweight inline SVG/CSS, no chart library dependency.
