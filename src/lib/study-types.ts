import { z } from "zod";

/** Strict-compatible schema the AI must return (all fields required, object root). */
export const studySetSchema = z.object({
  title: z.string().describe("Short, specific title for this study set (max ~8 words)"),
  summary: z.string().describe("2-3 sentence overview of what the material covers"),
  topics: z.array(z.string()).describe("4-8 key topics covered, short labels"),
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).describe("Exactly 4 answer options"),
      correctIndex: z.number().describe("0-based index of the correct option"),
      explanation: z
        .string()
        .describe("2-4 sentences: why the answer is right and why the tempting wrong one is wrong"),
      sourceQuote: z
        .string()
        .describe("Short verbatim snippet from the notes supporting the answer (max ~25 words)"),
      topic: z.string().describe("One of the topics above"),
      difficulty: z.enum(["easy", "medium", "hard"]),
    }),
  ),
  flashcards: z.array(
    z.object({
      front: z.string().describe("Term, concept or short question"),
      back: z.string().describe("Concise definition or answer (1-3 sentences)"),
      topic: z.string(),
    }),
  ),
});

export type StudySetRaw = z.infer<typeof studySetSchema>;

export type Difficulty = "easy" | "mixed" | "hard";

export interface GenerateOptions {
  questionCount: number;
  flashcardCount: number;
  difficulty: Difficulty;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceQuote: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
}

export interface QuizAttempt {
  at: number;
  correct: number;
  total: number;
  missedIds: string[];
}

export interface Deck {
  id: string;
  title: string;
  summary: string;
  topics: string[];
  sourceName: string;
  createdAt: number;
  questions: Question[];
  flashcards: Flashcard[];
  attempts: QuizAttempt[];
  knownCardIds: string[];
}

export type GenerateResult =
  | { ok: true; set: StudySetRaw }
  | { ok: false; error: string };

export const MAX_SOURCE_CHARS = 60_000;
export const MIN_SOURCE_CHARS = 200;
