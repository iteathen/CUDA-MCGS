#!/usr/bin/env node
await import("./check-project-organization-core.mjs");
await import("../conformance/source-boundary/verify.mjs");
await import("./check-source-boundary.mjs");
