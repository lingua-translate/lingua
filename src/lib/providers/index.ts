import type { ProviderId, TranslationProvider } from "./types";
import { ClaudeProvider } from "./claude";
import { MockProvider } from "./mock";

export type { TranslateParams, TranslateResult, TranslationProvider, ProviderId } from "./types";

let cached: TranslationProvider | null = null;

/**
 * Server-side provider selection (used only by the optional /api/translate
 * route on server hosts). The deployed GitHub Pages build translates in the
 * browser instead — see lib/translate-client.ts.
 *   TRANSLATION_PROVIDER = claude | mock | auto  (default: auto)
 *   auto -> Claude when ANTHROPIC_API_KEY is set, otherwise the mock.
 */
export function resolveProviderId(): ProviderId {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  const forced = (process.env.TRANSLATION_PROVIDER || "auto").toLowerCase();

  if (forced === "claude") return "claude";
  if (forced === "mock") return "mock";
  return key ? "claude" : "mock";
}

export function getProvider(): TranslationProvider {
  if (cached) return cached;

  const id = resolveProviderId();
  if (id === "claude") {
    const key = process.env.ANTHROPIC_API_KEY?.trim();
    if (!key) throw new Error("TRANSLATION_PROVIDER=claude but ANTHROPIC_API_KEY is not set.");
    cached = new ClaudeProvider(key);
  } else {
    cached = new MockProvider();
  }
  return cached;
}

/** Whether a real (non-mock) server backend is active. */
export function isRealProviderConfigured(): boolean {
  return resolveProviderId() !== "mock";
}
