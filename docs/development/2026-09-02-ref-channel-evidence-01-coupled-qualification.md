# REF-CHANNEL-EVIDENCE-01 coupled qualification follow-up

**Status:** Informational

## Scope

This note records qualification defects discovered only after the Channel owner-local semantic/evidence work was green. They are not additional Channel semantic authority.

Exact construction base remains `experimental/portfolio@ce21cc382bedb28647c244df1c53bf0d6c98cff0`. Protected semantic authority remains `main@3ecac11e3576bd063760bc9572f79bea78acd031`.

## Downstream exporter defect

PR #191 qualification showed Channel and Stage green while Session, Terminal, Framework and the repository matrix failed after the Composer capsule completed `899/899` successfully.

The first raw failure was in `export-domain-profiles.mjs`: seven profile exporters duplicated the old Composer summary as an exact literal `881/881`; the Session and Stage exporters used a partial producer-summary check that did not assert all skip classes or exact executed/passed closure.

This was a qualification-harness defect. The Composer capsule is the natural owner of exact case discovery count; downstream projection exporters should consume the producer evidence as a complete passing subject and then prove their own exact projected identities.

Permanent repair:

- added private `assertCompletePassSummary()` to the existing Composer validation utility;
- applied it to all nine profile exporters;
- retained Composer's own exact `899` discovery assertion unchanged;
- qualified all nine exporters after regenerating Composer evidence before committing.

Guarded repair run `33701820741` passed Composer regeneration and every exporter. Permanent exporter repair commit: `5cbedcac097cc349b4137b3642f2c5f393f096a8`.

The temporary exporter repair workflow/script were deleted afterward.

## Framework provenance defect

After exporter repair, Channel, Stage, Session and Terminal passed but Framework still failed. Raw Framework evidence showed two sequential stale bindings:

1. `run-framework-lifecycle.mjs` duplicated the old `881/881` Composer summary;
2. after removing that duplicate count in a guarded candidate, the checked-in Framework fixture still pinned the previous Composer `representationCompositionEvidenceKey`.

The second failure was not repaired by mechanically changing a hash. The fixture's `composerEvidence` and the three synthetic `semanticIdentity` values were confirmed to be deliberately derived from the prior Composer evidence SHA.

The guarded repair therefore:

1. regenerated the exact current Composer evidence first;
2. required a complete zero-failure/zero-skip producer pass;
3. derived the new Framework fixture `composerEvidence` from the generated `representationCompositionEvidenceKey`;
4. verified the previous three synthetic semantic identities were internally derived from the previous pinned Composer SHA;
5. regenerated those semantic identities from the new evidence SHA;
6. ran the complete Framework lifecycle reference before committing.

Generated Composer evidence identity at that qualification point:

- SHA-256: `1bf7703fc7758c18f0f74e7573eb126410f8ad09b1e60145cbeaccdef20e10e2`
- canonical bytes: `729040`

Guarded Framework repair run `33703061059` passed. Permanent Framework repair commit: `8b853352bdbbd05e1ed4773cecb3d3c728aac557`.

The temporary Framework repair workflow/script were deleted afterward.

## Full reference provenance transition

The next full repository matrix made the remaining scope visible. Composer and the affected profile projections were green, but Graph, Policy, Evaluator, Resource, Progress and Output references rejected checked-in fixtures that still pinned the pre-Channel Composer/projection/evidence identities. Governance also correctly rejected `next_step.yaml` after its required `deliverables` and `validation` arrays had been dropped during an earlier current-state rewrite.

A temporary read-only provenance audit regenerated the producer artifacts and established the current identities before any fixture rewrite. Audit run `33703526051` passed. The current Composer composition-evidence identity was `1bf7703fc7758c18f0f74e7573eb126410f8ad09b1e60145cbeaccdef20e10e2`, `729040` canonical bytes; the Domain, Graph, Policy, Evaluator and Resource projection identities also changed because their projection subjects bind that Composer evidence identity.

The first guarded dependency-ordered rebind attempt, run `33703864307`, intentionally committed nothing. After direct producer fixture bindings were regenerated in the working copy, all Domain cases passed but the neutral reference harness produced 18 failures. The cause was another qualification-layer duplication: `experiments/search-semantics-reference/run.mjs` still asserted the old exact `881/881` Composer summary and the three declared schedules in `neutral-schedules.json` still carried the prior Composer evidence-key SHA. That red was preserved and the attempted fixture transition was discarded.

The corrected rebind then treated provenance as a dependency graph rather than a list of hashes:

1. regenerate Composer evidence and the current profile projections;
2. regenerate direct Composer/projection fixture bindings plus the neutral schedule evidence keys, while making the neutral harness consume a complete Composer pass without duplicating the case count;
3. qualify Domain/neutral, Graph NODE, Policy, Evaluator, Resource, Progress and Output;
4. derive Graph EDGE and REF bindings from the freshly passing NODE evidence;
5. derive PATH from current NODE/REF evidence;
6. derive ROOT from current NODE/REF/PATH evidence and current root-control projection;
7. derive RECLAIM from current NODE/EDGE/REF/PATH/ROOT evidence;
8. derive ADVANCE occurrence from current NODE/EDGE/REF/PATH/ROOT/RECLAIM evidence;
9. derive CLEANUP from all current upstream Graph evidence;
10. reject the transition if the old Composer evidence identity remained anywhere in the affected fixture set.

Guarded run `33704058479` passed every stage of that chain before retention. The permanent provenance transition was committed as `8a88eb37809c978cf30ba7e3fa08dc7001be80c1`. The resulting checked-in changes are provenance/evidence bindings plus the neutral harness producer-completeness check; they do not alter Domain, Graph, Policy, Evaluator, Resource, Progress or Output semantics.

All temporary provenance audit/rebind workflows and scripts were deleted after the successful commit. `next_step.yaml` was then restored to its required governance shape with current `deliverables` and `validation` arrays rather than weakening the governance verifier.

## Ownership conclusion

The repairs preserve the existing LEGO boundaries:

- Composer owns exact case discovery and generated composition evidence identity;
- profile exporters consume producer completeness and own only their exact projections;
- Framework consumes the exact Composer evidence identity and owns Framework lifecycle semantics only;
- downstream reference fixtures bind explicit producer/evidence provenance but do not become semantic owners;
- Channel remains the sole owner of SPEC-0004 internal item/publication/ownership-transfer meaning;
- Resource and Progress authority remain with SPEC-0011 and SPEC-0012;
- native publication/synchronization realization remains with CUDA-JS.

No native code, PTX, private CUDA-JS route, scheduler topology, host progression loop or product semantics were added.

## Final gate

The cleaned PR #191 head must now pass Channel, Stage, Session, Terminal, Framework and the complete repository/documentation matrix on one exact SHA. A fresh complete base-to-head author review is then required. Exact final run IDs, artifact identity and review subject are recorded on PR #191 and issue #33 rather than by another source commit solely to copy CI metadata.
