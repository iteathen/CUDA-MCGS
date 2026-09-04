# CUDA-MCGS System Registry

**Scope:** Canonical ownership and source-of-truth registry.

This registry tells developers and agents where durable information and future implementation belong. It is updated in the same change that creates, moves, supersedes, archives, or removes an ownership boundary.

## Registry rules

- One boundary has one stable ID and one primary owner.
- One kind of durable truth has one authoritative location.
- CUDA-MCGS production components must have a manifest and README before production code enters them.
- Planned boundaries are not implementation authorization.
- Focus branches are semantic work packets, not new ownership boundaries unless authority explicitly creates one.
- Engineering-decision records organize path selection beneath authority; they do not replace specifications or ADRs.
- Token backpressure applies universally, but durable token-budget records exist only when another consumer needs their unique state.
- Selective document reading applies universally, but durable reading maps exist only when another consumer needs exact applicability and invalidation state.
- Cross-component dependencies must be declared in both the component manifest and governing architecture/specification where material.
- Archived and superseded locations never regain authority merely because an agent finds them.
- Retained temporary, evidence, recovery, archive, cleanup-debt, token-budget, document-reading, test-batch, and engineering-decision state has an owner and objective lifecycle trigger.
- Under ADR-0018, universal core, universal extension substrate, and downstream product meaning remain semantically explicit. Under ADR-0024, production domain/search products live outside CUDA-MCGS production ownership. A product/capability does not gain universal ownership by being the first consumer.
- Concrete named domains/products may remain as removable conformance, research or example evidence; they do not create a CUDA-MCGS product registry entry or release owner.

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
| `project.charter` | Universal CUDA-MCGS mission, framework-only production boundary, and peer-runtime separation | [`../docs/PROJECT_CHARTER.md`](../docs/PROJECT_CHARTER.md) | Accepted |
| `project.decisions` | Cross-cutting accepted choices, including ADR-0018 semantic layering and ADR-0024 production ownership | [`../docs/decisions/`](../docs/decisions/README.md) | Active |
| `project.specifications` | CUDA-MCGS universal core, extension-substrate and interop specifications | [`../docs/specs/`](../docs/specs/README.md) | Active; accepted/proposal framework documents indexed separately |
| `project.architecture` | Explanatory architecture and repository topology | [`../docs/architecture/`](../docs/architecture/README.md) | Active/proposal set |
| `project.research` | Prior-art and external technical evidence | [`../docs/research/`](../docs/research/README.md) | Active |
| `project.archive` | Superseded documentation provenance, including historical repository-local product proposals | [`../docs/archive/`](../docs/archive/README.md) | Active; never current authority |
| `project.state` | Current phase and authority summary | [`../STATUS.md`](../STATUS.md) | Active |
| `project.next-step` | Canonical issue-portfolio sequencing and exact current execution state | [`../next_step.yaml`](../next_step.yaml) | Active |
| `project.licensing` | Open-source license, commercial-license path, contribution/relicensing grant, and third-party licensing boundary | [`../LICENSE`](../LICENSE) and [`../LICENSING.md`](../LICENSING.md) | Active; `AGPL-3.0-or-later` plus separate commercial licensing |
| `project.contributing` | Public contribution workflow, contributor declarations, and review-entry expectations | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) and [`../.github/pull_request_template.md`](../.github/pull_request_template.md) | Public |
| `project.security` | Public vulnerability-reporting policy, secret-handling expectations, and repository security entry point | [`../SECURITY.md`](../SECURITY.md) and [`general_foundation/SECURITY.md`](general_foundation/SECURITY.md) | Public |
| `project.repository-publication` | Historical public-transition gates, publication sequence, and post-switch verification record | [`../docs/development/PUBLIC_REPOSITORY.md`](../docs/development/PUBLIC_REPOSITORY.md) | Repository is public; checklist retained for provenance/future audit |

## Repository product areas

| Product area | Owns | Location | Current status |
|---|---|---|---|
| `schemas` | Versioned CUDA-MCGS machine-readable universal and namespaced selected contracts/metaschemas | [`../schemas/`](../schemas/README.md) | Active; Search IR 0.1.0 foundation and 0.2.0 universal semantic/profile/program/package authority accepted; native realization deferred |
| `components` | Production universal CUDA-MCGS search components | [`../components/`](../components/README.md) | Active; `tool.search-compiler` is the first production component |
| `adapters` | Consumer-neutral domain/policy/evaluator/output integration and peer-runtime adapters | [`../adapters/`](../adapters/README.md) | Active; `integration.cuda-js` is the first production peer-runtime adapter; no external product semantics owned here |
| `conformance` | Universal reference backend, materially varied removable domains/workloads, search-contract suites, and public peer/external-consumer boundary compatibility | [`../conformance/`](../conformance/README.md) | Active; Search Compiler and portable CUDA-JS adapter conformance are active while independent reference experiments remain bounded evidence |
| `benchmarks` | Cross-component reproducible framework mechanism/resource/performance suites; concrete workloads remain evidence rather than product quality authority | [`../benchmarks/`](../benchmarks/README.md) | Reserved |
| `experiments` | Disposable research/prototypes | [`../experiments/`](../experiments/README.md) | Active; CUDA-free bounded evidence only; deleted native experiment conclusions are archived as non-executable provenance |
| `examples` | Minimal public-surface usage examples, including removable concrete consumers where useful | [`../examples/`](../examples/README.md) | Reserved |
| `tools` | CUDA-MCGS-owned developer/build/search-specialization tools | [`../tools/`](../tools/README.md) | Reserved |
| `scripts` | Thin repository task entry points | [`../scripts/`](../scripts/) | Active |
| `tests` | Cross-component/system/end-to-end framework tests only | [`../tests/`](../tests/README.md) | Reserved |
| `packaging` | CUDA-MCGS Search Image/execution-package composition, manifests, compatibility records, and distribution metadata | [`../packaging/`](../packaging/README.md) | Reserved |
| `third-party` | Vendored external material and provenance | [`../third_party/`](../third_party/README.md) | Reserved |

## Accepted CUDA-MCGS semantic contracts

| Boundary ID | Owns | Authoritative location | Status |
|---|---|---|---|
| `contract.device-search-state-v0` | Device publication channels, state-node/parent-edge ownership, path-cycle ordering, finite-resource accounting, exhaustion, partial-result validity, scheduler-neutral conformance | [`../docs/specs/SPEC-0001-device-search-publication-and-resources.md`](../docs/specs/SPEC-0001-device-search-publication-and-resources.md) | Accepted semantic contract; complete Search IR/production lowering pending |
| `contract.search-ir` | Backend-neutral Search IR 0.1.0 shape, normalization, versioning, and canonical identity | [`../docs/specs/SPEC-0002-search-ir-and-reference-semantics.md`](../docs/specs/SPEC-0002-search-ir-and-reference-semantics.md) and [`../schemas/search-ir/0.1.0/`](../schemas/search-ir/0.1.0/) | Accepted bounded semantic contract; complete representation/production lowering pending |
| `reference.search-ir` | Independent deterministic interpretation of accepted publication, graph, path, resource, stop, and partial-result semantics | [`../experiments/search-ir-reference/`](../experiments/search-ir-reference/README.md) | Accepted disposable reference; no production/CUDA/product authority |
| `contract.framework` | Cross-owner LEGO composition/dependency map, normalized engine identity, lifecycle/deletion/package and integrated conformance obligations | [`../docs/specs/SPEC-0000-framework-requirements.md`](../docs/specs/SPEC-0000-framework-requirements.md) | Accepted 0.1.0 semantic contract; production lowering separate |
| `contract.domain` | Product-neutral state/action/transition/identity/history/node-role semantics | [`../docs/specs/SPEC-0007-domain-state-action-and-transition.md`](../docs/specs/SPEC-0007-domain-state-action-and-transition.md) | Accepted 0.1.0 semantic contract |
| `contract.policy` | Product-neutral selection/reservation/widening/statistics/value/backup/stopping/reuse semantics | [`../docs/specs/SPEC-0008-search-policy-and-backup.md`](../docs/specs/SPEC-0008-search-policy-and-backup.md) | Accepted 0.1.0 semantic contract |
| `contract.evaluator` | Optional product-neutral evaluator capability/request/result/batching/cache semantics | [`../docs/specs/SPEC-0009-evaluator-contract.md`](../docs/specs/SPEC-0009-evaluator-contract.md) | Accepted 0.1.0 semantic contract |
| `contract.graph` | Graph object/reference/path/transposition/root-protection/reclamation semantics | [`../docs/specs/SPEC-0010-graph-storage-and-reclamation.md`](../docs/specs/SPEC-0010-graph-storage-and-reclamation.md) | Accepted 0.1.0 semantic contract |
| `contract.session` | Optional external Search Session/root/attention/observation coordination | [`../docs/specs/SPEC-0006-search-session-control-and-observation.md`](../docs/specs/SPEC-0006-search-session-control-and-observation.md) | Accepted 0.2.0 semantic contract |
| `contract.output` | Bounded result/observation publication semantics | [`../docs/specs/SPEC-0013-result-and-observation-publication.md`](../docs/specs/SPEC-0013-result-and-observation-publication.md) | Accepted 0.1.0 semantic contract |
| `contract.extensions` | Optional Stage/Channel/restricted Search Program composition with zero-residue absence | [`../docs/specs/SPEC-0003-search-stage-and-extension-surface.md`](../docs/specs/SPEC-0003-search-stage-and-extension-surface.md), [`../docs/specs/SPEC-0004-async-stage-channels.md`](../docs/specs/SPEC-0004-async-stage-channels.md), [`../docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md`](../docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md) | Accepted 0.3.0/0.3.0/0.4.0 semantic contracts |
| `contract.resources` | Finite selected-owner resource composition/admission/accounting/pressure semantics | [`../docs/specs/SPEC-0011-finite-search-resources.md`](../docs/specs/SPEC-0011-finite-search-resources.md) | Accepted 0.1.0 semantic contract |
| `contract.progress` | Device-owned readiness/fairness/no-progress/stop/drain/closure semantics | [`../docs/specs/SPEC-0012-device-owned-search-progress.md`](../docs/specs/SPEC-0012-device-owned-search-progress.md) | Accepted 0.1.0 semantic contract |
| `contract.cuda-js-package` | MCGS Search Program/execution-package semantics plus MCGS-owned CUDA-JS adapter requirements; installed public CUDA-JS remains lower authority | [`../docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md`](../docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md), [`../schemas/search-ir/0.2.0/execution-package.schema.json`](../schemas/search-ir/0.2.0/execution-package.schema.json) | Accepted semantic/package boundary; `integration.cuda-js` provides public portable realization while exact native compatible-pair evidence remains CUDA-JS #32 |
| `evidence.search-ir-composer` | CUDA-free conformance for Search IR 0.2.0 catalog, strict owner-profile normalization, restricted Device-JS Search Program/adapter-requirement composition, canonical identities and bounded deletion/rejection/reference-pair evidence | [`../conformance/search-compiler/`](../conformance/search-compiler/README.md) and [`../schemas/search-ir/0.2.0/`](../schemas/search-ir/0.2.0/) | Active conformance evidence for `tool.search-compiler`; no Device-JS compiler, native or lower-runtime authority |
| `evidence.search-semantics-reference` | Semantic-neutral finite declared-schedule execution plus owner-local behavioral oracles bound to exact public proposal Composer/profile identities, with immutable facts, mutation sensitivity and source-keyed evidence | [`../experiments/search-semantics-reference/`](../experiments/search-semantics-reference/README.md) | Accepted bounded CUDA-free owner/reference packet: 393/393 routes; native compatible-pair, production and performance authority remain deferred |

## Production implementation boundaries

| Boundary ID | Owns | Authoritative location | Status |
|---|---|---|---|
| `tool.search-compiler` | Canonical pre-ignition normalization, specialization, deterministic Search Program and execution-package implementation for accepted framework contracts | [`../components/search-compiler/`](../components/search-compiler/README.md) | Production component; semantic authority remains accepted specs/schemas; stable SDK remains #109 |
| `integration.cuda-js` | Fail-closed translation/composition from accepted execution-package requirements to an exact injected public CUDA-JS runtime peer, including bounded operation/control lifecycle and adapter-owned rollback | [`../adapters/runtimes/cuda-js/`](../adapters/runtimes/cuda-js/README.md) | Production adapter; portable public-contract qualification owned by `conformance/cuda-js-runtime-adapter`; native exact-pair qualification remains CUDA-JS #32 |

## Planned universal CUDA-MCGS boundaries

The remaining IDs in this section are implementation/tool/conformance planning anchors. The universal semantic contracts promoted above are no longer planning-only.

The active dependency graph and owner-level proposal outputs are governed beneath accepted authority by [`../docs/development/2026-08-24-engine-contract-01-assessment-and-plan.md`](../docs/development/2026-08-24-engine-contract-01-assessment-and-plan.md). Device-owned progress is the semantic owner; a physical scheduler is a later mechanism/profile selection.

| Planned boundary ID | Intended responsibility | Governing work |
|---|---|---|
| `interface.library` | Progressive public access from convenience facade/presets through the complete composable surface to low-level integration tools; one canonical resolved-profile path with inspectable default provenance | [`../docs/decisions/ADR-0020-complete-library-and-resolved-defaults.md`](../docs/decisions/ADR-0020-complete-library-and-resolved-defaults.md); exact API remains future specification work |
| `tool.search-schema` | Parse, validate, normalize, diff, and generate universal plus namespaced selected search contracts | Future accepted component specification |
| `conformance.search` | Synthetic/removable end-to-end universal CUDA-MCGS conformance independent of every external production product | Future accepted component specification |

## External domain/search product boundary

Production domain/search products consume public CUDA-MCGS contracts but are not CUDA-MCGS registry entries. Their authoritative domain/policy/evaluator/output/protocol/quality/package/release state lives in their own repositories or independently owned packages.

`iteathen/UCI-Arena-Vector` is a current concrete external consumer and requirements falsifier for chess/UCI integration. It is named here only to identify a real external boundary; its branch/issue/PR state does not become CUDA-MCGS authority merely by reference.

Historical repository-local CHESS-0001 material is retained under [`../docs/archive/specs/CHESS-0001-search-product.md`](../docs/archive/specs/CHESS-0001-search-product.md) as `Superseded` provenance. It is not an active product contract or registry owner.

Generic Node/V8 bindings, CUDA Driver call machinery, generic memory providers, NVRTC/link/load, generic long-lived sideband mechanisms, launch/completion/error/teardown, and generic runtime packaging belong to independent `iteathen/CUDA-JS` and must not become CUDA-MCGS component/product entries.

Maintained CUDA-MCGS production source is JavaScript only: ordinary Node.js plus restricted Device-JS through public CUDA-JS contracts. CUDA-JS may use JIT, native code and CUDA-specific implementation wherever needed or desired behind those contracts. A generic GPU mechanism that cannot be expressed naturally, safely and with bounded lifecycle/resource semantics through the current surface is classified for consumer-neutral CUDA-JS ownership under ADR-0019; it is not a new CUDA-MCGS native component. Generic tensor mathematics belongs to its natural tensor/math owner. External product policy/protocol/model/output semantics remain external even when their supplied programs are compiled into a Search Image.

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

Use [`templates/component-manifest.template.yaml`](templates/component-manifest.template.yaml) for CUDA-MCGS components, [`templates/engineering-decision.template.yaml`](templates/engineering-decision.template.yaml) for durable path/value decisions, [`templates/document-reading.template.yaml`](templates/document-reading.template.yaml) for durable authority/applicability coverage when needed, [`general_foundation/PROJECT_ORGANIZATION.md`](general_foundation/PROJECT_ORGANIZATION.md) for placement, and [`general_foundation/CLEANUP_AND_DISPOSITION.md`](general_foundation/CLEANUP_AND_DISPOSITION.md) for lifecycle. Focus branches, token postures, reading maps, and engineering decisions organize work without inventing new product ownership.
