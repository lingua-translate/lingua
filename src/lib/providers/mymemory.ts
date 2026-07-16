import type { TranslateParams, TranslateResult, TranslationProvider } from "./types";
import { AUTO_DETECT } from "@/lib/languages";

/**
 * Free, keyless translation via the MyMemory API (https://mymemory.translated.net).
 * This is plain machine translation — it ignores mode/tone/style and does not
 * run the professional review pipeline — so results are surfaced honestly as
 * "MyMemory" in the UI. Chosen as a no-key, low-footprint backend.
 */
const ENDPOINT = "https://api.mymemory.translated.net/get";
// MyMemory caps each `q` at ~500 bytes; stay comfortably under it.
const MAX_BYTES = 480;

/** Map our internal language codes to the codes MyMemory expects. */
const CODE_MAP: Record<string, string> = {
  "en-US": "en-US",
  "en-GB": "en-GB",
  "ar-MSA": "ar",
  "ar-SA": "ar",
  "es-ES": "es-ES",
  "es-419": "es-419",
  "fr-FR": "fr-FR",
  "de-DE": "de-DE",
  "pt-BR": "pt-BR",
  "pt-PT": "pt-PT",
  "it-IT": "it-IT",
  "nl-NL": "nl-NL",
  "ru-RU": "ru-RU",
  "tr-TR": "tr-TR",
  "fa-IR": "fa",
  "ur-PK": "ur",
  "hi-IN": "hi",
  "bn-BD": "bn",
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW",
  "ja-JP": "ja",
  "ko-KR": "ko",
  "id-ID": "id",
  "th-TH": "th",
};

const byteLen = (s: string) => new TextEncoder().encode(s).length;

export class MyMemoryProvider implements TranslationProvider {
  readonly id = "mymemory" as const;

  async translate(params: TranslateParams): Promise<TranslateResult> {
    const target = CODE_MAP[params.target] ?? params.target.split("-")[0];

    let sourceCode: string;
    let detectedLabel: string | undefined;
    if (params.source === AUTO_DETECT.code) {
      sourceCode = detectByScript(params.text);
      detectedLabel = `${sourceCode} (by script)`;
    } else {
      sourceCode = CODE_MAP[params.source] ?? params.source.split("-")[0];
    }

    if (sourceCode.split("-")[0] === target.split("-")[0]) {
      throw new Error(
        "MyMemory needs two different languages. Pick a source language that differs from the target.",
      );
    }

    const chunks = splitIntoChunks(params.text, MAX_BYTES);
    const outputs: string[] = [];
    const matches: number[] = [];

    for (const chunk of chunks) {
      if (!chunk.trim()) {
        outputs.push(chunk); // preserve blank lines / whitespace verbatim
        continue;
      }
      const { text, match } = await translateChunk(chunk, sourceCode, target);
      outputs.push(text);
      if (typeof match === "number") matches.push(match);
    }

    const confidence = matches.length
      ? matches.reduce((a, b) => a + b, 0) / matches.length
      : undefined;

    const notes = [
      "Translated by MyMemory — free machine translation. Mode, tone, and style are not applied on this backend.",
    ];
    if (chunks.length > 1) {
      notes.push(`Long text was split into ${chunks.length} segments to fit MyMemory's per-request limit.`);
    }

    return {
      translatedText: outputs.join(""),
      detectedSource: detectedLabel,
      confidence,
      notes,
      provider: "mymemory",
      model: "mymemory",
    };
  }
}

async function translateChunk(
  chunk: string,
  source: string,
  target: string,
): Promise<{ text: string; match?: number }> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("q", chunk);
  url.searchParams.set("langpair", `${source}|${target}`);

  let data: MyMemoryResponse;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Lingua/1.0 (translation app)" } });
    data = (await res.json()) as MyMemoryResponse;
  } catch {
    throw new Error("Could not reach MyMemory. Check your internet connection and try again.");
  }

  const translated = data.responseData?.translatedText ?? "";
  const status = data.responseStatus;
  const looksLikeError =
    /MYMEMORY WARNING|INVALID|SELECT TWO DISTINCT|YOU USED ALL|QUERY LENGTH LIMIT/i.test(translated);

  if ((typeof status === "number" && status !== 200) || looksLikeError || !translated) {
    if (/YOU USED ALL/i.test(translated)) {
      throw new Error("MyMemory's free daily limit has been reached. Try again tomorrow, or add an Anthropic key for unlimited, higher-quality translation.");
    }
    throw new Error(translated || `MyMemory returned an error (status ${status}).`);
  }

  return { text: decodeEntities(translated), match: data.responseData?.match };
}

/** Guess a source language from the dominant script — MyMemory has no auto-detect. */
function detectByScript(text: string): string {
  if (/[぀-ヿ]/.test(text)) return "ja"; // kana ⇒ Japanese
  if (/[가-힯]/.test(text)) return "ko"; // Hangul
  if (/[一-鿿]/.test(text)) return "zh-CN"; // Han (no kana) ⇒ Chinese
  if (/[؀-ۿ]/.test(text)) return "ar"; // Arabic script (also fa/ur)
  if (/[Ѐ-ӿ]/.test(text)) return "ru"; // Cyrillic
  if (/[฀-๿]/.test(text)) return "th"; // Thai
  if (/[ऀ-ॿ]/.test(text)) return "hi"; // Devanagari
  if (/[ঀ-৿]/.test(text)) return "bn"; // Bengali
  return "en"; // Latin default
}

/** Split text into byte-bounded chunks, preferring sentence and word boundaries. */
function splitIntoChunks(text: string, maxBytes: number): string[] {
  if (byteLen(text) <= maxBytes) return [text];

  const pieces = text.match(/[^.!?。！？\n]+[.!?。！？]?|\n+/g) ?? [text];
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current) chunks.push(current);
    current = "";
  };

  for (const piece of pieces) {
    if (byteLen(current + piece) <= maxBytes) {
      current += piece;
      continue;
    }
    flush();
    if (byteLen(piece) <= maxBytes) {
      current = piece;
    } else {
      // Sentence itself too long: split on whitespace.
      for (const word of piece.split(/(\s+)/)) {
        if (byteLen(current + word) > maxBytes) {
          flush();
          current = word;
        } else {
          current += word;
        }
      }
    }
  }
  flush();
  return chunks;
}

/** MyMemory HTML-escapes some output; decode the common entities. */
function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

interface MyMemoryResponse {
  responseData?: { translatedText?: string; match?: number };
  responseStatus?: number | string;
}
