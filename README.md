# MarketHub — Modern Marketplace Platform

A full-stack OLX-style marketplace built with **Next.js 15 + React 19** (frontend) and **Node.js + Express + MongoDB** (backend). JavaScript only — no TypeScript.

It runs out of the box in **DEMO MODE** with zero paid API keys. Stripe, Cloudinary, email (SMTP), and Google login all light up automatically the moment you add their keys — until then the app uses safe fallbacks so you can test every flow immediately.

---

## What's inside

```
markethub/
├── server/      → Express REST API + Socket.io + MongoDB (Mongoose)
├── client/      → Next.js 15 App Router frontend (Tailwind, Redux, React Query)
└── README.md    → you are here
```

### Features

- Email signup + **OTP verification** + JWT access/refresh tokens + Google OAuth login + password reset
- Create / edit / delete listings, multi-image upload, **My Ads**, wishlist, recently viewed
- Marketplace with **MongoDB text search**, category / condition / price filters, sorting, pagination
- **Stripe** checkout + webhook → order creation (mock order when no Stripe key)
- **Admin panel**: analytics dashboard, approve/reject listings, manage users/products/orders
- **Socket.io** realtime notifications (order success, listing approved/rejected, new product)
- Dark mode, glassmorphism, Framer Motion animations, fully responsive
- Security: Helmet, CORS, rate limiting, Zod validation, bcrypt, mongo-sanitize

---

## Prerequisites

1. **Node.js 18.18+** (Node 20 LTS recommended) → https://nodejs.org
2. **A MongoDB database.** Two easy options:
   - **MongoDB Atlas (free, recommended)** → https://www.mongodb.com/cloud/atlas — create a free cluster, then **Connect → Drivers** to copy your connection string. It looks like:
     `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/markethub`
   - **Local MongoDB** → install Community Server, then use `mongodb://127.0.0.1:27017/markethub`

That's the only thing you *must* have. Everything else is optional.

---

## Setup — step by step

Open **two terminals** (one for the backend, one for the frontend).

### 1) Backend (`/server`)

```bash
cd server
npm install
```

Create the env file by copying the example:

```bash
# macOS / Linux
cp .env.example .env
# Windows (PowerShell)
copy .env.example .env
```

Open `server/.env` and set these **two required** things:

| Variable | What to put |
|---|---|
| `MONGODB_URI` | Your Atlas or local connection string (see Prerequisites) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Any two long random strings (mash your keyboard) |

Leave everything else blank for now — the app handles the rest in demo mode.

Seed the database with demo categories, users, and products:

```bash
npm run seed
```

Start the API:

```bash
npm run dev
```

You should see: `MarketHub API running on http://localhost:5000  [mode: DEMO ...]`

### 2) Frontend (`/client`)

In the **second terminal**:

```bash
cd client
npm install
```

Create the env file. **Next.js reads `.env.local`**, so the target name matters:

```bash
# macOS / Linux
cp .env.example .env.local
# Windows (PowerShell)
copy .env.example .env.local
```

The defaults already point at `http://localhost:5000` — no edits needed. Start it:

```bash
npm run dev
```

Open **http://localhost:3000** 🎉

---

## Demo accounts (created by the seed script)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@markethub.com` | `Admin@123` |
| User | `alice@example.com` | `Test@123` |
| User | `bob@example.com` | `Test@123` |

Log in as **admin** to see the admin panel at `/admin` (analytics, moderation, users, orders). The seed adds 2 listings in **pending** status so you have something to approve right away.

---

## How demo mode works (important)

The app never crashes because a key is missing. Instead:

| Service | Without a key (demo) | With a key |
|---|---|---|
| **Email / OTP** | The 6-digit code is printed to the **server console** *and* returned in the API response, so the verify/reset screens **auto-fill it for you**. | Real email is sent via SMTP. |
| **Image upload** | Files are saved to `server/uploads/` and served from `http://localhost:5000/uploads/...` | Uploaded to Cloudinary. |
| **Payments** | "Buy now" instantly creates a **paid mock order** and marks the item sold. | Real Stripe Checkout redirect + webhook. |
| **Google login** | The Google button is **hidden**. | Button appears and works. |

So you can register → verify OTP → list a product → approve it as admin → buy it → see the order, all with **zero external setup**.

---

## Enabling the real integrations (optional)

Add any of these to `server/.env` (and restart the server). Mix and match freely.

### Email (Nodemailer SMTP)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password      # Gmail: create an App Password
SMTP_FROM=MarketHub <no-reply@markethub.dev>
```

### Cloudinary (image hosting) — https://cloudinary.com (free tier)
```
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

### Stripe (payments) — https://dashboard.stripe.com/test/apikeys
```
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```
To test the webhook locally, install the Stripe CLI and run:
```
stripe listen --forward-to localhost:5000/api/stripe/webhook
```
Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.

### Google OAuth login — https://console.cloud.google.com/apis/credentials
Create an **OAuth 2.0 Client ID** (Web). Add `http://localhost:3000` to authorized JavaScript origins. Then set the SAME client id in **both** files:
```
# server/.env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
# client/.env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

---

## About the product images

The seed listings use **picsum.photos** placeholder images (random stock photos), not real OLX images — OLX's catalog is copyrighted and not redistributable. When you create your own listing and upload photos, those are your real images (stored locally in demo mode, or on Cloudinary if configured).

---

## Tech stack

**Frontend:** Next.js 15 (App Router), React 19, TailwindCSS, Framer Motion, Redux Toolkit, TanStack React Query, React Hook Form, Zod, Axios, socket.io-client

**Backend:** Node.js, Express, Mongoose (MongoDB), JWT, bcrypt, Multer, Cloudinary, Nodemailer, Stripe, Socket.io, Zod, Helmet, express-rate-limit

---

## Project structure

```
server/src/
├── config/        env, db, cloudinary
├── models/        User, Product, Order, Category, Wishlist, RefreshToken, OTPVerification
├── controllers/   auth, product, order, admin, user, wishlist, category
├── routes/        one file per resource
├── middleware/    auth, admin, upload, validate, error
├── validators/    zod schemas
├── utils/         token, email, otp, ApiError, asyncHandler
├── socket/        socket.io notification setup
├── seed/          seed.js  (npm run seed)
├── app.js         express app
└── index.js       http server + socket boot

client/src/
├── app/           all pages (App Router)
├── components/    Navbar, ProductCard, Shell, etc.
├── store/         Redux slices (auth, theme)
├── hooks/         useAuth
└── lib/           axios api client, formatters
```

---

## Troubleshooting

- **`MongoServerError` / can't connect** → check `MONGODB_URI`. On Atlas, allow your IP under **Network Access** (or add `0.0.0.0/0` for testing) and make sure the DB user/password are correct.
- **No products show up** → run `npm run seed` in `/server` first, and confirm the API terminal has no errors.
- **Frontend can't reach API / CORS errors** → make sure the backend is running on port 5000 and `client/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:5000/api`. Also confirm `CLIENT_URL=http://localhost:3000` in `server/.env`.
- **OTP screen** → in demo mode the code is auto-filled and also printed in the server terminal. Just click Verify.
- **Port already in use** → change `PORT` in `server/.env`, or run the client on another port: `npm run dev -- -p 3001`.
- **Env changes not taking effect** → restart the dev server after editing `.env` / `.env.local`.

---

Built for an internship evaluation. MIT licensed.
