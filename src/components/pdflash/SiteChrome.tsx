import { Link } from "@tanstack/react-router";
import { Library, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useDecks } from "@/lib/deck-store";
import { Logo } from "./Logo";

export function SiteHeader() {
  const decks = useDecks();
  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="font-medium">
            <Link to="/library" activeProps={{ className: "bg-muted" }}>
              <Library />
              Library
              {decks.length > 0 && (
                <span className="rounded-full bg-ink px-1.5 font-mono text-[10px] leading-4 text-primary-foreground">
                  {decks.length}
                </span>
              )}
            </Link>
          </Button>
          <Button asChild variant="highlight" size="sm">
            <Link to="/" hash="studio">
              <Plus />
              <span className="hidden sm:inline">New study set</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t-2 border-ink">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
        <Logo />
        <p className="max-w-md text-sm text-muted-foreground">
          Drop in your notes, get a test that teaches. Your study sets are saved on this device.
        </p>
        <p className="font-mono text-xs text-muted-foreground">© {new Date().getFullYear()} PDFlash</p>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
