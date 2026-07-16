import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Type,
  Layers,
  ScanText,
} from "lucide-react";
import { LANGUAGES } from "@/lib/languages";
import { MODES } from "@/lib/modes";
import { RosettaPanel } from "@/components/RosettaPanel";

const CAPABILITIES = [
  {
    icon: Layers,
    title: "Meaning, not words",
    body: "Each request is analysed, translated, then self-reviewed — so it reads as if written by a native, not decoded.",
  },
  {
    icon: Type,
    title: "Every script, set right",
    body: "Formatting held intact, with first-class right-to-left rendering and proper Arabic typography.",
  },
  {
    icon: ScanText,
    title: "Terminology that holds",
    body: "A term chosen once is kept throughout — consistency a phrase-by-phrase tool can't promise.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Your text is sent only to translate this request, and is never used to train a model.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6">
      {/* Hero */}
      <section className="grid items-center gap-10 py-12 md:py-16 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <span className="marker">
            AI Translation
            <span className="mx-2 text-border">/</span>
            {LANGUAGES.length} languages
          </span>
          <h1 className="mt-5 font-display text-[2.75rem] font-light leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Translate the{" "}
            <em className="italic font-normal text-accent">meaning</em>,
            <br className="hidden sm:block" /> not the words.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Documents and text rendered with a translator&rsquo;s judgment —
            context, tone, terminology, and formatting preserved across every
            language.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/translate" className="btn-primary px-5 py-3 text-base">
              Open translator
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/translate" className="btn-secondary px-5 py-3 text-base">
              Paste text
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7">
          <RosettaPanel />
        </div>
      </section>

      {/* Capabilities — editorial, hairline-ruled */}
      <section className="border-t border-border py-14">
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="border-t-2 border-accent/70 pt-4">
              <c.icon className="h-5 w-5 text-accent" aria-hidden />
              <h3 className="mt-3 font-display text-xl text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modes */}
      <section className="border-t border-border py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="marker">Presets</span>
            <h2 className="mt-3 font-display text-3xl text-foreground md:text-4xl">
              Nine ways to translate
            </h2>
            <p className="mt-2 max-w-lg text-muted">
              Each preset tunes the engine — register, terminology, how literal to
              stay. Pick one, or let the platform choose. Advanced controls stay
              one click away.
            </p>
          </div>
          <Link href="/translate" className="btn-ghost hidden shrink-0 text-sm sm:inline-flex">
            Start <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((m) => (
            <Link
              key={m.id}
              href={`/translate?mode=${m.id}`}
              className="group flex flex-col gap-2 bg-surface p-5 transition-colors hover:bg-surface-2"
            >
              <div className="flex items-center justify-between">
                <m.icon className="h-[18px] w-[18px] text-accent" aria-hidden />
                <ArrowUpRight
                  className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </div>
              <span className="font-display text-lg text-foreground">{m.name}</span>
              <span className="text-sm leading-relaxed text-muted">{m.description}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Closing note */}
      <section className="border-t border-border py-14">
        <div className="rounded-2xl border border-border bg-surface-2/60 p-8 md:p-10">
          <p className="max-w-2xl font-display text-2xl leading-snug text-foreground md:text-[28px]">
            Built to WCAG AA — full keyboard navigation, screen-reader labelling,
            reduced-motion support, and correct right-to-left rendering for
            Arabic, Persian, and Urdu.
          </p>
          <Link href="/translate" className="btn-primary mt-7 px-5 py-3 text-base">
            Open the translator
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
