# CUDA-MCGS search-semantics reference results

**Status:** Informational

**Updated:** 2026-09-02

## Integrated prerequisite state

Protected semantic authority remains `main@3ecac11e3576bd063760bc9572f79bea78acd031`.

The integrated CUDA-free candidate/reference base for Session is `experimental/portfolio@079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`.

Framework #183 and terminal slice #184 are complete/integrated on that candidate lineage. #184's authorized source `547e4632aa9e3d4b3cd45db8056f215d6212de5c` was reviewed on PR #187, transported through PR #188, and integrated at `3766353d5fa264067e33ae6798c632ffd65494ef` with exact source-tree equality. Its decisive terminal-order reds remain `33664488775` and `33676366735`.

Candidate/reference integration remains distinct from protected #122 acceptance, native support, production readiness or product support.

## Active Session candidate

`REF-SESSION-01` / #181 is constructed on `ref/session-01` from exact base:

`079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`

Exact semantic head before this current-state-only reconciliation:

`2ed5bccd04ed95e96fc8bc2a5e957daef339db2e`

Semantic tree:

`3b57fb0998e8f7b271c58a90e2f5df3b5fa7798c`

The semantic diff from the exact base is 29 commits ahead / 0 behind and is confined to Session profile projection/export, owner-local Session semantics/cases/runner, public script wrappers and the permanent Session CI gate.

## Retained Session red proofs

| Finding | Test-only head | Workflow | Durable evidence |
| --- | --- | ---: | --- |
| Advance consumed a new root incarnation instead of staying within the current incarnation | `dc5b2c363933476b9580c267ba58c6f79ee56966` | `33682215069` | artifact `9866689484` |
| Session invented runtime Output observation-publication truth instead of consuming Output-owned facts | `1341d784329c03b7f697fa62a5dc6fba1237cd4f` | `33682862655` | artifact `9866932885` |
| Completion published Session terminal provenance while an observation borrow was live | `f7a78dda0e9be4bd52a8dd28db82710be059c5e2` | `33683367794` | artifact `9867120969` |
| Cancellation aborted prepared reroot state before command admission succeeded | `f4a8d21dd2c53dceba3ec1cdbdbf371f05598f94` | `33684006773` | artifact `9867359227` |
| Permanent Session runner was conditionally skippable and missing evidence only warned | `46d105821be7a49063f0bc91cce0ebe4acf570a7` | `33684533233` | workflow log; failure occurs before Session evidence generation |
| Malformed untrusted command identity mutated counters before semantic validation | `d74ab8b9efd5df68e47d7099081c58f743dea12a` | `33684937813` | artifact `9867706099`; `sha256:0aae20cbc391c87b86a82e11d1a1cd09027f0a37abf319da91516b11a4a62409` |

The green repair line preserves these falsifiers. It keeps advance within the existing root incarnation, consumes Output-owned ready-publication metadata plus the normalized selected Output observation profile, requires observation-borrow quiescence before terminal provenance, admits cancellation before reroot mutation, makes the Session CI lane non-bypassable, and validates command content/identities before any state mutation.

## Semantic qualification at 2ed5bccd…

Permanent Session workflow `33685204052` succeeded.

### Composer and projections

- Composer capsule: `cuda-mcgs-search-ir-composer-reference-v0.2.0`;
- Composer cases: `881/881`;
- representation/composition evidence: `a6abe9cb7b22f15b4e57fb89cbe0dd0a22e8539beff3e98f9f18f67c421e2bfe`;
- Composer canonical bytes: `727811`;
- Domain, Graph, Policy, Evaluator, Resource, Progress, Output and Session profile exports: pass.

### Coupled terminal regression

- terminal Session-absent cases: `6/6`;
- terminal evidence: `6bf37be20b02051f30aafec4c50c1d3262af28b41bf537f8825679fa5667e4c3`;
- exact Session residue remains zero and no host progress loop is required.

### Session behavioral reference

- expected/discovered/executed/passed: `20/20/20/20`;
- failed/skipped/undiscovered: `0`;
- direct SPEC-0006 ENGINE-REFERENCE routes executed/covered: `38/38`;
- Session evidence: `dc737cdf719e51298271209f63941f7c1e8af6426466a1f4dc7fdb7bc72018f3`;
- Session canonical bytes: `8647`;
- artifact: `9867807703`;
- artifact SHA-256: `03af6fbf452426726b5d1c08a80b952fb5f2f576578391db55da1edbd7fa74e6`.

### Permanent gate integrity

- `scripts/verify-session-ci-gate.mjs`: pass;
- `scripts/verify-session-advance-boundary.mjs`: pass;
- Session runner is unconditional;
- missing Session evidence is a workflow error rather than a warning.

## Ownership review result at semantic head

The complete executable Session brick remains bounded to Session authority. It consumes the normalized Composer Session profile and public sibling-owner facts. It does not duplicate Domain root validity, Graph storage/reclamation, Resource accounting, Progress scheduling/closure, Output payload/snapshot/publication semantics, Framework lifecycle or CUDA-JS mechanism authority.

The case bank includes materially different selected Session profiles, attention/observation schedule permutation, advance/reroot distinction, shared-transposition occurrence behavior, reroot abort/commit/quarantine, observation freshness/pressure/borrow lifecycle, cancellation/completion, finite exhaustion, command replay, admission-before-mutation and the exact Session-absent terminal regression.

No native source, private runtime access, product/chess/UCI/model semantics, second root-control authority or host observe-decide-write/relaunch progression loop was introduced.

A fresh whole-diff author review of the semantic head found no blocking semantic or ownership defect. This is author review, not independent repository-owner authorization.

## Documentation-inclusive final gate

This RESULTS file and the other current-state trackers are intentionally reconciled after semantic qualification. That state-only commit changes the candidate head but not Session semantics.

The resulting exact #181 review head must still pass:

- the permanent Session PR workflow;
- the full repository/documentation PR matrix;
- a fresh complete-diff author review on that exact head.

Then stop for fresh repository-owner authorization for exactly that head on exactly base `079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`. Do not merge on author review alone. If the connector cannot clear a draft review record, any replacement transport must be same-head/same-base and must occur only after authorization.

## Next after authorized integration

After guarded #181 integration and target/tree readback, #30 / `REF-STAGE-01` becomes the next dependency-ready semantic-reference leaf, followed by #33 Channel evidence, #36 final reference integration and #122 protected atomic semantic acceptance.
