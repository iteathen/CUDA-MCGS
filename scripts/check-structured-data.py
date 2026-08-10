#!/usr/bin/env python3
"""Validate machine-consumed JSON-compatible YAML artifacts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]


def load_json_compatible(path: Path, *, kind: str) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(
            f"invalid {kind} {path.relative_to(ROOT)}: {exc}"
        ) from exc


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
    data = load_json_compatible(path, kind="JSON-compatible YAML")
    if not isinstance(data, dict):
        raise SystemExit(f"{path.relative_to(ROOT)} must contain an object")
    missing = sorted(keys - set(data))
    if missing:
        raise SystemExit(
            f"{path.relative_to(ROOT)} missing keys: {', '.join(missing)}"
        )

# All .yaml templates are deliberately JSON-compatible so they can be consumed
# without depending on a YAML parser and can be validated deterministically.
for path in sorted((ROOT / "agent_files/templates").glob("*.yaml")):
    data = load_json_compatible(path, kind="JSON-compatible template")
    if not isinstance(data, dict) or not data.get("schema_version"):
        raise SystemExit(
            f"{path.relative_to(ROOT)} must contain schema_version"
        )

manifest_paths = list((ROOT / "components").glob("*/component.yaml"))
manifest_paths += list((ROOT / "adapters").glob("*/*/component.yaml"))
for path in sorted(manifest_paths):
    data = load_json_compatible(path, kind="component manifest")
    component = data.get("component") if isinstance(data, dict) else None
    if not isinstance(component, dict) or not component.get("id"):
        raise SystemExit(
            f"{path.relative_to(ROOT)} must contain component.id"
        )

print("structured data passed")
