import { useSyncExternalStore } from "react";

import type { Deck, QuizAttempt } from "./study-types";

const KEY = "pdflash.decks.v1";
const EVENT = "pdflash:decks";
const EMPTY: Deck[] = [];

let cacheRaw: string | null = null;
let cacheDecks: Deck[] = EMPTY;

function read(): Deck[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(KEY);
  if (raw === cacheRaw) return cacheDecks;
  cacheRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as Deck[]) : EMPTY;
    cacheDecks = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cacheDecks = EMPTY;
  }
  return cacheDecks;
}

function write(decks: Deck[]) {
  window.localStorage.setItem(KEY, JSON.stringify(decks));
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useDecks(): Deck[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useDeck(id: string): Deck | undefined {
  const decks = useDecks();
  return decks.find((d) => d.id === id);
}

export function saveDeck(deck: Deck) {
  write([deck, ...read().filter((d) => d.id !== deck.id)]);
}

export function deleteDeck(id: string) {
  write(read().filter((d) => d.id !== id));
}

export function updateDeck(id: string, fn: (d: Deck) => Deck) {
  write(read().map((d) => (d.id === id ? fn(d) : d)));
}

export function recordAttempt(id: string, attempt: QuizAttempt) {
  updateDeck(id, (d) => ({ ...d, attempts: [...d.attempts, attempt].slice(-50) }));
}

export function setCardKnown(id: string, cardId: string, known: boolean) {
  updateDeck(id, (d) => {
    const set = new Set(d.knownCardIds);
    if (known) set.add(cardId);
    else set.delete(cardId);
    return { ...d, knownCardIds: Array.from(set) };
  });
}

export function resetCards(id: string) {
  updateDeck(id, (d) => ({ ...d, knownCardIds: [] }));
}
