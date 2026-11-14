import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Download, FileText, Layers, ListChecks, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DeckLoading, DeckMissing } from "@/components/pdflash/DeckStates";
import { PageShell } from "@/components/pdflash/SiteChrome";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteDeck } from "@/lib/deck-store";
import { bestScore, flashcardsToCsv, percent } from "@/lib/study-logic";
import type { Deck } from "@/lib/study-types";
import { useClientDeck } from "@/lib/use-client-deck";

export const Route = createFileRoute("/deck/$id")({
  head: () => ({
    meta: [
      { title: "Study set — PDFlash" },
      { name: "description", content: "Take the practice test or study the flashcards for this PDFlash study set." },
      { property: "og:title", content: "Study set — PDFlash" },
      { property: "og:description", content: "Practice test and flashcards generated from your notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DeckPage,
});

function DeckPage() {
  const { id } = Route.useParams();
  const { hydrated, deck } = useClientDeck(id);
  return (
    <PageShell>
      {!hydrated ? <DeckLoading /> : !deck ? <DeckMissing /> : <DeckOverview deck={deck} />}
    </PageShell>
  );
}

function downloadCsv(deck: Deck) {
  const blob = new Blob([flashcardsToCsv(deck.flashcards)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${deck.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "pdflash"}-flashcards.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Flashcards downloaded — import into Anki or Quizlet");
}

function DeckOverview({ deck }: { deck: Deck }) {
  const navigate = useNavigate();
  const best = bestScore(deck.attempts);
  const last = deck.attempts.at(-1);
  const mastered = deck.knownCardIds.length;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link to="/library" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Library
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="animate-rise">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <FileText className="size-3.5" /> {deck.sourceName} · {format(deck.createdAt, "MMM d, yyyy")}
          </p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">{deck.title}</h1>
          {deck.summary && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{deck.summary}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            {deck.topics.map((t) => (
              <span key={t} className="rounded-md border-2 border-ink bg-card px-2.5 py-1 text-sm font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="surface-ink grid grid-cols-2 gap-px self-start overflow-hidden bg-ink p-0 animate-rise">
          {[
            { label: "Questions", value: deck.questions.length },
            { label: "Flashcards", value: deck.flashcards.length },
            { label: "Best score", value: best === null ? "—" : `${best}%` },
            { label: "Cards mastered", value: `${mastered}/${deck.flashcards.length}` },
          ].map((s) => (
            <div key={s.label} className="bg-card p-5">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Link
          to="/quiz/$id"
          params={{ id: deck.id }}
          search={{ mode: "all" }}
          className="group relative overflow-hidden rounded-2xl border-2 border-ink bg-highlight p-7 shadow-ink press-ink"
        >
          <ListChecks className="size-9" />
          <h2 className="mt-6 text-3xl font-extrabold">Take the quiz</h2>
          <p className="mt-1 text-highlight-foreground/75">
            {deck.questions.length} questions · instant explanations
          </p>
          <ArrowRight className="absolute right-7 top-7 size-7 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          to="/cards/$id"
          params={{ id: deck.id }}
          className="group relative overflow-hidden rounded-2xl border-2 border-ink bg-card p-7 shadow-ink press-ink"
        >
          <Layers className="size-9" />
          <h2 className="mt-6 text-3xl font-extrabold">Flip flashcards</h2>
          <p className="mt-1 text-muted-foreground">
            {deck.flashcards.length} cards · {deck.flashcards.length - mastered} still learning
          </p>
          <ArrowRight className="absolute right-7 top-7 size-7 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {last && last.missedIds.length > 0 && (
        <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl border-2 border-ink bg-destructive-soft p-5 sm:flex-row sm:items-center">
          <Target className="size-7 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">You missed {last.missedIds.length} on your last attempt.</p>
            <p className="text-sm text-muted-foreground">Re-test just those to lock them in.</p>
          </div>
          <Button asChild variant="ink">
            <Link to="/quiz/$id" params={{ id: deck.id }} search={{ mode: "missed" }}>
              Retry missed
            </Link>
          </Button>
        </div>
      )}

      {deck.attempts.length > 0 && (
        <div className="mt-10">
          <h3 className="mb-3 text-xl font-bold">Attempts</h3>
          <div className="flex items-end gap-2 rounded-2xl border-2 border-ink bg-card p-5" style={{ height: 160 }}>
            {deck.attempts.slice(-20).map((a) => {
              const p = percent(a.correct, a.total);
              return (
                <div key={a.at} className="flex h-full flex-1 flex-col justify-end" title={`${p}% · ${format(a.at, "MMM d, h:mm a")}`}>
                  <div
                    className={p >= 75 ? "rounded-t-md border-2 border-ink bg-success" : p >= 50 ? "rounded-t-md border-2 border-ink bg-highlight" : "rounded-t-md border-2 border-ink bg-destructive"}
                    style={{ height: `${Math.max(p, 6)}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-3 border-t-2 border-ink/10 pt-6">
        <Button variant="paper" onClick={() => downloadCsv(deck)} disabled={deck.flashcards.length === 0}>
          <Download />
          Export flashcards (CSV)
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="text-destructive hover:bg-destructive-soft hover:text-destructive">
              <Trash2 />
              Delete set
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-2 border-ink shadow-ink">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete “{deck.title}”?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the quiz, flashcards and your progress from this device.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  deleteDeck(deck.id);
                  toast("Study set deleted");
                  navigate({ to: "/library" });
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}
