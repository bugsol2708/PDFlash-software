import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { Plus, Zap } from "lucide-react";

import { DeckTile } from "@/components/pdflash/DeckTile";
import { PageShell } from "@/components/pdflash/SiteChrome";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDecks } from "@/lib/deck-store";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Your study sets — PDFlash" },
      { name: "description", content: "All your PDFlash quizzes and flashcard decks in one place." },
      { property: "og:title", content: "Your study sets — PDFlash" },
      { property: "og:description", content: "All your PDFlash quizzes and flashcard decks in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const hydrated = useHydrated();
  const decks = useDecks();

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Library</p>
            <h1 className="mt-1 text-4xl font-extrabold sm:text-5xl">Your study sets</h1>
          </div>
          <Button asChild variant="highlight" size="lg" className="h-12">
            <Link to="/" hash="studio">
              <Plus />
              New study set
            </Link>
          </Button>
        </div>

        {!hydrated ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : decks.length === 0 ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-ink/40 bg-paper-grid px-6 py-20 text-center">
            <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl border-2 border-ink bg-highlight shadow-ink-sm">
              <Zap className="size-7 fill-ink" />
            </span>
            <h2 className="text-2xl font-extrabold">No study sets yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
              Upload your first study guide and it will show up here, ready for exam day.
            </p>
            <Button asChild variant="ink" size="lg" className="mt-6 h-12">
              <Link to="/" hash="studio">Flash my first notes</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((d) => (
              <DeckTile key={d.id} deck={d} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
