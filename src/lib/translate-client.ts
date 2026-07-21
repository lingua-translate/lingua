import type { TranslateParams, TranslateResult } from "./providers/types";
import { AUTO_DETECT } from "./languages";
import { toModelLang, detectModelLang } from "./model-langs";

/**
 * Browser-side translation using an on-device M2M-100 model (Transformers.js
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
    params.source === AUTO_DETECT.code ? detectModelLang(params.text) : null;
  const srcLang = detected ? detected.code : toModelLang(params.source);
  const tgtLang = toModelLang(params.target);

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
    // A worker-level error (e.g. the browser runs out of memory loading the
    // model on a low-end device) would otherwise leave the UI spinning.
    const onError = (e: ErrorEvent) => {
      w.removeEventListener("message", handler);
      w.removeEventListener("error", onError);
      reject(
        new Error(
          "The translation model couldn't load on this device — it may not have enough memory. Try a desktop browser, or a device with more RAM.",
        ),
      );
      // The worker may be in a bad state; drop it so the next attempt is fresh.
      worker?.terminate();
      worker = null;
      if (e) e.preventDefault?.();
    };

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
          w.removeEventListener("error", onError);
          resolve({
            translatedText: msg.text,
            detectedSource: detected ? detected.label : undefined,
            provider: "local",
            model: "M2M-100 · on-device",
            notes: [
              `Translated entirely in your browser — no text was sent to a server or external service.${
                msg.device === "webgpu" ? " (GPU-accelerated)" : ""
              }`,
            ],
          });
          break;
        case "error":
          w.removeEventListener("message", handler);
          w.removeEventListener("error", onError);
          reject(new Error(msg.message || "On-device translation failed."));
          break;
      }
    };

    w.addEventListener("message", handler);
    w.addEventListener("error", onError);
    w.postMessage({ id, text: params.text, src_lang: srcLang, tgt_lang: tgtLang });
  });
}
