
import { createWorker } from "tesseract.js";

type ExtractOptions = {
  maxChars: number;
  languages?: string[];
  autoDetectLanguage?: boolean;
  onProgress?: (page: number, total: number, stage?: string) => void;
};

type PdfTextResult = {
  text: string;
  pages: number;
  ocrPages: number;
};

const OCR_RENDER_SCALE = 1.7;
const MIN_PAGE_TEXT_LENGTH = 40;

function getLanguageForScript(script?: string): string | null {
  if (!script) return null;

  const value = script.toLowerCase();

  if (value.includes("devanagari")) return "hin";
  if (value.includes("bengali")) return "ben";
  if (value.includes("tamil")) return "tam";
  if (value.includes("telugu")) return "tel";
  if (value.includes("gujarati")) return "guj";
  if (value.includes("gurmukhi")) return "pan";
  if (value.includes("arabic")) return "ara";
  if (value.includes("cyrillic")) return "rus";
  if (value.includes("japanese")) return "jpn";
  if (value.includes("hangul")) return "kor";
  if (value.includes("han")) return "chi_sim";

  // Latin script is shared by many languages.
  // Use the user's selected language as the fallback.
  return null;
}

export async function extractPdfText(
  file: File,
  opts: ExtractOptions,
): Promise<PdfTextResult> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");

  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;

  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data });

  let ocrWorker: Awaited<ReturnType<typeof createWorker>> | null = null;
  let activeLanguage = "";

  let output = "";
  let ocrPages = 0;

  const selectedLanguages =
    opts.languages?.length ? opts.languages : ["eng"];

  const fallbackLanguage = selectedLanguages.join("+");

  try {
    const doc = await task.promise;
    const total = doc.numPages;

    for (let i = 1; i <= total; i++) {
      if (output.length >= opts.maxChars) break;

      const page = await doc.getPage(i);
      let pageText = "";

      try {
        const content = await page.getTextContent();

        for (const item of content.items) {
          if (!("str" in item)) continue;

          pageText += item.str;

          if (item.hasEOL) {
            pageText += "\n";
          } else {
            pageText += " ";
          }
        }

        // Only run OCR when this page has little or no selectable text.
        if (pageText.trim().length < MIN_PAGE_TEXT_LENGTH) {
          opts.onProgress?.(i, total, "Preparing scanned page");

          const viewport = page.getViewport({
            scale: OCR_RENDER_SCALE,
          });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("Could not create a canvas for OCR.");
          }

          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);

await page.render({
  canvas,
  canvasContext: context,
  viewport,
}).promise;

          if (!ocrWorker) {
            opts.onProgress?.(i, total, "Loading OCR language data");

            ocrWorker = await createWorker(
              opts.autoDetectLanguage ? "eng" : selectedLanguages,
              1,
              opts.autoDetectLanguage
                ? {
                    legacyCore: true,
                    legacyLang: true,
                  }
                : {},
            );

            activeLanguage = opts.autoDetectLanguage
              ? "eng"
              : fallbackLanguage;
          }

          if (opts.autoDetectLanguage) {
            opts.onProgress?.(i, total, "Detecting page script");

            try {
              const detection = await ocrWorker.detect(canvas);
              const detectedData = detection.data as {
                script?: string;
              };

              const detectedLanguage = getLanguageForScript(
                detectedData.script,
              );

              const targetLanguage =
                detectedLanguage ?? fallbackLanguage;

              if (targetLanguage !== activeLanguage) {
                opts.onProgress?.(
                  i,
                  total,
                  `Loading ${targetLanguage} OCR data`,
                );

                await ocrWorker.reinitialize(targetLanguage, 1);
                activeLanguage = targetLanguage;
              }
            } catch (error) {
              console.warn(
                "OCR script detection failed; using selected languages.",
                error,
              );

              if (activeLanguage !== fallbackLanguage) {
                await ocrWorker.reinitialize(fallbackLanguage, 1);
                activeLanguage = fallbackLanguage;
              }
            }
          }

          opts.onProgress?.(i, total, "Recognizing scanned page");

          const result = await ocrWorker.recognize(canvas);
          pageText = result.data.text.trim();

          if (pageText) {
            ocrPages++;
          }

          canvas.width = 0;
          canvas.height = 0;
        }
      } finally {
        page.cleanup();
      }

      if (pageText.trim()) {
        output += pageText.trim() + "\n\n";
      }

      opts.onProgress?.(i, total, "Reading PDF");
    }

    return {
      text: output.slice(0, opts.maxChars),
      pages: total,
      ocrPages,
    };
  } finally {
    if (ocrWorker) {
      await ocrWorker.terminate();
    }

    await task.destroy();
  }
}
