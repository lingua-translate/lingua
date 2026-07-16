import { MyMemoryProvider } from "./providers/mymemory";
import type { TranslateParams, TranslateResult } from "./providers/types";

/**
 * Browser-side translation path for the static (GitHub Pages) build, where
 * there is no server API route. MyMemory sends `Access-Control-Allow-Origin: *`,
 * so it can be called directly from the page. Imported straight from the
 * MyMemory provider (never through the index) so the Anthropic SDK is not
 * pulled into the client bundle.
 */
const provider = new MyMemoryProvider();

export function translateInBrowser(params: TranslateParams): Promise<TranslateResult> {
  return provider.translate(params);
}

/** True when the app was built for static hosting (no server API available). */
export const CLIENT_TRANSLATE_MODE =
  process.env.NEXT_PUBLIC_TRANSLATE_MODE === "client";
