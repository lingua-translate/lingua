import type { Config } from "tailwindcss";

/**
 * Design system tokens are defined as RGB channel triplets in globals.css
 * (e.g. `--color-primary: 37 99 235;`) so Tailwind's `<alpha-value>` opacity
 * modifiers work everywhere (bg-primary/10, text-foreground/60, ...).
 */
const withAlpha = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: withAlpha("--color-background"),
        surface: withAlpha("--color-surface"),
        "surface-2": withAlpha("--color-surface-2"),
        foreground: withAlpha("--color-foreground"),
        muted: withAlpha("--color-muted"),
        border: withAlpha("--color-border"),
        primary: {
          DEFAULT: withAlpha("--color-primary"),
          foreground: withAlpha("--color-primary-foreground"),
          soft: withAlpha("--color-primary-soft"),
        },
        secondary: withAlpha("--color-secondary"),
        accent: {
          DEFAULT: withAlpha("--color-accent"),
          foreground: withAlpha("--color-accent-foreground"),
        },
        success: withAlpha("--color-success"),
        warning: withAlpha("--color-warning"),
        error: withAlpha("--color-error"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Segoe UI", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        arabic: ["var(--font-arabic)", "var(--font-sans)", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
        "card-hover":
          "0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 6px -2px rgb(15 23 42 / 0.06)",
        panel: "0 8px 30px -8px rgb(15 23 42 / 0.12)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
