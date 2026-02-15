# Rocky Da Adda 🌿

> **"Mess ka trauma is real. Food shouldn't be."**

A modern, mobile-first restaurant ordering system designed for campus dining. Built with Next.js, React, TypeScript, and Supabase.

![100% Pure Vegetarian](https://img.shields.io/badge/100%25-Pure%20Vegetarian-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-3FCF8E)

## 🍽️ Features

### Customer Ordering

- **Table Selection** — Scan QR or enter table number to order
- **Menu Browsing** — 87+ items with images, search, category filters
- **Cart & Checkout** — Add-ons, quantity control, live price totals
- **Order Tracking** — Real-time status updates (Pending → Preparing → Ready)
- **Preorder** — Order ahead and pick a delivery time slot

### Admin Panel (`/admin`)

- **Live Order Dashboard** — Incoming orders with one-click status updates
- **Menu Management** — Edit items, toggle availability, update prices
- **Image Upload** — Upload images to Supabase Storage or pick from library
- **Rush Hour Mode** — Quickly disable slow-prep items during peak hours
- **Password Protected** — Simple password gate on the landing page

### Kitchen Dashboard (`/kitchen`)

- **Chef-Based Order Display** — Orders auto-grouped by assigned chef
- **Chef Management** — Add, edit, delete chefs with color-coded profiles
- **Category Assignment** — Assign food categories to specific chefs
- **Item Tick-Off** — Mark individual items ready; order auto-completes when all done
- **Real-Time Sync** — Live updates via Supabase Realtime subscriptions
- **Unassigned Alerts** — Warning banner when categories lack a chef

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/vikramkumawat077/Dosa-Inn-Food-Tracker.git
cd Dosa-Inn-Food-Tracker
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set Up Database

Run these SQL files in your **Supabase SQL Editor** (in order):

1. `supabase/schema.sql` — Core tables (categories, menu_items, orders, settings)
2. `supabase/storage.sql` — Image storage bucket
3. `supabase/kitchen.sql` — Kitchen dashboard tables (chefs, chef_categories)

### 4. Seed Data (Optional)

```bash
npx tsx scripts/seed.ts
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
rocky-da-adda/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Landing page (password gate)
│   ├── table/                  # Table selection
│   ├── menu/                   # Menu browsing
│   ├── cart/                   # Shopping cart
│   ├── checkout/               # Payment flow
│   ├── order-confirmed/        # Order success
│   ├── track-order/            # Order tracking
│   ├── preorder/               # Preorder (skip-the-wait)
│   ├── admin/                  # Admin panel
│   ├── kitchen/                # Kitchen dashboard
│   ├── globals.css             # Design system & tokens
│   └── layout.tsx              # Root layout
├── components/                 # Shared UI components
│   ├── Header.tsx
│   └── LeafLoader.tsx
├── lib/                        # Core logic
│   ├── menuContext.tsx          # Menu, orders, settings (Supabase)
│   ├── cartContext.tsx          # Cart state management
│   ├── menuData.ts             # Menu items, categories, add-ons
│   └── supabaseClient.ts       # Supabase client init
├── supabase/                   # Database setup
│   ├── schema.sql              # Core schema
│   ├── storage.sql             # Storage bucket
│   └── kitchen.sql             # Kitchen tables
├── scripts/                    # Utility scripts
│   └── seed.ts                 # Database seeder
├── public/                     # Static assets
│   ├── menu-images/            # 65+ food images
│   └── logo.png                # Brand logo
└── package.json
```

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#1a4d2e` | Forest green — buttons, badges |
| `--color-accent` | `#7cb342` | Leaf green — tags, highlights |
| `--color-bg` | `#f8f6f1` | Off-white background |
| `--color-warning` | `#ff9800` | Orange — alerts, kitchen badge |
| Font | Inter | Clean, modern sans-serif |

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime |
| Storage | Supabase Storage |
| Styling | CSS Modules + design tokens |
| State | React Context API |

## 📱 Mobile-First Design

- Touch-friendly buttons (min 44px tap targets)
- Bottom sheet modals for item details
- Responsive grid layouts
- Smooth 60fps animations
- Parallax landing page

## 🛠️ Available Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🔒 Admin Access

The admin panel is password-protected via the landing page.  
Default password: `rocky123` (change in `app/page.tsx`)

## 👨‍💻 Author

**Vikram Kumawat** — Built with ❤️ for campus dining revolution.

---

**Scan. Order. Eat. Repeat.** 🍜
