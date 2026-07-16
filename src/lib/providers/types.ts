/**
 * Provider abstraction. The rest of the app talks only to this interface, so
 * the AI backend (Claude, a mock, or anything else) can be swapped without
 * touching the UI or API route. See Part 9 — modularity.
 */

export interface TranslateParams {
  text: string;
  /** Source language code or "auto". */
  source: string;
  /** Target language code. */
  target: string;
  /** Translation mode/preset id (see lib/modes.ts). */
  mode: string;
  /** Optional tone; "Automatic" lets the model infer it. */
  tone?: string;
  /** 0 = strictly literal … 100 = fully natural. */
  style?: number;
}

export interface TranslateResult {
  translatedText: string;
  /** Detected source language code when source was "auto". */
  detectedSource?: string;
  /** 0–1 confidence in the overall translation, when the provider reports it. */
  confidence?: number;
  /** Short human-readable notes the model chose to surface (optional). */
  notes?: string[];
  /** Which provider produced this result — surfaced honestly in the UI. */
  provider: ProviderId;
  model?: string;
}

export type ProviderId = "claude" | "mymemory" | "mock";

export interface TranslationProvider {
  readonly id: ProviderId;
  translate(params: TranslateParams): Promise<TranslateResult>;
}
