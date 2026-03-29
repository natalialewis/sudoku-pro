import Link from "next/link";
import { getUser } from "@/lib/auth";

function formatGreetingName(raw: string | undefined | null): string {
  const s = (typeof raw === "string" ? raw.trim() : "") || "back";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default async function HomePage() {
  const user = await getUser();

  return (
    <div className="min-h-full bg-background px-4 py-8 sm:py-10 md:py-12">
      <main className="mx-auto w-full max-w-2xl text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Welcome{user ? `, ${formatGreetingName(user.user_metadata?.first_name)}` : ""}!
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:mt-6 sm:text-lg">
          Sudoku Pro helps you learn and practice logical solving strategies.
        </p>
        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-3">
          <Link
            href="/strategies"
            className="rounded-lg border border-border bg-card px-4 py-5 text-left transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <span className="font-medium text-foreground">Strategies</span>
            <p className="mt-1 text-sm text-muted-foreground">
              Learn naked single, hidden single, pairs, and more.
            </p>
          </Link>
          <Link
            href="/tutor"
            className="rounded-lg border border-border bg-card px-4 py-5 text-left transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <span className="font-medium text-foreground">Tutor</span>
            <p className="mt-1 text-sm text-muted-foreground">
              Adaptive practice with mini-board problems.
            </p>
          </Link>
          <Link
            href="/play"
            className="rounded-lg border border-border bg-card px-4 py-5 text-left transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <span className="font-medium text-foreground">Play</span>
            <p className="mt-1 text-sm text-muted-foreground">
              Solve full puzzles with hints and strategy feedback.
            </p>
          </Link>
        </div>
        {!user && (
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Sign up
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
