#!/usr/bin/env python3
"""Verify relative Markdown links without requiring external packages."""
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
LINK = re.compile(r"(?<!!)\[[^\]]*\]\(([^)]+)\)")
errors: list[str] = []

for path in sorted(list(ROOT.rglob("*.md"))):
    if ".git" in path.parts:
        continue
    text = path.read_text(encoding="utf-8")
    for raw in LINK.findall(text):
        target = raw.strip().split()[0].strip("<>")
        if not target or target.startswith(("http://", "https://", "mailto:", "#")):
            continue
        target = unquote(target.split("#", 1)[0])
        if not target:
            continue
        resolved = (path.parent / target).resolve()
        try:
            resolved.relative_to(ROOT)
        except ValueError:
            errors.append(f"{path.relative_to(ROOT)}: link escapes repository: {raw}")
            continue
        if not resolved.exists():
            errors.append(f"{path.relative_to(ROOT)}: missing relative target: {raw}")

if errors:
    print("\n".join(errors), file=sys.stderr)
    raise SystemExit(1)
print("relative Markdown links passed")
