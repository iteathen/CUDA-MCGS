#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oldRoot = path.join(root, 'experiments', 'search-ir-composer-reference');
const conformanceRoot = path.join(root, 'conformance', 'search-compiler');
const componentRoot = path.join(root, 'components', 'search-compiler');
const componentSrc = path.join(componentRoot, 'src');
const testingPort = path.join(componentRoot, 'testing.mjs');

const production = new Map([
  ['validation.mjs', '7d0e932db4982d1550547732ec42c0d44c9ecea5'],
  ['foundation.mjs', '995622c3d94b5168cf8b0fde3e5e50cf93eb94da'],
  ['domain.mjs', '23562a046ec51cca09f44a0fb24a6b682a3ed880'],
  ['graph.mjs', '6ca0807aca175af2394dde49528b79be77e3f8a5'],
  ['policy.mjs', '7120df01f2b01d30b4db1717b0ddbf54e8ab6ce4'],
  ['evaluator.mjs', '4ffd659de6d84fd3344d4877b0ad8b809999c916'],
  ['resource.mjs', 'a55fd3798dd80539440b7b8818a3a3211cea15f6'],
  ['progress.mjs', '751bcfbf67358692a2085032aa4e336746c202de'],
  ['output.mjs', '4ed19886a4dae35a99d9c93a29224d90c4ecd6ea'],
  ['session.mjs', '406b2c5293f85e02bc8b09b729b1b6d862557868'],
  ['stage.mjs', '34bb8a9f815e46cfa28e70821c592297aa449d24'],
  ['channel.mjs', '59981343ca9194eaca730cb4b80468ab21196244'],
  ['program-package.mjs', '75c67f47d3fa5c7e6586806216b307314c9d2d22'],
  ['composer.mjs', '26d9557eafeba94120f1cb3ea15ee525ade6bea7'],
]);

function slash(value) { return value.split(path.sep).join('/'); }
function relativeImport(fromFile, toFile) {
  let value = slash(path.relative(path.dirname(fromFile), toFile));
  if (!value.startsWith('.')) value = `./${value}`;
  return value;
}
async function exists(target) {
  try { await access(target); return true; } catch { return false; }
}
async function text(target) { return readFile(target, 'utf8'); }
async function write(target, value) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, value.endsWith('\n') ? value : `${value}\n`, 'utf8');
}
async function replaceRequired(target, before, after, label = target) {
  const value = await text(target);
  if (!value.includes(before)) throw new Error(`required text absent in ${label}: ${JSON.stringify(before)}`);
  await write(target, value.replace(before, after));
}
async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}
function gitBlobSha1(bytes) {
  return createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
}

if (!await exists(oldRoot)) throw new Error('expected Composer experiment root is absent');
if (await exists(conformanceRoot)) throw new Error('target conformance/search-compiler already exists');
if (await exists(componentRoot)) throw new Error('target components/search-compiler already exists');

// Move the complete capsule first, then extract only canonical implementation modules.
await rename(oldRoot, conformanceRoot);
await mkdir(componentSrc, { recursive: true });
for (const [name, expectedBlob] of production) {
  const source = path.join(conformanceRoot, 'src', name);
  const destination = path.join(componentSrc, name);
  const bytes = await readFile(source);
  const actualBlob = gitBlobSha1(bytes);
  if (actualBlob !== expectedBlob) throw new Error(`${name} baseline blob drift: ${actualBlob} != ${expectedBlob}`);
  await rename(source, destination);
}

// Production port: accepted normalization/composition operations only. This is repository-internal pre-1.0 surface; #109 owns the later SDK/facade.
const productionExports = [...production.keys()].filter((name) => name !== 'validation.mjs');
await write(path.join(componentRoot, 'index.mjs'), productionExports.map((name) => `export * from './src/${name}';`).join('\n'));
// Explicit conformance-only port. Production consumers must never import this testing surface.
await write(testingPort, [
  "export * from './index.mjs';",
  "export * from './src/validation.mjs';",
].join('\n'));

const componentReadme = `# Search Compiler\n\n**Component ID:** \`tool.search-compiler\`  \n**Status:** Production  \n**Issue:** #205\n\n## Purpose\n\nOwn the canonical pre-ignition implementation that normalizes accepted CUDA-MCGS framework selections and owner profiles, composes deterministic restricted Device-JS Search Programs, and emits accepted Program Package / execution-package meaning. Semantic authority remains in the accepted specifications and schemas; this component is their canonical implementation path.\n\n## Owned invariant\n\nFor one complete accepted input set, there is one deterministic, fail-closed normalization/composition path from selected framework/profile meaning to canonical normalized profiles, Search Program and execution-package identities. Optional-owner deletion leaves only truthfully surviving meaning, and runtime realization facts are explicit before ignition.\n\n## Public and internal boundary\n\n- \`index.mjs\` is the repository-internal production port for canonical normalization/composition operations. It is pre-1.0 and is not the stable SDK promised by #109.\n- \`testing.mjs\` is an explicit conformance-only port. Production components/adapters/examples must not depend on it.\n- \`src/\` is private implementation. Consumers do not deep-import it.\n- schemas and accepted specifications own semantic shapes; this component validates/implements them but does not replace their authority.\n- CUDA-JS is not a dependency of this component. The future \`integration.cuda-js\` adapter (#125) consumes accepted execution-package meaning separately through versioned public CUDA-JS contracts.\n\n## Dependencies\n\nThe component uses Node.js standard-library primitives and injected accepted schema/profile/catalog values. Its canonical owner modules are deliberately colocated because they share one pre-ignition composition lifecycle and a small foundation/validation substrate; splitting them into one component per SPEC owner would create either duplicated foundations or an artificial shared/common component.\n\nForbidden dependencies include \`experiments/\`, \`conformance/\`, CUDA-JS private/deep paths, native/FFI/CUDA source, product semantics, and runtime-owned GPU resource lifecycle.\n\n## Lifecycle and failure\n\nThe component is stateless across calls. Inputs are normalized before ignition; invalid, incomplete, incompatible, unknown, cyclic, over-bound, or ownership-inconsistent inputs fail without publishing a partial valid composition. It allocates no GPU/native resources and owns no post-ignition scheduler or runtime lifecycle.\n\n## Verification\n\nThe owner conformance capsule is \`conformance/search-compiler/\`, executed through \`node scripts/run-search-ir-composer-reference.mjs\`. Promotion qualification also runs the complete Engine reference integration and repository governance/source-boundary gates. The promotion verifier pins the pre-migration Git blob identities of all canonical source modules so #205 cannot smuggle semantic edits into a path move.\n\n## LEGO/deletion result\n\nDeleting CUDA-JS, Tensor, CUDA-NN, UCI products, or any one concrete domain does not remove this component: deterministic framework normalization/composition remains coherent for unrelated consumers. Deleting this component leaves the accepted specifications/schemas and independent semantic reference oracles intact, but removes the production implementation path. A second framework consumer uses the same accepted component ports without new foundational ownership.\n\n## Governing authority\n\n- ADR-0004 repository organization\n- ADR-0005 LEGO design hierarchy\n- ADR-0014 CUDA-JS runtime extraction\n- ADR-0019 public CUDA-JS capability escalation\n- ADR-0020 complete library / resolved defaults\n- ADR-0024 framework-only production ownership\n- SPEC-0000 and accepted SPEC-0003 through SPEC-0013 as applicable\n- SPEC-0005 operation-local-access and external-control-sideband addenda\n- issue #205\n\n## Non-goals\n\nNo stable SDK, product/domain implementation, CUDA-JS runtime adapter, native CUDA code, GPU scheduler, provider registry, universal GPU IR, or second semantic interpreter is created here.\n`;
await write(path.join(componentRoot, 'README.md'), componentReadme);

const manifest = {
  schema_version: 3,
  component: {
    id: 'tool.search-compiler',
    name: 'Search Compiler',
    status: 'production',
    product_area: 'components',
    path: 'components/search-compiler',
    purpose: 'Canonical pre-ignition normalization, specialization and deterministic Search Program/execution-package composition for accepted CUDA-MCGS contracts.',
    roles: ['tool', 'schema'],
    governing_authority: [
      'docs/decisions/ADR-0004-large-project-organization.md',
      'docs/decisions/ADR-0005-lego-design-hierarchy.md',
      'docs/decisions/ADR-0014-extract-cuda-js-runtime.md',
      'docs/decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md',
      'docs/decisions/ADR-0020-complete-library-and-resolved-defaults.md',
      'docs/decisions/ADR-0024-framework-only-production-ownership.md',
      'docs/specs/SPEC-0000-framework-requirements.md',
      'docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md',
      'docs/specs/SPEC-0005-operation-local-resource-access-addendum.md',
      'docs/specs/SPEC-0005-external-control-sideband-addendum.md',
    ],
    design: {
      owned_invariant: 'One deterministic fail-closed pre-ignition implementation path maps accepted selected owner/profile meaning to canonical normalized profiles, Search Program and execution-package meaning without taking over semantic or CUDA runtime authority.',
      intended_equivalence_class: ['product-neutral CUDA-MCGS framework selections', 'optional accepted Stage/Channel/Session selections', 'materially different domain/policy/evaluator/resource profiles'],
      excluded_cases: ['product/domain production semantics', 'CUDA runtime/provider/resource lifecycle', 'native realization', 'post-ignition search scheduling/progression', 'stable public SDK policy'],
      authoritative_state_owner: 'stateless; accepted schemas/specifications own semantic truth and each call owns only its returned immutable normalized values',
      public_ports: ['components/search-compiler/index.mjs', 'components/search-compiler/testing.mjs (conformance only)'],
      injected_dependencies: ['accepted framework/profile/schema/catalog values'],
      adapter_boundaries: ['integration.cuda-js consumes execution-package meaning later; no CUDA-JS dependency here'],
      solid_responsibilities: ['normalize accepted owner contracts', 'compose deterministic Search Programs/packages', 'preserve identity/deletion/fail-closed invariants'],
      cupid_qualities: ['composable', 'predictable', 'idiomatic Node.js', 'domain-based', 'deterministic'],
      second_instance: 'Another unrelated domain/product selects accepted profiles and uses the same component ports without new component ownership or product vocabulary.',
      first_consumer_deletion: 'Deleting any current domain/product or CUDA-JS runtime consumer leaves generic framework normalization/composition coherent and independently testable.',
      essential_complexity: ['cross-owner profile closure', 'canonical identity', 'optional-owner deletion', 'restricted Search Program composition', 'finite package validation'],
      accidental_complexity_rejected: ['one component per SPEC owner with duplicated foundation', 'generic shared/common component', 'experiment compatibility shim', 'second semantic interpreter', 'runtime/provider ownership'],
      complexity_moved_elsewhere: ['semantic authority remains specs/schemas', 'behavioral oracle remains conformance/reference', 'CUDA execution remains CUDA-JS/integration.cuda-js', 'stable facade remains #109'],
      simplest_sufficient_total_system: 'Promote the already canonical colocated implementation as one coherent pre-ignition brick while separating evidence support; do not rewrite or repartition accepted semantics during relocation.'
    },
    public_contracts: ['cuda-mcgs.search-ir/0.2.0', 'cuda-mcgs.program-package-profile/0.2.0', 'cuda-mcgs.search-program/0.2.0', 'cuda-mcgs.execution-package/0.2.0'],
    owns: ['canonical normalization implementation', 'resolved Composer implementation', 'Search Program/Program Package/execution-package implementation projection'],
    persistent_state: [],
    generated_artifacts: ['normalized immutable profile values', 'Search Program values', 'execution-package values'],
    testing: {
      test_owner: 'conformance/search-compiler',
      authoritative_oracles: ['accepted schemas/specifications', 'independent Search IR/Search Semantics reference packets'],
      coverage_map_location: ['schemas/search-ir/0.2.0/requirement-coverage.json'],
      focused_fast_capsules_and_commands: ['node scripts/run-search-ir-composer-reference.mjs'],
      owner_contract_capsules_and_commands: ['node scripts/run-engine-reference-integration.mjs'],
      integration_smoke_dependencies: ['Search IR reference', 'Search Semantics/Graph/Policy/Evaluator/Resource/Progress/Output/Framework/Session/Stage/Channel references'],
      deep_forensic_and_release_triggers: ['semantic identity drift', 'source blob drift during promotion', 'new selected owner', 'public package boundary change'],
      expected_discovery_and_skip_policy: ['Composer case count is exact and zero unexpected skips; downstream evidence fails closed on identity drift'],
      evidence_key_dimensions: ['accepted contract/schema identities', 'normalized owner identities', 'generator revision', 'selected owner/deletion set'],
      test_invalidation_inputs: ['accepted spec/schema changes', 'canonical implementation bytes', 'generator revision', 'selected public requirement mapping'],
      shared_setup_and_mutable_state_isolation: ['immutable catalog/schema setup may be shared; each case owns mutable fixture copies'],
      failure_cluster_and_repair_owner: 'tool.search-compiler for canonical normalization/composition defects; semantic owner for contract defects; conformance owner for oracle defects',
      test_intent_consolidation_and_debt_policy: ['new falsifiers join the owning Composer/conformance capsule rather than creating duplicate interpreters'],
      runtime_output_and_resource_budgets: ['CUDA-free bounded Node.js qualification; no native/performance claim']
    },
    lifecycle_and_cleanup: {
      startup_and_acquisition: ['none beyond immutable input values'],
      steady_state_ownership: ['stateless deterministic call-local normalization/composition'],
      cancellation_and_failure: ['pre-ignition validation failures reject without partial valid publication'],
      teardown_and_resource_release: ['no external/native resources owned'],
      generated_cache_package_test_and_diagnostic_disposition: ['generated conformance build output is ignored/reproducible and not committed'],
      persistence_migration_backup_and_recovery_retention: ['not applicable; accepted versioned schemas/specifications govern compatibility'],
      archive_deprecation_and_supersession: ['old experiments/search-ir-composer-reference path is removed by #205 with no shim'],
      cleanup_verification: ['organization, source-boundary and promotion-boundary gates']
    },
    allowed_dependencies: ['node:crypto', 'accepted input values supplied by callers'],
    forbidden_dependencies: ['experiments/', 'conformance/', 'cuda-js private/deep source', 'native addons/FFI/CUDA source', 'product-specific semantics'],
    known_consumers: ['conformance/search-compiler', 'future interface.library #109', 'future integration.cuda-js #125'],
    validation: ['node scripts/run-search-ir-composer-reference.mjs', 'node scripts/run-engine-reference-integration.mjs', './scripts/verify-docs.sh', 'node scripts/check-source-boundary.mjs'],
    release: {
      unit: 'monorepo',
      compatibility: 'Pre-1.0 repository-internal component surface; accepted schema/spec identity governs semantic compatibility; #109 owns stable public facade/API.',
      distribution: 'internal',
      artifact_and_test_evidence_retention_cleanup: 'No separate artifact; reproducible conformance build output is ignored. Historical experiment provenance remains in Git history/docs, not as a compatibility path.'
    },
    owner: 'CUDA-MCGS framework',
    notes: ['#205 is a structural promotion only; canonical source blobs are byte-identical to protected main@c10c616058e7e492e130e5ff14fa41402290d5b4.']
  }
};
await write(path.join(componentRoot, 'component.yaml'), JSON.stringify(manifest, null, 2));

// Rewire every conformance import that previously crossed into a canonical implementation file.
for (const file of await walk(conformanceRoot)) {
  if (!file.endsWith('.mjs')) continue;
  let value = await text(file);
  let changed = false;
  value = value.replace(/(['"])(\.[^'"\n]+\.mjs)\1/g, (match, quote, specifier) => {
    const resolved = path.resolve(path.dirname(file), specifier);
    if (path.dirname(resolved) === path.join(conformanceRoot, 'src') && production.has(path.basename(resolved))) {
      changed = true;
      return `${quote}${relativeImport(file, testingPort)}${quote}`;
    }
    return match;
  });
  if (changed) await write(file, value);
}

// Stable script/workflow entry points keep their names but target the promoted conformance capsule.
for (const area of ['scripts', '.github/workflows']) {
  const dir = path.join(root, area);
  for (const file of await walk(dir)) {
    if (!/\.(?:mjs|ya?ml|sh)$/.test(file)) continue;
    const value = await text(file);
    if (value.includes('experiments/search-ir-composer-reference')) {
      await write(file, value.replaceAll('experiments/search-ir-composer-reference', 'conformance/search-compiler'));
    }
  }
}
const composerRunner = path.join(root, 'scripts', 'run-search-ir-composer-reference.mjs');
let runner = await text(composerRunner);
if (!runner.includes("verify-promotion-boundary.mjs")) {
  runner += "import '../conformance/search-compiler/verify-promotion-boundary.mjs';\n";
  await write(composerRunner, runner);
}

// Current documentation links point at the durable location. Historical archive/handoff/development provenance is intentionally not rewritten.
for (const area of ['agent_files', 'docs/specs', 'docs/architecture']) {
  for (const file of await walk(path.join(root, area))) {
    if (!/\.(?:md|ya?ml|json)$/.test(file)) continue;
    const value = await text(file);
    if (value.includes('experiments/search-ir-composer-reference')) {
      await write(file, value.replaceAll('experiments/search-ir-composer-reference', 'conformance/search-compiler'));
    }
  }
}
for (const file of await walk(conformanceRoot)) {
  if (!/\.(?:md|mjs|ya?ml)$/.test(file)) continue;
  const value = await text(file);
  if (value.includes('experiments/search-ir-composer-reference')) {
    await write(file, value.replaceAll('experiments/search-ir-composer-reference', 'conformance/search-compiler'));
  }
}

// Reclassify the moved capsule documentation without rewriting historical slice evidence.
await replaceRequired(path.join(conformanceRoot, 'README.md'), '# Search IR 0.2.0 Composer Reference', '# Search Compiler Conformance Capsule', 'conformance README title');
await replaceRequired(path.join(conformanceRoot, 'README.md'), '**Status:** Research Note', '**Status:** Active conformance evidence', 'conformance README status');
await replaceRequired(
  path.join(conformanceRoot, 'README.md'),
  'This bounded CUDA-free capsule implements proposal Search IR 0.2.0 catalog, normalization and reference-Composer evidence in dependency order. It is not a production component, public API, accepted semantic contract or native-support claim.',
  'This bounded CUDA-free capsule validates the production `tool.search-compiler` implementation against accepted Search IR 0.2.0 catalog, normalization, composition, deletion and evidence obligations in dependency order. It is conformance evidence, not semantic authority, a stable public API, a CUDA runtime, or a native-support claim.',
  'conformance README introduction',
);

// Experiments no longer owns the promoted implementation/evidence capsule.
const experimentsReadme = path.join(root, 'experiments', 'README.md');
let experimentsText = await text(experimentsReadme);
experimentsText = experimentsText.split('\n').filter((line) => !line.includes('[`search-ir-composer-reference/`]')).join('\n');
const marker = '## Active experiments\n';
if (!experimentsText.includes(marker)) throw new Error('experiments README active marker absent');
experimentsText = experimentsText.replace(marker, `${marker}\nThe canonical Search Compiler implementation and its owning Composer conformance capsule were promoted under #205 to [\`../components/search-compiler/\`](../components/search-compiler/) and [\`../conformance/search-compiler/\`](../conformance/search-compiler/). No compatibility copy remains under \`experiments/\`.\n`);
await write(experimentsReadme, experimentsText);

const conformanceReadme = path.join(root, 'conformance', 'README.md');
let confText = await text(conformanceReadme);
const confMarker = '## Consolidated conformance capsules\n';
if (!confText.includes(confMarker)) throw new Error('conformance README capsule marker absent');
confText = confText.replace(confMarker, `${confMarker}\n[\`search-compiler/\`](search-compiler/) is the active CUDA-free conformance owner for the production \`tool.search-compiler\` component. It consumes only the declared component testing port, retains Composer/fixture/deletion/mutation/evidence support outside production, and must remain replaceable by stronger independent evidence without becoming a production dependency.\n`);
await write(conformanceReadme, confText);

// Registry: promote the planned stable ID and re-own the evidence location.
const registryPath = path.join(root, 'agent_files', 'SYSTEM_REGISTRY.md');
let registry = await text(registryPath);
registry = registry.replace(
  '| `components` | Production universal CUDA-MCGS search components | [`../components/`](../components/README.md) | Reserved; no implementation authorized |',
  '| `components` | Production universal CUDA-MCGS search components | [`../components/`](../components/README.md) | Active; `tool.search-compiler` is the first production component |',
);
registry = registry.replace(
  '| `conformance` | Universal reference backend, materially varied removable domains/workloads, search-contract suites, and public peer/external-consumer boundary compatibility | [`../conformance/`](../conformance/README.md) | Reserved |',
  '| `conformance` | Universal reference backend, materially varied removable domains/workloads, search-contract suites, and public peer/external-consumer boundary compatibility | [`../conformance/`](../conformance/README.md) | Active; Search Compiler conformance is promoted while independent reference experiments remain bounded evidence |',
);
registry = registry.replace(
  '| `evidence.search-ir-composer` | CUDA-free accepted Search IR 0.2.0 catalog, strict owner-profile normalization, restricted Device-JS Search Program/adapter-requirement composition, canonical identities and bounded deletion/rejection/reference-pair evidence | [`../conformance/search-compiler/`](../conformance/search-compiler/README.md) and [`../schemas/search-ir/0.2.0/`](../schemas/search-ir/0.2.0/) | Accepted semantic/reference evidence; no Device-JS compiler, production/native or lower-runtime authority |',
  '| `evidence.search-ir-composer` | CUDA-free conformance for Search IR 0.2.0 catalog, strict owner-profile normalization, restricted Device-JS Search Program/adapter-requirement composition, canonical identities and bounded deletion/rejection/reference-pair evidence | [`../conformance/search-compiler/`](../conformance/search-compiler/README.md) and [`../schemas/search-ir/0.2.0/`](../schemas/search-ir/0.2.0/) | Active conformance evidence for `tool.search-compiler`; no Device-JS compiler, native or lower-runtime authority |',
);
const plannedRow = '| `tool.search-compiler` | Capability/consumer resolution, search specialization, layouts/device code, and execution-package generation | Future accepted component specification |\n';
if (!registry.includes(plannedRow)) throw new Error('planned tool.search-compiler registry row absent');
registry = registry.replace(plannedRow, '');
const plannedHeading = '## Planned universal CUDA-MCGS boundaries\n';
if (!registry.includes(plannedHeading)) throw new Error('planned registry heading absent');
const productionSection = `## Production implementation boundaries\n\n| Boundary ID | Owns | Authoritative location | Status |\n|---|---|---|---|\n| \`tool.search-compiler\` | Canonical pre-ignition normalization, specialization, deterministic Search Program and execution-package implementation for accepted framework contracts | [\`../components/search-compiler/\`](../components/search-compiler/README.md) | Production component; semantic authority remains accepted specs/schemas; stable SDK remains #109 |\n\n`;
registry = registry.replace(plannedHeading, productionSection + plannedHeading);
await write(registryPath, registry);

// Root README: acknowledge the production compiler without overstating GPU/runtime readiness.
const rootReadme = path.join(root, 'README.md');
let readme = await text(rootReadme);
readme = readme.replace(
  '- bounded reference implementations and semantic falsifiers;',
  '- a production Search Compiler component for canonical pre-ignition normalization/composition, plus bounded independent reference/conformance evidence;',
);
readme = readme.replace(
  'node scripts/run-search-ir-reference.mjs\nnode scripts/run-search-semantics-reference.mjs',
  'node scripts/run-search-ir-reference.mjs\nnode scripts/run-search-ir-composer-reference.mjs\nnode scripts/run-search-semantics-reference.mjs',
);
await write(rootReadme, readme);

// Live state was stale before this migration; reconcile it to the protected #204 base and current #205 transaction.
const status = `# CUDA-MCGS Status\n\n**Status:** Active\n\n**Updated:** 2026-09-04\n\n## Protected semantic state\n\nProtected \`main@c10c616058e7e492e130e5ff14fa41402290d5b4\`, tree \`49ed0a56cdb2214dbdac84af11f349ce62643a63\`, contains the accepted universal semantic/reference packet plus #199 operation-local resource access and #202 bounded external-control sideband projection.\n\nThe accepted packet contains 12 contracts, 989/989 classified Composer requirements, 937 \`accepted-reference\`, exactly 52 \`deferred-native\`, 0 pending, and the complete 393/393 CUDA-free reference route packet. Composer qualification is 883/883 after the permanent #202 authority falsifiers. This does not claim native GPU correctness, physical publication/memory-order qualification, performance, stable SDK, multi-GPU support, product behavior, or an exact CUDA-JS compatible pair.\n\n## Current production-ownership transaction\n\n**#205 — promote canonical Search IR/composition implementation into production component ownership** is the dependency-ready focus before #125.\n\nThe canonical normalization/composition modules were proven on the protected #202 tree while still under \`experiments/search-ir-composer-reference/src/\`. #205 promotes those exact source bytes to \`components/search-compiler/\` as stable component \`tool.search-compiler\`, moves fixture/catalog/deletion/mutation/export evidence support to \`conformance/search-compiler/\`, and removes the old experiment path without a compatibility shim.\n\nSemantic authority remains the accepted specs/schemas. The production component is pre-ignition and stateless; it does not own CUDA-JS runtime/provider/resource lifecycle, a GPU scheduler, native code, product semantics, or the stable public SDK. #109 remains the later facade/resolver owner.\n\n## Production connector seam\n\n#125 remains the future \`integration.cuda-js\` owner and is blocked until #205 is protected-integrated. Its lower baseline remains public \`cuda-js@0.1.0-alpha.18\` at \`iteathen/CUDA-JS@49a2f77d2c8364d67030fbc1c2e870e58e70d334\`. #125 must be refreshed from the post-#205 protected base and consume only versioned public CUDA-JS contracts.\n\n## Immediate dependency chain\n\n1. Complete #205 source/evidence promotion with exact byte/behavior identity proof, full repository qualification and review.\n2. Stop for fresh protected-integration authorization for the exact #205 head/tree/base tuple.\n3. After protected #205 integration, refresh and resume #125 on the durable production Search Compiler surface.\n4. CUDA-JS #32 then owns exact compatible-pair/native publication, race, cancellation and teardown evidence through #125.\n5. #109 completes the stable public library/resolver facade independently of the low-level production component placement.\n\n## Ownership boundary\n\nCUDA-MCGS owns Search IR, Graph/Policy/Evaluator/Resource/Progress/Output/Session/Stage/Channel semantics, finite search resource/pressure policy, deterministic restricted Search Program generation, selected search physical-profile policy, execution-package meaning and its canonical pre-ignition implementation.\n\nCUDA-JS owns actual lower request vocabulary, device/context/memory/compiler/artifact/module/function/operation/publication/provider mechanisms, lower validity/compatibility facts, errors/health and lower resource lifecycle. CUDA-JS-Tensor owns generic Tensor mathematics/device-callable Tensor semantics. Product meaning remains downstream.\n\nA need for native/private lower escape code is a missing-library-capability diagnostic, not permission to bypass the owning library.\n\n## Current-state governance\n\nProtected \`STATUS.md\` and \`next_step.yaml\` own the live execution seam. Issues own durable obligations and evidence. No protected integration occurs without exact-head qualification, review and fresh authorization.\n`;
await write(path.join(root, 'STATUS.md'), status);

const nextStep = {
  schema_version: 111,
  updated: '2026-09-04',
  status: 'production_search_compiler_promotion_active',
  objective: 'Promote the byte-identical accepted canonical Search IR/profile normalization and deterministic composition implementation into durable tool.search-compiler production ownership, while retaining Composer fixture/oracle/evidence support in conformance and leaving no experiment compatibility implementation before #125 resumes.',
  ownership_boundary: 'Accepted specs/schemas own semantic truth. tool.search-compiler owns the canonical stateless pre-ignition implementation. conformance/search-compiler owns fixture/catalog/deletion/mutation/evidence support and may use only the declared component testing port. integration.cuda-js remains #125 and CUDA-JS owns generic runtime/provider/resource lifecycle.',
  protected_state: {
    main: 'c10c616058e7e492e130e5ff14fa41402290d5b4',
    tree: '49ed0a56cdb2214dbdac84af11f349ce62643a63',
    composer_requirements_classified: 989,
    accepted_reference_requirements: 937,
    native_compatible_pair_deferred: 52,
    cuda_free_reference_routes: 393,
    composer_cases: 883,
    external_control_sideband_issue: 202,
    external_control_sideband: 'protected-integrated-through-pr-204',
    cuda_js_lower_baseline: '49a2f77d2c8364d67030fbc1c2e870e58e70d334',
    cuda_js_package: 'cuda-js@0.1.0-alpha.18'
  },
  current_focus: {
    repository: 'iteathen/CUDA-MCGS',
    issue: 205,
    name: 'promote canonical Search Compiler into production component ownership',
    base: 'c10c616058e7e492e130e5ff14fa41402290d5b4',
    state: 'structural ownership migration and qualification; #125 blocked',
    next_action: 'Move the exact canonical implementation blobs to components/search-compiler, rewire conformance through declared component ports, remove the old experiment path, prove byte/semantic identity, then complete exact-head review.',
    exit: 'One production implementation owner exists under components/search-compiler; Composer evidence lives under conformance/search-compiler; no production import reaches experiments/conformance; all exact semantic identities and repository gates are green.'
  },
  blockers: [
    '#125 must not resume until #205 is protected-integrated.',
    'Any semantic identity drift during a source-location-only move is a stop/reassessment condition rather than an acceptable migration side effect.',
    'Any new generic lower capability gap routes to CUDA-JS rather than a CUDA-MCGS native/private workaround.'
  ],
  validation: [
    'All 14 promoted canonical module Git blob identities equal protected main@c10c616 source blobs.',
    'Conformance imports no components/search-compiler/src private file and production imports no experiments/ or conformance/ file.',
    'Composer qualification remains 883/883 with zero weakened falsifiers.',
    'Complete Engine reference integration and final mutation gate remain green.',
    'Project organization, structured-data, documentation governance, source-boundary and CodeQL/required verify checks remain green on the exact head.',
    'Any path/revision-sensitive evidence key is re-keyed explicitly through its declared dependency edge; semantic profile/Search Program/execution-package identities remain unchanged for path-independent meaning.'
  ],
  after_current_focus: [
    'Request fresh protected-integration authorization for the exact qualified/reviewed #205 subject.',
    'After protected #205 integration, refresh #125 from the new protected main and implement integration.cuda-js against public cuda-js only.',
    'CUDA-JS #32 freezes/qualifies the exact compatible pair through #125.',
    '#109 later exposes the stable complete public facade/resolver without duplicating tool.search-compiler ownership.'
  ],
  do_not: [
    'Do not keep a compatibility copy or forwarding implementation under experiments/search-ir-composer-reference.',
    'Do not move fixture/catalog/deletion/mutation or independent reference-oracle code into production components.',
    'Do not let production depend on conformance/search-compiler/testing support.',
    'Do not change accepted search semantics/schemas as part of #205.',
    'Do not start #125 before #205 is protected.',
    'Do not add maintained native/CUDA/PTX/FFI/private CUDA-JS paths.',
    'Do not claim native, performance, stable SDK, product or multi-GPU support from this structural promotion.'
  ],
  hard_constraints: [
    'The 52 deferred-native requirements remain deferred until compatible-pair/native evidence proves them.',
    'Generic lower gaps route to CUDA-JS; generic Tensor gaps route to CUDA-JS-Tensor; product semantics remain downstream.',
    'No protected integration occurs without exact-head qualification, complete review and fresh user authorization.'
  ]
};
await write(path.join(root, 'next_step.yaml'), JSON.stringify(nextStep, null, 2));

// Permanent promotion boundary verifier.
const verifier = `#!/usr/bin/env node\nimport assert from 'node:assert/strict';\nimport { createHash } from 'node:crypto';\nimport { readFile, readdir, stat } from 'node:fs/promises';\nimport path from 'node:path';\nimport { fileURLToPath } from 'node:url';\n\nconst root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');\nconst componentRoot = path.join(root, 'components', 'search-compiler');\nconst conformanceRoot = path.join(root, 'conformance', 'search-compiler');\nconst oldRoot = path.join(root, 'experiments', 'search-ir-composer-reference');\nconst expected = new Map(${JSON.stringify([...production.entries()])});\n\nasync function exists(target) { try { await stat(target); return true; } catch { return false; } }\nasync function walk(dir) { const out=[]; for (const e of await readdir(dir,{withFileTypes:true})) { const f=path.join(dir,e.name); if(e.isDirectory()) out.push(...await walk(f)); else if(e.isFile()) out.push(f); } return out; }\nfunction blob(bytes) { return createHash('sha1').update(Buffer.from(\`blob \${bytes.length}\\0\`)).update(bytes).digest('hex'); }\nfunction imports(text) { const out=[]; for (const p of [/\\b(?:import|export)\\s+(?:[^'\";]*?\\s+from\\s+)?[\"']([^\"']+)[\"']/g,/\\bimport\\s*\\(\\s*[\"']([^\"']+)[\"']\\s*\\)/g]) { for (const m of text.matchAll(p)) out.push(m[1]); } return out; }\n\nassert.equal(await exists(oldRoot), false, 'old Composer experiment path must be absent');\nassert.equal(await exists(componentRoot), true, 'production Search Compiler component is absent');\nassert.equal(await exists(conformanceRoot), true, 'Search Compiler conformance capsule is absent');\nfor (const [name, sha] of expected) { const bytes=await readFile(path.join(componentRoot,'src',name)); assert.equal(blob(bytes),sha,\`promoted source blob drift: \${name}\`); }\n\nfor (const file of await walk(path.join(componentRoot, 'src'))) {\n  if (!file.endsWith('.mjs')) continue;\n  const source=await readFile(file,'utf8');\n  for (const spec of imports(source)) {\n    if (!spec.startsWith('.')) continue;\n    const resolved=path.resolve(path.dirname(file),spec);\n    assert.equal(resolved.startsWith(path.join(componentRoot,'src') + path.sep), true, \`production source crosses component boundary: \${file} -> \${spec}\`);\n  }\n}\nfor (const file of await walk(conformanceRoot)) {\n  if (!file.endsWith('.mjs')) continue;\n  const source=await readFile(file,'utf8');\n  assert.equal(source.includes('components/search-compiler/src/'), false, \`conformance deep-import text in \${file}\`);\n  for (const spec of imports(source)) {\n    if (!spec.startsWith('.')) continue;\n    const resolved=path.resolve(path.dirname(file),spec);\n    if (resolved.startsWith(componentRoot + path.sep)) assert.equal(resolved, path.join(componentRoot,'testing.mjs'), \`conformance must use declared testing port: \${file} -> \${spec}\`);\n  }\n}\nfor (const area of ['components','adapters','examples']) {\n  for (const file of await walk(path.join(root,area))) {\n    if (!file.endsWith('.mjs') && !file.endsWith('.js')) continue;\n    const source=await readFile(file,'utf8');\n    for (const spec of imports(source)) {\n      if (!spec.startsWith('.')) continue;\n      const resolved=path.resolve(path.dirname(file),spec);\n      assert.equal(resolved.startsWith(path.join(root,'experiments')+path.sep), false, \`production imports experiment: \${file} -> \${spec}\`);\n      assert.equal(resolved.startsWith(path.join(root,'conformance')+path.sep), false, \`production imports conformance: \${file} -> \${spec}\`);\n    }\n  }\n}\nconsole.log(\`search_compiler_promotion=pass canonical_blobs=\${expected.size} old_experiment=absent conformance_private_imports=0\`);\n`;
await write(path.join(conformanceRoot, 'verify-promotion-boundary.mjs'), verifier);

// Current active references must no longer present the old path as live authority. Historical provenance is allowed outside these areas.
const activeCheckAreas = ['scripts', '.github/workflows', 'components', 'conformance', 'agent_files', 'docs/specs', 'docs/architecture'];
for (const area of activeCheckAreas) {
  for (const file of await walk(path.join(root, area))) {
    if (!/\.(?:md|mjs|js|json|ya?ml|sh)$/.test(file)) continue;
    const value = await text(file);
    if (value.includes('experiments/search-ir-composer-reference')) throw new Error(`stale active Composer path remains: ${slash(path.relative(root, file))}`);
  }
}

// The conformance capsule must not retain an empty src directory after support extraction.
if ((await readdir(path.join(conformanceRoot, 'src'))).length === 0) await rm(path.join(conformanceRoot, 'src'), { recursive: true, force: true });

console.log(`promotion_constructed=pass production_modules=${production.size} base=c10c616058e7e492e130e5ff14fa41402290d5b4`);
