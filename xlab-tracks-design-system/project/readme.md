# XLab Tracks — Design System

A design system for **XLab Tracks**, an **AI safety (AIS) learning platform**: structured, cohort-based tracks that take working professionals and students from "I keep hearing about AI risk" to "I can actually do this work" — alignment, interpretability, evaluations, governance, and RLHF.

The brand is **calm, warm, and dark-first** — the visual opposite of the breathless, neon-gradient "AI hype" aesthetic. It treats serious technical learning as something unhurried and human: stone, ember, low light, generous space.

---

## Sources

This system was derived from a single attached design reference:

- **`tst/ember_and_stone_landing_warm_uniform.html`** (mounted local codebase) — a warm, dark landing-page mockup ("Ember & Stone"). It established the entire visual language adopted here: the warm-stone neutral ramp, the ember (terracotta) accent with a dusty-rose secondary, Source Serif 4 display serif + Inter body, Tabler line icons, hairline borders over heavy shadow, and a plain-spoken second-person voice.

> **Note / caveat:** The reference was a *bathhouse* landing page, not a learning product. Its **aesthetic** was adopted wholesale; its **content** (sauna, cold plunge) was replaced with XLab Tracks' real domain (AI-safety learning). No XLab Tracks codebase, Figma, or brand guide was provided — if one exists, share it and this system can be reconciled to it.

---

## Content fundamentals

How XLab Tracks writes.

- **Voice:** calm, plain, and direct. Short declaratives. Confident without hype. The reference voice — *"Get warm. Get cold. Feel like a person again."* — maps to *"Learn to make AI go well."* and *"Read, build, discuss. Then again."*
- **Person:** second person ("you"), occasional first-person-plural for the org ("our mentors", "we built this"). Never corporate "we are pleased to".
- **Casing:** **sentence case everywhere** — headlines, buttons, labels, nav. Never Title Case UI, never ALL-CAPS except tiny overline labels with letter-spacing.
- **Headlines** can use periods as rhythm: *"Free to learn. Pay to go deeper."* Fragments are fine.
- **Numbers & claims:** concrete and modest — "6 tracks", "57 lessons", "~20 min read". No inflated metrics, no "revolutionary".
- **Anti-hype rule:** avoid "powerful", "cutting-edge", "unlock", "supercharge", "AI-powered". Name the thing plainly. Acknowledge difficulty honestly — *"None of these are solved."*
- **Microcopy** is reassuring and low-pressure: *"cancel whenever"*, *"start anywhere"*, *"no screens, no rush"*.
- **Emoji:** none. The brand uses Tabler line icons instead — see Iconography.

---

## Visual foundations

The motifs that make something look like XLab Tracks.

- **Mode:** dark-first, and effectively dark-only. There is no light theme; a single light surface (`--stone-100`) exists only for wordmark-on-light and the occasional inverted chip.
- **Palette temperature:** uniformly **warm**. The neutral ramp is warm grey ("stone" — concrete, not blue-grey). The only cool color (`--slate-400`) is a rare counterpoint for "info" or a third category, used sparingly.
- **Accents:** **ember / terracotta `#E1854F`** is the single brand accent — CTAs, active states, progress fills, the wordmark dot. **Dusty rose `#CD8A7F`** is the secondary (outline buttons, soft chip text, links). Both are desaturated and earthy, never candy-bright.
- **Color vibe of imagery:** warm, low-light, matte. If photography is used, it should feel like dim stone rooms and warm lamplight — never cold studio white, never saturated stock.
- **Type:** **Source Serif 4** (a clean, even, professional serif — neutral and trustworthy rather than warm/literary) for all display/headlines and the wordmark, weight 600 (700 for the wordmark), tight leading (1.05–1.18) and slightly negative tracking on large sizes. **Inter** for all UI and body at 400/500, generous leading (1.6–1.75). **JetBrains Mono** for code in lessons. The serif/sans contrast is the signature.
- **Backgrounds:** flat warm-dark fills. **No gradients** (especially no blue-purple gradients), **no hero photography by default**, no busy patterns or textures. Visual interest comes from one mid-page **warm band** (`--surface-warm`, a subtly ember-tinted dark) that breaks the rhythm.
- **Borders:** the workhorse. **0.5px hairline borders** (`--border-default` `#574D4B`, or subtler `--border-subtle` `#3A302E`) define nearly every surface. On a dark UI, the border — not a drop shadow — communicates elevation.
- **Shadows:** quiet and reserved. Cards have *no* shadow (border only). `--shadow-sm/md` are for hover-lift and popovers; `--shadow-lg` only for dialogs/overlays. Warm-black, never colored.
- **Corner radii:** `8px` buttons/inputs/chips, `14px` cards, `16px` large panels, `999px` avatars & toggles. Soft but not pill-everything.
- **Cards:** `--surface-card` (`#2B2321`) fill, 0.5px border, 14px radius, ~22px padding. Interactive cards lift `-1px` and brighten their border on hover. No colored left-border accents.
- **Transparency & blur:** used only for sticky chrome — nav/top bars use a `backdrop-filter: blur(8px)` over a semi-transparent base. Tinted chips use `color-mix` over the surface. Otherwise surfaces are opaque.
- **Spacing:** 4px base grid. Page gutters 28–40px; content caps at 1080px; prose measure ~46–54ch.
- **Animation:** calm and unhurried. Short fades and small moves (≤200ms), soft ease-out (`--ease-out`). **No bounce, no spring, no infinite loops.** Progress bars ease their width over 320ms.
- **Hover states:** primary buttons darken (`--accent-hover`); ghost/secondary get a faint translucent wash; cards lift 1px + brighten border; links/icons brighten toward `--text-primary`.
- **Press states:** a 0.5px downward nudge (`translateY`) — no scale-down, no color flash.
- **Focus:** a soft ember glow ring (`--shadow-focus`, 3px `color-mix` of ember), never a hard blue outline.

---

## Iconography

- **System:** [**Tabler Icons**](https://tabler.io/icons) — the same line-icon family used in the reference (`ti ti-flame`, `ti ti-snowflake`, etc.). Outline style, ~1.75px stroke, rounded joins. This matches the brand's soft-but-precise feel.
- **Delivery:** loaded from CDN as a webfont — `https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.7.0/dist/tabler-icons.min.css` — and used as `<i class="ti ti-{name}">`. DS components that take icons (`Button`, `Badge`, `Input`, `Tabs`) accept a Tabler name **without** the `ti-` prefix.
- **Color:** icons inherit text color by default; the **ember accent** is used to highlight the one important icon in a group (e.g. the flame, the current lesson). Status icons borrow semantic colors (success/warning/danger).
- **Sizing:** 16–18px inline with text, 20–26px as card/feature glyphs, 30–34px as hero marks.
- **Emoji:** never. **Unicode glyphs:** only the mid-dot `·` in the wordmark (ember-colored). Everything else is a Tabler icon.
- **No hand-drawn SVG illustration.** The brand is type- and icon-led, not illustration-led. (Caveat: there is no logo image asset — the brand is a **typographic wordmark**, "XLab · Tracks" in Source Serif 4 700 with an ember mid-dot. See `guidelines/brand-wordmark.card.html`.)

---

## File index / manifest

Root:
- **`styles.css`** — the single entry point consumers link. `@import` manifest only.
- **`tokens/`** — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `shadows.css`, `motion.css`. All CSS custom properties live here.
- **`readme.md`** — this guide.
- **`SKILL.md`** — Agent-Skill front-matter so this system works when downloaded into Claude Code.

Components (`components/core/`) — reusable React primitives, namespace `window.XLabTracksDesignSystem_8f3d24`:
- `Button`, `Badge`, `Tag`, `Card`, `Input`, `Checkbox`, `Switch`, `Avatar`, `ProgressBar`, `Tabs`
- Each has `.jsx` + `.d.ts` + `.prompt.md`; `core.card.html` is the Design-System-tab specimen.

UI kits (`ui_kits/`):
- **`marketing/`** — public site: landing + pricing (`index.html`, `Chrome.jsx`, `Landing.jsx`, `Pricing.jsx`).
- **`app/`** — learner app: sign-in → dashboard → lesson reader (`index.html`, `AppShell.jsx`, `Login.jsx`, `Dashboard.jsx`, `Lesson.jsx`).

Foundation cards (`guidelines/`) — specimen cards shown in the Design System tab, grouped Colors / Type / Spacing / Brand.

---

## Using it

Consumers link one file and load the bundle:

```html
<link rel="stylesheet" href="styles.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.7.0/dist/tabler-icons.min.css" />
<script src="_ds_bundle.js"></script>
<script>const { Button, Card, ProgressBar } = window.XLabTracksDesignSystem_8f3d24;</script>
```

Build with the CSS custom properties (`var(--accent)`, `var(--surface-card)`, …) rather than raw hex, and keep to the voice rules above.

> **Webfont caveat:** Source Serif 4, Inter, and JetBrains Mono are loaded from Google Fonts CDN (matching the reference), so they are not self-hosted binaries in this repo. For offline/production use, self-host the `.woff2` files and replace the `@import` in `tokens/fonts.css` with local `@font-face` rules.
