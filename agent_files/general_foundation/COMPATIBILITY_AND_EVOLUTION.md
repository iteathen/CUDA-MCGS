# Compatibility and Evolution

**Scope:** Public and persisted contracts, Search IR, schemas, generated artifacts, model/evaluator packages, CUDA/platform adapters, caches, and migrations.

## Principle

Compatibility is translation at an owned boundary, not permanent contamination of the current core.

## Compatibility classes

CUDA-MCGS compatibility may include:

- Search IR and schema versions;
- domain/policy/evaluator adapter contracts;
- generated-engine manifests and cache identity;
- model/evaluator artifact formats;
- host/device ABI and layout contracts;
- CUDA driver/toolkit/architecture capabilities;
- persisted graph/search state where supported;
- public SDK/API versions;
- benchmark and conformance fixture versions.

Each class has an owner, support window, migration path, downgrade limitations, and removal criteria.

## Adapter placement

Old, external, or platform-specific representations are translated into the current contract before core processing. Current state is translated outward only where required.

The core should not accumulate:

- legacy aliases and field names;
- CUDA/toolkit-version conditionals unrelated to core meaning;
- old packet/cache/model layouts;
- compatibility flags changing domain semantics;
- silent coercion of obsolete values;
- one-off adapter exceptions in universal algorithms.

## Versioned contracts

Version changes state:

- compatible additions;
- incompatible changes;
- deterministic defaults;
- migration requirements;
- cache invalidation/regeneration;
- downgrade limitations;
- failure behavior when conversion is impossible.

## Migration

Migration is explicit, deterministic, observable, testable from real prior fixtures, idempotent where practical, and recoverable when destructive. It is separate from ordinary domain/search rules.

Silent loss, truncation, reinterpretation, or fallback to a different search/evaluator meaning is prohibited.

## Deprecation

Deprecation records replacement, reason, first deprecated version, removal trigger/window, migration guidance, and evidence used to justify removal.

## Compatibility budget

CUDA-MCGS does not promise indefinite support for every private pre-release snapshot or internal interface. Support promises are explicit and narrow. Keep the public surface deliberate so internals remain evolvable.
