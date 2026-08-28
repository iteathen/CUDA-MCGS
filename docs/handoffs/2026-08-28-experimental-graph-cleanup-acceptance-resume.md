# CUDA-MCGS experimental Graph cleanup/acceptance handoff — 2026-08-28

## Stop point

Stop after PR #149 is fully qualified, squash-merged into the isolated experimental integration line, read back, and checkpointed on issues #24 and #36; stop before changing any Graph cleanup semantics.

The next work branch already exists:

`ref/graph-cleanup-acceptance-01`

It was created from the exact integrated experimental revision:

`experimental/portfolio@422fe99bf51c1f48cda480a6a6d98f641fb2599d`

At this handoff boundary, **no Graph cleanup semantic/source change has been made on `ref/graph-cleanup-acceptance-01`**. This handoff/state reconciliation is the only new work on that branch.

Protected `main` remains intentionally untouched:

`main@ee4434be0ae927c4ae1d5c106f91503d28b1aa01`

Do not promote experimental evidence to protected-main support, release, native, or compatible-pair authority.

## Experimental portfolio integrated state

The isolated experimental line now contains:

- PR #146 / issue #44 — framework-only production ownership correction;
- issue #47 — closed **not planned** after its product-local premise was decomposed into existing universal owners;
- PR #147 / issue #24 — finite Graph RECLAIM representation/resource/lifecycle preflight;
- PR #148 / issues #24/#36 — `GRAPH-RECLAIM-001..009` semantic/reference owner;
- PR #149 / issues #24/#36 — ADR-0022 advance-occurrence lifetime closure plus REF retirement-order correction.

PR #149 final author head:

`2175592e164b9eb9770225ef2808e405a52af4fa`

Final full PR workflow:

`33148044466`

Every ordinary merge-gate lane passed on that exact author head:

- Governance verification;
- Search IR Ubuntu;
- Search IR Windows;
- Graph NODE;
- Graph EDGE;
- Graph REF;
- Graph PATH;
- Graph ROOT;
- Graph RECLAIM;
- Graph ADVANCE occurrence closure;
- aggregate `verify`.

PR #149 squash integration commit:

`422fe99bf51c1f48cda480a6a6d98f641fb2599d`

Readback after merge proved:

- `experimental/portfolio == 422fe99bf51c1f48cda480a6a6d98f641fb2599d`;
- `main == ee4434be0ae927c4ae1d5c106f91503d28b1aa01`.

## Exact experimental evidence packet after #149

- Composer: `881/881`;
- requirements: `989/989` classified, `0` pending at catalog classification level;
- representation/composition: `2e2cde00d9e1eac864541cd7bd5d4d43873cfb20bfb2304aa0bc5c2647bce1af`;
- Domain: `49/49`, direct `47/47`, evidence `10d188344e91c077fa47be192e5fec0f1310cc193ca180e3a9493fd8395ec51c`;
- Graph projection: `72d91b75336a2745830a3c0d8d7d7d3ed26259ea2f56b619f9de311c82d21068`;
- NODE `13/13`: `103cd77904f0c1f5650fe52e7884b8a791615a17d340e13f4b5184d262a126df`;
- EDGE `16/16`: `96ce6c83125566ffec250e825b09ed66ab9050c6f091ee178d789aa5d0fdc127`;
- REF `14/14`: `def51477f25c40d11f5f61fbf928264753a95d3979397e573f389f91cd02808b`;
- PATH `14/14`: `74e05276492db9f928a83bbca0739ebec4b5d0d9bc7564b3a6510ca243134a4b`;
- root-control: `be35ed803ea82498950c454acb6955087543c2a7a974745077c4c53158bca475`;
- ROOT `14/14`: `5b1cfb36d9b743a65ee0233964c254a56296ae5be82b84fb358db98387a16bdd`;
- RECLAIM `17/17`: `a010c88de1bb97ec0ea83a08fe0e2ef608c047ed4412c01e8f68b942eb572058`;
- ADVANCE occurrence closure `5/5`: `c67014dac6396221b121dd35b0bb51626bac12d116e5e534c310b1a7809754a3`, canonical bytes `4195`.

Ordinary #149 closure artifact:

- artifact ID `9676453116`;
- ZIP SHA-256 `957445e8d6337d3e9294785c0d4e70036a51b8ba0c193504bbad3f5b1c8d1933`.

## Important semantic correction integrated by #149

The composed REF/RECLAIM audit found that the prior REF oracle could report retirement blocked by an existing protection while still permitting a later protection before a second retirement attempt. That violated the intended composition of `GRAPH-REF-008` and `GRAPH-RECLAIM-003`.

The integrated semantic correction distinguishes a private retirement ordering intent from the publicly passed retirement barrier:

1. the first retirement attempt establishes retirement ordering intent even if old protections are held;
2. existing holders remain valid and drain normally;
3. new protections fail while that intent is active;
4. the public retirement barrier remains unpassed until holders reach zero;
5. after holders drain, retirement may pass normally.

This is semantic/reference meaning only. It selects no native atomic, fence, lock, table, queue, traversal algorithm, scheduler topology, warp/block topology, CUDA data structure, or CUDA-JS-private mechanism.

The five-case ADVANCE occurrence closure then proved minimum-work advance, lazy sibling occurrence supersession, selected-descendant preservation, shared-transposed-node preservation, retained-borrow quiescence gating, and generation-safe reuse across the existing Session/PATH/ROOT/REF/RECLAIM contracts.

## Graph owner closure audit — next seam

Do **not** close issue #24 yet merely because NODE/EDGE/REF/PATH/ROOT/RECLAIM and the ADR-0022 occurrence closure are integrated.

The structured requirement-coverage map still routes Graph requirement families differently:

- `GRAPH-LIFE-*` — primary disposition `native-compatible-pair-qualification`, with semantic/reference support but native evidence deferred to `ENGINE-NATIVE-01`;
- `GRAPH-RESOURCE-*` — primary disposition `deterministic-composition`, owned by `IR-RESOURCE-01`, not by the Graph semantic owner alone;
- `GRAPH-CLEANUP-*` — primary disposition `engine-reference-oracle`, currently still recorded as `evidenceStatus: pending`;
- `GRAPH-SEC-*`, `GRAPH-COMPAT-*`, profile/reference families — already have normalized/deletion/native-deferred routing and must not be relabeled casually.

The next bounded experimental leaf should therefore be **Graph cleanup/reference reconciliation**, not another reclamation mechanism or algorithm.

## First falsifier to resolve next

During the cleanup audit, inspect `GRAPH-CLEANUP-002` before writing a broad cleanup wrapper.

Normative requirement:

> A publication conflict, equality inconsistency, generation alias or uncertain owner cleanup quarantines affected objects/arena and invalidates dependent evidence. Recovery cannot continue by guessing which payload/reference is authoritative.

Current NODE case `graph-node-conflicting-ready-publication-is-fatal` already detects a conflicting re-publication attempt, but the existing case also asserts that the previously ready node remains observable after the conflict.

This is a **candidate semantic gap requiring verification**, not yet a confirmed defect at the handoff boundary.

Next session should inspect the exact `publishNode` conflict path in `experiments/search-semantics-reference/src/graph-node.mjs` and answer:

1. Does the thrown fatal conflict also quarantine the affected claim/node/arena in a way that makes further semantic use impossible?
2. Does it invalidate dependent evidence/state as `GRAPH-CLEANUP-002` requires?
3. If not, what is the smallest owner-local semantic correction that preserves one-authority Graph meaning without inventing a native mechanism?
4. Which downstream evidence identities are invalidated if NODE cleanup meaning changes?

Do not change the requirement or weaken the case merely to keep existing evidence identities.

## Expected next leaf if the falsifier confirms a gap

Stay on `ref/graph-cleanup-acceptance-01` and keep the scope to Graph cleanup/reference acceptance:

- correct only confirmed owner-local cleanup semantics;
- add direct evidence for `GRAPH-CLEANUP-001..004` where not already discharged by existing owner cases;
- reuse NODE/EDGE/PATH/RECLAIM evidence instead of building a monolithic second Graph model;
- prove aggregate cleanup/reconciliation where the requirement is cross-object/arena-wide;
- update structured coverage from `GRAPH-CLEANUP-* = pending` to the strongest truthful existing vocabulary (normally `partial` with exact `case:` refs), leaving native teardown portions deferred;
- keep `GRAPH-RESOURCE-*` with `IR-RESOURCE-01` and `GRAPH-LIFE-*` native qualification with `ENGINE-NATIVE-01`;
- add any new required cleanup integration falsifier as a peer fail-closed CI job in the same coherent change;
- only after Graph cleanup/reference closure, reassess whether issue #24 can hand off remaining native/resource obligations and close semantically.

## Ownership / non-goals

Preserve these boundaries:

- CUDA-MCGS Graph owns reusable product-neutral graph/storage/reference/lifetime/cleanup semantics.
- Session owns current-root, root-epoch, advance, reroot, attention and supersession reason/classification.
- Resource owns composed admission/watermark/pressure policy.
- Progress owns scheduling/fairness/device-progress policy.
- CUDA-JS owns generic CUDA/native primitives and concrete realization mechanisms.
- CUDA-JS-Tensor owns generic tensor math, not Graph lifetime semantics.
- Production chess/UCI/Book Forge/Timing Evidence/tablebase behavior stays downstream in the engine/product repositories.

No native CUDA-MCGS code. No C/C++, CUDA C++, native addon/FFI, embedded CUDA, hand-written PTX, private/deep CUDA-JS access, or Python.

If the cleanup semantics require a naturally generic GPU primitive that public CUDA-JS cannot express with bounded lifecycle/resources, stop and classify a CUDA-JS capability gap rather than implementing local native glue.

## Validation / merge discipline for the next session

For any material change:

1. run/require the owner-local reference capsule first;
2. rebind frozen downstream evidence only when the owning semantic identity genuinely changes;
3. run the complete ordinary PR workflow;
4. require Governance, both Search IR platforms, NODE/EDGE/REF/PATH/ROOT/RECLAIM/ADVANCE occurrence plus any new cleanup peer lane and aggregate `verify` all green on the exact final author head;
5. author-review that exact head;
6. merge only into `experimental/portfolio` with an expected-head fence;
7. read back both `experimental/portfolio` and protected `main`;
8. checkpoint issues #24/#36/#142 and reconcile `STATUS.md`/`next_step.yaml`.

Do not mutate protected `main` while the experimental portfolio is active.

## Coordination / residue

- issue #24 — Graph semantic owner;
- issue #36 — `ENGINE-REFERENCE-01` integration tracker;
- issue #122 — later atomic `ENGINE-CONTRACT-ACCEPTANCE-01` gate; do not start it until #36 can hand off one exact reference revision;
- issue #142 — experimental portfolio coordination;
- stale PRs #126/#132 remain separate product-boundary cleanup/disposition debt under issue #44 and are not current authority;
- `checkpoint/graph-path-01-handoff@a697ea8bf54e1db2a50f3466e0e69c8ea25fb02f` remains bounded remote cleanup debt because no safe delete-ref action has been available; its handoff is preserved.

## Resume command in plain language

Resume from `ref/graph-cleanup-acceptance-01` at the handoff commit. Verify the branch is still based on `experimental/portfolio@422fe99bf51c1f48cda480a6a6d98f641fb2599d` and that protected `main` is still `ee4434be0ae927c4ae1d5c106f91503d28b1aa01`. Inspect the NODE conflicting-publication path against `GRAPH-CLEANUP-002` before changing semantics. If the gap is real, fix the smallest Graph-owned cleanup meaning, add exact cleanup evidence/coverage, qualify it through the full fail-closed gate, and merge only back into the experimental portfolio.