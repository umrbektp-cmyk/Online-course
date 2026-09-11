# Ingliz Tili Kursi — deploy

Same workflow as your Premier CRM (GitHub → Netlify → Supabase env vars).

## 1. Supabase (security)
- Open your "Online COURSE" project → SQL Editor → paste **SECURITY_SETUP.sql** → Run.
- Create your admin login: Authentication → Users → **Add user** (email + password). This is what you'll log into the admin panel with.

## 2. Push to GitHub
- New repo → push these files (or drag-upload, like the bot).

## 3. Netlify
- New site from the repo. Build settings auto-detected from `netlify.toml`.
- Site settings → Environment variables → add:
  - `VITE_SUPABASE_URL` = https://ttiwswflzeltmefnxtbs.supabase.co
  - `VITE_SUPABASE_ANON_KEY` = (your anon key)
- Deploy.

## 4. Videos (later)
- Set `BUNNY_LIBRARY_ID` and each lesson's `bunny` id in `src/App.jsx`.
- In Bunny: lock library to your Netlify domain + turn on MediaCage Basic.

## Test after deploy
1. Sign up as a fake student.
2. Log into admin (your Supabase Auth email) → approve them.
3. Log in as the student → device locks.

Notes:
- Students can't read the table — only the two functions (signup/login).
- Admin actions require a real login. No password in the code.
