# AI Rules

**Scope:** Hard rules for automated agents. These rules are concise by design; linked files contain the method.


1. Read root `AGENTS.md`, canonical `agent_files/AGENTS.md`, and `general_foundation/PRINCIPLES.md` before any change.
2. Follow authority order; report material contradictions.
3. Do not edit a critical boundary without adequate reasoning, authority, and evidence.
4. Apply the design hierarchy in order: authority/domain truth, purpose/bounds/weighting, LEGO, SOLID, CUPID, simplest sufficient total system, validation.
5. Do not call a design simple until total lifecycle complexity and complexity moved to callers, adapters, generated code, resources, recovery, diagnostics, and tests are accounted for.
6. Every authoritative fact, mutable state, rule, and lifecycle has one visible owner.
7. Dependencies must be explicit and injected; do not use service locators, global mutable registries, reflection, arbitrary callbacks, or hidden discovery to avoid declaring them.
8. Do not create broad managers, generic event buses, workflow engines, or universal registries without one demonstrated invariant and an accepted ownership boundary.
9. Before creating a reusable concept or name, state its exact invariant, intended equivalence class, permitted variation, exclusions, second-instance result, and first-consumer deletion result.
10. Do not generalize a name without generalizing its contract, implementation, ranges, errors, tests, and lifecycle.
11. Work by ownership boundary, not arbitrary file count.
12. Always organize the repository as though it is already a very large project; current small size is not permission for flat or temporary structure.
13. Decide product area, component, lifecycle owner, dependency direction, and public surface before creating production artifacts.
14. Do not add source code to the repository root or create unowned catch-all `utils`, `common`, `shared`, `misc`, `helpers`, or equivalent dumping grounds.
15. Do not create a component without its manifest, README, registry entry, public/internal boundary, and validation ownership.
16. Do not deep-import another component's internal files; depend only through its declared public contract.
17. Do not create circular component dependencies.
18. Do not split a repository, service, or package merely because file count is growing; require an independent lifecycle, release, security, ownership, or consumer boundary.
19. Do not make speculative fixes. Reproduce, observe, classify, repair, retest.
20. Do not weaken tests, gates, thresholds, assertions, or safety checks to make work pass.
21. Do not claim success without running the relevant validation.
22. Do not claim publication until the remote state is verified.
23. Do not introduce hidden CPU participation into GPU-resident search.
24. Do not introduce hidden domain, evaluator, graph, value, action-space, or memory assumptions into the universal core.
25. Do not encode accidental first-case limits in foundational schemas or types.
26. Do not add general-purpose device allocation to the active hot path without an accepted memory/lifetime design.
27. Do not copy or adapt third-party implementation without exact revision, license, and an explicit reuse decision.
28. Do not expose secrets, arbitrary native addresses, unchecked executable schemas, or unsafe pointer capabilities.
29. Do not silently delete historically relevant guidance; supersede or archive it with provenance.
30. Do not leave stale authority, indexes, component manifests, registry entries, or handoff state after a change.
31. Record genuine blockers and the next coherent action in `next_step.yaml`.
32. Prefer a complete coherent result over many tiny context-reloading cycles.
