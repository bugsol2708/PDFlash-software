import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";

import { bestScore } from "@/lib/study-logic";
import type { Deck } from "@/lib/study-types";
import { cn } from "@/lib/utils";

export function DeckTile({ deck }: { deck: Deck }) {
  const best = bestScore(deck.attempts);
  const mastered = deck.knownCardIds.length;
  return (
    <Link
      to="/deck/$id"
      params={{ id: deck.id }}
      className="surface-ink press-ink group flex flex-col p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg border-2 border-ink bg-highlight-soft group-hover:bg-highlight">
          <FileText className="size-5" />
        </span>
        <span
          className={cn(
            "rounded-full border-2 border-ink px-2.5 py-0.5 font-mono text-xs font-semibold",
            best === null ? "bg-muted" : best >= 75 ? "bg-success-soft" : best >= 50 ? "bg-highlight-soft" : "bg-destructive-soft",
          )}
        >
          {best === null ? "Not taken" : `Best ${best}%`}
        </span>
      </div>
      <h3 className="mt-4 line-clamp-2 text-lg font-bold leading-snug">{deck.title}</h3>
      <p className="mt-1 truncate text-sm text-muted-foreground">{deck.sourceName}</p>
      <div className="mt-auto flex items-center gap-3 pt-5 font-mono text-xs text-muted-foreground">
        <span>{deck.questions.length} Qs</span>
        <span>·</span>
        <span>
          {mastered}/{deck.flashcards.length} cards
        </span>
        <span className="ml-auto">{formatDistanceToNow(deck.createdAt, { addSuffix: true })}</span>
      </div>
    </Link>
  );
}
