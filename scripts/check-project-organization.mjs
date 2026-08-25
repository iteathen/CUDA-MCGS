#!/usr/bin/env node
/** Enforce the accepted mature-scale UMCGS repository organization. */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const allowedTopLevelDirectories = new Set([
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
]);

const allowedTopLevelFiles = new Set([
  ".gitattributes",
  ".gitignore",
  "AGENTS.md",
  "CLAUDE.md",
  "CODE_OF_CONDUCT.md",
  "CONTRIBUTING.md",
  "GEMINI.md",
  "LICENSE",
  "LICENSE.md",
  "LICENSING.md",
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
  "next_step.yaml",
]);

const sourceSuffixes = new Set([
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
  ".mjs",
  ".rs",
  ".ts",
  ".tsx",
  ".zig",
]);

const forbiddenDumpNames = new Set([
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
]);

const scaffoldReadmes = new Set([
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
]);

const adapterFamilies = new Set(["domains", "evaluators", "outputs", "policies"]);
const errors = [];

function repositoryPath(absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function isDirectory(absolutePath) {
  return existsSync(absolutePath) && statSync(absolutePath).isDirectory();
}

function isNonEmptyFile(absolutePath) {
  return existsSync(absolutePath) && statSync(absolutePath).isFile() && statSync(absolutePath).size > 0;
}

function fail(message) {
  errors.push(message);
}

function validateComponent(componentPath, expectedArea) {
  if (forbiddenDumpNames.has(path.basename(componentPath).toLowerCase())) {
    fail(`forbidden catch-all component name: ${repositoryPath(componentPath)}`);
  }

  const readme = path.join(componentPath, "README.md");
  const manifest = path.join(componentPath, "component.yaml");
  if (!isNonEmptyFile(readme)) {
    fail(`component missing non-empty README.md: ${repositoryPath(componentPath)}`);
  }
  if (!isNonEmptyFile(manifest)) {
    fail(`component missing non-empty component.yaml: ${repositoryPath(componentPath)}`);
    return;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(manifest, "utf8"));
  } catch (error) {
    fail(`invalid JSON-compatible manifest ${repositoryPath(manifest)}: ${error.message}`);
    return;
  }

  const component = data?.component;
  if (!component || typeof component !== "object" || Array.isArray(component)) {
    fail(`manifest missing component object: ${repositoryPath(manifest)}`);
    return;
  }

  const required = new Set([
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
  ]);
  const missing = [...required].filter((key) => !(key in component)).sort();
  if (missing.length > 0) {
    fail(`${repositoryPath(manifest)} missing component keys: ${missing.join(", ")}`);
  }

  const design = component.design;
  if (!design || typeof design !== "object" || Array.isArray(design)) {
    fail(`manifest missing design object: ${repositoryPath(manifest)}`);
  } else {
    const designRequired = new Set([
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
    ]);
    const designMissing = [...designRequired].filter((key) => !(key in design)).sort();
    if (designMissing.length > 0) {
      fail(`${repositoryPath(manifest)} missing design keys: ${designMissing.join(", ")}`);
    }
  }

  const actualPath = repositoryPath(componentPath);
  if (component.path !== actualPath) {
    fail(`${repositoryPath(manifest)} declares path ${JSON.stringify(component.path)}, expected ${JSON.stringify(actualPath)}`);
  }
  if (component.product_area !== expectedArea) {
    fail(`${repositoryPath(manifest)} product_area must be ${JSON.stringify(expectedArea)}`);
  }
}

for (const child of readdirSync(root, { withFileTypes: true })) {
  if (child.name === ".git") {
    continue;
  }
  const childPath = path.join(root, child.name);
  const childStat = statSync(childPath);
  if (childStat.isDirectory() && !allowedTopLevelDirectories.has(child.name)) {
    fail(`unapproved top-level directory: ${child.name}`);
  } else if (childStat.isFile()) {
    if (!allowedTopLevelFiles.has(child.name)) {
      fail(`unapproved top-level file: ${child.name}`);
    }
    if (sourceSuffixes.has(path.extname(child.name).toLowerCase())) {
      fail(`production source file is not allowed at repository root: ${child.name}`);
    }
  }
}

for (const relative of [...scaffoldReadmes].sort()) {
  if (!isNonEmptyFile(path.join(root, relative))) {
    fail(`missing mature-scale product-area README: ${relative}`);
  }
}

const components = path.join(root, "components");
if (isDirectory(components)) {
  for (const child of readdirSync(components).sort()) {
    const childPath = path.join(components, child);
    if (isDirectory(childPath)) {
      validateComponent(childPath, "components");
    }
  }
}

const adapters = path.join(root, "adapters");
if (isDirectory(adapters)) {
  for (const family of readdirSync(adapters).sort()) {
    const familyPath = path.join(adapters, family);
    if (!isDirectory(familyPath)) {
      continue;
    }
    if (!adapterFamilies.has(family)) {
      fail(`unapproved adapter family: ${repositoryPath(familyPath)}`);
      continue;
    }
    if (!isNonEmptyFile(path.join(familyPath, "README.md"))) {
      fail(`adapter family missing README.md: ${repositoryPath(familyPath)}`);
    }
    for (const child of readdirSync(familyPath).sort()) {
      const childPath = path.join(familyPath, child);
      if (isDirectory(childPath)) {
        validateComponent(childPath, "adapters");
      }
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("project organization passed");
