/** Pure ADR-0019 source-boundary classification. No repository I/O belongs here. */

import path from "node:path";

const evidenceRoots = ["benchmarks/", "conformance/", "experiments/", "tests/"];
const archiveRoots = ["docs/archive/"];
const maintainedCodeRoots = ["adapters/", "components/", "examples/", "packaging/", "scripts/", "tools/"];
const productionRuntimeRoots = ["adapters/", "components/", "examples/"];

const pythonSuffixes = new Set([".py", ".pyi", ".pyw"]);
const nonJavaScriptImplementationSuffixes = new Set([
  ".c", ".cc", ".cpp", ".cxx",
  ".h", ".hh", ".hpp", ".hxx",
  ".cu", ".cuh", ".ptx",
  ".rs", ".go", ".zig", ".java",
  ".m", ".mm", ".swift",
  ".ts", ".tsx",
  ".s", ".asm",
]);
const nativeBinarySuffixes = new Set([".node", ".dll", ".dylib", ".so", ".a", ".lib", ".wasm"]);
const nativeBuildNames = new Set([
  "binding.gyp", "cmakelists.txt", "cargo.toml", "cargo.lock", "meson.build", "makefile.native",
]);
const nativeAddonPackages = new Set([
  "bindings", "cmake-js", "ffi-napi", "koffi", "nan", "node-addon-api", "node-gyp", "node-gyp-build", "ref-napi",
]);

const importPatterns = [
  /\b(?:import|export)\s+(?:[^'";]*?\s+from\s+)?["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
];

function slash(value) {
  return value.replace(/\\/g, "/");
}

function isUnder(relativePath, roots) {
  return roots.some((prefix) => relativePath === prefix.slice(0, -1) || relativePath.startsWith(prefix));
}

function isEvidencePath(relativePath) {
  return isUnder(relativePath, evidenceRoots) || isUnder(relativePath, archiveRoots);
}

function isMaintainedCodePath(relativePath) {
  return isUnder(relativePath, maintainedCodeRoots);
}

function isProductionRuntimePath(relativePath) {
  return isUnder(relativePath, productionRuntimeRoots);
}

function push(violations, code, relativePath, detail) {
  violations.push({ code, path: relativePath, detail });
}

function importSpecifiers(text) {
  const values = [];
  for (const pattern of importPatterns) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) values.push(match[1]);
  }
  return values;
}

function isPrivateCudaJsSpecifier(specifier) {
  const normalized = slash(specifier);
  const lower = normalized.toLowerCase();
  const pathSegments = lower.split("/").filter(Boolean);
  const namesCudaJsRepository = pathSegments.some((segment) => segment === "cuda-js" || segment === "cuda_js");
  if (namesCudaJsRepository && (
    lower.startsWith(".") || lower.startsWith("/") || lower.startsWith("file:") || lower.includes("github.com/") || lower.includes("raw.githubusercontent.com/")
  )) return true;

  const packageMatch = normalized.match(/^(?:@iteathen\/)?cuda-js(?:\/(.*))?$/i);
  if (!packageMatch || !packageMatch[1]) return false;
  const segments = packageMatch[1].toLowerCase().split("/");
  return segments.some((segment) => [
    ".git", "build", "experiments", "internal", "native", "node_modules", "private", "src", "test", "tests", "vendor",
  ].includes(segment));
}

function resolvedRepositoryTarget(sourcePath, specifier) {
  if (!specifier.startsWith(".")) return null;
  const rootedSource = `/${slash(sourcePath)}`;
  const rootedTarget = path.posix.normalize(path.posix.join(path.posix.dirname(rootedSource), slash(specifier)));
  if (!rootedTarget.startsWith("/") || rootedTarget.startsWith("/../")) return null;
  return rootedTarget.slice(1);
}

function inspectPackageJson(relativePath, text, violations) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return;
  }
  const dependencyGroups = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
  for (const group of dependencyGroups) {
    const dependencies = data?.[group];
    if (!dependencies || typeof dependencies !== "object" || Array.isArray(dependencies)) continue;
    for (const [name, version] of Object.entries(dependencies)) {
      const lower = name.toLowerCase();
      if (nativeAddonPackages.has(lower)) {
        push(violations, "NATIVE_ADDON_DEPENDENCY", relativePath, `${group}.${name} introduces a native addon/FFI toolchain`);
      }
      if (["cuda-js", "@iteathen/cuda-js"].includes(lower) && typeof version === "string") {
        if (/^(?:file:|link:|workspace:|git(?:\+|:)|github:|https?:|\.\.?\/|\/)/i.test(version)) {
          push(violations, "CUDA_JS_SOURCE_DEPENDENCY", relativePath, `${group}.${name} must use a released/versioned package contract, not ${version}`);
        }
      }
    }
  }
  const scripts = data?.scripts;
  if (scripts && typeof scripts === "object" && !Array.isArray(scripts)) {
    for (const [name, command] of Object.entries(scripts)) {
      if (typeof command === "string" && /\b(?:node-gyp|cmake-js)\b/i.test(command)) {
        push(violations, "NATIVE_BUILD_SCRIPT", relativePath, `script ${name} invokes a native addon build tool`);
      }
    }
  }
}

function inspectProductionModuleAcquisition(relativePath, text, violations) {
  if (!isProductionRuntimePath(relativePath)) return;
  const checks = [
    [/\b(?:globalThis\.)?process(?:\.|\?\.)getBuiltinModule\s*\(/, "process.getBuiltinModule bypasses statically inspectable module imports"],
    [/\bcreateRequire\b/, "createRequire constructs a runtime module loader outside the static import surface"],
    [/\b(?:module|process\.mainModule)\.require\s*\(/, "module.require bypasses the statically inspected require surface"],
    [/\brequire\s*\(\s*(?!["'])/, "dynamic require specifier is not statically inspectable"],
    [/\bimport\s*\(\s*(?!["'])/, "dynamic import specifier is not statically inspectable"],
  ];
  for (const [pattern, detail] of checks) {
    if (pattern.test(text)) push(violations, "UNINSPECTABLE_MODULE_ACQUISITION", relativePath, detail);
  }
}

export function violationsForFile(relativePath, text = "") {
  const normalizedPath = slash(relativePath);
  const lowerPath = normalizedPath.toLowerCase();
  const basename = path.posix.basename(lowerPath);
  const extension = path.posix.extname(lowerPath);
  const violations = [];

  if (
    pythonSuffixes.has(extension)
    || basename === "pyproject.toml"
    || basename === "pipfile"
    || basename === "poetry.lock"
    || (basename.startsWith("requirements") && basename.endsWith(".txt"))
    || lowerPath.split("/").includes("__pycache__")
  ) {
    push(violations, "PYTHON_SOURCE", normalizedPath, "Python source/tooling is outside the CUDA-MCGS ecosystem boundary");
  }

  if (nativeBinarySuffixes.has(extension)) {
    push(violations, "NATIVE_BINARY", normalizedPath, "tracked native/wasm binary artifacts cannot become CUDA-MCGS implementation dependencies");
  }

  if (nonJavaScriptImplementationSuffixes.has(extension) && !isEvidencePath(normalizedPath)) {
    push(violations, "NON_JS_PRODUCTION_SOURCE", normalizedPath, "maintained non-JavaScript implementation source is allowed only in explicit evidence/archive areas");
  }

  if (nativeBuildNames.has(basename) && !isEvidencePath(normalizedPath)) {
    push(violations, "NATIVE_BUILD_MANIFEST", normalizedPath, "native build metadata is allowed only for bounded independent evidence");
  }

  if (basename === "package.json") inspectPackageJson(normalizedPath, text, violations);

  if (!isMaintainedCodePath(normalizedPath) || ![".js", ".mjs", ".cjs", ".jsx"].includes(extension)) return violations;

  const specifiers = importSpecifiers(text);
  let hasPrivateCudaJsImport = false;
  for (const specifier of specifiers) {
    const lowerSpecifier = specifier.toLowerCase();
    if (nativeAddonPackages.has(lowerSpecifier) || lowerSpecifier === "bun:ffi" || specifier.endsWith(".node")) {
      push(violations, "NATIVE_ADDON_IMPORT", normalizedPath, `forbidden native addon/FFI import: ${specifier}`);
    }
    if (isPrivateCudaJsSpecifier(specifier)) {
      hasPrivateCudaJsImport = true;
      push(violations, "PRIVATE_CUDA_JS_IMPORT", normalizedPath, `CUDA-JS must be consumed through a public package export: ${specifier}`);
    }
    const target = resolvedRepositoryTarget(normalizedPath, specifier);
    if (target && isProductionRuntimePath(normalizedPath) && isEvidencePath(target)) {
      push(violations, "EVIDENCE_DEPENDENCY", normalizedPath, `production source must not depend on evidence/archive source: ${specifier}`);
    }
    if (isProductionRuntimePath(normalizedPath) && ["child_process", "node:child_process"].includes(lowerSpecifier)) {
      push(violations, "SUBPROCESS_RUNTIME", normalizedPath, "production search components/adapters/examples may not create a subprocess execution path");
    }
  }

  inspectProductionModuleAcquisition(normalizedPath, text, violations);

  const mechanismChecks = [
    ["DIRECT_NATIVE_ACCESS", /\b(?:process\.dlopen|process\.binding|Deno\.dlopen|Bun\.ffi)\b/, "direct native loader/binding access"],
    ["EMBEDDED_NATIVE_SOURCE", /(?:#\s*include\s*[<\"](?:cuda|nvidia)|\b__(?:global|device)__\b\s+|extern\s+["']C["'])/, "embedded C/CUDA source"],
    ["CUDA_DRIVER_SYMBOL", /\bcu(?:Init|Device|Ctx|Module|Mem|Launch|Stream|Event|Graph|Link|Library|Func)[A-Z0-9_a-z]*\b/, "direct CUDA Driver API symbol"],
    ["PRIVATE_CUDA_JS_PATH", /(?:\.\.?\/[^\n"'`]*CUDA-JS|\.\.?\/[^\n"'`]*cuda-js|(?:CUDA-JS|cuda-js)\/(?:src|internal|private|native|build|vendor|tests?|experiments)\/)/, "private CUDA-JS filesystem/source path"],
  ];
  for (const [code, pattern, detail] of mechanismChecks) {
    if (code === "PRIVATE_CUDA_JS_PATH" && hasPrivateCudaJsImport) continue;
    if (pattern.test(text)) push(violations, code, normalizedPath, detail);
  }

  return violations;
}