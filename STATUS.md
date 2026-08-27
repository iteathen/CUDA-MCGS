# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-27

## Current repository state

Protected `main` is currently:

`ee4434be0ae927c4ae1d5c106f91503d28b1aa01`

This includes PR #138 / integrated Graph ROOT, PR #144 / fail-closed merge-gate aggregation, and PR #145 / post-merge state reconciliation. Protected-main workflow `33115975009` passed under the aggregate `verify` gate.

The underlying protected Graph ROOT semantic packet remains the PR #138 packet first integrated at `5a42d5aed072ae763631790ea4a4dfa871e3e6ce`; later governance changes did not alter its semantic evidence.

CUDA-MCGS remains a public pre-release universal GPU-resident MCGS framework project. No production universal runtime, public stable SDK, native CUDA-MCGS implementation, released compatible CUDA-JS pair or downstream product release is accepted yet.

The portfolio-level continuation is tracked by issue #142. Current branch work is the #44 authority correction on `architecture/44-framework-only-production`: accepted-candidate ADR-0024 narrows ADR-0018 to framework-only production ownership, removes active repository-local product specifications, archives CHESS-0001 provenance, and structurally enforces that boundary. This is not protected authority until its PR merges and protected-main readback succeeds.

## Architectural boundary

Protected authority currently includes ADR-0018/0019/0020/0022/0023. The #44 candidate adds ADR-0024 without rewriting accepted ADR-0018 history.

Candidate ADR-0024 establishes:

- CUDA-MCGS production owns product-neutral MCGS semantics, normalized composition, finite search resources, ordinary Node.js host lifecycle, restricted Device-JS framework/search programs, public integration seams, and removable universal conformance evidence.
- Production domain/search products own their product semantics, protocol, model interpretation, quality, packaging, release and support lifecycle in independently owned repositories or packages.
- Concrete chess, Connect Four, planning, optimization or other named instances remain allowed as removable examples/research/conformance falsifiers; naming a consumer does not grant it framework authority.
- CUDA-JS owns generic CUDA lowering, compiler/ABI/runtime/resource/operation/synchronization/platform mechanisms and may use native/CUDA implementation behind public contracts.
- An apparent need for native code in CUDA-MCGS or an external product is a library-coverage diagnostic, not permission for a local escape path.
- Active search remains device-owned after ignition; no host read-decide-write/relaunch loop may advance it.
- The first usable native engine must perform bounded useful parallel GPU work; a serial GPU loop is diagnostic only.

Root authority remains deliberately separated:

- `root` establishes initial authority;
- `advance` moves to an already-ready realized successor using existing resources only, with no graph traversal/state copy/transform/reset/resize/reclassification/reclamation/eager cleanup;
- `reroot` owns general authority replacement, protected pre-mutation admission and owner-declared retained-state reconciliation;
- `attention` has no root-authority, Graph-work or reclamation effect.

## Protected CUDA-free reference packet

The protected ROOT integration is bound to:

- Composer `879/879`, representation/composition `ca5119c2d50e6ba218ab962ede9ad94d8c90f1d031b008ab74d92166d0ef4529`;
- Domain `49/49`, direct `47/47`, evidence `f186412a9b8d964c7f92e4c4000942768fa0ae81d62349c2528fd3aba12aa5e7`;
- Graph projection `89ee04a47d8516ad02e33e884d8f35db9573840f58db140c6cbafe79178e7fd7`;
- NODE `13/13`, direct `11/11`, evidence `4299dccecd33f6ef38c50f144e84316d00c7046a81ed6206b6e2e645b6683f74`;
- EDGE `16/16`, direct `10/10`, evidence `54b83935d320e6bd656c740ec2f3d8be062e3932bdf6e748c8315f26245faf58`;
- REF `14/14`, direct `8/8`, evidence `e3370158d1234dd3642d11c4458c9c390abcc3f62a04a75dd68d00faf6c4676d`;
- PATH `14/14`, direct `8/8`, evidence `af8f140e45f7c2942ec4b09b7d752f49b3eeb28f1cdc5b8c3b74887d34dd4318`;
- generated root-control projection `2c71df25fff213f515aae02a01e210292a8e9b76fc84e14ab6cafb251fbbc9f1`;
- ROOT `14/14`, direct `6/6`, evidence `7e4fe6bf748ec110bebc1798d7742e03b89909df84da709f2fdeb51a42311ed0`.

See [`experiments/search-semantics-reference/RESULTS.md`](experiments/search-semantics-reference/RESULTS.md) for the exact identities and claim limits.

## Merge enforcement

PR #144 preserves every owner-local CI job as an independently diagnosable LEGO and makes the stable branch-protected `verify` context an aggregate verdict over all current merge-gate jobs.

Falsifier run `33115416321` deliberately failed Graph ROOT on a temporary branch head and proved final `verify` also failed while unrelated jobs remained independently visible. The temporary mutation was restored before merge; final PR run `33115492658` and protected run `33115610091` were green.

Adding a new required semantic/reference lane requires adding it to the aggregate dependency/result set in the same coherent change.

## Current critical path

Issue #142 governs portfolio ordering without replacing semantic owners.

Immediate sequence:

1. qualify the #44 framework-only ownership candidate on one exact PR head and protected-main readback;
2. disposition stale competing PRs #126/#132 without deleting unique research evidence;
3. reassess #47 against protected ADR-0024 and close it `not planned` if the requested in-repository Connect Four product remains invalid, preserving only useful removable conformance intent under #36;
4. close the bounded sanity record #141 once every finding has durable owner/disposition;
5. return to #24 / `REF-GRAPH-01`, correct/falsify the RECLAIM representation gaps, then implement `GRAPH-RECLAIM-001..009` and remaining occurrence/lifecycle closure;
6. continue issue #36 owner-by-owner toward #122 atomic semantic acceptance.

The RECLAIM preflight has already found that the reclaiming profile declares retirement-record storage and `maxScratchBytes` without corresponding finite storage/scratch resource contributions, and that the retirement-record lifecycle lacks explicit generation-safe reuse. These are representation blockers to truthful RECLAIM evidence; they are not permission to select a native reclamation algorithm.

Production lowering and `ENGINE-CONTRACT-ACCEPTANCE-01` remain blocked until the complete behavioral/reference packet is integrated on one exact protected revision.

## Claim limits / blockers

- ROOT is protected-main integrated and its readback is green.
- required `verify` is fail-closed over every current merge-gate job.
- ADR-0024 and the framework-only product boundary are branch candidate authority until protected integration; do not cite them as protected yet.
- `GRAPH-RECLAIM-*` and remaining Graph lifecycle closure are unfinished; the RECLAIM representation preflight has unresolved finite-resource/lifecycle gaps.
- Policy/Evaluator/Resource/Progress/Output and terminal integration leaves remain after Graph.
- no production universal engine is accepted;
- no native Linux compatible pair is qualified;
- no performance, public SDK or release claim follows from the CUDA-free reference packet.

## Cleanup / handoff

The portfolio continuation is issue #142; Graph semantics remain issue #24 / #36. The historical ROOT handoff is superseded.

Remote recovery ref `checkpoint/graph-path-01-handoff@a697ea8bf54e1db2a50f3466e0e69c8ea25fb02f` remains bounded cleanup debt because the available connector exposes no safe delete-ref operation. Its handoff content is already preserved on protected main and no open PR depends on it.

PR #126 and PR #132 are pre-existing stale/unmergeable authority candidates. #44 owns their reassessment/disposition; neither may be merged as a shortcut around current protected authority.
