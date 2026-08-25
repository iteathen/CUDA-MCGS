# Contributing to CUDA-MCGS

CUDA-MCGS is a public pre-release, documentation-first project open to public contribution. The canonical repository is `iteathen/CUDA-MCGS`; existing accepted UMCGS identifiers remain stable specification and governance identifiers.

Before making a material change, read [`AGENTS.md`](AGENTS.md) and the relevant governance/specification files it routes to. The project is intentionally contract-first: proposals and experiments do not silently authorize production implementation.

## Public contribution workflow

Use the normal public GitHub contribution model:

1. Open or reference an issue when the change is substantial, architectural, security-sensitive, cross-component, or likely to require design/specification work.
2. Fork `iteathen/CUDA-MCGS` or create a short-lived topic branch when you have appropriate repository access.
3. Keep one pull request to one coherent ownership-sized outcome. Do not bundle unrelated cleanup or speculative redesign.
4. Rebase/update from current `main` before final review when the base materially affects the change.
5. Run `./scripts/verify-docs.sh` for every durable repository change plus every task-specific capsule required by the affected contract.
6. Fill in the pull-request template honestly, including checks not run, evidence gaps, cleanup state, third-party provenance, and contributor declarations.
7. Maintainer review decides integration. A PR, green CI result, or external approval is evidence—not permission to bypass accepted contracts or repository policy.

`main` is the integration trunk. The intended public-repository posture is protected `main`, CODEOWNERS/owner review for foundational authority, and public GitHub Actions for portable/documentation/reference checks. Exact repository settings remain GitHub configuration and must be verified after the visibility/protection change.

## Security reports

Do not file exploitable security details in a public issue. Follow [`SECURITY.md`](SECURITY.md) for private vulnerability reporting and incident handling.

## Contribution license grant

CUDA-MCGS uses `AGPL-3.0-or-later` plus a separately negotiated commercial-license path. To preserve both options, by submitting a code contribution you represent that you have the right to submit it and agree that:

1. the contribution may be distributed under `AGPL-3.0-or-later`;
2. you grant the CUDA-MCGS project owner a perpetual, worldwide, non-exclusive, royalty-free, irrevocable copyright license to use, reproduce, modify, prepare derivative works of, publicly display, publicly perform, sublicense, relicense, and distribute the contribution;
3. you grant the CUDA-MCGS project owner and downstream recipients a perpetual, worldwide, royalty-free patent license for patent claims you can license that are necessarily infringed by your contribution alone or in combination with CUDA-MCGS; and
4. you retain ownership of your contribution and receive no payment or commercial-license revenue right unless a separate written agreement says otherwise.

Mark the contributor declaration in the pull-request template. The maintainer may require a separate signed contributor agreement before accepting a material contribution. If you cannot agree to these terms, do not submit code; an issue describing the problem or idea is welcome.

See [`LICENSING.md`](LICENSING.md).

## Before production implementation

A production change needs, proportionally to its consequence:

- the mandatory operating kernel and every target-path instruction chain;
- the smallest authority-complete reading set: direct governing authority, required normative references, triggered specialist doctrine, and material producer/consumer/lifecycle/test/cleanup adjacency;
- a proportional assessment whose disposition permits implementation;
- an engineering contract covering outcome, consumers, authority, semantics, bounds, resources, lifecycle/failure/recovery/cleanup, compatibility, non-goals, and completion evidence;
- traceability from material specification obligations to owners, mechanisms, failure consequences, and test capsules;
- explicit resolution or blocking of specification ambiguities, conflicts, gaps, stale meaning, unimplementable obligations, and oracle mismatches;
- credible alternative paths, decisive evidence, selected-path rationale, accepted tradeoffs, confidence, and revisit triggers;
- a clear product-area/component owner and accepted contract authority;
- a current dependency-ready plan/focus branch;
- a test strategy tied to owned invariants, authoritative oracles, evidence invalidation, escalation tiers, and consolidation;
- validation capable of falsifying the selected path and final integrated behavior;
- prior-art/provenance inspection where it can reshape the design.

Do not begin production implementation merely because an issue or proposal exists.

## Selective specification and agent-file reading

Do not recursively read the whole repository, and do not read only the files named in a request.

For every material task:

1. state the task signature—outcome, target paths/symbols/artifacts, operations, owner, claim, and exact revision;
2. read the mandatory kernel;
3. discover every applicable `AGENTS.md` from repository root toward each target path;
4. use registry, indexes, manifests, stable IDs, search, and references to find direct authority;
5. check status, owner, scope, version, revision, and supersession before applying a document;
6. read governing and materially triggered documents to semantic closure;
7. scan material producers, consumers, dependencies, generated forms, persistence, lifecycle, tests, packaging, security, and cleanup;
8. reroute when scope or authority changes;
9. refresh the final changed surface before acceptance or review.

Accepted status does not imply universal applicability. Proposals, research, architecture, examples, implementation, tests, plans, PR descriptions, and summaries remain beneath accepted authority.

## Engineering judgment and value ordering

Specifications are obligations, not themes. Existing code, tests, comments, examples, plans, and previous agent output are evidence—not automatic authority.

Eliminate paths that fail authority, safety/security, semantic correctness, required accuracy/deadline/resource/compatibility, lifecycle, recovery, or evidence gates before comparing preferences. When no subsystem-specific order exists, use the accepted fallback:

```text
authority / legality / explicit ethics
    → unacceptable irreversible harm
    → semantic correctness and hard mission bounds
    → mission-sustaining reliability / compatibility / operability
    → mission quality and performance
    → maintainability / usability / observability / portability
    → delivery speed / token cost / convenience / polish
```

Choose the lowest complete total system, not the easiest file change.

## Token backpressure, testing, and cleanup

Token/context pressure applies to every contribution but never justifies skipping required evidence, safety, cleanup, or review. Reduce duplication and optional breadth before reducing scope; reduce scope before reducing rigor.

Capture material test intents when discovered, use minimal reproducers, consolidate durable cases into owning capsules, reuse exact unchanged evidence, and cluster failures by root cause rather than repeating broad test runs.

Protect user/pre-existing work, project authority, evidence, recovery state, shared resources, protected branches, and active dependents. Every material generated, diagnostic, local, remote, sensitive, or external artifact receives an intentional disposition.

## Third-party code and generated artifacts

Do not include credentials, machine-specific private paths, CUDA Toolkit binaries, NVIDIA proprietary files, third-party code, datasets, diagrams, generated artifacts, or substantial copied documentation without exact provenance and compatible licensing.

Source adaptation/vendor decisions require exact upstream revision, license, local-change record, and explicit reuse disposition. See [`third_party/README.md`](third_party/README.md), [`LICENSING.md`](LICENSING.md), and the research policy.

## Documentation and validation

Substantial Markdown below `docs/` must carry a recognized status and support selective discovery through clear ownership, scope, references, indexes, and supersession.

Run:

```bash
./scripts/verify-docs.sh
```

The workflow in [`.github/workflows/docs.yml`](.github/workflows/docs.yml) is prepared to provide public portable documentation/reference CI after visibility changes. Native CUDA claims still require exact-profile native evidence; public CI does not magically qualify unsupported platforms.

## Pull requests

Before requesting review:

- freeze the exact head/base and account for the complete changed surface;
- show governing documents and affected contracts for material work;
- state expected/actual effects and the decisive falsifier;
- disclose evidence keys, checks not run, unsupported platforms, and claim limits;
- disclose third-party provenance, contributor-license agreement, security implications, cleanup state, and remaining debt;
- keep the branch stable while exact-head review is active or explicitly invalidate stale review evidence after changes.

Every material PR receives complete author-side review. Independent review is required when phase, repository policy, owner instruction, or objective consequence triggers it. Merge is a separate guarded transaction followed by target/branch/dependency/cleanup verification.

## Historical private-intake workflow

Before the public-transition preparation, outside contributors used standalone private intake repositories because a free private personal repository could not provide the intended branch-protection boundary. That workflow is superseded for the intended public state and is retained only in repository history/provenance; do not create new intake repositories unless a future security/access requirement explicitly re-authorizes them.
