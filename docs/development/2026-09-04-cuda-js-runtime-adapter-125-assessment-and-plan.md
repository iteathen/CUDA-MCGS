# CUDA-JS runtime adapter #125 assessment and execution plan

**Status:** Informational  
**Tracker:** #125  
**Date:** 2026-09-04  
**Assessment depth:** Critical  
**Decision:** Proceed — bounded portable/public-contract v0 only

## Objective, evidence, and exact authority

Implement the first production `integration.cuda-js` brick that consumes an accepted CUDA-MCGS execution package and realizes its declared runtime requirements through only the installed/versioned public `cuda-js` package surface. The adapter must remain a translator/composer: CUDA-MCGS owns search requirements, selected launch policy, explicit operation-local access, external-control semantics and MCGS-side failure disposition; CUDA-JS owns target/provider choice, Device-JS validity, compiler/linker, allocation/module/function/operation mechanics, lower capability truth, health and resource lifecycle.

Exact assessment subjects:

- CUDA-MCGS protected base: `main@2142aaad704b2329990220f19a6533fee18cef92`, tree `f8ae985be6a194eb216c2107d1117ba78804ed36`;
- fresh focus branch: `focus/125-public-cuda-js-runtime-adapter-20260904`, created from that exact protected commit;
- lower public peer: `iteathen/CUDA-JS@49a2f77d2c8364d67030fbc1c2e870e58e70d334`, tree `b67890e2499f04ab3b81b8f4a72dab38a5281c7e`;
- peer package: `cuda-js@0.1.0-alpha.18`, public API schema `1`.

The earlier #125 reassessment at `b99bbc44c99cbff5ee239ae89402fa6e7074d987` was rechecked rather than inherited blindly. The intervening protected work promotes Search Compiler ownership and accepts external-control sidebands. Current accepted package construction still produces one runtime-entry operation with `maxPending=1`; it now may include `framework-cancellation` and `session-command-publication` host-to-device u32 sidebands. CUDA-JS alpha.18 publicly supplies named host-to-device publication mailbox lanes with system acquire/release Device-JS support, so that extension does not demonstrate a new lower capability gap.

Synthetic Search Compiler conformance fixtures still name alpha.17. They are reference evidence, not production peer authority. The production adapter is exact and fail-closed: it does not silently retarget a package from alpha.17 to alpha.18.

Completion means a portable injected-peer capsule proves exact admission, preparation, ignition, sideband control, operation completion/failure projection, and dependency-safe teardown for the accepted single-operation package. Native compatible-pair, Linux/Windows GPU correctness, performance, multi-GPU and product support remain explicitly out of scope and downstream of CUDA-JS #32.

## Engineering and ownership synthesis

The new production component is `integration.cuda-js` under `adapters/runtimes/cuda-js/`. It owns:

- exact execution-package/peer compatibility admission before allocation;
- mechanical conversion of accepted MCGS Device-JS function/type records to the selected public CUDA-JS call shape;
- construction of public runtime/compiler/module/function/memory/mailbox resources;
- explicit pre-ignition runtime input binding;
- direct submission of the one declared v0 operation;
- MCGS-side classification of public lower failures without erasing lower code/category/health facts;
- dependency-safe rollback and cleanup of resources assembled by the adapter.

It does **not** own Search IR interpretation, source parsing, native CUDA, public CUDA-JS request validity/ranges, lower scheduling, provider truth, raw handles, a generic preparation transaction, a logical-work resolver, post-ignition search progression, or native qualification.

### Field dispositions

- `searchProgram.source/functions`: MCGS program intent. Translate mechanically to `compileDeviceProgram`; CUDA-JS validates its Device-JS contract. Runtime-entry becomes public Device-JS `kernel`, device-callable becomes `device`; `sideband<direction,u32>` mechanically maps to the public mailbox type. No parser or second type validator is added.
- `resourceRequirements.byteLength`: MCGS requirement; convert bounded decimal to safe integer and call `allocateDevice({ byteLength })` only.
- `resourceRequirements.alignment`: MCGS requirement checked against the lower-owned compatibility projection. Because alpha.18 guarantees a minimum base alignment, admission requires `lowerMinimumAlignment % requestedAlignment === 0`. Alignment is never passed as an allocation option.
- `memorySpaces/accessRequirements`: MCGS requirement/evidence. They may fail admission when v0 cannot realize them; they do not become invented lower enums.
- operation bindings: MCGS-selected wiring. Resource bindings map to the already allocated public capability; sideband bindings map to `{ kind: 'publication-mailbox', mailbox, lane }`; scalar schemas require explicit pre-ignition values and are never used to invent values.
- `grid/block/dynamicSharedBytes`: MCGS selected launch policy translated mechanically to public launch options; CUDA-JS remains validity/range owner.
- `maxPending`: selected MCGS requirement. v0 admits only the currently accepted single-operation/one-pending profile and does not infer a scheduler from lower capacity-two support.
- explicit operation-local `read|write|read-write`: the sole source for ordinary public launch access records. Each selected resource binding becomes a full-resource access range at its actual argument index. Broad resource atomic/publication facts are not converted into access guesses.
- sidebands: each accepted u32 release-acquire sideband receives a public named mailbox lane with the declared direction. Host control writes only through public mailbox `store`; no polling/relaunch or host read-decide-write loop is introduced.
- completion/failure: public `CudaOperation.status()/wait()/close()` and public `CudaJsError` facts remain authoritative. Adapter failure records retain lower code/category/operation/health and add only stable MCGS phase/classification.
- teardown: close adapter-owned pending operation/function/module/mailbox/memory children before aggregate runtime close; preserve cleanup failures and restart-required/orphan truth instead of relabeling them successful.

## Foundations, resources, lifecycle and compatibility

All execution-package numeric quantities enter as canonical decimal strings and must fit the public Node number domain before calls that require numbers. Unsafe conversion fails before mutation. Resource initial bytes and scalar values are invocation inputs separate from the immutable package. Read/read-write resource bindings require explicit bounded initial bytes; write-only resources may remain uninitialized. Current canonical runtime entry has no scalar binding, but the port fails closed if a future v0-shaped package declares one and no matching input is supplied.

The adapter opens a compiler-enabled public runtime, compiles the restricted Device-JS program, loads the returned PTX/cubin artifact, resolves the declared function and its public parameter kinds, allocates declared resident storage, creates declared mailboxes, writes required pre-ignition input, and then submits the one declared operation. Prepared DAG is deliberately not used in v0 because the current public prepared-DAG binding surface does not accept mailbox capabilities while direct `CudaFunction.submit()` does. Lower prepared capacity is not semantic permission to invent a multi-operation MCGS schedule.

Unsupported package identity, peer package/API mismatch, missing public methods/capability projection, unsatisfied alignment, unsupported memory requirement, more than one runtime operation, `maxPending != 1`, unsafe numeric conversion, missing required runtime inputs, compilation/load/allocation failure, operation failure, or unproved cleanup all fail closed with no fallback.

No persisted format or migration is introduced. The exact peer identity is package input/compatibility authority; a later CUDA-JS release requires a fresh compatibility assessment rather than silent widening. Removing the current first product/domain leaves a truthful generic MCGS-to-CUDA-JS adapter boundary.

## Question disposition matrix

| Questions | Disposition |
| --- | --- |
| 1–8 outcome/evidence/authority | Resolved: #125 requires the absent production public adapter; exact protected MCGS and public CUDA-JS subjects are frozen above; success is portable end-to-end realization/cleanup, not native qualification. |
| 9–14 current owner/system | Resolved: Search Compiler owns normalized package intent, CUDA-JS owns lower runtime truth, and `integration.cuda-js` is the first translation boundary. Existing public CUDA-JS bricks eliminate any need for native/private implementation. |
| 15–23 LEGO boundary | Resolved: one adapter component owns translation/composition/rollback only, depends directionally on accepted package values plus the public peer, and is independently testable with an injected public peer. |
| 24–32 foundations/resources/lifecycle | Resolved for v0: safe integer conversion, exact alignment divisibility, one pending operation, explicit input data, mailbox sidebands, opaque lower resources, fail-closed pressure/failure and reverse teardown. Native/resource ceilings remain lower-owned. |
| 33–40 alternatives/adversary | Resolved: no-change leaves #49/#125 consumer proof absent; duplicating lower lifecycle or using prepared DAG is rejected; generic scheduler is rejected; direct one-operation submit is the smallest sound path. Falsifiers are peer mismatch, unsupported current package shape, or a required private/native lower mechanism. |
| 41–48 plan/proof | Resolved: red-first absence proof, coherent component construction, focused portable falsifiers, full repository qualification, exact-head review, then guarded integration only after fresh authorization. Native pair/performance remain deferred. |

Triggered lenses: universal-framework, GPU/concurrency, compatibility and engineering-judgment lenses are material and resolved as above. Security/trust is limited to fail-closed validation of executable source/package intent and refusing private/native authority; no credential surface is added. Persistent-state migration is not applicable because the adapter owns no persisted state. Performance claims are explicitly not part of this slice.

## Strongest adversarial result

The most damaging credible failure is accidentally creating a second scheduler/runtime: accepting multiple operations merely because CUDA-JS exposes capacity-two scheduling, serializing them in package order, or using host completion to decide what search action to submit next. That would move Progress/search semantics into the adapter and make the design appear functional while violating ownership. The v0 therefore admits exactly one declared runtime operation and exposes only bounded control/observation around that opaque operation. A later accepted multi-operation semantic profile must bring its own authority before this restriction can widen.

The strongest overengineering case is adding a general preparation graph or adapter-side contract model. Rejected: direct use of the lower public resources is sufficient. The strongest underengineering case is trusting lower-shaped fields as already-valid CUDA-JS requests. Rejected: exact peer/capability admission and public lower validation are mandatory, and alignment/access/lifecycle are translated only where MCGS owns intent.

## Coherent execution plan

1. Commit this canonical assessment and preserve the exact starting subjects.
2. Add a falsifier-only portable conformance capsule whose accepted alpha.18 single-operation package cannot import/use the reserved production adapter because no component exists. Record the expected red before production source.
3. Create `adapters/runtimes/cuda-js/README.md` and `component.yaml`, update `agent_files/SYSTEM_REGISTRY.md`, then add the smallest production public port and implementation needed for exact admission/preparation/ignition/control/wait/close. No experiment/conformance import may enter production source.
4. Build the portable injected public-peer fixture only in `conformance/cuda-js-runtime-adapter/`. Cover missing package/capability, exact-version drift, alignment divisibility, unsafe values, access translation, missing initial data/scalars, mailbox direction/control, compilation/allocation/submit failure, deferred operation failure, repeated run/cleanup and cleanup quarantine/restart truth.
5. Add only a thin repository script/workflow entry if existing qualification discovery does not already include the capsule. Run focused qualification, source/governance checks, Search Compiler/reference integration and the full required repository matrix on the exact head.
6. Perform complete-diff author review with special attention to private/deep CUDA-JS imports, duplicated lower validation, host progression, hidden serialization, resource leaks and failure truth. Fix/requalify until clean.
7. Open/refresh a draft #125 PR, record exact head/tree/checks and review. Do not merge or claim native compatible-pair evidence. Stop at the protected authorization seam for fresh exact-head integration authorization.

## Rollback, completion and revisit triggers

The focus branch is disposable until protected integration; protected `main` is not mutated during construction. Any red evidence that requires a private CUDA-JS file, raw CUDA/native code, host-driven search progression, or a new generic lower primitive blocks implementation and is escalated to the lower owner. Any peer/package/API change invalidates current compatibility evidence.

Completion evidence is: red-before-green absence proof; portable exact-peer success; permanent falsifiers for admission/access/sideband/failure/cleanup; full exact-head repository qualification; clean full-diff review; draft PR frozen at the reviewed head. Native compatible-pair qualification remains CUDA-JS #32 and is not a #125 completion claim.
