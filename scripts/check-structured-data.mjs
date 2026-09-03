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

  const acceptedContractSet = loadJsonCompatible(
    path.join(root, "schemas", "search-ir", "0.2.0", "contract-set.json"),
    "Search IR 0.2.0 accepted contract set",
  );
  if (acceptedContractSet.schema !== "cuda-mcgs.search-ir.contract-set/0.2.0"
      || acceptedContractSet.representation !== "cuda-mcgs.search-ir/0.2.0"
      || acceptedContractSet.status !== "accepted"
      || acceptedContractSet.totals?.contracts !== 12
      || acceptedContractSet.totals?.requirements !== 989) {
    throw new Error("Search IR 0.2.0 contract set must be accepted authority for exactly 12 contracts and 989 requirements");
  }

  const acceptedCoverage = loadJsonCompatible(
    path.join(root, "schemas", "search-ir", "0.2.0", "requirement-coverage.json"),
    "Search IR 0.2.0 accepted requirement coverage",
  );
  const nativeDeferred = acceptedCoverage.classifications
    .filter(({ evidenceStatus }) => evidenceStatus === "deferred-native")
    .reduce((sum, entry) => sum + entry.requirementCount, 0);
  const acceptedReference = acceptedCoverage.classifications
    .filter(({ evidenceStatus }) => evidenceStatus === "accepted-reference")
    .reduce((sum, entry) => sum + entry.requirementCount, 0);
  if (acceptedCoverage.schema !== "cuda-mcgs.search-ir.requirement-coverage/0.2.0"
      || acceptedCoverage.contractSet !== acceptedContractSet.schema
      || acceptedCoverage.totals?.classified !== 989
      || acceptedCoverage.totals?.pending !== 0
      || acceptedReference !== 937
      || nativeDeferred !== 52
      || acceptedCoverage.contracts.some(({ currentDisposition, completionStatus }) => currentDisposition !== "accepted-reference" || completionStatus !== "accepted")) {
    throw new Error("Search IR 0.2.0 coverage must prove 989 classified / 0 pending with 937 accepted-reference and 52 deferred-native requirements");
  }

  const domainProfileSchema = loadJsonCompatible(
    path.join(root, "schemas", "search-ir", "0.2.0", "domain-profile.schema.json"),
    "Search IR 0.2.0 domain profile schema",
  );
  if (domainProfileSchema.$schema !== "https://json-schema.org/draft/2020-12/schema"
      || domainProfileSchema.properties?.schema?.const !== "cuda-mcgs.domain-profile/0.2.0"
      || domainProfileSchema.properties?.representation?.const !== "cuda-mcgs.search-ir/0.2.0"
      || domainProfileSchema.properties?.status?.const !== "accepted"
      || domainProfileSchema.properties?.programContribution?.$ref !== "#/$defs/programContribution"
      || domainProfileSchema.$defs?.programContribution?.properties?.language?.const !== "restricted-device-js"
      || domainProfileSchema.additionalProperties !== false) {
    throw new Error("Search IR 0.2.0 domain profile must remain closed accepted semantic authority with restricted Device-JS program contribution only");
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
