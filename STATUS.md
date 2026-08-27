# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-27

## Current repository state

Protected `main` is currently:

`e4069458ece47bbea0c2770204fa21fffbde6bb6`

This is PR #137 / integrated Graph PATH. Protected-main run `33103891049` passed verify, Windows/Ubuntu Search IR, Graph NODE, EDGE, REF and PATH.

Current active work is the next bounded `REF-GRAPH-01` owner brick, `GRAPH-ROOT-001..006`, on `ref/graph-root-01`. ROOT is hosted-qualified but **not yet protected-main integrated**. Its durable semantic checkpoint is `d6b091e7c1afc6c09eb7e562cd7f72eb2773874d`; hosted qualification run `33107176873` passed the complete Composer → Domain → NODE → EDGE → REF → PATH → ROOT chain and repository verification, then self-removed its temporary migration tooling.

CUDA-MCGS remains a public pre-release universal GPU-resident MCGS framework project. No production universal runtime, public stable SDK, native CUDA-MCGS implementation, released compatible CUDA-JS pair or product release is accepted yet.

## Architectural boundary

Accepted architecture remains governed by ADR-0018/0019/0020/0022/0023:

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

## Current CUDA-free reference packet

The current ROOT candidate rebinds proposal-derived evidence to:

- Composer `879/879`, representation/composition `ca5119c2d50e6ba218ab962ede9ad94d8c90f1d031b008ab74d92166d0ef4529`;
- Domain `49/49`, direct `47/47`, evidence `f186412a9b8d964c7f92e4c4000942768fa0ae81d62349c2528fd3aba12aa5e7`;
- Graph projection `89ee04a47d8516ad02e33e884d8f35db9573840f58db140c6cbafe79178e7fd7`;
- NODE `13/13`, direct `11/11`, evidence `4299dccecd33f6ef38c50f144e84316d00c7046a81ed6206b6e2e645b6683f74`;
- EDGE `16/16`, direct `10/10`, evidence `54b83935d320e6bd656c740ec2f3d8be062e3932bdf6e748c8315f26245faf58`;
- REF `14/14`, direct `8/8`, evidence `e3370158d1234dd3642d11c4458c9c390abcc3f62a04a75dd68d00faf6c4676d`;
- PATH `14/14`, direct `8/8`, evidence `af8f140e45f7c2942ec4b09b7d752f49b3eeb28f1cdc5b8c3b74887d34dd4318`;
- generated root-control projection `2c71df25fff213f515aae02a01e210292a8e9b76fc84e14ab6cafb251fbbc9f1`;
- ROOT `14/14`, direct `6/6`, evidence `7e4fe6bf748ec110bebc1798d7742e03b89909df84da709f2fdeb51a42311ed0`.

See [`experiments/search-semantics-reference/RESULTS.md`](experiments/search-semantics-reference/RESULTS.md) for the exact candidate identities and claim limits.

## ROOT-specific result

ROOT consumes the already-normalized Session root-control packet; it does not recreate Session authority.

Graph ROOT owns only:

- finite root-anchor storage/lifecycle;
- REF-mediated node protection/generation;
- root-anchor publication/release; and
- opaque owner reroot-disposition delegation.

Session/semantic owners retain current-root selection, root epoch, operation choice, retained-state classification and authority commit.

ROOT falsification closed three Graph representation gaps:

1. root-anchor storage now has explicit finite resource funding;
2. aggregate `protection-capacity` slots cover protection-record plus root-anchor storage;
3. root-anchor/protection-record terminal states explicitly reset privately to `free` before generation-safe reuse.

ROOT also proves that authority change does not itself establish reclamation safety: old work may retain an independent protection, and one superseded occurrence cannot invalidate a still-valid shared transposed node.

## Current critical path

Current focus remains `ENGINE-REFERENCE-01` / issue #36, with Graph owned by issue #24.

Immediate sequence:

1. freeze the final documentation-bearing `ref/graph-root-01` head;
2. open the ROOT PR against current protected `main`;
3. require ordinary exact-head CI: verify, Windows/Ubuntu Search IR, NODE, EDGE, REF, PATH and ROOT;
4. complete exact-head author review and owner authorization without mislabeling it independent review;
5. guarded squash merge using the expected head SHA;
6. require protected-main ROOT readback on the squash SHA;
7. add the protected ROOT checkpoint to issue #24;
8. only then dependency-review and begin `GRAPH-RECLAIM-001..009` plus remaining ADR-0022 occurrence-supersession/lifecycle closure.

Production lowering and `ENGINE-CONTRACT-ACCEPTANCE-01` remain blocked until the complete behavioral/reference packet is integrated on one exact protected revision.

## CUDA-JS / downstream boundaries

CUDA-JS exact compatible-pair/native Linux qualification remains downstream. Current generic mechanisms being available does not itself qualify a CUDA-MCGS pair.

CUDA-JS-Tensor is an optional evaluator mechanism, not universal MCGS semantics. Real-model Tensor sufficiency remains a downstream consumer qualification with UCI Arena Vector.

Production chess/UCI/Book Forge/Timing Evidence/tablebase semantics belong in `iteathen/UCI-Arena-Vector` and other owning UCI Arena repositories, not CUDA-MCGS.

## Claim limits / blockers

- ROOT is hosted-qualified but not yet protected-main integrated.
- `GRAPH-RECLAIM-*` and remaining Graph lifecycle closure are unfinished.
- Policy/Evaluator/Resource/Progress/Output and terminal integration leaves remain after Graph.
- no production universal engine is accepted;
- no native Linux compatible pair is qualified;
- no performance, public SDK or release claim follows from the CUDA-free reference packet.

## Cleanup / handoff

The sole live handoff for current work is [`docs/handoffs/2026-08-27-graph-root-01-resume.md`](docs/handoffs/2026-08-27-graph-root-01-resume.md). The PATH handoff is explicitly `Superseded`.

Remote recovery ref `checkpoint/graph-path-01-handoff@a697ea8bf54e1db2a50f3466e0e69c8ea25fb02f` remains bounded cleanup debt because the available connector exposes no safe delete-ref operation. Its handoff content is already preserved on protected main and no open PR depends on it.
