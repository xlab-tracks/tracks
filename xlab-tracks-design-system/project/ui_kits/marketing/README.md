# Marketing site — UI kit

High-fidelity recreation of the XLab Tracks public site, in the warm "stone & ember" brand language.

## Screens
- **Landing** (`Landing.jsx`) — hero, track catalogue grid, "Read, build, discuss" how-it-works band, conversion CTA.
- **Pricing** (`Pricing.jsx`) — Audit / Member / Teams plan comparison.
- **Chrome** (`Chrome.jsx`) — sticky top nav (blurred) + footer, shared across pages.

## Run it
Open `index.html`. The nav is interactive — "Pricing" switches pages. Loads the design-system bundle (`_ds_bundle.js`) and Tabler Icons from CDN.

## Composition notes
- Built from DS primitives: `Button`, `Badge`, `Card`, `Tag`, `ProgressBar`.
- Content width caps at `--maxw-content` (1080px); page gutter 40px.
- Warm band (`--surface-warm`) breaks the page rhythm once, mid-page.
- All copy follows the brand voice: plain, calm, second-person, sentence case.
