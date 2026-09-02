# CUDA-MCGS search-semantics reference results

**Status:** Informational

**Updated:** 2026-09-02

## Prerequisite state

Protected semantic authority remains `main@3ecac11e3576bd063760bc9572f79bea78acd031`.

The integrated Session base remains `experimental/portfolio@079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`. Framework #183 and terminal slice #184 are already integrated on that candidate lineage; candidate/reference integration remains distinct from #122 protected acceptance and native/product claims.

## Qualified Session semantic checkpoint

`REF-SESSION-01` / #181 semantic checkpoint:

`51b596ecdc2da1ff2c9c69b4974858d9a42dec88`

tree:

`9eaff501ff5e14479bae81f3dca8c08b8dafb148`

Exact-head PR workflows passed:

- Session behavioral reference `33691899626`;
- Terminal slice `33691899620`;
- Framework lifecycle `33691899664`.

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
- Session evidence: `06232b783f4b60cd61874f885840191497443139517d62c4b98f0855f4286417`;
- canonical bytes: `20380`;
- artifact: `9870343695`;
- artifact digest: `sha256:f35baa0ccb332ec5f5bd58e095269d128eaf0c423768f5d40342d9ad7c1704f1`.

The permanent 25th case covers the replay ledger after typed terminal rejection: exact replay returns the original typed outcome; changed payload under the same command ID raises the Session replay conflict. This converts the review red at `31dd36d918c062750361b5ed9fe227854e2c9280` / run `33691410709` into durable checked-in evidence.

## Retained review reds

| Finding | Test-only/intermediate head | Workflow | Durable evidence |
| --- | --- | ---: | --- |
| advance changed root incarnation | `dc5b2c363933476b9580c267ba58c6f79ee56966` | `33682215069` | artifact `9866689484` |
| Session invented Output publication truth | `1341d784329c03b7f697fa62a5dc6fba1237cd4f` | `33682862655` | artifact `9866932885` |
| completion allowed a live observation borrow | `f7a78dda0e9be4bd52a8dd28db82710be059c5e2` | `33683367794` | artifact `9867120969` |
| cancellation mutated reroot before command admission | `f4a8d21dd2c53dceba3ec1cdbdbf371f05598f94` | `33684006773` | artifact `9867359227` |
| permanent Session CI runner could be skipped | `46d105821be7a49063f0bc91cce0ebe4acf570a7` | `33684533233` | workflow log; failure before evidence generation |
| malformed command mutated before validation | `d74ab8b9efd5df68e47d7099081c58f743dea12a` | `33684937813` | artifact `9867706099` |
| foreign Output profile provenance accepted | `3f0e86f871795a5c26a7277210e2685f4264cb80` | `33688752675` | artifact `9869167043` |
| foreign Session provenance accepted | `d569fd1cbb3374697751e1b9772bd43c1fbd845b` | `33689574707` | artifact `9869474428` |
| stale advance authority accepted | `3a00cacb58cc244b0b1918e3d40dc18ea3448875` | `33690115667` | boundary-gate log |
| stale reroot authority accepted | `5e3864f854483d989815044ce7f5fd4aa36d4438` | `33690463348` | boundary-gate log |
| strict reroot authority exposed ordinary case composition missing public authority | `9edc258b7aa3336a1c868c1d779baaecac0f3809` | `33690589366` | artifact `9869859986` |
| invalid reroot authority leaked harness canonicalization instead of typed rejection | `2a6fe270d44a1cd91dd72de13b066200988f2c92` | `33690963232` | artifact `9869999590` |
| changed replay after typed command rejection was accepted | `31dd36d918c062750361b5ed9fe227854e2c9280` | `33691410709` | boundary-gate log |

No falsifier above was weakened to obtain the current green result.

## Ownership result

The executable Session reference consumes Composer-normalized Session structure and public sibling-owner facts. It does not reconstruct Domain root validity, Graph storage/reclamation, Resource accounting, Progress scheduling/closure, Output payload/snapshot/publication meaning, Framework lifecycle, CUDA mechanisms, or product semantics.

The case bank covers initial root, advance/reroot separation, transposed occurrence behavior, stale authority, reroot prepare/abort/commit/quarantine, attention independence, Output/Session/search provenance, observation pressure/borrow lifecycle, cancellation/completion, finite counter exhaustion, command validation/replay, normalized teardown order, typed rejection replay, and exact Session absence.

## Final tracker/review gate

The current tracker-only commits are outside the Session evidence source set. Their final head must be compared to `51b596ec…` and contain changes only to `STATUS.md`, `next_step.yaml`, this `README.md`, and this `RESULTS.md`.

Then the full repository/documentation PR matrix must pass on that exact documentation-inclusive head. After that, perform one fresh author-side whole-diff review of PR #189 against base `079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`.

A clean author review is not repository-owner authorization: stop for fresh exact-head authorization before any transport or merge.

After authorized #181 integration/readback: #30 Stage → #33 Channel evidence → #36 final reference integration → #122 protected atomic acceptance.
