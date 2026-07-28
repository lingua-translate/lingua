import type { TranslateParams, TranslateResult } from "./providers/types";
import { AUTO_DETECT, getLanguage, languageInstruction } from "./languages";
import { getMode, styleLabel } from "./modes";
import { toModelLang, detectModelLang, isoName } from "./model-langs";

/**
 * Browser-side translation using free public translation APIs, called directly
 * from the visitor's browser. No API key, no backend, no install, no model
 * download — so it works on any device (phones and low-RAM laptops included)
 * and stays fully compatible with static GitHub Pages hosting.
 *
 * Reliability strategy: try providers in order and return the first that
 * succeeds. Every network call has a hard timeout, so the UI never hangs.
 */

export const CLIENT_TRANSLATE_MODE =
  process.env.NEXT_PUBLIC_TRANSLATE_MODE === "client";

export interface ClientProgress {
  stage: "translating";
  done?: number;
  totalChunks?: number;
}

const FETCH_TIMEOUT_MS = 10_000;
const GEMINI_TIMEOUT_MS = 25_000; // the AI model can take a few seconds
const MAX_CHUNK = 450; // keep each request small (MyMemory ~500-byte limit)

// Optional AI backend for tone-aware translation. When a specific tone is
// chosen and this key is configured, we use Google Gemini (free tier) so the
// Tone/Mode/Style controls genuinely change the output. Without it, or if it
// fails, translation falls back to the plain machine-translation chain below.
const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();

type ProviderId = "google" | "lingva" | "mymemory";

interface ChunkResult {
  text: string;
  /** Detected source language (ISO code), when the provider reports it. */
  detected?: string;
}

interface Provider {
  id: ProviderId;
  label: string;
  translateChunk: (
    text: string,
    src: string,
    tgt: string,
    isAuto: boolean,
    signal: AbortSignal,
  ) => Promise<ChunkResult>;
}

/** Run a fetch-based task with a hard timeout so the UI can never hang. */
function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fn(ctrl.signal).finally(() => clearTimeout(timer));
}

const PROVIDERS: Provider[] = [
  {
    // Primary: real machine translation (Google). Best quality, fast, and
    // CORS-verified from the deployed origin. Handles "auto" source natively.
    id: "google",
    label: "Google",
    async translateChunk(text, src, tgt, isAuto, signal) {
      const url = new URL("https://translate.googleapis.com/translate_a/single");
      url.searchParams.set("client", "gtx");
      url.searchParams.set("sl", isAuto ? "auto" : src);
      url.searchParams.set("tl", tgt);
      url.searchParams.set("dt", "t");
      url.searchParams.set("q", text);
      const res = await fetch(url.toString(), { signal });
      if (!res.ok) throw new Error(`Google HTTP ${res.status}`);
      const data = await res.json();
      // Shape: [ [ [translatedSegment, sourceSegment, ...], ... ], ..., detectedLang ]
      const segments = Array.isArray(data?.[0]) ? data[0] : [];
      const out = segments.map((s: unknown[]) => (Array.isArray(s) ? s[0] : "")).join("");
      if (!out) throw new Error("Google: empty response");
      const detected = typeof data?.[2] === "string" ? data[2] : undefined;
      return { text: out, detected };
    },
  },
  {
    // Fallback: Lingva (also Google-backed, CORS-enabled). Best-effort across
    // a couple of public instances.
    id: "lingva",
    label: "Lingva",
    async translateChunk(text, src, tgt, isAuto, signal) {
      const instances = ["https://lingva.ml", "https://lingva.garudalinux.org"];
      const sl = isAuto ? "auto" : src;
      let lastErr: unknown;
      for (const base of instances) {
        try {
          const res = await fetch(
            `${base}/api/v1/${sl}/${tgt}/${encodeURIComponent(text)}`,
            { signal },
          );
          if (!res.ok) {
            lastErr = new Error(`Lingva HTTP ${res.status}`);
            continue;
          }
          const data = await res.json();
          if (data?.translation) {
            const detected = data?.info?.detectedSource;
            return { text: data.translation as string, detected };
          }
          lastErr = new Error("Lingva: empty response");
        } catch (e) {
          lastErr = e;
          if (signal.aborted) break;
        }
      }
      throw lastErr instanceof Error ? lastErr : new Error("Lingva failed");
    },
  },
  {
    // Last resort: MyMemory (crowd-sourced translation memory). Always
    // available, but lower quality for short inputs — used only if the real MT
    // engines above are unreachable. NFKC repairs any broken presentation-form
    // characters it occasionally returns.
    id: "mymemory",
    label: "MyMemory",
    async translateChunk(text, src, tgt, _isAuto, signal) {
      const url = new URL("https://api.mymemory.translated.net/get");
      url.searchParams.set("q", text);
      url.searchParams.set("langpair", `${src}|${tgt}`);
      const res = await fetch(url.toString(), { signal });
      if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
      const data = await res.json();
      const out = data?.responseData?.translatedText ?? "";
      const status = data?.responseStatus;
      if (
        !out ||
        /MYMEMORY WARNING|YOU USED ALL|INVALID|SELECT TWO DISTINCT|QUERY LENGTH/i.test(out) ||
        (typeof status === "number" && status !== 200)
      ) {
        throw new Error(out || `MyMemory status ${status}`);
      }
      return { text: decodeEntities(out).normalize("NFKC") };
    },
  },
];

export async function translateInBrowser(
  params: TranslateParams,
  onProgress?: (p: ClientProgress) => void,
): Promise<TranslateResult> {
  // Tone-aware path: a real AI model rewrites in the requested register.
  // Only used when the user picks a specific (non-Automatic) tone AND a key is
  // configured. On any failure we fall through to plain machine translation.
  if (GEMINI_KEY && params.tone && params.tone !== "Automatic") {
    try {
      onProgress?.({ stage: "translating" });
      return await geminiTranslate(params);
    } catch {
      // fall through to the machine-translation chain
    }
  }

  const isAuto = params.source === AUTO_DETECT.code;
  const detected = isAuto ? detectModelLang(params.text) : null;
  const src = detected ? detected.code : toModelLang(params.source);
  const tgt = toModelLang(params.target);

  if (!src || !tgt) {
    throw new Error("This language pair isn't supported yet.");
  }
  if (src === tgt) {
    return {
      translatedText: params.text,
      provider: "mymemory",
      model: "none",
      notes: ["The source and target are the same language — nothing to translate."],
    };
  }

  const chunks = chunkText(params.text, MAX_CHUNK);
  const totalChunks = chunks.filter((c) => c.trim()).length || 1;

  let lastError: Error | null = null;

  for (const provider of PROVIDERS) {
    try {
      const parts: string[] = [];
      let providerDetected: string | undefined;
      let done = 0;
      for (const chunk of chunks) {
        if (!chunk.trim()) {
          parts.push(chunk); // preserve blank lines / spacing verbatim
          continue;
        }
        const r = await withTimeout(
          (signal) => provider.translateChunk(chunk, src, tgt, isAuto, signal),
          FETCH_TIMEOUT_MS,
        );
        parts.push(r.text);
        if (!providerDetected && r.detected) providerDetected = r.detected;
        done += 1;
        onProgress?.({ stage: "translating", done, totalChunks });
      }
      // Prefer the API's own detection; fall back to our script heuristic.
      const detectedSource = isAuto
        ? isoName(providerDetected) ?? detected?.label
        : undefined;
      return {
        translatedText: parts.join(""),
        detectedSource,
        provider: provider.id,
        model: provider.label,
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      // Fall through to the next provider.
    }
  }

  const msg = lastError?.message ?? "";
  if (/YOU USED ALL|limit/i.test(msg)) {
    throw new Error(
      "The free translation service has reached today's limit for your network. Please try again later.",
    );
  }
  throw new Error(
    "Couldn't reach the translation service. Check your internet connection and try again.",
  );
}

/**
 * Tone-aware translation via Google Gemini (free tier). The tone, mode, and
 * style controls are folded into the prompt so they actually shape the output.
 */
async function geminiTranslate(params: TranslateParams): Promise<TranslateResult> {
  const target = getLanguage(params.target);
  const source =
    params.source === AUTO_DETECT.code ? null : getLanguage(params.source);
  const mode = getMode(params.mode);
  const style = typeof params.style === "number" ? params.style : mode.defaultStyle;

  const prompt = [
    `You are an expert professional translator. Translate the text between <text></text> into ${languageInstruction(target)}.`,
    source
      ? `The source language is ${languageInstruction(source)}.`
      : `Detect the source language automatically.`,
    `Tone and register to use: ${params.tone}. ${mode.guidance}`,
    `Naturalness: aim for "${styleLabel(style)}".`,
    `Rules: Output ONLY the translated text — no quotes, notes, or explanations. Preserve line breaks and formatting. Never alter placeholders like {name}, {{var}}, %s, or URLs. Apply the requested tone consistently: for formal tones use formal grammar and honorifics; for friendly or warm tones use natural, conversational phrasing.`,
    `<text>\n${params.text}\n</text>`,
  ].join("\n");

  // "gemini-flash-latest" tracks the current free-tier Flash model; specific
  // versioned ids (e.g. gemini-2.0-flash) can have a 0 free-tier quota per account.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(
    GEMINI_KEY as string,
  )}`;

  const data = await withTimeout(async (signal) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 },
      }),
      signal,
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    return res.json();
  }, GEMINI_TIMEOUT_MS);

  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((p: { text?: string }) => p.text ?? "").join("").trim()
    : "";
  if (!text) throw new Error("Gemini: empty response");

  return {
    translatedText: text,
    provider: "gemini",
    model: "Gemini",
    notes: [`Translated by Google Gemini in a ${String(params.tone).toLowerCase()} tone.`],
  };
}

/** Split text into small chunks on sentence/whitespace boundaries. */
function chunkText(text: string, maxLen: number): string[] {
  const segments = text.split(/(\n+)/);
  const chunks: string[] = [];
  for (const seg of segments) {
    if (seg === "" || /^\n+$/.test(seg)) {
      chunks.push(seg);
      continue;
    }
    if (seg.length <= maxLen) {
      chunks.push(seg);
      continue;
    }
    const sentences = seg.match(/[^.!?。！？]+[.!?。！？]?|\s+/g) || [seg];
    let cur = "";
    for (const s of sentences) {
      if ((cur + s).length > maxLen && cur) {
        chunks.push(cur);
        cur = s;
      } else {
        cur += s;
      }
    }
    if (cur) chunks.push(cur);
  }
  return chunks;
}

/** Decode the HTML entities MyMemory sometimes returns. */
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
