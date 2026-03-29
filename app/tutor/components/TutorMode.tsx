"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useBKT } from "@/lib/bkt/hooks";
import { pickNextKC, shouldShowIntro, TUTOR_STRATEGIES } from "@/lib/tutor/selection";
import { fetchRandomMiniBoard } from "@/lib/boards";
import type { Strategy } from "@/lib/sudoku/types";
import type { NotesGrid } from "@/components/ui/StaticBoard";
import { IntroSlide } from "./IntroSlide";
import { SolveCellQuestion } from "./SolveCellQuestion";
import { SolvePairCellsQuestion } from "./SolvePairCellsQuestion";
import {
  MultipleChoiceQuestion,
  SINGLE_STRATEGY_OPTIONS,
  PAIR_STRATEGY_OPTIONS,
} from "./MultipleChoiceQuestion";

type QuestionType = "solve" | "multiple_choice";

const STRATEGY_DISPLAY: Record<Strategy, string> = {
  naked_single: "Naked Single",
  hidden_single: "Hidden Single",
  naked_pair: "Naked Pair",
  hidden_pair: "Hidden Pair",
};

type MiniBoardState =
  | {
      kind: "single";
      initial: number[][];
      answerRow: number;
      answerCol: number;
      correctValue: number;
      strategy: Strategy;
    }
  | {
      kind: "pair";
      initial: number[][];
      initialNotes: NotesGrid;
      answerCells: [{ row: number; col: number }, { row: number; col: number }];
      digits: [number, number];
      strategy: Strategy;
    };

export function TutorMode() {
  const { probabilities, loading, getMastery, recordObservation } = useBKT();
  const [introStep, setIntroStep] = useState(0);
  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  const [currentKC, setCurrentKC] = useState<Strategy | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType>("solve");
  const [miniBoard, setMiniBoard] = useState<MiniBoardState | null>(null);
  const [advanceKey, setAdvanceKey] = useState(0);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const tutorBootstrapRef = useRef(false);

  const loadNextQuestion = useCallback(async () => {
    setQuestionLoading(true);
    setQuestionError(null);
    try {
      const kc = pickNextKC(probabilities ?? []);
      const mastery = getMastery(kc);
      const level = Math.max(1, Math.min(10, 1 + Math.floor(mastery * 9)));
      const row = await fetchRandomMiniBoard(kc, level);

      setCurrentKC(kc);
      if (row.answer.kind === "single") {
        setMiniBoard({
          kind: "single",
          initial: row.initial.map((r) => [...r]),
          answerRow: row.answer.row,
          answerCol: row.answer.col,
          correctValue: row.answer.value,
          strategy: kc,
        });
      } else {
        const notes = row.initialNotes;
        if (!notes) {
          throw new Error("Pair mini board in database is missing initial_notes");
        }
        setMiniBoard({
          kind: "pair",
          initial: row.initial.map((r) => [...r]),
          initialNotes: notes,
          answerCells: row.answer.cells,
          digits: row.answer.digits,
          strategy: kc,
        });
      }

      setQuestionType(Math.random() < 0.5 ? "solve" : "multiple_choice");
      setAdvanceKey((k) => k + 1);
    } catch (e) {
      setMiniBoard(null);
      setCurrentKC(null);
      setQuestionError(e instanceof Error ? e.message : String(e));
    } finally {
      setQuestionLoading(false);
    }
  }, [probabilities, getMastery]);

  useEffect(() => {
    if (loading || probabilities === null) return;
    setShowIntro(shouldShowIntro(probabilities, getMastery));
  }, [loading, probabilities, getMastery]);

  useEffect(() => {
    if (showIntro !== false || probabilities == null || tutorBootstrapRef.current) return;
    tutorBootstrapRef.current = true;
    void loadNextQuestion();
  }, [showIntro, probabilities, loadNextQuestion]);

  const handleIntroNext = () => {
    if (introStep < TUTOR_STRATEGIES.length - 1) {
      setIntroStep((s) => s + 1);
    } else {
      if (typeof window !== "undefined") localStorage.setItem("tutor-intro-done", "true");
      setShowIntro(false);
      setIntroStep(0);
    }
  };

  const handleResult = useCallback(
    async (correct: boolean) => {
      if (!currentKC) return;
      try {
        await recordObservation(currentKC, correct);
      } catch {
        // ignore
      }
    },
    [currentKC, recordObservation]
  );

  const handleAdvance = useCallback(() => {
    void loadNextQuestion();
  }, [loadNextQuestion]);

  const handleSolveResult = useCallback(
    (correct: boolean) => {
      handleResult(correct);
    },
    [handleResult]
  );

  if (loading && showIntro === null) {
    return (
      <div className="mt-6 py-8 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (showIntro === false && questionError) {
    return (
      <div className="mt-6 space-y-3 rounded-lg border border-destructive/50 bg-card p-4">
        <p className="text-sm text-destructive" role="alert">
          {questionError}
        </p>
        <button
          type="button"
          onClick={() => void loadNextQuestion()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Retry
        </button>
      </div>
    );
  }

  if (showIntro) {
    const strategy = TUTOR_STRATEGIES[introStep];
    if (!strategy) return null;
    return (
      <div className="mt-6">
        <IntroSlide strategy={strategy} onNext={handleIntroNext} />
      </div>
    );
  }

  if (!miniBoard || !currentKC || questionLoading) {
    return (
      <div className="mt-6 py-8 text-center text-muted-foreground">
        Loading question…
      </div>
    );
  }

  if (questionType === "solve") {
    const practiceLabel = STRATEGY_DISPLAY[currentKC];
    if (miniBoard.kind === "single") {
      return (
        <div className="mt-6 space-y-4">
          <p className="text-sm font-medium text-foreground">Practice: {practiceLabel}</p>
          <SolveCellQuestion
            key={advanceKey}
            initial={miniBoard.initial}
            answerRow={miniBoard.answerRow}
            answerCol={miniBoard.answerCol}
            correctValue={miniBoard.correctValue}
            strategy={miniBoard.strategy}
            onResult={handleSolveResult}
            onAdvance={handleAdvance}
          />
        </div>
      );
    }

    return (
      <div className="mt-6 space-y-4">
        <p className="text-sm font-medium text-foreground">Practice: {practiceLabel}</p>
        <SolvePairCellsQuestion
          key={advanceKey}
          initial={miniBoard.initial}
          notes={miniBoard.initialNotes}
          answerCells={miniBoard.answerCells}
          strategyLabel={STRATEGY_DISPLAY[miniBoard.strategy]}
          onResult={handleSolveResult}
          onAdvance={handleAdvance}
        />
      </div>
    );
  }

  if (miniBoard.kind === "single") {
    return (
      <div className="mt-6 space-y-4">
        <MultipleChoiceQuestion
          key={advanceKey}
          board={miniBoard.initial}
          answerRow={miniBoard.answerRow}
          answerCol={miniBoard.answerCol}
          options={SINGLE_STRATEGY_OPTIONS}
          correctStrategy={miniBoard.strategy}
          onResult={handleResult}
          onAdvance={handleAdvance}
        />
      </div>
    );
  }

  const pairCells = miniBoard.answerCells.map((c) => ({ row: c.row, col: c.col }));
  const strongPairDigits = miniBoard.answerCells.map((c) => ({
    row: c.row,
    col: c.col,
    digits: miniBoard.digits,
  }));

  return (
    <div className="mt-6 space-y-4">
      <MultipleChoiceQuestion
        key={advanceKey}
        board={miniBoard.initial}
        notes={miniBoard.initialNotes}
        pairCells={pairCells}
        strongPairDigits={strongPairDigits}
        options={PAIR_STRATEGY_OPTIONS}
        correctStrategy={miniBoard.strategy}
        onResult={handleResult}
        onAdvance={handleAdvance}
      />
    </div>
  );
}
