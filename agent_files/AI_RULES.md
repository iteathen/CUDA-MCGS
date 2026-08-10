# AI Rules

**Scope:** Hard rules for automated agents. These rules are concise by design; linked files contain the method.

1. Read root `AGENTS.md` before any change.
2. Follow authority order; report material contradictions.
3. Do not edit a critical boundary without adequate reasoning, authority, and evidence.
4. Work by ownership boundary, not arbitrary file count.
5. Always organize the repository as though it is already a very large project; current small size is not permission for flat or temporary structure.
6. Decide product area, component, lifecycle owner, dependency direction, and public surface before creating production artifacts.
7. Do not add source code to the repository root or create unowned catch-all `utils`, `common`, `shared`, `misc`, `helpers`, or equivalent dumping grounds.
8. Do not create a component without its manifest, README, registry entry, public/internal boundary, and validation ownership.
9. Do not deep-import another component's internal files; depend only through its declared public contract.
10. Do not create circular component dependencies.
11. Do not split a repository, service, or package merely because file count is growing; require an independent lifecycle, release, security, ownership, or consumer boundary.
12. Do not make speculative fixes. Reproduce, observe, classify, repair, retest.
13. Do not weaken tests, gates, thresholds, assertions, or safety checks to make work pass.
14. Do not claim success without running the relevant validation.
15. Do not claim publication until the remote state is verified.
16. Do not introduce hidden CPU participation into GPU-resident search.
17. Do not introduce hidden domain, evaluator, graph, value, action-space, or memory assumptions into the universal core.
18. Do not encode accidental first-case limits in foundational schemas or types.
19. Do not add general-purpose device allocation to the active hot path without an accepted memory/lifetime design.
20. Do not copy or adapt third-party implementation without exact revision, license, and an explicit reuse decision.
21. Do not expose secrets, arbitrary native addresses, unchecked executable schemas, or unsafe pointer capabilities.
22. Do not silently delete historically relevant guidance; supersede or archive it with provenance.
23. Do not leave stale authority, indexes, component manifests, registry entries, or handoff state after a change.
24. Record genuine blockers and the next coherent action in `next_step.yaml`.
25. Prefer a complete coherent result over many tiny context-reloading cycles.
