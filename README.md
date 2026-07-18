# DataHub Ghana — Build Guide (Data & Airtime Reselling Platform)

> Reference: Cyrus DataHub (bit.ly/CyrusDataHub → prodigimart.online/shop/cyrus-needhub), a white-label store built on the "Digital Hubb" reseller platform. This README breaks down that product's feature set and gives you a full frontend + backend spec to build your **own** version instead of renting a white-label storefront.

---

## 1. What the Reference Site Does

Observed features on Cyrus DataHub:

- **Network selection grid** — MTN, Telecel, AirtelTigo shown as tappable cards → "View Plans" per network.
- **Data bundle plans** — each network has its own bundle/price list (not visible without drilling in, but standard structure is size → price, e.g. 1GB / 5GB / 10GB tiers).
- **Quick Airtime top-up** — flat form to buy airtime GHS 0.50–500 for any network.
- **Instant delivery promise** — "0–5 minutes" fulfillment after payment, implying an automated wholesale API on the backend rather than manual processing.
- **Order tracking** — customer enters the phone number used at checkout to check delivery status (no login/account required — phone number is the identity key).
- **Trust signals** — orders completed counter, "100% secure payments," "24/7" availability.
- **Reseller/franchise layer** — "Start Your Own Store" lets others clone the storefront under their own branding and set their own margins (this is the Digital Hubb platform's core business model — you're seeing a *reseller of a reseller*).
- **Community/support** — WhatsApp group link for customer support/community.
- **No visible cart/multi-item checkout** — this is single-purchase flow (pick network → pick plan or enter airtime amount → pay → done), not a shopping cart model.

Your goal: build a leaner, fully-owned version of this — not a franchise storefront — so you keep 100% of margins and control the wholesale API relationship yourself.

---

## 2. Recommended Tech Stack

Matches tooling you already use (React/Vite + Node/Express) with additions specific to payments and telecom APIs.

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite, Tailwind CSS | Fast dev, matches your NDRS/RentSure stack |
| State/data fetching | TanStack Query (React Query) | Handles polling for order status cleanly |
| Backend | Node.js + Express | Matches your existing stack |
| Database | PostgreSQL (via Supabase or Railway) or MongoDB | Relational fits orders/transactions better; Supabase also gives you free file storage + auth if needed later |
| Payments | Paystack | Supports Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo Money) in Ghana natively |
| Data/Airtime wholesale | A Ghanaian data reseller API (e.g. one of the aggregators you were already evaluating) — abstract behind an internal `ProviderAdapter` interface so you can swap suppliers without touching the rest of the app | Decouples your app from any single wholesaler |
| SMS notifications | Hubtel SMS, Arkesel, or mNotify (Ghanaian SMS gateways with local sender ID registration) | For order confirmation + delivery SMS |
| Hosting (frontend) | Vercel or Netlify | Free tier, auto-deploy from GitHub |
| Hosting (backend) | Railway, Render, or Fly.io | Free/cheap tier, easy Postgres add-on |
| Auth (admin only) | JWT + bcrypt, or Supabase Auth | Customers don't need accounts — only your admin dashboard does |

---

## 3. Core User Flows

### Customer flow (no login required)
1. Land on homepage → choose network (MTN / Telecel / AirtelTigo).
2. See bundle list for that network (size, validity, price) **or** switch to "Quick Airtime" and enter a custom amount.
3. Enter the recipient phone number.
4. Pay via Paystack (Mobile Money checkout).
5. On payment webhook success → backend calls wholesale API to deliver the bundle/airtime → sends SMS confirmation.
6. Customer redirected to a tracking page (`/track?phone=...`) showing order status: `pending → paid → processing → delivered` or `failed → refunded`.

### Admin flow
1. Log in to `/admin`.
2. View live orders, filter by status/network/date.
3. Manually retry or refund failed deliveries.
4. Edit bundle prices/margins per network.
5. View revenue dashboard (daily/weekly/monthly totals, top-selling bundles).

---

## 4. Data Model

```
User (admin only)
  id, email, password_hash, role, created_at

Network
  id, name (MTN | Telecel | AirtelTigo), logo_url, is_active

Bundle
  id, network_id (FK), size_mb, label ("1GB", "5GB" etc), price_ghs,
  cost_price_ghs (your wholesale cost, for margin tracking), validity_days, is_active

Order
  id, phone_number, network_id (FK), bundle_id (FK, nullable if airtime),
  order_type ("data" | "airtime"), amount_ghs, status
    (pending | paid | processing | delivered | failed | refunded),
  payment_provider "paystack",
  wholesale_reference (id returned by supplier API),
  created_at, updated_at

Transaction (payment log, separate from Order for audit trail)
  id, order_id (FK), provider_reference, amount_ghs, status, raw_payload (jsonb),
  created_at
```

---

## 5. Backend API Endpoints

```
Public:
POST   /api/orders                 → create order (validates phone, network, bundle/amount)
POST   /api/payments/initialize    → returns Paystack checkout URL
POST   /api/payments/webhook       → payment provider calls this on success/failure
GET    /api/orders/track?phone=    → returns latest order(s) for that phone number
GET    /api/networks               → list active networks
GET    /api/bundles?network_id=    → list bundles for a network

Admin (JWT-protected):
POST   /api/admin/login
GET    /api/admin/orders           → paginated, filterable
POST   /api/admin/orders/:id/retry
POST   /api/admin/orders/:id/refund
GET    /api/admin/bundles
POST   /api/admin/bundles
PUT    /api/admin/bundles/:id
GET    /api/admin/stats            → revenue/order summaries
```

### Critical backend logic: the webhook handler
This is the heart of the system — get this right first:

1. Payment provider hits `/api/payments/webhook` with a signed payload.
2. **Verify the signature** (Paystack provides HMAC verification — never trust an unverified webhook).
3. Look up the `Order` by `payment_reference`.
4. If already processed (status != `pending`) → return 200 and do nothing (idempotency — webhooks can fire more than once).
5. Mark order `paid` → call wholesale `ProviderAdapter.deliver(order)`.
6. On wholesale success → mark `delivered`, save `wholesale_reference`, send SMS.
7. On wholesale failure → mark `failed`, alert yourself (email/Telegram bot), optionally auto-refund.

---

## 6. Frontend Structure (React + Vite)

```
src/
  components/
    NetworkSelector.jsx
    BundleList.jsx
    QuickAirtimeForm.jsx
    OrderTracker.jsx
    admin/
      OrdersTable.jsx
      BundleEditor.jsx
      RevenueDashboard.jsx
  pages/
    Home.jsx
    Track.jsx
    admin/
      Login.jsx
      Dashboard.jsx
  api/
    client.js          (axios/fetch wrapper with base URL + interceptors)
    orders.js
    payments.js
  hooks/
    useNetworks.js
    useBundles.js
    useOrderStatus.js   (poll every 5s while status is pending/processing)
  App.jsx
  main.jsx
```

Key UX details worth copying from the reference site:
- Keep the network picker as large tappable icons — most traffic will be mobile.
- Show delivery time expectation ("0–5 minutes") to reduce support messages.
- Order tracking by phone number only (no forced signup) reduces checkout friction — keep this.
- Show trust stats (orders completed, uptime) once you actually have real numbers — don't fabricate them.

---

## 7. Environment Variables

```
# Backend
DATABASE_URL=
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
WHOLESALE_API_BASE_URL=
WHOLESALE_API_KEY=
SMS_GATEWAY_API_KEY=
SMS_SENDER_ID=
JWT_SECRET=
ADMIN_EMAIL=
FRONTEND_URL=   (for CORS + redirect URLs)

# Frontend
VITE_API_BASE_URL=
VITE_PAYSTACK_PUBLIC_KEY=
```

---

## 8. Build Order (suggested milestones)

1. **Backend skeleton**: Express app, Postgres connection, `Network`/`Bundle` models seeded with real prices.
2. **Payment integration**: Paystack sandbox checkout → webhook → order status update (test with fake/sandbox wholesale call first).
3. **Wholesale adapter**: integrate the real data/airtime API once you've confirmed your wholesale account and pricing tiers.
4. **Frontend MVP**: network picker → bundle list → checkout → tracking page.
5. **SMS confirmations**: wire up sender ID once approved (this can take days to register in Ghana — start that application early, in parallel with dev work).
6. **Admin dashboard**: orders table, manual retry/refund, revenue stats.
7. **Polish + trust signals**: real stats, WhatsApp support link, FAQ/help section.
8. **Deploy**: frontend → Vercel, backend → Railway/Render, custom domain.

---

## 9. Things to Decide Before You Start Coding

- Which wholesale data/airtime API will you use, and what's their actual API contract (sync vs async delivery, do they have their own webhook)?
- Will you allow airtime-only, or data-only, or both from day one?
- Do you want a cart (multi-item checkout) later, or keep the single-purchase flow the reference site uses (simpler, faster to build)?

---

*This document is a build spec, not a legal or financial recommendation. Verify wholesale API terms, SMS sender ID registration requirements (NCA in Ghana), and payment provider compliance requirements before going live.*
