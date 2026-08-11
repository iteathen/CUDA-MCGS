#!/usr/bin/env node
/** Verify relative Markdown links without external packages. */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const linkPattern = /(?<!!)\[[^\]]*\]\(([^)]+)\)/g;
const errors = [];

function repositoryPath(absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function markdownFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === ".git") {
      continue;
    }
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...markdownFiles(absolutePath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(absolutePath);
    }
  }
  return files;
}

function decodeTarget(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

for (const markdownPath of markdownFiles(root).sort()) {
  const text = readFileSync(markdownPath, "utf8");
  for (const match of text.matchAll(linkPattern)) {
    const raw = match[1];
    let target = raw.trim().split(/\s+/, 1)[0].replace(/^[<>]+|[<>]+$/g, "");
    if (!target || ["http://", "https://", "mailto:", "#"].some((prefix) => target.startsWith(prefix))) {
      continue;
    }
    target = decodeTarget(target.split("#", 1)[0]);
    if (!target) {
      continue;
    }

    const resolved = path.resolve(path.dirname(markdownPath), target);
    const relative = path.relative(root, resolved);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      errors.push(`${repositoryPath(markdownPath)}: link escapes repository: ${raw}`);
      continue;
    }
    if (!existsSync(resolved)) {
      errors.push(`${repositoryPath(markdownPath)}: missing relative target: ${raw}`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("relative Markdown links passed");
