# ENGINE-EXTENSION-01 Critical Assessment and Focus-Branch Plan

**Status:** Proposal

**Assessment depth:** Critical

**Decision:** Revise through three dependency-ordered semantic owners, then reconcile one optional extension packet

**Parent plan:** `CUDA-MCGS-V0/22`

**Integration owner:** CUDA-MCGS extension-contract integration spine

**Frozen CUDA-MCGS input:** `main@1aa8b8d145553fe6415787d30226a03d4e01822f` (tree `192e2aab53f79a74cf0e56102cb5149b5ae1900f`)

**Frozen CUDA-JS authority input:** clean protected `main@2135216b1a9fd88066a1c82b61ae533645eac9c2`, package `cuda-js@0.1.0-alpha.6`

**Started:** 2026-08-25T00:18:18-07:00

**Assessment completed:** 2026-08-25T00:20:31-07:00

## Objective, authority and minimum practice floor

Make proposals [`SPEC-0003`](../specs/SPEC-0003-search-stage-and-extension-surface.md), [`SPEC-0004`](../specs/SPEC-0004-async-stage-channels.md) and [`SPEC-0005`](../specs/SPEC-0005-stage-ptx-and-search-image-composition.md) decision-complete as one **optional** schema-backed composition substrate. The substrate must let selected capabilities compose naturally without taking ownership from the decision-complete core packet, without leaving absent-capability residue and without creating a CUDA-MCGS native escape path. This node does not accept the proposals, implement schemas/reference/runtime code or select a CUDA realization.

The governing authority is the project-owner build instruction, root and canonical agent rules, the accepted charter, ADR-0002, ADR-0003, ADR-0005, ADR-0014, ADR-0018, ADR-0019, accepted SPEC-0001 and SPEC-0002, and the decision-complete core proposal packet SPEC-0000 plus SPEC-0006 through SPEC-0013 integrated through `main@22e3ea5`. Accepted CUDA-JS SPEC-0013 and its public-surface addendum own restricted Device-JS; accepted CUDA-JS SPEC-0018/0019 and the accepted SPEC-0022 scoped-atomic-observation child are capability inputs, not MCGS semantic authority.

The minimum practice floor is:

- complete semantic review of all three proposals and every core-owner boundary they consume;
- unique stable normative requirement IDs and explicit schemas/reference/conformance obligations;
- first-consumer deletion, empty-capability deletion and materially different second-instance reasoning;
- explicit finite resources, progress, synchronization, failure, cancellation, compatibility, lifecycle and cleanup ownership;
- full documentation validation plus exact-head author review on every integrated leaf;
- no production/schema/runtime mutation and no CUDA-MCGS C/C++/PTX/native work.

## Critical assessment

### Current evidence and conflicts

The now-deleted extension-composition capsule historically passed 42/42 portable cases and 25/25 Windows-native cases on its exact old pair. Its archived conclusion records byte-identical unbound artifacts and the danger of binding semantic surfaces to native call topology, but it is no longer current validation, native-compatible-pair or PTX-authoring authority. The historical Stage-PTX recommendation is superseded by ADR-0019 and current SPEC-0005: maintained CUDA-MCGS inputs are restricted Device-JS only and every CUDA-specific artifact is an opaque CUDA-JS output. The complete disposition and public-contract replacement map is [`2026-08-25-native-experiment-disposition-audit.md`](2026-08-25-native-experiment-disposition-audit.md).

The current proposals have the right broad direction but are not decision-complete against the core packet:

- `scheduler` still appears where SPEC-0012 now owns device progress and a physical scheduler is only a later profile mechanism;
- SPEC-0003 can be read as letting a stage own domain/graph/policy/evaluator/output mutation rather than only its operational transition and composition boundary;
- SPEC-0004 must delegate finite resource accounting to SPEC-0011, runnable/pending/fairness/no-progress/closure to SPEC-0012, output publication to SPEC-0013 and root-epoch transaction coordination to SPEC-0006;
- SPEC-0003/0004 still attribute live-output meaning too broadly to Search Session rather than SPEC-0013 plus optional SPEC-0006 request/borrow coordination;
- SPEC-0005 must distinguish its selected extension execution-package contribution from SPEC-0000's cross-owner framework/package authority;
- most normative statements lack stable unique requirement IDs, preventing complete schema/reference mapping and atomic acceptance;
- exact absence of the complete substrate, not merely one capability, needs an explicit zero-residue rule.

### Strongest simplification challenge

Delete the extension substrate and hard-code the first engine's behavior into generated core Device-JS. This would minimize early machinery but fail the authorized universal framework: new behavior would require core edits, first-product semantics would drift into core contracts and there would be no least-authority composition/deletion boundary. Rejected. The extension substrate remains optional, and a concrete engine that selects no extension capability must materialize none of it.

### Strongest overengineering challenge

A stage graph, checkpoint surfaces, channels and a Composer can become a general workflow engine. The bounded answer is a finite pre-ignition operational graph only when a selected profile needs it, entry/exit stable checkpoints only, no mid-mutation hook, no runtime registry/interpreter/late binding, bounded typed internal channels and one deterministic selected composition. A new stage requires a distinct stable operational invariant/readiness/lifecycle transition, not a convenient hook.

### Strongest underengineering challenge

Some behavior may appear to need partial mid-stage access. That is not an extension-surface use: if it participates in establishing an owner invariant, it belongs in that owner's selected mandatory implementation; if it creates a stable new operational state, it justifies a stage. Exposing partial mutation would make ordering, rollback and owner correctness unprovable.

### CUDA-JS completeness classification

The accepted Device-JS surface naturally expresses restricted JavaScript procedures, deterministic source identity, ordinary typed loads/stores, atomic RMW, device fences and relaxed device-scope single-word observation. It does **not** yet expose a public release-store/acquire-load pair that truthfully publishes a multi-word device-resident channel payload. Inventing a relaxed/RMW/fence recipe in CUDA-MCGS would force CUDA memory-model implementation knowledge into the consumer.

The consumer-neutral capability is recorded as [CUDA-JS #123](https://github.com/iteathen/CUDA-JS/issues/123): bounded `u32`/`u64` device-scope release/acquire publication helpers with explicit identity, lifecycle and independent qualification. This is a native internal-channel qualification dependency, not a blocker for backend-neutral specification/schema/reference work. No other new CUDA-JS capability is justified by this assessment; RDC/LTO, multiple operations and asynchronous transfers remain optional public mechanisms selected only by a later concrete profile.

### Assessment disposition

Proceed sequentially. SPEC-0003 owns optional stage/surface/capability semantics, SPEC-0004 owns optional nonblocking internal dataflow while delegating global progress/resources, and SPEC-0005 owns deterministic restricted Device-JS extension composition plus the CUDA-MCGS/CUDA-JS package boundary. The integration leaf reconciles the packet and hands exact schema/reference work downstream. A material owner/dependency change invalidates affected later leaves.

## Token and attention posture

This is substantial cross-specification work. One leaf is active at a time. Each specification leaf is sized for one focused session including requirement inventory, owner reconciliation, falsifiers, validation, review and cleanup. Raw evidence is read once and reused while its revision key remains unchanged. Optional prose polish, native profiling and wider CUDA-JS research defer before verification/cleanup reserve erodes. Repeated repair without a new causal finding, a new public owner, contract overlap, native temptation or a materially changed base triggers replan rather than scope expansion.

## Semantic dependency graph

```text
accepted authority + decision-complete core packet
                    |
                    v
            EXT-STAGE-01 (SPEC-0003)
                    |
                    v
           EXT-CHANNEL-01 (SPEC-0004)
                    |
                    v
           EXT-COMPOSE-01 (SPEC-0005)
                    |
                    v
          EXT-INTEGRATE-01 (packet/routing)
                    |
                    v
 ENGINE-IR-COMPOSER-01 -> ENGINE-REFERENCE-01 -> ENGINE-CONTRACT-ACCEPTANCE-01
```

The sequence is intentional. Channels consume stage/checkpoint permissions. Restricted Device-JS composition consumes both stage and channel identities. Parallel specification edits would share normative vocabulary and invalidate downstream review, so no concurrent write surface is authorized.

## Focus-branch map

| Focus branch | Initial status | Owned outcome | Exact inputs | Write surface/output | Falsifier |
|---|---|---|---|---|---|
| `EXT-ASSESS-01` | `completed assessment` | Critical assessment, capability classification and dependency-sized branch map | `main@1aa8b8d`, proposal specs, archived extension conclusions, CUDA-JS `main@2135216` public contracts | This plan plus current routing | Any proposal mutation occurs before assessment/map integration or a native need is hidden as a local workaround. |
| `EXT-STAGE-01` | `integrated proposal` | Decision-complete optional stage/surface/capability proposal | Integrated assessment; SPEC-0003; core owner packet | [`SPEC-0003`](../specs/SPEC-0003-search-stage-and-extension-surface.md) through PR #82 at `main@ce5efc4` | A stage/surface owns another contract's semantics, is required when no extension is selected, exposes partial mutation or encodes one pipeline/scheduler/product. |
| `EXT-CHANNEL-01` | `integrated proposal` | Decision-complete optional internal channel proposal | Integrated SPEC-0003; SPEC-0004; SPEC-0011/12/6/13 boundaries; CUDA-JS #123 classification | [`SPEC-0004`](../specs/SPEC-0004-async-stage-channels.md) through PR #84 at `main@f382805` | A worker blocks/spins, host progression is required, a channel owns global progress/resources/output/session meaning or absent channels leave residue. |
| `EXT-COMPOSE-01` | `integrated proposal` | Decision-complete restricted Device-JS extension composition/package proposal | Integrated SPEC-0003/4; SPEC-0005; SPEC-0000; ADR-0019; CUDA-JS Device-JS/public package contracts | [`SPEC-0005`](../specs/SPEC-0005-stage-ptx-and-search-image-composition.md) through PR #86 at `main@098a8ce` | CUDA-MCGS owns/interprets CUDA source/artifacts, runtime discovery remains, absent capability leaves semantic/source/package residue or native topology becomes universal. |
| `EXT-INTEGRATE-01` | `integrated proposal` | One exact extension packet, routing/issues/cleanup and schema/reference handoff | Every integrated or disposed EXT leaf | Routing/handoff through PR #87 at `main@0ba119f` | A branch is unaccounted, IDs duplicate, dependencies cycle, core deletion fails, or later schema/reference work must invent extension meaning. |

## Common execution contract

Before each material leaf, freeze its expected base/head, confirm dependencies and reload the minimal changed authority. The leaf owns only its listed semantic boundary and documentation/evidence surface. It must:

- state scope/non-goals, terms, identity/ranges, permissions, lifecycle, ordering/publication, resources, progress, failure/cancellation/cleanup, compatibility and conformance;
- give every normative requirement one unique stable ID and map acceptance blockers to later schema/reference/native owners;
- preserve optional whole-substrate deletion, selected-only materialization and first-consumer deletion;
- preserve ordinary Node.js/restricted Device-JS CUDA-MCGS source and opaque public CUDA-JS outputs;
- stop for CUDA-JS capability classification when a generic mechanism is not naturally expressible;
- inspect actual effects, run `git diff --check` and `./scripts/verify-docs.sh`, record exact timing and use guarded exact-head integration;
- create no production source, generated package, dependency install, device resource, process or untracked scratch.

Rollback before publication is branch deletion after verifying no dependent state. After publication, correction occurs through a new explicit revision/PR; accepted history is not rewritten. Each task-owned branch is removed after verified merge. Issue comments are retained as coordination history. No generated experiment output is created or retained by this node.

## Parent acceptance and downstream handoff

ENGINE-EXTENSION-01 closes only when every EXT leaf is integrated, blocked or explicitly superseded on one exact revision; SPEC-0003/4/5 form one internally coherent optional packet; core contracts remain complete when the entire substrate is deleted; requirement IDs are unique; all selected-only resources/source/package effects have owners and deletion tests; CUDA-JS #123 is routed to native qualification; full validation passes; remote issue state is read back; and Git/worktree state is clean.

Closure makes the proposals **decision-complete**, not accepted. `ENGINE-IR-COMPOSER-01` must then implement strict schema/normalization/package identities and deletion evidence; `ENGINE-REFERENCE-01` must implement stage/channel/composition oracles and mutations; `ENGINE-CONTRACT-ACCEPTANCE-01` accepts the combined semantic packet atomically before production lowering.

## Execution history

`EXT-STAGE-01` ran from 2026-08-25T00:22:19-07:00 through exact-head author review at 2026-08-25T00:25:49-07:00 and merged through PR #82 as `main@ce5efc4af7b66e42ef4deca18824bbd0036ac8ff` at 2026-08-25T00:26:09-07:00. Its reviewed tree matched the protected target tree and task branches were removed by 2026-08-25T00:26:20-07:00. The output is a decision-complete 80-requirement optional proposal, not an accepted schema, runtime or production implementation.

`EXT-CHANNEL-01` ran from 2026-08-25T00:28:34-07:00 through exact-head author review at 2026-08-25T00:31:21-07:00 and merged through PR #84 as `main@f382805c01e52388330cb078752c2c1dbb26c43a` at 2026-08-25T00:31:40-07:00. Its reviewed tree matched the protected target tree and task branches were removed by 2026-08-25T00:31:51-07:00. The output is a decision-complete 90-requirement optional channel proposal; CUDA-JS #123 remains a later native qualification dependency, not a backend-neutral proposal blocker.

`EXT-COMPOSE-01` ran from 2026-08-25T00:33:53-07:00 through exact-head author review at 2026-08-25T00:36:33-07:00 and merged through PR #86 as `main@098a8ce3e6c5abfcccc0209efe8d4564ad75d13f` at 2026-08-25T00:36:51-07:00. Its reviewed tree matched the protected target tree and task branches were removed by 2026-08-25T00:37:03-07:00. The output is a decision-complete 78-requirement restricted Device-JS composition proposal, not schema/reference/native/production acceptance.

## Frozen extension-packet reconciliation

The declared review is **full for the ENGINE-EXTENSION-01 normative packet** frozen at `main@098a8ce3e6c5abfcccc0209efe8d4564ad75d13f` (tree `fab2b9d97d7547036feedadaaae358b6c63f0daf`). SPEC-0003, SPEC-0004 and SPEC-0005 define 248 unique requirement IDs with no duplicate definitions; together with the 741-requirement core proposal packet they form 989 unique proposal requirements.

No unresolved extension contradiction, semantic dependency cycle, core-owner override, first-product assumption, mandatory substrate/capability residue, host-progression path or CUDA-MCGS-native escape remains in the normative packet. Stage owns operational checkpoints/transition commitment; channel owns internal item publication/ownership transfer; composition owns restricted Device-JS Search Program/package projection. Resources, progress, output and optional session meaning remain with SPEC-0011/0012/0013/0006. CUDA-JS owns native release/acquire and every CUDA-specific realization; issue #123 is the later native channel gate.

This integration leaf corrects explanatory/routing surfaces and hands exact schema/reference obligations downstream. It creates no schema, runtime, package, generated artifact, process, device allocation or production authority.

`EXT-INTEGRATE-01` ran from 2026-08-25T00:37:15-07:00 through exact-head author review at 2026-08-25T00:40:36-07:00 and merged through PR #87 as `main@0ba119fbecaa116e29699a47fa867921fd08516d` at 2026-08-25T00:40:55-07:00. Its reviewed tree matched the protected target tree and task branches were removed by 2026-08-25T00:41:06-07:00. Every ENGINE-EXTENSION-01 leaf is now integrated as decision-complete proposal output on one exact revision. Schema/reference evidence, semantic acceptance, native qualification and production implementation remain downstream.
