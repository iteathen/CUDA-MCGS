# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-27

## Current repository state

Protected `main` is currently:

`5a42d5aed072ae763631790ea4a4dfa871e3e6ce`

This is PR #138 / integrated Graph ROOT. Protected-main run `33108165300` passed all eight current jobs: verify, Windows/Ubuntu Search IR, Graph NODE, EDGE, REF, PATH and ROOT.

Graph ROOT is therefore **protected-main integrated**, not merely a hosted candidate. The former `ref/graph-root-01` integration gate is complete and that branch is no longer a live continuation target.

CUDA-MCGS remains a public pre-release universal GPU-resident MCGS framework project. No production universal runtime, public stable SDK, native CUDA-MCGS implementation, released compatible CUDA-JS pair or product release is accepted yet.

The portfolio-level continuation is tracked by issue #142. Repository authority/integration repair is intentionally ahead of additional semantic implementation: #139 is the next governance gate, followed by #44 product-boundary reconciliation. The semantic `ENGINE-REFERENCE-01` path remains issue #36 with Graph owned by #24.

## Architectural boundary

Accepted architecture remains governed by ADR-0018/0019/0020/0022/0023 pending the explicit product-boundary reconciliation tracked by #44:

- CUDA-MCGS owns product-neutral MCGS semantics, normalized composition, finite search resources, ordinary Node.js host lifecycle and restricted Device-JS search/domain/capability programs.
- CUDA-JS owns generic CUDA lowering, compiler/ABI/runtime/resource/operation/synchronization/platform mechanisms and may use native/CUDA implementation behind public contracts.
- An apparent need for native code in CUDA-MCGS is a library-coverage diagnostic, not permission for a local escape path.
- Active search remains device-owned after ignition; no host read-decide-write/relaunch loop may advance it.
- The first usable native engine must perform bounded useful parallel GPU work; a serial GPU loop is diagnostic only.
- Universal semantics remain scheduler-neutral. Physical grid/block/warp/queue/kernel topology is profile-owned and evidence-selected.

Root authority is deliberately separated:

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

## ROOT-specific result

ROOT consumes the already-normalized Session root-control packet; it does not recreate Session authority.

Graph ROOT owns only:

- finite root-anchor storage/lifecycle;
- REF-mediated node protection/generation;
- root-anchor publication/release; and
- opaque owner reroot-disposition delegation.

Session/semantic owners retain current-root selection, root epoch, operation choice, retained-state classification and authority commit.

ROOT falsification closed three Graph representation gaps:

1. root-anchor storage has explicit finite resource funding;
2. aggregate `protection-capacity` slots cover protection-record plus root-anchor storage;
3. root-anchor/protection-record terminal states reset privately to `free` before generation-safe reuse.

ROOT also proves that authority change does not itself establish reclamation safety: old work may retain an independent protection, and one superseded occurrence cannot invalidate a still-valid shared transposed node.

## Current critical path

Issue #142 governs portfolio ordering without replacing semantic owners.

Immediate sequence:

1. complete #139 so the protected `verify` context fails closed when any required owner-local semantic/reference job fails;
2. complete #44 and reassess #47 so production-product ownership is unambiguous before further framework work accumulates;
3. return to #24 / `REF-GRAPH-01` only after the RECLAIM preflight representation gaps are corrected;
4. then implement and qualify `GRAPH-RECLAIM-001..009` plus remaining ADR-0022 occurrence-supersession/lifecycle closure;
5. continue issue #36 owner-by-owner toward #122 atomic semantic acceptance.

The RECLAIM preflight has already found that the reclaiming profile declares retirement-record storage and `maxScratchBytes` without corresponding finite storage/scratch resource contributions, and that the retirement-record lifecycle lacks explicit generation-safe reuse. These are representation blockers to truthful RECLAIM evidence; they are not permission to select a native reclamation algorithm.

Production lowering and `ENGINE-CONTRACT-ACCEPTANCE-01` remain blocked until the complete behavioral/reference packet is integrated on one exact protected revision.

## CUDA-JS / downstream boundaries

CUDA-JS exact compatible-pair/native Linux qualification remains downstream. Current generic mechanisms being available does not itself qualify a CUDA-MCGS pair.

CUDA-JS-Tensor is an optional evaluator mechanism, not universal MCGS semantics. Real-model Tensor sufficiency remains a downstream consumer qualification.

The exact production-product repository boundary is being reconciled under #44. Until that accepted authority is integrated, do not use the older repository-local product wording as implementation authorization.

## Claim limits / blockers

- ROOT is protected-main integrated and its readback is green.
- `GRAPH-RECLAIM-*` and remaining Graph lifecycle closure are unfinished; the RECLAIM representation preflight has unresolved finite-resource/lifecycle gaps.
- Policy/Evaluator/Resource/Progress/Output and terminal integration leaves remain after Graph.
- #139 merge enforcement and #44 product-boundary authority are portfolio-priority governance repairs.
- no production universal engine is accepted;
- no native Linux compatible pair is qualified;
- no performance, public SDK or release claim follows from the CUDA-free reference packet.

## Cleanup / handoff

[`docs/handoffs/2026-08-27-graph-root-01-resume.md`](docs/handoffs/2026-08-27-graph-root-01-resume.md) is historical and superseded as a live resume point because ROOT is merged. The portfolio continuation is issue #142; Graph semantics remain issue #24 / #36.

Remote recovery ref `checkpoint/graph-path-01-handoff@a697ea8bf54e1db2a50f3466e0e69c8ea25fb02f` remains bounded cleanup debt because the available connector exposes no safe delete-ref operation. Its handoff content is already preserved on protected main and no open PR depends on it.
