# Detrades Team Journal

Web-based Trading Journal & Performance Management System untuk tim trading **Detrades**.

![Dark Mode](https://img.shields.io/badge/Theme-Dark%20Mode-171717)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)

## 🎯 Features

### Core Features
- ✅ **Trade Journal** - Catat setiap trade dengan metodologi Detrades
- ✅ **Cascading Logic** - Profiling (Reversal/Continuation) menentukan Entry Model (DNT/DCM)
- ✅ **Mandatory Screenshot** - Setiap trade wajib upload screenshot chart
- ✅ **-2R Daily Guard** - Otomatis lock trading jika kerugian harian mencapai -2R

### Mentor Features
- ✅ **God View** - Mentor dapat melihat semua trade member
- ✅ **Scoring System** - Penilaian 1-5 untuk SOP Compliance
- ✅ **Revision Request** - Minta member untuk revisi trade

### Analytics
- ✅ **Dashboard** - Overview performa dengan stats dan charts
- ✅ **Leaderboard** - Ranking tim berdasarkan Total RR
- ✅ **Session Analysis** - Perbandingan winrate London vs New York

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Charts | Recharts |
| Forms | React Hook Form + Zod |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone & Install
```bash
cd detrades-jurnal
npm install
```

### 2. Setup Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project (or use existing)
3. Go to **SQL Editor** and run the script in `supabase/setup.sql`
4. Go to **Storage** and create a bucket named `trade-images` (set to **Public**)

### 3. Configure Environment
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/             # Login page
│   ├── (dashboard)/        # Protected routes
│   │   ├── dashboard/      # Main stats
│   │   ├── journal/        # Trade list & detail
│   │   ├── leaderboard/    # Team rankings
│   │   └── settings/       # Profile settings
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Redirect to dashboard
├── components/
│   ├── ui/                 # Shadcn components
│   ├── forms/              # TradeForm, MentorReviewPanel
│   └── charts/             # Recharts components
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── types.ts            # TypeScript types & enums
│   └── utils.ts            # Utility functions
└── middleware.ts           # Auth middleware
```

## 📊 Database Schema

### Profiles Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | User ID (from auth.users) |
| username | TEXT | Display name |
| role | TEXT | 'member' or 'mentor' |

### Trades Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Trade ID |
| user_id | UUID | Owner |
| trade_date | DATE | Trading date |
| session | ENUM | 'London' / 'New York' |
| pair | ENUM | NQ, ES, YM, EU, GU, XAU |
| bias | ENUM | 'Bullish' / 'Bearish' |
| bias_daily | ENUM | DNT, DCM, DFM, DCC, DRM |
| framework | ENUM | Framework type |
| profiling | ENUM | 6AM/10AM Reversal/Continuation |
| entry_model | ENUM | Entry Model 1-3 (DNT) / 1-2 (DCM) |
| result | ENUM | 'Win' / 'Lose' |
| rr | NUMERIC | Risk Reward ratio |
| mood | ENUM | Calm, Anxious, Greedy, Fear, Bored, Revenge |
| image_url | TEXT | Screenshot URL |
| status | ENUM | 'submitted' / 'revision' |
| mentor_score | INT | 1-5 stars |
| mentor_notes | TEXT | Mentor feedback |
| is_reviewed | BOOL | Review status |

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| **Member** | Input trades, view own stats, view leaderboard, edit (only if revision) |
| **Mentor** | All member permissions + view all trades, score trades, request revisions |

### Setting User as Mentor
```sql
UPDATE profiles SET role = 'mentor' WHERE id = 'user-uuid-here';
```

## 🎨 Design System

| Element | Color |
|---------|-------|
| Background | Zinc-950 |
| Primary | Indigo-500 |
| Win | Emerald-500 |
| Loss | Rose-500 |

## 📝 Key Logic

### Cascading Entry Model
- **Reversal Profiling** → DNT Entry Models (1, 2, 3)
- **Continuation Profiling** → DCM Entry Models (1, 2)

### -2R Daily Guard
- Sum all trades for today
- If total RR ≤ -2, disable "New Trade" button
- Display cooldown alert

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
npm run build
```

## 📄 License

Private - Detrades Team Internal Use Only
