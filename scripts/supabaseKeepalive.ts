/**
 * One lightweight HTTP request to your Supabase project (Auth /health).
 * Helps avoid free-tier inactivity pauses by generating daily API traffic.
 *
 * Run: npm run keepalive:supabase
 * Schedule: GitHub Actions uses secret SUPABASE_PROJECT_REF only (see workflow file), or cron / UptimeRobot.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL (same as the app; no secret keys required).
 */

import { config } from "dotenv";

config({ path: ".env.local" });
config();

const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
const url = raw?.replace(/\/$/, "");
if (!url) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const target = `${url}/auth/v1/health`;
const res = await fetch(target, { method: "GET" });
const body = await res.text();

if (!res.ok) {
  console.error(`Keepalive failed: ${res.status} ${res.statusText}\n${body}`);
  process.exit(1);
}

console.log("Supabase keepalive OK:", body);
