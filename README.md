# E-commerce App

A full-stack e-commerce web app built with **Next.js 16** (App Router) and **React 19**, using **MongoDB**, **NextAuth.js** for authentication, and **Stripe** for payments.

## What’s implemented in this project

This section summarizes **what the codebase actually contains**—useful for portfolios, handoffs, or remembering scope.

### App shell and UX

- **Root layout** (`app/layout.tsx`): Geist Sans / Geist Mono, site metadata, global styles, `SiteHeader` on every page, and **`SessionProvider`** wrapping the app (`app/providers.tsx`).
- **Home page** (`app/page.tsx`): marketing-style hero, quick links (register, login, products, checkout, account, admin), **newsletter** block, **web push** subscribe UI, and decorative background treatment.
- **Global styling** (`app/globals.css`) with **Tailwind CSS 4**; **favicon / app icon** (`app/icon.svg`) and **logo** (`public/logo.svg`).

### Storefront and checkout

- **Product listing** (`app/products/page.tsx`) and **product detail** (`app/products/[id]/page.tsx`).
- **Cart** persisted in the browser via **`useCart`** (`hooks/useCart.ts`, `localStorage` key `ecom_cart_v1`).
- **Checkout flow** (`app/checkout/page.tsx`, `app/checkout/return/page.tsx`) wired to **draft checkout** and **Stripe Checkout** APIs.
- **Order pricing helpers** (`lib/order-pricing.ts`) and checkout helpers (`lib/checkout.ts`).

### Authentication and users

- **NextAuth** App Router handler (`app/api/auth/[...nextauth]/route.ts`) with shared options in **`lib/auth.ts`**:
  - **Credentials** sign-in by **email or phone** and password (bcrypt; optional migration from legacy plain-text passwords on login).
  - Optional **Google** provider when `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are set; Google users are created or matched in MongoDB.
  - **JWT sessions**; role and user status on the token; custom sign-in page at `/auth/login`.
- **Pages**: register (`app/auth/register/page.tsx`), login (`app/auth/login/page.tsx`), email verification (`app/auth/verify-email/page.tsx`).
- **Extended session types** (`types/next-auth.d.ts`) and shared domain types (`types/index.ts`).
- **User APIs**: list/create (`app/api/users/route.ts`), by id (`app/api/users/[id]/route.ts`), current user (`app/api/users/me/route.ts`).

### Customer dashboard (authenticated)

- **Orders** (`app/dashboard/orders/page.tsx`), **profile** (`app/dashboard/profile/page.tsx`), **wishlist** (`app/dashboard/wishlist/page.tsx`).
- **Wishlist API** (`app/api/wishlist/route.ts`).

### Admin area (`ADMIN` only)

- **Dashboard** (`app/admin/dashboard/page.tsx`), **products** (`app/admin/products/page.tsx`), **categories** (`app/admin/categories/page.tsx`), **users** (`app/admin/users/page.tsx`), **marketing** (`app/admin/marketing/page.tsx`).
- **Admin push** API to send notifications (`app/api/admin/push/route.ts`).

### Catalog and content APIs

- **Products** (`app/api/products/route.ts`, `app/api/products/[id]/route.ts`).
- **Categories** (`app/api/categories/route.ts`, `app/api/categories/[id]/route.ts`).
- **Reviews** (`app/api/reviews/route.ts`).
- **Newsletter** (`app/api/newsletter/route.ts`).

### Payments and orders

- **Stripe Checkout session** creation (`app/api/stripe/checkout-session/route.ts`).
- **Orders** API (`app/api/orders/route.ts`) using `STRIPE_SECRET_KEY` where relevant.
- **Checkout draft** (`app/api/checkout/draft/route.ts`).

### Web push

- **Subscribe** endpoint (`app/api/push/subscribe/route.ts`).
- **Client component** `components/PushSubscribe.tsx` (uses `NEXT_PUBLIC_VAPID_PUBLIC_KEY`).
- **Service worker** (`public/sw.js`) handles `push` and `notificationclick`.

### Email and assets

- **SMTP mail helper** (`lib/email.ts`) for transactional messages (e.g. verification links using `NEXTAUTH_URL`).
- **Dynamic image routes** for backgrounds: `app/api/assets/auth-bg/route.ts`, `app/api/assets/products-bg/route.ts`.

### Data and security

- **MongoDB** connection helper with dev singleton (`lib/db.ts`).
- **Middleware** (`middleware.ts`) protects `/dashboard/*` (any signed-in user) and `/admin/*` (role `ADMIN`).

### Shared UI

- **`SiteHeader`** (`components/SiteHeader.tsx`) for global navigation.
- **`NewsletterForm`** (`components/NewsletterForm.tsx`).

---

## Features

- **Storefront**: Product listing and detail pages, client-side cart, and wishlist.
- **Accounts**: Registration and sign-in (email or phone + password), optional **Google OAuth**, and email verification.
- **Customer dashboard** (`/dashboard`): Orders, profile, and wishlist (login required).
- **Admin panel** (`/admin`): Products, categories, users, marketing, and dashboard (requires `ADMIN` role).
- **Checkout**: Stripe Checkout sessions.
- **Web push**: VAPID-based subscription and admin send endpoint.
- **Newsletter** and product **reviews** (via existing API routes).

## Prerequisites

- Node.js (a recent version that supports Next.js 16)
- MongoDB (Atlas or self-hosted)
- (Optional) Stripe account for payments
- (Optional) SMTP for transactional email
- (Optional) Google OAuth credentials
- (Optional) VAPID keys for web push

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # run after build
npm run lint    # ESLint
```

## Environment variables

Create `.env.local` in the project root. Do not commit secrets.

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | **Required** — MongoDB connection string |
| `MONGODB_DB_NAME` | Database name (code default: `blog__lap3`) |
| `NEXTAUTH_URL` | Public app URL, e.g. `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret for signing sessions (required in production) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Enable Google sign-in (optional) |
| `STRIPE_SECRET_KEY` | Stripe secret key for checkout sessions |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Outbound email (verification, etc.) |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Server-side push (e.g. `mailto:you@example.com`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Same public key exposed to the browser for subscription |

## Access control

- Routes under `/dashboard` require a signed-in user.
- Routes under `/admin` require a session with role `ADMIN` (see `middleware.ts`).

## Stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4
- Official MongoDB Node driver
- NextAuth.js 4
- Stripe, web-push, nodemailer, bcryptjs

## License

Private project (`private` in `package.json`). Update this section if you add an explicit license.
