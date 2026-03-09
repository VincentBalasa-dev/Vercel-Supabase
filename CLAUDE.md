# LevelUp — Claude Context

## Project Overview
Personal productivity web app. Track daily habits, chores, workouts, nutrition, and finances — all in one place. Dark-themed, mobile-first, responsive.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Vite 7, TailwindCSS 4 |
| Icons | lucide-react |
| Backend | Express 4, Node.js |
| Auth | Supabase Auth (JWT via `supabase.auth.getUser`) |
| Database | Supabase (cloud PostgreSQL) |
| Deployment | Hostinger VPS + subdomain, Docker + Nginx |

---

## Repository Layout

```
LevelUp/
├── src/
│   ├── App.jsx                  ← router, RequireAuth
│   ├── pages/                   ← Dashboard, Habits, Workout, Diet, Finance, Login
│   ├── components/
│   │   ├── Layout.jsx           ← Sidebar (desktop) + BottomNav (mobile)
│   │   ├── BottomNav.jsx        ← mobile tab bar with center FAB
│   │   ├── Sidebar.jsx          ← desktop sidebar
│   │   └── ui/                  ← Card, ProgressBar, CircularProgress
│   ├── context/AuthContext.jsx  ← Supabase auth state
│   ├── hooks/useIsMobile.js     ← 768px breakpoint
│   ├── lib/
│   │   ├── utils.js             ← cn(), formatDate, formatCurrency, today()
│   │   └── supabase.js          ← Supabase client (frontend)
│   └── services/api.js          ← fetch wrapper (attaches Supabase JWT)
├── server/
│   ├── index.js                 ← Express setup
│   ├── supabase.js              ← Supabase service role client (backend)
│   ├── middleware/auth.js       ← verifies Supabase JWT → req.user
│   └── routes/
│       ├── habits.js            ← /api/habits
│       ├── workout.js           ← /api/workout
│       ├── diet.js              ← /api/diet
│       └── finance.js           ← /api/finance
├── supabase-schema.sql          ← run once in Supabase SQL Editor
├── .env.example                 ← env variable template
└── CLAUDE.md
```

---

## Design

- **Theme**: Dark (`#0d1117` bg, `#161b22` cards, `#30363d` borders)
- **Accent**: Blue (`blue-500` / `#3b82f6`)
- **Layout**: BottomNav on mobile, Sidebar on desktop (768px breakpoint)
- **Cards**: `rounded-2xl`, `p-4`, bg `#161b22`
- **Modals**: Bottom sheet style (slide up from bottom)

---

## Key Conventions

### Frontend
- No TypeScript — pure JSX
- All API calls via `src/services/api.js` — never fetch directly in pages
- `cn()` from `lib/utils.js` for conditional classnames
- Currency in **PHP** (Philippine Peso)
- Supabase client in `src/lib/supabase.js` — never create new instances

### Backend
- All routes: `async/await` with `try/catch` → `res.status(500).json({ error })`
- `req.user` = Supabase user object (from `supabase.auth.getUser(token)`)
- Supabase service role client in `server/supabase.js` — singleton, never recreate
- All routes prefixed `/api`, all protected with `requireAuth`

---

## Features

| Feature | Routes |
|---------|--------|
| Habits | GET /api/habits/today, POST /api/habits/toggle |
| Workout | GET /week, /latest, /recent — POST /session |
| Diet | GET /logs, /summary, /goals — POST /log — PUT /goals — DELETE /log/:id |
| Finance | GET /entries, /summary — POST /entry — DELETE /entry/:id |

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (frontend) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (frontend) |
| `SUPABASE_URL` | Supabase project URL (server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — never commit |
| `PORT` | Express port (default 3001) |
| `CLIENT_ORIGIN` | CORS origin (frontend URL) |
