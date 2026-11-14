import { Link } from "@tanstack/react-router";
import { Check, Layers, RotateCcw, Target, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { gradeLabel, percent, topicBreakdown } from "@/lib/study-logic";
import type { Question } from "@/lib/study-types";
import { cn } from "@/lib/utils";

export function ScoreRing({ pct, size = 160 }: { pct: number; size?: number }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className={cn(
            "transition-[stroke-dashoffset] duration-1000",
            pct >= 75 ? "stroke-success" : pct >= 50 ? "stroke-highlight" : "stroke-destructive",
          )}
        />
        <circle cx={size / 2} cy={size / 2} r={r + stroke / 2} fill="none" strokeWidth={2} className="stroke-ink" />
        <circle cx={size / 2} cy={size / 2} r={r - stroke / 2} fill="none" strokeWidth={2} className="stroke-ink" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-extrabold tabular-nums">{pct}%</span>
      </div>
    </div>
  );
}

export function QuizResults({
  deckId,
  questions,
  answers,
  onRetakeAll,
  onRetryMissed,
}: {
  deckId: string;
  questions: Question[];
  answers: Record<string, number>;
  onRetakeAll: () => void;
  onRetryMissed: () => void;
}) {
  const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const pct = percent(correct, questions.length);
  const missed = questions.filter((q) => answers[q.id] !== q.correctIndex);
  const topics = topicBreakdown(questions, answers);

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-rise">
      <div className="surface-ink flex flex-col items-center gap-8 p-8 sm:flex-row">
        <ScoreRing pct={pct} />
        <div className="text-center sm:text-left">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Your result</p>
          <h2 className="mt-1 text-4xl font-extrabold">
            <span className="mark-highlight">{gradeLabel(pct)}</span>
          </h2>
          <p className="mt-2 text-muted-foreground">
            {correct} of {questions.length} correct
            {missed.length > 0 ? ` · ${missed.length} to review` : " · flawless run"}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
            {missed.length > 0 && (
              <Button variant="highlight" onClick={onRetryMissed}>
                <Target />
                Retry {missed.length} missed
              </Button>
            )}
            <Button variant="paper" onClick={onRetakeAll}>
              <RotateCcw />
              Retake all
            </Button>
            <Button asChild variant="paper">
              <Link to="/cards/$id" params={{ id: deckId }}>
                <Layers />
                Flashcards
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {topics.length > 1 && (
        <section>
          <h3 className="mb-3 text-xl font-bold">By topic</h3>
          <div className="surface-ink divide-y-2 divide-ink/10 p-2">
            {topics.map((t) => {
              const p = percent(t.correct, t.total);
              return (
                <div key={t.topic} className="flex items-center gap-4 px-3 py-3">
                  <span className="w-40 shrink-0 truncate text-sm font-semibold sm:w-56">{t.topic}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full border border-ink bg-muted">
                    <div
                      className={cn(
                        "h-full",
                        p >= 75 ? "bg-success" : p >= 50 ? "bg-highlight" : "bg-destructive",
                      )}
                      style={{ width: `${Math.max(p, 4)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-sm tabular-nums">
                    {t.correct}/{t.total}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-xl font-bold">Review</h3>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const ok = answers[q.id] === q.correctIndex;
            const picked = answers[q.id];
            return (
              <details key={q.id} className="group rounded-xl border-2 border-ink bg-card" open={!ok && i < 3}>
                <summary className="flex cursor-pointer list-none items-start gap-3 p-4">
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border-2 border-ink",
                      ok ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground",
                    )}
                  >
                    {ok ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className="flex-1 font-medium">{q.question}</span>
                </summary>
                <div className="space-y-2 border-t-2 border-ink/10 px-4 pb-4 pt-3 text-sm">
                  {!ok && picked !== undefined && (
                    <p>
                      <span className="font-semibold text-destructive">Your answer:</span> {q.options[picked]}
                    </p>
                  )}
                  <p>
                    <span className="font-semibold text-success">Correct:</span> {q.options[q.correctIndex]}
                  </p>
                  <p className="leading-relaxed text-muted-foreground">{q.explanation}</p>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
