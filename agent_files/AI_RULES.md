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
11. Build a complete semantic coverage map and split it into review branches small enough for one focused session and full attention to every material semantic unit.
12. Treat a review branch as a semantic coverage packet, not automatically a Git branch; do not split solely by file or line count.
13. Split a branch when it has multiple primary owners, mixes unrelated contracts or paths, requires sampling or skimming, prevents localization of findings, or exceeds active context for both mechanism and consequence.
14. Do not call sampled or silently incomplete coverage a full or system-wide sanity check.
15. In a full sanity check, account for every declared surface at risk-justified depth; do not require uniform exhaustive depth for unrelated low-risk units.
16. Interrogate every material semantic unit through purpose/specification, owner/LEGO boundary, inputs/outputs/effects, callers/dependencies, state/identity/lifetime, foundational contracts/ranges, design-principle alignment, ordering/resources/pressure, failure/cleanup, counterexamples, decisive evidence, and wider consequences.
17. Apply every objectively triggered specialist module, including design/universality, graph/search, evaluator/numerics, GPU/concurrency, finite memory, persistence/compatibility, security/native execution, performance, generated/JIT/ABI, external resources, destructive behavior, and diagnostics.
18. Treat tests, compilers, linters, analyzers, sanitizers, profilers, and benchmarks as evidence—not substitutes for semantic, specification, design, and integration reasoning.
19. Do not infer system coherence from passing leaf branches; reconcile producer/consumer boundaries, end-to-end paths, cross-cutting concerns, lifecycle, contradictions, and findings.
20. Do not quietly repair findings inside an independent sanity check or audit; authorize remediation separately and revalidate affected branches, boundaries, and paths.
21. Keep sanity administration proportional: one canonical record only when needed, grouped low-risk coverage only when branch sizing remains valid, no form per file/function, and no duplicate findings ledger.
22. Always organize the repository as though it is already a very large project; current small size is not permission for flat or temporary structure.
23. Decide product area, component, lifecycle owner, dependency direction, and public surface before creating production artifacts.
24. Do not add source code to the repository root or create unowned catch-all `utils`, `common`, `shared`, `misc`, `helpers`, or equivalent dumping grounds.
25. Do not create a component without its manifest, README, registry entry, public/internal boundary, and validation ownership.
26. Do not deep-import another component's internal files; depend only through its declared public contract.
27. Do not create circular component dependencies.
28. Do not split a repository, service, or package merely because file count is growing; require an independent lifecycle, release, security, ownership, or consumer boundary.
29. Do not make speculative fixes. Reproduce, observe, classify, repair, retest.
30. Do not weaken tests, gates, thresholds, assertions, or safety checks to make work pass.
31. Do not claim success without running the relevant validation.
32. Do not claim publication until the remote state is verified.
33. Do not introduce hidden CPU participation into GPU-resident search.
34. Do not introduce hidden domain, evaluator, graph, value, action-space, or memory assumptions into the universal core.
35. Do not encode accidental first-case limits in foundational schemas or types.
36. Do not add general-purpose device allocation to the active hot path without an accepted memory/lifetime design.
37. Do not copy or adapt third-party implementation without exact revision, license, and an explicit reuse decision.
38. Do not expose secrets, arbitrary native capabilities, unchecked executable schemas, or unsafe pointer capabilities.
39. Do not silently delete historically relevant guidance; supersede or archive it with provenance.
40. Do not leave stale authority, indexes, component manifests, registry entries, findings, invalidated review evidence, review-created state, or handoff state after a change.
41. Record genuine blockers and the next coherent action in `next_step.yaml`.
42. Prefer a complete coherent result over many tiny context-reloading cycles.
