# QR Ordering App (Beginner MVP)

A beginner-friendly QR ordering web app built with **Next.js App Router** and **SQLite**.

## Features

- Customer page at `/customer`
- Supports table number from URL, example: `/customer?table=5`
- Add to cart and adjust quantity using `+` and `-`
- Submit orders to SQLite
- Admin page at `/admin`
- Admin can view all orders
- Admin can change order status:
  - `pending`
  - `preparing`
  - `ready`

---

## Tech Stack

- Next.js 14
- React 18
- SQLite (`sqlite` + `sqlite3`)

---

## Run Locally

```bash
npm install
npm run dev