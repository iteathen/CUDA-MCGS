# CUDA-MCGS handoff — Graph PATH semantic brick

**Status:** Informational

**Date:** 2026-08-27

## Stop point

Stop after the Graph REF brick is integrated and protected-main qualified, and after the prerequisite finite PATH-resource correction is durably published on the next focus branch. The `GRAPH-PATH-*` behavioral oracle itself has **not** been implemented yet.

This is a clean LEGO seam: REF now provides the typed-reference/protection semantics PATH must consume, and the normalized Graph profile now explicitly funds active-path and occurrence storage before PATH behavior is allowed to claim conformance.

## Protected-main checkpoint

Protected `main` is:

`f6bdad70bf3d13ccccae71ddb64c800030cf1aaf`

This is squash merge PR #136, `Add Graph typed-reference and protection semantic reference`.

Protected-main Actions run `33089710014` passed all six permanent jobs:

- `verify`
- `Search IR reference (windows-latest)`
- `Search IR reference (ubuntu-latest)`
- `Graph NODE reference`
- `Graph EDGE reference`
- `Graph REF reference`

Protected-main REF evidence reproduced exactly:

- Composer representation/composition: `1b3173a128215b6fffc68c68a162708aec7f7bdc93e3e4ac7e26648abec39a24`
- Graph projection: `5e4729d33e917ccdcdc45e942fbe610348cdc448361fa9dd3786da9c55e3d85f`
- NODE evidence: `cb9c9382fe898421e1730881057f5d75c7c9e1085001d0026562e050bd8ebbbc`
- REF: `14/14`, direct `GRAPH-REF-*` coverage `8/8`
- REF evidence: `2c4fac58ef2a7678b5417579c2d05210910596fd57adf9be30ef2f36d0266456`
- REF canonical bytes: `9139`

Issue #24 has a protected-main checkpoint comment recording the completed REF brick.

## Active branch

Branch:

`ref/graph-path-01`

The branch was created directly from protected `main@f6bdad70bf3d13ccccae71ddb64c800030cf1aaf`.

The durable pre-handoff implementation commit is:

`c5c322cfc7c0aaafd8cfd301079dca40c6a493c2`

Commit message:

`ref: declare finite Graph PATH resources`

The handoff document commit is intentionally docs-only on top of that implementation checkpoint.

## What was completed on the PATH branch

Author preflight found a real Graph-profile closure gap before writing the PATH oracle:

- `path.maxPaths` is finite (`256`);
- the active-path layout is finite (`256` records);
- the path-occurrence layout/depth is finite (`4096`);
- but the normalized Graph resource contribution did not explicitly fund active-path slots.

That gap is now corrected in the Graph-owned profile/reference layer rather than hidden in the PATH test.

The profile now explicitly contributes and validates:

1. active-path slots with existing typed pressure `path-capacity`;
2. path-occurrence records with existing typed pressure `path-capacity`;
3. per-invocation depth records with existing typed pressure `path-depth`.

The Graph normalizer now requires:

- active-path resource capacity >= active-path layout capacity;
- active-path resource capacity >= `path.maxPaths`;
- path-occurrence resource capacity >= occurrence layout capacity;
- per-invocation depth capacity >= `path.maxDepth`.

The existing `reject-graph-path-capacity` Composer case was extended rather than adding bookkeeping-only test count. Composer therefore remains `879/879`.

No new product-specific failure vocabulary, allocation mechanism, CUDA/native code, host-progress loop, PATH policy decision, root authority or reclamation behavior was introduced.

## PATH-resource qualification

Temporary hosted migration workflow/run:

`33090420700`

It completed both qualification and cleanup/publish successfully. The temporary workflow and migration script self-deleted before the durable commit.

The migration ran the full dependency/evidence chain and repository verification before pushing.

Current PATH-branch proposal/evidence identities after the finite PATH-resource correction:

- framework selection: `8aa4f4ab3d548aec3f558e25b8928f375ff7f8366b4d4bec1e8f20b1ad57dc79`
- Composer representation/composition: `be526141e2846a3307f8935184e39e44710dafcd8d8369441232b61907c64e12`
- Domain projection: `f0cfa4d4a52995452a5b3b618cb9c8739aaec02f6dcd70b1fbfabd7e2864e815`
- harness/Domain evidence: `ae488fa9730a41ec0b04985d92a75296f3558d7ee696b4b66a4e2bf411c59713`
- Graph projection: `dc1c6333574f17d657834739c8c8b0ea29999c3ef4427a871a10e1842abbabda`
- NODE evidence: `8096fba050f10a56b7d02973d84a868f6ba2bb9a8f17cbb7afed030397c4b559`
- EDGE evidence: `72d3cb47db7aff8c15653df807a3a33c722c69ba671114fea6ede35dd734453b`
- REF evidence: `96b55fd85be6d5a6bd3c916454f1b76607b8d88940f79c094736b71c2245f281`

Stable upstream semantic counts remain:

- Composer `879/879`
- harness/Domain `49/49`, direct Domain coverage `47/47`
- NODE `13/13`, direct `GRAPH-NODE-*` coverage `11/11`
- EDGE `16/16`, direct `GRAPH-EDGE-*` coverage `10/10`
- REF `14/14`, direct `GRAPH-REF-*` coverage `8/8`

## Exact PATH scope to implement next

Only `GRAPH-PATH-001` through `GRAPH-PATH-008` from SPEC-0010:

- typed active-path reference/incarnation and finite lifecycle;
- append validates node/edge references, reserves path capacity, stores only declared owner-local regions and establishes protection before occurrence visibility;
- repeated occurrence of one node remains representable and does not imply cycle policy;
- child identity/node resolution precedes bounded path-relation classification;
- Graph owns bounds/references/publication/protection/ordered occurrence access but does not interpret Domain history or Policy-local bytes;
- path depth/capacity pressure is typed and occurs before partial/out-of-bounds publication;
- close/abandon dispositions owner-local reservations, releases protections exactly once and publishes terminal state before reuse;
- self-loop, directed cycle, DAG transposition, stochastic parallel transition and history-distinct equal-base-state topology are all representable without changing ownership.

## Recommended PATH oracle shape

Keep the PATH module Graph-local and consume existing upstream semantics through neutral injected ports/callbacks.

Recommended dependencies:

- `validateReference(...)` — consume REF semantics; do not duplicate reference validation;
- `acquireProtection(...)` / `releaseProtection(...)` — consume REF protection ordering; do not create a second protection mechanism;
- `classifyPathRelation(...)` — injected Domain public relation port;
- optional owner-local occurrence lifecycle callback for declared Domain-history / Policy-local regions, opaque to Graph.

PATH must not import private Domain or Policy implementation. Prefer injected public operations over importing another owner oracle directly where doing so would couple internals.

Suggested bounded case bank should cover at minimum:

1. exact Composer/Graph/NODE/REF evidence binding;
2. active-path open/reference lifecycle and generation-safe reuse;
3. append validates node and edge before any path-visible write;
4. append establishes protection before occurrence publication and rolls back exactly on failure;
5. repeated same-node occurrence is allowed structurally;
6. child identity/reference is resolved before `classifyPathRelation` sees the bounded path view;
7. Graph never interprets opaque history/policy-local bytes;
8. active-path capacity failure has no partial path publication;
9. depth failure has no partial occurrence publication;
10. close/abandon releases every occurrence protection exactly once before reusable generation;
11. topology matrix: self-loop, directed cycle, DAG transposition, stochastic parallel transition, history-distinct equal-base state;
12. mutation falsifier for relation-before-identity;
13. mutation falsifier for occurrence-visible-before-protection;
14. exact direct coverage assertion for all 8 `GRAPH-PATH-*` requirements.

The exact case count is not normative; keep it bounded and evidence-driven.

## Evidence/documentation note

The checked-in semantic README/RESULTS may still describe the pre-PATH-resource proposal hashes until the PATH behavioral capsule is stable. Do not preserve stale hashes merely to avoid rebinding. Once PATH semantics stabilize, regenerate/rebind the retained evidence packet and update the docs in the same bounded PR before merge.

## Merge/CI plan for PATH

After the oracle exists:

1. add `graph-path-cases.json`, PATH core/oracle/cases, runner and repository entrypoint;
2. require exact current Composer + Graph projection + REF evidence before PATH runs;
3. run the PATH capsule on hosted Ubuntu CI;
4. add a permanent `Graph PATH reference` job to `docs.yml` only after the slice is stable;
5. retain the PATH evidence artifact;
6. update README/RESULTS and PR body with exact immutable identities;
7. run final exact-head ordinary CI including Windows/Ubuntu Search IR and all Graph owner jobs;
8. author-review for owner leakage, hidden storage, duplicate REF semantics, PATH deciding Policy behavior, root/reclaim creep, native/CUDA leakage and accidental width limits;
9. merge only with exact head pinned;
10. read back protected-main evidence before marking the PATH sub-brick complete on issue #24.

## Do not

- do not start ROOT or RECLAIM behavior in this slice;
- do not make PATH decide cycle/repetition cut/continue/backup semantics;
- do not inspect Domain history bytes or Policy-local record layout;
- do not duplicate REF validation/protection logic inside PATH;
- do not add C/C++, CUDA C++, PTX, native addons/FFI or direct CUDA-JS/private-runtime access;
- do not add hidden allocation/growth/spill or infer capacity from layout without a declared resource;
- do not change accepted Search IR 0.1/history to match proposal identities;
- do not claim PATH complete from the resource migration alone.

## Resume command/state

Resume from remote branch:

`ref/graph-path-01`

Verify its head contains this handoff and has `c5c322cfc7c0aaafd8cfd301079dca40c6a493c2` as the immediate implementation checkpoint in history.

Then implement the bounded PATH oracle against the post-resource evidence identities above.
