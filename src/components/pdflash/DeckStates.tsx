import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function DeckLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}

export function DeckMissing() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl border-2 border-ink bg-muted">
        <SearchX className="size-7" />
      </span>
      <h1 className="text-3xl font-extrabold">Study set not found</h1>
      <p className="mt-2 text-muted-foreground">
        Study sets are saved in the browser where you made them. It may have been deleted, or created on another device.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button asChild variant="ink">
          <Link to="/">Make a new one</Link>
        </Button>
        <Button asChild variant="paper">
          <Link to="/library">Open library</Link>
        </Button>
      </div>
    </div>
  );
}
