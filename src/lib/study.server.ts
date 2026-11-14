
import { createGoogle } from "@ai-sdk/google";
import {
  APICallError,
  NoObjectGeneratedError,
  Output,
  streamText,
} from "ai";

import {
  studySetSchema,
  type GenerateOptions,
  type GenerateResult,
} from "./study-types";

// Gemini model
const MODEL = "gemini-3.5-flash-lite";

const INSTRUCTIONS = `You are PDFlash, an expert teacher who turns a student's study guide or class notes into a high-quality practice test and flashcards.

Rules:
- Use ONLY facts found in the provided notes. Never invent facts.
- Every multiple-choice question has exactly 4 options, one clearly correct answer, and 3 plausible distractors that reflect common misconceptions. Avoid "all of the above" / "none of the above".
- Vary the position of the correct answer across questions.
- Test understanding and application, not just recall of wording. Mix definitions, cause/effect, comparisons and applied scenarios.
- Explanations teach: say why the correct answer is right and why the most tempting wrong option is wrong. 2-4 sentences, friendly and clear.
- sourceQuote is a short verbatim excerpt (max ~25 words) from the notes that supports the answer.
- Flashcards cover the most important terms, concepts, formulas, dates and people. Front is short; back is a crisp 1-3 sentence answer.
- Topic labels must match one of the topics list entries.
- Write in the same language as the notes.`;

function difficultyText(d: GenerateOptions["difficulty"]): string {
  if (d === "easy") {
    return "Mostly easy, foundational questions.";
  }

  if (d === "hard") {
    return "Mostly hard questions that require deeper reasoning and application.";
  }

  return "A balanced mix: roughly 30% easy, 50% medium, 20% hard.";
}

// Unwraps the API error when the AI SDK wraps it in a retry error.
function getUnderlyingError(error: unknown): unknown {
  let current = error;

  for (let i = 0; i < 3; i++) {
    if (
      APICallError.isInstance(current) ||
      NoObjectGeneratedError.isInstance(current)
    ) {
      return current;
    }

    if (
      typeof current === "object" &&
      current !== null &&
      "lastError" in current
    ) {
      const next = (current as { lastError?: unknown }).lastError;

      if (next == null || next === current) {
        break;
      }

      current = next;
      continue;
    }

    break;
  }

  return current;
}

export async function generateStudySetFromText(
  text: string,
  opts: GenerateOptions,
  apiKey: string,
): Promise<GenerateResult> {
  const google = createGoogle({ apiKey });

  const prompt = `Create a study set from the notes below.

- Exactly ${opts.questionCount} multiple-choice questions.
- Difficulty: ${difficultyText(opts.difficulty)}
- Exactly ${opts.flashcardCount} flashcards.

<notes>
${text}
</notes>`;

  let streamError: unknown = null;

  try {
    const result = streamText({
      model: google(MODEL),
      system: INSTRUCTIONS,
      prompt,
      output: Output.object({ schema: studySetSchema }),
      onError: ({ error }) => {
        streamError = error;
      },
    });

    const set = await result.output;

    if (!set || set.questions.length === 0) {
      return {
        ok: false,
        error:
          "We couldn't build questions from this file. Try notes with more text.",
      };
    }

    return {
      ok: true,
      set,
    };
  } catch (error) {
    const originalError = streamError ?? error;
    const actualError = getUnderlyingError(originalError);

    console.error(
      "[pdflash] Gemini generation failed",
      originalError,
    );

    if (NoObjectGeneratedError.isInstance(actualError)) {
      return {
        ok: false,
        error:
          "The AI response came back incomplete. Please try again.",
      };
    }

    if (APICallError.isInstance(actualError)) {
      const status = actualError.statusCode;

      if (status === 401 || status === 403) {
        return {
          ok: false,
          error:
            "Gemini API authentication failed. Check your API key and access.",
        };
      }

      if (status === 429) {
        return {
          ok: false,
          error:
            "Gemini is receiving too many requests. Please wait and try again.",
        };
      }

      if (status === 503) {
        return {
          ok: false,
          error:
            "Gemini is temporarily experiencing high demand. Please try again in a few minutes.",
        };
      }

      if (status === 400) {
        return {
          ok: false,
          error:
            "This document couldn't be processed. Try a shorter section of your notes.",
        };
      }

      if (status === 404) {
        return {
          ok: false,
          error:
            "The configured Gemini model was not found. Check the model configuration.",
        };
      }
    }

    // Final fallback: guarantees a GenerateResult on every error path.
    return {
      ok: false,
      error:
        "Something went wrong while generating. Please try again.",
    };
  }
}
