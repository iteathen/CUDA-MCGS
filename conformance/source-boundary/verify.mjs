#!/usr/bin/env node
/** Permanent falsifiers for the production/evidence/native boundary enforced by ADR-0019. */

import { violationsForFile } from "../../scripts/source-boundary-policy.mjs";

const cases = [
  ["public CUDA-JS root import", "components/search/index.mjs", 'import runtime from "cuda-js";\n', []],
  ["public CUDA-JS subpath import", "adapters/runtimes/cuda/index.mjs", 'import { launch } from "cuda-js/device";\n', []],
  ["independent C++ evidence", "experiments/native-oracle/oracle.cpp", "int main() { return 0; }\n", []],
  ["independent C evidence", "tests/native-oracle/reference.c", "int reference(void) { return 0; }\n", []],
  ["released CUDA-JS dependency", "package.json", '{"dependencies":{"cuda-js":"0.1.0-alpha.7"}}', []],
  ["production C++", "components/search/native.cpp", "int x;\n", ["NON_JS_PRODUCTION_SOURCE"]],
  ["production TypeScript", "adapters/runtimes/cuda/index.ts", "export {};\n", ["NON_JS_PRODUCTION_SOURCE"]],
  ["Python", "scripts/build.py", "print('x')\n", ["PYTHON_SOURCE"]],
  ["native addon binary", "components/search/search.node", "", ["NATIVE_BINARY"]],
  ["native build manifest", "components/search/binding.gyp", "{}\n", ["NATIVE_BUILD_MANIFEST"]],
  ["native addon import", "components/search/index.mjs", 'import ffi from "ffi-napi";\n', ["NATIVE_ADDON_IMPORT"]],
  ["private CUDA-JS package import", "components/search/index.mjs", 'import runtime from "cuda-js/src/runtime.mjs";\n', ["PRIVATE_CUDA_JS_IMPORT"]],
  ["sibling CUDA-JS import", "components/search/index.mjs", 'import runtime from "../../../CUDA-JS/src/runtime.mjs";\n', ["PRIVATE_CUDA_JS_IMPORT"]],
  ["local CUDA-JS-named conformance import", "scripts/run-cuda-js-runtime-adapter.mjs", 'import "../conformance/cuda-js-runtime-adapter/run.mjs";\n', []],
  ["raw private CUDA-JS path", "tools/inspect/index.mjs", 'const sourcePath = "../CUDA-JS/src/runtime.mjs";\n', ["PRIVATE_CUDA_JS_PATH"]],
  ["evidence dependency", "components/search/index.mjs", 'import probe from "../../experiments/probe.mjs";\n', ["EVIDENCE_DEPENDENCY"]],
  ["native subprocess", "components/search/index.mjs", 'import { spawn } from "node:child_process";\n', ["SUBPROCESS_RUNTIME"]],
  ["process builtin subprocess", "components/search/index.mjs", 'const cp = process.getBuiltinModule("node:child_process"); cp.execFile("worker");\n', ["UNINSPECTABLE_MODULE_ACQUISITION"]],
  ["createRequire loader", "components/search/index.mjs", 'import { createRequire } from "node:module"; const load = createRequire(import.meta.url);\n', ["UNINSPECTABLE_MODULE_ACQUISITION"]],
  ["module require loader", "components/search/index.mjs", 'const cp = module.require("node:child_process");\n', ["SUBPROCESS_RUNTIME", "UNINSPECTABLE_MODULE_ACQUISITION"]],
  ["dynamic require loader", "components/search/index.mjs", 'const moduleName = "node:child_process"; const cp = require(moduleName);\n', ["UNINSPECTABLE_MODULE_ACQUISITION"]],
  ["dynamic import loader", "components/search/index.mjs", 'const moduleName = "node:child_process"; const cp = await import(moduleName);\n', ["UNINSPECTABLE_MODULE_ACQUISITION"]],
  ["direct native loader", "components/search/index.mjs", 'process.dlopen(module, "addon.node");\n', ["DIRECT_NATIVE_ACCESS"]],
  ["embedded CUDA source", "tools/generator/index.mjs", 'const source = "#include <cuda.h>";\n', ["EMBEDDED_NATIVE_SOURCE"]],
  ["embedded CUDA qualifier declaration", "tools/generator/index.mjs", 'const source = "__global__ void kernel() {}";\n', ["EMBEDDED_NATIVE_SOURCE"]],
  ["embedded CUDA attributed qualifier declaration", "tools/generator/index.mjs", 'const source = "__global__ __launch_bounds__(256) void kernel() {}";\n', ["EMBEDDED_NATIVE_SOURCE"]],
  ["embedded CUDA multiline device declaration", "tools/generator/index.mjs", 'const source = `__device__\nint helper() { return 0; }`;\n', ["EMBEDDED_NATIVE_SOURCE"]],
  ["CUDA rejection validator regex", "components/search/validation.mjs", 'const FORBIDDEN_SOURCE = /(?:#include|__global__|__device__|\\.ptx\\b)/;\n', []],
  ["driver symbol", "tools/generator/index.mjs", 'const entry = "cuLaunchKernel";\n', ["CUDA_DRIVER_SYMBOL"]],
  ["native package dependency", "package.json", '{"dependencies":{"ffi-napi":"^4.0.0"}}', ["NATIVE_ADDON_DEPENDENCY"]],
  ["native package build script", "package.json", '{"scripts":{"build":"node-gyp rebuild"}}', ["NATIVE_BUILD_SCRIPT"]],
  ["CUDA-JS file dependency", "package.json", '{"dependencies":{"cuda-js":"file:../CUDA-JS"}}', ["CUDA_JS_SOURCE_DEPENDENCY"]],
];

for (const [label, relativePath, text, expected] of cases) {
  const actual = violationsForFile(relativePath, text).map((entry) => entry.code).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`source-boundary falsifier failed: ${label}; expected ${wanted.join(",") || "none"}, got ${actual.join(",") || "none"}`);
  }
  console.log(`case=${label.replaceAll(" ", "-").toLowerCase()} result=pass`);
}

console.log(`source-boundary-falsifiers passed=${cases.length}`);