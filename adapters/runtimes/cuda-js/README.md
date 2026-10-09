# CUDA-JS Runtime Adapter

**Component:** `integration.cuda-js`  
**Status:** Protected production boundary  
**Owner:** CUDA-MCGS framework

This component translates an accepted CUDA-MCGS execution package into calls on an injected, versioned **public** `cuda-js` package surface. It is the runtime composition seam between CUDA-MCGS-owned search requirements and CUDA-JS-owned compiler, device, memory, module, function, operation, health and teardown mechanisms.

## Ownership

The adapter owns only:

- exact pre-allocation compatibility admission against the execution package and injected public peer identity;
- mechanical Device-JS/resource/sideband/launch translation from accepted package requirements;
- explicit pre-ignition resource/scalar input binding;
- direct ignition of the one accepted v0 operation;
- one ignition of a canonically declared finite continuation DAG through the public lower continuation port;
- bounded external sideband publication/observation through public mailbox capabilities;
- CUDA-JS-error-to-MCGS failure classification without erasing lower public facts;
- dependency-safe rollback and teardown for lower resources assembled by this adapter.

It does **not** own Search IR interpretation, search progression, a scheduler, native CUDA, source parsing, CUDA-JS request validity/ranges, provider selection, device choice, raw handles, lower health/resource truth, private CUDA-JS implementation, native compatible-pair qualification, or performance claims.

## Version-zero limits

The protected v0 surface intentionally fails closed unless the accepted package can be realized as one runtime-entry operation with `maxPending=1`. Lower capacity for multiple operations is not authority to invent MCGS operation ordering or host-driven search progression.

The adapter validates requested alignment against the public CUDA-JS minimum-allocation-alignment projection but calls ordinary allocation with `{ byteLength }` only. Operation-local `read|write|read-write` bindings are the sole source of ordinary launch access ranges. Sidebands map to public named u32 publication-mailbox lanes. Scalar schemas never imply runtime values.

Prepared CUDA-JS operation DAGs are deliberately not used by this v0 path because the accepted current package carries mailbox arguments while the current public prepared-DAG binding surface does not. Direct public `CudaFunction.submit()` is the smallest sufficient lower brick.

Exact peer revision is an injected compatible-pair provenance fact. The production adapter does not hard-code a CUDA-JS commit: it requires the execution package peer identity, injected peer identity, public package version and API schema to agree exactly. Historical portable fixtures may pin an older exact revision for reproducible conformance, but that revision must not be presented as the identity of a different actually executed checkout.

## Public port

`index.mjs` exports:

- `prepareCudaJsExecution(executionPackage, options)` — prepares one admitted execution using an injected public `cuda-js` namespace and exact peer provenance identity;
- `CudaJsRuntimeAdapterError` — stable MCGS-side error wrapper retaining lower public error facts.

The prepared execution exposes bounded `ignite`, `publish`, `observe`, `describe`, `status`, `wait`, declared terminal `deliver`, and `close` operations. Runtime inputs are supplied to `ignite`; they are not written into or inferred from the immutable execution package.

`describe()` returns `cuda-mcgs.cuda-js-execution-description/0.1.0`: immutable actual preparation metadata plus a bounded snapshot of the public lower runtime description. It includes the cold canonical execution-package digest, exact peer, semantic/physical source identities and actual compiled/library/link/load artifact identities. Artifact SHA256 values are calculated over actual public artifact bytes; separately reported lower digests remain labeled. The record contains no source text, binary bytes, handles or resource views. Preparation is distinguished from completed initialization; neither state is a search, duration or performance qualification. Description reads schedule no search and block parent close while pending. Closed executions reject new reads.

## Declared continuation child

The additive `cuda-mcgs.device-continuation/0.1.0` package declaration selects a finite kernel DAG with one final 1x1 controller. Every operation belongs to that DAG, bounded cold initialization, or an explicitly declared external role. The adapter checks the exact public CUDA-JS continuation capability and bounds, compiles declared functions using the combined device header/RDC profile, loads the public linked artifact, and passes the trusted compiler's returned controller execution profile to function resolution. Operation launch constraints apply to the canonical reachable function closure. Identical declared resource, scalar and mailbox bindings reuse named slots across nodes; the lower 64-binding bound counts unique declarations. Shared scalar declarations must receive identical typed values. The original one-operation path remains unchanged.

`ignite({resources, scalars})` supplies whole-resource byte snapshots and internal/initialization-operation scalar records. After cold writes, each declared ordinary initializer is waited and closed, and its exact bounded u32 readiness result is copied and checked. Failure prevents active ignition. The DAG is then submitted once. CUDA-JS owns device continuation and the full-chain operation. Host publication and observation use only declared opaque mailbox lanes. There is no host search relaunch loop. Closing during cold initialization is rejected; unproved child or transfer cleanup retains dependent resources.

Successful ignition additionally returns `initializationResults`, one record per declared initializer containing its operation id, resource id, exact typed view and a copied `Uint8Array` of the checked readiness bytes. These are the already admitted cold reads, not an arbitrary memory-read port. Canonical owners retain the readiness payload's field meaning; the adapter neither interprets root authority nor exposes a borrowed native view.

The `0.0.0-dev.2` package adds `await prepared.preinitialize({resources})` for
storage preparation before a consumer announces readiness. It snapshots each
whole admitted resource, validates every zero/content proof, and completes its
public device writes. It executes no initializer or search operation and leaves
the execution `prepared`; root readiness remains `not-started`. Large proof
checks yield in bounded chunks over the adapter-owned snapshots. Only exact
duplicate proof declarations are deduplicated. Differing hashes and overlapping
extents retain their independent checks. Pending preparation retains storage
ownership and blocks ignition/close; write failure tears down or quarantines.

After successful preinitialization, `ignite` must omit `resources`. It may supply
`initializationParameters: {[initializerOperationId]: {[parameter]: bytes}}`.
Each late input is an exact snapshot of an existing initializer's ordinary
mutable read view. Zero-marked, immutable, atomic, output, internal-overlapping
or overlapping staged aliases fail before transfer. No caller placement or
whole-atlas replacement is accepted. The adapter stages only these bounded views,
then performs the existing GPU-owned initializer/readiness check and single
ignition. The original `ignite({resources, scalars})` route internally prepares
storage and retains its behavior. This seam moves bulk initialization ahead of
clocked input; it does not redefine a consumer's clock origin or search policy.

`describe().storageInitialization` distinguishes storage preparation from
semantic root initialization. Its completed summary contains actual snapshot
byte/resource counts and host validation/write phase timings. These are adapter
host phases, not inferred provider utilization or search-work counters.

Optional `publicRequirementSelections` carry CUDA-MCGS consumer-owned canonical JSON selection documents and their exact SHA256 references. They bind the injected peer and complete public CUDA-JS compatibility metadata, including the existing asynchronous-transfer and scoped atomic-observation ports. These references are consumer selections, not CUDA-JS-issued schema digests. Missing, altered or mismatched selection bytes fail before the runtime opens.

While the continuation is running, `submitExternal(operationId, {scalars, parameters})` admits only a preplanned `external-control` or `read-only-observation` operation. Each staged parameter is an exact byte snapshot of its declared ordinary view, disjoint from internal and immutable ranges. Concurrent shared views require compatible explicit atomic effects, or ordinary read-only access on both operations. Effects mechanically select the public lower atomic lease modes; semantic ownership and device ordering remain with canonical owners.

The external child exposes `wait`, `deliver`, and `close`. Its one copied delivery is restricted to the declared exclusive written output view. The GPU child closes before its bounded D2H transfer, while the primary continuation may remain pending. Only one external child or transfer can occupy the additional lower pending slot. Failed child or transfer cleanup blocks further external submission and retains dependent resources in a quarantine report. Closing during staging or delivery is rejected.

This child is a source candidate. Portable translation and cleanup checks do not qualify resident search semantics, arbitrary game duration, the physical compatible pair, or performance. Exact finite physical receipts must state their workload, peer, device and duration separately.

## Declared source partition

The additive `cuda-mcgs.device-source-partition/0.1.0` declaration preserves the whole semantic Search Program while selecting one closed device-callable leaf library and a main compilation unit. Each unit contains at most 64 declared functions. The Compiler owns exact source reconstruction, semantic owner identities and call closure; the adapter consumes declared source bytes, SHA256 identities, canonical function memberships, exports and main-to-leaf aliases without parsing or splitting source.

After cold metadata admission, `compileDeviceLibrary` compiles the leaf through the public CUDA-JS port. The adapter checks returned export signatures, then inspects and compiles the declared main source with actual local library imports and the already admitted external `deviceImports`. Public library composition owns RDC selection, so these requests omit an explicit RDC option. No-import continuation requests retain their existing selection.

CUDA-JS has no public device-library inspection port; `inspectDeviceProgram` requires a kernel. Consequently, library syntax and main syntax involving locally compiled imports are checked after opening the compiler runtime, before module resolution or resident allocation. Compilation or inspection failure closes that runtime or reports retained ownership. No fabricated library artifacts or validation kernels bridge this boundary.

## Qualification

Owner-local portable conformance lives under `conformance/cuda-js-runtime-adapter/` and is entered by `node scripts/run-cuda-js-runtime-adapter.mjs`. It uses an injected fake of the public CUDA-JS port so the capsule can falsify translation, failure and cleanup semantics on Windows and Ubuntu without claiming native CUDA compatibility.

The portable fake is translation/lifecycle scaffolding, not a physical workload oracle. In particular, its historical synthetic output/launch shape must not be promoted unchanged to native execution. Exact physical workload resource and launch bounds come from accepted CUDA-MCGS semantic owners through `tool.search-compiler`.

Declared terminal delivery maps the accepted Output-owned package delivery id to an exact public CUDA-JS asynchronous D2H operation only after operation completion. The transfer operation is waited and closed before its backing memory; unproved transfer cleanup retains/quarantines backing memory and runtime rather than claiming terminal release. Arbitrary generated-resource reads are not exposed.

Native exact compatible-pair evidence remains owned by CUDA-JS #32. The protected #125 assessment remains the construction provenance and critical boundary record; post-integration current state is owned by protected `STATUS.md` / `next_step.yaml` and live GitHub read-back.
