# Lingua — Professional AI Translation Platform

Milestone 1: a production-quality **translation workspace** — the core of the
platform described in the master spec. Built to be extended, not a throwaway
prototype.

## What's in this milestone

- **Translation workspace** (`/translate`) — source/target panels, live staged
  progress, copy/download, word/char counts, and detected-language display.
- **24 languages & variants** including Modern Standard Arabic (الفصحى) and
  Saudi Arabic, with correct **RTL rendering** and Arabic typography.
- **9 intelligent modes** (Quick → Legal → Literary → Website) plus tone and a
  literal↔natural style slider behind an Advanced panel — simple by default.
- **Real AI backend**: a pluggable provider interface with a **Claude API**
  implementation running the analyse → translate → self-review pipeline, and a
  **mock fallback** so the whole app works with no key.
- **Design system**: deep-blue / slate / teal palette, light + dark + system
  themes (no flash, instant switch), responsive rail + mobile bottom nav.
- **Accessibility**: keyboard-navigable dropdowns, ARIA labelling, focus rings,
  reduced-motion support, semantic RTL/LTR.

Sections beyond the workspace (Projects, History, Glossaries, Translation
Memory, Review, Settings) are present in the navigation as clearly-labelled
**"coming soon"** pages describing what each will do — the roadmap from the
spec, staged honestly rather than stubbed silently.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY for real output
npm run dev                  # http://localhost:3000
```

Without an API key the app runs on the **mock provider** and says so plainly in
the UI (a banner + a "Mock" badge on results). Add `ANTHROPIC_API_KEY` to
`.env.local` and it switches to real Claude translation automatically.

### Configuration (`.env.local`)

| Variable                | Purpose                                             |
| ----------------------- | --------------------------------------------------- |
| `ANTHROPIC_API_KEY`     | Enables real Claude-powered translation.            |
| `TRANSLATION_MODEL`     | Override the model id (default: `claude-opus-4-8`). |
| `TRANSLATION_PROVIDER`  | `auto` (default), `claude`, or `mock`.              |

## Architecture

```
src/
  app/
    page.tsx              Home
    translate/            Translation workspace (server wrapper + client UI)
    api/translate/        POST endpoint → provider
    projects|history|…    Roadmap pages
  components/             AppShell, Translator, theme, UI primitives
  lib/
    languages.ts          Language set (append-only to add more)
    modes.ts              Presets, tones, style scale
    providers/            Pluggable AI backend
      types.ts            The one interface the app depends on
      claude.ts           Real Claude implementation
      mock.ts             Keyless fallback
      prompt.ts           Professional-pipeline system prompt
      index.ts            Provider selection
```

The rest of the app talks only to `TranslationProvider`, so swapping or adding a
backend never touches the UI. Adding a language is a one-line append to
`LANGUAGES`; adding a mode is one entry in `MODES`.

## Not yet built (next milestones)

Document upload & OCR, formatting-preserving reconstruction, translation
memory/glossary storage, the review/QA workspace, accounts, and collaboration —
each is a module in the spec designed to slot into this architecture.
