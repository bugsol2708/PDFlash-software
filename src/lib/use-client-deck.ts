import { useHydrated } from "@tanstack/react-router";

import { useDeck } from "./deck-store";

/** Decks live in this browser; wait for hydration before deciding a deck is missing. */
export function useClientDeck(id: string) {
  const hydrated = useHydrated();
  const deck = useDeck(id);
  return { hydrated, deck };
}
