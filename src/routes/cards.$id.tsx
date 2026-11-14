import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ListChecks } from "lucide-react";

import { DeckLoading, DeckMissing } from "@/components/pdflash/DeckStates";
import { FlashcardStudy } from "@/components/pdflash/FlashcardStudy";
import { SiteHeader } from "@/components/pdflash/SiteChrome";
import { Button } from "@/components/ui/button";
import { useClientDeck } from "@/lib/use-client-deck";

export const Route = createFileRoute("/cards/$id")({
  head: () => ({
    meta: [
      { title: "Flashcards — PDFlash" },
      { name: "description", content: "Flip through flashcards made from your notes and track what you've mastered." },
      { property: "og:title", content: "Flashcards — PDFlash" },
      { property: "og:description", content: "Flashcards generated from your notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CardsPage,
});

function CardsPage() {
  const { id } = Route.useParams();
  const { hydrated, deck } = useClientDeck(id);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {!hydrated ? (
        <DeckLoading />
      ) : !deck ? (
        <DeckMissing />
      ) : (
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
            <Button asChild variant="paper" size="sm">
              <Link to="/quiz/$id" params={{ id: deck.id }} search={{ mode: "all" }}>
                <ListChecks />
                Quiz me
              </Link>
            </Button>
          </div>
          <FlashcardStudy deck={deck} />
        </section>
      )}
    </div>
  );
}
