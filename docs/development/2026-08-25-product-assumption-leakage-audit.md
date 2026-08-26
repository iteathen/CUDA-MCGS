# Chess and Connect Four Assumption Leakage Audit

**Status:** Informational

**Claim class:** Bounded self-sanity record

**Date:** 2026-08-25

**Frozen input:** protected `main@e1ca19132d79f3c2a15fd0f7fe5b78a190c0371b`

**Correction branch:** `codex/session-attention-01`

**Canonical issue adjacency:** [#113](https://github.com/iteathen/CUDA-MCGS/issues/113)

## Claim and boundary

This is a bounded complete-inventory review of whether chess or Connect Four meaning currently shapes CUDA-MCGS universal authority, accepted/proposal Search IR schemas, CUDA-free normalizers/reference composition, generated semantic inputs or dependency direction. It is implementation self-sanity rather than independent review because the repository currently has one maintainer and the project owner explicitly waived an impossible independent-maintainer rule.

The inventory covers all 244 paths tracked at the frozen input. Deep semantic review is limited to current universal source-of-truth and executable/reference surfaces. The chess product proposal and Connect Four/persistent-session experiments are checked for ownership and dependency isolation, not judged as product implementations. Archive snapshots and prior-art descriptions are excluded from current-authority conclusions because their owning indexes mark them historical/informative; their importability and labeling are still checked. There is no production CUDA-MCGS runtime to inspect.

The expected invariant comes from the project charter, ADR-0018, SPEC-0000 and the root agent rules: no game, board, player count, alternating turn, zero-sum/scalar value, fixed action/state size, deterministic transition, ranked move or first-product output may become universal meaning. A product can select public universal profiles and contribute namespaced product data, but universal schemas and Composer paths cannot import or reinterpret product internals.

## Coverage map and result

| ID | Semantic branch | Included surface and decisive evidence | Result |
|---|---|---|---|
| `GAME-LEAK-AUTH-01` | authority/ownership | Charter, ADRs, current agent/registry records, normative SPEC-0000/0006–0013, product specification boundary and documentation indexes | `supported`: product terms occur as explicit exclusions, counterexamples or downstream ownership, not universal requirements. |
| `GAME-LEAK-IR01-01` | accepted foundation | Search IR 0.1.0 schema, normalizer, fixtures and deterministic reference | `supported_with_limits`: its synthetic behavioral fixture uses a scalar toy backup, but the schema does not mandate player/board/game meaning and the capsule is explicitly a narrow SPEC-0001 foundation rather than the universal policy/evaluator/output contract. No proposal Composer imports it as product authority. |
| `GAME-LEAK-IR02-01` | proposal owner schemas | Every Search IR 0.2.0 schema plus contract/coverage indexes | `supported`: zero chess/Connect Four literals; domain permits decision/chance/automatic/observation/custom roles, arbitrary role counts, sampled/lazy/custom actions and deterministic/stochastic/observation/custom transitions; policy/evaluator/output shapes are selected and namespaced rather than game-fixed. |
| `GAME-LEAK-NORM-01` | executable normalization/reference | All Search IR 0.2.0 normalizers, fixtures and the 862-case pre-audit Composer capsule | `supported`: zero product imports and one existing negative assertion. Structural instances include variable-record transposition/cycles, stochastic history/observation with chance/custom roles, lazy continuous no-player search, scalar/vector non-zero-sum/proof/no-value policy families, evaluator absence/proposal/evaluation/combined modes and terminal/live output variants. |
| `GAME-LEAK-COMPOSE-01` | composition/generated boundary | Framework selection, Program Package, Search Program, execution-package projection, resolved Composer input and deletion records | `supported`: selected owners are bound by public identity; `productData` remains namespaced; CUDA-JS projections contain no MCGS or product meaning; no product experiment is imported. A repository case now rejects direct chess/Connect Four/game-shape residue across normalized universal profiles/packages. |
| `GAME-LEAK-PRODUCT-01` | product isolation | `docs/specs/products/chess/`, `experiments/connect4-mcgs-prototype/` and `experiments/persistent-session-mcgs-prototype/`, plus import graph scans | `supported_with_limits`: product/domain assumptions exist only inside their named downstream proposal/experiments. No universal executable capsule imports them. The complete first-product deletion matrix remains the already planned `IR-DELETION-ID-01` gate rather than evidence claimed complete here. |
| `GAME-LEAK-HISTORY-01` | retained provenance | archive pointers/snapshots, research and prior-art records | `supported`: occurrences are labeled historical/informative and have no executable import path into current universal schema/reference work. |

## Semantic interrogation and counterexamples

The deepest risk is an unnamed structural assumption rather than a literal product name. The owner schemas and normalizers were therefore checked for fixed two-player/alternating roles, mandatory scalar/sign-flip value, deterministic-only transition, exhaustive/fixed action production, board-shaped state, ranked-move output and product-derived defaults. None was found.

The cheapest decisive counterexamples are already materialized in the proposal capsule: a stochastic history-sensitive domain with chance/observation/custom authority, a lazy continuous-action no-player domain, a three-coordinate non-zero-sum policy, a proof-lattice policy, a value-free/proposal-only path, evaluator absence, a distributional evaluator and non-ranked terminal/live outputs. These alternatives pass through the same owner schemas and Composer path without foundational redesign.

The accepted Search IR 0.1.0 reference remains deliberately smaller: its in-memory synthetic schedule uses numeric `valueSum`. That is an instance-local oracle for graph/publication/resource invariants, not a field or default in the accepted Search IR schema and not evidence for universal value semantics. Replacing it is unnecessary and would reopen accepted evidence; claiming it as the universal behavioral reference would be invalid.

The audit also found current proposal terminology still using `reroot` for genuine structural root changes. This was not a chess/Connect Four leak and did not represent attention as a root operation, but it conflicted with ADR-0021's public naming boundary. The same correction replaces current universal proposal/schema/reference vocabulary with `root advance`; historical/product-prototype evidence retains its original language where provenance matters.

## Findings and disposition

No confirmed chess or Connect Four assumption leakage was found in the declared universal surfaces.

One existing evidence gap remains: the integrated full cross-profile/first-product deletion matrix has not yet run. It is already owned by `IR-DELETION-ID-01`; this audit does not create a duplicate issue or overstate the current negative-name/import/second-instance evidence as complete deletion qualification.

The terminology observation is remediated by ADR-0021, revised current proposal documents, the domain `root-advance` reuse boundary and the Session attention/root split in this correction. All affected proposal source and composed identities are invalidated and must be regenerated. Accepted Search IR 0.1.0, historical archive bytes and isolated prototype implementations remain unchanged.

## Validation and limits

Final validation completed the 864/864 expanded Composer capsule, accepted Search IR 0.1.0 regression, retained extension evidence, structured-data/link/organization gates, repository-wide product-name/import scans and exact-head diff review. This audit does not prove product deletion beyond the bounded existing cases, production behavior, native Device-JS/CUDA execution, search quality, performance or a compatible pair.
