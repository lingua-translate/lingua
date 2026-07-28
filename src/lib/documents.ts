/**
 * Document text extraction for the translator.
 *
 * Today this runs entirely in the browser and supports plain-text formats only
 * (no backend, GitHub Pages friendly). It is deliberately structured as a small
 * registry so that PDF and DOCX extraction can be added later — either with a
 * client-side parser or a backend service — without touching the UI:
 *
 *   1. Implement an extractor `(file) => Promise<string>` for the new format.
 *   2. Register it in `EXTRACTORS` keyed by extension.
 * The component calls `extractDocument()` and reacts to `supported`.
 */

/** Extensions we can read as text directly in the browser right now. */
export const TEXT_EXTENSIONS = [
  "txt", "text", "md", "markdown", "csv", "tsv", "json", "log", "srt", "vtt",
  "xml", "html", "htm",
] as const;

/** Formats intended for later (need a parser or backend). */
export const FUTURE_EXTENSIONS = ["pdf", "docx", "doc", "odt", "rtf", "pptx", "xlsx"] as const;

export interface ExtractedDocument {
  /** Extracted plain text (empty when unsupported). */
  text: string;
  /** File name without its extension — used for the download name. */
  baseName: string;
  /** Lower-cased file extension. */
  format: string;
  /** Whether extraction succeeded with the current (no-backend) capabilities. */
  supported: boolean;
  /** A user-facing note when the format isn't supported yet. */
  message?: string;
}

type Extractor = (file: File) => Promise<string>;

/** Registry of format → extractor. Add PDF/DOCX here later. */
const EXTRACTORS: Record<string, Extractor> = Object.fromEntries(
  TEXT_EXTENSIONS.map((ext) => [ext, (file: File) => file.text()]),
);

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function isKnownFutureFormat(ext: string): boolean {
  return (FUTURE_EXTENSIONS as readonly string[]).includes(ext);
}

export async function extractDocument(file: File): Promise<ExtractedDocument> {
  const format = extensionOf(file.name);
  const baseName = file.name.replace(/\.[^.]+$/, "") || file.name;

  const extractor = EXTRACTORS[format] ?? (file.type.startsWith("text/") ? (f: File) => f.text() : undefined);

  if (extractor) {
    try {
      const text = await extractor(file);
      return { text, baseName, format, supported: true };
    } catch {
      return {
        text: "",
        baseName,
        format,
        supported: false,
        message: "Couldn't read that file. Please try a different text file.",
      };
    }
  }

  return {
    text: "",
    baseName,
    format,
    supported: false,
    message: isKnownFutureFormat(format)
      ? `${format.toUpperCase()} files aren't supported yet — for now, upload a plain-text file (.txt, .md, .csv…).`
      : "Unsupported file type. Please upload a plain-text file (.txt, .md, .csv…).",
  };
}
