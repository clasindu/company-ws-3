# ETEK Engineering Solutions — website

Static website (HTML, CSS, vanilla JS). No build step, no framework, no CDN
requests at runtime: fonts, icons, images and video are all served from
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

Opening `index.html` straight from disk also works, but browsers refuse to load
web font files over `file://`, so headings and body text fall back to the system
UI font instead of Inter. Use `preview.cmd` to see the page as it will actually
look online.

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
    main.js                 nav, theme, tabs, carousel, video, scroll reveal
  fonts/                    Inter woff2, latin and latin-ext subsets
  icons/
    sprite.svg              Lucide icon sprite (source of truth)
    favicon.png             derived from the green E of the logo
    LICENSE-lucide.txt
  images/                   photography, posters, logo files, CREDITS.md
  video/                    port operations footage
tools/
  inline-sprite.py          copies sprite.svg into the HTML pages
```

## The products video

The products section plays
`assets/video/port-operations-berth-to-yard.mp4`: two supplied clips merged into
one 15s sequence, the vessel at berth under the quay cranes first, then the move
from berth into the container yard, joined by a short crossfade.

It is a silent, looping 1280x720 H.264 file at 3.7 MB, with no audio track at
all, so nothing is muted-but-downloaded. `assets/images/port-operations-poster-*`
is the first frame, used as the `poster` so the frame is never empty while the
video loads.

`initVesselVideo` in `main.js` adds the parts autoplay alone cannot do:

- A pause/play button, because content that plays for more than five seconds
  needs a way to stop it (WCAG 2.2.2).
- Playback stops while the section is off screen, so scrolling past it does not
  keep a decoder running.
- Under `prefers-reduced-motion` the video stays on its poster frame until the
  visitor presses play.

To replace the footage, keep the file name and drop in a new MP4; regenerate the
poster from its first frame at 1600px and 800px wide.

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
  animations, and holds the products video on its poster frame.
- The products video is decorative and silent: the same information is in the
  surrounding copy and the product cards.
