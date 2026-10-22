# Nur Return Manager

Backend tool for the Nur by Juggun team. When PostEx returns a refused-delivery package, 
the team uses this app to mark the Shopify order as returned and restock inventory automatically.

## Stack
- **Next.js 14** (hosted on Vercel — free)
- **Shopify Admin GraphQL API** (via Custom App token)
- No database needed — reads directly from Shopify

---

## Setup

### Step 1 — Create a Shopify Custom App

1. Go to **Shopify Admin → Settings → Apps and sales channels**
2. Click **Develop apps** → **Create an app**
3. Name it: `Nur Return Manager`
4. Click **Configure Admin API scopes** and enable:
   - ✅ `read_orders`
   - ✅ `write_orders`
   - ✅ `read_returns`
   - ✅ `write_returns`
   - ✅ `read_inventory`
   - ✅ `write_inventory`
5. **Save → Install app**
6. Copy the **Admin API access token** (only shown once — save it!)

### Step 2 — Deploy to Vercel

1. Push this folder to a **GitHub repo** (private is fine)
2. Go to [vercel.com](https://vercel.com) → New Project → Import that repo
3. Add these **Environment Variables** in Vercel:

| Variable | Value |
|---|---|
| `SHOPIFY_STORE_DOMAIN` | `nur-by-juggun.myshopify.com` |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | `shpat_xxxx` (from Step 1) |
| `APP_PASSWORD` | Any password your team will use to log in |

4. Click **Deploy** — done!

### Step 3 — Use the app

1. Open the Vercel URL
2. Enter your team password
3. Find the returned order → Click **Mark as Returned**
4. ✅ Return created in Shopify + inventory restocked

---

## How it works (backend flow)

```
Team clicks "Mark as Returned"
        ↓
1. returnCreate  → Creates return on Shopify order
2. returnClose   → Marks the return as completed
3. returnRefundCreate (transactions:[]) → Restocks inventory, NO money refund
```
