import { NextResponse } from "next/server";
import { getProvider, type TranslateParams } from "@/lib/providers";
import { getLanguage, AUTO_DETECT } from "@/lib/languages";
import { getMode } from "@/lib/modes";

export const runtime = "nodejs";
// Never cache translations; each request is unique and may contain private text.
export const dynamic = "force-dynamic";

const MAX_CHARS = 100_000;

export async function POST(request: Request) {
  let body: Partial<TranslateParams>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) {
    return NextResponse.json({ error: "No text provided to translate." }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Text exceeds the ${MAX_CHARS.toLocaleString()} character limit for this milestone.` },
      { status: 413 },
    );
  }

  const target = body.target ?? "";
  if (!target || target === AUTO_DETECT.code) {
    return NextResponse.json({ error: "A target language is required." }, { status: 400 });
  }

  const params: TranslateParams = {
    text,
    source: body.source ?? AUTO_DETECT.code,
    target: getLanguage(target).code,
    mode: getMode(body.mode ?? "professional").id,
    tone: body.tone,
    style: typeof body.style === "number" ? body.style : undefined,
  };

  try {
    const provider = getProvider();
    const result = await provider.translate(params);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Translation failed:", err);
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred during translation.";
    return NextResponse.json(
      { error: `Translation failed: ${message}` },
      { status: 502 },
    );
  }
}
