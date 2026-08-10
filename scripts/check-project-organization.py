#!/usr/bin/env python3
"""Enforce the accepted mature-scale UMCGS repository organization."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

ALLOWED_TOP_LEVEL_DIRECTORIES = {
    ".github",
    "adapters",
    "agent_files",
    "benchmarks",
    "components",
    "conformance",
    "docs",
    "examples",
    "experiments",
    "packaging",
    "schemas",
    "scripts",
    "tests",
    "third_party",
    "tools",
}

ALLOWED_TOP_LEVEL_FILES = {
    ".gitignore",
    "AGENTS.md",
    "CLAUDE.md",
    "CODE_OF_CONDUCT.md",
    "CONTRIBUTING.md",
    "GEMINI.md",
    "LICENSE",
    "LICENSE.md",
    "Makefile",
    "README.md",
    "SECURITY.md",
    "STATUS.md",
    "CMakeLists.txt",
    "Cargo.lock",
    "Cargo.toml",
    "package-lock.json",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "pyproject.toml",
    "uv.lock",
    "next_step.yaml",
}

SOURCE_SUFFIXES = {
    ".c",
    ".cc",
    ".cpp",
    ".cu",
    ".cuh",
    ".go",
    ".h",
    ".hpp",
    ".java",
    ".js",
    ".jsx",
    ".py",
    ".rs",
    ".ts",
    ".tsx",
    ".zig",
}

FORBIDDEN_DUMP_NAMES = {
    "common",
    "general",
    "helpers",
    "legacy",
    "misc",
    "shared",
    "stuff",
    "temp",
    "tmp",
    "utils",
}

SCAFFOLD_READMES = {
    "adapters/README.md",
    "benchmarks/README.md",
    "components/README.md",
    "conformance/README.md",
    "examples/README.md",
    "experiments/README.md",
    "packaging/README.md",
    "schemas/README.md",
    "tests/README.md",
    "third_party/README.md",
    "tools/README.md",
}

ADAPTER_FAMILIES = {"domains", "evaluators", "outputs", "policies"}
errors: list[str] = []


def fail(message: str) -> None:
    errors.append(message)


def validate_component(path: Path, expected_area: str) -> None:
    if path.name.lower() in FORBIDDEN_DUMP_NAMES:
        fail(f"forbidden catch-all component name: {path.relative_to(ROOT)}")

    readme = path / "README.md"
    manifest = path / "component.yaml"
    if not readme.is_file() or readme.stat().st_size == 0:
        fail(f"component missing non-empty README.md: {path.relative_to(ROOT)}")
    if not manifest.is_file() or manifest.stat().st_size == 0:
        fail(f"component missing non-empty component.yaml: {path.relative_to(ROOT)}")
        return

    try:
        data = json.loads(manifest.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"invalid JSON-compatible manifest {manifest.relative_to(ROOT)}: {exc}")
        return

    component = data.get("component")
    if not isinstance(component, dict):
        fail(f"manifest missing component object: {manifest.relative_to(ROOT)}")
        return

    required = {
        "id",
        "name",
        "status",
        "product_area",
        "path",
        "purpose",
        "design",
        "public_contracts",
        "allowed_dependencies",
        "validation",
        "owner",
    }
    missing = sorted(required - set(component))
    if missing:
        fail(
            f"{manifest.relative_to(ROOT)} missing component keys: "
            + ", ".join(missing)
        )

    design = component.get("design")
    if not isinstance(design, dict):
        fail(f"manifest missing design object: {manifest.relative_to(ROOT)}")
    else:
        design_required = {
            "owned_invariant",
            "intended_equivalence_class",
            "excluded_cases",
            "authoritative_state_owner",
            "public_ports",
            "injected_dependencies",
            "adapter_boundaries",
            "solid_responsibilities",
            "cupid_qualities",
            "second_instance",
            "first_consumer_deletion",
            "essential_complexity",
            "accidental_complexity_rejected",
            "complexity_moved_elsewhere",
            "simplest_sufficient_total_system",
        }
        design_missing = sorted(design_required - set(design))
        if design_missing:
            fail(
                f"{manifest.relative_to(ROOT)} missing design keys: "
                + ", ".join(design_missing)
            )

    declared_path = component.get("path")
    actual_path = path.relative_to(ROOT).as_posix()
    if declared_path != actual_path:
        fail(
            f"{manifest.relative_to(ROOT)} declares path {declared_path!r}, "
            f"expected {actual_path!r}"
        )

    if component.get("product_area") != expected_area:
        fail(
            f"{manifest.relative_to(ROOT)} product_area must be "
            f"{expected_area!r}"
        )


for child in ROOT.iterdir():
    if child.name == ".git":
        continue
    if child.is_dir() and child.name not in ALLOWED_TOP_LEVEL_DIRECTORIES:
        fail(f"unapproved top-level directory: {child.name}")
    elif child.is_file():
        if child.name not in ALLOWED_TOP_LEVEL_FILES:
            fail(f"unapproved top-level file: {child.name}")
        if child.suffix.lower() in SOURCE_SUFFIXES:
            fail(f"production source file is not allowed at repository root: {child.name}")

for relative in sorted(SCAFFOLD_READMES):
    path = ROOT / relative
    if not path.is_file() or path.stat().st_size == 0:
        fail(f"missing mature-scale product-area README: {relative}")

components = ROOT / "components"
if components.is_dir():
    for child in sorted(components.iterdir()):
        if child.is_dir():
            validate_component(child, "components")

adapters = ROOT / "adapters"
if adapters.is_dir():
    for family in sorted(adapters.iterdir()):
        if not family.is_dir():
            continue
        if family.name not in ADAPTER_FAMILIES:
            fail(f"unapproved adapter family: {family.relative_to(ROOT)}")
            continue
        family_readme = family / "README.md"
        if not family_readme.is_file() or family_readme.stat().st_size == 0:
            fail(f"adapter family missing README.md: {family.relative_to(ROOT)}")
        for child in sorted(family.iterdir()):
            if child.is_dir():
                validate_component(child, "adapters")

if errors:
    print("\n".join(errors), file=sys.stderr)
    raise SystemExit(1)

print("project organization passed")
