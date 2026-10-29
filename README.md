# MedRoster — O&G Daily Roster & Leave Management

Web and mobile app for the **Obstetrics & Gynaecology** department.  
Built with **Next.js 15 · Supabase · Tailwind CSS · Vercel**.

---

## Quick Start

### 1. Install Node.js
Download the LTS version from https://nodejs.org (v20 or later).  
After installing, open a terminal and verify: `node -v` and `npm -v`.

### 2. Install dependencies
```bash
cd "C:\Users\aisha\web app\medroster"
npm install
```

### 3. Set up Supabase
1. Go to https://supabase.com → Create a new project
2. In **SQL Editor**, run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
3. In **Storage**, create a bucket named `leave-evidence` (private)
4. Copy your project URL and anon key from **Project Settings → API**

### 4. Configure environment variables
```bash
cp .env.local.example .env.local
# Edit .env.local and fill in your Supabase URL and keys
```

### 5. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

### 6. Create the first Superadmin user
1. Go to your Supabase dashboard → Authentication → Users → Add user
2. Create the user with email + password
3. In SQL Editor, run:
```sql
insert into public.profiles (id, full_name, staff_id, email, role)
values (
  '<paste-user-id-from-auth>',
  'Dr. Your Name',
  'MO001',
  'your@email.com',
  'superadmin'
);
```

---

## Deploy to Vercel

### Via GitHub (recommended)
1. Push this folder to a new GitHub repository
2. Go to https://vercel.com → New Project → Import from GitHub
3. Set the **Root Directory** to `medroster` (or the repo root if you committed there)
4. Add environment variables from `.env.local` in Vercel's project settings
5. Click **Deploy**

Every `git push` to `main` triggers an automatic redeploy.

---

## Project Structure

```
medroster/
├── src/
│   ├── app/
│   │   ├── (auth)/login/          # Login page
│   │   └── (dashboard)/
│   │       ├── layout.tsx         # Sidebar + mobile nav
│   │       ├── roster/            # Weekly roster view
│   │       ├── leave/             # My leave + apply form
│   │       ├── admin/leaves/      # Admin approval queue
│   │       ├── admin/officers/    # Officer management
│   │       └── profile/           # User profile
│   ├── components/
│   │   ├── layout/                # Sidebar, mobile nav
│   │   ├── roster/                # Roster components
│   │   └── leave/                 # Leave components
│   ├── lib/
│   │   ├── supabase/              # Client + server Supabase helpers
│   │   ├── types.ts               # TypeScript types
│   │   └── constants.ts           # Leave rules, location data
│   └── middleware.ts              # Auth middleware
├── supabase/migrations/           # SQL schema + RLS policies
├── public/                        # PWA manifest + icons
├── .env.local.example             # Environment variable template
└── README.md
```

---

## Key Features Implemented

| Feature | Status |
|---|---|
| Login / session | ✅ |
| Role-based access (Superadmin / Admin / User) | ✅ |
| Weekly roster calendar view | ✅ |
| Leave application form with evidence upload | ✅ |
| Leave balance tracking | ✅ |
| Monthly quota validation (2/4 days, course rule) | ✅ |
| Advance notice enforcement (2–3 months) | ✅ |
| Admin approval / rejection with email trigger | ✅ |
| Audit log (immutable) | ✅ |
| Mobile-responsive + PWA manifest | ✅ |
| Clock-in with location | 🔜 Phase 2 |
| MIA auto-flag | 🔜 Phase 2 |
| Email notifications via Resend | 🔜 Phase 3 |
| Analytics & reports | 🔜 Phase 4 |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| File storage | Supabase Storage |
| Email | Resend + React Email |
| Deployment | Vercel (GitHub auto-deploy) |
| Icons | Lucide React |

---

*Obstetrics & Gynaecology Department · MedRoster v0.1*
