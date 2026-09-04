# SPEC-0005 addendum — terminal Output host-delivery projection

**Status:** Accepted

- **Version:** 0.1.0
- **Selection:** Universal package correction for mandatory terminal Output host delivery
- **Semantic owner:** Output (`SPEC-0013`)
- **Resource owner:** finite Resource plan (`SPEC-0011`)
- **Package owner:** Search Program Composition (`contract.cuda-js-package` / `SPEC-0005`)
- **Concrete lower mapping owner:** `integration.cuda-js`
- **Acceptance gate:** Protected integration under CUDA-MCGS #215

This document is an accepted addendum to [`SPEC-0005`](SPEC-0005-stage-ptx-and-search-image-composition.md). It complements the accepted [operation-local resource-access addendum](SPEC-0005-operation-local-resource-access-addendum.md), [external-control sideband addendum](SPEC-0005-external-control-sideband-addendum.md), [`SPEC-0011`](SPEC-0011-finite-search-resources.md), and [`SPEC-0013`](SPEC-0013-result-and-observation-publication.md). It does not replace their semantic ownership.

## 1. Problem statement

Accepted `SPEC-0013` already requires every admitted terminal Output profile to support bounded asynchronous host delivery after its immutable terminal publication is ready. The Output profile carries the terminal schema/cut, exact publication lifecycle, borrow contract, `asyncRead` contract, finite transfer bound, host effect and cleanup meaning. The finite Resource plan already owns the terminal reserve, partition, pool and provider requirement that physically back that Output capacity.

The current Program Package projects resident resources and operation-local access, but it does not explicitly connect the selected terminal Output delivery to the exact resident resource range that the runtime adapter may read after completion. A runtime adapter therefore cannot realize the accepted terminal-delivery port without either:

- exposing an arbitrary generated-resource read API to callers;
- inferring Output meaning from generated resource names, source text, profile IDs or lifecycle prose; or
- adding a private/native CUDA-MCGS transfer path.

All three are non-conforming. The defect is missing MCGS package representation, not missing Output semantics and not authority to widen CUDA-JS.

## 2. Governing boundary

The ownership split is:

- `SPEC-0013` owns terminal-result readiness, publication, immutability, borrow/transfer semantics, consumer policy and cleanup.
- `SPEC-0011` owns the finite terminal reserve, its exact non-overflowing partition range, the containing pool/provider requirement and lifecycle/accounting truth.
- Search Program Composition owns the finite package declaration connecting those already-selected facts to runtime realization.
- `integration.cuda-js` mechanically maps that declaration to versioned public CUDA-JS memory-transfer operations.
- CUDA-JS owns device memory, D2H transfer validity/ranges, transfer operations, lower failures/health and native teardown.

The adapter MUST NOT infer a terminal-delivery source from Output profile names, generated resource numbering, program source, kernel parameters, resource access modes, reserve purpose text, manifests or native state.

## 3. Explicit host-delivery representation

### DELIVERY-REP-001 — explicit finite package fact

Every selected terminal Output profile whose accepted publication contract requires `asynchronous-bounded-read` MUST produce one explicit terminal host-delivery declaration in the normalized Program Package and execution package.

The declaration MUST identify, in MCGS-owned vocabulary:

- a stable delivery id;
- the selected Output semantic owner/profile;
- role `terminal-output`;
- the terminal schema id;
- the exact resident Program Package resource that contains the selected terminal reserve;
- finite byte offset and byte length within that resource;
- readiness `terminal-completed` for the first realization;
- delivery mode `asynchronous-bounded-read`;
- finite maximum transfers;
- the selected Output borrow, asynchronous-read and cleanup contracts; and
- lifetime `terminal-result`.

No declaration may contain a CUDA-JS memory object, native pointer, stream/event, host staging address, provider path or lower-private identity.

### DELIVERY-REP-002 — resource derivation is owner-traceable

The exact physical range MUST be validated through the selected owner chain:

`Output terminal reserve → Resource reserve → Resource partition → Resource pool → provider requirement → Program Package resident resource`.

For a byte-addressed delivery:

- the selected Resource class and pool MUST both use byte units;
- the terminal reserve MUST be contained by its declared partition;
- the partition MUST have `alias.kind = none` for the first realization;
- `byteOffset` MUST equal the partition offset within the selected pool;
- `byteLength` MUST equal the terminal reserve maximum and MUST fit entirely inside the partition and selected Program Package resource;
- the resource/pool access envelope MUST include read access; and
- the terminal reserve eligible owners MUST include the selected Output Resource contributor.

A future aliased, segmented, dynamically placed or non-byte terminal layout requires separate accepted representation; it MUST NOT be guessed by this first realization.

### DELIVERY-REP-003 — no arbitrary resource-read surface

The package declaration is a semantic delivery capability, not authority to expose arbitrary device memory. Runtime consumers address the declared delivery id. They do not address generated resource ids or raw offsets directly.

An undeclared resource/range is not externally readable through `integration.cuda-js` merely because CUDA-JS can read it.

## 4. Closure and identity

### DELIVERY-CLOSURE-001 — mandatory terminal closure

If the selected Output profile requires terminal asynchronous host delivery, absence of exactly one valid `terminal-output` declaration is runtime-non-realizable and MUST fail before dependent lower realization.

A declaration that names an unknown resource, wrong Output owner/schema, incompatible reserve/partition/pool, non-readable resource, overflowing range, aliased first-realization partition or unsupported delivery mode is invalid.

### DELIVERY-IDENTITY-001 — material delivery meaning is identity-bearing

Material changes to delivery owner, role, terminal schema, resource binding, byte range, readiness, delivery mode, maximum transfers, borrow/read/cleanup contract or lifetime MUST change normalized Program Package / Search Program / execution-package identity as applicable.

Lower-private transfer-operation sequence numbers, staging-block identities, native addresses and implementation-chosen cache/provider details MUST NOT become MCGS semantic identity.

### DELIVERY-DELETE-001 — deletion is exact

Removing an optional Output meaning removes only the delivery declarations solely owned by that meaning. Mandatory terminal Output remains represented for every admitted engine, so exactly one terminal delivery remains unless a future accepted Output profile changes that universal requirement.

Deletion MUST NOT leave an unbound transfer declaration, an unreadable resource binding, a hidden lower allocation or a host progression dependency.

## 5. Runtime realization

### DELIVERY-REALIZE-001 — preflight before dependent mutation

`integration.cuda-js` MUST validate the complete delivery declaration and the required public CUDA-JS memory/transfer capability before creating any lower resource whose sole purpose depends on that declaration.

The adapter MUST fail closed on missing/duplicate/unknown delivery ids, unsupported role/mode/lifetime, resource mismatch, range overflow or unavailable public lower transfer capability.

### DELIVERY-REALIZE-002 — terminal-only first realization

For the first compatible-pair profile:

1. active search runs device-owned through the accepted execution operation;
2. the host does not read, decide, rewrite or relaunch to progress search;
3. `wait()` proves the accepted runtime operation completed;
4. only then may the declared `terminal-output` delivery be requested;
5. the adapter performs the exact bounded D2H read through the public CUDA-JS memory contract for the declared resource/range;
6. the adapter returns copied bytes plus bounded delivery metadata, never a raw pointer or lower object; and
7. transfer/borrow/cleanup truth remains protected until the lower read is terminal or is conservatively reported/quarantined.

A premature delivery request MUST reject without starting a D2H transfer.

### DELIVERY-REALIZE-003 — lower failure truth

A public CUDA-JS D2H validation, pressure, backpressure, deferred failure, stale-resource, health or cleanup failure MUST remain visible through the existing MCGS adapter failure projection. The adapter MUST NOT convert an unproved transfer into successful terminal output or free backing memory whose access terminality is unproved.

## 6. Native qualification boundary

CUDA-free tests may prove declaration normalization, exact owner/resource closure, identity sensitivity, deletion, preflight ordering, no-inference behavior and portable lower-call translation.

They MUST NOT claim physical D2H correctness, device/host coherence, publication ordering, native race behavior, performance or exact compatible-pair support. Those remain CUDA-JS #32 native evidence. Native Linux promotion remains separately gated by CUDA-JS #4.

## 7. Required permanent falsifiers

The dependent implementation MUST permanently prove at least:

1. **Missing declaration:** terminal Output requiring async host delivery but lacking its delivery declaration is non-realizable.
2. **Wrong owner/schema:** a delivery bound to another owner or terminal schema rejects.
3. **Wrong resource:** a delivery not connected by the exact Output reserve → Resource partition/pool/provider chain rejects.
4. **Range safety:** offset/length overflow, non-byte pools, unreadable pools or aliased first-realization partitions reject.
5. **No inference:** deleting the explicit declaration does not cause composition/adapter code to synthesize one from resource names, profile ids, source text, manifests or lifecycle strings.
6. **Pre-terminal rejection:** delivery before operation completion rejects and issues no lower read.
7. **Exact read:** post-terminal delivery invokes exactly the declared public CUDA-JS resource/range and returns copied bytes.
8. **Lower failure:** D2H failure preserves lower public error/health facts and does not produce successful output.
9. **Identity sensitivity:** every material delivery-field change alters the appropriate package identity; lower-private transfer identity does not.
10. **Deletion:** removing optional live Output residue leaves mandatory terminal delivery coherent and byte-identical where its owned facts are unchanged.
11. **Cleanup:** a pending/unproved transfer keeps its backing resource protected or conservatively quarantined; proved-terminal transfers permit dependency-safe cleanup.
12. **Source boundary:** no CUDA-JS private/deep import, raw pointer, native CUDA/PTX/FFI, generated-source inspection or second runtime/interpreter appears in CUDA-MCGS.

## 8. Non-goals

This addendum does not:

- define terminal payload field semantics or serialization beyond `SPEC-0013`;
- add live observation merely for compatible-pair qualification;
- expose arbitrary resident-memory reads;
- add a scheduler, host progression loop or relaunch protocol;
- change Resource allocation/partition semantics;
- require CUDA Graphs, Tensor Cores, cuBLASLt, multi-GPU or product-specific output;
- authorize native CUDA-MCGS code; or
- qualify a native CUDA-JS compatible pair.

The intended result is one small LEGO seam: Output owns what may be delivered and when, Resource owns where the admitted bytes live, Program Package makes that connection explicit, and a replaceable runtime adapter maps the declared range to public CUDA-JS without guessing.