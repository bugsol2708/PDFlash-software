
import { Loader2 } from "lucide-react";

export function GeneratingView({ sourceName }: { sourceName: string }) {
  return (
    <div
      className="surface-ink relative overflow-hidden p-8 sm:p-10"
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-paper-grid opacity-60" aria-hidden />

      <div className="relative flex flex-col items-center justify-center py-10 text-center">
        <Loader2
          className="mb-6 size-12 animate-spin text-foreground"
          strokeWidth={2.5}
          aria-hidden="true"
        />

        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          PDFlash is working
        </p>

        <h3 className="mt-3 text-2xl font-extrabold sm:text-3xl">
          Generating your study set...
        </h3>

        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          Creating your quiz and flashcards from {sourceName}.
          This may take a few moments.
        </p>
      </div>
    </div>
  );
}
