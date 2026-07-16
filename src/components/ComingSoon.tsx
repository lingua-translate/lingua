import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
  planned,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  planned: string[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="mt-5 flex items-center gap-2.5">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-border">
          Coming soon
        </span>
      </div>
      <p className="mt-2 max-w-xl leading-relaxed text-muted">{description}</p>

      <div className="card mt-8 p-5">
        <h2 className="text-sm font-semibold text-foreground">Planned for this section</h2>
        <ul className="mt-3 space-y-2">
          {planned.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link href="/translate" className="btn-primary mt-8 px-5 py-2.5">
        Go to the translator <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
