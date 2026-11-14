import { ArrowLeft, ArrowRight, Check, PartyPopper, RotateCcw, Shuffle, Undo2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { resetCards, setCardKnown } from "@/lib/deck-store";
import { shuffle } from "@/lib/study-logic";
import type { Deck } from "@/lib/study-types";
import { cn } from "@/lib/utils";
import { Segmented } from "./Segmented";

type Filter = "all" | "learning";

export function FlashcardStudy({ deck }: { deck: Deck }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [seed, setSeed] = useState(0);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const known = useMemo(() => new Set(deck.knownCardIds), [deck.knownCardIds]);

  // Freeze the card order for a session; rebuild only on filter/shuffle changes.
  const order = useMemo(() => {
    const base = filter === "learning" ? deck.flashcards.filter((c) => !known.has(c.id)) : deck.flashcards;
    return seed === 0 ? base.map((c) => c.id) : shuffle(base.map((c) => c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, seed, deck.flashcards]);

  const cards = order.map((id) => deck.flashcards.find((c) => c.id === id)!).filter(Boolean);
  const done = index >= cards.length;
  const card = cards[index];
  const masteredCount = deck.flashcards.filter((c) => known.has(c.id)).length;

  const go = useCallback(
    (delta: number) => {
      setFlipped(false);
      setIndex((i) => Math.max(0, Math.min(cards.length, i + delta)));
    },
    [cards.length],
  );

  const mark = useCallback(
    (isKnown: boolean) => {
      if (!card) return;
      setCardKnown(deck.id, card.id, isKnown);
      go(1);
    },
    [card, deck.id, go],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "1") mark(false);
      else if (e.key === "2") mark(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, mark]);

  const restart = (f: Filter = filter) => {
    setFilter(f);
    setIndex(0);
    setFlipped(false);
  };

  if (deck.flashcards.length === 0) {
    return (
      <div className="surface-ink mx-auto max-w-xl p-10 text-center">
        <p className="font-display text-xl font-bold">This set has no flashcards.</p>
        <p className="mt-2 text-muted-foreground">Generate a new set with flashcards turned on.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="w-56">
          <Segmented
            label="Which cards"
            value={filter}
            onChange={(v) => restart(v)}
            options={[
              { value: "all", label: `All ${deck.flashcards.length}` },
              { value: "learning", label: `Learning ${deck.flashcards.length - masteredCount}` },
            ]}
          />
        </div>
        <Button
          variant="paper"
          size="sm"
          className="h-10"
          onClick={() => {
            setSeed((s) => s + 1);
            restart();
          }}
        >
          <Shuffle />
          Shuffle
        </Button>
        <div className="ml-auto flex items-center gap-2 font-mono text-sm">
          <span className="rounded-full border-2 border-ink bg-success-soft px-2.5 py-0.5 tabular-nums">
            {masteredCount} mastered
          </span>
        </div>
      </div>

      {done || !card ? (
        <div className="surface-ink p-10 text-center animate-rise">
          <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border-2 border-ink bg-highlight shadow-ink-sm">
            <PartyPopper className="size-8" />
          </span>
          <h3 className="text-3xl font-extrabold">
            {cards.length === 0 ? "Everything's mastered!" : "Round complete"}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {masteredCount} of {deck.flashcards.length} cards mastered.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {deck.flashcards.length - masteredCount > 0 && (
              <Button variant="highlight" onClick={() => restart("learning")}>
                <RotateCcw />
                Study the {deck.flashcards.length - masteredCount} still learning
              </Button>
            )}
            <Button variant="paper" onClick={() => restart("all")}>
              Go through all again
            </Button>
            {masteredCount > 0 && (
              <Button
                variant="ghost"
                onClick={() => {
                  resetCards(deck.id);
                  restart("all");
                }}
              >
                <Undo2 />
                Reset progress
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 h-2 overflow-hidden rounded-full border-2 border-ink bg-card">
            <div
              className="h-full bg-highlight transition-all duration-500"
              style={{ width: `${(index / cards.length) * 100}%` }}
            />
          </div>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            key={card.id}
            className="perspective-card block w-full text-left animate-rise"
            aria-label={flipped ? "Show front" : "Show answer"}
          >
            <div
              className={cn(
                "relative h-80 w-full transition-transform duration-500 preserve-3d sm:h-96",
                flipped && "flip-y",
              )}
            >
              <div className="surface-ink absolute inset-0 flex flex-col p-7 backface-hidden sm:p-10">
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  <span>{card.topic}</span>
                  <span>
                    {index + 1} / {cards.length}
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-center text-center">
                  <p className="font-display text-2xl font-bold leading-snug sm:text-4xl">{card.front}</p>
                </div>
                <p className="text-center font-mono text-xs text-muted-foreground">Click or press space to flip</p>
              </div>
              <div className="absolute inset-0 flex flex-col rounded-xl border-2 border-ink bg-highlight-soft p-7 shadow-ink backface-hidden flip-y sm:p-10">
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  <span>Answer</span>
                  {known.has(card.id) && (
                    <span className="flex items-center gap-1 text-success">
                      <Check className="size-3" /> mastered
                    </span>
                  )}
                </div>
                <div className="flex flex-1 items-center justify-center overflow-auto text-center">
                  <p className="text-lg leading-relaxed sm:text-xl">{card.back}</p>
                </div>
              </div>
            </div>
          </button>

          <div className="mt-6 grid grid-cols-[auto_1fr_1fr_auto] items-center gap-3">
            <Button variant="paper" size="icon" className="size-12" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous card">
              <ArrowLeft />
            </Button>
            <Button variant="paper" className="h-12" onClick={() => mark(false)}>
              <RotateCcw />
              Still learning
              <kbd className="hidden rounded border border-ink/30 px-1 font-mono text-[10px] sm:inline">1</kbd>
            </Button>
            <Button variant="highlight" className="h-12" onClick={() => mark(true)}>
              <Check />
              Got it
              <kbd className="hidden rounded border border-ink/30 px-1 font-mono text-[10px] sm:inline">2</kbd>
            </Button>
            <Button variant="paper" size="icon" className="size-12" onClick={() => go(1)} aria-label="Next card">
              <ArrowRight />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
