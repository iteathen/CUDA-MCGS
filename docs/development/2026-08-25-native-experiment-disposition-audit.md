# Native Experiment Disposition Audit

**Status:** Informational

**Audit date:** 2026-08-25

**Claim:** Bounded disposition audit

**Frozen CUDA-MCGS subject:** `main@1baadc50e3fd3d99c00e2d13c7a64b56fc056c78`

**Frozen CUDA-JS public-contract baseline:** protected `main@2135216b1a9fd88066a1c82b61ae533645eac9c2`, package `cuda-js@0.1.0-alpha.6`

## 1. Scope and decision

This audit accounts for every durable conclusion recorded by the tracked CUDA C++ prototype and hand-authored PTX extension-composition capsule, every active validation hook that executed either capsule, and every active document that treated either capsule as retained evidence.

The disposition is:

1. preserve CUDA-MCGS semantic findings in their accepted specifications and CUDA-free reference capsules;
2. consume generic GPU mechanisms only through versioned public CUDA-JS contracts;
3. keep unresolved generic gaps attached to explicit CUDA-JS issues or qualification owners;
4. retire native-mechanism and synthetic-performance claims that have no current production authority;
5. delete all CUDA C++/PTX source, fixtures, runners and native build surfaces from CUDA-MCGS; and
6. retain only concise, non-executable historical summaries under `docs/archive/experiments/`.

This audit does not claim an exact CUDA-MCGS/CUDA-JS compatible pair, native Linux support, production search readiness, representative performance, or closure of the open gaps listed below. CUDA-JS source and conformance internals were inspected only through the frozen public repository revision; the dirty sibling CUDA-JS working tree was protected and was not used as authority.

## 2. CUDA C++ prototype finding map

| ID | Retained finding | Durable semantic owner | Current CUDA-JS public owner/evidence | Disposition |
|---|---|---|---|---|
| `CU-DEVICE-CLOSURE` | One bounded launch can make iterative search progress without a CPU-produced intermediate result. | Device-progress and engine contracts; SPEC-0001 publication/resource semantics. | Accepted CUDA-JS SPEC-0016 opaque operation lifecycle and public F5/F8 operation evidence. Exact consumer proof remains CUDA-JS #32. | Remove the direct-runtime reproducer. Later prove one frozen Search Program through the public package. |
| `CU-PUBLICATION` | Readiness is a producer/consumer edge; a consumer must not observe a ready marker with stale payload. | SPEC-0001 `PUB-*`; Search IR publication channels and reference mutations. | CUDA-JS SPEC-0009/F9 proves an opaque atomic-publication compiler/runtime path; SPEC-0014 owns host-visible system-scope mailboxes. Device-memory Device-JS release/acquire remains CUDA-JS #123. | Remove native atomics. Backend-neutral validation remains active; native internal-channel qualification stays blocked on #123 and #32. |
| `CU-TRANSPOSITION` | One state identity may have multiple distinct incoming edge-statistic owners. | SPEC-0001 `GRAPH-002/003`; Search IR and graph-profile reference evidence. | No CUDA-JS semantic owner is appropriate. CUDA-JS owns only opaque memory/execution resources. | Native case retired in favor of CUDA-free semantic evidence and later public-pair equivalence. |
| `CU-CYCLE` | Resolve state identity before applying the selected path-local cycle policy. | SPEC-0001 `GRAPH-004/005/006`; Search IR and policy/graph reference evidence. | No CUDA-JS semantic owner is appropriate. | Native case retired in favor of CUDA-free semantic evidence and later public-pair equivalence. |
| `CU-CAPACITY` | Failed admission must not consume capacity or inflate a published/live count; failures and high-water state are distinct. | SPEC-0001 `RES-*`; resource and graph reference evidence. | CUDA-JS SPEC-0004 and resource-registry contracts own generic bounded allocations/leases, not search counters. | Native CAS implementation retired; semantic counters remain CUDA-MCGS-owned. |
| `CU-SCHEDULER` | Warp ticket batching reduced ticket claims but did not establish a performance win or select a scheduler. | SPEC-0001 `SCHED-*` and later scheduler-profile selection. | CUDA-JS SPEC-0018 owns bounded host-visible operation scheduling, not the internal search scheduler. CUDA-JS #28 owns generic exact-profile performance/soak methodology. | Retire the toy mechanism and all performance inference. No CUDA-JS feature gap is created. |
| `CU-ORACLE` | A plausible wrong best-action expectation must be rejected. | Search IR/reference and later engine differential conformance. | No CUDA-JS owner; CUDA-JS must remain consumer-neutral. | Native oracle mutation retired; CUDA-free oracle sensitivity remains required. |
| `CU-LIFECYCLE` | Programs, links, modules, operations, memory, context and workers require terminal disposition. | CUDA-MCGS owns search/result cleanup ordering. | CUDA-JS SPEC-0003, SPEC-0005/0006 and SPEC-0016 own generic resource/operation teardown; public F5/F6/F8 evidence is the replacement mechanism evidence. Exact pair remains #32. | Remove direct CUDA reset/cleanup code; later consume public terminal states only. |
| `CU-RACE-LIMIT` | The sanitizer attempt was incomplete and never established a clean race or formal memory-model claim. | Future concrete engine qualification under SPEC-0001. | CUDA-JS public contracts define the mechanism; they do not certify consumer search races. | Preserve the negative limit, delete the binary reproducer, and require fresh exact-pair race/publication evidence for any future native claim. |
| `CU-INFLIGHT-GAP` | Reusing completed visits as in-flight reservations is not production-conforming. | SPEC-0001 `GRAPH-007` and the policy/resource owners. | No CUDA-JS semantic owner is appropriate. | Preserve the prohibition; delete the non-conforming implementation. |

## 3. PTX capsule finding map

The IDs below are the complete durable finding set from the capsule's `FINDINGS.md`.

| Historical ID | Finding | Current owner/evidence | Disposition |
|---|---|---|---|
| `CJS-PTX-001` | Ordinary compilation could not emit independently linkable device definitions at the old revision. | Accepted CUDA-JS SPEC-0010 typed RDC; CUDA-JS #35 is closed; public F6 RDC and installed-package evidence exist at the frozen baseline. | Resolved generic gap. Delete the hand-authored PTX workaround. CUDA-MCGS consumes restricted Device-JS, not RDC/PTX directly. |
| `CJS-LINUX-001` | Portable checks did not establish native Linux compile/link/launch support. | CUDA-JS #4 owns the first Ubuntu native F2L-F8L chain; #17 owns later distributions. | Unresolved qualification gap. No Linux claim and no local workaround. |
| `CJS-DIAG-001` | Link failures were attributable, stable and did not poison the compiler actor. | Accepted CUDA-JS SPEC-0006 CompilerActor/linker/cache contract and public F6 failure/recovery evidence. | Replace local failure injection with the public contract; exact consumer-pair failure evidence remains later. |
| `CJS-LINK-001` | Ordered bounded link, copied output, load, launch, quotas and graceful close worked at the old pair. | Accepted CUDA-JS SPEC-0005/0006 public module/link/execution contracts and F5/F6/F8 evidence. | Replace local native validation with frozen public-contract evidence. |
| `MCGS-EXT-001` | Strict semantic manifests and deterministic ordering reject incompatible plans before native work. | CUDA-MCGS SPEC-0003/0005 and the CUDA-free Search IR Composer reference. | Preserve semantics; delete the PTX-shaped prototype schemas. |
| `MCGS-GEN-001` | Hand-authored PTX was only a workaround for missing generic compilation. | CUDA-JS SPEC-0013 owns restricted Device-JS lowering; SPEC-0010 owns optional RDC realization. CUDA-MCGS SPEC-0005 forbids native artifact authoring/parsing. | Superseded. No CUDA-MCGS PTX generator or parser will be created. |
| `MCGS-COST-001` | Fine call-per-hook shapes increased calls, code and registers; direct symbols were not free. | CUDA-JS owns private realization. CUDA-MCGS SPEC-0005 keeps semantic topology independent of native topology and requires public artifact/resource evidence for selected profiles. CUDA-JS #28 owns generic measurement discipline. | Preserve only the design warning. Retire synthetic PTX cost validation and all thresholds. |
| `MCGS-GRANULARITY-001` | Same-input PTX did not imply inlining; coarse boundaries sometimes amortized calls. | CUDA-MCGS SPEC-0005 `COMPOSE-LEGO-*` and `COMPOSE-COST-*`; physical fusion/link topology remains CUDA-JS-private. | Preserve separation of semantic and binary topology. No public RDC/LTO dependency is implied. |
| `MCGS-TIMING-001` | Host timing was unsuitable; `%clock64` was bounded mechanism evidence, not wall time. | CUDA-JS #28 owns generic reproducible performance/soak methodology; a future CUDA-MCGS profile owns representative search/evaluator acceptance. | Retire all capsule timing validation. No performance claim survives. |
| `MCGS-UNBOUND-001` | An unselected capability must disappear semantically and from selected-profile public artifacts/resources. | CUDA-MCGS SPEC-0005 `COMPOSE-DELETE-*` plus Search IR Composer deletion/metamorphic evidence; CUDA-JS public artifact/resource identities are consumed only during later native qualification. | Replace byte/SASS parsing with semantic deletion evidence now and public identity/resource inspection later. |
| `MCGS-VALID-001` | Regex checks cannot prove PTX validity; authoritative native validity belongs to the compiler/linker. | CUDA-JS SPEC-0006/0010 typed artifacts and linker validation. CUDA-MCGS validates only its semantic manifest and public result identity. | Delete the home-grown PTX checker and fixtures. |
| `MCGS-SEARCH-001` | A tiny one-launch search showed lifecycle composition but not scheduler/concurrency/evaluator readiness. | CUDA-MCGS engine contracts own search meaning; CUDA-JS SPEC-0016 owns the opaque operation. Exact integrated evidence remains #32. | Delete the miniature native search; retain no production-readiness inference. |
| `MCGS-PAIR-001` | Exact-revision package use was practical, but no released compatible pair was established. | CUDA-JS #32 plus CUDA-MCGS `FRAMEWORK-COMPAT-003`/SPEC-0005 compatible-pair records. | Unresolved cross-repository gate. Sibling checkouts and private imports remain forbidden. |

## 4. Current unresolved gaps

| Gap | Owner | Effect on CUDA-MCGS |
|---|---|---|
| Device-scope release/acquire helpers for Device-JS device-memory publication | [CUDA-JS #123](https://github.com/iteathen/CUDA-JS/issues/123) | Blocks native internal Async Stage Channel qualification; does not block backend-neutral schema/reference work. |
| First exact CUDA-MCGS/CUDA-JS public compatible pair | [CUDA-JS #32](https://github.com/iteathen/CUDA-JS/issues/32) plus CUDA-MCGS packaging/conformance | Blocks native support, release and integrated mechanism claims. |
| Native Ubuntu x86-64 public package qualification | [CUDA-JS #4](https://github.com/iteathen/CUDA-JS/issues/4), then [#17](https://github.com/iteathen/CUDA-JS/issues/17) | Blocks native Linux claims. |
| Representative performance, soak and evidence methodology | [CUDA-JS #28](https://github.com/iteathen/CUDA-JS/issues/28) for generic runtime methodology; future CUDA-MCGS profile for search/evaluator workload | Retires all toy timing inference; later claims require new exact-profile evidence. |
| Device LTO tracker state | Accepted CUDA-JS SPEC-0012 is implemented/qualified at the frozen baseline, while [CUDA-JS #42](https://github.com/iteathen/CUDA-JS/issues/42) remains open with stale planned wording. | Tracker debt only. LTO remains optional and is not a CUDA-MCGS prerequisite. |
| Search-specific race/publication proof and representative scheduler selection | Future CUDA-MCGS engine-profile conformance under accepted contracts | Not a missing CUDA-JS semantic feature. Requires a frozen public pair after the relevant mechanisms exist. |

Every gap has a stop condition. None authorizes CUDA C++, PTX, a private CUDA-JS import, direct Driver/FFI access, or a subprocess native search implementation in CUDA-MCGS.

## 5. Public-contract replacement evidence

The deleted CUDA-MCGS capsules are replaced as follows:

| Retired local validation | Replacement evidence now | Evidence still required later |
|---|---|---|
| CUDA publication, graph, cycle and capacity cases | Accepted SPEC-0001 plus `experiments/search-ir-reference/` and the graph/policy/resource slices in `experiments/search-ir-composer-reference/` | Native equivalence on one exact public pair. |
| PTX manifest/order/deletion portable checker | SPEC-0005 plus CUDA-free Composer canonicalization, rejection and deletion cases | Public CUDA-JS program/artifact/resource identity for a selected profile; CUDA-MCGS never parses native bytes. |
| Local compile/link/load/error/cleanup cases | CUDA-JS public SPEC-0005, SPEC-0006, SPEC-0010, SPEC-0013 and SPEC-0016 contracts with F5/F6/F8 conformance at `2135216b...` | Exact CUDA-MCGS artifact/package pair under #32. |
| Direct CUDA atomic publication | CUDA-JS SPEC-0009/F9 public atomic-publication evidence; accepted SPEC-0014 for its distinct host-visible mailbox profile | CUDA-JS #123 for device-memory Device-JS release/acquire, then exact consumer qualification. |
| Toy emitted-code/timing comparisons | No current production replacement claim; only SPEC-0005's cost/accounting gates and CUDA-JS #28 methodology owner | Representative selected-profile artifacts, profiler/event evidence, workload and thresholds. |

Canonical CUDA-JS public evidence at the frozen revision is available through:

- [CUDA-JS specifications](https://github.com/iteathen/CUDA-JS/tree/2135216b1a9fd88066a1c82b61ae533645eac9c2/docs/specs);
- [F5 public execution conformance](https://github.com/iteathen/CUDA-JS/tree/2135216b1a9fd88066a1c82b61ae533645eac9c2/conformance/f5);
- [F6 public compiler/linker/RDC conformance](https://github.com/iteathen/CUDA-JS/tree/2135216b1a9fd88066a1c82b61ae533645eac9c2/conformance/f6);
- [F8 installed-package/public-facade conformance](https://github.com/iteathen/CUDA-JS/tree/2135216b1a9fd88066a1c82b61ae533645eac9c2/conformance/f8); and
- [F9 atomic-publication conformance](https://github.com/iteathen/CUDA-JS/tree/2135216b1a9fd88066a1c82b61ae533645eac9c2/conformance/f9).

These references replace CUDA-MCGS-owned native mechanism validation; they do not fabricate a compatible-pair result.

## 6. Cleanup inventory and acceptance

The cleanup removes:

- `experiments/cuda-device-mcgs-prototype/`;
- `experiments/ptx-extension-composition-prototype/`;
- `scripts/run-ptx-extension-prototype.mjs`;
- the PTX runner's required-file and execution entries in `scripts/verify-docs.sh`; and
- all active documentation/validation wording that presents either capsule as retained or executable evidence.

Acceptance requires zero tracked `.cu`, `.cuh` or `.ptx` files in CUDA-MCGS, no active runner/import/path to either deleted capsule, passing CUDA-free reference capsules, passing documentation/structure validation, and an archive record that cannot be mistaken for current authority.
