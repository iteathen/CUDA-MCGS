#!/usr/bin/env node
/** Scan the tracked repository shape against the pure ADR-0019 source-boundary policy. */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { violationsForFile } from "./source-boundary-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walkFiles(directory, relative = "") {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
    const childAbsolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(childAbsolute, childRelative));
    else if (entry.isFile()) files.push(childRelative);
  }
  return files;
}

function fileText(relativePath) {
  const lower = relativePath.toLowerCase();
  const extension = path.posix.extname(lower);
  const basename = path.posix.basename(lower);
  if ([".js", ".mjs", ".cjs", ".jsx", ".json"].includes(extension) || basename === "package.json") {
    return readFileSync(path.join(root, relativePath), "utf8");
  }
  return "";
}

const violations = [];
const files = walkFiles(root).sort();
for (const relativePath of files) {
  violations.push(...violationsForFile(relativePath, fileText(relativePath)));
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`${violation.code}: ${violation.path}: ${violation.detail}`);
  }
  process.exit(1);
}

console.log(`source boundary passed files=${files.length}`);
