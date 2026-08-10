# Composition and Dependencies

**Scope:** Inversion of control, dependency direction, composition roots, adapters, optional capabilities, and external dependencies.

## Inversion of control

Components declare the capabilities they require through stable ports. A composition root selects concrete implementations, profiles, generated modules, and adapters.

A component must not:

- instantiate external infrastructure deep inside domain logic;
- read hidden global singletons for required services or device state;
- locate dependencies by scanning registries;
- use reflection, dynamic lookup, or callbacks to avoid declaring a dependency;
- construct concrete domain/evaluator/CUDA/version integrations directly;
- deep-import another component’s internal implementation.

## Composition root

The composition root owns:

- object/module graph construction;
- adapter and generated-engine selection;
- configuration/profile binding;
- startup order and lifecycle coordination;
- optional capability activation;
- shutdown, cancellation, and cleanup;
- verification that capabilities and versions compose.

It contains wiring, not search policy, domain rules, memory algorithms, or evaluator semantics.

## Dependency direction

Dependencies point toward stable contracts and owned invariants.

```text
CUDA / OS / toolchain / external format / concrete domain or model
                         ↓
                       adapter
                         ↓
                        port
                         ↓
               owning framework component
```

The compiler may physically link adapters and core into one specialized device binary. This does not reverse source-level ownership: the core consumes declared contracts, not concrete adapter internals.

## Adapter rules

An adapter:

- translates an external or concrete representation into current contracts;
- owns version-specific and platform-specific quirks;
- validates untrusted or incompatible input;
- contains no unrelated core policy;
- is replaceable and contract-tested;
- does not leak external types beyond the boundary;
- declares device/host closure and lifecycle requirements;
- fails explicitly when required capabilities are absent.

## Optional dependencies

Optional domains, evaluators, CUDA features, tooling integrations, telemetry, and formats are separate adapters/capabilities activated by composition. The universal core remains valid when they are absent.

## Dependency review

A new dependency records:

- exact purpose and owner;
- API/ABI and lifecycle boundary;
- license and provenance;
- supported versions and update risk;
- host/device and platform effects;
- transitive build/runtime/memory cost;
- failure and availability behavior;
- security/trust implications;
- replacement or removal strategy.

## Cycles

Component dependency cycles are prohibited. When two components appear mutually dependent, identify the smaller stable contract or owning primitive they both require, or merge responsibilities if they are one lifecycle owner. Do not break a conceptual cycle with a service locator, event bus, callback registry, or shared dumping ground.
