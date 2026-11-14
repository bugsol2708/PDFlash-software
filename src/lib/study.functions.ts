import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { MAX_SOURCE_CHARS, MIN_SOURCE_CHARS, type GenerateResult } from "./study-types";
import { generateStudySetFromText } from "./study.server";

const inputSchema = z.object({
  text: z.string().min(MIN_SOURCE_CHARS).max(MAX_SOURCE_CHARS + 1000),
  questionCount: z.number().int().min(3).max(30),
  flashcardCount: z.number().int().min(0).max(40),
  difficulty: z.enum(["easy", "mixed", "hard"]),
});

export const generateStudySet = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<GenerateResult> => {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) return { ok: false, error: "AI isn't configured for this app yet." };
    return generateStudySetFromText(
      data.text.slice(0, MAX_SOURCE_CHARS),
      { questionCount: data.questionCount, flashcardCount: data.flashcardCount, difficulty: data.difficulty },
      apiKey,
    );
  });
