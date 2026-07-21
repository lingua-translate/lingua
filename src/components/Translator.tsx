"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Copy,
  Check,
  Download,
  Trash2,
  Loader2,
  Sparkles,
  AlertCircle,
  Info,
  SlidersHorizontal,
  Cpu,
} from "lucide-react";
import {
  LANGUAGES,
  AUTO_DETECT,
  getLanguage,
  languageLabel,
  type Language,
} from "@/lib/languages";
import { MODES, TONES, getMode, styleLabel } from "@/lib/modes";
import { cn, countWords, formatCount, readingTimeMinutes } from "@/lib/utils";
import type { TranslateResult } from "@/lib/providers/types";
import {
  translateInBrowser,
  CLIENT_TRANSLATE_MODE,
  type ClientProgress,
} from "@/lib/translate-client";
import { Dropdown, type DropdownItem } from "@/components/ui/Dropdown";

const STAGES = [
  "Analysing text",
  "Detecting language",
  "Preparing terminology",
  "Translating",
  "Reviewing",
  "Quality assurance",
  "Finalising",
];

function langItems(includeAuto: boolean): DropdownItem[] {
  const items: DropdownItem[] = LANGUAGES.map((l) => ({
    value: l.code,
    label: languageLabel(l),
    sublabel: l.native,
    badge: l.region,
    rtl: l.direction === "rtl",
  }));
  if (includeAuto) {
    items.unshift({
      value: AUTO_DETECT.code,
      label: "Detect language",
      sublabel: "Automatic",
    });
  }
  return items;
}

export interface TranslatorProps {
  initialTarget?: string;
  initialMode?: string;
}

export function Translator({
  initialTarget = "ar-MSA",
  initialMode = "professional",
}: TranslatorProps) {
  const [source, setSource] = useState(AUTO_DETECT.code);
  const [target, setTarget] = useState(initialTarget);
  const [mode, setMode] = useState(getMode(initialMode).id);
  const [tone, setTone] = useState<string>("Automatic");
  const [style, setStyle] = useState(getMode(initialMode).defaultStyle);
  const [styleTouched, setStyleTouched] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [text, setText] = useState("");
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState<ClientProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sourceItems = useMemo(() => langItems(true), []);
  const targetItems = useMemo(() => langItems(false), []);
  const modeItems: DropdownItem[] = useMemo(
    () => MODES.map((m) => ({ value: m.id, label: m.name, sublabel: m.description })),
    [],
  );
  const toneItems: DropdownItem[] = useMemo(
    () => TONES.map((t) => ({ value: t, label: t })),
    [],
  );

  const targetLang: Language = getLanguage(target);
  const activeMode = getMode(mode);

  // When the mode changes, reset the style slider to that mode's default —
  // unless the user has manually overridden it.
  useEffect(() => {
    if (!styleTouched) setStyle(activeMode.defaultStyle);
  }, [activeMode, styleTouched]);

  // Apply ?mode= and ?to= deep links client-side (works in both the server and
  // static builds without making the page server-dynamic).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const m = q.get("mode");
    if (m) setMode(getMode(m).id);
    const to = q.get("to");
    if (to && LANGUAGES.some((l) => l.code === to)) setTarget(to);
  }, []);

  // Drive the staged progress indicator while a request is in flight.
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (loading) {
      setStageIndex(0);
      stageTimer.current = setInterval(() => {
        setStageIndex((i) => Math.min(STAGES.length - 1, i + 1));
      }, 650);
    } else if (stageTimer.current) {
      clearInterval(stageTimer.current);
      stageTimer.current = null;
    }
    return () => {
      if (stageTimer.current) clearInterval(stageTimer.current);
    };
  }, [loading]);

  const words = countWords(text);
  const chars = text.length;
  const canTranslate = text.trim().length > 0 && !loading;

  const swap = () => {
    if (source === AUTO_DETECT.code) return;
    setSource(target);
    setTarget(source);
    // Move an existing translation into the source box for round-tripping.
    if (result) {
      setText(result.translatedText);
      setResult(null);
    }
  };

  async function translate() {
    if (!canTranslate) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);
    try {
      const params = { text, source, target, mode, tone, style };
      let data: TranslateResult;
      if (CLIENT_TRANSLATE_MODE) {
        // Deployed build: translate on-device in the browser (Transformers.js).
        data = await translateInBrowser(params, setProgress);
      } else {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Translation failed.");
        data = json as TranslateResult;
      }
      setStageIndex(STAGES.length - 1);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

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
    a.download = `translation_${target}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:px-6">
      {/* Language bar */}
      <div className="card flex flex-col items-stretch gap-3 p-3 sm:flex-row sm:items-center">
        <Dropdown
          items={sourceItems}
          value={source}
          onChange={(v) => {
            setSource(v);
            setResult(null);
          }}
          ariaLabel="Source language"
          className="flex-1"
          widthClass="w-72"
        />
        <button
          onClick={swap}
          disabled={source === AUTO_DETECT.code}
          className="btn-ghost mx-auto h-10 w-10 shrink-0 rounded-full border border-border disabled:opacity-40 sm:mx-0"
          aria-label="Swap languages"
          title={source === AUTO_DETECT.code ? "Choose a source language to swap" : "Swap languages"}
        >
          <ArrowLeftRight className="h-4 w-4" aria-hidden />
        </button>
        <Dropdown
          items={targetItems}
          value={target}
          onChange={(v) => {
            setTarget(v);
            setResult(null);
          }}
          ariaLabel="Target language"
          className="flex-1"
          align="end"
          widthClass="w-72"
        />
      </div>

      {/* Controls */}
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

        <button
          onClick={() => setShowAdvanced((s) => !s)}
          className="btn-ghost w-fit gap-1.5 self-start px-1.5 text-xs"
          aria-expanded={showAdvanced}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
          {showAdvanced ? "Hide" : "Advanced"} settings
        </button>

        {showAdvanced && (
          <div className="animate-fade-in rounded-xl bg-surface-2 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted">Translation style</span>
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
        )}
      </div>

      {/* Editor panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Source */}
        <section className="card flex min-h-[22rem] flex-col p-0" aria-label="Source text">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {source === AUTO_DETECT.code
                ? result?.detectedSource
                  ? `Detected: ${result.detectedSource}`
                  : "Source"
                : languageLabel(getLanguage(source))}
            </span>
            {text && (
              <button onClick={() => { setText(""); setResult(null); }} className="btn-ghost px-2 py-1 text-xs" aria-label="Clear source text">
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> Clear
              </button>
            )}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste text to translate…"
            className="flex-1 resize-none bg-transparent px-4 py-3.5 text-[15px] leading-relaxed text-foreground placeholder:text-muted/60 focus:outline-none scrollbar-slim"
            dir={source !== AUTO_DETECT.code && getLanguage(source).direction === "rtl" ? "rtl" : "ltr"}
            spellCheck={false}
          />
          <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-xs text-muted">
            <span>{formatCount(words)} words</span>
            <span>{formatCount(chars)} chars</span>
            {words > 0 && <span>~{readingTimeMinutes(words)} min read</span>}
          </div>
        </section>

        {/* Target */}
        <section className="card flex min-h-[22rem] flex-col p-0" aria-label="Translated text">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {languageLabel(targetLang)}
              {result && (() => {
                const badge = {
                  claude: {
                    label: "Claude",
                    cls: "bg-accent/10 text-accent ring-accent/30",
                    title: `Translated by ${result.model}`,
                  },
                  local: {
                    label: "On-device",
                    cls: "bg-primary/10 text-primary ring-primary/30",
                    title: "Translated in your browser with M2M-100 — no server, no API",
                  },
                  mock: {
                    label: "Mock",
                    cls: "bg-warning/10 text-warning ring-warning/30",
                    title: "Mock provider — add an API key for real translation",
                  },
                }[result.provider];
                return (
                  <span
                    className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold normal-case ring-1", badge.cls)}
                    title={badge.title}
                  >
                    {badge.label}
                  </span>
                );
              })()}
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
            {loading ? (
              CLIENT_TRANSLATE_MODE ? (
                <ModelProgress progress={progress} />
              ) : (
                <StageProgress index={stageIndex} />
              )
            ) : result ? (
              <div
                className="whitespace-pre-wrap px-4 py-3.5 text-[15px] leading-relaxed text-foreground use-script-font"
                dir={targetLang.direction}
                lang={targetLang.code}
              >
                {result.translatedText}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-muted">
                <Sparkles className="h-6 w-6 opacity-50" aria-hidden />
                <p className="text-sm">Your translation will appear here.</p>
              </div>
            )}
          </div>

          {result?.notes && result.notes.length > 0 && (
            <div className="border-t border-border px-4 py-2.5">
              <ul className="space-y-1">
                {result.notes.map((n, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-muted">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {/* Action bar */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface/95 p-3 shadow-panel backdrop-blur">
        <p className="hidden text-xs text-muted sm:block">
          {CLIENT_TRANSLATE_MODE
            ? "Runs entirely in your browser — no server, no API key, private by design."
            : result?.confidence != null
              ? `Confidence ${Math.round(result.confidence * 100)}% · reviewed before delivery`
              : "Analyse · translate · review — every request runs the full pipeline."}
        </p>
        <button onClick={translate} disabled={!canTranslate} className="btn-primary ml-auto min-w-[9rem] px-6 py-2.5">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Translating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden /> Translate
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function formatMB(bytes?: number): string {
  if (!bytes) return "";
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

function ModelProgress({ progress }: { progress: ClientProgress | null }) {
  const downloading = progress?.stage === "downloading";
  const pct = Math.min(100, Math.round(progress?.percent ?? 0));

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        {downloading ? (
          <Download className="h-5 w-5" aria-hidden />
        ) : (
          <Cpu className="h-5 w-5" aria-hidden />
        )}
      </div>

      {downloading ? (
        <>
          <div>
            <p className="text-sm font-medium text-foreground">Preparing the translation model</p>
            <p className="mt-1 text-xs text-muted">
              One-time download, then it&rsquo;s cached and runs offline on your device.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-muted">
              <span>{pct}%</span>
              {progress?.totalBytes ? (
                <span>
                  {formatMB(progress.loadedBytes)} / {formatMB(progress.totalBytes)}
                </span>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
          <span>
            Translating on your device
            {progress?.totalChunks && progress.totalChunks > 1
              ? ` · ${progress.done ?? 0}/${progress.totalChunks}`
              : "…"}
          </span>
        </div>
      )}
    </div>
  );
}

function StageProgress({ index }: { index: number }) {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 px-6 py-6" role="status" aria-live="polite">
      {STAGES.map((stage, i) => {
        const done = i < index;
        const active = i === index;
        return (
          <div
            key={stage}
            className={cn(
              "flex items-center gap-3 text-sm transition-colors",
              done && "text-muted",
              active && "text-foreground",
              !done && !active && "text-muted/40",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                done && "border-success bg-success text-white",
                active && "border-primary",
                !done && !active && "border-border",
              )}
            >
              {done ? <Check className="h-3 w-3" aria-hidden /> : active ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
            </span>
            <span className={cn(active && "font-medium")}>{stage}</span>
          </div>
        );
      })}
    </div>
  );
}
