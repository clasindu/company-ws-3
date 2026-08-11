"""Inline assets/icons/sprite.svg into the HTML pages.

The sprite is the single source of truth for icons. Referencing it with
<use href="assets/icons/sprite.svg#id"> is blocked by the browser when a page
is opened straight from disk, so the sprite is inlined between the
ICON-SPRITE markers instead. Re-run this after changing the sprite:

    python tools/inline-sprite.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPRITE = os.path.join(ROOT, "assets", "icons", "sprite.svg")
START = "<!-- ICON-SPRITE:START -->"
END = "<!-- ICON-SPRITE:END -->"

with open(SPRITE, encoding="utf-8") as f:
    sprite = f.read().strip()

pages = [f for f in os.listdir(ROOT) if f.endswith(".html")]
if not pages:
    sys.exit("no HTML pages found")

for page in pages:
    path = os.path.join(ROOT, page)
    with open(path, encoding="utf-8") as f:
        html = f.read()

    if START not in html or END not in html:
        print(f"skip {page}: markers not found")
        continue

    html = re.sub(
        re.escape(START) + r".*?" + re.escape(END),
        START + "\n" + sprite + "\n" + END,
        html,
        flags=re.S,
    )
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"inlined sprite into {page}")
