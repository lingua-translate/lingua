/**
 * Maps the app's internal language codes to the ISO codes the on-device
 * M2M-100 model uses. Every language variant in the app is covered, so any
 * pair the UI offers can be translated in the browser. (M2M-100 has no
 * separate script/dialect variants, so e.g. both Chinese variants map to "zh".)
 */
const MODEL_LANG: Record<string, string> = {
  "en-US": "en",
  "en-GB": "en",
  "ar-MSA": "ar",
  "ar-SA": "ar",
  "es-ES": "es",
  "es-419": "es",
  "fr-FR": "fr",
  "de-DE": "de",
  "pt-BR": "pt",
  "pt-PT": "pt",
  "it-IT": "it",
  "nl-NL": "nl",
  "ru-RU": "ru",
  "tr-TR": "tr",
  "fa-IR": "fa",
  "ur-PK": "ur",
  "hi-IN": "hi",
  "bn-BD": "bn",
  "zh-Hans": "zh",
  "zh-Hant": "zh",
  "ja-JP": "ja",
  "ko-KR": "ko",
  "id-ID": "id",
  "th-TH": "th",
};

export function toModelLang(code: string): string | undefined {
  return MODEL_LANG[code];
}

/**
 * Best-effort source detection by dominant script (the model needs an explicit
 * source). Returns a model language code plus an English label for the UI.
 */
export function detectModelLang(text: string): { code: string; label: string } {
  if (/[぀-ヿ]/.test(text)) return { code: "ja", label: "Japanese" };
  if (/[가-힯]/.test(text)) return { code: "ko", label: "Korean" };
  if (/[一-鿿]/.test(text)) return { code: "zh", label: "Chinese" };
  if (/[؀-ۿ]/.test(text)) return { code: "ar", label: "Arabic" };
  if (/[Ѐ-ӿ]/.test(text)) return { code: "ru", label: "Russian" };
  if (/[฀-๿]/.test(text)) return { code: "th", label: "Thai" };
  if (/[ऀ-ॿ]/.test(text)) return { code: "hi", label: "Hindi" };
  if (/[ঀ-৿]/.test(text)) return { code: "bn", label: "Bengali" };
  return { code: "en", label: "English" };
}
