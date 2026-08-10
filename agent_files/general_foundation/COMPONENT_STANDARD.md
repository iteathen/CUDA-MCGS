# Component Standard

**Scope:** Minimum durable design information for every substantial production component.

A component specification must be sufficient to implement, test, operate, replace, and evolve its actual responsibility. It documents demonstrated domain truth and relevant risk; it does not fill irrelevant sections merely to imitate a universal template.

## 1. Identity and purpose

State:

- stable component ID, name, status, and durable path;
- one-sentence purpose and resulting user/developer capability;
- exact owned invariant or lifecycle responsibility;
- responsible owner;
- intended equivalence class and expected consumers;
- explicit non-responsibilities, excluded cases, and non-goals.

Use independent identity only when continuity, persistence, external reference, replacement/incarnation, stale-reference protection, or diagnostics requires it.

## 2. Authority and consequence

Link governing charter, ADRs, specifications, schemas, contracts, and tests. State the normal consequence of error and the reasoning/validation class required for changes.

Trigger deeper persistence, security, concurrency, performance, ABI, identity, compatibility, recovery, destructive-operation, or provenance work only when the component actually owns that concern.

## 3. Ownership and boundaries

Document:

- authoritative state and mutation owner;
- public ports and known consumers;
- injected dependencies;
- adapter boundaries;
- dependency direction and forbidden dependencies;
- public, internal, generated, persisted, and diagnostic surfaces;
- lifecycle, cancellation, resource acquisition, and release;
- composition-root responsibilities.

## 4. Domain model

Document only what actually exists:

- values, entities, aggregates, state machines, snapshots, records, or arenas;
- identity and equality meaning;
- units, ranges, precision, cardinality, and bounds;
- invariants and legal transitions;
- invalid-state behavior;
- concurrency, publication, ordering, and lifetime where material.

Do not invent identities, registries, state machines, or generic abstractions without a distinction they preserve.

## 5. Commands, queries, and events

For each public operation state:

- caller authority and intent;
- inputs, units, ranges, identity, and validation;
- owned state/effects;
- result and failure classes;
- retry/idempotency/cancellation where material;
- synchronization and resource bounds where material.

Queries return stable values or bounded immutable views. Events describe facts that occurred and are not disguised commands.

## 6. Data, schemas, and generated artifacts

When data/configuration exists, document:

- canonical source and schema owner;
- required/optional fields, units, ranges, defaults, precedence, and validation;
- lifecycle classification: startup, per-engine, per-search, reloadable, persisted, or generated;
- publication and invalidation;
- generated forms, reproducibility, and drift detection.

When persisted/public meaning exists, also define versioning, compatibility window, migration, rollback/recovery, and corrupted/unknown data handling.

## 7. Failure, trust, and resources

Document real failure modes and terminal behavior, including interruption, cancellation, retries, partial work, unavailable dependencies, saturation, teardown, and cleanup.

For trust boundaries, define untrusted inputs, authority, validation, size/work/memory limits, safe diagnostics, and fail-closed behavior.

For external/device resources, define acquisition, owner, capacity, lifetime, cancellation, release, and verification of final state.

## 8. Performance

Classify only meaningful paths as continuous hot, burst-critical, interactive, control, build-time, or offline.

For performance-sensitive paths state workload, required/measured latency, throughput, allocation, memory, contention, synchronization, degradation, and quality bounds. Prefer cold preparation and bounded canonical representations.

Hot-path specialization does not weaken public contract ownership.

## 9. Evolution and compatibility

Document only applicable promises:

- intended extension points and consumers;
- compatibility/version window;
- deprecation and removal;
- migration/rollback limitations;
- extraction/repository split triggers;
- regeneration/rebuild of derived state.

Do not preserve every internal API by default.

## 10. Verification

Define evidence capable of falsifying actual risks:

- unit/property tests for invariants;
- producer/consumer contract tests for ports;
- adapter integration tests;
- persistence/migration/recovery tests when applicable;
- hostile-input/security tests when applicable;
- concurrency/publication tests when applicable;
- memory-pressure/exhaustion tests;
- performance/load/quality tests for claimed bounds;
- generated/provenance/release checks when artifacts exist.

State material checks not run.

## 11. LEGO and simplicity analysis

Record:

- why this is one coherent brick rather than several or part of another;
- state owner and boundary ports;
- expected second instance;
- first-consumer deletion result;
- essential complexity represented directly;
- accidental complexity rejected;
- material complexity exported elsewhere;
- simpler alternatives and why they are insufficient.

## 12. Repository requirements

Every production component has:

```text
<component>/README.md
<component>/component.yaml
```

The README explains purpose, entry points, ownership, public surface, dependencies, lifecycle, failure/resource behavior, tests, and governing authority. The manifest provides machine-readable ownership and dependency information. Both are updated in the same coherent change as contract changes.

## Completion

A component design is complete when another agent can implement it without inventing ownership, ports, foundational ranges, failure/resource behavior, or compatibility; its intended second instance fits without foundational redesign; and validation targets the actual risks.
