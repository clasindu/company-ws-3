# ETEK Engineering Solutions — website

Static website (HTML, CSS, vanilla JS). No build step, no framework, no CDN
requests at runtime: fonts, icons, images and three.js are all served from
`assets/`.

Current state: **home page only**, pending approval. The remaining pages
(Services, Products, Careers, About, Contact) are not built yet.

## Running it

Double-click `preview.cmd`. It serves this folder on
<http://localhost:8123> and opens your browser. Press Ctrl+C in the console
window to stop it. On macOS or Linux the equivalent is:

```bash
python -m http.server 8123
# then open http://localhost:8123
```

Opening `index.html` straight from disk also works, including the 3D vessel,
but browsers refuse to load web font files over `file://`, so headings and body
text fall back to the system UI font instead of Inter. Use `preview.cmd` to see
the page as it will actually look online.

## Structure

```
index.html                  the home page
preview.cmd                 serves the folder on localhost and opens a browser
assets/
  css/
    tokens.css              design tokens - the single source of truth
    fonts.css               self-hosted Inter @font-face rules (generated)
    base.css                reset, document defaults, layout primitives
    components.css          reusable components (buttons, cards, nav, tabs...)
    sections.css            one block per home page section
  js/
    main.js                 nav, theme, tabs, carousel, scroll reveal
    vessel.js               three.js container vessel
    vendor/
      three.global.min.js   three.js r169 (generated, see tools/three-global.py)
  fonts/                    Inter woff2, latin and latin-ext subsets
  icons/
    sprite.svg              Lucide icon sprite (source of truth)
    favicon.png             derived from the green E of the logo
    LICENSE-lucide.txt
  images/                   photography, logo files, CREDITS.md
tools/
  inline-sprite.py          copies sprite.svg into the HTML pages
  three-global.py           rebuilds the three.js vendor file
```

## The 3D vessel

`assets/js/vessel.js` builds the container vessel from three.js primitives, so
nothing is downloaded beyond the vendor file and the model is coloured straight
from the brand tokens. Visitors can drag to rotate, pinch to zoom, and use the
zoom in, zoom out and reset buttons in the corner of the frame. The mouse wheel
zooms too, but only after the model has been clicked, so scrolling past the
section is never trapped. Left alone, the model drifts back into a slow
rotation.

Both scripts load as classic scripts rather than modules, because browsers block
module scripts over `file://` and the vessel would silently degrade to its
fallback photograph. `tools/three-global.py` produces the vendor file by
rewriting the official three.js module export into a `window.THREE` global:

```bash
python tools/three-global.py
```

## Design system

All colour, type, spacing, radius, shadow, motion and layout values live in
`assets/css/tokens.css`. Nothing else hard-codes a value.

- `--brand-*` is the raw ETEK palette and is never used directly in the UI.
- `--color-*` are semantic roles (`--color-canvas`, `--color-text-muted`,
  `--color-accent`…). Only these are used in components.
- Dark mode is defined once, by overriding the semantic roles under
  `:root[data-theme='dark']`. Adding a new component needs no dark-mode CSS as
  long as it uses semantic tokens.

Every first visit is light, whatever the operating system prefers. Dark mode is
opt-in through the header toggle, which then remembers the choice in
`localStorage` under `etek-theme`. The toggle shows the theme you will get by
pressing it: a moon while the page is light, a sun once it is dark.

The accent is Baltic Blue (`#05668d`). Lime Moss is used only for small
decorative marks, never for text on a light background, because it does not
reach an accessible contrast ratio.

## Logo

The supplied logo had a white background; it has been made transparent so only
the letterforms remain. Two variants are swapped by CSS:

- `assets/images/etek-logo.png` — light backgrounds
- `assets/images/etek-logo-dark.png` — dark backgrounds and the footer, with
  the thin tagline tinted so it stays legible

Both header and footer wrap the logo in `.logo-slot`. To change the logo,
replace those two files; no CSS changes needed. If you supply a vector version
of the logo, drop in an SVG and update the two `<img>` tags.

## Icons

Icons come from the Lucide set, bundled locally in `assets/icons/sprite.svg`
and inlined into the HTML so they also work from `file://`. After editing the
sprite, re-inline it:

```bash
python tools/inline-sprite.py
```

Markup: `<svg class="icon" aria-hidden="true"><use href="#i-name"></use></svg>`

## Images

Every photograph is a placeholder from Unsplash, downloaded locally, with two
widths (`-800`, `-1600`) in both WebP and JPEG, wired up with `<picture>` and
`srcset`. Credits and the original photo IDs are in
`assets/images/CREDITS.md`.

To swap in real ETEK photography, keep the same file names and sizes and the
markup will pick them up unchanged.

## Accessibility notes

- Semantic landmarks, one `h1`, heading order preserved.
- Skip link, visible focus rings, `:focus-visible` styling.
- Tabs follow the ARIA tabs pattern with arrow key support; the accordion uses
  native `<details>`.
- `prefers-reduced-motion` disables scroll reveal, the marquee, floating
  animations and the vessel's idle rotation.
- The 3D scene is decorative: the same information is in the product cards.
