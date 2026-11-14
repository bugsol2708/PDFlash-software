import type { Deck, Flashcard, Question, QuizAttempt, StudySetRaw } from "./study-types";

let counter = 0;
export function makeId(prefix = "id") {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}${counter}`;
}

/** Turn the raw AI output into a clean deck, dropping malformed questions. */
export function normalizeStudySet(raw: StudySetRaw, sourceName: string): Deck {
  const questions: Question[] = raw.questions
    .map((q) => {
      const options = q.options.map((o) => o.trim()).filter(Boolean);
      const idx = Math.round(q.correctIndex);
      return { ...q, options, correctIndex: idx };
    })
    .filter(
      (q) =>
        q.question.trim().length > 0 &&
        q.options.length >= 2 &&
        q.correctIndex >= 0 &&
        q.correctIndex < q.options.length,
    )
    .map((q) => ({
      id: makeId("q"),
      question: q.question.trim(),
      options: q.options.slice(0, 6),
      correctIndex: q.correctIndex,
      explanation: q.explanation.trim(),
      sourceQuote: q.sourceQuote.trim(),
      topic: q.topic.trim() || "General",
      difficulty: q.difficulty,
    }));

  const flashcards: Flashcard[] = raw.flashcards
    .filter((c) => c.front.trim() && c.back.trim())
    .map((c) => ({
      id: makeId("c"),
      front: c.front.trim(),
      back: c.back.trim(),
      topic: c.topic.trim() || "General",
    }));

  return {
    id: makeId("deck"),
    title: raw.title.trim() || "Untitled study set",
    summary: raw.summary.trim(),
    topics: Array.from(new Set(raw.topics.map((t) => t.trim()).filter(Boolean))).slice(0, 10),
    sourceName,
    createdAt: Date.now(),
    questions,
    flashcards,
    attempts: [],
    knownCardIds: [],
  };
}

/** Fisher–Yates with an injectable random source (for tests). */
export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

/** Shuffle a question's options while keeping track of the correct answer. */
export function shuffleOptions(q: Question, rand: () => number = Math.random): Question {
  const order = shuffle(
    q.options.map((_, i) => i),
    rand,
  );
  return {
    ...q,
    options: order.map((i) => q.options[i]!),
    correctIndex: order.indexOf(q.correctIndex),
  };
}

export function percent(correct: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

export function bestScore(attempts: QuizAttempt[]): number | null {
  if (attempts.length === 0) return null;
  return Math.max(...attempts.map((a) => percent(a.correct, a.total)));
}

export interface TopicStat {
  topic: string;
  correct: number;
  total: number;
}

export function topicBreakdown(
  questions: Question[],
  answers: Record<string, number>,
): TopicStat[] {
  const map = new Map<string, TopicStat>();
  for (const q of questions) {
    if (!(q.id in answers)) continue;
    const s = map.get(q.topic) ?? { topic: q.topic, correct: 0, total: 0 };
    s.total += 1;
    if (answers[q.id] === q.correctIndex) s.correct += 1;
    map.set(q.topic, s);
  }
  return Array.from(map.values()).sort(
    (a, b) => a.correct / a.total - b.correct / b.total || b.total - a.total,
  );
}

export function gradeLabel(pct: number) {
  if (pct >= 90) return "Exam ready";
  if (pct >= 75) return "Almost there";
  if (pct >= 50) return "Getting warmer";
  return "Keep flashing";
}

function csvCell(v: string) {
  return `"${v.replace(/"/g, '""')}"`;
}

/** Anki/Quizlet friendly CSV: front,back,tag */
export function flashcardsToCsv(cards: Flashcard[]) {
  return cards
    .map((c) => [c.front, c.back, c.topic.replace(/\s+/g, "_")].map(csvCell).join(","))
    .join("\n");
}

/** Collapse whitespace and cap length before sending notes for generation. */
export function prepareSourceText(text: string, max: number) {
  const clean = text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { text: clean.slice(0, max), truncated: clean.length > max };
}
