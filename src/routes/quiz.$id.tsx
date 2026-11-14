import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

import { DeckLoading, DeckMissing } from "@/components/pdflash/DeckStates";
import { QuizPlayer } from "@/components/pdflash/QuizPlayer";
import { QuizResults } from "@/components/pdflash/QuizResults";
import { SiteHeader } from "@/components/pdflash/SiteChrome";
import { recordAttempt } from "@/lib/deck-store";
import { shuffleOptions } from "@/lib/study-logic";
import type { Deck, Question } from "@/lib/study-types";
import { useClientDeck } from "@/lib/use-client-deck";

const searchSchema = z.object({
  mode: z.enum(["all", "missed"]).catch("all"),
});

export const Route = createFileRoute("/quiz/$id")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Practice test — PDFlash" },
      { name: "description", content: "Answer multiple-choice questions from your notes with instant explanations." },
      { property: "og:title", content: "Practice test — PDFlash" },
      { property: "og:description", content: "Multiple-choice practice test generated from your notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const { id } = Route.useParams();
  const { hydrated, deck } = useClientDeck(id);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {!hydrated ? <DeckLoading /> : !deck ? <DeckMissing /> : <QuizSession deck={deck} />}
    </div>
  );
}

function QuizSession({ deck }: { deck: Deck }) {
  const { mode } = Route.useSearch();
  const [session, setSession] = useState<{ key: number; questions: Question[] } | null>(null);
  const [answers, setAnswers] = useState<Record<string, number> | null>(null);

  const start = useCallback((qs: Question[]) => {
    setAnswers(null);
    setSession((s) => ({ key: (s?.key ?? 0) + 1, questions: qs.map((q) => shuffleOptions(q)) }));
    window.scrollTo({ top: 0 });
  }, []);

  // Build the first session once the deck is available.
  useEffect(() => {
    if (session) return;
    const missed = new Set(deck.attempts.at(-1)?.missedIds ?? []);
    const pool = mode === "missed" && missed.size > 0 ? deck.questions.filter((q) => missed.has(q.id)) : deck.questions;
    start(pool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = (a: Record<string, number>) => {
    if (!session) return;
    const missedIds = session.questions.filter((q) => a[q.id] !== q.correctIndex).map((q) => q.id);
    recordAttempt(deck.id, {
      at: Date.now(),
      correct: session.questions.length - missedIds.length,
      total: session.questions.length,
      missedIds,
    });
    setAnswers(a);
    window.scrollTo({ top: 0 });
  };

  if (!session) return <DeckLoading />;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between gap-4">
        <Link
          to="/deck/$id"
          params={{ id: deck.id }}
          className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4 shrink-0" />
          <span className="truncate">{deck.title}</span>
        </Link>
        {mode === "missed" && !answers && (
          <span className="shrink-0 rounded-full border-2 border-ink bg-destructive-soft px-2.5 py-0.5 font-mono text-xs">
            Missed only
          </span>
        )}
      </div>

      {answers ? (
        <QuizResults
          deckId={deck.id}
          questions={session.questions}
          answers={answers}
          onRetakeAll={() => start(deck.questions)}
          onRetryMissed={() => start(session.questions.filter((q) => answers[q.id] !== q.correctIndex))}
        />
      ) : (
        <QuizPlayer key={session.key} questions={session.questions} onFinish={finish} />
      )}
    </section>
  );
}
