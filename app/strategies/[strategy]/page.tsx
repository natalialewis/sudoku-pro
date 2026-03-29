import Link from "next/link";
import { notFound } from "next/navigation";
import { NakedSinglePage } from "../components/NakedSinglePage";
import { HiddenSinglePage } from "../components/HiddenSinglePage";
import { NakedPairPage } from "../components/NakedPairPage";
import { HiddenPairPage } from "../components/HiddenPairPage";
import { STRATEGY_LABELS } from "@/lib/sudoku";
import type { Strategy } from "@/lib/sudoku/types";

const VALID_STRATEGIES = ["naked_single", "hidden_single", "naked_pair", "hidden_pair"] as const;

// Define page component mapping
type Props = { params: Promise<{ strategy: string }> };
function StrategyContent({ slug }: { slug: string }) {
  if (slug === "naked_single") return <NakedSinglePage />;
  if (slug === "hidden_single") return <HiddenSinglePage />;
  if (slug === "naked_pair") return <NakedPairPage />;
  if (slug === "hidden_pair") return <HiddenPairPage />;
  return null;
}

// Main page component
export default async function StrategyPage({ params }: Props) {
  const { strategy: slug } = await params;

  // Validate strategy slug
  if (!VALID_STRATEGIES.includes(slug as (typeof VALID_STRATEGIES)[number])) {
    notFound();
  }

  const name = STRATEGY_LABELS[slug as Strategy];

  return (
    <div className="min-h-full bg-background px-4 py-6 sm:px-6 md:py-8">
      <main className="mx-auto max-w-2xl">
        <div className="mb-4 sm:mb-6">
          <Link
            href="/strategies"
            className="flex items-center gap-2 rounded-lg px-2 py-2 w-fit text-primary hover:bg-primary-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Back to strategies"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm font-medium sm:text-base">Back</span>
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{name}</h1>
        <div className="mt-6">
          <StrategyContent slug={slug} />
        </div>
      </main>
    </div>
  );
}
