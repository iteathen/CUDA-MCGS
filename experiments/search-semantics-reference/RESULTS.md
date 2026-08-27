# CUDA-MCGS search-semantics reference results

**Status:** Informational

**Updated:** 2026-08-27

## Shared harness + Domain

The shared `REF-HARNESS-01` plus `REF-DOMAIN-01` capsule is current against the same representation/composition identity used by the Graph proposal chain:

- expected/discovered/executed/passed: `49/49/49/49`;
- failed: `0`;
- required/conditional/optional skipped: `0/0/0`;
- direct SPEC-0007 planned/executed requirement coverage: `47/47`;
- representation/composition SHA-256: `1b3173a128215b6fffc68c68a162708aec7f7bdc93e3e4ac7e26648abec39a24` (`719510` canonical bytes);
- Domain projection SHA-256: `278cfce297e1ecb9fc8ea151afb315d6ab67dc745b6beab244c70b5dd5f8508b` (`69524` canonical bytes);
- harness/Domain evidence SHA-256: `3cbb62ccf7498eb848793cd488f0f319c1fe0fc65c68d16f11cdc03c7b3e6491` (`30372` canonical bytes).

The rebind updated the top-level harness fixture identity and every declared neutral schedule's frozen evidence key before the full 49-case capsule was allowed to pass. Domain semantics themselves were unchanged; their evidence identity changed because the global Composer packet changed.

## REF-GRAPH-01 — current proposal chain

The Graph REF brick closed two representation/resource omissions discovered during author review: finite protection-record capacity and explicit opaque owner-reference handling. Both are Graph-owned normalized meaning and therefore legitimately rekey the dependent proposal/reference packet.

The current Composer qualification is:

- capsule: `cuda-mcgs-search-ir-composer-reference-v0.2.0`;
- expected/discovered/executed/passed: `879/879/879/879`;
- contract-set SHA-256: `2a3ded0b25f59d6f6a5dfffefefceae73f25e9df0558953b0bea29201d47c10d`;
- requirement-coverage SHA-256: `fe510fb69890b070ae6e7dfc60bd3e113a3f7e6354fa6bfcd8e48a6336c6c07a`;
- expanded-requirements SHA-256: `32fc66ca775046121146f3afc621e3407bab69711355e283b769d947fd185e0a`;
- framework-selection SHA-256: `c2fda51cdc63a9e64843e1619bcaa8a148894c2839ee7e4739f7e6d16f3e2d28` (`10422` canonical bytes);
- representation/composition SHA-256: `1b3173a128215b6fffc68c68a162708aec7f7bdc93e3e4ac7e26648abec39a24` (`719510` canonical bytes).

The selected Graph profile/schema closure used by that packet is:

- graph-profile schema SHA-256: `fe2645f8c0f75bdb06d043d132b3c45245791868471a4d24073c8e85414bbf76`;
- selected Graph profile identity: `ff2e3e828ccae14717bb3af059fe832ae690bb8b559d3b312c3d936fff40a985`;
- selected Policy profile identity: `8bb58f176e7ecce6fb6505cef78db2ab1585195ee9d222374ffac556f8fa1b23`;
- selected Resource profile identity: `e5f66a14821551d20478075d9a84cac23efefb547b0ad641e7d43d89f5330f1d`;
- selected Progress profile identity: `67230eb01119eef7e7722daa213160cb3d0fa0d9f685a602eadfad997ee20e21`;
- selected Output profile identity: `8af3962d05d529744c2dc85fdeff4bafeafa83dc3173dfab857c70e2c7fd55e5`.

The Composer-owned normalized Graph-profile projection is:

- profiles: `4`;
- SHA-256: `5e4729d33e917ccdcdc45e942fbe610348cdc448361fa9dd3786da9c55e3d85f`;
- canonical bytes: `134028`.

### NODE/transposition brick

NODE is rebound to the exact current Composer/projection pair and passes:

- capsule: `cuda-mcgs-graph-node-reference-v0.2.0`;
- expected/discovered/executed/passed: `13/13/13/13`;
- failed: `0`;
- direct `GRAPH-NODE-*` planned/executed requirement coverage: `11/11`;
- evidence SHA-256: `cb9c9382fe898421e1730881057f5d75c7c9e1085001d0026562e050bd8ebbbc`;
- canonical bytes: `10123`.

### EDGE/expansion brick

The current EDGE brick qualifies `GRAPH-EDGE-001` through `GRAPH-EDGE-010` against that same exact upstream packet:

- capsule: `cuda-mcgs-graph-edge-reference-v0.2.0`;
- expected/discovered/executed/passed: `16/16/16/16`;
- failed: `0`;
- direct `GRAPH-EDGE-*` planned/executed requirement coverage: `10/10`;
- exact upstream NODE evidence: `cb9c9382fe898421e1730881057f5d75c7c9e1085001d0026562e050bd8ebbbc`;
- exact Graph projection: `5e4729d33e917ccdcdc45e942fbe610348cdc448361fa9dd3786da9c55e3d85f`;
- EDGE evidence SHA-256: `eb9dd011e91fff0896cb0019571eb97346e5da5c595920fe6101c6fa9aa91879`;
- EDGE evidence canonical bytes: `11661`.

### REF/reference-protection brick

The third bounded Graph owner brick qualifies `GRAPH-REF-001` through `GRAPH-REF-008`:

- capsule: `cuda-mcgs-graph-ref-reference-v0.2.0`;
- expected/discovered/executed/passed: `14/14/14/14`;
- failed: `0`;
- direct `GRAPH-REF-*` planned/executed requirement coverage: `8/8`;
- exact upstream NODE evidence: `cb9c9382fe898421e1730881057f5d75c7c9e1085001d0026562e050bd8ebbbc`;
- exact Graph projection: `5e4729d33e917ccdcdc45e942fbe610348cdc448361fa9dd3786da9c55e3d85f`;
- REF evidence SHA-256: `2c4fac58ef2a7678b5417579c2d05210910596fd57adf9be30ef2f36d0266456`;
- REF evidence canonical bytes: `9139`.

The 14 REF cases prove, within this bounded owner brick:

- reference consumers validate kind, arena/incarnation, slot, generation and applicable lifecycle state before semantic access;
- explicit arena-incarnation mismatch and stale-generation failures are typed and side-effect-free;
- the reference oracle consumes the current NODE reference shape rather than defining a second node identity;
- generation advancement never wraps and arbitrary-width profile ranges are preserved rather than narrowed to 32-bit assumptions;
- raw addresses are rejected from public semantic reference forms;
- owner-local reference handling is delegated only through a region whose normalized `referenceHandling` explicitly selects that lifecycle action;
- Graph receives only public owner-region metadata and never interprets or rewrites private owner bytes;
- protection acquisition and retirement have one declared ordering point: protection-before-retirement blocks retirement, while retirement-before-protection causes acquisition to fail;
- protection-record capacity is explicit and finite;
- released protection slots are reusable only with a generation-advanced token, and a stale token cannot release the replacement protection; and
- removing generation validation or protect/retire ordering is caught by named mutation falsifiers.

## Graph profile corrections retained by this brick

### Finite protection capacity

SPEC-0010 requires selected protection records to contribute finite resources. The normalized materialized profiles now provide an explicit `resource-protection-slots` contribution with `protection-capacity` as its typed pressure outcome. The Graph normalizer rejects an underfunded protection-record layout instead of allowing the reference to infer hidden storage.

### Explicit opaque owner-reference handling

`GRAPH-REF-007` requires an opaque owner region to declare whether embedded references need owner-mediated validation/fixup/release. The normalized owner-region schema now carries exactly that declaration:

- `{ "kind": "none" }`; or
- `{ "kind": "owner-lifecycle", "actions": ["validate" | "fixup" | "release", ...] }`.

The existing owner `lifecycle` schema identity remains the mediation boundary. The declaration is meaning-affecting and contributes to Graph profile identity. Graph storage cannot infer reference presence from permissions/layout or inspect private owner encoding.

### Protection-token reuse

A first green REF implementation used a monotonically growing protection-token list, which would eventually return permanent capacity pressure after enough acquire/release cycles. Author review corrected this before merge. Released slots are reused with an incremented token generation; reuse stops with `generation-exhausted` rather than aliasing when the token generation range is exhausted.

## Evidence lifecycle and claim limits

Machine evidence is reproducible in ignored `experiments/search-semantics-reference/build/`. Generated evidence is disposable and is not treated as source authority.

The current results prove the semantic-neutral harness, bounded Domain behavior, Graph NODE/transposition, Graph EDGE/expansion and Graph REF/reference-protection bricks described above. Active path/occurrence/cycle, root-authority integration, retirement/quiescence/reclamation, ADR-0022 occurrence supersession, later owner oracles, a complete terminal reference engine and integrated proposal acceptance remain unfinished.

No production runtime, native CUDA, CUDA-JS device execution, performance, search-quality, public-SDK, contract-acceptance or multi-GPU-support claim is made here.
