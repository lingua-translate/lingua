import { cn } from "@/lib/utils";

/**
 * Signature element: one sentence living in seven scripts, laid out like an
 * interlinear gloss / parallel text — the defining artifact of translation.
 * The source line is marked in gold; each rendering reveals in sequence on
 * load (reduced-motion collapses the stagger to an instant, content intact).
 *
 * Translations are held to the same bar as the product: each is a correct,
 * idiomatic rendering of the English source, not a literal word swap.
 */
interface Line {
  code: string;
  language: string;
  text: string;
  family: "display" | "arabic" | "sans";
  lang: string;
  dir?: "rtl";
  source?: boolean;
}

const LINES: Line[] = [
  { code: "EN", language: "English", text: "Good writing survives translation.", family: "display", lang: "en", source: true },
  { code: "AR", language: "Arabic", text: "الكتابة الجيّدة تصمد أمام الترجمة.", family: "arabic", lang: "ar", dir: "rtl" },
  { code: "ZH", language: "Chinese", text: "好文字经得起翻译。", family: "sans", lang: "zh-Hans" },
  { code: "JA", language: "Japanese", text: "良い文章は翻訳に耐える。", family: "sans", lang: "ja" },
  { code: "RU", language: "Russian", text: "Хороший текст переживает перевод.", family: "sans", lang: "ru" },
  { code: "ES", language: "Spanish", text: "La buena escritura sobrevive a la traducción.", family: "display", lang: "es" },
  { code: "FR", language: "French", text: "Un bon texte survit à la traduction.", family: "display", lang: "fr" },
];

export function RosettaPanel() {
  return (
    <figure className="card overflow-hidden p-0 shadow-panel">
      <figcaption className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="marker">Parallel text</span>
        <span className="marker text-muted/70">one meaning · seven scripts</span>
      </figcaption>

      <div className="px-5 py-2">
        {LINES.map((line, i) => (
          <div
            key={line.code}
            className="reveal-line"
            style={{ animationDelay: `${0.15 + i * 0.13}s` }}
          >
            <div className="flex items-baseline gap-4 border-t border-border/70 py-3.5 first:border-t-0">
              <span
                className={cn(
                  "marker flex w-14 shrink-0 items-center gap-1.5 pt-1",
                  line.source && "text-accent",
                )}
              >
                {line.source && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-[1px] bg-accent" aria-hidden />
                )}
                {line.code}
              </span>
              <p
                lang={line.lang}
                dir={line.dir}
                className={cn(
                  "min-w-0 flex-1 text-[19px] leading-snug text-foreground sm:text-[21px]",
                  line.family === "display" && "font-display",
                  line.family === "arabic" && "font-arabic",
                  line.source && "text-foreground",
                )}
              >
                {line.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border bg-surface-2/50 px-5 py-2.5">
        <span className="text-xs text-muted">
          <span className="font-medium text-foreground">EN</span> is the source. Each line preserves the meaning, not the word order.
        </span>
      </div>
    </figure>
  );
}
