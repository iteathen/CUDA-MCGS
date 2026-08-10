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
10. Treat a plan as a hypothesis beneath current authority, not as authority or permission to ignore newly triggered doctrine.
11. Execute only a current node that is explicitly ready, dependency-complete, correctly owned, and supported by current authority, repository state, environment, and runnable evidence.
12. Before a material operation, state expected local and wider effects, acceptance, the cheapest decisive falsifier, rollback/safe stop, and conditions requiring plan revision.
13. Apply one coherent ownership-sized operation at a time; do not equate an operation with one file or combine unrelated plan nodes.
14. Inspect exact actual effects immediately after each material operation and compare them with expected effects before continuing.
15. Run the focused falsifier, reconcile affected contracts/callers/resources/lifecycle/design, and classify the outcome as continue, accept, pause, revise, rollback, fail, or supersede.
16. Treat changes to cause, owner, authority, public contract, schema, ABI, consequence horizon, resource model, risk, acceptance, rollback, output, or downstream order as material deviations requiring plan revision.
17. Do not mark a node accepted while invalid partial state, competing authority, stale generated forms, abandoned resources, unresolved contradictions, or false downstream preconditions remain.
18. Keep execution administration proportional: use one plan-execution record only when coordination, continuation, invalid intermediate states, high consequence, or another evidence consumer requires it; do not duplicate issue, plan, execution, PR, and handoff histories.
19. Before a sanity check, freeze the exact revision or artifact and declare `full`, `bounded`, or `sampled`.
20. Build a complete semantic coverage map and split it into review branches small enough for one focused session and full attention to every material semantic unit.
21. Treat a review branch as a semantic coverage packet, not automatically a Git branch; do not split solely by file or line count.
22. Split a branch when it has multiple primary owners, mixes unrelated contracts or paths, requires sampling or skimming, prevents localization of findings, or exceeds active context for both mechanism and consequence.
23. Do not call sampled or silently incomplete coverage a full or system-wide sanity check.
24. In a full sanity check, account for every declared surface at risk-justified depth; do not require uniform exhaustive depth for unrelated low-risk units.
25. Interrogate every material semantic unit through purpose/specification, owner/LEGO boundary, inputs/outputs/effects, callers/dependencies, state/identity/lifetime, foundational contracts/ranges, design-principle alignment, ordering/resources/pressure, failure/cleanup, counterexamples, decisive evidence, and wider consequences.
26. Apply every objectively triggered specialist module, including design/universality, graph/search, evaluator/numerics, GPU/concurrency, finite memory, persistence/compatibility, security/native execution, performance, generated/JIT/ABI, external resources, destructive behavior, and diagnostics.
27. Treat tests, compilers, linters, analyzers, sanitizers, profilers, and benchmarks as evidence—not substitutes for semantic, specification, design, and integration reasoning.
28. Do not infer system coherence from passing leaf branches; reconcile producer/consumer boundaries, end-to-end paths, cross-cutting concerns, lifecycle, contradictions, and findings.
29. Do not quietly repair findings inside an independent sanity check or audit; authorize remediation separately and revalidate affected branches, boundaries, and paths.
30. Keep sanity administration proportional: one canonical record only when needed, grouped low-risk coverage only when branch sizing remains valid, no form per file/function, and no duplicate findings ledger.
31. Before PR review, record the PR, intended target, exact head SHA, relevant base/merge base, comparison range, review mode, and claim limits.
32. Review the actual complete diff, ancestry, affected context, current discussion, plan-execution fidelity, and current-head evidence; do not treat the PR description or green CI as proof.
33. Every material PR receives complete author-side review; label it non-independent unless a genuinely independent reviewer performed the review.
34. Require independent review when project phase, repository protection/CODEOWNERS, owner instruction, or objective consequence triggers it.
35. Classify review comments as blocking defect, question/potential blocker, non-blocking improvement, or informational; do not block on unrelated cleanup or personal preference.
36. A head change invalidates affected approval/authorization. A material base change invalidates affected integration evidence.
37. Do not approve or merge while required checks are pending/failed, blocking findings/threads remain, or mergeability/target/closure is unknown.
38. Do not resolve another reviewer's blocking thread without evidence and appropriate reviewer/owner disposition.
39. Merge only the exact accepted head, with an expected-head guard where supported, after revalidating checks, reviews, protections, discussion, target, ancestry, issue closure, branch effects, and conflicting work.
40. Choose squash, rebase, or merge commit deliberately; squash is the pre-release default for one coherent result.
41. Do not bypass branch protection, CODEOWNERS, required checks, or a merge queue; do not force-update the target to finish.
42. Do not claim merge completion until the target/resulting SHA and intended tree, issue closure, source branch, and dependent work are verified.
43. An exact-head single-maintainer authorization is not independent approval and cannot waive substantive gates.
44. Always organize the repository as though it is already a very large project; current small size is not permission for flat or temporary structure.
45. Decide product area, component, lifecycle owner, dependency direction, and public surface before creating production artifacts.
46. Do not add source code to the repository root or create unowned catch-all `utils`, `common`, `shared`, `misc`, `helpers`, or equivalent dumping grounds.
47. Do not create a component without its manifest, README, registry entry, public/internal boundary, and validation ownership.
48. Do not deep-import another component's internal files; depend only through its declared public contract.
49. Do not create circular component dependencies.
50. Do not split a repository, service, or package merely because file count is growing; require an independent lifecycle, release, security, ownership, or consumer boundary.
51. Do not make speculative fixes. Reproduce, observe, classify, repair, retest.
52. Do not weaken tests, gates, thresholds, assertions, or safety checks to make work pass.
53. Do not claim success without running the relevant validation.
54. Do not claim publication until the remote state is verified.
55. Do not introduce hidden CPU participation into GPU-resident search.
56. Do not introduce hidden domain, evaluator, graph, value, action-space, or memory assumptions into the universal core.
57. Do not encode accidental first-case limits in foundational schemas or types.
58. Do not add general-purpose device allocation to the active hot path without an accepted memory/lifetime design.
59. Do not copy or adapt third-party implementation without exact revision, license, and an explicit reuse decision.
60. Do not expose secrets, arbitrary native capabilities, unchecked executable schemas, or unsafe pointer capabilities.
61. Do not silently delete historically relevant guidance; supersede or archive it with provenance.
62. Do not leave stale authority, plan state, indexes, component manifests, registry entries, findings, invalidated execution/review evidence, execution-created or review-created state, review threads, PR state, or handoff state after a change.
63. Record genuine blockers and the next coherent action in `next_step.yaml`.
64. Prefer a complete coherent result over many tiny context-reloading cycles.
