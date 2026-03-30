"use client";

import { forwardRef, useCallback } from "react";

/** Last digit 1–9 from keyboard or mobile keypad input. */
export function parseLastSudokuDigit(value: string): number | null {
  const digits = value.match(/[1-9]/g);
  if (!digits?.length) return null;
  return parseInt(digits[digits.length - 1]!, 10);
}

/**
 * When also using window "keydown" for desktop, skip if the digit capture field is focused
 * (it already handles the key via onInput) or if the user is typing in another text field.
 */
export function shouldIgnoreGlobalSudokuDigitKey(
  e: KeyboardEvent,
  digitCaptureEl: HTMLInputElement | null
): boolean {
  const target = e.target;
  if (!(target instanceof Node)) return true;
  if (digitCaptureEl && target === digitCaptureEl) return true;

  const field = target instanceof Element ? target.closest("input, textarea, select") : null;
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) return true;
  if (field instanceof HTMLInputElement && field !== digitCaptureEl) {
    const t = field.type;
    if (
      t === "text" ||
      t === "search" ||
      t === "email" ||
      t === "tel" ||
      t === "url" ||
      t === "password" ||
      t === "number"
    ) {
      return true;
    }
  }
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  return false;
}

type DigitCaptureInputProps = {
  onDigit: (digit: number) => void;
  disabled?: boolean;
};

/**
 * Hidden field focused after the user taps a cell so mobile OS numeric keyboards appear.
 * Desktop typing goes here when this input is focused.
 */
export const DigitCaptureInput = forwardRef<HTMLInputElement, DigitCaptureInputProps>(
  function DigitCaptureInput({ onDigit, disabled }, ref) {
    const handleInput = useCallback(
      (e: React.FormEvent<HTMLInputElement>) => {
        const el = e.currentTarget;
        const d = parseLastSudokuDigit(el.value);
        el.value = "";
        if (d != null) onDigit(d);
      },
      [onDigit]
    );

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[1-9]*"
        enterKeyHint="done"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        aria-label="Enter Sudoku digit 1–9"
        className="pointer-events-none fixed left-[-9999px] top-0 z-[5] h-11 w-40 border-0 p-0 text-base opacity-0 outline-none"
        onInput={handleInput}
      />
    );
  }
);
