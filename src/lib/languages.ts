export type Direction = "ltr" | "rtl";

export interface Language {
  /** Stable identifier used across the app + sent to the AI provider. */
  code: string;
  /** English display name. */
  name: string;
  /** Endonym (name in the language itself), shown as a subtitle. */
  native: string;
  direction: Direction;
  /** Optional regional/dialect qualifier, e.g. "United States". */
  variant?: string;
  /** Two-letter flag-ish region code used only for the small badge. */
  region?: string;
}

/**
 * Version-1 language set (Part 1 of the spec): ~20 major languages and
 * variants, chosen for quality over quantity. Adding a language later is a
 * one-line append here — no architectural change required.
 */
export const LANGUAGES: Language[] = [
  { code: "en-US", name: "English", native: "English", variant: "United States", direction: "ltr", region: "US" },
  { code: "en-GB", name: "English", native: "English", variant: "United Kingdom", direction: "ltr", region: "GB" },
  { code: "ar-MSA", name: "Arabic", native: "العربية الفصحى", variant: "Modern Standard", direction: "rtl", region: "AR" },
  { code: "ar-SA", name: "Arabic", native: "العربية", variant: "Saudi", direction: "rtl", region: "SA" },
  { code: "es-ES", name: "Spanish", native: "Español", variant: "Spain", direction: "ltr", region: "ES" },
  { code: "es-419", name: "Spanish", native: "Español", variant: "Latin America", direction: "ltr", region: "MX" },
  { code: "fr-FR", name: "French", native: "Français", variant: "France", direction: "ltr", region: "FR" },
  { code: "de-DE", name: "German", native: "Deutsch", direction: "ltr", region: "DE" },
  { code: "pt-BR", name: "Portuguese", native: "Português", variant: "Brazil", direction: "ltr", region: "BR" },
  { code: "pt-PT", name: "Portuguese", native: "Português", variant: "Portugal", direction: "ltr", region: "PT" },
  { code: "it-IT", name: "Italian", native: "Italiano", direction: "ltr", region: "IT" },
  { code: "nl-NL", name: "Dutch", native: "Nederlands", direction: "ltr", region: "NL" },
  { code: "ru-RU", name: "Russian", native: "Русский", direction: "ltr", region: "RU" },
  { code: "tr-TR", name: "Turkish", native: "Türkçe", direction: "ltr", region: "TR" },
  { code: "fa-IR", name: "Persian", native: "فارسی", variant: "Farsi", direction: "rtl", region: "IR" },
  { code: "ur-PK", name: "Urdu", native: "اردو", direction: "rtl", region: "PK" },
  { code: "hi-IN", name: "Hindi", native: "हिन्दी", direction: "ltr", region: "IN" },
  { code: "bn-BD", name: "Bengali", native: "বাংলা", direction: "ltr", region: "BD" },
  { code: "zh-Hans", name: "Chinese", native: "简体中文", variant: "Simplified", direction: "ltr", region: "CN" },
  { code: "zh-Hant", name: "Chinese", native: "繁體中文", variant: "Traditional", direction: "ltr", region: "TW" },
  { code: "ja-JP", name: "Japanese", native: "日本語", direction: "ltr", region: "JP" },
  { code: "ko-KR", name: "Korean", native: "한국어", direction: "ltr", region: "KR" },
  { code: "id-ID", name: "Indonesian", native: "Bahasa Indonesia", direction: "ltr", region: "ID" },
  { code: "th-TH", name: "Thai", native: "ไทย", direction: "ltr", region: "TH" },
];

export const AUTO_DETECT: Language = {
  code: "auto",
  name: "Detect language",
  native: "Automatic",
  direction: "ltr",
};

const byCode = new Map(LANGUAGES.map((l) => [l.code, l]));

export function getLanguage(code: string): Language {
  if (code === AUTO_DETECT.code) return AUTO_DETECT;
  return byCode.get(code) ?? AUTO_DETECT;
}

/** Full human label incl. variant, e.g. "Arabic — Modern Standard". */
export function languageLabel(lang: Language): string {
  return lang.variant ? `${lang.name} — ${lang.variant}` : lang.name;
}

/** Instruction string handed to the AI, e.g. "Modern Standard Arabic (العربية الفصحى)". */
export function languageInstruction(lang: Language): string {
  const base = lang.variant ? `${lang.variant} ${lang.name}` : lang.name;
  return `${base} (${lang.native})`;
}
