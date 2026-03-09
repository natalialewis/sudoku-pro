import Link from "next/link";
import { getUser } from "@/lib/auth";
import { TutorMode } from "./components/TutorMode";

export default async function TutorPage() {
  const user = await getUser();

  return (
    <div className="min-h-full bg-background px-4 py-6 sm:px-6 md:py-8">
      <main className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-foreground">Tutor</h1>
        {!user ? (
          <>
            <div className="mt-4 rounded-lg border border-border bg-muted/50 px-4 py-4 text-foreground">
              <p className="font-medium">Please sign in so we can track what you know!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This helps us teach you better and pick the right problems for you.
              </p>
              <div className="mt-4 flex gap-3">
                <Link
                  href="/login"
                  className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-muted-foreground">
              Practice with adaptive mini-board problems. The tutor will pick problems based on your mastery of each strategy.
            </p>
            <TutorMode />
          </>
        )}
      </main>
    </div>
  );
}
