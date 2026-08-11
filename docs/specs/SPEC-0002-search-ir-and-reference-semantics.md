# SPEC-0002: CUDA-MCGS Search IR and Deterministic Reference Semantics

**Status:** Accepted

**Version:** 0.1.0

**Accepted:** 2026-08-11 under the project owner's explicit CUDA-MCGS assessment, prototype, and implementation direction

**Owners:** `contract.search-ir`, `reference.search-ir`, and the CUDA-MCGS search-contract integration spine

## 1. Purpose and bounded authorization

This specification defines the first concrete, backend-neutral CUDA-MCGS Search IR representation for the accepted publication, graph, path, finite-resource, stopping, and partial-result semantics in [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md). It also defines the independent deterministic reference capsule that validates the representation before any production CUDA lowering.

The authorized implementation is deliberately small and disposable:

- a strict versioned JSON representation and JSON Schema;
- a fail-closed normalizer with canonical identity;
- checked-in valid, minimum-capacity, and invalid fixtures;
- a CUDA-free deterministic reference model and invariant capsule;
- portable Windows and Linux execution of the same reference capsule, with platform evidence reported separately.

This is not authorization for a production graph store, CUDA code generator, scheduler, domain adapter, evaluator, memory planner, output adapter, persistence system, CUDA-JS adapter, or public release. The retained CUDA-only prototype remains separate evidence and MUST NOT be imported by this reference implementation.

## 2. Normative authority

This specification is governed by:

- [`../PROJECT_CHARTER.md`](../PROJECT_CHARTER.md);
- [`../decisions/ADR-0002-universal-contracts-specialized-engines.md`](../decisions/ADR-0002-universal-contracts-specialized-engines.md);
- [`../decisions/ADR-0003-device-resident-active-search.md`](../decisions/ADR-0003-device-resident-active-search.md);
- [`../decisions/ADR-0014-extract-cuda-js-runtime.md`](../decisions/ADR-0014-extract-cuda-js-runtime.md);
- [`SPEC-0001-device-search-publication-and-resources.md`](SPEC-0001-device-search-publication-and-resources.md).

When this representation cannot express a future accepted domain, policy, evaluator, resource, output, or execution-package contract without changing foundational meaning, the schema version MUST change. Implementation convenience does not silently reinterpret the current version.

## 3. Representation and ownership

The authoritative structural schema is [`../../schemas/search-ir/0.1.0/search-ir.schema.json`](../../schemas/search-ir/0.1.0/search-ir.schema.json). The normative semantic normalizer is the contract implementation exercised by the reference capsule. JSON Schema describes the closed shape; the normalizer owns cross-field requirements, graph ordering, channel reachability, declared-role checks, resource/stop correspondence, and canonical ordering.

The top-level record contains exactly:

| Field | Meaning |
|---|---|
| `schema` | Exact representation identifier `cuda-mcgs.search-ir/0.1.0` |
| `contract` | Exact consumed semantic contract `SPEC-0001/0.1.0` |
| `roles` | Stable semantic producer/consumer/owner roles |
| `publicationChannels` | Selected semantic publication state machines |
| `graph` | Identity, state-node, parent-edge, cycle, and backup ownership |
| `resources` | Immutable finite capacities and unambiguous ledger meanings |
| `stop` | First-cause, admission, drain, and terminal semantics |
| `result` | Completion classes, permitted ranking inputs, and required reports |
| `identity` | Canonicalization and digest contract |

Unknown fields fail normalization. A target operating system, filesystem path, pointer width, host `size_t`, compiler layout, CUDA atomic type, memory-order spelling, Node/Worker mechanism, raw handle, device ordinal, or CUDA-JS-private value is not Search IR meaning and MUST NOT appear in this version.

## 4. Publication channels

Every selected channel declares exactly:

- stable channel identity;
- producer role and consumer roles;
- payload owner;
- semantic states, initial state, ready state, terminal states, and failure states;
- `search-device` visibility scope for the v0 single-device profile;
- permitted transitions;
- bounded-wait and stop-observation obligations.

All referenced roles and states MUST be declared. The ready state and every terminal state MUST be reachable from the initial state. The ready state is terminal for one incarnation. Duplicate channels, roles, states, consumers, or transitions fail normalization.

The v0 baseline requires `identity-slot`, `state-node`, `expansion`, `child-binding`, `backup-eligibility`, `stop`, and `result`. An evaluator-output channel is added only when a later evaluator profile selects it. Omission means the capability is absent; an accidentally unused field is not a capability declaration.

Search IR expresses only semantic publication. A future lowering chooses release/acquire atomics, queues, ownership transfer, fences, or another proven target mechanism and records that choice in lowering evidence rather than changing universal meaning.

## 5. Graph, path, and backup meaning

Version 0.1.0 fixes these distinctions:

- domain identity uses hash plus domain equality and is scoped to one search incarnation;
- one verified identity has at most one ready state node in that incarnation;
- stale references are generation-checked;
- parent-edge statistics are incoming-edge-local;
- in-flight reservation is distinct from completed statistics;
- identity resolution precedes active-path cycle evaluation;
- the selected cycle response is explicit;
- each backup reservation terminates exactly once as `applied` or `abandoned`.

The representation does not define domain state bytes, hash width, action shape, value type, backup transform, ranking formula, or reusable storage layout. Those remain separate contracts and specialization inputs.

## 6. Finite resources, stopping, and results

Each enabled resource declares a positive safe-integer capacity, unit, bounded admission, typed exhaustion cause, and these exact ledger meanings:

```text
claimed
published
retired-unreclaimed
failed-reservations
high-water
```

Failed reservations consume no capacity. The typed resource exhaustion cause MUST exist in the stop-cause set. The baseline fixture declares state nodes, parent edges, state bytes, action bytes, transposition slots, active paths, work queue, outputs, and diagnostics. These capacities describe one concrete fixture, not universal framework limits.

Stop states are `running → stop-requested → draining → terminal`. The first cause is authoritative, new resource-dependent admissions are rejected after stop, ready work may be applied, and unready work is abandoned. Results classify as `complete`, `valid-partial`, or `no-valid-result`.

Ranking may consume only ready nodes, ready edges, ready evaluator outputs when selected, and applied backups. Every result reports completion class, first stop cause, completed-work count, resource ledgers, budget satisfaction, and bounded diagnostics.

## 7. Normalization and canonical identity

Normalization MUST:

1. reject unknown, missing, ill-typed, duplicate, or unsupported fields;
2. validate channel roles, state transitions, terminal reachability, scope, and progress;
3. validate graph ownership and identity-before-cycle ordering;
4. validate every enabled resource against its typed stop cause and counter contract;
5. sort semantic sets by ordinal identifier while preserving semantically ordered lifecycle arrays;
6. emit no environment-derived field.

Canonical bytes use recursively sorted JSON object keys, JSON scalar encoding, preserved normalized array order, UTF-8, and no insignificant whitespace (`utf8-json-sorted-keys-v1`). SHA-256 is computed over those bytes.

The canonical digest MUST be identical across Windows and Linux for the same normalized IR. The digest excludes filesystem locations, line endings, target profile, timestamps, process state, and generated-layout facts. A future lowering identity separately includes the normalized Search IR digest plus every target, compiler, toolkit, architecture, capability, layout, and generator input that can change generated behavior.

## 8. Deterministic reference capsule

The reference implementation under [`../../experiments/search-ir-reference/`](../../experiments/search-ir-reference/) is independent of the CUDA-only prototype and uses no CUDA or CUDA-JS code. It owns semantic falsification, not performance or target-mechanism proof.

The capsule has stable cases for:

- baseline normalization and checked-in canonical identity;
- object-key and semantic-set-order independence;
- minimum positive capacities;
- undeclared role, insufficient visibility, ambiguous counters, backend admission-mechanism leakage, missing exhaustion, unsafe stale-reference policy, unbounded wait, and unknown-field rejection;
- `ordinary-serial`;
- `parallel-publication` state-machine interleaving;
- `transposition-node-edge-ownership`;
- `path-cycle-after-identity`;
- `forced-resource-exhaustion` with valid partial result;
- `scheduler-semantic-parity` across FIFO and LIFO admission order;
- `oracle-sensitivity` to duplicate state identity.

The synthetic graph deliberately contains a transposition and a path-local cycle. The reference allocator separates claims, publication, failed reservations, and high-water state. It validates snapshots independently of the mutation used by the sensitivity case.

The reference does not simulate GPU memory ordering. Its publication case proves the declared semantic lifecycle rejects pre-ready reads and conflicting terminal publication. Native target lowering still requires CUDA publication and race evidence.

## 9. Compatibility and invalidation

Changing any of these is representation-incompatible unless a separately accepted translation proves equivalence:

- schema or consumed semantic-contract version;
- publication channel state or ownership meaning;
- graph identity, incarnation, edge, path, or backup semantics;
- resource counter or exhaustion meaning;
- stop-cause ownership or drain semantics;
- partial-result validity or ranking inputs;
- canonicalization algorithm.

Fixture identity, normalizer, reference interpreter, schema, or governing-specification changes invalidate the checked-in digest and capsule evidence. Target-lowering changes do not change Search IR identity unless they also change normalized semantics; they invalidate the separate lowering/package evidence key.

## 10. Security, resource bounds, and cleanup

Search IR is an untrusted build input until strict normalization succeeds. Consumers MUST reject unknown or unsupported fields, non-finite or unsafe numeric capacities, duplicate identifiers, undeclared references, and incompatible versions before allocation or code generation. A canonical digest is an identity key, not an authenticity or authorization proof; distribution trust requires a separately owned signed-package policy.

The reference capsule performs no native loading, GPU allocation, network access, credential access, or external mutation. Its only generated state is `experiments/search-ir-reference/build/evidence.json`; the build directory is ignored, reproducible, and removed after evidence reconciliation. Checked-in fixtures and result summaries are retained specification evidence, not cleanup residue.

## 11. Platform evidence and Linux gap

The reference capsule MUST run on Windows and native Linux with Node 26.7.0. Matching canonical identity and case results are the portability gate. This is the only Linux claim made by this specification.

Native Linux CUDA lowering, NVRTC compilation, CUDA-JS execution, GPU publication, resource cleanup, sanitizers, performance, and an exact compatible pair remain untested until qualified Linux providers and hardware execute their own evidence chain. Windows CUDA evidence does not satisfy those gates, and a passing Linux reference capsule does not imply native Linux CUDA support.

## 12. Acceptance and downstream authorization

This bounded contract is accepted when:

- the schema, normalizer, fixtures, checked-in canonical identity, reference cases, indexes, registry, and project state agree;
- all reference cases are discovered and pass with zero skips on the local exact Windows evidence head;
- documentation, links, structured data, organization, whitespace, and diff checks pass;
- Linux execution evidence is reported separately and does not widen the accepted local Windows claim.

Acceptance authorizes the next semantic work to define domain, policy, evaluator, full resource/memory, output, and execution-package contracts against this representation. It does not authorize production CUDA lowering or scheduler selection by itself.
