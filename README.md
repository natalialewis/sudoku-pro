# Sudoku Pro

Sudoku Pro is a web app for learning **classic Sudoku solving strategies**—not just playing puzzles, but understanding *why* moves work. It combines short lessons, guided practice on small “mini” boards, and full puzzles with hints and feedback.

**Live app:** [sudoku-pro-tutor.vercel.app](https://sudoku-pro-tutor.vercel.app)

## What it does

- **Strategies** — Read about techniques like naked singles, hidden singles, and pairs, with examples geared toward real solving.

- **Tutor** — You answer questions and fill cells on bite-sized boards. The tutor tries to **adapt to you**: it keeps a simple model of how well you know each strategy and tends to give you more practice where you need it. That idea comes from **intelligent tutoring systems** in education: treat each skill as something you might or might not “know yet,” update those beliefs when you get things right or wrong, and use that to pick what to practice next. You don’t chat with a language model here—the “smart” part is this **structured, personalized sequencing**, similar in spirit to how many learning apps personalize drills.

- **Play** — Solve full puzzles from a database, with optional notes, tiered hints, and messages that tie mistakes back to strategies when possible. If you’re logged in, light updates can feed the same kind of mastery tracking as the tutor (so play and practice can reinforce each other).

- **Accounts** — Signing up lets your progress and tutor stats persist in the database (via Supabase).

## How to run it locally

You’ll need **Node.js** (a recent LTS version is fine) and a **Supabase** project for auth and data.

1. **Clone the repo** and install dependencies:

   ```bash
   npm install
   ```

2. **Environment variables** — Copy the example env file and fill in your Supabase project values (from the Supabase dashboard under **Project Settings → API**):

   ```bash
   cp .env.example .env.local
   ```

   Set at least `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

3. **Database (declarative schema)** — Table and policy definitions live as **declarative SQL** under [`supabase/schemas/`](supabase/schemas/) (for example profiles, boards, BKT probabilities, storage). The repo also keeps matching migrations under `supabase/migrations/`. Apply them to your Supabase database with the [Supabase CLI](https://supabase.com/docs/guides/cli): install the CLI, run `supabase login`, then `supabase link --project-ref <your-project-ref>` and **`supabase db push`** so your remote database matches this project.

4. **Seed the database** — Play and tutor load puzzles from the `boards` table. After the schema is applied, you **need** to populate boards:

   ```bash
   npm run seed:boards
   ```

   Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` for this script (from **Project Settings → API** in Supabase). Keep that key secret and never use it in browser code.

5. **Start the dev server**:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Production build** (optional check):

   ```bash
   npm run build
   npm start
   ```

---

Sudoku Pro is built with **Next.js**, **React**, **Tailwind CSS**, and **Supabase** (authentication and Postgres). The adaptive tutor behavior uses a small **Bayesian Knowledge Tracing**-style model— a classic way to approximate “do they know this skill?” from a stream of correct and incorrect answers—so practice feels more tailored than a fixed, random quiz order, without relying on generative AI.
