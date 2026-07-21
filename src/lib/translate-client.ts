import type { TranslateParams, TranslateResult } from "./providers/types";
import { AUTO_DETECT } from "./languages";
import { toFlores, detectFlores } from "./flores";

/**
 * Browser-side translation using an on-device NLLB-200 model (Transformers.js
 * running in a Web Worker). No API key, no backend, no external translation
 * service — everything runs in the visitor's browser. See public/translator.worker.js.
 */

export const CLIENT_TRANSLATE_MODE =
  process.env.NEXT_PUBLIC_TRANSLATE_MODE === "client";

export interface ClientProgress {
  /** "downloading" the model (first use), then "translating". */
  stage: "downloading" | "translating";
  /** 0–100 while downloading. */
  percent?: number;
  loadedBytes?: number;
  totalBytes?: number;
  /** Chunk counters while translating longer text. */
  done?: number;
  totalChunks?: number;
}

let worker: Worker | null = null;
let requestId = 0;

function getWorker(): Worker {
  if (worker) return worker;
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  worker = new Worker(`${base}/translator.worker.js`, { type: "module" });
  return worker;
}

export function translateInBrowser(
  params: TranslateParams,
  onProgress?: (p: ClientProgress) => void,
): Promise<TranslateResult> {
  const detected =
    params.source === AUTO_DETECT.code ? detectFlores(params.text) : null;
  const srcLang = detected ? detected.code : toFlores(params.source);
  const tgtLang = toFlores(params.target);

  if (!srcLang) {
    return Promise.reject(new Error("This source language isn't supported by the on-device model yet."));
  }
  if (!tgtLang) {
    return Promise.reject(new Error("This target language isn't supported by the on-device model yet."));
  }

  const id = ++requestId;
  const w = getWorker();
  // Track bytes per file so overall download % is accurate across model files.
  const files: Record<string, { loaded: number; total: number }> = {};

  return new Promise((resolve, reject) => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      // Result/error/translating messages are per-request; ignore other ids.
      if (msg.id != null && msg.id !== id) return;

      switch (msg.type) {
        case "download": {
          if (msg.file && msg.total) {
            files[msg.file] = { loaded: msg.loaded || 0, total: msg.total || 0 };
          }
          const totals = Object.values(files);
          const loaded = totals.reduce((s, f) => s + f.loaded, 0);
          const total = totals.reduce((s, f) => s + f.total, 0);
          onProgress?.({
            stage: "downloading",
            percent: total ? (loaded / total) * 100 : 0,
            loadedBytes: loaded,
            totalBytes: total,
          });
          break;
        }
        case "translating":
          onProgress?.({ stage: "translating", done: msg.done, totalChunks: msg.total });
          break;
        case "result":
          w.removeEventListener("message", handler);
          resolve({
            translatedText: msg.text,
            detectedSource: detected ? detected.label : undefined,
            provider: "local",
            model: "NLLB-200 · on-device",
            notes: [
              `Translated entirely in your browser — no text was sent to a server or external service.${
                msg.device === "webgpu" ? " (GPU-accelerated)" : ""
              }`,
            ],
          });
          break;
        case "error":
          w.removeEventListener("message", handler);
          reject(new Error(msg.message || "On-device translation failed."));
          break;
      }
    };

    w.addEventListener("message", handler);
    w.postMessage({ id, text: params.text, src_lang: srcLang, tgt_lang: tgtLang });
  });
}
