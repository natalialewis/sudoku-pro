import { getUser } from "@/lib/auth";
import { LoginBanner } from "./components/LoginBanner";
import { PlayGame } from "./components/PlayGame";

export default async function PlayPage() {
  // Check if the user is authenticated
  const user = await getUser();

  return (
    <div className="min-h-full bg-background px-4 py-6 sm:px-6 md:py-8">
      <main className="mx-auto max-w-2xl">
        {/* If the user is not logged in, show the login banner. They are not required to be logged in to play, but we encourage them to log in to help us improve the tutor mode. */}
        {!user && <LoginBanner />}
        <h1 className="text-2xl font-semibold text-foreground">Play</h1>
        <p className="mt-2 text-muted-foreground">
          Play full Sudoku puzzles. Choose a difficulty, get hints, and practice the strategies you have learned in a real game!
        </p>
        <PlayGame isLoggedIn={!!user} />
      </main>
    </div>
  );
}
