import Anthropic from "@anthropic-ai/sdk";
import type { TranslateParams, TranslateResult, TranslationProvider } from "./types";
import { buildSystemPrompt } from "./prompt";

const DEFAULT_MODEL = "claude-opus-4-8";

/**
 * Real translation backend powered by the Claude API. Implements the
 * multi-stage professional pipeline via a single strong, structured pass.
 */
export class ClaudeProvider implements TranslationProvider {
  readonly id = "claude" as const;
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = process.env.TRANSLATION_MODEL || DEFAULT_MODEL) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async translate(params: TranslateParams): Promise<TranslateResult> {
    const system = buildSystemPrompt(params);

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 8192,
      temperature: 0.2,
      system,
      messages: [{ role: "user", content: params.text }],
    });

    const raw = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    const parsed = safeParse(raw);

    return {
      translatedText: parsed.translation ?? raw,
      detectedSource: parsed.detectedSource ?? undefined,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : undefined,
      notes: Array.isArray(parsed.notes) ? parsed.notes.slice(0, 3) : undefined,
      provider: "claude",
      model: this.model,
    };
  }
}

interface ParsedResponse {
  translation?: string;
  detectedSource?: string | null;
  confidence?: number;
  notes?: string[];
}

/** Tolerant JSON extraction: models occasionally wrap output in prose/fences. */
function safeParse(raw: string): ParsedResponse {
  const attempt = (s: string): ParsedResponse | null => {
    try {
      return JSON.parse(s) as ParsedResponse;
    } catch {
      return null;
    }
  };

  const direct = attempt(raw);
  if (direct) return direct;

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    const inner = attempt(fenced[1].trim());
    if (inner) return inner;
  }

  const braced = raw.match(/\{[\s\S]*\}/);
  if (braced) {
    const inner = attempt(braced[0]);
    if (inner) return inner;
  }

  // Fall back to treating the whole response as the translation.
  return { translation: raw };
}
