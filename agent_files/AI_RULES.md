# AI Rules

**Scope:** Hard rules for automated agents. These rules are concise by design; linked files contain the method.

1. Read root `AGENTS.md` before any change.
2. Follow authority order; report material contradictions.
3. Do not edit a critical boundary without a completed critical assessment, adequate reasoning, authority, and evidence.
4. Work by ownership boundary, not arbitrary file count.
5. Do not turn the first plausible idea into an implementation plan for substantial or critical work; complete the proportional assessment first.
6. Answer every applicable assessment question through a strong proposer/adversary/defender/integration pass; do not use a straw-man critic.
7. Do not defend an original proposal after evidence exposes a better boundary, narrower scope, experiment, or rejection.
8. Do not call a design simple when it omits sound fundamentals or exports complexity to callers, memory, synchronization, migration, recovery, diagnostics, tests, or future integrations.
9. Keep assessment and planning administration proportional: one authoritative record by default, links instead of duplication, and no manual ledger without a real consumer and owner.
10. Before a sanity check, freeze the exact revision or artifact and declare `full`, `bounded`, or `sampled`.
11. Do not call sampled or silently incomplete coverage a full sanity check.
12. In a full sanity check, account for every declared surface at risk-justified depth; do not require uniform exhaustive depth for unrelated low-risk leaves.
13. Interrogate material semantic units through purpose/authority, owner/boundary, inputs/outputs/effects, callers/dependencies, failure/terminal behavior, a credible counterexample, decisive evidence, and wider impact.
14. Treat tests, compilers, linters, analyzers, sanitizers, profilers, and benchmarks as evidence—not substitutes for semantic and integration reasoning.
15. Do not quietly repair findings inside an independent sanity check or audit; authorize remediation separately.
16. Keep sanity administration proportional: one canonical record only when needed, grouped low-risk coverage where valid, no form per file/function, and no duplicate findings ledgers.
17. Before PR review, record the PR, intended target, exact head SHA, relevant base/merge base, comparison range, review mode, and claim limits.
18. Review the actual complete diff, ancestry, affected context, current discussion, and current-head evidence; do not treat the PR description or green CI as proof.
19. Every material PR receives complete author-side review; label it non-independent unless a genuinely independent reviewer performed the review.
20. Require independent review when project phase, repository protection/CODEOWNERS, owner instruction, or objective consequence triggers it.
21. Classify review comments as blocking defect, question/potential blocker, non-blocking improvement, or informational; do not block on unrelated cleanup or personal preference.
22. A head change invalidates affected approval/authorization. A material base change invalidates affected integration evidence.
23. Do not approve or merge while required checks are pending/failed, blocking findings/threads remain, or mergeability/target/closure is unknown.
24. Do not resolve another reviewer's blocking thread without evidence and appropriate reviewer/owner disposition.
25. Merge only the exact accepted head, with an expected-head guard where supported, after revalidating checks, reviews, protections, discussion, target, ancestry, issue closure, branch effects, and conflicting work.
26. Choose squash, rebase, or merge commit deliberately; squash is the pre-release default for one coherent result.
27. Do not bypass branch protection, CODEOWNERS, required checks, or a merge queue; do not force-update the target to finish.
28. Do not claim merge completion until the target/resulting SHA and intended tree, issue closure, source branch, and dependent work are verified.
29. An exact-head single-maintainer authorization is not independent approval and cannot waive substantive gates.
30. Always organize the repository as though it is already a very large project; current small size is not permission for flat or temporary structure.
31. Decide product area, component, lifecycle owner, dependency direction, and public surface before creating production artifacts.
32. Do not add source code to the repository root or create unowned catch-all `utils`, `common`, `shared`, `misc`, `helpers`, or equivalent dumping grounds.
33. Do not create a component without its manifest, README, registry entry, public/internal boundary, and validation ownership.
34. Do not deep-import another component's internal files; depend only through its declared public contract.
35. Do not create circular component dependencies.
36. Do not split a repository, service, or package merely because file count is growing; require an independent lifecycle, release, security, ownership, or consumer boundary.
37. Do not make speculative fixes. Reproduce, observe, classify, repair, retest.
38. Do not weaken tests, gates, thresholds, assertions, or safety checks to make work pass.
39. Do not claim success without running the relevant validation.
40. Do not claim publication until the remote state is verified.
41. Do not introduce hidden CPU participation into GPU-resident search.
42. Do not introduce hidden domain, evaluator, graph, value, action-space, or memory assumptions into the universal core.
43. Do not encode accidental first-case limits in foundational schemas or types.
44. Do not add general-purpose device allocation to the active hot path without an accepted memory/lifetime design.
45. Do not copy or adapt third-party implementation without exact revision, license, and an explicit reuse decision.
46. Do not expose secrets, arbitrary native addresses, unchecked executable schemas, or unsafe pointer capabilities.
47. Do not silently delete historically relevant guidance; supersede or archive it with provenance.
48. Do not leave stale authority, indexes, component manifests, registry entries, findings, review threads, PR state, or handoff state after a change.
49. Record genuine blockers and the next coherent action in `next_step.yaml`.
50. Prefer a complete coherent result over many tiny context-reloading cycles.
