# CUDA-MCGS search-semantics reference experiment

This disposable CUDA-free experiment is the behavioral reference/conformance capsule planned by [`ENGINE-REFERENCE-01`](../../docs/development/2026-08-25-engine-reference-01-assessment-and-plan.md). `REF-HARNESS-01` supplies the semantic-neutral harness; `REF-DOMAIN-01` supplies the Domain oracle; `REF-GRAPH-01` now has separate NODE/transposition, EDGE/expansion, REF/reference-protection, and PATH/occurrence owner bricks. Root-authority integration, retirement/quiescence/reclamation, ADR-0022 occurrence supersession, Policy, Evaluator, Resource-policy, Progress, Output, Session, Stage and Channel behavioral bricks remain outside those completed Graph slices.

## Question and owner

Can CUDA-MCGS execute finite declared semantic schedules and bounded product-neutral owner oracles against one exact normalized Search IR/Composer packet while preserving owner isolation, immutable publication, mutation sensitivity and reproducible evidence without creating a monolithic reference engine or physical scheduler?

The harness owns canonical evidence identity, finite declared-schedule validation, owner-local state isolation, explicit dependency/publication rules, mutation detection and case accounting. It owns no search semantics, physical scheduler, storage mechanism or CUDA topology.

The Domain oracle owns only bounded state/history normalization and equality, roles, action validity/identity/production, transitions, terminal outcomes, root validation, domain path relations and reuse classifications. The full harness/Domain capsule passes 49/49 with 47/47 direct Domain requirement coverage.

The Graph NODE oracle owns state-node/transposition claim, collision verification, finite local admission accounting and node/transposition-entry ready/failed publication for `GRAPH-NODE-001` through `GRAPH-NODE-011`. Domain identity/equality and foreign-owner initialization are injected through neutral public ports.

The Graph EDGE oracle owns parent-local edge/action/child-link and expansion-generation/batch behavior for `GRAPH-EDGE-001` through `GRAPH-EDGE-010`. It consumes NODE and injected action identity/equality/multiplicity contracts without importing Domain or Policy implementation. Selected expansion storage is finite and contributes explicit resource capacity.

The Graph REF oracle owns `GRAPH-REF-001` through `GRAPH-REF-008`: typed reference validation, arena/incarnation and slot/generation validity, non-wrapping generation advancement, public raw-address exclusion, opaque owner-reference lifecycle delegation, finite protection admission, reusable generation-safe protection tokens, and one declared protect-vs-retire ordering point.

The Graph PATH oracle owns `GRAPH-PATH-001` through `GRAPH-PATH-008`: finite active-path/path-occurrence lifecycle, ordered occurrence access, REF-mediated validation/protection/generation, protection-before-visibility, child-identity-before-path-relation ordering, typed path/depth pressure, opaque owner-local occurrence records, repeated-node/path topology neutrality, and exactly-once release before reusable generation. Domain `classifyPathRelation` is injected; PATH records and forwards relation inputs/results but never decides cycle/repetition cut/continue/transform/fail/backup policy.

PATH author preflight and falsification closed two Graph-profile omissions rather than hiding them in the oracle:

- selected active-path, path-occurrence and per-invocation path-depth storage now have explicit finite resource contributions; and
- reusable transient path storage now has explicit private lifecycle transitions back to `free` after terminal/released states. The Graph normalizer rejects a materialized profile missing those reset transitions. Slot generations advance through the existing REF contract before reuse, so the lifecycle correction does not create a second reference/reuse authority.

## Exact current candidate evidence chain

These identities describe the qualified `ref/graph-path-01` candidate and are not a protected-main integration claim until the PR is merged and read back.

Composer:

- capsule: `cuda-mcgs-search-ir-composer-reference-v0.2.0`;
- expected/discovered/executed/passed: `879/879/879/879`;
- framework-selection SHA-256: `e570172c64592db51ab7ee17c72e5f0e0b09c54d4a89467bd5b6d916aaff2fce` (`10422` canonical bytes);
- representation/composition SHA-256: `c02b4c278edd6ab5cb432593e3aa5e0317eba14bb5eb7f7783f531513c49d34c` (`719510` canonical bytes).

Shared harness/Domain:

- Domain projection SHA-256: `b91ead2d6ec6eb13a6b8eb4ec61055023092269d81dbd36fb440777abf5e36a0` (`69524` canonical bytes);
- cases: `49/49`;
- direct Domain planned/executed coverage: `47/47`;
- evidence SHA-256: `a2b282a6728861e7b537f45d8104e40d45619dbe501e110dca5cfde5548e9971` (`30372` canonical bytes).

Graph projection:

- profiles: `4`;
- SHA-256: `c736152a9944a6fcd44b395146be70460f3ad368add2f5a54e845ba9ca09ac49` (`136759` canonical bytes).

Graph owner evidence:

- NODE: `13/13`, direct `GRAPH-NODE-*` coverage `11/11`, SHA-256 `dabc89fad787e293b6aa356cf3a841faac171e47bf1c8898be0fadd82668b44b` (`10123` canonical bytes);
- EDGE: `16/16`, direct `GRAPH-EDGE-*` coverage `10/10`, SHA-256 `88be10851ae612d8b410564f6f1c1ba972eb2ee41c37a5459714ae1f26737b8d` (`11661` canonical bytes);
- REF: `14/14`, direct `GRAPH-REF-*` coverage `8/8`, SHA-256 `8186a7039c79c604e28eca188f69acfcce0bbcc3ac0eeb5061e7de2b823255a0` (`9139` canonical bytes);
- PATH: `14/14`, direct `GRAPH-PATH-*` coverage `8/8`, SHA-256 `ce0017528309aefb8ef6ffefc94b75984969a8776dfe02ab0f5ee828821dbe58` (`9530` canonical bytes).

The selected normalized identities after the PATH lifecycle correction are:

- Graph: `a6983d9e34f6dfd08bf891f344ccc9d2ba1147b59484275cec96a6b6baf1aafc`;
- Policy: `e1d8bd8ec12b7160da9033a395cdc000edb7e492f04d63e852f6c4f629b9b00c`;
- Resource: `6b765610ca855818c597d91d2e6d8dcaffd8b2de9078b2ce379132323dc43674`;
- Progress: `f4df6ef1e2c56eb7854f20dee89f88150977dcb96b422d71fde547c380d929ea`;
- Output: `5eaab2b8b2c22c37860b47cd7794416da6b4631ec1a2f57d57243e6c38939701`.

## Run

Use Node.js 26 or newer.

Domain/harness:

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-domain-profiles.mjs
node scripts/run-search-semantics-reference.mjs
```

Graph NODE:

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-graph-profiles.mjs
node scripts/run-graph-node-reference.mjs
```

Graph EDGE consumes NODE:

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-graph-profiles.mjs
node scripts/run-graph-node-reference.mjs
node scripts/run-graph-edge-reference.mjs
```

Graph REF consumes the exact Composer/projection/NODE chain:

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-graph-profiles.mjs
node scripts/run-graph-node-reference.mjs
node scripts/run-graph-ref-reference.mjs
```

Graph PATH consumes the exact Composer/projection/NODE/REF chain:

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-graph-profiles.mjs
node scripts/run-graph-node-reference.mjs
node scripts/run-graph-ref-reference.mjs
node scripts/run-graph-path-reference.mjs
```

Focused examples:

```bash
node scripts/run-search-semantics-reference.mjs --case mutation-harness-detects-key-drift
node scripts/run-graph-node-reference.mjs --case graph-node-oracle-sensitivity-collision-verification
node scripts/run-graph-edge-reference.mjs --case graph-edge-published-pending-cancel-terminal
node scripts/run-graph-ref-reference.mjs --case graph-ref-oracle-sensitivity-generation-check
node scripts/run-graph-path-reference.mjs --case graph-path-oracle-sensitivity-relation-before-identity
node scripts/run-graph-path-reference.mjs --case graph-path-oracle-sensitivity-visible-before-protection
```

Generated machine evidence lives under ignored `experiments/search-semantics-reference/build/` and is disposable. Focused evidence cannot support a full-capsule claim.

## PATH case bank

The PATH capsule has 14 cases covering all eight direct requirements:

- exact Composer/Graph/NODE/REF evidence binding;
- path open/reference lifecycle and generation-safe slot reuse;
- node/edge validation before path-visible mutation;
- protection before occurrence visibility plus exact rollback;
- repeated same-node occurrence without Graph-owned cycle policy;
- child resolution before Domain path-relation classification;
- opaque owner-local occurrence records and lifecycle delegation;
- finite active-path capacity with no partial path publication;
- finite depth pressure with no partial occurrence publication;
- close/abandon release exactly once before reusable generation;
- one topology matrix covering self-loop, directed cycle, DAG transposition, stochastic parallel transition and history-distinct equal-base-state cases;
- a relation-before-resolution mutation falsifier;
- a visible-before-protection mutation falsifier; and
- exact 8/8 direct requirement coverage accounting.

The existing NODE, EDGE and REF case banks remain independently runnable and retain their own owner-local acceptance and falsifiers.

## Files

Shared/Domain:

- `fixtures/neutral-schedules.json`, `fixtures/domain-cases.json` and `src/domain*.mjs` — bounded Domain/harness fixtures and oracle;
- `run.mjs` — harness/Domain evidence runner.

Graph projection/NODE/EDGE/REF:

- `../search-ir-composer-reference/src/graph.mjs` and `src/graph-fixtures.mjs` — normalized Graph-profile semantics and fixtures;
- `fixtures/graph-node-cases.json`, `src/graph-node*.mjs`, `run-graph-node.mjs` — NODE;
- `fixtures/graph-edge-cases.json`, `src/graph-edge*.mjs`, `run-graph-edge.mjs` — EDGE;
- `fixtures/graph-ref-cases.json`, `src/graph-ref.mjs`, `src/graph-ref-cases.mjs`, `run-graph-ref.mjs` — REF.

Graph PATH:

- `fixtures/graph-path-cases.json` — exact Composer/Graph/NODE/REF binding and checked-in 14-case bank;
- `src/graph-path.mjs` — PATH semantic core over injected REF/Domain/owner lifecycle ports;
- `src/graph-path-cases.mjs` — PATH cases and falsifiers;
- `run-graph-path.mjs` and `../../scripts/run-graph-path-reference.mjs` — PATH evidence runner/entrypoint;
- `RESULTS.md` — retained bounded identities and claim limits.

## Success, promotion and disposal

Harness/Domain is current at 49/49 with 47/47 direct coverage. NODE is 13/13 with 11/11 direct coverage. EDGE is 16/16 with 10/10 direct coverage. REF is 14/14 with 8/8 direct coverage. PATH is 14/14 with 8/8 direct coverage. Merge remains guarded until final exact-head ordinary CI, author review and protected-main readback complete.

Future Graph leaves add root-anchor integration, retirement/quiescence/reclamation and ADR-0022 occurrence-supersession behavior beside these modules. They may consume normalized public profiles and owner facts, but they may not put search meaning into the neutral harness, import another owner's internal state or convert the experiment into a production CPU runtime. Production code must never import this experiment.

## Claim limits

Passing the current candidate capsules proves only the semantic-neutral harness, bounded Domain behavior, Graph NODE/transposition, Graph EDGE/expansion, Graph REF/reference-protection and Graph PATH/occurrence bricks against the exact proposal identities above. It does not prove Search Session root authority, retirement/quiescence/reclamation, occurrence supersession, the remaining Graph contract, a complete terminal reference engine, proposal acceptance, production JavaScript/Device-JS implementation, CUDA-JS execution, native CUDA, performance, search quality, a public SDK or multi-GPU support.
