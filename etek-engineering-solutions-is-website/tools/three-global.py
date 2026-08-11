"""Build assets/js/vendor/three.global.min.js from the official three.js module build.

The site has to work when index.html is opened straight from disk. Browsers
refuse to load `<script type="module">` over file:// (opaque origin, CORS),
which left the container vessel showing only its fallback photograph. This
rewrites the single trailing `export { ... }` statement of the official build
into a `window.THREE = { ... }` assignment, so the identical code can be loaded
as a plain script.

    python tools/three-global.py

The module build is downloaded if it is not already present, then removed
again: only the generated global build ships with the site.
"""
from __future__ import annotations

import re
import sys
import urllib.request
from pathlib import Path

VERSION = "0.169.0"
SOURCE_URL = f"https://cdn.jsdelivr.net/npm/three@{VERSION}/build/three.module.min.js"

VENDOR = Path(__file__).resolve().parent.parent / "assets" / "js" / "vendor"
MODULE = VENDOR / "three.module.min.js"
OUTPUT = VENDOR / "three.global.min.js"

downloaded = False
if not MODULE.exists():
    print(f"downloading {SOURCE_URL}")
    with urllib.request.urlopen(SOURCE_URL, timeout=60) as response:
        MODULE.write_bytes(response.read())
    downloaded = True

source = MODULE.read_text(encoding="utf-8")
print(f"source: {MODULE.name}  {len(source):,} chars")

# Anything module-only would survive the rewrite and break in a classic script.
for label, pattern in (
    ("import.meta", r"import\.meta"),
    ("static import", r"(?m)^\s*import[\s{'\"]"),
    ("dynamic import", r"\bimport\s*\("),
):
    hits = len(re.findall(pattern, source))
    if hits:
        sys.exit(f"cannot convert: found {hits} occurrences of {label}")

matches = list(re.finditer(r"export\s*\{([^{}]*)\}\s*;?\s*$", source))
if len(matches) != 1:
    sys.exit(f"expected exactly 1 trailing export block, found {len(matches)}")

pairs: list[tuple[str, str]] = []
for entry in matches[0].group(1).split(","):
    entry = entry.strip()
    if not entry:
        continue
    parts = re.split(r"\s+as\s+", entry)
    local, public = (parts[0], parts[1]) if len(parts) == 2 else (parts[0], parts[0])
    pairs.append((local.strip(), public.strip()))

if not pairs:
    sys.exit("no exported names parsed")
print(f"exported names: {len(pairs)}")

banner = (
    f"/* three.js r{VERSION.split('.')[1]} - MIT Licence - https://threejs.org\n"
    "   Generated from the official three.module.min.js by tools/three-global.py.\n"
    "   Identical code, with the ES-module export rewritten to a global so the\n"
    "   page also works when opened directly from disk (file://). */\n"
)
globals_assignment = (
    "window.THREE={" + ",".join(f"{public}:{local}" for local, public in pairs) + "};"
)

OUTPUT.write_text(banner + source[: matches[0].start()] + globals_assignment + "\n", encoding="utf-8")
print(f"wrote: {OUTPUT.name}  {OUTPUT.stat().st_size:,} bytes")

if downloaded:
    MODULE.unlink()
    print(f"removed the intermediate {MODULE.name}")
