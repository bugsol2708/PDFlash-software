import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg border-2 border-ink bg-highlight shadow-ink-sm",
        className,
      )}
    >
      <Zap className="size-5 fill-ink text-ink" strokeWidth={2.5} />
    </span>
  );
}

export function Logo() {
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5" aria-label="PDFlash home">
      <LogoMark className="transition-transform group-hover:-rotate-6" />
      <span className="font-display text-xl font-extrabold tracking-tight">
        PDFlash
      </span>
    </Link>
  );
}
