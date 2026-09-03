# SPEC-0005 addendum: Operation-local resource access for runtime realization

**Status:** Accepted

**Acceptance gate:** Protected integration under #199

**Version:** 0.1.0

**Amends:** `CUDA-MCGS-SPEC-0005@0.4.0`

**Owner:** CUDA-MCGS deterministic Program Package / execution-package operation-binding meaning

**Consumers:** Search Composer, execution-package projection, `integration.cuda-js`, conformance, exact compatible-pair qualification

## 1. Purpose

SPEC-0005 already requires one finite execution package to contain enough public resource/operation data for CUDA-JS realization without CUDA-JS interpreting Search IR or CUDA-MCGS parsing generated/native CUDA artifacts. The accepted 0.2.0 representation leaves one gap: a resource requirement carries a broad provider-capability envelope such as `read`, `write`, `atomic` and `publish`, while an operation binding identifies only the resource and does not identify the concrete access that operation performs.

That broad resource envelope is not operation-local effect truth. `integration.cuda-js` cannot infer one lower public launch/prepared access from it, and source inspection would create a second restricted Device-JS interpreter in the adapter.

This addendum closes only that representation gap.

## 2. Governing invariants

ACCESS-AUTH-001. CUDA-MCGS owns operation-local binding access meaning. CUDA-JS continues to own its public lower access vocabulary, validation, memory/resource lifecycle, atomic/publication mechanisms and native realization.

ACCESS-AUTH-002. A resource-level `accessRequirements` record remains the broad capability/provider envelope for that resource. It cannot be treated as the concrete access of every operation that binds the resource.

ACCESS-AUTH-003. `integration.cuda-js` must translate explicit accepted package meaning mechanically. It cannot parse restricted Device-JS source, infer effects from function names/types, inspect CUDA-JS private implementation, or collapse an ambiguous resource envelope into an ordinary read/write declaration.

ACCESS-AUTH-004. Version/capability negotiation and operation-local access validation occur before allocation or ignition. Missing or insufficient access meaning fails closed and publishes no valid runtime realization.

## 3. Additive 0.2.0 representation

ACCESS-REP-001. The existing Program Package and execution-package 0.2.0 binding representation gains one optional field named `access` on **resource-source bindings only**.

ACCESS-REP-002. For this first accepted profile, `access` is one of:

- `read` — the operation reads the bound resource and does not write it;
- `write` — the operation writes the bound resource and does not require an ordinary read of its prior value;
- `read-write` — the operation both ordinarily reads and writes the bound resource.

ACCESS-REP-003. Scalar-source bindings do not carry `access`. Supplying `access` on a scalar binding is invalid.

ACCESS-REP-004. Ordinary `read`, `write` and `read-write` are the only operation-local access forms accepted by this addendum. Atomic observation/update and publication semantics require more specific direction/type/order meaning than this field provides. A selected package that needs those effects must use a later accepted operation-binding extension or fail closed before realization. The adapter must not weaken such effects to ordinary `read-write`.

ACCESS-REP-005. The field is additive to the 0.2.0 representation so accepted historical/reference packages remain valid evidence and retain their exact identities. A historical package that omits `access` on a resource binding is **not eligible for production runtime realization through `integration.cuda-js`** and must fail adapter preflight rather than be reinterpreted.

ACCESS-REP-006. Newly composed execution packages intended for runtime realization must project `access` on every resource-source operation binding. The first accepted `engine_step(output)` fixture projects `access: "write"` from its MCGS-owned operation definition; the adapter does not derive that fact from source text.

## 4. Validation and ownership checks

ACCESS-VALID-001. A resource binding with `access: read` requires the bound resource's broad `accessRequirements` to include `read`.

ACCESS-VALID-002. A resource binding with `access: write` requires the broad envelope to include `write`.

ACCESS-VALID-003. A resource binding with `access: read-write` requires both `read` and `write`.

ACCESS-VALID-004. The Composer/package projection rejects an operation-local access that exceeds the resource envelope before producing a realizable execution package.

ACCESS-VALID-005. Operation-local `access` is meaning-affecting package data and participates in canonical identity. Changing only `read` to `write` or `read-write` changes the affected Program Package/execution-package identity.

ACCESS-VALID-006. Unordered normalization and deterministic field ordering remain governed by SPEC-0005. This addendum introduces no ambient/runtime inference and no new scheduler, launch, allocator or native mechanism selection.

## 5. CUDA-JS adapter boundary

ACCESS-ADAPTER-001. The CUDA-JS adapter projection carries the accepted MCGS `access` value for resource bindings as adapter input meaning. It does not embed arbitrary CUDA-JS request objects or lower private fields.

ACCESS-ADAPTER-002. `integration.cuda-js` maps `read`, `write` and `read-write` to the corresponding versioned public CUDA-JS ordinary access forms only after peer/package capability negotiation succeeds.

ACCESS-ADAPTER-003. Missing `access`, unsupported values, atomic/publication-only resource needs, incompatible peer versions or insufficient lower capabilities reject before partial realization. There is no source-parser fallback, native escape path or best-effort weakening.

ACCESS-ADAPTER-004. CUDA-JS remains independently replaceable. Deleting `integration.cuda-js` leaves the MCGS operation-local access fact meaningful as package/runtime-adapter intent; deleting CUDA-MCGS leaves CUDA-JS unchanged.

## 6. Conformance

ACCESS-CONFORMANCE-001. Red-before-green evidence must show the accepted first package is insufficient for deterministic public CUDA-JS access construction before this field is projected.

ACCESS-CONFORMANCE-002. The first `engine_step(output)` fixture must emit `access: "write"` in both normalized Program Package and execution-package adapter requirements without inspecting its Device-JS source.

ACCESS-CONFORMANCE-003. Mutations must independently reject: missing access at runtime-realizability preflight, scalar binding with access, unsupported access, read access without resource read capability, write access without resource write capability, read-write without both capabilities, and atomic/publication weakening to ordinary access.

ACCESS-CONFORMANCE-004. Changing operation-local access must change canonical identity while unrelated unselected capabilities and historical package evidence remain unchanged.

ACCESS-CONFORMANCE-005. #125 may begin production adapter realization only after this authority and its schema/reference evidence are protected-integrated. Exact CUDA-JS compatible-pair/native evidence remains a later qualification gate and is not claimed here.

## 7. Non-goals

This addendum adds no new search algorithm semantics, public CUDA-JS API, allocator alignment control, CUDA Graph requirement, launch resolver, GPU IR, atomic/publication contract, host progress loop, product semantics or native code.
