# UMCGS System Registry

**Scope:** Canonical ownership and source-of-truth registry.

This registry tells developers and agents where durable information and future implementation belong. It is updated in the same change that creates, moves, supersedes, or removes an ownership boundary.

## Registry rules

- One boundary has one stable ID and one primary owner.
- One kind of durable truth has one authoritative location.
- Product components must have a manifest and README before production code enters them.
- Planned boundaries are not implementation authorization.
- Cross-component dependencies must be declared in both the component manifest and governing architecture/specification where material.
- Archived and superseded locations never regain authority merely because an agent finds them.

## Governance and documentation boundaries

| Boundary ID | Owns | Authoritative location | Status |
|---|---|---|---|
| `governance.agent` | Agent workflow, reasoning gates, organization, validation | [`agent_files/`](README.md) | Active |
| `governance.design` | LEGO design hierarchy, components, contracts, composition, foundations, naming, compatibility | [`DESIGN_ALIGNMENT_CARD.md`](DESIGN_ALIGNMENT_CARD.md), [`general_foundation/PRINCIPLES.md`](general_foundation/PRINCIPLES.md), and linked doctrine | Accepted |
| `governance.assessment` | Adversarial assessment before planning and proportional planning records | [`general_foundation/ASSESSMENT_AND_PLANNING.md`](general_foundation/ASSESSMENT_AND_PLANNING.md) | Accepted |
| `governance.sanity` | Sanity/audit claims, semantic coverage, risk-based depth, reconciliation, and findings | [`general_foundation/SANITY_CHECKING.md`](general_foundation/SANITY_CHECKING.md) and [`general_foundation/SEMANTIC_INTERROGATION.md`](general_foundation/SEMANTIC_INTERROGATION.md) | Accepted |
| `governance.pr-integration` | Exact-head PR readiness/review, guarded merge, and post-merge verification | [`general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md) | Accepted |
| `governance.owner-entry` | Mandatory repository entry rules | [`../AGENTS.md`](../AGENTS.md) | Active |
| `project.charter` | Mission, product boundary, first milestone | [`../docs/PROJECT_CHARTER.md`](../docs/PROJECT_CHARTER.md) | Accepted |
| `project.decisions` | Cross-cutting accepted choices | [`../docs/decisions/`](../docs/decisions/README.md) | Active |
| `project.specifications` | Normative framework contracts | [`../docs/specs/`](../docs/specs/README.md) | Proposal set |
| `project.architecture` | Explanatory architecture | [`../docs/architecture/`](../docs/architecture/README.md) | Proposal set |
| `project.research` | Prior-art and external evidence | [`../docs/research/`](../docs/research/README.md) | Active |
| `project.archive` | Superseded documentation provenance | [`../docs/archive/`](../docs/archive/README.md) | Active |
| `project.state` | Current phase and authority summary | [`../STATUS.md`](../STATUS.md) | Active |
| `project.next-step` | One coherent next boundary | [`../next_step.yaml`](../next_step.yaml) | Active |

## Repository product areas

| Product area | Owns | Location | Current status |
|---|---|---|---|
| `schemas` | Versioned machine-readable contracts and metaschemas | [`../schemas/`](../schemas/README.md) | Reserved |
| `components` | Production framework components | [`../components/`](../components/README.md) | Reserved; no implementation authorized |
| `adapters` | Domain, policy, evaluator, and output adapters | [`../adapters/`](../adapters/README.md) | Reserved |
| `conformance` | Reference backend, synthetic domains, contract suites | [`../conformance/`](../conformance/README.md) | Reserved |
| `benchmarks` | Cross-component reproducible performance suites | [`../benchmarks/`](../benchmarks/README.md) | Reserved |
| `experiments` | Disposable research/prototypes | [`../experiments/`](../experiments/README.md) | Reserved |
| `examples` | Minimal public-surface usage examples | [`../examples/`](../examples/README.md) | Reserved |
| `tools` | Reusable developer/build/generation tools | [`../tools/`](../tools/README.md) | Reserved |
| `scripts` | Thin repository task entry points | [`../scripts/`](../scripts/) | Active |
| `tests` | Cross-component/system/end-to-end tests only | [`../tests/`](../tests/README.md) | Reserved |
| `packaging` | Release composition, manifests, distribution metadata | [`../packaging/`](../packaging/README.md) | Reserved |
| `third-party` | Vendored external material and provenance | [`../third_party/`](../third_party/README.md) | Reserved |

## Planned product components

The following IDs are planning anchors only. Their exact contracts, names, and implementation locations are not accepted until the version-0 specifications settle ownership.

| Planned boundary ID | Intended responsibility | Governing work |
|---|---|---|
| `contract.search-ir` | Normalized Search IR and versioning | Search IR v0 specification |
| `contract.domain` | State/action/transition/identity/cycle contract | Domain contract v0 |
| `contract.policy` | Selection/reservation/backup/output ranking contract | Search-policy contract v0 |
| `contract.evaluator` | Resident evaluator capabilities, batching, workspace, publication | Evaluator contract v0 |
| `contract.resources` | Memory plan, capacities, pressure and exhaustion | Resource contract v0 |
| `tool.schema` | Parse, validate, normalize, diff, and generate contracts | Future accepted component specification |
| `tool.compiler` | Capability resolution, specialization, layout/code generation | Future accepted component specification |
| `runtime.host` | Lifecycle, loading, allocation, launch, cancellation, completion | Future accepted component specification |
| `runtime.device` | Device-owned execution and queues | Future accepted component specification |
| `runtime.graph-store` | Nodes, edges, state/action arenas, references, reclamation | Future accepted component specification |
| `runtime.transposition` | Keying, lookup, claim/publication, collision verification | Future accepted component specification |
| `runtime.scheduler` | Device work scheduling and evaluator batching | Future accepted component specification |
| `runtime.diagnostics` | Bounded device/host observability | Future accepted component specification |
| `sdk.adapters` | Stable adapter-facing contracts/tooling | Future accepted component specification |

## Adding or changing a registry entry

A coherent change must include:

1. stable boundary ID;
2. purpose and owner;
3. durable location;
4. governing authority;
5. public contracts and dependencies;
6. lifecycle/compatibility status;
7. validation owner;
8. migration or supersession record.

Use [`templates/component-manifest.template.yaml`](templates/component-manifest.template.yaml) for product components and follow [`general_foundation/PROJECT_ORGANIZATION.md`](general_foundation/PROJECT_ORGANIZATION.md).
