# SPEC-0014: Public library interface and installed-package boundary

**Status:** Accepted

**Version:** 0.1.0

## Authority, identity, and applicability

- **Specification ID and version:** `cuda-mcgs.library-interface/0.1.0`
- **Authoritative owner:** `interface.library`
- **Product area / component / durable path:** `components/library-interface/`
- **Intended consumers:** ordinary Node.js CUDA-MCGS library users, downstream product composition roots, conformance and future external embedding consumers.
- **Applies to:** prerelease public facade calls, complete public component/adapter subpaths, installed-package export closure, resolver/composer diagnostics and material resolution provenance.
- **Explicitly out of scope:** search/domain/policy/evaluator/resource semantics; Search IR normalization rules; CUDA-JS runtime/provider mechanisms; physical/native qualification; active-search scheduling/progression; product-specific semantics; npm release policy; 1.0 stability guarantees.
- **Supersedes / superseded by:** none.
- **Normative dependencies:** ADR-0005, ADR-0019, ADR-0020, ADR-0024; SPEC-0000; accepted Search IR 0.2 schemas; `tool.search-compiler` public contract; `integration.cuda-js` public adapter contract.
- **Informative references:** CUDA-MCGS #109, #123 and CUDA-JS #32.

## Purpose and required outcome

Provide one public CUDA-MCGS library entry surface through progressive disclosure without creating another semantic implementation or runtime. Convenience calls MUST resolve before ignition through the canonical Search Compiler path. Complete users MUST be able to bypass/delete the convenience facade and use the Search Compiler public port directly. Runtime realization MUST remain a separately exported/injected adapter concern.

The installed artifact MUST fail closed on unexported package paths and MUST expose enough exact version/provenance information for consumers and conformance to identify the surface they used.

## Reading map

This specification is small and tightly coupled; read it completely. ADR-0020 is required for progressive-disclosure/default meaning. SPEC-0000 and the accepted Search IR 0.2 contracts govern the semantic objects delegated through this interface. `integration.cuda-js` authority is required only when a consumer selects the runtime-adapter subpath.

## LEGO ownership and design boundary

### Exact owned invariant and state owner

`interface.library` owns the invariant that every supported public convenience call is a thin, pre-ignition projection onto an existing canonical production owner, with no copied search/runtime semantics and no hidden post-ignition behavior.

The component is stateless. Search Compiler owns resolver/composer meaning and its validation diagnostics. `integration.cuda-js` owns runtime translation/lifecycle. Versioned schemas own low-level contract shape. The package export map owns which of those already-public ports are reachable through the installed package.

### Intended equivalence class, permitted variation, and exclusions

Intended members include unrelated product-neutral CUDA-MCGS profiles using the same accepted Search Compiler contracts. Consumers may choose convenience default resolution or explicit generator selection and may independently select the runtime adapter. Concrete product/domain defaults, CUDA provider selection and physical topology are excluded.

### Public ports, injected dependencies, and adapters

The prerelease package MUST expose:

- root facade `resolve(profileTemplate, generator?)`;
- root facade `tryResolve(profileTemplate, generator?)`;
- root facade `compose(resolvedInput, inspectedContracts, compositionContext)`;
- root facade `tryCompose(resolvedInput, inspectedContracts, compositionContext)`;
- immutable `referenceGenerator` and `libraryConstants` describing this interface contract/version;
- `cuda-mcgs/search-compiler` mapped to the complete Search Compiler public index;
- `cuda-mcgs/runtime/cuda-js` mapped to the complete CUDA-JS runtime-adapter public index;
- explicit versioned Search IR 0.2 schema-file subpaths.

No facade function may import a Search Compiler private `src/` module, a CUDA-JS module, an adapter private `src/` module, conformance code, experiments, FFI, CUDA, PTX or product code.

### Second-instance / first-consumer deletion / total-system simplicity

A second unrelated MCGS consumer MUST use the same facade/subpaths without new interface ownership. Deleting the root convenience facade MUST leave the Search Compiler and runtime-adapter public subpaths coherent and usable. Deleting any concrete external consumer MUST leave this interface product-neutral.

## Terms, units, and definitions

- **Facade:** the root package functions owned by `interface.library`; not a runtime or semantic interpreter.
- **Reference generator:** the Search Compiler-owned neutral generator preset already represented by `composerConstants.referenceGenerator`.
- **Explicit equivalent:** a call supplying a generator value byte/field-equivalent to the reference generator.
- **Installed consumer:** Node.js code resolving `cuda-mcgs` through a package installation, not repository-relative production source paths.
- **Diagnostic:** immutable plain data `{ code, message }` emitted/classified by the owning production component.

## Inputs, outputs, errors, and side effects

`resolve` accepts a program-package profile template and optional generator. If generator is omitted, it MUST pass the Search Compiler-owned reference generator to `createResolvedComposerInput`. It returns the canonical Search Compiler resolved result unchanged.

`tryResolve` accepts the same inputs and MUST delegate error classification to a public Search Compiler try-port. On accepted validation failure it returns `{ status: 'failure', resolvedInput: null, diagnostic }`; on success it returns `{ status: 'success', resolvedInput, diagnostic: null }`. Unexpected non-validation exceptions MUST propagate rather than being mislabeled.

`compose` delegates directly to `composeResolvedEngine` and returns its publication bundle unchanged. `tryCompose` delegates directly to `tryComposeResolvedEngine` and returns its result unchanged.

The facade owns no external resources and performs no I/O, allocation, runtime creation, launch, host polling, cache mutation or active-search operation.

## Public/internal boundary and dependencies

Only public indexes of production owners are legal dependencies. Package installation MAY contain private implementation files required by relative imports inside an exported owner, but the export map MUST NOT make those paths importable by consumers.

The package manifest MAY expose exact versioned schema files as data. It MUST NOT expose conformance/testing ports as supported package subpaths.

## Normative requirements

### LIB-001 — one canonical resolver

Every facade resolution MUST call the Search Compiler canonical resolved-input implementation. No second normalizer, field copier or semantic default engine is permitted.

### LIB-002 — one canonical composer

Every facade composition MUST call the Search Compiler canonical composer. No convenience-specific Search Program or execution-package builder is permitted.

### LIB-003 — neutral omitted-generator rule

Omitting the generator MUST select only `composerConstants.referenceGenerator`. No domain, evaluator, resource, product, runtime or observed-value default may be inferred by the facade.

### LIB-004 — explicit precedence

A supplied generator MUST be passed to Search Compiler as supplied and therefore take precedence over the omitted-generator convenience choice. Invalid/conflicting values fail under Search Compiler authority.

### LIB-005 — material provenance

Successful resolution MUST preserve the complete canonical `resolution.policy` and `resolution.rules` values, including owner, reason, version, revision, selection and material value. The facade MUST NOT summarize away or rewrite these facts.

### LIB-006 — owner-classified diagnostics

The facade MUST NOT classify Search Compiler private exception types itself. Search Compiler MUST expose the try-resolve port that converts its own accepted validation failures to plain diagnostic data. Unexpected exceptions remain exceptional.

### LIB-007 — failure atomicity

Failed `tryResolve` or `tryCompose` MUST publish no successful resolved/composition result. The facade owns no partial cache or retained state.

### LIB-008 — convenience/explicit equivalence

For a profile template accepted with the reference generator, omitted-generator and explicit-reference-generator calls MUST produce byte/identity-equivalent resolved input. A content-sensitive generator change MUST alter the canonical identity or fail closed according to Search Compiler rules.

### LIB-009 — facade deletion

The complete public Search Compiler subpath MUST remain usable if the package-root facade is removed. Tests MUST prove direct Search Compiler results agree with facade results on the same inputs.

### LIB-010 — runtime separation

Runtime realization is not a root-facade side effect. The public CUDA-JS adapter MUST be an explicit subpath and continue to require an injected public CUDA-JS namespace when actually used.

### LIB-011 — no lower leakage

Facade diagnostics and constants MUST NOT expose CUDA-JS private types, native handles/pointers, generated CUDA/PTX, FFI details, provider internals or copied lower compatibility facts.

### LIB-012 — export closure

The installed package export map MUST expose only declared public roots and versioned schema files. Consumer attempts to deep-import production private source or testing ports MUST fail through Node package-export closure.

### LIB-013 — installed artifact evidence

Conformance MUST pack and install the exact candidate artifact and execute public imports from the installed package resolution context. Repository-relative import success alone does not satisfy this requirement.

### LIB-014 — exact installed identity

Installed conformance MUST record the package name/version, interface contract/version and exact candidate Git revision/tree used to build the artifact. The development package version is evidence identity, not a release/support promise.

### LIB-015 — versioned low-level access

Low-level schema access MUST be explicitly versioned in the package subpath. Adding a new schema version MUST NOT silently retarget an existing versioned subpath.

### LIB-016 — public component access

The complete Search Compiler and runtime-adapter public indexes MAY evolve under their own prerelease contracts, but `interface.library` MUST reference them only through their public indexes and MUST not mirror their symbol sets.

### LIB-017 — no post-ignition adaptation

The facade MUST complete resolution/composition before any runtime ignition. It MUST not own callbacks, host polling, relaunch, active-search adaptation or lifecycle progression.

### LIB-018 — package is prerelease qualification only

Until separately released, the repository package MUST remain marked private/development and documentation MUST continue to state that no released CUDA-MCGS package or physically qualified CUDA-MCGS runtime exists.

### LIB-019 — no physical inference

Portable/installed conformance under this specification cannot close CUDA-JS #32, prove native execution, qualify Linux/NVIDIA hardware, establish performance, or promote product readiness.

### LIB-020 — downstream external-consumer split

This specification makes the public surface available for #123, but #123 retains external product embedding semantics and exact physical compatible-pair acceptance. `interface.library` MUST not absorb UCI/product behavior merely to satisfy a future consumer.

## Invariants and prohibited states

Prohibited states include a second semantic resolver/composer, a root-facade-created runtime, hidden CUDA-JS import, product-specific default, private/deep package export, caught-and-relabeled unknown exception, post-ignition host progression, unversioned schema alias, or a support claim broader than exact evidence.

## Expected ranges, precision, representations, identity, versions, and memory spaces

The interface introduces no numeric search ranges, precision or memory-space semantics. Those remain delegated contract facts. Interface identity is `cuda-mcgs.library-interface/0.1.0`; the development package identity is independently versioned. Resolved/composed identity values are returned unchanged from Search Compiler.

## Lifecycle, ownership, ordering, concurrency, publication, cancellation, and teardown

The facade lifecycle is call-local and synchronous pre-ignition. It owns no persistent state or teardown. Runtime operation, cancellation, publication and teardown remain outside this component and are owned by the selected runtime adapter/lower runtime contracts.

## Resource, pressure, exhaustion, and failure behavior

The facade allocates no CUDA/search resource and owns no pressure policy. JavaScript allocation failure or unexpected platform exceptions propagate. Semantic/resource admission failures remain Search Compiler diagnostics.

## Recovery, rollback, cleanup, and retained state

A rejected facade call is immediately retryable with corrected inputs because the component retains no state. Conformance-created package tarballs, install directories and generated consumer shims MUST be temporary and removed after each run, including failure paths where practicable.

## Compatibility, migration, persistence, and versioning

This is a pre-1.0 interface. Any semantically material facade default, call shape, package export, diagnostic envelope, or interface constant change requires a specification/version review and invalidates corresponding installed-package evidence. Search Compiler/schema semantic versions remain independently authoritative.

## Security, privacy, permissions, trust, and provenance

The interface accepts plain caller data and must not execute caller strings itself. Package export closure is a least-authority boundary, not a secrecy mechanism. Provenance returned by Search Compiler remains canonical and must not be fabricated or weakened. The component performs no network access and requires no credentials.

## Generated artifacts, ABI, package, and cache identity

`npm pack` output is a generated qualification artifact and MUST NOT be committed. There is no native ABI. Package contents/exports, package version, exact Git revision/tree and the Search Compiler-produced identities are material evidence keys. The facade owns no cache.

## Conformance requirements and authoritative test oracles

The owning conformance capsule MUST cover:

1. installed root import from a packed exact candidate;
2. omitted vs explicit reference-generator identity equivalence;
3. explicit facade vs direct Search Compiler resolved identity equivalence;
4. facade vs direct Search Compiler composed Program Package/Search Program/execution-package/publication identity equivalence on a valid product-neutral fixture;
5. complete resolution provenance preservation;
6. owned invalid-input diagnostic and zero successful result;
7. direct subpath usability after facade bypass/deletion;
8. public runtime-adapter subpath import without lower runtime execution;
9. rejection of at least one private/deep package path;
10. cleanup of temporary artifact/install/shim state.

Existing Search Compiler and runtime-adapter owner capsules remain authoritative for their semantics. Existing exact-pair portable evidence remains separate and must remain green when this package surface changes.

## Performance and quality requirements and evidence

The facade is pre-ignition and thin; no runtime performance claim is created. Conformance should detect accidental second-pass copying/interpretation structurally and by exact identity rather than microbenchmarking.

## Reader-triggered specialist doctrine

Implementation/testing triggers LEGO design, repository organization, assessment/planning, testing, source-boundary, cleanup/disposition and PR review/merge doctrine. Native/CUDA specialist doctrine is not triggered by this component because native execution is explicitly out of scope.

## Examples and rationale

Informative example:

```js
import { resolve, compose } from 'cuda-mcgs';

const resolved = resolve(profileTemplate); // only the Search Compiler reference generator is defaulted
const packageBundle = compose(resolved.normalized, inspectedContracts, compositionContext);
```

A complete consumer may instead import `cuda-mcgs/search-compiler` and call the canonical owner directly. Runtime realization is selected explicitly from `cuda-mcgs/runtime/cuda-js`; it is never created by `resolve` or `compose`.

## Open questions and acceptance blockers

There are no unresolved ownership/lifecycle/failure questions for version 0.1.0. TypeScript generation, released package coordinates, 1.0 stability policy and higher-level product-specific builders remain deliberately outside this version and require demonstrated consumer/release needs.

Physical compatible-pair evidence remains blocked by unavailable accepted NVIDIA hardware but is not an acceptance blocker for this CUDA-free interface contract.

## Change, supersession, and downstream invalidation

Changing this specification invalidates `interface.library` component conformance and installed-package evidence. Changing Search Compiler public behavior/schema identities invalidates facade equivalence evidence. Changing package exports invalidates installed-consumer evidence. Changing the CUDA-JS adapter public index invalidates only the runtime-adapter subpath portion unless root facade behavior also changes. #123 must re-read the exact protected interface/package revision before external-consumer acceptance.