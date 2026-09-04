# Conformance

This product area will own:

- the deterministic Search IR reference backend;
- synthetic domains;
- public-contract and compatibility capsules;
- golden boundary cases;
- differential/property/metamorphic evidence across implementations;
- capability matrices;
- consolidated evidence for universal assumptions and finite-resource behavior.

Conformance consumes public contracts only and must not become a hidden production dependency.

## Consolidated conformance capsules

[`search-compiler/`](search-compiler/) is the active CUDA-free conformance owner for the production `tool.search-compiler` component. It consumes only the declared component testing port, retains Composer/fixture/deletion/mutation/evidence support outside production, and must remain replaceable by stronger independent evidence without becoming a production dependency.

Synthetic domains are accumulated as stable labeled cases and executed through shared public-contract runners. Compatible cases may share immutable schema/build/generated-engine/model/device setup, but each domain/case retains isolated mutable state, exact expected behavior, direct selection, and per-case reporting.

Do not create a separate runner or permanent setup path for every synthetic example. Capture the test intent immediately, use a provisional reproducer only when diagnosing, and fold the case into the owning conformance capsule before the relevant contract branch is accepted.

Every capsule declares:

- authoritative reference/property oracle;
- exact evidence-key dimensions;
- expected discovery and skip counts;
- coverage partitions and sampling limits;
- invalidation inputs;
- runtime/output/resource budgets;
- deep/forensic escalation triggers;
- cleanup and artifact retention.

The initial coverage must expose transpositions, cycles/history, stochastic/chance behavior, lazy/very-large/empty action spaces, multiple evaluator modes/shapes/perspectives, backup modes, partial observability where supported, finite memory/pressure/exhaustion, cancellation/teardown, device closure, generated/JIT/ABI/cache identity, and incompatible versions.

The first publication/graph/resource capsule MUST implement the stable case families and evidence limits in [`../docs/specs/SPEC-0001-device-search-publication-and-resources.md`](../docs/specs/SPEC-0001-device-search-publication-and-resources.md). The retained CUDA prototype is evidence input, not a conformance dependency or reference oracle.

The disposable [`../experiments/search-ir-reference/`](../experiments/search-ir-reference/) capsule currently owns the independent deterministic oracle accepted by [`SPEC-0002`](../docs/specs/SPEC-0002-search-ir-and-reference-semantics.md). Production conformance may supersede it only with equivalent or stronger cases and explicit provenance; production code may not import the experiment.

Passing individual domains does not prove the contract set integrates. The integration spine reconciles shared terminology, identity, units, lifecycle, resources, failure, compatibility, cleanup, and end-to-end behavior.

See [`../agent_files/general_foundation/TESTING.md`](../agent_files/general_foundation/TESTING.md).
