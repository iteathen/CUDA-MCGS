#!/usr/bin/env python3
"""Validate machine-consumed JSON-compatible YAML artifacts."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
required = {
    ROOT / "next_step.yaml": {
        "schema_version",
        "updated",
        "status",
        "objective",
        "ownership_boundary",
        "authority",
        "deliverables",
        "validation",
        "blockers",
        "do_not",
    },
    ROOT / "docs/research/prior-art/source-register.yaml": {
        "schema_version",
        "inspected_date",
        "candidates",
    },
}

for path, keys in required.items():
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(
            f"invalid JSON-compatible YAML {path.relative_to(ROOT)}: {exc}"
        )
    missing = sorted(keys - set(data))
    if missing:
        raise SystemExit(
            f"{path.relative_to(ROOT)} missing keys: {', '.join(missing)}"
        )

manifest_paths = list((ROOT / "components").glob("*/component.yaml"))
manifest_paths += list((ROOT / "adapters").glob("*/*/component.yaml"))
for path in sorted(manifest_paths):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(
            f"invalid component manifest {path.relative_to(ROOT)}: {exc}"
        )
    component = data.get("component")
    if not isinstance(component, dict) or not component.get("id"):
        raise SystemExit(
            f"{path.relative_to(ROOT)} must contain component.id"
        )

print("structured data passed")
