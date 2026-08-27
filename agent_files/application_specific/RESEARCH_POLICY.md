# CUDA-MCGS Research Policy

**Scope:** Prior art, platform facts, papers, repositories, libraries, hardware behavior, and implementation reuse.

## Research before foundational invention

Inspect existing work when it may already own the boundary, reveal constraints, provide conformance cases, or falsify a proposed design. Evaluate the complete CUDA-MCGS requirement set rather than matching one feature or headline.

## Source priority

Prefer:

1. official CUDA/V8/Node/toolchain documentation and headers;
2. primary research papers and author repositories;
3. exact source at pinned revisions;
4. reproducible benchmarks;
5. secondary summaries only to discover primary sources.

## Evidence separation

Every research record separates:

- verified source observation;
- source/author claim not independently reproduced;
- inference;
- proposal;
- unknown or inaccessible detail.

Record inspection date, exact revision/version, relevant paths, license, hardware/software context, and revisit trigger.

## Candidate evaluation

A candidate framework is assessed across:

- graph/transposition/cycle/history semantics;
- device closure;
- resident evaluator workflow;
- domain/action/value/output generality;
- finite memory and pressure behavior;
- specialization;
- persistence/rerooting;
- implementation availability and maintenance;
- license and reuse implications.

Do not decide “already done” or “not done” from a project name or abstract.

## Licensing and private pre-release work

CUDA-MCGS may continue original private pre-release design and implementation without selecting its final project license.

License selection becomes necessary before public release/distribution and before adopting third-party implementation where compatibility or redistribution matters. Until then:

- research and compare freely;
- record exact third-party licenses;
- do not copy or adapt source into production without an explicit reuse decision;
- prefer independent implementation from public behavior/contracts when licensing is uncertain or incompatible;
- preserve attribution and provenance for any permitted reuse.

## Reproduction

Performance or correctness claims that affect architecture should be reproduced on representative hardware/workloads where practical. When reproduction is unavailable, label the claim and avoid making it the sole basis of an irreversible decision.

## Durable output

Research belongs under [`../../docs/research/`](../../docs/research/README.md). Decisions derived from it belong in ADRs/specifications. Research notes never silently become normative.
