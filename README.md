# Egypt Plugs Air Shipping Services

Egypt Plugs is a full-stack logistics and shipping management system designed for air freight operations between Cairo, Egypt and major Nigerian destinations such as Kano, Abuja, and Lagos. The platform helps staff manage shipments, sacks/manifests, customers, payments, tracking, and delivery workflows from a single system.

## Overview

This repository contains both the frontend and backend for Egypt Plugs:

- Client: React + Vite + React Router
- Server: Express.js REST API
- Database: SQLite via LibSQL client
- Authentication: JWT-based staff login
- Media: Parcel photo uploads supported

## Key Features

- Shipment registration and tracking
- Sack/manifest creation and shipment batching
- Arrival and delivery workflow for destination offices
- Customer record management
- Payment and balance tracking
- Dashboard and reporting views
- Public parcel tracking page for customers
- Role-based access for admin and office staff
- Audit-friendly activity tracking

## Tech Stack

### Frontend
- React 18
- Vite
- React Router DOM
- Axios
- Tabler Icons

### Backend
- Express.js
- JWT authentication
- bcryptjs
- Multer for file uploads
- dotenv
- UUID utilities

## Project Structure

```text
client/          # React frontend application
server/          # Express backend API and database logic
SETUP_GUIDE.md   # Detailed installation and setup guide
```

## Prerequisites

Make sure the following are installed:

- Node.js 18 or newer
- npm 9 or newer

Verify versions:

```bash
node --version
npm --version
```

## Quick Start

### 1. Backend Setup

```bash
cd server
npm install
cp .env.example .env
npm run seed
npm run dev
```

The backend will run on:

- http://localhost:3001

### 2. Frontend Setup

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

The frontend will run on:

- http://localhost:5173

## Environment Variables

Create a `.env` file inside the server folder with values similar to:

```env
PORT=3001
JWT_SECRET=change-this-to-a-long-random-secret-string
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

> Important: Replace the JWT secret with a strong random value before deploying to production.

## Default Demo Credentials

After running the seed script, the following users are created:

| Username | Password | Role | Office |
|----------|----------|------|--------|
| admin | admin123 | Administrator | Cairo |
| cairo1 | staff123 | Cairo Staff | Cairo |
| kano1 | staff123 | Kano Staff | Kano |
| abuja1 | staff123 | Abuja Staff | Abuja |

## Main Application Routes

The frontend is organized as a multi-page application with routes such as:

- `/login`
- `/dashboard`
- `/shipments`
- `/shipments/new`
- `/sacks`
- `/arrivals`
- `/customers`
- `/payments`
- `/reports`
- `/settings`
- `/track/:tracking_id`

## Database

The server uses a SQLite database file created automatically during the seed process:

- server/egypt_plugs.db

The seed script initializes the schema and loads demo data.

## File Uploads

Parcel images are stored in the server uploads folder and served from the backend upload endpoint.

## Production Build

To build the frontend for production:

```bash
cd client
npm run build
```

The production build output will be generated in the client dist folder.

## Additional Documentation

For more detailed setup instructions, troubleshooting, and workflow details, see:

- [SETUP_GUIDE.md](SETUP_GUIDE.md)
- [server/README.md](server/README.md)

## Notes

This project is intended for internal logistics operations and can be adapted for production deployment with stronger security, environment hardening, and hosting infrastructure.
