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
| `project.charter` | UMCGS search mission, product boundary, and peer-runtime separation | [`../docs/PROJECT_CHARTER.md`](../docs/PROJECT_CHARTER.md) | Accepted |
| `project.decisions` | Cross-cutting accepted choices | [`../docs/decisions/`](../docs/decisions/README.md) | Active |
| `project.specifications` | Normative UMCGS search and interop contracts | [`../docs/specs/`](../docs/specs/README.md) | Proposal set |
| `project.architecture` | Explanatory architecture and repository topology | [`../docs/architecture/`](../docs/architecture/README.md) | Active/proposal set |
| `project.research` | Prior-art and external technical evidence | [`../docs/research/`](../docs/research/README.md) | Active |
| `project.archive` | Superseded documentation provenance | [`../docs/archive/`](../docs/archive/README.md) | Active |
| `project.state` | Current phase and authority summary | [`../STATUS.md`](../STATUS.md) | Active |
| `project.next-step` | One coherent next boundary or active focus-branch packet | [`../next_step.yaml`](../next_step.yaml) | Active |

## Repository product areas

| Product area | Owns | Location | Current status |
|---|---|---|---|
| `schemas` | Versioned UMCGS machine-readable contracts and metaschemas | [`../schemas/`](../schemas/README.md) | Reserved |
| `components` | Production UMCGS search components | [`../components/`](../components/README.md) | Reserved; no implementation authorized |
| `adapters` | Domain, policy, evaluator, output, and peer-runtime adapters | [`../adapters/`](../adapters/README.md) | Reserved |
| `conformance` | UMCGS reference backend, synthetic domains, search-contract suites, and public peer-boundary compatibility | [`../conformance/`](../conformance/README.md) | Reserved |
| `benchmarks` | Cross-component reproducible performance and search-quality suites | [`../benchmarks/`](../benchmarks/README.md) | Reserved |
| `experiments` | Disposable research/prototypes | [`../experiments/`](../experiments/README.md) | Reserved |
| `examples` | Minimal public-surface usage examples | [`../examples/`](../examples/README.md) | Reserved |
| `tools` | UMCGS-owned developer/build/search-specialization tools | [`../tools/`](../tools/README.md) | Reserved |
| `scripts` | Thin repository task entry points | [`../scripts/`](../scripts/) | Active |
| `tests` | Cross-component/system/end-to-end tests only | [`../tests/`](../tests/README.md) | Reserved |
| `packaging` | UMCGS execution-package composition, manifests, compatibility records, and distribution metadata | [`../packaging/`](../packaging/README.md) | Reserved |
| `third-party` | Vendored external material and provenance | [`../third_party/`](../third_party/README.md) | Reserved |

## Planned UMCGS product components

The following IDs are planning anchors only. Their exact contracts, names, and implementation locations are not accepted until version-zero specifications settle ownership.

| Planned boundary ID | Intended responsibility | Governing work |
|---|---|---|
| `contract.search-ir` | Normalized Search IR and versioning | Search IR v0 specification |
| `contract.domain` | State/action/transition/identity/cycle contract | Domain contract v0 |
| `contract.policy` | Selection/reservation/backup/output ranking contract | Search-policy contract v0 |
| `contract.evaluator` | Resident evaluator semantics, capabilities, batching, workspace, and publication requirements | Evaluator contract v0 |
| `contract.resources` | Search-memory plan, capacities, pressure, exhaustion, cancellation, and teardown | Resource contract v0 |
| `contract.cuda-js-package` | UMCGS-generated execution package and compatibility manifest for the peer CUDA-JS runtime | Interop contract v0 |
| `tool.search-schema` | Parse, validate, normalize, diff, and generate UMCGS search contracts | Future accepted component specification |
| `tool.search-compiler` | Capability resolution, search specialization, search-specific layouts/device code, and execution-package generation | Future accepted component specification |
| `integration.cuda-js` | UMCGS adapter from execution-package semantics to the public CUDA-JS runtime contract | Interop contract v0 |
| `reference.search-ir` | Independent host/reference interpretation of accepted UMCGS search semantics | Future accepted component specification |
| `conformance.search` | Synthetic-domain and end-to-end UMCGS search conformance | Future accepted component specification |

Generic Node/V8 bindings, CUDA Driver call machinery, generic memory providers, NVRTC/link/load, generic launch/completion/error/teardown, and generic runtime packaging belong to the independent `iteathen/CUDA-JS` repository and must not become UMCGS component entries.

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
