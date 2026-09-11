# Hybrid Confluence Shared-Structure Exploration

**Status:** Research Note

**Inspected:** 2026-09-11

**Research direction:** Josh Oshiro  
**Technical synthesis / drafting assistance:** OpenAI ChatGPT

## Question

Can the forward exact minimax/alpha-beta solver and CUDA-BSFP share more than final W/D/L answers in a way that materially increases performance, while avoiding gratuitous shared state or architectural unification?

The working hypothesis is that the two engines are evaluating the same finite exact game DAG under different schedules:

- forward alpha-beta **pulls** proof information from the root toward descendants;
- BSFP **pushes** proof information from terminal regions toward predecessors.

The potentially valuable commonality is therefore semantic rather than necessarily physical.

## Evaluation criteria

A sharing mechanism is interesting only if it improves end-to-end exact solve performance after accounting for:

- conversion cost;
- synchronization/coherence cost;
- cache/locality effects;
- memory pressure;
- CPU slowdown;
- GPU slowdown;
- publication/query overhead;
- implementation complexity where it creates ongoing performance or correctness costs.

The governing rule is:

\[
\Delta T_{saved} > \Delta T_{conversion} + \Delta T_{sync} + \Delta T_{local\ slowdown} + \Delta T_{memory/pressure}.
\]

Architectural neatness is not evidence of value.

## Sources and exact revisions

Primary internal research basis:

- `docs/research/2026-09-11-asynchronous-confluence-hybrid-exact-connect4.md` on `research/residual-automorphisms-20260909`.
- residual/frontier/automorphism research preserved on the same branch.
- execution plan: `docs/development/2026-09-11-hybrid-confluence-shared-proof-assessment-and-plan.md`.

No external source establishes the proposed combined architecture. The ideas below are research hypotheses and deductions from exact game semantics.

## Verified observations

### 1. Exact confluence needs only semantic agreement

The forward and backward engines do not need identical internal representations to exchange useful exact information. A canonical state identity plus exact proof fact is sufficient for basic confluence.

### 2. Final W/D/L is not the only exact information available

Alpha-beta operates on valid bounds, not only exact final values. Therefore a backward solver can potentially provide useful exact partial proof facts before a state reaches a singleton W/D/L classification.

### 3. A monotone possibility set is a natural common proof object

Let

\[
K(s)\subseteq\{L,D,W\}
\]

represent the values still possible for state \(s\).

Initially:

\[
K(s)=\{L,D,W\}.
\]

Examples:

- \(\{D,W\}\): proven non-loss;
- \(\{L,D\}\): proven non-win;
- \(\{W\}\): exact win;
- \(\{D\}\): exact draw;
- \(\{L\}\): exact loss.

Independent exact evidence combines by intersection:

\[
K_{new}(s)=K_{old}(s)\cap K_{evidence}(s).
\]

This operation is monotone, commutative, associative, and idempotent. It is therefore unusually suitable for asynchronous exchange: duplicated or reordered messages do not require rollback if every published fact is sound.

### 4. Bidirectional exact exchange is possible without merging algorithms

The original confluence model emphasized BSFP -> CPU exact answers. The common proof object permits the reverse direction too:

- CPU tactical/exact proofs can become additional backward seeds;
- CPU bound proofs can reduce the remaining value set of a state;
- GPU propagation can spread those facts to many predecessors;
- newly propagated facts can then cut off or tighten CPU search.

This creates a potentially reinforcing exact loop without turning BSFP into minimax or making CPU search responsible for fixed-point closure.

### 5. Shared semantics do not imply shared hot mutable state

The strongest default architecture is currently:

\[
\text{CPU-local hot state}
\quad+
\text{GPU-local hot state}
\quad+
\text{small exact asynchronous proof exchange}.
\]

The two engines may share state identity and proof meaning while preserving separate physical memory layouts and local scheduling.

### 6. Global asynchronous transposition may not replace latency-critical local transposition

If alpha-beta encounters an immediately reusable transposition, waiting for an asynchronous worker can allow the expensive duplicate subtree to begin before the reply arrives.

A small local TT may therefore remain useful even if a global worker owns shared proof/transposition knowledge.

This is a performance hypothesis to measure, not a requirement. If a direct-address residual key makes the local TT unnecessary, it should be removed.

### 7. A compact exact quotient could subsume transposition

If an exact residual mapping \(q(s)\) is proved sufficient, multiple histories that map to the same exact semantic class naturally share one state identity.

At that point transposition is no longer only a cache optimization; some duplicate work disappears at representation time.

However, two quotient strengths must remain distinct:

- **lookup-safe:** same quotient implies same exact value;
- **action-preserving:** legal action structure and successor quotient classes are preserved.

Only the second permits minimax to navigate the quotient directly.

### 8. The optimal confluence surface may be ragged rather than fixed-ply

The value of an exact backward answer depends on both:

- how expensive the corresponding state is for the forward solver;
- how expensive it is for BSFP to solve/publish that state or class.

A candidate priority measure is:

\[
priority(q)\approx
\frac{P_{forward}(q)\times C_{remainingCPU}(q)}{C_{GPUsolve}(q)}.
\]

This implies a semantic confluence wall that may intersect different branches at different plies.

### 9. The game recurrence suggests CPU/GPU specialization beyond direction

For side-to-move W/L semantics:

\[
W(s)\iff \exists c:\ L(c),
\]

\[
L(s)\iff \forall c:\ W(c).
\]

CPU branch search is naturally good at finding an existential witness early when move ordering is strong. GPU bulk propagation may be naturally good at universal closure over many children/classes.

A candidate specialization is therefore:

- CPU as witness finder;
- GPU as closure verifier.

This remains an exact scheduling hypothesis, not a correctness assumption.

### 10. Draw materialization may be avoidable until completeness is known

If an epoch has completely classified a finite legal layer/region, then:

\[
D = Legal \setminus (W\cup L).
\]

Before completeness, absence from W/L means `Unknown`, not draw.

A complete epoch watermark may therefore allow BSFP to materialize only monotone W and L facts and derive draws at publication time. Whether this is cheaper depends on the actual representation.

### 11. Direct-address proof state is a high-upside consequence of residual compression

If residual research yields a small bounded exact keyspace, then both engines may be able to use:

\[
proof[q]
\]

rather than hashed point queries.

Potential gains include:

- no hash computation;
- no collision management;
- implicit transposition by exact identity;
- compact bitplane proof masks;
- simple CPU probe and GPU bulk update paths.

This should be pursued only after the residual quotient is proved exact and its keyspace is measured.

## Inferences

### A. The strongest common object may be a proof lattice, not a shared graph

A shared mutable game graph is not currently justified. A small monotone proof lattice keyed by exact semantic identity may capture most of the useful cross-engine leverage at much lower coordination cost.

### B. Confluence can happen before complete W/D/L resolution

If alpha-beta only needs to prove non-loss or non-win for the active window, a valid partial proof bound may terminate work earlier than waiting for exact W/D/L.

This could materially move the effective confluence boundary outward in both directions.

### C. CPU->GPU exchange may amplify individual CPU proofs

A single CPU proof fact may become much more valuable when BSFP propagates it across a large predecessor set. The performance effect could therefore be greater than the direct CPU work saved by the original proof.

### D. GPU->CPU information can be useful even when it is not proof

Proximity-to-solved-region, residual-class density, or similar BSFP metadata could influence move ordering without being trusted for cutoffs.

This must remain clearly separated from proof facts.

### E. The architecture should optimize information value, not hit rate

A low-frequency confluence class that eliminates enormous forward subtrees may dominate a high-frequency class that only saves cheap leaves.

The useful metric is closer to:

\[
\frac{\text{counterfactual exact work avoided}}{\text{added hybrid cost}}.
\]

### F. Physical unification should be treated as a late optimization

If later measurements show copying or duplicated storage dominates runtime, a shared physical structure may become worthwhile. Until then, separate CPU/GPU layouts preserve locality and ownership and should be preferred.

## Unknowns and limitations

- Whether useful partial BSFP bounds can be produced substantially earlier/cheaper than exact W/D/L.
- Whether CPU-generated exact bounds are sufficiently reusable backward to justify GPU ingestion.
- Whether the worker's asynchronous latency makes a local TT materially valuable.
- Whether a compact residual quotient is lookup-safe.
- Whether that quotient can be made action-preserving.
- Whether BSFP's easiest classes correlate with alpha-beta's hardest states.
- Whether adaptive/ragged boundary targeting improves enough over simple complete-layer publication to justify scheduling complexity.
- Whether W/L-only storage plus draw derivation reduces memory/work in the actual BSFP representation.
- Whether CPU witness/GPU closure specialization improves utilization or introduces excessive cross-engine chatter.
- Whether direct-address proof tables fit useful memory tiers once the real keyspace is known.

## Candidate dispositions

### Preserve / prioritize

1. oracle-boundary experiment to measure maximum confluence value;
2. exact canonical semantic identity;
3. exact W/D/L epoch publication;
4. monotone three-value proof-mask exchange;
5. local TT versus async global proof-store benchmark;
6. adaptive confluence surface experiment;
7. residual quotient sufficiency and action-preservation tests;
8. direct-address proof table only if the quotient keyspace supports it.

### Preserve as secondary experiments

- CPU witness / GPU closure specialization;
- CPU demand heatmap for BSFP scheduling;
- GPU proximity hints for CPU move ordering;
- W/L-only storage with draw derived at completeness.

### Explicitly do not pursue without evidence

- one physically shared mutable CPU/GPU graph;
- one common memory layout merely for symmetry;
- removing CPU-local structures just because equivalent information exists asynchronously elsewhere;
- forcing minimax to navigate a quotient that is only value-equivalent rather than action-preserving;
- replacing exact proof semantics with heuristic similarity.

## Decision impact / follow-up

The research direction shifts from "make minimax and BSFP share structure" to a more selective question:

> **What is the smallest exact semantic structure whose sharing eliminates enough duplicated proof work to improve total solve time?**

Implementation should progress from least invasive semantic sharing toward richer integration only when the previous stage demonstrates a notable net gain.

Research and planning remain on `research/residual-automorphisms-20260909`. Any code/prototype implementation belongs on the isolated branch `research/hybrid-confluence-shared-proof-20260911` (or a successor dedicated implementation branch) and must not mutate the research branch's implementation state.
