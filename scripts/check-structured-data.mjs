#!/usr/bin/env node
/** Validate machine-consumed JSON-compatible YAML artifacts. */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function repositoryPath(absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function loadJsonCompatible(absolutePath, kind) {
  try {
    return JSON.parse(readFileSync(absolutePath, "utf8"));
  } catch (error) {
    throw new Error(`invalid ${kind} ${repositoryPath(absolutePath)}: ${error.message}`);
  }
}

function immediateFiles(directory, predicate) {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) {
    return [];
  }
  return readdirSync(directory)
    .filter((name) => {
      const absolutePath = path.join(directory, name);
      return statSync(absolutePath).isFile() && predicate(name);
    })
    .map((name) => path.join(directory, name))
    .sort();
}

function immediateDirectories(directory) {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) {
    return [];
  }
  return readdirSync(directory)
    .map((name) => path.join(directory, name))
    .filter((absolutePath) => statSync(absolutePath).isDirectory())
    .sort();
}

function recursiveFiles(directory, predicate) {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) {
    return [];
  }
  const files = [];
  for (const entry of readdirSync(directory)) {
    const absolutePath = path.join(directory, entry);
    if (statSync(absolutePath).isDirectory()) {
      files.push(...recursiveFiles(absolutePath, predicate));
    } else if (predicate(entry)) {
      files.push(absolutePath);
    }
  }
  return files.sort();
}

try {
  const required = new Map([
    [path.join(root, "next_step.yaml"), new Set([
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
    ])],
    [path.join(root, "docs", "research", "prior-art", "source-register.yaml"), new Set([
      "schema_version",
      "inspected_date",
      "candidates",
    ])],
  ]);

  for (const [requiredPath, keys] of required) {
    const data = loadJsonCompatible(requiredPath, "JSON-compatible YAML");
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error(`${repositoryPath(requiredPath)} must contain an object`);
    }
    const missing = [...keys].filter((key) => !(key in data)).sort();
    if (missing.length > 0) {
      throw new Error(`${repositoryPath(requiredPath)} missing keys: ${missing.join(", ")}`);
    }
  }

  for (const jsonPath of [
    ...recursiveFiles(path.join(root, "schemas"), (name) => name.endsWith(".json")),
    ...recursiveFiles(path.join(root, "experiments", "search-ir-reference", "fixtures"), (name) => name.endsWith(".json")),
    ...recursiveFiles(path.join(root, "experiments", "search-ir-composer-reference", "fixtures"), (name) => name.endsWith(".json")),
  ]) {
    loadJsonCompatible(jsonPath, "JSON artifact");
  }

  const searchIrSchema = loadJsonCompatible(
    path.join(root, "schemas", "search-ir", "0.1.0", "search-ir.schema.json"),
    "Search IR schema",
  );
  if (searchIrSchema.$schema !== "https://json-schema.org/draft/2020-12/schema"
      || searchIrSchema.properties?.schema?.const !== "cuda-mcgs.search-ir/0.1.0") {
    throw new Error("Search IR schema must declare draft 2020-12 and the accepted 0.1.0 identifier");
  }

  const expectedIdentity = loadJsonCompatible(
    path.join(root, "experiments", "search-ir-reference", "fixtures", "expected-identity.json"),
    "Search IR identity fixture",
  );
  if (expectedIdentity.algorithm !== "sha256"
      || !Number.isSafeInteger(expectedIdentity.byteLength)
      || !/^[0-9a-f]{64}$/.test(expectedIdentity.sha256)) {
    throw new Error("Search IR identity fixture must contain a canonical SHA-256 identity");
  }

  const proposalContractSet = loadJsonCompatible(
    path.join(root, "schemas", "search-ir", "0.2.0", "contract-set.json"),
    "Search IR 0.2.0 proposal contract set",
  );
  if (proposalContractSet.schema !== "cuda-mcgs.search-ir.contract-set/0.2.0"
      || proposalContractSet.representation !== "cuda-mcgs.search-ir/0.2.0"
      || proposalContractSet.status !== "proposal-evidence"
      || proposalContractSet.totals?.contracts !== 12
      || proposalContractSet.totals?.requirements !== 989) {
    throw new Error("Search IR 0.2.0 contract set must remain bounded proposal evidence for 12 contracts and 989 requirements");
  }

  const proposalCoverage = loadJsonCompatible(
    path.join(root, "schemas", "search-ir", "0.2.0", "requirement-coverage.json"),
    "Search IR 0.2.0 proposal requirement coverage",
  );
  if (proposalCoverage.schema !== "cuda-mcgs.search-ir.requirement-coverage/0.2.0"
      || proposalCoverage.contractSet !== proposalContractSet.schema
      || !Number.isSafeInteger(proposalCoverage.totals?.classified)
      || !Number.isSafeInteger(proposalCoverage.totals?.pending)
      || proposalCoverage.totals.classified + proposalCoverage.totals.pending !== 989) {
    throw new Error("Search IR 0.2.0 coverage must partition exactly 989 classified/pending requirements");
  }

  // Templates deliberately remain JSON-compatible so they need no YAML parser.
  for (const templatePath of immediateFiles(path.join(root, "agent_files", "templates"), (name) => name.endsWith(".yaml"))) {
    const data = loadJsonCompatible(templatePath, "JSON-compatible template");
    if (!data || typeof data !== "object" || Array.isArray(data) || !data.schema_version) {
      throw new Error(`${repositoryPath(templatePath)} must contain schema_version`);
    }
  }

  const manifestPaths = immediateDirectories(path.join(root, "components"))
    .map((componentPath) => path.join(componentPath, "component.yaml"));
  for (const familyPath of immediateDirectories(path.join(root, "adapters"))) {
    for (const componentPath of immediateDirectories(familyPath)) {
      manifestPaths.push(path.join(componentPath, "component.yaml"));
    }
  }

  for (const manifestPath of manifestPaths.sort()) {
    if (!existsSync(manifestPath)) {
      continue;
    }
    const data = loadJsonCompatible(manifestPath, "component manifest");
    const component = data && typeof data === "object" && !Array.isArray(data) ? data.component : null;
    if (!component || typeof component !== "object" || Array.isArray(component) || !component.id) {
      throw new Error(`${repositoryPath(manifestPath)} must contain component.id`);
    }
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

console.log("structured data passed");
