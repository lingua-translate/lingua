/**
 * Maps the app's internal language codes to the FLORES-200 codes NLLB-200 uses
 * (script-tagged, e.g. "arb_Arab"). Every language variant in the app is
 * covered, so any pair the UI offers can be translated on-device.
 */
const FLORES: Record<string, string> = {
  "en-US": "eng_Latn",
  "en-GB": "eng_Latn",
  "ar-MSA": "arb_Arab", // Modern Standard Arabic
  "ar-SA": "arb_Arab", // NLLB has no separate Saudi variant; MSA is the closest
  "es-ES": "spa_Latn",
  "es-419": "spa_Latn",
  "fr-FR": "fra_Latn",
  "de-DE": "deu_Latn",
  "pt-BR": "por_Latn",
  "pt-PT": "por_Latn",
  "it-IT": "ita_Latn",
  "nl-NL": "nld_Latn",
  "ru-RU": "rus_Cyrl",
  "tr-TR": "tur_Latn",
  "fa-IR": "pes_Arab", // Western Persian
  "ur-PK": "urd_Arab",
  "hi-IN": "hin_Deva",
  "bn-BD": "ben_Beng",
  "zh-Hans": "zho_Hans",
  "zh-Hant": "zho_Hant",
  "ja-JP": "jpn_Jpan",
  "ko-KR": "kor_Hang",
  "id-ID": "ind_Latn",
  "th-TH": "tha_Thai",
};

export function toFlores(code: string): string | undefined {
  return FLORES[code];
}

/**
 * Best-effort source detection by dominant script (NLLB needs an explicit
 * source). Returns a FLORES code plus an English label for the UI.
 */
export function detectFlores(text: string): { code: string; label: string } {
  if (/[぀-ヿ]/.test(text)) return { code: "jpn_Jpan", label: "Japanese" };
  if (/[가-힯]/.test(text)) return { code: "kor_Hang", label: "Korean" };
  if (/[一-鿿]/.test(text)) return { code: "zho_Hans", label: "Chinese" };
  if (/[؀-ۿ]/.test(text)) return { code: "arb_Arab", label: "Arabic" };
  if (/[Ѐ-ӿ]/.test(text)) return { code: "rus_Cyrl", label: "Russian" };
  if (/[฀-๿]/.test(text)) return { code: "tha_Thai", label: "Thai" };
  if (/[ऀ-ॿ]/.test(text)) return { code: "hin_Deva", label: "Hindi" };
  if (/[ঀ-৿]/.test(text)) return { code: "ben_Beng", label: "Bengali" };
  return { code: "eng_Latn", label: "English" };
}
