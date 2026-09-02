# CUDA-MCGS search-semantics reference results

**Status:** Informational

**Updated:** 2026-09-02

## Prerequisite state

Protected semantic authority remains `main@3ecac11e3576bd063760bc9572f79bea78acd031`.

The integrated Session base remains `experimental/portfolio@079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`. Framework #183 and terminal slice #184 are already integrated on that candidate lineage; candidate/reference integration remains distinct from #122 protected acceptance and native/product claims.

## Latest fully qualified Session content checkpoint

`REF-SESSION-01` / #181:

`61fce562f97d475c140ac33e9e5c9f226abef570`

tree:

`d6681d2c441453266fcfd4b8c696db7bb72d1a64`

The tree is exactly equal to `bc4902aad716cb8daf7dcafc0d5058c885399659`; the exploratory/revert commits between those heads have zero net file difference.

Exact-head PR workflows passed:

- Session behavioral reference `33692905307`;
- Terminal slice `33692905267`;
- Framework lifecycle `33692905299`;
- full repository/documentation matrix `33692905302`.

### Composer and coupled prerequisites

- Composer: `881/881`;
- required owner projections: pass;
- Session CI self-gate: pass;
- advance/reroot/teardown boundary gate: pass;
- terminal Session-absent reference: `6/6`;
- terminal evidence: `c9c0b9b8847c5121bc6cce1ff3707e2c465a4fddd067a400693b235972254388`.

### Session behavioral result

- expected/discovered/executed/passed: `25/25/25/25`;
- failures/skips/not-discovered: `0`;
- direct SPEC-0006 ENGINE-REFERENCE routes: `38/38` executed;
- Session profile projection: `4bbead6230b841d42c6658397164900895a30391c69279be1fab84b3225f5106`;
- Session evidence: `850ec70294295a605ee3f449c1dccb91d87795a00b6bf966cde36f8fcc76f6bf`;
- canonical bytes: `18579`;
- artifact: `9870707549`;
- artifact digest: `sha256:381746482638e01643935b787d867a869c3969da10e68f293d2e1982ccac13d1`.

The permanent 25th case covers replay after typed terminal rejection: exact replay returns the original typed outcome; changed payload under the same command ID raises the Session replay conflict. This converts the valid review red at `31dd36d918c062750361b5ed9fe227854e2c9280` / run `33691410709` into durable checked-in evidence.

## Invalid exploratory capacity probe

A review-time experiment at `87c135ba905ff340f575df3448463f727bdc7d33` added a 26th case that treated `profile.commands.capacity` as a lifetime replay ledger and counted rejected pre-ignition initial-root command identities against it. Run `33692373122` failed only that new case.

An attempted narrow repair at `7576aed00a14456ef9a029d436a651d87b0c2f11` made Session pressure legal observation requests before the Output observation profile reached its own pending-request capacity; run `33692621320` exposed that contradiction.

Reassessment against SPEC-0006 and the Composer profile established that the falsifier premise was invalid: `commands.capacity` is sourced from Progress external-wait `maxPendingCommands`; initial root is a separate pre-ignition lifecycle operation. Forward revert `61fce562…` removed the test and repair and restored the exact prior reviewed tree. These two runs are preserved as diagnostic history and are not counted as conformance reds.

## Retained valid review reds

| Finding | Test-only/intermediate head | Workflow |
| --- | --- | ---: |
| advance changed root incarnation | `dc5b2c363933476b9580c267ba58c6f79ee56966` | `33682215069` |
| Session invented Output publication truth | `1341d784329c03b7f697fa62a5dc6fba1237cd4f` | `33682862655` |
| completion allowed a live observation borrow | `f7a78dda0e9be4bd52a8dd28db82710be059c5e2` | `33683367794` |
| cancellation mutated reroot before command admission | `f4a8d21dd2c53dceba3ec1cdbdbf371f05598f94` | `33684006773` |
| permanent Session CI runner could be skipped | `46d105821be7a49063f0bc91cce0ebe4acf570a7` | `33684533233` |
| malformed command mutated before validation | `d74ab8b9efd5df68e47d7099081c58f743dea12a` | `33684937813` |
| foreign Output profile provenance accepted | `3f0e86f871795a5c26a7277210e2685f4264cb80` | `33688752675` |
| foreign Session provenance accepted | `d569fd1cbb3374697751e1b9772bd43c1fbd845b` | `33689574707` |
| stale advance authority accepted | `3a00cacb58cc244b0b1918e3d40dc18ea3448875` | `33690115667` |
| stale reroot authority accepted | `5e3864f854483d989815044ce7f5fd4aa36d4438` | `33690463348` |
| strict reroot authority exposed ordinary case composition missing public authority | `9edc258b7aa3336a1c868c1d779baaecac0f3809` | `33690589366` |
| invalid reroot authority leaked harness canonicalization instead of typed rejection | `2a6fe270d44a1cd91dd72de13b066200988f2c92` | `33690963232` |
| changed replay after typed command rejection was accepted | `31dd36d918c062750361b5ed9fe227854e2c9280` | `33691410709` |

No valid falsifier above was weakened to obtain the current green result.

## Ownership result

The executable Session reference consumes Composer-normalized Session structure and public sibling-owner facts. It does not reconstruct Domain root validity, Graph storage/reclamation, Resource accounting, Progress scheduling/closure, Output payload/snapshot/publication meaning, Framework lifecycle, CUDA mechanisms, or product semantics.

The case bank covers initial root, advance/reroot separation, transposed occurrence behavior, stale authority, reroot prepare/abort/commit/quarantine, attention independence, Output/Session/search provenance, observation pressure/borrow lifecycle, cancellation/completion, finite counter exhaustion, command validation/replay, normalized teardown order, typed rejection replay, and exact Session absence.

## Current gate

The semantic/reference content has completed exact-head qualification and fresh whole-diff author review without a blocker. This tracker-only finalization must pass the permanent Session, Terminal, Framework and full repository/documentation workflows, and must differ from `61fce562…` only in current-state documentation.

After that, stop for fresh repository-owner authorization of the exact final head against base `079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd` before any transport or merge.

After authorized #181 integration/readback: #30 Stage → #33 Channel evidence → #36 final reference integration → #122 protected atomic acceptance.
