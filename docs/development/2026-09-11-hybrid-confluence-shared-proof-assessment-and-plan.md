# Hybrid Confluence Shared-Proof Assessment and Plan

**Assessment depth:** Substantial

**Decision:** Proceed after experiment

**Research direction:** Josh Oshiro  
**Technical synthesis / drafting assistance:** OpenAI ChatGPT  
**Date:** 2026-09-11  
**Research branch:** `research/residual-automorphisms-20260909`  
**Implementation branch reserved:** `research/hybrid-confluence-shared-proof-20260911`

## Objective

Determine whether the exact forward minimax/alpha-beta solver and CUDA-BSFP can share progressively richer exact structure in a way that materially reduces total wall-clock solve time for standard 7x6 Connect Four from the empty board.

The target is not architectural unification for its own sake. The target is measurable work elimination on top of ordinary CPU/GPU parallelism.

## Governing performance rule

Any shared representation, proof store, identity layer, or mutable structure is accepted only when:

\[
\Delta T_{saved} > \Delta T_{conversion} + \Delta T_{sync} + \Delta T_{local\ slowdown} + \Delta T_{memory/pressure}.
\]

If a change makes the architecture conceptually cleaner but does not improve end-to-end exact solve performance, reject it.

## Hard constraints

- CUDA-BSFP remains BSFP; do not turn it into minimax/search.
- Minimax/alpha-beta remains free to use CPU-local structures that maximize search performance.
- Shared facts must be exact or explicitly non-proof scheduling hints.
- No heuristic result may become a cutoff unless independently proven by exact semantics.
- Separate hot-state ownership is the default.
- Shared mutable state requires benchmark evidence before adoption.
- All measurements include CPU work, GPU work, publication, conversion, synchronization, coordination, and startup/teardown costs relevant to the benchmark.

## Ownership

### Forward exact solver owns

- forward proof tree and traversal;
- alpha-beta windows and bound interpretation;
- CPU-local move ordering;
- CPU-local hot transposition behavior;
- local scheduling and memory layout;
- consumption of exact external proof facts.

### CUDA-BSFP owns

- backward recurrence;
- fixed-point semantics;
- symbolic/residual representation;
- legality of backward-generated states;
- GPU-local batching, scheduling, and memory layout;
- exact backward publication.

### Confluence/proof exchange owns

- canonical exchange identity;
- proof-fact encoding;
- epoch/publication identity;
- asynchronous batching and merge;
- request/result correlation where needed;
- monotone cross-engine proof exchange.

It does not own either solver's hot internal state.

## Candidate shared structures, ordered from least invasive to most invasive

### Stage 0 — Baseline and oracle ceiling

Establish clean standalone baselines and measure the maximum value of confluence before implementing richer sharing.

1. Run the strongest forward exact solver from representative positions, including the empty root.
2. Record states reached at selected ply bands and the descendant work below them.
3. Replace those states offline with an instantaneous exact oracle.
4. Sweep the boundary depth and measure eliminated nodes and wall-clock-equivalent work.
5. Record where exact answers have the highest marginal value.

**Primary output:** a confluence-value curve by ply and by state class.

**Falsifier:** if even an ideal exact oracle eliminates little forward work, stop pursuing richer confluence.

### Stage 1 — Shared canonical semantic identity only

Normalize both engines to an agreed exact exchange identity while preserving separate internal representations.

Possible forms:

- canonical packed board key;
- reflection-normalized state key;
- later, an exact residual/quotient key if proved sufficient.

No internal state merge occurs.

**Measure:** key-generation cost, conversion cost, cache behavior, query throughput, collision safety, and total end-to-end impact.

**Acceptance:** identity sharing must make exact exchange cheaper or more reliable without slowing either engine materially.

### Stage 2 — Shared exact W/D/L publication

Implement the paper's minimal contract:

\[
Q(s)\rightarrow\{Unknown,W,D,L\}.
\]

Use immutable publication epochs or another equally complete mechanism. Measure real forward work removed per exact hit.

**Key metric:**

\[
\frac{\text{forward work eliminated}}{\text{BSFP publication + query cost}}.
\]

### Stage 3 — Shared monotone proof bounds

Test whether exact partial proof facts outperform exact-value-only exchange.

Represent the remaining possible values for each state as:

\[
K(s)\subseteq\{L,D,W\}.
\]

A practical three-bit mask is:

```text
L D W
1 1 1  unknown
0 1 1  proven non-loss
1 1 0  proven non-win
1 0 0  exact loss
0 1 0  exact draw
0 0 1  exact win
```

Independent exact evidence combines monotonically:

\[
K_{new}(s)=K_{old}(s)\cap K_{evidence}(s).
\]

At the bit level, this is an AND operation. The merge is commutative, associative, idempotent, and monotone.

Test both directions:

- BSFP bound -> forward cutoff/window tightening;
- forward proof/bound -> BSFP seed or propagated fact.

**Acceptance:** partial-bound exchange must produce additional net wall-clock savings beyond exact-value-only exchange.

### Stage 4 — Local hot TT plus asynchronous global proof store

Do not assume the asynchronous worker can replace latency-critical alpha-beta transposition.

Compare:

A. no local TT, asynchronous global proof store only;
B. tiny thread-local/local-core TT + asynchronous global proof store;
C. existing full local TT + global proof store;
D. direct-address proof table if a compact exact keyspace becomes available.

Measure duplicated work avoided versus memory/cache cost.

**Decision rule:** retain only the smallest local mechanism that produces a notable net gain.

### Stage 5 — Adaptive confluence surface

Replace the fixed-ply mental model with an experimentally selected semantic cut.

Candidate priority model:

\[
priority(q)\approx
\frac{P_{forward}(q)\times C_{remainingCPU}(q)}{C_{GPUsolve}(q)}.
\]

The GPU should preferentially solve classes that are cheap for BSFP but expensive and likely for the forward prover.

Inputs may include:

- observed forward visitation frequency;
- estimated remaining forward proof cost;
- BSFP residual-class size;
- backward distance to currently solved region;
- expected query reuse.

The scheduling signal is advisory only; it does not change exact semantics.

**Acceptance:** adaptive targeting must beat the best fixed-layer policy on total solve time.

### Stage 6 — CPU witness / GPU closure specialization

Exploit the asymmetric game recurrence:

\[
W(s)\iff \exists c:\ L(c),
\]

\[
L(s)\iff \forall c:\ W(c).
\]

Test whether CPU search is especially effective as an existential witness finder while GPU BSFP is especially effective at bulk universal closure.

This is a scheduling specialization over common exact semantics, not a change to correctness rules.

**Acceptance:** the specialization must reduce work compared with generic bidirectional exchange.

### Stage 7 — Shared residual/quotient IDs

Only after residual-function sufficiency is established, test a compact exact mapping:

\[
q(s).
\]

Two levels must be distinguished:

1. **lookup-safe quotient:**
   \[
   q(s_1)=q(s_2)\Rightarrow V(s_1)=V(s_2)
   \]
   sufficient for table/proof lookup;

2. **action-preserving quotient:** legal actions, terminal status, and successor quotient classes are preserved so both engines can navigate the quotient directly.

If a compact quotient is only lookup-safe, do not force minimax to search on it.

**Acceptance:** shared quotient IDs must outperform canonical board keys after conversion and locality costs are included.

### Stage 8 — Direct-address proof state

If the proved quotient keyspace is small enough, test:

\[
proof[q]
\]

instead of hashed transposition/membership lookup.

Potential benefits:

- transposition becomes inherent in state identity;
- no hash computation/collision management;
- exact BSFP and forward proof facts use the same address space;
- proof masks can be compact bitplanes;
- bulk GPU updates and CPU probes may become simple indexed operations.

**Acceptance:** direct addressing must materially improve throughput or eliminate enough duplicated work to justify the storage footprint.

### Stage 9 — Shared mutable physical state, only if forced by evidence

Do not pursue by default.

Only prototype shared mutable state if earlier experiments show duplicated storage/copying is itself a significant bottleneck and a shared layout can remove it without creating worse coherence, synchronization, locality, or ownership costs.

This is the final stage, not the architectural target.

## Candidate ideas to preserve but not yet implement

- BSFP miss information as move-ordering hints, never as proof.
- demand heatmaps from CPU to GPU for scheduling.
- BSFP proximity-to-proof information from GPU to CPU for move ordering.
- outcome-separated W/L bitplanes, with D derived only after a complete epoch when legal-minus-W-minus-L is sound.
- ragged semantic confluence wall rather than one global ply.
- CPU exact tactical proofs as additional BSFP seeds.
- GPU closure of CPU-discovered proof facts across many predecessors.

## Benchmark matrix

Every stage that changes execution must compare at least:

- standalone forward exact solver;
- standalone CUDA-BSFP where meaningful;
- hybrid exact-value-only confluence;
- candidate richer-sharing variant;
- identical hardware, positions, compiler/runtime configuration, and correctness oracle.

Record:

- total wall clock;
- CPU active time and node/probe counts;
- GPU active time and fixed-point work units;
- query count and hit rate;
- forward work eliminated per hit;
- proof-bound hits versus exact-value hits;
- bytes transferred/published;
- synchronization events;
- memory footprint;
- local solver slowdown caused by exchange instrumentation;
- result correctness.

## Primary decision metric

Do not optimize raw hit rate.

Prefer:

\[
Gain = \frac{\text{counterfactual exact work avoided}}{\text{added hybrid cost}}.
\]

Also report end-to-end speedup:

\[
Speedup = \frac{T_{best\ standalone}}{T_{candidate\ hybrid}}.
\]

## Rejection criteria

Reject or pause a candidate if any of the following holds:

- incorrect or unproved abstraction;
- shared structure slows either engine enough to erase its benefit;
- synchronization/coherence becomes a dominant cost;
- conversion cost exceeds query savings;
- memory pressure degrades GPU or CPU throughput;
- hit rate is high but eliminated work is low;
- implementation complexity grows without a measurable performance beneficiary;
- a simpler semantic-exchange design produces equivalent performance.

## Execution order

1. Measure oracle-boundary ceiling.
2. Establish canonical semantic identity cost.
3. Qualify exact W/D/L confluence.
4. Test monotone proof-mask exchange.
5. Test minimal local TT configurations.
6. Measure adaptive confluence scheduling.
7. Test CPU-witness/GPU-closure scheduling.
8. Continue residual-function sufficiency work.
9. If justified, test lookup-safe quotient IDs.
10. Only if action preservation is proved, test direct quotient navigation.
11. Only if copying/storage is measured as a bottleneck, consider shared mutable physical state.

## Completion / handoff

This plan completes when the experiments establish which information should be shared and which state should remain private, with benchmark evidence sufficient to choose the next implementation architecture.

The implementation branch remains isolated from the research branch. Actual code/prototype mutations belong on `research/hybrid-confluence-shared-proof-20260911` or a successor dedicated implementation branch; research conclusions and planning remain on the research branch.
