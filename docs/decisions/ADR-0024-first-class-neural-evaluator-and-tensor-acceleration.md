# ADR-0024: First-Class Neural Evaluator and Tensor Acceleration

**Status:** Accepted

**Date:** 2026-08-25

## Context

CUDA-MCGS must support evaluator absence, analytic heuristics, proof/table/constraint systems, learned models and future evaluator forms without making one of them universal. Neural evaluators are nevertheless an important expected use, and their dense inference work is the strongest currently identified opportunity for Tensor Core acceleration.

Treating neural integration as an external afterthought would export model packaging, input/output meaning, device residence, batching, workspace, precision, failure and reuse complexity to every product. Treating tensors as mandatory would fail the framework's universality and impose shape, precision, packing and resource costs on evaluators and searches that do not benefit.

The project owner therefore requires tensor acceleration to be optional but strongly recommended where it naturally fits, and to be a first-class CUDA-MCGS core feature rather than an unplanned extension. The researched disposition is recorded in [`2026-08-25-tensor-math-in-mcgs-assessment.md`](../research/2026-08-25-tensor-math-in-mcgs-assessment.md).

## Decision

CUDA-MCGS will provide a first-class optional **neural evaluator connector** and a first-class optional tensor-acceleration path for eligible owner-local work. "Core feature" means the universal library, Search IR/Composer, resource/progress planning, conformance, public SDK and release criteria deliberately support selecting, inspecting, specializing and deleting these capabilities. It does not mean every engine contains a neural evaluator, tensor representation or Tensor Core code.

A complete concrete engine may select evaluator absence or a non-neural/non-tensor evaluator. When a neural evaluator has a compatible qualified tensor execution variant and the selected hardware/resource/profile can benefit, CUDA-MCGS documentation and convenience defaults strongly recommend that variant. An explicit caller may select a conforming non-tensor variant. The resolved choice, reason, evidence class and compatibility identity are inspectable and fixed before ignition under [`ADR-0020`](ADR-0020-complete-library-and-resolved-defaults.md).

No tensor path may redefine Domain, Graph, Policy, Evaluator, Resource, Progress, root-control or result semantics. Tensor acceleration is an implementation variant behind the owner of the mathematical operation. Authoritative graph identity/storage, transposition publication, exact counters/generations, ownership, cancellation, reclamation, attention and `advance` remain free of mandatory tensor transformation or reduced precision.

## Neural evaluator connector boundary

The neural evaluator connector is the public convenience/composition seam for constructing one selected [`SPEC-0009`](../specs/SPEC-0009-evaluator-contract.md) evaluator profile from neural-model inputs. Its stable public class/function names remain future SDK work, but every public form resolves through one canonical pipeline.

Conceptually it composes four replaceable responsibilities:

1. an evaluator-owned input encoder mapping declared immutable Domain/product public views into bounded model inputs without redefining Domain identity, history, roles, actions or outcomes;
2. a resident model executor owning model artifact/parameter identity, execution variants, supported shape/precision classes, bounded workspace, numeric behavior and model-local failure;
3. an evaluator-owned output mapper publishing typed evaluator capabilities and validity metadata without deciding Policy use, Domain action validity, Graph storage or external result meaning; and
4. evaluator batching integrated with device-owned Progress for finite request accumulation, compatible full/partial batch execution and incarnation-safe scatter without a host inference loop.

The connector may expose progressive-disclosure overloads equivalent in meaning to:

- a self-describing resolved model package using documented defaults;
- the same package plus ordinary batching/precision/cache/reuse overrides; and
- fully explicit encoder, executor, output-capability, batching, resource and lifecycle selections.

All forms normalize before admission into the same evaluator profile, framework selection, Search IR, Search Program and execution-package path. A convenience overload cannot create a second runtime, omit required semantics, guess model meaning from sample tensors or adapt hidden search semantics after ignition.

## Resolved neural model package

The canonical connector input is a resolved CUDA-MCGS neural evaluator package, not one external framework's live model object. The package declares at least:

- content/provenance and compatible evaluator/domain/product identities;
- input and output schemas, semantic coordinates, shapes and bounds;
- artifact/parameter generations and pre-ignition residence;
- available execution variants and their hardware/CUDA-JS compatibility;
- numeric precision, tolerance/determinism and invalid-output behavior;
- batch compatibility, padding-lane isolation, partial-batch progress and scatter identity;
- persistent, per-item, per-batch and continuation workspace formulas;
- failure, cancellation, cleanup, cache and root-reuse behavior; and
- finite resource contributions for each selected variant.

ONNX, TensorRT or another model ecosystem may later have an importer/compiler adapter that produces this resolved package. No external format or runtime owns the universal connector. Import and compilation complete before ignition. An external inference runtime is usable only when its selected integration preserves device-owned active-search progress; a required host gather/enqueue/poll/relaunch loop is nonconforming.

## Tensor recommendation and qualification

Tensor support is strongly suggested, not blindly selected. A convenience resolver may recommend or select a tensor variant only from declared pre-ignition facts and versioned qualification evidence, including operation/shape class, batch/resource bounds, precision compatibility, target hardware and public CUDA-JS capability compatibility. The decision is explicit, overridable and identity-affecting.

Qualification compares the complete owner boundary against the best credible non-tensor parallel variant. It includes device queueing, batch-fill and tail behavior, packing, padding, conversion, workspace, synchronization, scatter, failure/cancellation and cleanup. It measures useful search throughput, quality at fixed wall time and fixed work budget, numeric equivalence, tail latency, memory high-water and resource pressure. Tensor utilization or isolated GEMM throughput alone is insufficient.

CUDA-MCGS owns evaluator meaning, batching compatibility, selection/recommendation policy and search-quality evidence. A required generic GPU matrix/tensor/library mechanism belongs behind a versioned public CUDA-JS contract and is requested only from a concrete selected profile. CUDA-MCGS does not add native code, private CUDA-JS access or a tensor workaround.

## Initial implementation bounds

The first connector implementation should target the smallest useful qualified neural profile:

- immutable inference artifacts/weights during active search;
- pre-ignition loading and finite model/workspace resources;
- explicit bounded input/output shape classes;
- bounded device-owned dynamic batching with partial-batch progress;
- typed multi-head/capability output and exact request scatter;
- declared precision/equivalence and optional exact-key cache;
- no training, host inference callback or hidden allocation/spill; and
- one resident logical model instance per selected GPU, with per-device resources and batches.

Initial multi-GPU execution replicates the immutable model package per participating device and batches locally. Cross-device inference queues, model sharding, shared mutable weights and collectives are later profiles requiring independent semantics and evidence; they are not implied by the connector.

These bounds select a first implementation, not a permanent neural-network architecture, model format, fixed action width or value shape.

## Dependency availability update

As of 2026-08-26, public `cuda-js-tensor@0.1.0-alpha.6` at protected `main@9ecc1d78bca989ec456c897dec215e82ce4cd311` provides the consumer-neutral item-parallel device-callable Tensor mechanism needed by this direction. One caller-owned Device-JS participant evaluates one statically independent item through a typed leaf library; independent selected-device sessions compile for their own CUDA-JS targets. The exact disposition and claim limits are recorded in [`2026-08-26-cuda-js-tensor-device-callable-readiness.md`](../development/2026-08-26-cuda-js-tensor-device-callable-readiness.md).

This closes external mechanism availability only. It does not implement the CUDA-MCGS neural connector, choose evaluator batching/search policy, qualify a performance recommendation, or bypass the current semantic/reference dependency order.

## Consequences

- Neural evaluators are easy to configure without becoming the universal evaluator assumption.
- Tensor acceleration has an intentional core roadmap, conformance boundary and release obligation rather than remaining a best-effort experiment.
- The first parallel native correctness engine remains dependency-ready without tensor support; tensor qualification follows representative native shape evidence and does not interrupt the current reference target.
- A complete public release must document the connector, preserve evaluator-absent/non-neural deletion, and qualify at least one representative tensor-accelerated neural path before claiming this core feature complete.
- Non-neural, shape-hostile, latency-sensitive or hardware-incompatible profiles remain complete and supported through selected non-tensor execution.
- Tensor acceleration of policy, Domain dynamics, reductions or derived graph views remains possible through the same owner-local evidence rule; neural evaluation is the first priority, not exclusive ownership of all future tensor work.

## Alternatives considered

### Leave neural/tensor integration entirely to products

Rejected. Every product would have to reconstruct the same residence, batching, numeric, resource, progress and lifecycle composition, and the complete library would lack a coherent easy neural path.

### Require tensors in every engine

Rejected. Evaluator absence, analytic/proof/table evaluators, irregular work, incompatible precision and small batches are legitimate. Mandatory tensor state would violate deletion and export costs without value.

### Make a raw ONNX or TensorRT object the universal connector

Rejected. It grants one external model ecosystem ownership of universal semantics and may import host-driven execution assumptions. Such formats are adapter inputs, not the canonical boundary.

### Optimize Tensor Core utilization as the objective

Rejected. Useful search throughput and quality under finite resources are the objectives. Competing for Tensor Cores already used by the evaluator or tensorizing cheap irregular work can reduce total performance.

## Compatibility and sequencing

This decision extends ADR-0002, ADR-0003, ADR-0019, ADR-0020 and ADR-0023. It does not supersede their universal, device-closure, CUDA-JS ownership, progressive-disclosure or measurement requirements.

The current `ENGINE-REFERENCE-01` target remains unchanged. `REF-EVALUATOR-01` must later prove neural and materially different non-neural evaluator semantics without requiring native tensor execution. After semantic acceptance and the parallel native baseline, `ENGINE-PERF-01` owns representative tensor/non-tensor qualification. Public SDK/release work owns the connector facade, overload equivalence, resolved-package tooling and user documentation.

## Validation

Before semantic acceptance:

- neural, analytic and proof/table-like profiles normalize through the same evaluator contract;
- evaluator absence and tensor-variant deletion leave exact zero solely owned residue;
- multi-head readiness, batch compatibility, padding, scatter, numeric identity, cache and reuse have discriminating reference cases; and
- convenience and explicit connector forms resolve to the same canonical profile identity.

Before native tensor-profile acceptance:

- the selected neural package is device-resident and makes progress without host inference control;
- tensor and non-tensor variants satisfy the same declared semantic/quality oracle;
- full end-to-end costs and finite resources are measured on an exact hardware/CUDA-JS/CUDA-MCGS pair;
- explicit opt-out selects a complete non-tensor path; and
- cancellation, failure, teardown and per-device multi-GPU cleanup are verified.

## Revisit triggers

Revisit the first profile bounds when representative models require mutable inference state, variable/unbounded shapes, model sharding or cross-device collectives; when external runtimes expose a device-closed integration that simplifies the package; or when evidence shows that another owner-local tensor workload has greater general value than evaluator inference.

## Supersedes / superseded by

This ADR does not supersede an earlier decision. It extends ADR-0023 by promoting qualified tensor acceleration from a merely exploratory lane to a first-class optional core capability while preserving its owner-local, measurement-gated and non-blocking sequencing.
