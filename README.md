# Nova — Attractive Login System with Supabase

A modern, secure login/signup system powered by Supabase (Postgres database + Auth service).
Built with plain HTML, CSS, and JavaScript — no build step required.

## Features

- Animated glassmorphism UI with login / signup tabs
- Email + password authentication handled by Supabase Auth
- Google OAuth sign-in
- Password strength meter, show/hide password, form validation
- Forgot password (email reset) support
- "Remember me" persistent session
- Session persistence across reloads
- Auto-created `profiles` table in Postgres via trigger
- Friendly, human-readable error messages

## Project structure

```
index.html    UI markup (auth card + dashboard)
styles.css    styling (responsive, dark glass design)
app.js        Supabase client logic (auth, session, validation)
config.js     Supabase credentials (fill these in)
schema.sql    SQL for the profiles table + trigger
```

## Setup

### 1. Create a Supabase project

1. Go to https://supabase.com and create a free account.
2. Create a new project and note the database password (you won't see it again).
3. Wait for the project to finish provisioning.

### 2. Get your credentials

1. In the Supabase dashboard, open **Settings -> API**.
2. Copy the **Project URL** and the **anon public** key.

### 3. Configure the app

Open `config.js` and paste your values:

```javascript
const SUPABASE_URL = "https://your-project-ref.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-public-key";
```

### 4. Create the profiles table

1. Open **SQL Editor** in the dashboard.
2. Paste the contents of `schema.sql`.
3. Click **Run**. This creates the `profiles` table, row-level security policies, and a trigger that creates a profile whenever a new user signs up.

### 5. Enable Google sign-in (optional)

1. Open **Authentication -> Providers -> Google**.
2. Enable the provider and follow the instructions to register an OAuth app with Google (you'll need a Google Cloud project and OAuth client).
3. Add your site URL and redirect URL in **Authentication -> URL Configuration** (e.g. `http://localhost:8080` and `http://localhost:8080` as redirect URL).

### 6. Serve the site

Because this uses Supabase Auth with a browser, serve it over HTTP (not `file://`). Any static server works:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Notes

- The `anon` key is safe to expose in the browser; Supabase's Row-Level Security protects your data.
- If email confirmation is enabled (default), new signups receive a confirmation link before they can sign in.
- A failed sign-in shows a friendly message instead of raw errors.
