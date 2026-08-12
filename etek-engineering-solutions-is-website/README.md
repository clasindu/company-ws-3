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
  video/                    container terminal footage
tools/
  inline-sprite.py          copies sprite.svg into the HTML pages
```

## The hero intro video

The hero plays `assets/video/intro.mp4`: a silent, looping
1280x720 H.264 brand intro (~3.4 MB). The generator watermark is cropped out, and
colour/contrast are lifted for a cleaner look. Poster frames are
`assets/images/intro-poster-*`.

## The products video

The products section plays `assets/video/port-terminal-operation.mp4`: three
supplied clips cut into one 25s sequence that follows a single container through a
full terminal operation - the vessel arrives under tug escort and berths, a quay
crane discharges a container onto a prime mover, and the prime mover carries it to
the yard where a yard crane lifts it off.

It is a silent, looping 1280x720 H.264 file at about 7.6 MB, with no audio track at
all, so nothing is muted-but-downloaded. Colour and contrast are lifted in the encode
and again lightly in CSS so the footage does not look flat or washed out. The graded
master with its audio mix lives outside the site at
`../assets/video/port-terminal-operation-master.mp4`, for presentation use.
`assets/images/port-terminal-operation-poster-*` is the first frame, used as the
`poster` so the frame is never empty while the video loads.

`bindAutoplayVideo` in `main.js` keeps both section videos automatic with no
on-screen controls:

- Each video autoplays muted and loops while its section is visible.
- Playback stops while the section is off screen, so scrolling past it does not
  keep a decoder running.
- Under `prefers-reduced-motion` the video stays on its poster frame.

To replace the footage, keep the file name and drop in a new MP4; regenerate the
poster from its first frame at 1600px and 800px wide.

The three source clips carry a generator watermark in the bottom right corner. It
is removed by cropping to the widest exactly-16:9 rectangle that excludes it and
rescaling back to 1280x720, an 11% zoom. Inpainting the mark was tried first and
rejected: it left a visible soft patch wherever a structure passed behind it,
whereas cropping invents no pixels and leaves no artifact.

### How the sequence was built

Sources are `Vessel Arrival.mp4`, `Container Discharge.mp4` and
`Prime Mover to Yard.mp4`, all 10s of 1280x720 at 24fps. Cuts, in order, joined by
0.40s and 0.45s dissolves:

| # | clip | in | out |
| - | ---- | -- | --- |
| 1 | Vessel Arrival | 0.00 | 10.00 |
| 2 | Container Discharge | 0.00 | 10.00 |
| 3 | Prime Mover to Yard | 4.05 | 10.00 |

Clip 3 starts at 4.05s because its first 1.58s repeat the closing shot of clip 2
almost exactly, and the driving shot after that shows the chassis empty, which
contradicts the container just loaded onto it. From 4.05s the truck is far enough
away that this no longer reads.

Each clip was then corrected to match the others, with the corrections solved from
measurements rather than set by eye. White balance was matched onto clips 1 and 2,
which already agreed; exposure onto the three-clip mean; and only half of each
clip's saturation gap was closed, because the rest of that gap is genuine content
difference rather than a grading difference. The shared `contrast`/`gamma` is a
slight documentary polish, trimmed per clip so correcting exposure through the curve
does not pull them apart again.

```
[all]  crop=1136:639:0:40,scale=1280:720:flags=lanczos
[1]    eq=saturation=1.1813,eq=contrast=1.0690:gamma=0.995,
       colorchannelmixer=rr=0.97871:gg=0.95512:bb=0.99293   audio -2.10 dB
[2]    eq=saturation=0.9865,eq=contrast=1.0492:gamma=0.995,
       colorchannelmixer=rr=1.01255:gg=0.99025:bb=1.01503   audio +4.10 dB
[3]    eq=saturation=0.9037,eq=contrast=0.9584:gamma=0.995,
       colorchannelmixer=rr=1.07348:gg=1.05989:bb=1.09883   audio +4.10 dB
```

Those audio gains bring all three to -20.5 LUFS. Clip 1 was 6.2 LU louder than the
other two, which was the most audible mismatch of the three joins. Measured on the
finished master, exposure now varies by 1.7 levels between the three segments and
white balance by under 0.8%, both far below the shot-to-shot variation that already
exists inside each source clip, so the joins do not announce themselves.

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
