# Contract Standard

**Scope:** Public component ports, schemas, device interfaces, generated interfaces, and cross-component behavior.

## Contract qualities

A valid contract is:

- narrow and domain-named;
- explicit about semantic meaning, units, identity, ranges, precision, cardinality, memory space, and lifetime where applicable;
- independent of incidental caller, current implementation, and unstable platform details;
- deterministic unless nondeterminism is part of the domain;
- explicit about concurrency, ordering, publication, side effects, and failure;
- versioned when public, persisted, generated across versions, or cached;
- testable from producer and consumer sides;
- bounded in work, memory, queueing, and diagnostics.

## Ports

A port describes a capability the owning component provides or requires. It must not expose implementation-owned mutable collections, private structs, CUDA/platform objects, or generated-layout internals unless those are the deliberate public contract.

A port states:

- owner and caller authority;
- accepted input class and exclusions;
- output meaning and ownership;
- sync/async behavior;
- lifetime and cancellation;
- resource and backpressure behavior;
- compatibility/version policy;
- failure classes.

## Commands

Commands describe intent. Specify required inputs, validation, authority, idempotency, state transition, result, emitted facts, retry/cancellation behavior, and failure classes.

## Queries

Queries return stable values or bounded immutable views. They do not silently mutate authoritative state, allocate unbounded work, or leak owner-controlled mutable storage.

## Events

Events describe completed facts in past tense. State source, identity/correlation, ordering, payload version, persistence, and delivery guarantee. Events are not commands and notifications are not authoritative state.

## Errors and status

Do not use null, empty output, broad exceptions, or a generic CUDA status alone to hide distinct failure categories.

Errors should identify:

- operation and owning boundary;
- affected identity/capability;
- expected and actual condition;
- resource/compatibility/validation class;
- recoverability and retry conditions;
- safe operator/user message;
- bounded diagnostic context.

## Schemas

Public, persisted, cache-key, and generated schemas define:

- namespaced ID and explicit version;
- required/optional fields;
- type widths, units, ranges, precision, alignment, and default semantics;
- unknown-field and unknown-enum policy;
- deterministic normalization;
- source-location-aware validation errors;
- compatibility and migration;
- canonical valid, boundary, and invalid fixtures.

The schema is the source of truth; generated code/layouts are reproducible derived artifacts.

## Device contracts

Device-facing contracts additionally define:

- host/device/unified memory ownership and address-space expectations;
- alignment, layout, endianness, and ABI;
- visibility/publication ordering;
- queue and arena capacities;
- completion/cancellation protocol;
- architecture/capability requirements;
- legal behavior at saturation or device failure;
- whether a handle is identity, capability, offset, generation reference, or raw address.

Raw addresses are not ordinary public values.

## Compatibility

Compatibility translation belongs at adapters. Old Search IR, schema, model, cache, CUDA, or external representations are translated into current contracts before entering the core. The core does not accumulate legacy aliases and version branches without an accepted ownership reason.

## Contract tests

Each port has reusable producer and consumer expectations. Tests cover normal, boundary, invalid, failure, cancellation, saturation, and compatibility behavior. Replacement is demonstrated by the same contract suite rather than informal similarity.
