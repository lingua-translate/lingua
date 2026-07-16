import type { ProviderId, TranslationProvider } from "./types";
import { ClaudeProvider } from "./claude";
import { MyMemoryProvider } from "./mymemory";
import { MockProvider } from "./mock";

export type { TranslateParams, TranslateResult, TranslationProvider, ProviderId } from "./types";

let cached: TranslationProvider | null = null;

/**
 * Resolves which provider should serve requests, given the environment.
 *   TRANSLATION_PROVIDER = claude | mymemory | mock | auto  (default: auto)
 *   auto -> Claude when ANTHROPIC_API_KEY is set, otherwise the mock.
 * Set it explicitly to "mymemory" to use the free, keyless backend.
 */
export function resolveProviderId(): ProviderId {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  const forced = (process.env.TRANSLATION_PROVIDER || "auto").toLowerCase();

  if (forced === "claude") return "claude";
  if (forced === "mymemory") return "mymemory";
  if (forced === "mock") return "mock";
  // auto:
  return key ? "claude" : "mock";
}

export function getProvider(): TranslationProvider {
  if (cached) return cached;

  const id = resolveProviderId();
  if (id === "claude") {
    const key = process.env.ANTHROPIC_API_KEY?.trim();
    if (!key) throw new Error("TRANSLATION_PROVIDER=claude but ANTHROPIC_API_KEY is not set.");
    cached = new ClaudeProvider(key);
  } else if (id === "mymemory") {
    cached = new MyMemoryProvider();
  } else {
    cached = new MockProvider();
  }
  return cached;
}

/** Whether a real (non-mock) backend is active — used to inform the UI honestly. */
export function isRealProviderConfigured(): boolean {
  return resolveProviderId() !== "mock";
}
