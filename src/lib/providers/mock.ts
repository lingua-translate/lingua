import type { TranslateParams, TranslateResult, TranslationProvider } from "./types";
import { getLanguage, languageLabel } from "@/lib/languages";

/**
 * Deterministic fallback used when no ANTHROPIC_API_KEY is configured, so the
 * entire UI works end to end during development and evaluation. It does NOT
 * perform real translation and says so honestly — never present its output as
 * a genuine translation.
 */
export class MockProvider implements TranslationProvider {
  readonly id = "mock" as const;

  async translate(params: TranslateParams): Promise<TranslateResult> {
    // Simulate realistic processing latency so the staged UI is exercised.
    await new Promise((r) => setTimeout(r, 500 + Math.min(params.text.length, 1500)));

    const target = getLanguage(params.target);

    return {
      translatedText: params.text,
      detectedSource: params.source === "auto" ? "English (mock detection)" : undefined,
      confidence: 0.5,
      notes: [
        `Mock provider active — no AI key configured, so the source text is echoed unchanged.`,
        `Set ANTHROPIC_API_KEY to translate into ${languageLabel(target)} for real.`,
      ],
      provider: "mock",
      model: "mock",
    };
  }
}
