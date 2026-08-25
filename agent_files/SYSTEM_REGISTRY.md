# UMCGS System Registry

**Scope:** Canonical ownership and source-of-truth registry.

This registry tells developers and agents where durable information and future implementation belong. It is updated in the same change that creates, moves, supersedes, archives, or removes an ownership boundary.

## Registry rules

- One boundary has one stable ID and one primary owner.
- One kind of durable truth has one authoritative location.
- Product components must have a manifest and README before production code enters them.
- Planned boundaries are not implementation authorization.
- Focus branches are semantic work packets, not new ownership boundaries unless authority explicitly creates one.
- Engineering-decision records organize path selection beneath authority; they do not replace specifications or ADRs.
- Token backpressure applies universally, but durable token-budget records exist only when another consumer needs their unique state.
- Selective document reading applies universally, but durable reading maps exist only when another consumer needs exact applicability and invalidation state.
- Cross-component dependencies must be declared in both the component manifest and governing architecture/specification where material.
- Archived and superseded locations never regain authority merely because an agent finds them.
- Retained temporary, evidence, recovery, archive, cleanup-debt, token-budget, document-reading, test-batch, and engineering-decision state has an owner and objective lifecycle trigger.
- Under ADR-0018, universal core, universal extension substrate, and downstream product boundaries remain explicit. A product/capability does not gain universal ownership by being the first consumer.

## Governance and documentation boundaries

| Boundary ID | Owns | Authoritative location | Status |
|---|---|---|---|
| `governance.agent` | Agent workflow, reasoning gates, organization, validation | [`agent_files/`](README.md) | Active |
| `governance.design` | LEGO design hierarchy, components, contracts, composition, foundations, naming, compatibility | [`DESIGN_ALIGNMENT_CARD.md`](DESIGN_ALIGNMENT_CARD.md), [`general_foundation/PRINCIPLES.md`](general_foundation/PRINCIPLES.md), and linked doctrine | Accepted |
| `governance.engineering-judgment` | Specification obligation mapping, reasoning, candidate-path selection, contextual value ordering, tradeoffs, and priority | [`general_foundation/ENGINEERING_JUDGMENT.md`](general_foundation/ENGINEERING_JUDGMENT.md) and [`general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md`](general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md) | Accepted |
| `governance.assessment` | Adversarial assessment before planning and proportional planning records | [`general_foundation/ASSESSMENT_AND_PLANNING.md`](general_foundation/ASSESSMENT_AND_PLANNING.md) | Accepted |
| `governance.focus-branches` | Large-task semantic decomposition, full-attention sizing, parent integration spine, context packets, parallelism, invalidation, and reconciliation | [`general_foundation/FOCUS_BRANCHES.md`](general_foundation/FOCUS_BRANCHES.md) | Accepted |
| `governance.token-discipline` | Universal task backpressure, minimum practice floor, reduction ladder, reserves, context layers/bands, budget elasticity, compaction, handoff, and token-debt prevention | [`general_foundation/TOKEN_DISCIPLINE.md`](general_foundation/TOKEN_DISCIPLINE.md) | Accepted |
| `governance.authority-reading` | Instruction-chain discovery, document applicability, semantic closure, trigger/adjacency scans, context routing, and final authority refresh | [`general_foundation/SPEC_AND_AGENT_FILE_READING.md`](general_foundation/SPEC_AND_AGENT_FILE_READING.md) and [`general_foundation/CONTEXT_ROUTING.md`](general_foundation/CONTEXT_ROUTING.md) | Accepted |
| `governance.documentation` | Document status, discoverability, normative structure, indexing, registry linkage, provenance, and supersession | [`general_foundation/DOCUMENTATION_GOVERNANCE.md`](general_foundation/DOCUMENTATION_GOVERNANCE.md) | Accepted |
| `governance.testing` | Test-oracle accuracy, intent banking, owning capsules, evidence identity/reuse, tiers, failure clustering, repair loops, and test debt | [`general_foundation/TESTING.md`](general_foundation/TESTING.md) and [`general_foundation/DEBUGGING.md`](general_foundation/DEBUGGING.md) | Accepted |
| `governance.execution` | Plan-node readiness, coherent operation execution, deviation handling, recovery, acceptance, and continuation state | [`general_foundation/PLAN_EXECUTION.md`](general_foundation/PLAN_EXECUTION.md) | Accepted |
| `governance.cleanup` | Cleanup inventory, protected state, local/remote disposition, destructive safeguards, verification, and cleanup debt | [`general_foundation/CLEANUP_AND_DISPOSITION.md`](general_foundation/CLEANUP_AND_DISPOSITION.md) | Accepted |
| `governance.sanity` | Sanity/audit claims, semantic coverage, risk-based depth, reconciliation, and findings | [`general_foundation/SANITY_CHECKING.md`](general_foundation/SANITY_CHECKING.md) and [`general_foundation/SEMANTIC_INTERROGATION.md`](general_foundation/SEMANTIC_INTERROGATION.md) | Accepted |
| `governance.pr-integration` | Exact-head PR readiness/review, guarded merge, post-merge verification, and branch/coordination disposition | [`general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md) | Accepted |
| `governance.owner-entry` | Mandatory repository entry rules | [`../AGENTS.md`](../AGENTS.md) | Active |
| `project.charter` | Universal CUDA-MCGS mission, three-layer product boundary, and peer-runtime separation | [`../docs/PROJECT_CHARTER.md`](../docs/PROJECT_CHARTER.md) | Accepted |
| `project.decisions` | Cross-cutting accepted choices, including ADR-0018 layering | [`../docs/decisions/`](../docs/decisions/README.md) | Active |
| `project.specifications` | Universal core, universal extension-substrate, interop, and downstream product specifications | [`../docs/specs/`](../docs/specs/README.md) | Active; accepted/proposal/product documents indexed separately |
| `project.architecture` | Explanatory architecture and repository topology | [`../docs/architecture/`](../docs/architecture/README.md) | Active/proposal set |
| `project.research` | Prior-art and external technical evidence | [`../docs/research/`](../docs/research/README.md) | Active |
| `project.archive` | Superseded documentation provenance | [`../docs/archive/`](../docs/archive/README.md) | Active |
| `project.state` | Current phase and authority summary | [`../STATUS.md`](../STATUS.md) | Active |
| `project.next-step` | Canonical universal engine plan plus explicitly non-gating downstream product lanes | [`../next_step.yaml`](../next_step.yaml) | Active |
| `project.licensing` | Open-source license, commercial-license path, contribution/relicensing grant, and third-party licensing boundary | [`../LICENSE`](../LICENSE) and [`../LICENSING.md`](../LICENSING.md) | Active; `AGPL-3.0-or-later` plus separate commercial licensing |
| `project.contributing` | Public contribution workflow, contributor declarations, and review-entry expectations | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) and [`../.github/pull_request_template.md`](../.github/pull_request_template.md) | Public |
| `project.security` | Public vulnerability-reporting policy, secret-handling expectations, and repository security entry point | [`../SECURITY.md`](../SECURITY.md) and [`general_foundation/SECURITY.md`](general_foundation/SECURITY.md) | Public |
| `project.repository-publication` | Historical public-transition gates, publication sequence, and post-switch verification record | [`../docs/development/PUBLIC_REPOSITORY.md`](../docs/development/PUBLIC_REPOSITORY.md) | Repository is public; checklist retained for provenance/future audit |

## Repository product areas

| Product area | Owns | Location | Current status |
|---|---|---|---|
| `schemas` | Versioned CUDA-MCGS machine-readable universal and namespaced selected contracts/metaschemas | [`../schemas/`](../schemas/README.md) | Active; Search IR 0.1.0 accepted |
| `components` | Production universal CUDA-MCGS search components | [`../components/`](../components/README.md) | Reserved; no implementation authorized |
| `adapters` | Universal/domain/product policy, evaluator, output, domain, and peer-runtime adapters | [`../adapters/`](../adapters/README.md) | Reserved |
| `conformance` | Universal reference backend, synthetic domains, search-contract suites, and public peer-boundary compatibility | [`../conformance/`](../conformance/README.md) | Reserved |
| `benchmarks` | Cross-component reproducible universal and separately namespaced product performance/search-quality suites | [`../benchmarks/`](../benchmarks/README.md) | Reserved |
| `experiments` | Disposable research/prototypes | [`../experiments/`](../experiments/README.md) | Active; CUDA and CUDA-free bounded evidence retained |
| `examples` | Minimal public-surface usage examples | [`../examples/`](../examples/README.md) | Reserved |
| `tools` | CUDA-MCGS-owned developer/build/search-specialization tools | [`../tools/`](../tools/README.md) | Reserved |
| `scripts` | Thin repository task entry points | [`../scripts/`](../scripts/) | Active |
| `tests` | Cross-component/system/end-to-end tests only | [`../tests/`](../tests/README.md) | Reserved |
| `packaging` | CUDA-MCGS Search Image/execution-package composition, manifests, compatibility records, and distribution metadata | [`../packaging/`](../packaging/README.md) | Reserved |
| `third-party` | Vendored external material and provenance | [`../third_party/`](../third_party/README.md) | Reserved |

## Accepted CUDA-MCGS semantic contracts

| Boundary ID | Owns | Authoritative location | Status |
|---|---|---|---|
| `contract.device-search-state-v0` | Device publication channels, state-node/parent-edge ownership, path-cycle ordering, finite-resource accounting, exhaustion, partial-result validity, scheduler-neutral conformance | [`../docs/specs/SPEC-0001-device-search-publication-and-resources.md`](../docs/specs/SPEC-0001-device-search-publication-and-resources.md) | Accepted semantic contract; complete Search IR/production lowering pending |
| `contract.search-ir` | Backend-neutral Search IR 0.1.0 shape, normalization, versioning, and canonical identity | [`../docs/specs/SPEC-0002-search-ir-and-reference-semantics.md`](../docs/specs/SPEC-0002-search-ir-and-reference-semantics.md) and [`../schemas/search-ir/0.1.0/`](../schemas/search-ir/0.1.0/) | Accepted bounded semantic contract; complete representation/production lowering pending |
| `reference.search-ir` | Independent deterministic interpretation of accepted publication, graph, path, resource, stop, and partial-result semantics | [`../experiments/search-ir-reference/`](../experiments/search-ir-reference/README.md) | Accepted disposable reference; no production/CUDA/product authority |

## Planned universal CUDA-MCGS boundaries

These IDs are planning anchors only. Exact contracts/names/implementation locations are not accepted until their version-zero specifications settle ownership.

The active dependency graph and owner-level proposal outputs are governed beneath accepted authority by [`../docs/development/2026-08-24-engine-contract-01-assessment-and-plan.md`](../docs/development/2026-08-24-engine-contract-01-assessment-and-plan.md). Device-owned progress is the semantic owner; a physical scheduler is a later mechanism/profile selection.

| Planned boundary ID | Intended responsibility | Governing work |
|---|---|---|
| `contract.domain` | Product-neutral state/action/transition/identity/history/node-role semantics | [`../docs/specs/SPEC-0007-domain-state-action-and-transition.md`](../docs/specs/SPEC-0007-domain-state-action-and-transition.md) proposal |
| `contract.policy` | Product-neutral selection/reservation/widening/policy statistics/backup/stopping and reroot reuse classification | [`../docs/specs/SPEC-0008-search-policy-and-backup.md`](../docs/specs/SPEC-0008-search-policy-and-backup.md) proposal |
| `contract.evaluator` | Resident evaluator semantics/capabilities/batching/workspace/publication and reroot cache validity | [`../docs/specs/SPEC-0009-evaluator-contract.md`](../docs/specs/SPEC-0009-evaluator-contract.md) proposal |
| `contract.graph` | Graph/node/edge/path/transposition/generation/reclamation mechanics | [`../docs/specs/SPEC-0010-graph-storage-and-reclamation.md`](../docs/specs/SPEC-0010-graph-storage-and-reclamation.md) proposal |
| `contract.session` | Optional external Search Session transaction/root-epoch plus bounded root/control and observation-request/borrow lifecycle coordination; source owners retain reuse/stale/publication/resource/progress meaning | [`../docs/specs/SPEC-0006-search-session-control-and-observation.md`](../docs/specs/SPEC-0006-search-session-control-and-observation.md) proposal |
| `contract.output` | Generic bounded result/observation publication contracts; no mandatory ranked-action payload | [`../docs/specs/SPEC-0013-result-and-observation-publication.md`](../docs/specs/SPEC-0013-result-and-observation-publication.md) proposal |
| `contract.extensions` | Universal Search Stage/base-context/capability/Async Channel/restricted Device-JS Search Program extension-composition substrate | [`../docs/specs/SPEC-0003-search-stage-and-extension-surface.md`](../docs/specs/SPEC-0003-search-stage-and-extension-surface.md), [`../docs/specs/SPEC-0004-async-stage-channels.md`](../docs/specs/SPEC-0004-async-stage-channels.md), [`../docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md`](../docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md) proposals |
| `contract.resources` | Search-memory plan, capacities, root-update admission reserve/pressure, capability/product resources, exhaustion/cancellation/teardown | [`../docs/specs/SPEC-0011-finite-search-resources.md`](../docs/specs/SPEC-0011-finite-search-resources.md) proposal |
| `contract.progress` | Device-owned work readiness, progress, fairness, typed no-progress/deadlock, stopping and scheduler-neutral semantics | [`../docs/specs/SPEC-0012-device-owned-search-progress.md`](../docs/specs/SPEC-0012-device-owned-search-progress.md) proposal |
| `contract.cuda-js-package` | CUDA-MCGS-generated Search Image/execution package and compatibility manifest for peer CUDA-JS | Interop contract v0 |
| `tool.search-schema` | Parse, validate, normalize, diff, and generate universal plus namespaced selected search contracts | Future accepted component specification |
| `tool.search-compiler` | Capability/product resolution, search specialization, layouts/device code, and execution-package generation | Future accepted component specification |
| `integration.cuda-js` | CUDA-MCGS adapter from execution-package semantics to public CUDA-JS runtime | Interop contract v0 |
| `conformance.search` | Synthetic-domain/end-to-end universal CUDA-MCGS conformance independent of chess | Future accepted component specification |

## Downstream domain/search product boundaries

Downstream products consume universal contracts; they do not define them. Product deletion must leave universal architecture/conformance complete.

| Product boundary ID | Owns | Authoritative location | Status |
|---|---|---|---|
| `product.chess` | Chess-specific domain/policy/evaluator/output/session-reuse/support/search-quality semantics, including any ranked legal-move/best-move/MultiPV observation | [`../docs/specs/products/chess/CHESS-0001-search-product.md`](../docs/specs/products/chess/CHESS-0001-search-product.md) and issue #45 | Proposal; does not gate universal parent |

Generic Node/V8 bindings, CUDA Driver call machinery, generic memory providers, NVRTC/link/load, generic long-lived sideband mechanisms, launch/completion/error/teardown, and generic runtime packaging belong to independent `iteathen/CUDA-JS` and must not become CUDA-MCGS component/product entries.

Maintained CUDA-MCGS production source is JavaScript only: ordinary Node.js plus restricted Device-JS through public CUDA-JS contracts. CUDA-JS may use JIT, native code and CUDA-specific implementation wherever needed or desired behind those contracts. A generic GPU mechanism that cannot be expressed naturally, safely and with bounded lifecycle/resource semantics through the current surface is classified for consumer-neutral CUDA-JS ownership under ADR-0019; it is not a new CUDA-MCGS native component. Search/domain/evaluator/product policy remains in the owning CUDA-MCGS boundary.

## Adding, changing, archiving, or removing a registry entry

A coherent change must include:

1. stable boundary ID;
2. purpose and owner;
3. durable location;
4. governing authority;
5. public contracts and dependencies;
6. lifecycle/compatibility status;
7. validation/test owner;
8. cleanup, migration, archive, or supersession record.

Use [`templates/component-manifest.template.yaml`](templates/component-manifest.template.yaml) for product components, [`templates/engineering-decision.template.yaml`](templates/engineering-decision.template.yaml) for durable path/value decisions, [`templates/document-reading.template.yaml`](templates/document-reading.template.yaml) for durable authority/applicability coverage when needed, [`general_foundation/PROJECT_ORGANIZATION.md`](general_foundation/PROJECT_ORGANIZATION.md) for placement, and [`general_foundation/CLEANUP_AND_DISPOSITION.md`](general_foundation/CLEANUP_AND_DISPOSITION.md) for lifecycle. Focus branches, token postures, reading maps, and engineering decisions organize work without inventing new product ownership.
