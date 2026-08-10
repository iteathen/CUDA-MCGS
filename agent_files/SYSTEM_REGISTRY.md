# UMCGS System Registry

**Scope:** Canonical ownership and source-of-truth registry.

This registry tells developers and agents where durable information and future implementation belong. It is updated in the same change that creates, moves, supersedes, archives, extracts, or removes an ownership boundary.

## Registry rules

- One boundary has one stable ID and one primary owner.
- One kind of durable truth has one authoritative location.
- Product components must have a manifest and README before production code enters them.
- Planned boundaries are not implementation authorization.
- Focus branches are semantic work packets, not new ownership boundaries unless authority explicitly creates one.
- Test capsules belong to the owner whose invariant or contract they validate; cross-component/system tests live under the existing `tests` product area.
- Cross-component and cross-repository dependencies must be declared through public contracts and compatibility manifests.
- Archived and superseded locations never regain authority merely because an agent finds them.
- Retained temporary, evidence, recovery, archive, cleanup-debt, token-budget, and test-batch state has an owner and objective lifecycle trigger.

## Governance and documentation boundaries

| Boundary ID | Owns | Authoritative location | Status |
|---|---|---|---|
| `governance.agent` | Agent workflow, reasoning gates, organization, validation | [`agent_files/`](README.md) | Active |
| `governance.design` | LEGO design hierarchy, components, contracts, composition, foundations, naming, compatibility | [`DESIGN_ALIGNMENT_CARD.md`](DESIGN_ALIGNMENT_CARD.md), [`general_foundation/PRINCIPLES.md`](general_foundation/PRINCIPLES.md), and linked doctrine | Accepted |
| `governance.assessment` | Adversarial assessment before planning and proportional planning records | [`general_foundation/ASSESSMENT_AND_PLANNING.md`](general_foundation/ASSESSMENT_AND_PLANNING.md) | Accepted |
| `governance.focus-branches` | Large-task decomposition, full-attention sizing, integration spine, invalidation, and reconciliation | [`general_foundation/FOCUS_BRANCHES.md`](general_foundation/FOCUS_BRANCHES.md) | Accepted |
| `governance.token-discipline` | Token reserves, context routing, compaction, handoff, and token-debt prevention | [`general_foundation/TOKEN_DISCIPLINE.md`](general_foundation/TOKEN_DISCIPLINE.md) and [`general_foundation/CONTEXT_ROUTING.md`](general_foundation/CONTEXT_ROUTING.md) | Accepted |
| `governance.execution` | Plan-node readiness, coherent operation execution, deviation handling, recovery, acceptance, and continuation | [`general_foundation/PLAN_EXECUTION.md`](general_foundation/PLAN_EXECUTION.md) | Accepted |
| `governance.testing` | Test accuracy/completeness, intent banking, consolidated capsules, evidence reuse, failure clustering, and repair-loop efficiency | [`general_foundation/TESTING.md`](general_foundation/TESTING.md) and [`general_foundation/DEBUGGING.md`](general_foundation/DEBUGGING.md) | Accepted |
| `governance.cleanup` | Cleanup inventory, protected state, local/remote disposition, safeguards, verification, and cleanup debt | [`general_foundation/CLEANUP_AND_DISPOSITION.md`](general_foundation/CLEANUP_AND_DISPOSITION.md) | Accepted |
| `governance.sanity` | Sanity/audit claims, semantic coverage, risk-based depth, reconciliation, and findings | [`general_foundation/SANITY_CHECKING.md`](general_foundation/SANITY_CHECKING.md) and [`general_foundation/SEMANTIC_INTERROGATION.md`](general_foundation/SEMANTIC_INTERROGATION.md) | Accepted |
| `governance.pr-integration` | Exact-head PR readiness/review, guarded merge, post-merge verification, and branch/coordination disposition | [`general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md) | Accepted |
| `governance.owner-entry` | Mandatory repository entry rules | [`../AGENTS.md`](../AGENTS.md) | Active |
| `project.charter` | UMCGS mission and search-product boundary | [`../docs/PROJECT_CHARTER.md`](../docs/PROJECT_CHARTER.md) | Accepted |
| `project.decisions` | Cross-cutting accepted choices | [`../docs/decisions/`](../docs/decisions/README.md) | Active |
| `project.specifications` | Normative UMCGS search contracts | [`../docs/specs/`](../docs/specs/README.md) | Proposal set |
| `project.architecture` | Explanatory UMCGS and inter-repository architecture | [`../docs/architecture/`](../docs/architecture/README.md) | Proposal/informational set |
| `project.research` | Prior-art and external evidence | [`../docs/research/`](../docs/research/README.md) | Active |
| `project.archive` | Superseded documentation provenance | [`../docs/archive/`](../docs/archive/README.md) | Active |
| `project.state` | Current phase and authority summary | [`../STATUS.md`](../STATUS.md) | Active |
| `project.next-step` | One coherent next boundary or active focus-branch packet | [`../next_step.yaml`](../next_step.yaml) | Active |

## External peer repositories

| Peer ID | Repository | Owns | UMCGS dependency surface | Status |
|---|---|---|---|---|
| `peer.cuda-js` | `iteathen/CUDA-JS` | Generic Node.js/CUDA Driver runtime, JIT/native bindings, opaque resources, memory capabilities, NVRTC/link/load, generic launch/completion/error/teardown, packaging and runtime conformance | Versioned public runtime package, schemas, capabilities, artifact manifests, and compatibility evidence consumed only through `integration.cuda-js` | Accepted boundary; local bootstrap prepared, remote repository creation pending |

External peer rules:

- UMCGS does not deep-import or copy peer private source.
- Peers are consumed by released/versioned artifacts and exact compatibility manifests, not branches, submodules, or local paths.
- A peer's mock cannot silently become the UMCGS semantic oracle.
- Cross-repository tests cover the public compatibility boundary without duplicating both repositories' complete suites.

## Repository product areas

| Product area | Owns | Location | Current status |
|---|---|---|---|
| `schemas` | Versioned UMCGS Search IR, search contracts, execution-package schemas, and metaschemas | [`../schemas/`](../schemas/README.md) | Reserved |
| `components` | Production UMCGS search framework components and owner-local tests | [`../components/`](../components/README.md) | Reserved; no implementation authorized |
| `adapters` | Domain, policy, evaluator, output, and external-runtime adapters with owner-local conformance tests | [`../adapters/`](../adapters/README.md) | Reserved |
| `conformance` | Search IR reference backend, synthetic domains, and public search-contract capsules | [`../conformance/`](../conformance/README.md) | Reserved |
| `benchmarks` | Cross-component and compatible-runtime reproducible performance/quality suites | [`../benchmarks/`](../benchmarks/README.md) | Reserved |
| `experiments` | Disposable search/runtime-boundary investigations and provisional reproducers | [`../experiments/`](../experiments/README.md) | Reserved |
| `examples` | Minimal public-surface usage examples | [`../examples/`](../examples/README.md) | Reserved |
| `tools` | Reusable search schema, specialization, generation, package, and test orchestration tools | [`../tools/`](../tools/README.md) | Reserved |
| `scripts` | Thin repository task entry points | [`../scripts/`](../scripts/) | Active |
| `tests` | Cross-component/system/end-to-end search and interop capsules only | [`../tests/`](../tests/README.md) | Reserved |
| `packaging` | UMCGS release composition, execution-package manifests, compatibility matrices, and distribution metadata | [`../packaging/`](../packaging/README.md) | Reserved |
| `third-party` | Vendored external material and provenance | [`../third_party/`](../third_party/README.md) | Reserved |

## Planned UMCGS product components

The following IDs are planning anchors only. Their exact contracts, names, and locations are not accepted until version-zero specifications settle ownership.

| Planned boundary ID | Intended responsibility | Governing work |
|---|---|---|
| `contract.search-ir` | Normalized Search IR and versioning | Search IR v0 specification |
| `contract.domain` | State/action/transition/identity/cycle contract | Domain contract v0 |
| `contract.policy` | Selection/reservation/backup/output ranking contract | Search-policy contract v0 |
| `contract.evaluator` | Resident evaluator semantics, batching, workspace, and publication | Evaluator contract v0 |
| `contract.resources` | Search memory plan, capacities, pressure, cancellation, and exhaustion | Resource contract v0 |
| `contract.cuda-js-package` | Versioned UMCGS execution-package and compatibility schema | UMCGS-to-CUDA-JS interop v0 specification |
| `tool.schema` | Parse, validate, normalize, diff, and generate UMCGS contracts | Future accepted component specification |
| `tool.compiler` | Search capability resolution, finite planning, specialization, layout/device-code and execution-package generation | Future accepted component specification |
| `integration.cuda-js` | Map UMCGS execution packages and results to the public CUDA-JS runtime contract | UMCGS-to-CUDA-JS interop v0 specification |
| `runtime.search-device` | Search-specific device-owned execution and queues embodied in generated modules | Future accepted component specification |
| `runtime.graph-store` | Nodes, edges, state/action arenas, references, and reclamation | Future accepted component specification |
| `runtime.transposition` | Keying, lookup, claim/publication, and collision verification | Future accepted component specification |
| `runtime.search-scheduler` | Device-owned selection/expansion/evaluator/backup scheduling | Future accepted component specification |
| `runtime.diagnostics` | Bounded search-semantic diagnostics emitted through the package/runtime boundary | Future accepted component specification |
| `sdk.adapters` | Stable search-adapter-facing contracts/tooling | Future accepted component specification |

Generic host runtime, Driver binding, generic memory, NVRTC plumbing, streams/events, Node completion delivery, and generic context teardown are intentionally absent from this table; they belong to CUDA-JS.

## Adding, changing, extracting, archiving, or removing a registry entry

A coherent change must include:

1. stable boundary ID;
2. purpose and owner;
3. durable location or peer repository;
4. governing authority;
5. public contracts and dependencies;
6. lifecycle/compatibility/release status;
7. validation/test owner and canonical capsule commands;
8. cleanup, migration, extraction, archive, or supersession record.

Use [`templates/component-manifest.template.yaml`](templates/component-manifest.template.yaml) for UMCGS components. Use [`general_foundation/PROJECT_ORGANIZATION.md`](general_foundation/PROJECT_ORGANIZATION.md) and ADR-0014 for repository extraction. Use the focus-branch, token, testing, and cleanup doctrines without inventing duplicate ownership hierarchies.