/**
 * On-device translation worker.
 *
 * Runs the NLLB-200 model entirely in the visitor's browser via Transformers.js
 * (loaded from a CDN, model weights fetched once from the Hugging Face hub and
 * cached by the browser). No API key, no backend, no external translation
 * service — every translation happens locally on the user's machine.
 *
 * Lives in /public so it ships verbatim to GitHub Pages (no bundler rewriting).
 */

import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3";

// Only load remote models (weights come from the Hugging Face hub, then cache).
env.allowLocalModels = false;
// GitHub Pages can't send COOP/COEP headers, so SharedArrayBuffer is unavailable
// and multi-threaded WASM would throw — pin to a single thread.
if (!self.crossOriginIsolated && env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
}

const MODEL = "Xenova/nllb-200-distilled-600M";

let translatorPromise = null;
let activeDevice = "wasm";

function loadTranslator() {
  if (translatorPromise) return translatorPromise;

  const progress_callback = (p) => {
    if (p.status === "progress" || p.status === "download" || p.status === "initiate") {
      self.postMessage({
        type: "download",
        file: p.file,
        loaded: p.loaded ?? 0,
        total: p.total ?? 0,
        progress: p.progress ?? 0,
      });
    } else if (p.status === "done") {
      self.postMessage({ type: "download", file: p.file, done: true });
    }
  };

  const build = (device) => {
    activeDevice = device;
    return pipeline("translation", MODEL, { device, dtype: "q8", progress_callback });
  };

  translatorPromise = (async () => {
    // Prefer WebGPU (fast) when available; fall back to WASM (works everywhere).
    if (typeof navigator !== "undefined" && "gpu" in navigator) {
      try {
        return await build("webgpu");
      } catch (e) {
        self.postMessage({ type: "info", message: "WebGPU unavailable; using WASM." });
        translatorPromise = null; // allow a clean rebuild on wasm
      }
    }
    return await build("wasm");
  })();

  return translatorPromise;
}

/** Split text into model-sized chunks, preserving newlines. */
function chunkText(text, maxLen = 300) {
  const segments = text.split(/(\n+)/);
  const chunks = [];
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

self.onmessage = async (event) => {
  const { id, text, src_lang, tgt_lang } = event.data;
  try {
    const translator = await loadTranslator();
    self.postMessage({ type: "ready", device: activeDevice });

    const chunks = chunkText(text);
    const totalChunks = chunks.filter((c) => c.trim()).length || 1;
    let done = 0;
    let out = "";

    for (const c of chunks) {
      if (!c.trim()) {
        out += c; // keep blank lines / spacing verbatim
        continue;
      }
      const res = await translator(c, { src_lang, tgt_lang });
      out += Array.isArray(res) ? res[0].translation_text : res.translation_text;
      done += 1;
      self.postMessage({ type: "translating", id, done, total: totalChunks });
    }

    self.postMessage({ type: "result", id, text: out, device: activeDevice });
  } catch (err) {
    self.postMessage({
      type: "error",
      id,
      message: err && err.message ? err.message : String(err),
    });
  }
};
