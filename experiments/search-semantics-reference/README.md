# CUDA-MCGS search-semantics reference experiment

**Status:** Informational

This CUDA-free experiment is the behavioral reference/conformance capsule for `ENGINE-REFERENCE-01`. It is deliberately split into owner-local LEGO bricks rather than one reference engine. Current completed Graph bricks are NODE/transposition, EDGE/expansion, REF/reference-protection and PATH/occurrences. The current hosted-qualified candidate adds ROOT/protected-anchor semantics; RECLAIM and later owners remain unfinished.

## Current ROOT candidate

Branch: `ref/graph-root-01`  
Protected base: `main@e4069458ece47bbea0c2770204fa21fffbde6bb6`  
Hosted semantic checkpoint: `d6b091e7c1afc6c09eb7e562cd7f72eb2773874d`  
Qualification run: `33107176873`

ROOT is not protected-main integrated until the final PR is squash-merged and reproduced on the squash SHA.

Exact candidate evidence:

- Composer `879/879`; representation/composition `ca5119c2d50e6ba218ab962ede9ad94d8c90f1d031b008ab74d92166d0ef4529`;
- Domain `49/49`, direct `47/47`; evidence `f186412a9b8d964c7f92e4c4000942768fa0ae81d62349c2528fd3aba12aa5e7`;
- Graph projection `89ee04a47d8516ad02e33e884d8f35db9573840f58db140c6cbafe79178e7fd7`;
- NODE `13/13`, direct `11/11`, evidence `4299dccecd33f6ef38c50f144e84316d00c7046a81ed6206b6e2e645b6683f74`;
- EDGE `16/16`, direct `10/10`, evidence `54b83935d320e6bd656c740ec2f3d8be062e3932bdf6e748c8315f26245faf58`;
- REF `14/14`, direct `8/8`, evidence `e3370158d1234dd3642d11c4458c9c390abcc3f62a04a75dd68d00faf6c4676d`;
- PATH `14/14`, direct `8/8`, evidence `af8f140e45f7c2942ec4b09b7d752f49b3eeb28f1cdc5b8c3b74887d34dd4318`;
- root-control projection `2c71df25fff213f515aae02a01e210292a8e9b76fc84e14ab6cafb251fbbc9f1`;
- ROOT `14/14`, direct `6/6`, evidence `7e4fe6bf748ec110bebc1798d7742e03b89909df84da709f2fdeb51a42311ed0`.

See [`RESULTS.md`](RESULTS.md) for canonical byte counts, selected profile identities and claim limits.

## Owner boundaries

### Neutral harness and Domain

The neutral harness owns deterministic schedule/evidence mechanics only. Domain owns state/history/equality/action/transition/terminal/path-relation meaning. Graph never interprets Domain bytes.

### Graph NODE

Owns state-node/transposition claim, collision verification, finite local admission and ready/failed publication.

### Graph EDGE

Owns parent-local edge/action/child-link and expansion generation/batch storage/publication. It does not own Policy selection or multiplicity meaning.

### Graph REF

Owns typed reference validation, arena/incarnation/generation validity, stale rejection, finite protection admission, generation-safe protection tokens and protect-vs-retire ordering.

### Graph PATH

Owns finite path/occurrence storage, ordered occurrence access, REF-mediated validation/protection/generation, protection-before-visibility and identity-before-Domain-path-relation ordering. It does not decide cycle/repetition response.

### Graph ROOT

Owns finite protected root-anchor storage and its Graph-local lifecycle. It consumes REF for node protection/generation and consumes a generated projection of the already-normalized Session root/advance/reroot/attention contract.

ROOT explicitly does **not** own current-root selection, root epoch, operation choice, retained-state classification or reclamation. Those facts remain with Session/owning semantic components.

## ROOT profile corrections

ROOT falsification found and corrected three representation gaps:

- root-anchor storage now has explicit finite resource funding;
- total protection-capacity slots must fund both protection-record and root-anchor storage;
- root-anchor and protection-record terminal states explicitly reset privately to `free` before generation-safe reuse.

The normalizer rejects missing funding or missing reset semantics. No new ROOT-specific pressure code was invented; the existing `protection-capacity` family remains authoritative.

## Run

Use Node.js 26 or newer.

Full ROOT dependency chain:

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-graph-profiles.mjs
node scripts/run-graph-node-reference.mjs
node scripts/run-graph-ref-reference.mjs
node scripts/run-graph-path-reference.mjs
node scripts/run-graph-root-reference.mjs
```

The permanent `Graph ROOT reference` CI job runs this chain and retains the generated root-control projection and Graph evidence artifacts. EDGE remains a separate required regression job.

Focused ROOT examples:

```bash
node scripts/run-graph-root-reference.mjs --case graph-root-reroot-resolves-and-protects-before-authority-commit
node scripts/run-graph-root-reference.mjs --case graph-root-old-work-protection-survives-authority-change
node scripts/run-graph-root-reference.mjs --case graph-root-oracle-sensitivity-eager-prior-release
```

Generated machine evidence under `build/` is disposable. Checked-in fixtures/source and exact retained identities are the durable coordinates.

## ROOT case bank

The bounded 14-case ROOT capsule covers all six direct requirements:

- exact upstream Composer/Graph/NODE/REF/PATH/root-control binding;
- root/advance/reroot/attention separation;
- initial protected anchor with Session-owned current root;
- generation-safe anchor reuse;
- advance over a ready successor without reroot/reclamation work;
- replacement resolve/protect before authority commit;
- replacement pressure preserving the prior root;
- opaque owner reroot-disposition delegation;
- old-work protection surviving authority change;
- shared transposed-node survival after one occurrence is superseded;
- attention with zero Graph effect;
- visible-before-protection mutation detection;
- eager-prior-root-release mutation detection; and
- direct `GRAPH-ROOT-*` coverage accounting.

## Claim limits

Passing ROOT proves only the bounded CUDA-free semantic facts above. It does not prove `GRAPH-RECLAIM-*`, native CUDA, a production graph implementation, physical scheduling, performance, contract acceptance, release readiness or multi-GPU support. RECLAIM starts only after ROOT is integrated and read back from protected main.
