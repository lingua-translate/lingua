import type { LucideIcon } from "lucide-react";
import {
  Zap,
  Briefcase,
  BookOpen,
  GraduationCap,
  Scale,
  Stethoscope,
  Cpu,
  Feather,
  Globe,
} from "lucide-react";

export interface TranslationMode {
  id: string;
  name: string;
  description: string;
  /** Best-use-case blurb surfaced in the UI (Part 5). */
  useCase: string;
  icon: LucideIcon;
  /** Default position on the Literal ↔ Natural slider, 0–100. */
  defaultStyle: number;
  /** Extra guidance appended to the AI system prompt for this mode. */
  guidance: string;
}

/**
 * Intelligent presets (Parts 2 & 5). Each preset configures the translation
 * philosophy without exposing the user to dozens of individual toggles.
 */
export const MODES: TranslationMode[] = [
  {
    id: "quick",
    name: "Quick",
    description: "Fast, dependable translation for everyday use.",
    useCase: "Messages, notes, casual reading.",
    icon: Zap,
    defaultStyle: 70,
    guidance:
      "Prioritise speed and clear, natural phrasing. A single high-quality pass is sufficient.",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Balanced quality for business and general documents.",
    useCase: "Reports, correspondence, general business content.",
    icon: Briefcase,
    defaultStyle: 60,
    guidance:
      "Balance fidelity and fluency. Maintain a polished, professional register suitable for a workplace audience.",
  },
  {
    id: "publication",
    name: "Publication",
    description: "Maximum quality with thorough review and QA.",
    useCase: "Anything that will be published or printed.",
    icon: BookOpen,
    defaultStyle: 65,
    guidance:
      "Treat this as publication-ready work. After translating, self-review for accuracy, consistency, grammar, and natural flow as an experienced editor would, and deliver only your best final version.",
  },
  {
    id: "academic",
    name: "Academic",
    description: "Scholarly register, citations, and terminology preserved.",
    useCase: "Papers, theses, journal articles.",
    icon: GraduationCap,
    defaultStyle: 45,
    guidance:
      "Preserve scholarly tone, discipline-specific terminology, citations, and a formal register. Do not casualise the language.",
  },
  {
    id: "legal",
    name: "Legal",
    description: "Strict terminology; precise, faithful, no paraphrasing.",
    useCase: "Contracts, court documents, policies.",
    icon: Scale,
    defaultStyle: 20,
    guidance:
      "Maximise precision and consistency. Preserve legal terminology exactly and avoid paraphrasing. Never soften or reinterpret obligations. Flag genuine ambiguity rather than resolving it silently.",
  },
  {
    id: "medical",
    name: "Medical",
    description: "Established medical terminology; cautious with ambiguity.",
    useCase: "Reports, patient instructions, research.",
    icon: Stethoscope,
    defaultStyle: 30,
    guidance:
      "Use established, standardised medical terminology. Handle ambiguous or safety-critical wording cautiously and never invent clinical detail.",
  },
  {
    id: "technical",
    name: "Technical",
    description: "Precision and consistency for engineering & software.",
    useCase: "Manuals, documentation, specifications.",
    icon: Cpu,
    defaultStyle: 35,
    guidance:
      "Prioritise precision and terminological consistency. Preserve code, variables, commands, units, and placeholders exactly. Translate only human-readable text.",
  },
  {
    id: "literary",
    name: "Literary",
    description: "Preserve voice, imagery, rhythm, and style.",
    useCase: "Fiction, poetry, creative writing.",
    icon: Feather,
    defaultStyle: 85,
    guidance:
      "Preserve the author's voice, imagery, rhythm, emotion, and distinct character voices in dialogue. Recreate idioms, humour, and wordplay in the target language rather than translating them literally.",
  },
  {
    id: "web",
    name: "Website & Software",
    description: "Localise UI text; protect placeholders and variables.",
    useCase: "Interfaces, apps, marketing sites.",
    icon: Globe,
    defaultStyle: 75,
    guidance:
      "Follow software localisation best practice. Never alter placeholders ({name}, %s, {{var}}), variables, HTML tags, or URLs. Keep UI strings concise and idiomatic for the target locale.",
  },
];

export const DEFAULT_MODE = MODES[1]; // Professional

export function getMode(id: string): TranslationMode {
  return MODES.find((m) => m.id === id) ?? DEFAULT_MODE;
}

export const TONES = [
  "Automatic",
  "Neutral",
  "Formal",
  "Highly Formal",
  "Professional",
  "Academic",
  "Technical",
  "Friendly",
  "Warm",
  "Marketing",
  "Persuasive",
  "Journalistic",
  "Literary",
] as const;

export type Tone = (typeof TONES)[number];

/** Human-readable label for a point on the 0–100 literal↔natural slider. */
export function styleLabel(value: number): string {
  if (value < 20) return "Strictly literal";
  if (value < 40) return "Mostly literal";
  if (value < 60) return "Balanced";
  if (value < 80) return "Mostly natural";
  return "Fully natural";
}
