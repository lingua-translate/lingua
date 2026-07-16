import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts predictably. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  // Works for space-delimited scripts; for CJK we fall back to char count/2.
  const words = trimmed.match(/[^\s]+/g) ?? [];
  return words.length;
}

export function readingTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200));
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
