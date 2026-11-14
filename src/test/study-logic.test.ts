import { describe, expect, it } from "vitest";

import {
  flashcardsToCsv,
  normalizeStudySet,
  percent,
  prepareSourceText,
  shuffleOptions,
  topicBreakdown,
} from "@/lib/study-logic";
import type { Question, StudySetRaw } from "@/lib/study-types";

const q: Question = {
  id: "q1",
  question: "Powerhouse of the cell?",
  options: ["Nucleus", "Mitochondria", "Golgi", "Ribosome"],
  correctIndex: 1,
  explanation: "",
  sourceQuote: "",
  topic: "Organelles",
  difficulty: "easy",
};

describe("study logic", () => {
  it("keeps the correct answer attached after shuffling options", () => {
    for (let i = 0; i < 25; i++) {
      const s = shuffleOptions(q);
      expect(s.options[s.correctIndex]).toBe("Mitochondria");
      expect([...s.options].sort()).toEqual([...q.options].sort());
    }
  });

  it("drops questions whose correct answer index is out of range", () => {
    const raw: StudySetRaw = {
      title: "T",
      summary: "",
      topics: ["A"],
      questions: [
        { ...q, correctIndex: 1 },
        { ...q, correctIndex: 7 },
      ],
      flashcards: [{ front: "F", back: "B", topic: "A" }, { front: " ", back: "B", topic: "A" }],
    };
    const deck = normalizeStudySet(raw, "notes.pdf");
    expect(deck.questions).toHaveLength(1);
    expect(deck.flashcards).toHaveLength(1);
  });

  it("rounds score percentages", () => {
    expect(percent(2, 3)).toBe(67);
    expect(percent(0, 0)).toBe(0);
  });

  it("scores topics from chosen answers", () => {
    const stats = topicBreakdown([q, { ...q, id: "q2" }], { q1: 1, q2: 0 });
    expect(stats).toEqual([{ topic: "Organelles", correct: 1, total: 2 }]);
  });

  it("escapes quotes in the flashcard CSV export", () => {
    expect(flashcardsToCsv([{ id: "c", front: 'Say "hi"', back: "Hello", topic: "Cell Biology" }])).toBe(
      '"Say ""hi""","Hello","Cell_Biology"',
    );
  });

  it("caps source text at the limit and reports truncation", () => {
    const res = prepareSourceText("a".repeat(120), 100);
    expect(res.text).toHaveLength(100);
    expect(res.truncated).toBe(true);
  });
});
