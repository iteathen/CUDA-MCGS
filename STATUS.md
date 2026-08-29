# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-28

## Protected authority

Protected `main` remains intentionally unchanged:

`ee4434be0ae927c4ae1d5c106f91503d28b1aa01`

Nothing below is a protected-main support, release, native, compatible-pair, performance or production claim. The open-PR cleanup described here was completed on the isolated experimental portfolio only.

## Experimental integration line

The live `experimental/portfolio` ref is the current experimental authority. The last non-state changes before this reconciliation are:

- Policy semantic/reference integration PR #153: `eace1d4c80f677763ec4a86773f4011a5f5553b5`;
- Policy state reconciliation PR #154 and durable next-owner transition PR #155;
- GitHub Actions v7 maintenance consolidation PR #156: `daaafcacbf9d104d287c923cd3143800f623a005`;
- superseded Tensor/evaluator research preservation PR #157: `5defa0f31bf4c93f76b2e77b6e5ed09b3d43705d`.

This status reconciliation is state-only and therefore intentionally does not encode its own eventual merge SHA as a forever-current branch identity. Read the live `experimental/portfolio` ref for current authority.

## Integrated Policy semantic/reference packet

`REF-POLICY-01` remains integrated on the experimental portfolio. The bounded CUDA-free reference owns Policy meaning only: records, bounded reservations, cycle response, normalized selection/admission meaning, normalized value/perspective handling, transactional backup semantics, stop/drain accounting, reuse classification and Policy cleanup/quarantine.

Exact integrated evidence packet remains:

- semantic/evidence head `104cb8356417f95cc3783144b306f7b7725f9726`, workflow `33231519393` — success;
- owner-authorized final Policy source/state head `877765e7fadafd9459bf13c1024c002edd279427`, workflow `33233026019` — success;
- Composer `881/881`, representation/composition `115cceb16db3e4a99944c7228e1d5dff7047f342ddbe63a3e695c027d33e85c8`, canonical bytes `727811`;
- Policy projection `6662d8101bbffee0e322ef7e2172f5980d69a09aec8ec565c9425578751310c2`, canonical bytes `123882`;
- Policy reference `e58a5d2f1d49bab77c8b2176750ac764bc6f5295907bbffb708308b5ca35c116`, `24/24`, canonical bytes `13104`;
- retained Policy artifact ID `9708629102`, ZIP SHA-256 `a33e7a4725f6f011737bc280c7f3f721874c4ee9c807a46e550e3c125167b747`;
- truthful requirement disposition summary `52 deferred / 910 partial / 27 pending`.

The coverage/provenance migration changed evidence identities only; semantic cases, schedules, owner declarations and normative specifications were unchanged and fully requalified.

## Ownership and claim limits

Policy integration does **not** absorb neighboring owners:

- Graph owns storage/reference/lifetime/reclamation meaning;
- Evaluator owns execution, batching, cache/workspace and evaluator publication meaning;
- Resource owns resource composition, admission, watermark and pressure policy;
- Progress owns scheduling, fairness and device-progress policy;
- Output owns terminal/live external result and publication meaning;
- Session owns current-root, root-epoch, advance, reroot, attention and supersession authority;
- CUDA-JS owns generic native/CUDA realization mechanisms;
- CUDA-JS-Tensor owns generic tensor math.

No UCT/PUCT formula, scheduler topology, atomic primitive, warp/block topology, allocator, CUDA data structure, native addon/FFI or production persistence format is selected by the Policy slice or this cleanup.

## Open-PR audit and disposition

The repository-wide open-PR audit found five pre-existing PRs: #126, #129, #130, #131 and #132. Each need was fulfilled before disposition:

- **#129 checkout**, **#130 setup-node**, and **#131 upload-artifact** were real maintenance needs, but their old `main`-based diffs covered only an earlier workflow. PR #156 applied the exact Dependabot-selected v7 full SHAs to every current job on the experimental workflow. Exact successor head `5d92d5b66672e8cde8eb090c218a5fb2b8f1c1cd` passed workflow `33235801001` and merged as `daaafcacbf9d104d287c923cd3143800f623a005`. #129–#131 were then closed as fulfilled/superseded, not rejected.
- **#132** attempted a broad product-boundary correction but edited accepted ADR-0018 in place, carried stale state authority, and imposed a broader prohibition than the current LEGO boundary permits. Its valid need is already fulfilled by the narrower accepted/current ownership path represented by PR #146 and current ADR authority. #132 contained no unique research that required preservation and was closed superseded. Issue #44 remains open because protected-main disposition is a separate authorization/acceptance question.
- **#126** mixed stale ADR numbering/control state with one unique high-value Tensor/evaluator/batching/prospective-search research note. PR #157 preserved that note byte-for-byte under `docs/archive/research/` with explicit informational/non-authoritative labeling, requalified exact rebased head `495791ff3a53d576bc6dc903006246cca46724ae` under workflow `33236002396`, and merged as `5defa0f31bf4c93f76b2e77b6e5ed09b3d43705d`. #126 was then closed superseded without losing the useful evidence.

A final repository-wide search after those dispositions returned **zero open pull requests**.

## Workflow maintenance result

The current experimental workflow now uses the exact Dependabot-selected full pins everywhere they apply:

- `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1` — v7.0.1;
- `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020` — v7.0.0;
- `actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` — v7.0.1.

PR #156 changed only those pins/version comments; workflow topology, matrices, commands, evidence paths, permissions and aggregate `verify` semantics were unchanged.

## Preserved superseded research

`docs/archive/research/2026-08-25-tensor-math-in-mcgs-assessment.md.txt` is evidence/provenance only. It preserves useful analysis from PR #126 concerning neural Evaluator direction, CUDA-JS-Tensor ownership, demand-driven batching, grouped execution and prospective/speculative techniques. It is not active specification, ADR, state or implementation authority.

## Next semantic seam

The open-PR cleanup does not choose or begin the next semantic owner.

Issue #36 remains the deterministic reference/conformance parent. The next action remains a fresh dependency assessment of the remaining semantic owners against the integrated Domain/Graph/Policy packet. `REF-EVALUATOR-01` is only the leading candidate until that assessment explicitly compares Evaluator, Resource, Progress, Output, optional Session and Stage/Channel obligations and defines the smallest dependency-ready leaf, cheapest falsifier, non-goals and exact validation.

Issue #122 remains the later atomic semantic acceptance gate. Issue #142 remains portfolio coordination only. Issue #44 remains open for the product-boundary/protected-main disposition still not authorized by this experimental work.

## Cleanup / coordination

- All five pre-existing open PRs reviewed in this task are now closed or fulfilled through qualified current-tree successors; repository-wide open-PR search is empty.
- Temporary transport/repair workflows and scripts were not introduced by this audit.
- The source branches created for merged PRs #156 and #157, plus this state reconciliation branch after merge, are eligible for deletion. The available GitHub connector exposes branch search/create/update but no safe delete-ref/delete-branch operation, so they remain bounded cleanup debt rather than being falsely reported deleted.
- Existing stale Graph/Policy source and recovery refs remain previously recorded cleanup debt for the same tooling/recovery-disposition reasons.

No authorization was given to move or modify protected `main`.
