import { ArrowRight, Check, Flame, Quote, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Question } from "@/lib/study-types";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuizPlayer({
  questions,
  onFinish,
}: {
  questions: Question[];
  onFinish: (answers: Record<string, number>) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);

  const q = questions[index];
  const chosen = q ? answers[q.id] : undefined;
  const answered = chosen !== undefined;
  const isCorrect = answered && chosen === q?.correctIndex;
  const correctSoFar = questions.filter((x) => answers[x.id] === x.correctIndex).length;
  const isLast = index === questions.length - 1;

  const choose = useCallback(
    (i: number) => {
      if (!q || answered || i >= q.options.length) return;
      setAnswers((a) => ({ ...a, [q.id]: i }));
      setStreak((s) => (i === q.correctIndex ? s + 1 : 0));
    },
    [q, answered],
  );

  const next = useCallback(() => {
    if (!answered) return;
    if (isLast) onFinish(answers);
    else setIndex((i) => i + 1);
  }, [answered, isLast, onFinish, answers]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const num = Number(k);
      if (num >= 1 && num <= 6) choose(num - 1);
      else if (k.length === 1 && LETTERS.map((l) => l.toLowerCase()).includes(k)) choose(LETTERS.indexOf(k.toUpperCase()));
      else if (e.key === "Enter" || e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, next]);

  if (!q) return null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress */}
      <div className="mb-6 flex items-center gap-4">
        <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-card">
          <div
            className="h-full bg-highlight transition-all duration-500"
            style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
        <span className="font-mono text-sm font-medium tabular-nums">
          {index + 1}/{questions.length}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-0.5 font-mono text-sm font-semibold tabular-nums transition-colors",
            streak >= 3 ? "bg-highlight" : "bg-card",
          )}
          title="Answer streak"
        >
          <Flame className={cn("size-4", streak >= 3 && "fill-current")} />
          {streak}
        </span>
      </div>

      <div key={q.id} className="surface-ink p-6 animate-rise sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-md border-2 border-ink bg-muted px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider">
            {q.topic}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {q.difficulty}
          </span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            {correctSoFar} correct
          </span>
        </div>
        <h2 className="text-xl font-bold leading-snug sm:text-2xl">{q.question}</h2>

        <div className="mt-6 grid gap-3">
          {q.options.map((opt, i) => {
            const isChosen = chosen === i;
            const isAnswer = i === q.correctIndex;
            return (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => choose(i)}
                className={cn(
                  "group flex items-start gap-4 rounded-xl border-2 border-ink px-4 py-3.5 text-left transition-all",
                  !answered && "bg-card shadow-ink-sm press-ink hover:bg-highlight-soft",
                  answered && isAnswer && "bg-success-soft animate-pop",
                  answered && isChosen && !isAnswer && "bg-destructive-soft animate-shake",
                  answered && !isChosen && !isAnswer && "bg-card opacity-55",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md border-2 border-ink font-mono text-sm font-bold",
                    answered && isAnswer ? "bg-success text-success-foreground" : "",
                    answered && isChosen && !isAnswer ? "bg-destructive text-destructive-foreground" : "",
                    !answered && "bg-muted group-hover:bg-highlight",
                  )}
                >
                  {answered && isAnswer ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : answered && isChosen ? (
                    <X className="size-4" strokeWidth={3} />
                  ) : (
                    LETTERS[i]
                  )}
                </span>
                <span className="pt-0.5 text-[15px] leading-relaxed">{opt}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={cn(
              "mt-6 rounded-xl border-2 border-ink p-5 animate-rise",
              isCorrect ? "bg-success-soft" : "bg-destructive-soft",
            )}
          >
            <p className="font-display text-lg font-extrabold">
              {isCorrect ? (streak >= 3 ? `Correct — ${streak} in a row!` : "Correct!") : "Not quite."}
            </p>
            <p className="mt-1.5 leading-relaxed">{q.explanation}</p>
            {q.sourceQuote && (
              <blockquote className="mt-4 flex gap-2.5 rounded-lg border-l-4 border-ink bg-card/70 px-3 py-2.5 text-sm">
                <Quote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    From your notes
                  </span>
                  <span className="italic">“{q.sourceQuote}”</span>
                </span>
              </blockquote>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="hidden font-mono text-xs text-muted-foreground sm:block">
          Keys: 1–4 or A–D to answer · Enter for next
        </p>
        <Button variant="ink" size="lg" className="ml-auto h-12" disabled={!answered} onClick={next}>
          {isLast ? "See results" : "Next question"}
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
