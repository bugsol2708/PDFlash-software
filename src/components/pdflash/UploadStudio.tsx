
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  FileText,
  FileUp,
  Loader2,
  Sparkles,
  Type,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveDeck } from "@/lib/deck-store";
import { extractPdfText } from "@/lib/pdf-extract";
import { SAMPLE_NAME, SAMPLE_NOTES } from "@/lib/sample-notes";
import { normalizeStudySet, prepareSourceText } from "@/lib/study-logic";
import { generateStudySet } from "@/lib/study.functions";
import {
  MAX_SOURCE_CHARS,
  MIN_SOURCE_CHARS,
  type Difficulty,
} from "@/lib/study-types";
import { cn } from "@/lib/utils";

import { GeneratingView } from "./GeneratingView";
import { Segmented } from "./Segmented";

type Mode = "file" | "paste";

interface Loaded {
  name: string;
  text: string;
  pages?: number | undefined;
}

const ACCEPT = ".pdf,.txt,.md,application/pdf,text/plain,text/markdown";

const OCR_LANGUAGES = [
  { code: "eng", name: "English" },
  { code: "hin", name: "Hindi" },
  { code: "mar", name: "Marathi" },
  { code: "ben", name: "Bengali" },
  { code: "tam", name: "Tamil" },
  { code: "tel", name: "Telugu" },
  { code: "guj", name: "Gujarati" },
  { code: "pan", name: "Punjabi" },
  { code: "urd", name: "Urdu" },
  { code: "ara", name: "Arabic" },
  { code: "fra", name: "French" },
  { code: "deu", name: "German" },
  { code: "spa", name: "Spanish" },
  { code: "ita", name: "Italian" },
  { code: "por", name: "Portuguese" },
  { code: "rus", name: "Russian" },
  { code: "jpn", name: "Japanese" },
  { code: "kor", name: "Korean" },
  { code: "chi_sim", name: "Chinese (Simplified)" },
  { code: "chi_tra", name: "Chinese (Traditional)" },
] as const;

export function UploadStudio() {
  const navigate = useNavigate();
  const generate = useServerFn(generateStudySet);

  const inputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("file");
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [pasted, setPasted] = useState("");
  const [reading, setReading] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [questionCount, setQuestionCount] = useState(10);
  const [flashcardCount, setFlashcardCount] = useState(15);
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");

  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // OCR settings
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(true);
  const [manualLanguageSelection, setManualLanguageSelection] =
    useState(false);
  const [ocrLanguages, setOcrLanguages] = useState<string[]>(["eng"]);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      const isText =
        /\.(txt|md|markdown)$/i.test(file.name) ||
        file.type.startsWith("text/");

      if (!isPdf && !isText) {
        setError("PDFlash reads PDF, TXT and Markdown files.");
        return;
      }

      if (file.size > 30 * 1024 * 1024) {
        setError("That file is over 30 MB. Try splitting it into chapters.");
        return;
      }

      try {
        setReading("Opening file…");

        let text = "";
        let pages: number | undefined;

        if (isPdf) {
          const res = await extractPdfText(file, {
            maxChars: MAX_SOURCE_CHARS * 1.2,
            languages: manualLanguageSelection ? ocrLanguages : ["eng"],
            autoDetectLanguage,
            onProgress: (page, total, stage) => {
              setReading(
                `${stage ?? "Reading PDF"} · page ${page} of ${total}…`,
              );
            },
          });

          text = res.text;
          pages = res.pages;
        } else {
          text = await file.text();
        }

        const clean = prepareSourceText(text, MAX_SOURCE_CHARS).text;

        if (clean.length < MIN_SOURCE_CHARS) {
          setError(
            isPdf
              ? "We couldn't extract enough text from this PDF. Check that the scan is readable, or try selecting its language manually."
              : "This file is almost empty. Add more notes and try again.",
          );

          setLoaded(null);
          return;
        }

        setLoaded({
          name: file.name,
          text: clean,
          pages,
        });
      } catch (e) {
        console.error(e);
        setError("We couldn't open that file. Is it password protected?");
      } finally {
        setReading(null);
      }
    },
    [autoDetectLanguage, manualLanguageSelection, ocrLanguages],
  );

  const source: Loaded | null =
    mode === "file"
      ? loaded
      : pasted.trim()
        ? { name: "Pasted notes", text: pasted }
        : null;

  const prepared = source
    ? prepareSourceText(source.text, MAX_SOURCE_CHARS)
    : null;

  const words = prepared
    ? prepared.text.split(/\s+/).filter(Boolean).length
    : 0;

  const tooShort = prepared
    ? prepared.text.length < MIN_SOURCE_CHARS
    : true;

  async function run(src: Loaded) {
    const prep = prepareSourceText(src.text, MAX_SOURCE_CHARS);

    if (prep.text.length < MIN_SOURCE_CHARS) {
      setError("Add a bit more text — at least a paragraph or two of notes.");
      return;
    }

    setError(null);
    setGenerating(src.name);

    try {
      const res = await generate({
        data: {
          text: prep.text,
          questionCount,
          flashcardCount,
          difficulty,
        },
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      const deck = normalizeStudySet(res.set, src.name);

      if (deck.questions.length === 0) {
        setError(
          "We couldn't build questions from these notes. Try a longer section.",
        );
        return;
      }

      saveDeck(deck);

      toast.success(
        `${deck.questions.length} questions and ${deck.flashcards.length} flashcards ready`,
      );

      navigate({
        to: "/deck/$id",
        params: { id: deck.id },
      });
    } catch (e) {
      console.error(e);
      setError("Generation failed. Check your connection and try again.");
    } finally {
      setGenerating(null);
    }
  }

  if (generating) {
    return <GeneratingView sourceName={generating} />;
  }

  return (
    <div className="surface-ink overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b-2 border-ink" role="tablist">
        {(
          [
            { id: "file", label: "Upload file", icon: FileUp },
            { id: "paste", label: "Paste notes", icon: Type },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => {
              setMode(tab.id);
              setError(null);
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors",
              tab.id === "file" && "border-r-2 border-ink",
              mode === tab.id
                ? "bg-highlight"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6 p-5 sm:p-7">
        {mode === "file" ? (
          loaded ? (
            <div className="flex w-full min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-xl border-2 border-ink bg-highlight-soft p-3 sm:gap-4 sm:p-4 animate-pop">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-card">
                <FileText className="size-6" />
              </span>

<div className="min-w-0 flex-1 overflow-hidden">
  <p
    className="block max-w-full truncate font-semibold"
    title={loaded.name}
  >
    {loaded.name}
  </p>

  <p className="truncate font-mono text-xs text-muted-foreground">
                  {loaded.pages ? `${loaded.pages} pages · ` : ""}
                  {words.toLocaleString()} words
                  {prepared?.truncated ? " · using first ~10k words" : ""}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLoaded(null)}
                aria-label="Remove file"
              >
                <X />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);

                const file = e.dataTransfer.files[0];

                if (file) void handleFile(file);
              }}
              disabled={!!reading}
              className={cn(
                "group flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink/40 bg-paper-grid px-6 py-12 text-center transition-all",
                dragging
                  ? "border-ink bg-highlight-soft scale-[1.01]"
                  : "hover:border-ink hover:bg-muted/60",
              )}
            >
              {reading ? (
                <>
                  <Loader2 className="mb-3 size-9 animate-spin" />
                  <p className="font-semibold">{reading}</p>
                </>
              ) : (
                <>
                  <span className="mb-4 flex size-14 items-center justify-center rounded-xl border-2 border-ink bg-highlight shadow-ink-sm transition-transform group-hover:-rotate-6">
                    <FileUp className="size-7" />
                  </span>

                  <p className="font-display text-lg font-bold">
                    Drop your study guide here
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    or click to browse · PDF, TXT or Markdown
                  </p>
                </>
              )}
            </button>
          )
        ) : (
          <div>
            <Textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder="Paste lecture notes, a textbook section, or your study guide…"
              className="min-h-52 rounded-xl border-2 border-ink bg-card text-base focus-visible:ring-0 focus-visible:border-ink"
            />

            <p className="mt-2 text-right font-mono text-xs text-muted-foreground">
              {words.toLocaleString()} words
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) void handleFile(file);

            e.target.value = "";
          }}
        />

        {/* Options */}
        <div className="grid gap-3">
          {/* OCR Language Settings */}
          {mode === "file" && (
            <div className="relative space-y-5 rounded-xl border-2 border-ink bg-card p-4 shadow-ink-sm">
              {/* Heading */}
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg border-2 border-ink bg-highlight">
                  <FileText className="size-4" />
                </span>

                <div>
                  <p className="font-display font-bold">
                    OCR language settings
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Configure how PDFlash reads scanned PDFs.
                  </p>
                </div>
              </div>

              {/* Automatic detection checkbox */}
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 border-ink bg-paper-grid p-3 transition-colors hover:bg-highlight-soft">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    Automatic language detection
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Detect the writing system automatically.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={autoDetectLanguage}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAutoDetectLanguage(checked);

                    if (checked) {
                      setManualLanguageSelection(false);
                    }
                  }}
                  className="size-5 shrink-0 accent-current"
                />
              </label>

              {/* Manual selection checkbox */}
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 border-ink bg-paper-grid p-3 transition-colors hover:bg-highlight-soft">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    Manual language selection
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Choose the languages in your document.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={manualLanguageSelection}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setManualLanguageSelection(checked);

                    if (checked) {
                      setAutoDetectLanguage(false);
                    }
                  }}
                  className="size-5 shrink-0 accent-current"
                />
              </label>

              {/* Language list overlay */}
              {manualLanguageSelection && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 space-y-3 rounded-xl border-2 border-ink bg-card p-4 shadow-ink-sm animate-pop">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      Select OCR languages
                    </p>

                    <span className="rounded-full border border-ink bg-highlight px-2.5 py-1 font-mono text-xs font-bold">
                      {ocrLanguages.length} selected
                    </span>
                  </div>

                  <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                    {OCR_LANGUAGES.map((language) => {
                      const selected = ocrLanguages.includes(language.code);

                      return (
                        <label
                          key={language.code}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all",
                            selected
                              ? "border-ink bg-highlight shadow-ink-sm"
                              : "border-ink/20 bg-background hover:border-ink hover:bg-muted",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setOcrLanguages((current) =>
                                  current.includes(language.code)
                                    ? current
                                    : [...current, language.code],
                                );
                              } else {
                                setOcrLanguages((current) =>
                                  current.length > 1
                                    ? current.filter(
                                        (code) => code !== language.code,
                                      )
                                    : current,
                                );
                              }
                            }}
                            className="size-4 shrink-0 accent-current"
                          />

                          <span className="truncate">{language.name}</span>
                        </label>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Select one or more languages. At least one language must
                    remain selected.
                  </p>
                </div>
              )}
            </div>
          )}

          <OptionRow label="Questions">
            <Segmented
              label="Number of questions"
              value={questionCount}
              onChange={setQuestionCount}
              options={[5, 10, 15, 20].map((n) => ({
                value: n,
                label: String(n),
              }))}
            />
          </OptionRow>

          <OptionRow label="Difficulty">
            <Segmented
              label="Difficulty"
              value={difficulty}
              onChange={setDifficulty}
              options={[
                { value: "easy", label: "Easy" },
                { value: "mixed", label: "Mixed" },
                { value: "hard", label: "Hard" },
              ]}
            />
          </OptionRow>

          <OptionRow label="Flashcards">
            <Segmented
              label="Number of flashcards"
              value={flashcardCount}
              onChange={setFlashcardCount}
              options={[0, 10, 15, 25].map((n) => ({
                value: n,
                label: n === 0 ? "Off" : String(n),
              }))}
            />
          </OptionRow>
        </div>

        {error && (
          <p
            className="rounded-xl border-2 border-destructive bg-destructive-soft px-4 py-3 text-sm font-medium"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
       <Button
  variant="ink"
  size="xl"
  className="flex-1 w-full min-h-[72px] text-lg font-bold gap-3 border-2 border-ink bg-highlight text-ink shadow-ink-sm hover:bg-highlight sm:min-h-0 sm:bg-ink sm:text-background"
  disabled={!source || tooShort || !!reading}
  onClick={() => source && void run(source)}
>
  <Zap className="size-6 fill-current" />
  Generate study set
</Button>

          <Button
            variant="paper"
            size="xl"
            onClick={() =>
              void run({ name: SAMPLE_NAME, text: SAMPLE_NOTES })
            }
          >
            <Sparkles />
            Try sample notes
          </Button>
        </div>
      </div>
    </div>
  );
}

function OptionRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid items-center gap-2 sm:grid-cols-[7rem_1fr]">
      <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>

      {children}
    </div>
  );
}
