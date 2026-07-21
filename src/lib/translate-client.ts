import type { TranslateParams, TranslateResult } from "./providers/types";
import { AUTO_DETECT } from "./languages";
import { toModelLang, detectModelLang } from "./model-langs";

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
const MAX_CHUNK = 450; // keep each request small (MyMemory ~500-byte limit)

type ProviderId = "mymemory" | "lingva";

interface Provider {
  id: ProviderId;
  label: string;
  translateChunk: (
    text: string,
    src: string,
    tgt: string,
    isAuto: boolean,
    signal: AbortSignal,
  ) => Promise<string>;
}

/** Run a fetch-based task with a hard timeout so the UI can never hang. */
function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fn(ctrl.signal).finally(() => clearTimeout(timer));
}

const PROVIDERS: Provider[] = [
  {
    // Primary: stable, CORS-enabled, no key. Proven to work from the live site.
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
      return decodeEntities(out);
    },
  },
  {
    // Fallback: Lingva (Google-quality, CORS-enabled). Tried only if MyMemory
    // fails (e.g. daily limit). Best-effort across a couple of public instances.
    id: "lingva",
    label: "Lingva",
    async translateChunk(text, src, tgt, isAuto, signal) {
      const instances = ["https://lingva.ml", "https://translate.plausibility.cloud"];
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
          if (data?.translation) return data.translation as string;
          lastErr = new Error("Lingva: empty response");
        } catch (e) {
          lastErr = e;
          if (signal.aborted) break;
        }
      }
      throw lastErr instanceof Error ? lastErr : new Error("Lingva failed");
    },
  },
];

export async function translateInBrowser(
  params: TranslateParams,
  onProgress?: (p: ClientProgress) => void,
): Promise<TranslateResult> {
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
      let done = 0;
      for (const chunk of chunks) {
        if (!chunk.trim()) {
          parts.push(chunk); // preserve blank lines / spacing verbatim
          continue;
        }
        const translated = await withTimeout(
          (signal) => provider.translateChunk(chunk, src, tgt, isAuto, signal),
          FETCH_TIMEOUT_MS,
        );
        parts.push(translated);
        done += 1;
        onProgress?.({ stage: "translating", done, totalChunks });
      }
      return {
        translatedText: parts.join(""),
        detectedSource: detected ? detected.label : undefined,
        provider: provider.id,
        model: provider.label,
        notes: [
          `Translated via ${provider.label} — free online translation, nothing to install.`,
        ],
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
