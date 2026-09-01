# Evaluator fixture qualification resume — 2026-09-01

**Status:** Informational

## Scope

This checkpoint records the bounded correction for CUDA-MCGS issue #36 / PR #162. It does not change Evaluator oracle behavior, Resource/Progress/Output behavior, native/CUDA realization, tensor math, product semantics, or protected `main`.

## Assess → research → reassess

SPEC-0009 section 18 requires the minimum conformance matrix to exercise a finite resumable evaluator under cache interaction, including mutable-state invalidation. The fifth Composer evaluator fixture already owned mutable state, bounded continuation, pressure/cancellation semantics, and the `state-generation` key fact. PR #162 correctly selected the existing cache contract on that same fixture, but `run.mjs` still asserted that its cache kind was `none`.

The demonstrated defect was therefore a stale Composer conformance expectation, not a missing Evaluator abstraction and not a reason to add another fixture.

## Implemented correction

Exact semantic correction commit:

`2d651d04baf847ccfa71202b81e0c3fab7843d78`

The existing `evaluator-profile-second-instances-distinct` case now asserts that the fifth evaluator simultaneously has:

- mutable state selected;
- bounded continuation;
- cache selected; and
- a cache key containing `state-generation`.

The existing 881-case Composer authority remains unchanged. No new case, schema, owner, evaluator mechanism, runtime mechanism, or product behavior was added.

## Bounded transport and cleanup

The available GitHub mutation interface replaces whole files, while `experiments/search-ir-composer-reference/run.mjs` is very large. A branch-specific one-shot workflow was therefore used only as a bounded transport mechanism. It:

1. required exactly one match for the obsolete expectation;
2. applied only the intended block replacement;
3. ran `git diff --check`;
4. ran `node scripts/run-search-ir-composer-reference.mjs`; and
5. removed itself before committing the semantic correction.

Workflow run `33548041083` succeeded. The temporary workflow is absent from the resulting branch tree and is not part of the PR diff.

## Requalification method

The corrected Evaluator fixture changed the exact Composer representation/composition evidence identity while retaining the same canonical byte length. Permanent Domain, Policy, and Graph references intentionally pin exact upstream evidence, so their initial failures were classified owner by owner before any rebind.

The requalification rule was:

1. run the owner against the corrected upstream packet;
2. distinguish behavioral failure from exact-identity mismatch;
3. if and only if the mismatch was identity-only, rebind that owner's frozen evidence;
4. rerun and require all behavioral cases to pass;
5. propagate only the newly qualified owner identity to declared downstream consumers.

No bulk hash replacement was used.

During the Policy rebind, one whole-file edit accidentally replaced the branch's exact 24-case expected bank with a larger case list. CI rejected that mutation. The original case bank was restored byte-for-byte while retaining only the demonstrated identity rebind. Policy then qualified green. This correction is preserved here because it is part of the audit trail and demonstrates that the conformance gate caught an unintended widening.

The first ROOT rebind also tested an explicit hypothesis that the root-control projection identity would remain unchanged. CI falsified that hypothesis before ROOT behavior executed: the projection retained 10,489 canonical bytes but changed identity. Only that exact binding was corrected, after which ROOT qualified 14/14.

## Qualified evidence chain

The exact qualified identities on substantive branch head `99a954667420a3115b1687309c7c14b61e65f44c` are:

- Composer representation/composition: `1285fa9abdf70ba6902aae0d0f86a14b9a23b2c56b2aa8f5168970c0003124f2` — 727,811 bytes — 881/881 cases;
- Domain profile projection: `2969026db4ff676c105379c86ccf49efdaae79237e598d0d3b88c03cb7c65d40` — 69,524 bytes;
- Policy profile projection: `685b1c21acf378ce781c0345c15dc32143063c85861836bb213ad87a58bd0da4` — 123,882 bytes;
- Graph profile projection: `df32692fbb7220586a4a050858abd19bdf74f86a63705a8f5b8b33994814e6d6` — 140,331 bytes;
- Graph NODE: `9c814f4d2560fe43cae105c36872be52d245a370a57885ade09e11509c53f9dc` — 10,047 bytes — 13/13 cases;
- Graph EDGE: `2787b93ac23dacfd6bbd751c91f213ba644ad0090eb7db7ab5c354c5b927017e` — 11,661 bytes — 16/16 cases;
- Graph REF: `0f91b1ee1584b1e71e84948624c3c861974b03814d0e9accac7426b5794f9449` — 9,139 bytes — 14/14 cases;
- Graph PATH: `a25137cedfd849fb2d7e4ac44cceb2935358f88a91af26f10b38caf6b2f67cc3` — 9,530 bytes — 14/14 cases;
- root-control projection: `291ced1ef95b1302563767c92693f560eb3b7367dafa1e59ab1a880aabc8a67c` — 10,489 bytes;
- Graph ROOT: `c22e69d41052303826c43f47fa6027bc653ad75f663ae500f2cc1904d75ccf04` — 10,008 bytes — 14/14 cases;
- Graph RECLAIM: `f4611abd07aa8bf8955361a981f1e396d08d5db503a3652408741d40c3426025` — 12,127 bytes — 17/17 cases;
- Graph ADVANCE occurrence closure: `d4659df64fd056e7d83bb426516f3abfba041e3ad301cbba9114f2e35696ccd9` — 4,195 bytes — 5/5 cases;
- Graph CLEANUP: `0bdf031c8d0a206d9316a913d7e56da9cfa0d62b60f947edd0549a7949395611` — 5,466 bytes — 6/6 cases.

## Permanent qualification

Ordinary PR workflow `33549767846` on substantive branch head `99a954667420a3115b1687309c7c14b61e65f44c` completed successfully.

It passed:

- governance verification;
- Search IR reference on Ubuntu;
- Search IR reference on Windows;
- Policy reference;
- Graph NODE;
- Graph EDGE;
- Graph REF;
- Graph PATH;
- Graph ROOT;
- Graph RECLAIM;
- Graph ADVANCE occurrence closure;
- Graph CLEANUP; and
- the aggregate fail-closed `verify` gate.

The Composer capsule remained exactly 881 discovered / 881 executed / 881 passed / 0 failed throughout the qualified final Graph chain.

## Claim limits

This establishes that the required combined resumable + mutable-state + cache fixture is present and that its corrected representation can be propagated through the existing Domain/Policy/Graph reference evidence without a demonstrated semantic regression.

It does not establish final REF-EVALUATOR-01 behavioral acceptance, native CUDA realization, CUDA-JS compatible-pair qualification, CUDA-JS-Tensor realization, performance, or product/chess semantics. Those remain owned by their existing downstream issues and PRs.

## Next action

PR #162 is ready for ordinary review/merge into `experimental/portfolio` if repository review policy is satisfied. After it lands, rebase/reassess draft PR #160 against the exact new `experimental/portfolio` head and continue REF-EVALUATOR-01 whole-spec review. Do not move directly to native/runtime construction before evaluator semantic acceptance and the later atomic acceptance gate.
