---
name: xlab-tracks-design
description: Use this skill to generate well-branded interfaces and assets for XLab Tracks (an AI-safety learning platform), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation
- **Brand:** XLab Tracks — AI-safety learning platform. Warm, calm, dark-first. The anti-hype aesthetic: stone + ember, not neon gradients.
- **Tokens:** `styles.css` → `tokens/*.css`. Always style via CSS custom properties (`var(--accent)`, `var(--surface-card)`, `var(--text-primary)`).
- **Type:** Source Serif 4 (display serif) + Inter (UI/body) + JetBrains Mono (code). Sentence case everywhere.
- **Accent:** ember `#E1854F` (primary), dusty rose `#CD8A7F` (secondary). One accent, used sparingly.
- **Icons:** Tabler Icons webfont (`<i class="ti ti-{name}">`), loaded from CDN.
- **Components:** `components/core/*` → `window.XLabTracksDesignSystem_8f3d24` after loading `_ds_bundle.js`. See each `.prompt.md`.
- **Full screens:** `ui_kits/marketing/` and `ui_kits/app/` are working recreations to copy from.
- **Voice:** plain, second-person, no hype, no emoji. Acknowledge difficulty honestly.

See `readme.md` for the complete content + visual foundations.
