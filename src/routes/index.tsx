import { createFileRoute } from "@tanstack/react-router";
import { BookOpenCheck, Check, Download, FileUp, Flame, Layers, Lock, Quote, Target, Zap } from "lucide-react";

import { PageShell } from "@/components/pdflash/SiteChrome";
import { UploadStudio } from "@/components/pdflash/UploadStudio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PDFlash — Turn study guides into practice tests in seconds" },
      {
        name: "description",
        content:
          "Upload class notes or a study guide PDF and PDFlash builds an interactive multiple-choice test with instant explanations and flashcards.",
      },
      { property: "og:title", content: "PDFlash — Turn study guides into practice tests in seconds" },
      {
        property: "og:description",
        content: "Drop in your notes. Get a quiz that explains every answer, plus flashcards. Free to try.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PageShell>
      <Hero />
      <HowItWorks />
      <Features />
      <ClosingCta />
    </PageShell>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b-2 border-ink">
      <div className="absolute inset-0 bg-paper-grid" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:py-20">
        <div className="flex flex-col justify-center animate-rise">
          <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border-2 border-ink bg-card px-3 py-1 font-mono text-xs font-medium shadow-ink-sm">
            <Zap className="size-3.5 fill-highlight text-ink" />
            AI study partner for exam week
          </span>
          <h1 className="text-5xl font-extrabold leading-[0.95] sm:text-6xl lg:text-7xl">
            Your notes,
            <br />
            now a <span className="mark-highlight">practice test.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            Drop in a study guide or class notes. PDFlash writes exam-style questions, explains every
            answer with a quote from your notes, and builds flashcards for what you missed.
          </p>
          <ul className="mt-8 grid gap-3 text-sm font-medium">
            {[
              "Multiple-choice tests with instant explanations",
              "Flashcards with “got it” and “still learning” piles",
              "Works with PDFs, text files and pasted notes",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex size-5 items-center justify-center rounded-md border-2 border-ink bg-highlight">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div id="studio" className="scroll-mt-24 animate-rise" style={{ animationDelay: "0.1s" }}>
          <UploadStudio />
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: FileUp, title: "Drop your notes", body: "PDF study guides, lecture slides exported to PDF, or paste text straight in." },
    { icon: Zap, title: "PDFlash it", body: "AI finds the key topics and writes questions with plausible wrong answers." },
    { icon: BookOpenCheck, title: "Learn as you test", body: "Every answer explains itself — then drill the misses with flashcards." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">How it works</p>
      <h2 className="mt-2 max-w-xl text-4xl font-extrabold sm:text-5xl">From PDF to practice in under a minute.</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="surface-ink relative p-6">
            <span className="absolute -top-4 right-5 rounded-md border-2 border-ink bg-highlight px-2 font-mono text-sm font-bold">
              0{i + 1}
            </span>
            <s.icon className="size-8" strokeWidth={2} />
            <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
            <p className="mt-2 text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="border-y-2 border-ink bg-muted/60">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-20 sm:px-6 lg:grid-cols-6">
        {/* Explanation mock */}
        <div className="surface-ink p-6 lg:col-span-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Instant explanations</p>
          <h3 className="mt-2 text-2xl font-extrabold">Wrong answers become lessons.</h3>
          <div className="mt-6 grid gap-2.5">
            <div className="flex items-center gap-3 rounded-xl border-2 border-ink bg-destructive-soft px-4 py-3 text-sm">
              <span className="flex size-6 items-center justify-center rounded-md border-2 border-ink bg-destructive font-mono text-xs font-bold text-destructive-foreground">
                B
              </span>
              The Golgi apparatus produces ATP
            </div>
            <div className="flex items-center gap-3 rounded-xl border-2 border-ink bg-success-soft px-4 py-3 text-sm">
              <span className="flex size-6 items-center justify-center rounded-md border-2 border-ink bg-success text-success-foreground">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              Mitochondria are the site of cellular respiration
            </div>
            <div className="mt-1 flex gap-2.5 rounded-lg border-l-4 border-ink bg-card px-3 py-2.5 text-sm">
              <Quote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="italic">“Mitochondria: site of cellular respiration, producing ATP.”</span>
            </div>
          </div>
        </div>

        {/* Flashcard mock */}
        <div className="surface-ink flex flex-col p-6 lg:col-span-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Flashcards</p>
          <h3 className="mt-2 text-2xl font-extrabold">Flip. Sort. Master.</h3>
          <div className="relative mt-6 flex-1 min-h-40">
            <div className="absolute inset-x-4 top-3 bottom-0 rotate-3 rounded-xl border-2 border-ink bg-highlight-soft" />
            <div className="absolute inset-0 -rotate-2 flex items-center justify-center rounded-xl border-2 border-ink bg-card p-4 text-center shadow-ink-sm">
              <span className="font-display text-xl font-bold">Osmosis</span>
            </div>
          </div>
        </div>

        {[
          { icon: Target, title: "Retry only the misses", body: "One tap to re-test the questions you got wrong." },
          { icon: Flame, title: "Streaks & topic scores", body: "See exactly which topics need another pass." },
          { icon: Download, title: "Export to Anki", body: "Download flashcards as CSV for Anki or Quizlet." },
          { icon: Lock, title: "Your files stay put", body: "PDFs are read in your browser; only the text is used." },
          { icon: Layers, title: "A library of sets", body: "Every study set is saved so you can come back before the exam." },
          { icon: BookOpenCheck, title: "Grounded in your notes", body: "Questions only use facts from what you uploaded." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border-2 border-ink bg-card p-5 lg:col-span-2">
            <f.icon className="size-6" />
            <h4 className="mt-3 text-lg font-bold">{f.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border-2 border-ink bg-primary px-8 py-14 text-center text-primary-foreground shadow-ink-lg sm:px-16">
        <h2 className="text-4xl font-extrabold sm:text-5xl">
          Stop re-reading. <span className="text-highlight">Start testing.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-primary-foreground/70">
          Practice testing beats re-reading notes for long-term memory. PDFlash makes the test for you.
        </p>
        <a
          href="#studio"
          className="mt-8 inline-flex h-14 items-center gap-2 rounded-xl border-2 border-highlight bg-highlight px-7 font-semibold text-highlight-foreground transition-transform hover:-translate-y-0.5"
        >
          <Zap className="size-5 fill-current" />
          Flash my notes
        </a>
      </div>
    </section>
  );
}
