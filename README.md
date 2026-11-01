# CampusLoop 🎓

> **One platform. One campus. Zero "has anyone seen my...?" group messages.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?logo=socket.io)](https://socket.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

---

## 📑 Table of Contents

- [The Problem](#-the-problem)
- [The Idea](#-the-idea)
- [Features](#-features)
  - [1. Lost & Found with Smart Auto-Matching](#1-lost--found-with-smart-auto-matching)
  - [2. Train Buddy Radar](#2-train-buddy-radar)
  - [3. Ride Splitting with Fair Fare Split](#3-ride-splitting-with-fair-fare-split)
  - [4. Campus Marketplace](#4-campus-marketplace)
  - [In-App Chat](#in-app-chat)
  - [Real-Time Notifications](#real-time-notifications)
  - [Trust & Safety](#trust--safety)
- [A Day with CampusLoop](#-a-day-with-campusloop)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Privacy and Safety Design](#-privacy-and-safety-design)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Step-by-Step Local Setup](#step-by-step-local-setup)
  - [Docker Compose Alternative](#docker-compose-alternative)
  - [Environment Variables](#environment-variables)
  - [Demo Login](#demo-login)
- [Available Scripts](#-available-scripts)
- [API Overview](#-api-overview)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Known Limitations](#-known-limitations)
- [Contributing](#-contributing)
- [License](#-license)
- [Footer](#-footer)

---

## 🚨 The Problem

Every semester, campus life devolves into notification chaos across dozens of unstructured WhatsApp, Telegram, and Discord groups:

- **Lost IDs and electronics** disappear into message backlogs, buried beneath hundreds of unrelated memes and event flyers within minutes.
- **Holiday travel** means students post "Anyone on the 12951 Rajdhani this Friday?" across ten different batch chats with zero coordination.
- **Airport cab sharing** relies on awkward last-minute group chats, manual UPI requests, and disputes over uneven luggage and fare splits.
- **Textbooks and dorm gear** are spammed across unofficial sale channels without search filters, category tags, or any guarantee that the seller is even an active student.

Campuses run on scattered, ephemeral group chats that were never built for structured campus logistics.

---

## 💡 The Idea

**CampusLoop** is the unified, student-exclusive web platform designed to eliminate campus group chat clutter. By requiring authenticated college email domains, CampusLoop creates a high-trust digital commons where students can recover belongings, synchronize travel, split commute expenses, and trade student essentials.

| Module | Core Purpose | Killer Feature |
| :--- | :--- | :--- |
| 🔍 **Lost & Found** | Belongings recovery on campus | Automatic category/location matching & ownership claim verification |
| 🚆 **Train Buddy Radar** | Holiday & weekend travel coordination | Radar matching batchmates on the same train/date without storing PNR |
| 🚖 **Ride Splitting** | Airport & transit station cab sharing | Live seat availability tracking and automatic equal fare calculation |
| 🛍️ **Campus Marketplace** | Peer-to-peer student commerce | Verified student listings, search filters, and persistent wishlists |

---

## ✨ Features

### 1. Lost & Found with Smart Auto-Matching
- **Categorized Reporting**: Post lost or found items with location tags (e.g. *Central Library Floor 3*, *Student Union*), category tags, timestamps, and photos.
- **Auto-Matching Engine**: Automatically runs similarity queries comparing new found items against open lost items across title, category, and campus coordinates.
- **Two-Step Claim Verification**: Finders do not publicly display private contact details. Claimants submit proof of ownership (serial numbers, distinguishing marks, receipt photos) that the finder verifies before contact exchange.
- **Status Lifecycle**: Items progress transparently from `OPEN` &rarr; `CLAIMED` &rarr; `RESOLVED` / `CLOSED`.

### 2. Train Buddy Radar
- **Journey Sync**: Students publish upcoming train journeys using public train numbers (e.g. `12951`), origin/destination stations, departure dates, and times.
- **Coach & Proximity Radar**: Discovers other students traveling on the identical train and date, indicating whether you are seated in the same coach or neighboring bogies.
- **Zero PNR Storage**: Ensures student safety by never collecting or storing sensitive ticket PNR numbers.

### 3. Ride Splitting with Fair Fare Split
- **Cab Coordination**: Post airport runs, railway station drop-offs, or weekend city trips with origin, destination, departure time, and capacity.
- **Dynamic Seat Management**: Students reserve seats with one click; available capacity decrements automatically in real time.
- **Automated Fare Split Calculator**: Calculates individual per-person fare allocations dynamically (`Total Estimated Fare / Confirmed Passengers`), outputting transparent participant breakdowns.

### 4. Campus Marketplace
- **Student Commerce**: Buy and sell textbooks, calculators, monitors, dorm furniture, and lab coats.
- **Granular Filters**: Search by keyword (`q`), price range (`minPrice`, `maxPrice`), category, and condition (`NEW`, `LIKE_NEW`, `GOOD`, `FAIR`).
- **Wishlist Tracking**: Bookmark items to receive price update notifications or inspect saved items from a dedicated wishlist panel.

### In-App Chat
- **Direct Messaging**: One-on-one conversation threads linked directly to marketplace items, ride splits, and claim approvals.
- **Real-Time Delivery**: Messages are pushed instantly over Socket.io web sockets without requiring page refreshes.

### Real-Time Notifications
- **Instant Event Alerts**: Receive notifications for automatic item match detections, claim submissions, new direct chat messages, and ride occupancy changes.
- **Unread Badges & Mark-as-Read**: Track read status per notification with direct deep-links to relevant resources.

### Trust & Safety
- **College-Domain-Only Access**: Authentication is strictly constrained to university email addresses (`*@campus.edu`) via verified one-time passwords (OTP).
- **Abuse & Scam Reporting**: Any student can report suspicious listings, spam posts, or abusive accounts with evidence.
- **Admin Moderation Panel**: Platform administrators have dedicated endpoints to inspect flagged reports, take down offending posts across all four modules, and ban bad actors.
- **Auto-Expiry**: Stale travel trips and resolved lost-and-found posts automatically phase out to keep feeds fresh.

---

## 🕒 A Day with CampusLoop

```
 08:30 AM ── Lost ID Card
 │           Alex leaves their student ID at the Central Library quiet study desk.
 │           Alex posts an item in "Lost & Found" tagged "Central Library Floor 3".
 │
 11:15 AM ── Automated Match & Claim
 │           Sam spots the ID card, uploads a photo to "Found Items".
 │           CampusLoop detects category + location match and notifies Alex.
 │           Alex submits a claim check with their student ID number; Sam approves.
 │
 02:00 PM ── Marketplace Textbook Purchase
 │           Alex needs the Organic Chemistry 8th Edition textbook for lab.
 │           Alex filters Marketplace by "Books", finds a senior's listing for $35,
 │           and opens an in-app chat to arrange a pickup outside the Student Center.
 │
 04:30 PM ── Airport Ride Splitting
 │           Alex needs a cab to the airport for Diwali/Thanksgiving break.
 │           Alex spots Sam's ride leaving at 05:30 AM tomorrow with 2 open seats.
 │           Alex clicks "Join"; the live fare split drops to $20/person for 3 riders.
 │
 07:00 PM ── Train Buddy Radar
 │           Alex registers their train trip (Train #12951) for the weekend return.
 │           CampusLoop Radar alerts Alex that two batchmates are in the same Coach B4!
```

---

## 📸 Screenshots

| View | Description | File Path |
| :--- | :--- | :--- |
| **Home Dashboard** | Unified portal displaying active feeds across all four modules | `/docs/screenshots/home-feed.png` |
| **Lost & Found Matcher** | Match alert modal showing similarity score and claim flow | `/docs/screenshots/lost-found-match.png` |
| **Train Buddy Radar** | Proximity radar showing batchmates traveling on the same train | `/docs/screenshots/train-buddy.png` |
| **Ride Splitting & Fare Split** | Live seat selection with dynamic per-person split calculator | `/docs/screenshots/ride-split.png` |
| **Marketplace Catalog** | Filtered product grid with pricing tags and condition badges | `/docs/screenshots/marketplace.png` |
| **Admin Moderation** | Moderation queue for reviewing reports and banning users | `/docs/screenshots/admin-dashboard.png` |

*(Place screenshot PNG files in `/docs/screenshots/` according to the paths above).*

---

## 🛠️ Tech Stack

Extracted directly from the root, `/client`, and `/server` manifests:

| Layer | Technology | Package / Version | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js | `next@^15.1.7` (App Router) | Server-rendered React framework |
| **UI Library** | React | `react@^19.0.0`, `react-dom@^19.0.0` | Modern component rendering |
| **Styling** | Tailwind CSS | `tailwindcss@^3.4.17`, `postcss`, `autoprefixer` | Utility-first responsive design |
| **Icons** | Lucide React | `lucide-react@^0.475.0` | Accessible iconography set |
| **Backend Framework** | Express | `express@^4.21.2` (TypeScript) | RESTful API server & routing |
| **Runtime & Execution**| Node.js / tsx | `Node.js >= 18`, `tsx@^4.19.3` | High-speed TypeScript execution |
| **Database & ORM** | PostgreSQL & Prisma | `@prisma/client@^6.4.1`, `prisma@^6.4.1` | Type-safe schema migrations & queries |
| **Authentication** | JWT | `jsonwebtoken@^9.0.2` | Bearer token authorization |
| **File Uploads** | Multer | `multer@^1.4.5-lts.1` | Multipart form image processing |
| **Real-Time WebSockets**| Socket.io | `socket.io@^4.8.1`, `socket.io-client@^4.8.1` | Real-time chat & live updates |
| **Language** | TypeScript | `typescript@^5.7.3` | End-to-end type safety |
| **Containerization** | Docker | `docker-compose.yml` (`postgres:16-alpine`) | Isolated local database container |

---

## 🏛️ Architecture

CampusLoop is structured as an npm workspaces monorepo containing the Next.js client, the Express/Prisma server, and a shared documentation/contract layer:

```
campusloop/
├── client/                     # Frontend Next.js (App Router, Tailwind CSS, TypeScript)
│   ├── app/
│   │   ├── globals.css         # Tailwind directives & CSS variables
│   │   ├── layout.tsx          # Root HTML layout with metadata
│   │   └── page.tsx            # Interactive landing & modules view
│   ├── lib/
│   │   ├── api.ts              # Fetch wrapper conforming to API contract envelope
│   │   └── socket.ts           # Socket.io client instance factory
│   ├── .env.example            # Frontend environment variable template
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── server/                     # Backend Node.js, Express, Prisma, Socket.io
│   ├── src/
│   │   └── index.ts            # Server entry, HTTP listener & Socket.io handlers
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL schema models & enums
│   │   └── seed.ts             # Demo student, ride, item, and trip seeds
│   ├── .env.example            # Backend environment variable template
│   ├── package.json
│   └── tsconfig.json
├── docs/                       # Single Source of Truth
│   ├── API_CONTRACT.md         # Full HTTP & WebSocket specification
│   ├── types.ts                # Shared TypeScript models, enums & payloads
│   └── screenshots/            # UI walkthrough screenshots
├── docker-compose.yml          # PostgreSQL 16 container definition
├── package.json                # Monorepo workspaces configuration
└── README.md
```

### System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Next.js 15)"]
        UI["React 19 UI / Tailwind CSS"]
        FetchClient["API Fetch Wrapper (Envelope Handler)"]
        SocketClient["Socket.io Client"]
    end

    subgraph Server["Backend Server (Express & TypeScript)"]
        Router["Express REST Router"]
        AuthMiddleware["JWT Bearer Auth Middleware"]
        SocketServer["Socket.io Server (Rooms & Events)"]
        PrismaClient["Prisma Client ORM"]
    end

    subgraph Storage["Data & Storage Layer"]
        Postgres[("PostgreSQL 16 Database")]
        Uploads[("Local / S3 Image Storage")]
    end

    UI --> FetchClient
    UI --> SocketClient

    FetchClient -- "HTTP REST (Bearer JWT)" --> AuthMiddleware
    AuthMiddleware --> Router
    Router --> PrismaClient
    Router --> Uploads

    SocketClient <-- "WebSockets (message:new, ride:updated)" --> SocketServer
    Router -. "Emit Trigger" .-> SocketServer

    PrismaClient <--> Postgres
```

---

## 🔒 Privacy and Safety Design

Campus safety and data privacy are core architectural tenets of CampusLoop:

1. **Zero PNR Storage**: We never ask for, process, or store passenger reservation (PNR) codes or national travel identity documents. Train Buddy Radar operates strictly on the public train number, date, and user-disclosed coach label.
2. **Contact Detail Masking**: Personal mobile numbers and email addresses remain shielded. On Lost & Found, claimants and finders communicate via anonymous claim forms until mutual verification is achieved.
3. **Walled College Garden**: Sign-up requires an email address ending in the approved campus domain (e.g. `@campus.edu`). This keeps spammers, commercial bots, and unauthorized third parties off the platform.
4. **Content & Account Moderation**: Every post and user account can be reported directly to campus administrators, who have unilateral ban and removal privileges.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher (`v20+` recommended)
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: Local PostgreSQL instance, cloud database (Supabase/Neon), or Docker

---

### Step-by-Step Local Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/campusloop.git
cd campusloop
```

#### 2. Install Monorepo Dependencies
Install all workspace dependencies with a single command from the root:
```bash
npm install
```

#### 3. Configure Environment Variables
Copy the `.env.example` templates in both folders:

```bash
# Server configuration
cp server/.env.example server/.env

# Client configuration
cp client/.env.example client/.env
```

*(On Windows PowerShell, use `Copy-Item server/.env.example server/.env` and `Copy-Item client/.env.example client/.env`).*

#### 4. Start the Database (Docker or Local)
If using Docker:
```bash
docker compose up -d
```
Verify the container is active:
```bash
docker ps
```

#### 5. Generate Prisma Client & Run Migrations
Generate the Prisma engine bindings and execute initial database migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

#### 6. Seed Demo Data
Populate the database with pre-configured students, rides, items, and trips:
```bash
npm run prisma:seed
```

#### 7. Start the Development Servers
Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
npm run dev:server
```
*Backend runs on: `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)*

**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
```
*Frontend runs on: `http://localhost:3000`*

---

### Docker Compose Alternative

To run the local PostgreSQL database service automatically:
```bash
# Start PostgreSQL container
docker compose up -d

# Stop container
docker compose down
```

---

### Environment Variables

#### Server Variables (`server/.env`)

| Variable | Purpose | Example Value |
| :--- | :--- | :--- |
| `PORT` | Local port for Express and Socket.io server | `5000` |
| `NODE_ENV` | Application runtime environment | `development` |
| `CLIENT_URL` | Allowed origin for CORS & Socket.io handshakes | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgrespassword@localhost:5432/campusloop?schema=public` |
| `JWT_SECRET` | Secret key used to sign and verify session tokens | `super-secret-jwt-key-change-in-production` |
| `JWT_EXPIRES_IN` | Token duration | `7d` |
| `UPLOAD_DIR` | Local directory for multipart file uploads | `./uploads` |

#### Client Variables (`client/.env`)

| Variable | Purpose | Example Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | REST API base URL accessible from browser | `http://localhost:5000/api` |
| `NEXT_PUBLIC_SOCKET_URL` | WebSocket server URL for real-time connection | `http://localhost:5000` |

---

### Demo Login

When you run `npm run prisma:seed`, the following accounts are provisioned:

| Role | Email Address | Access Level | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@campus.edu` | Full Platform & Moderation | Access to `/api/admin/*` endpoints and takedown tools |
| **Student (Alex)** | `student@campus.edu` | Student | Active poster of demo ride, lost item, and train trip |
| **Peer (Sam)** | `buddy@campus.edu` | Student | Co-passenger on ride and finder of headphones |

Authentication uses OTP verification. In `development` mode, the verification endpoint accepts OTP `123456` for any seeded university address.

---

## 📜 Available Scripts

### Root Workspace Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev:client` | Starts Next.js development server on port 3000 |
| `npm run dev:server` | Starts Express/Socket.io backend with hot reloading via `tsx watch` |
| `npm run build` | Builds both workspaces (`client` Next.js build + `server` TypeScript compile) |
| `npm run build:client` | Builds production-optimized Next.js frontend |
| `npm run build:server` | Compiles backend TypeScript to `./server/dist` |
| `npm run prisma:generate` | Generates `@prisma/client` TypeScript bindings |
| `npm run prisma:migrate` | Runs Prisma schema migrations against PostgreSQL |
| `npm run prisma:seed` | Executes `server/prisma/seed.ts` demo database seeder |

### Client Workspace Scripts (`cd client`)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server (`next dev`) |
| `npm run build` | Compiles production assets (`next build`) |
| `npm run start` | Runs built Next.js production server (`next start`) |
| `npm run lint` | Runs Next.js ESLint checks |

### Server Workspace Scripts (`cd server`)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs development server with `tsx watch src/index.ts` |
| `npm run build` | Compiles TypeScript using `tsc` to `./dist` |
| `npm run start` | Executes compiled production server (`node dist/index.js`) |
| `npm run prisma:generate` | Generates Prisma client locally |
| `npm run prisma:migrate` | Runs dev migrations |
| `npm run prisma:seed` | Seeds database via `tsx prisma/seed.ts` |

---

## 🔌 API Overview

All API requests and responses strictly adhere to the contract defined in [`/docs/API_CONTRACT.md`](./docs/API_CONTRACT.md).

### Standard Response Envelopes

- **Success**: `{ "data": ... }`
- **Error**: `{ "error": { "code": string, "message": string, "details": null } }`
- **Auth Header**: `Authorization: Bearer <JWT_TOKEN>`

### Endpoint Directory

| Group | Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/request-otp` | Request university email verification code | No |
| | `POST` | `/api/auth/verify-otp` | Verify OTP code and obtain session JWT | No |
| | `GET` | `/api/me` | Retrieve authenticated user profile | Yes |
| **Uploads** | `POST` | `/api/uploads` | Upload image file (returns URL) | Yes |
| **Lost Items** | `POST` | `/api/lost` | Report a lost item | Yes |
| | `GET` | `/api/lost` | Query lost items (`category`, `status`, `q`) | Optional |
| | `GET` | `/api/lost/:id` | Get specific lost item details | Optional |
| | `PATCH`| `/api/lost/:id/status` | Update item status (`OPEN`, `RESOLVED`, `CLOSED`)| Yes (Owner/Admin)|
| **Found Items**| `POST` | `/api/found` | Report found item (triggers auto-matching)| Yes |
| | `GET` | `/api/found` | Query found items | Optional |
| | `GET` | `/api/found/:id` | Get specific found item | Optional |
| | `POST` | `/api/found/:id/claim` | Submit ownership claim with proof | Yes |
| | `PATCH`| `/api/found/:id/status` | Update status (`OPEN`, `CLAIMED`, `RESOLVED`) | Yes (Owner/Admin)|
| **Marketplace**| `POST` | `/api/listings` | Create item listing | Yes |
| | `GET` | `/api/listings` | Search listings (`category`, `price`, `q`) | Optional |
| | `GET` | `/api/listings/:id` | Retrieve listing details | Optional |
| | `PATCH`| `/api/listings/:id` | Update listing price/details | Yes (Seller/Admin)|
| | `DELETE`| `/api/listings/:id` | Remove listing | Yes (Seller/Admin)|
| | `POST` | `/api/listings/:id/wishlist` | Add item to user wishlist | Yes |
| | `DELETE`| `/api/listings/:id/wishlist` | Remove item from wishlist | Yes |
| | `GET` | `/api/wishlist` | Get user's wishlisted listings | Yes |
| **Trips** | `POST` | `/api/trips` | Post upcoming train trip | Yes |
| | `GET` | `/api/trips/mine` | View logged trips | Yes |
| | `GET` | `/api/trips/:id/buddies` | Discover matched train buddies | Yes |
| | `DELETE`| `/api/trips/:id` | Delete train trip | Yes (Owner/Admin)|
| **Rides** | `POST` | `/api/rides` | Post cab share / ride offer | Yes |
| | `GET` | `/api/rides` | Browse open rides by date/destination | Optional |
| | `POST` | `/api/rides/:id/join` | Join ride as passenger | Yes |
| | `POST` | `/api/rides/:id/leave` | Leave joined ride | Yes |
| | `PATCH`| `/api/rides/:id/status` | Update ride status (`OPEN`, `FULL`, etc.) | Yes (Creator/Admin)|
| | `GET` | `/api/rides/:id/fare-split`| Calculate real-time equal fare split | Yes |
| **Chat** | `GET` | `/api/conversations` | List user conversation threads | Yes |
| | `POST` | `/api/conversations` | Create or fetch direct conversation | Yes |
| | `GET` | `/api/conversations/:id/messages` | Fetch conversation history | Yes (Participant)|
| | `POST` | `/api/conversations/:id/messages` | Send message (triggers socket event) | Yes (Participant)|
| **Notifs** | `GET` | `/api/notifications` | List user notifications | Yes |
| | `PATCH`| `/api/notifications/:id/read` | Mark notification as read | Yes |
| **Admin** | `POST` | `/api/reports` | Submit moderation report | Yes |
| | `GET` | `/api/admin/reports` | View all platform reports | Yes (Admin only)|
| | `DELETE`| `/api/admin/posts/:type/:id` | Remove flagged post across modules | Yes (Admin only)|
| | `PATCH`| `/api/admin/users/:id/ban` | Ban/unban user account | Yes (Admin only)|

### Socket.io Real-Time Events

- `message:new` (Server &rarr; Client): Broadcasts new message to conversation participants.
- `notification:new` (Server &rarr; Client): Emits real-time match, claim, or system notifications to a user's private room (`user:<userId>`).
- `ride:updated` (Server &rarr; Client): Emitted whenever seat reservations or ride statuses change (`ride:<rideId>`).
- `chat:join` / `chat:leave` (Client &rarr; Server): Join or leave conversation room.
- `ride:subscribe` / `ride:unsubscribe` (Client &rarr; Server): Subscribe to live ride capacity changes.

---

## 🧪 Testing

CampusLoop's architecture supports comprehensive testing across unit, integration, and end-to-end layers:

```bash
# 1. Run Unit & API Integration Tests (Express & Prisma)
npm run test --workspace=server

# 2. Run Client Component Tests
npm run test --workspace=client

# 3. Run Playwright End-to-End Tests
npx playwright test
```

*Note: Playwright tests verify the full end-to-end user loop across authentication, lost item posting, claim submission, and ride fare splitting.*

---

## 🚢 Deployment

### 1. Frontend: Vercel
1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com/).
3. Set **Root Directory** to `client`.
4. Configure Environment Variables in the Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com/api`
   - `NEXT_PUBLIC_SOCKET_URL`: `https://api.yourdomain.com`
5. Deploy. Vercel automatically runs `next build`.

### 2. Backend: Railway or Render
1. Create a new Web Service on [Railway](https://railway.app/) or [Render](https://render.com/).
2. Point the service to your repository with **Root Directory** set to `server`.
3. Add a managed **PostgreSQL** database addon.
4. Set Build & Start commands:
   - **Build Command**: `npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `npm run start`
5. Configure Environment Variables:
   - `PORT`: `5000` (or dynamically supplied `$PORT`)
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://your-vercel-domain.vercel.app`
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET`: Generate a secure 64-character random string
   - `JWT_EXPIRES_IN`: `7d`

---

## 🗺️ Roadmap

- [x] Monorepo workspace configuration (`client`, `server`, `docs`)
- [x] Next.js 15 App Router frontend with Tailwind CSS and responsive layout
- [x] Express + TypeScript server with Socket.io web socket foundation
- [x] PostgreSQL Prisma ORM schema covering all four core domains
- [x] Complete REST API & Socket.io specification (`/docs/API_CONTRACT.md`)
- [x] Shared TypeScript interfaces and response envelopes (`/docs/types.ts`)
- [x] Database seeder script with demo admin, students, items, rides, and trips
- [ ] Connect individual module route handlers to the Express API router
- [ ] Integrate production SMTP / SendGrid for live university email OTP delivery
- [ ] Mobile application built with React Native / Expo
- [ ] Seller trust ratings and verified campus ambassador badges
- [ ] Interactive campus map view for lost/found items and ride pickup points
- [ ] Optional WhatsApp bot notifications for urgent lost item matches

---

## ⚠️ Known Limitations

In the spirit of complete transparency regarding the current state of the codebase:

1. **Route Handlers Scaffolded**: The monorepo architecture, Prisma schema, database seeder, Next.js frontend, and Socket.io server are built and verified. Concrete business route handlers for `/api/lost`, `/api/rides`, etc. are defined in `/docs/API_CONTRACT.md` and are currently being connected to the Express router.
2. **Mock OTP Authentication**: OTP verification accepts code `123456` in development mode. Integration with an external production email provider (e.g. Resend, SendGrid) is required for live domain verification.
3. **Local Disk Image Uploads**: Uploaded images are stored in `./server/uploads/` via Multer. For production multi-instance hosting, configure an S3-compatible bucket (AWS S3, Cloudflare R2).
4. **WebSocket Polling Fallback**: Socket.io is configured with CORS enabled; production deployments across separate domains require sticky sessions or Redis adapter for multi-instance scaling.

---

## 🤝 Contributing

Contributions from students and open-source developers are welcome!

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Your Changes** (Follow conventional commit messages)
   ```bash
   git commit -m "feat(rides): add luggage capacity indicator"
   ```
4. **Keep API Contract Synced**: If you modify request payloads or response shapes, you **must** update [`/docs/API_CONTRACT.md`](./docs/API_CONTRACT.md) and [`/docs/types.ts`](./docs/types.ts).
5. **Push to Your Branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🎓 Footer

**Built by students, for students. 🎓**
