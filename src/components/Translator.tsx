"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Copy,
  Check,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  Upload,
  Languages,
  SlidersHorizontal,
} from "lucide-react";
import {
  LANGUAGES,
  AUTO_DETECT,
  getLanguage,
  languageLabel,
  type Language,
} from "@/lib/languages";
import { cn, countWords, formatCount, readingTimeMinutes } from "@/lib/utils";
import { MODES, TONES, getMode, styleLabel } from "@/lib/modes";
import type { TranslateResult } from "@/lib/providers/types";
import { translateInBrowser } from "@/lib/translate-client";
import { extractDocument } from "@/lib/documents";
import { Dropdown, type DropdownItem } from "@/components/ui/Dropdown";

/** File types offered in the picker (text now; PDF/DOCX show a "coming soon"). */
const FILE_ACCEPT =
  ".txt,.text,.md,.markdown,.csv,.tsv,.json,.log,.srt,.vtt,.xml,.html,.htm,.pdf,.docx,.doc,text/*";
/** How long to wait after the user stops typing before auto-translating. */
const DEBOUNCE_MS = 450;

function langItems(includeAuto: boolean): DropdownItem[] {
  const items: DropdownItem[] = LANGUAGES.map((l) => ({
    value: l.code,
    label: languageLabel(l),
    sublabel: l.native,
    badge: l.region,
    rtl: l.direction === "rtl",
  }));
  if (includeAuto) {
    items.unshift({ value: AUTO_DETECT.code, label: "Detect language", sublabel: "Automatic" });
  }
  return items;
}

export interface TranslatorProps {
  initialTarget?: string;
}

export function Translator({ initialTarget = "ar-MSA" }: TranslatorProps) {
  const [source, setSource] = useState(AUTO_DETECT.code);
  const [target, setTarget] = useState(initialTarget);
  const [mode, setMode] = useState("professional");
  const [tone, setTone] = useState<string>("Automatic");
  const [style, setStyle] = useState(getMode("professional").defaultStyle);
  const [styleTouched, setStyleTouched] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const sourceItems = useMemo(() => langItems(true), []);
  const targetItems = useMemo(() => langItems(false), []);
  const toneItems: DropdownItem[] = useMemo(
    () => TONES.map((t) => ({ value: t, label: t })),
    [],
  );
  const modeItems: DropdownItem[] = useMemo(
    () => MODES.map((m) => ({ value: m.id, label: m.name, sublabel: m.description })),
    [],
  );
  const activeMode = getMode(mode);
  const targetLang: Language = getLanguage(target);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reqIdRef = useRef(0);

  // Apply a ?to= deep link once on mount.
  useEffect(() => {
    const to = new URLSearchParams(window.location.search).get("to");
    if (to && LANGUAGES.some((l) => l.code === to)) setTarget(to);
  }, []);

  // Each mode has a default style; reset to it when the mode changes, unless
  // the user has moved the slider themselves.
  useEffect(() => {
    if (!styleTouched) setStyle(getMode(mode).defaultStyle);
  }, [mode, styleTouched]);

  // Auto-translate: whenever the text or languages change, translate after a
  // short pause. The previous result stays on screen until the new one lands,
  // and stale responses are ignored so the output never flickers or races.
  useEffect(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      reqIdRef.current++;
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }
    const id = ++reqIdRef.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await translateInBrowser({ text, source, target, mode, tone, style });
        if (reqIdRef.current !== id) return;
        setResult(data);
      } catch (e) {
        if (reqIdRef.current !== id) return;
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        if (reqIdRef.current === id) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, source, target, mode, tone, style]);

  const words = countWords(text);
  const chars = text.length;

  // The language we'd treat as "source" when swapping — the chosen source, or
  // the detected language when the field is left on "Detect language".
  const effectiveSource =
    source === AUTO_DETECT.code ? result?.detectedCode : source;
  const canSwap = Boolean(effectiveSource) && effectiveSource !== target;

  const swap = () => {
    if (!effectiveSource) return;
    // Reverse the pair and move the translation into the input so it becomes
    // the new source text (which then auto-translates back). The detected
    // label updates automatically once the new source is a concrete language.
    setSource(target);
    setTarget(effectiveSource);
    if (result) setText(result.translatedText);
  };

  const clearAll = () => {
    setText("");
    setResult(null);
    setError(null);
    setFileName(null);
  };

  async function handleFile(file: File) {
    const doc = await extractDocument(file);
    if (!doc.supported) {
      setError(doc.message ?? "Unsupported file type.");
      return;
    }
    setError(null);
    setFileName(doc.baseName);
    setText(doc.text);
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const copyOut = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.translatedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName || "translation"}_${target}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sourceLabel =
    source === AUTO_DETECT.code
      ? result?.detectedSource
        ? `Detected · ${result.detectedSource}`
        : "Detect language"
      : undefined;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:px-6">
      {/* Language bar */}
      <div className="card flex flex-col items-stretch gap-2 p-2.5 sm:flex-row sm:items-center sm:gap-3 sm:p-3">
        <Dropdown
          items={sourceItems}
          value={source}
          onChange={setSource}
          triggerContent={sourceLabel}
          ariaLabel="Source language"
          className="flex-1"
          widthClass="w-72"
        />
        <button
          onClick={swap}
          disabled={!canSwap}
          className="btn-ghost mx-auto h-10 w-10 shrink-0 rounded-full border border-border transition-transform hover:rotate-180 disabled:rotate-0 disabled:opacity-40 sm:mx-0"
          aria-label="Swap source and target languages"
          title={canSwap ? "Swap languages" : "Type some text to swap"}
        >
          <ArrowLeftRight className="h-4 w-4" aria-hidden />
        </button>
        <Dropdown
          items={targetItems}
          value={target}
          onChange={setTarget}
          ariaLabel="Target language"
          className="flex-1"
          align="end"
          widthClass="w-72"
        />
      </div>

      {/* Translation controls: mode, tone, and the literal↔natural style */}
      <div className="card flex flex-col gap-3 p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="px-0.5 text-xs font-medium text-muted">Translation mode</span>
            <Dropdown items={modeItems} value={mode} onChange={setMode} ariaLabel="Translation mode" widthClass="w-80" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="px-0.5 text-xs font-medium text-muted">Tone</span>
            <Dropdown items={toneItems} value={tone} onChange={setTone} ariaLabel="Tone" align="end" widthClass="w-56" />
          </label>
        </div>

        <p className="flex items-start gap-1.5 px-0.5 text-xs text-muted">
          <activeMode.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
          <span>
            <span className="font-medium text-foreground">{activeMode.name}:</span> {activeMode.useCase}
          </span>
        </p>

        <div className="rounded-xl bg-surface-2 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <SlidersHorizontal className="h-3.5 w-3.5 text-accent" aria-hidden />
              Translation style
            </span>
            <span className="text-xs font-semibold text-foreground">{styleLabel(style)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={style}
            onChange={(e) => {
              setStyle(Number(e.target.value));
              setStyleTouched(true);
            }}
            className="w-full accent-primary"
            aria-label="Translation style from literal to natural"
          />
          <div className="mt-1 flex justify-between text-[11px] text-muted">
            <span>Literal</span>
            <span>Natural</span>
          </div>
        </div>
      </div>

      {/* Editor panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Source */}
        <section
          className={cn(
            "card relative flex min-h-[20rem] flex-col p-0 transition-colors",
            dragOver && "ring-2 ring-primary",
          )}
          aria-label="Source text"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted">
              {source === AUTO_DETECT.code
                ? result?.detectedSource
                  ? `Detected · ${result.detectedSource}`
                  : "Detect language"
                : languageLabel(getLanguage(source))}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-ghost px-2 py-1 text-xs"
                aria-label="Upload a text file"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden /> Upload
              </button>
              {text && (
                <button onClick={clearAll} className="btn-ghost px-2 py-1 text-xs" aria-label="Clear text">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden /> Clear
                </button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={FILE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type, paste, or drop a text file to translate…"
            className="flex-1 resize-none bg-transparent px-4 py-3.5 text-[15px] leading-relaxed text-foreground placeholder:text-muted/60 focus:outline-none scrollbar-slim"
            dir={source !== AUTO_DETECT.code && getLanguage(source).direction === "rtl" ? "rtl" : "ltr"}
            spellCheck={false}
          />
          <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-xs text-muted">
            <span>{formatCount(words)} words</span>
            <span>{formatCount(chars)} chars</span>
            {words > 0 && <span>~{readingTimeMinutes(words)} min read</span>}
            {fileName && <span className="ml-auto truncate">📄 {fileName}</span>}
          </div>
          {dragOver && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-primary-soft/80 text-sm font-medium text-primary">
              Drop your text file to translate
            </div>
          )}
        </section>

        {/* Target */}
        <section className="card flex min-h-[20rem] flex-col p-0" aria-label="Translated text">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {languageLabel(targetLang)}
              {loading && result && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden />}
            </span>
            {result && (
              <div className="flex items-center gap-1">
                <button onClick={copyOut} className="btn-ghost px-2 py-1 text-xs" aria-label="Copy translation">
                  {copied ? <Check className="h-3.5 w-3.5 text-success" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button onClick={download} className="btn-ghost px-2 py-1 text-xs" aria-label="Download translation">
                  <Download className="h-3.5 w-3.5" aria-hidden /> Download
                </button>
              </div>
            )}
          </div>

          <div className="relative flex-1 overflow-y-auto scrollbar-slim">
            {result ? (
              <div
                className="whitespace-pre-wrap px-4 py-3.5 text-[15px] leading-relaxed text-foreground use-script-font"
                dir={targetLang.direction}
                lang={targetLang.code}
              >
                {result.translatedText}
              </div>
            ) : loading ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted" role="status" aria-live="polite">
                <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
                <p className="text-sm">Translating…</p>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-muted">
                <Languages className="h-6 w-6 opacity-50" aria-hidden />
                <p className="text-sm">Your translation appears here as you type.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
