# Architectural Decisions

**Status:** Informational

Accepted ADRs are immutable records. A later ADR may supersede or extend an earlier one, but both remain for provenance.

## Current decisions

- [`ADR-0001-prior-art-disposition.md`](ADR-0001-prior-art-disposition.md) — build a new framework; use reviewed projects as bounded references and benchmarks.
- [`ADR-0002-universal-contracts-specialized-engines.md`](ADR-0002-universal-contracts-specialized-engines.md) — preserve universality in contracts and compile finite specialized engines.
- [`ADR-0003-device-resident-active-search.md`](ADR-0003-device-resident-active-search.md) — keep active production search device-closed after ignition.
- [`ADR-0004-large-project-organization.md`](ADR-0004-large-project-organization.md) — organize repository and components for mature scale from inception.
- [`ADR-0005-lego-design-hierarchy.md`](ADR-0005-lego-design-hierarchy.md) — apply domain authority → LEGO → SOLID → CUPID → simplest sufficient total system.
- [`ADR-0006-adversarial-assessment-and-planning.md`](ADR-0006-adversarial-assessment-and-planning.md) — assess before planning, challenge material answers, and keep records proportional.
- [`ADR-0007-proportional-sanity-checking.md`](ADR-0007-proportional-sanity-checking.md) — freeze the target, account for coverage at risk depth, reconcile integration, and preserve findings.
- [`ADR-0008-exact-head-pr-review-and-guarded-merge.md`](ADR-0008-exact-head-pr-review-and-guarded-merge.md) — review exact heads, apply phase/risk independence, guard merge, and verify target integration.
- [`ADR-0009-governed-plan-execution.md`](ADR-0009-governed-plan-execution.md) — execute ready nodes under authority, inspect/falsify coherent operations, and revise deviations.
- [`ADR-0010-cleanup-reconciliation-and-artifact-disposition.md`](ADR-0010-cleanup-reconciliation-and-artifact-disposition.md) — protect pre-existing state and explicitly disposition/verify created or obsolete state.
- [`ADR-0011-focus-branch-decomposition-and-integration.md`](ADR-0011-focus-branch-decomposition-and-integration.md) — use semantic full-attention focus branches and one parent integration spine.
- [`ADR-0012-token-use-and-context-discipline.md`](ADR-0012-token-use-and-context-discipline.md) — optimize verified progress per token, reserve context, route it in layers, and block token debt.
- [`ADR-0013-consolidated-testing-and-repair-loop-efficiency.md`](ADR-0013-consolidated-testing-and-repair-loop-efficiency.md) — bank test intents, consolidate owning capsules, reuse exact evidence, and repair failure clusters at the owner.
- [`ADR-0014-extract-cuda-js-runtime.md`](ADR-0014-extract-cuda-js-runtime.md) — extract generic Node/CUDA runtime/toolchain behavior to independent `CUDA-JS`, retain search semantics and the adapter in UMCGS, and use versioned peer artifacts rather than source coupling.
- [`ADR-0015-engineering-judgment-and-value-ordering.md`](ADR-0015-engineering-judgment-and-value-ordering.md) — map specifications into engineering contracts, eliminate gate-failing paths, order contextual values, compare credible alternatives, and prioritize by consequence, information, and dependency unlock.
- [`ADR-0016-token-backpressure-and-practice-floor.md`](ADR-0016-token-backpressure-and-practice-floor.md) — apply token backpressure from the start of every task, reduce waste/optional breadth/scope before rigor, and preserve a risk-appropriate minimum practice floor.
- [`ADR-0017-selective-spec-and-agent-file-reading.md`](ADR-0017-selective-spec-and-agent-file-reading.md) — discover path instruction chains and the smallest authority-complete document set; classify applicability, read governing authority to semantic closure, and refresh when scope or authority changes.
- [`ADR-0018-universal-core-extension-product-layering.md`](ADR-0018-universal-core-extension-product-layering.md) — separate mandatory universal MCGS semantics, the universal least-authority extension/composition substrate, and downstream domain/search products such as chess.
- [`ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md`](ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md) — require pure Node.js/restricted Device-JS production, preserve narrow asynchronous host interaction, and route naturally generic missing mechanisms to independently qualified CUDA-JS contracts.
- [`ADR-0020-complete-library-and-resolved-defaults.md`](ADR-0020-complete-library-and-resolved-defaults.md) — deliver one complete CUDA-MCGS library through progressive disclosure, with convenience calls resolving into the same explicit, inspectable and versioned configuration path.
- [`ADR-0021-separate-attention-from-root-advance.md`](ADR-0021-separate-attention-from-root-advance.md) — superseded two-operation split retained as decision provenance.
- [`ADR-0022-distinguish-root-advance-reroot-and-attention.md`](ADR-0022-distinguish-root-advance-reroot-and-attention.md) — distinguish initial root, minimum-work advance to an already ready realized successor, general reroot and non-structural attention; preserve compatible descendant work and lazily supersede occurrence-scoped sibling work without eager cleanup.
- [`ADR-0023-parallel-first-native-execution.md`](ADR-0023-parallel-first-native-execution.md) — require the first usable native engine to execute bounded useful GPU work concurrently while keeping physical scheduler topology profile-selected and tensor execution exploratory.
- [`ADR-0024-first-class-neural-evaluator-and-tensor-acceleration.md`](ADR-0024-first-class-neural-evaluator-and-tensor-acceleration.md) — make the neural evaluator connector and qualified tensor acceleration first-class optional core features, strongly recommend tensor variants for eligible workloads, and preserve complete non-neural/non-tensor profiles.
- [`ADR-0025-framework-versus-technique-ownership-for-prospective-evaluation.md`](ADR-0025-framework-versus-technique-ownership-for-prospective-evaluation.md) — make CUDA-MCGS provide reusable framework seams for advanced evaluator/search techniques while leaving prospective frontiers, adaptive depth/width and similar algorithms to selected non-gating future implementations.

Use [`../../agent_files/templates/decision-record.template.md`](../../agent_files/templates/decision-record.template.md). Use [`../../agent_files/templates/engineering-decision.template.yaml`](../../agent_files/templates/engineering-decision.template.yaml) for proportional durable path/value decisions beneath accepted authority. Use [`../../agent_files/templates/document-reading.template.yaml`](../../agent_files/templates/document-reading.template.yaml) only when exact cross-session/review-sensitive authority coverage needs a durable record.
