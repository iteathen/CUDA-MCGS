# Asynchronous Confluence Architecture for Hybrid Exact Connect Four Solving

**Author:** Josh Oshiro  
**Original research direction, architecture, and invention:** Josh Oshiro  
**Technical review, reconstruction, and editorial assistance:** OpenAI ChatGPT  
**Date:** 2026-09-11  
**Status:** Research proposal; informational, non-normative  
**Supersedes:** *Tripartite Stream-Confluence Architecture for Asynchronous Hybrid Connect 4 Exact Solving*

> This document is a research record. It does not govern CUDA-MCGS or CUDA-BSFP implementation until its claims are qualified and any accepted decisions are promoted into the appropriate specification or ADR.

## Abstract

This paper proposes a heterogeneous exact-solving architecture for standard \(7\times6\) Connect Four in which two fundamentally different exact solvers operate concurrently and exchange only mathematically certified information.

The first component is a forward exact proof-search engine, such as minimax with alpha-beta pruning. The second is a GPU-resident Backward Symbolic Fixed-Point (BSFP) solver that computes exact solved regions from terminal conditions toward earlier game states. A third component, the **confluence service**, connects the two without merging their internal algorithms.

The central architectural idea is simple:

\[
\boxed{
\text{forward exact proof search}
\quad\cap\quad
\text{backward exact solved region}
}
\]

If the forward engine reaches a state whose exact outcome has already been established by the backward solver, search beneath that state becomes unnecessary. The backward result can be substituted directly and propagated through the forward proof tree.

The significance of this architecture is not merely parallelism. The two solving directions have different computational pathologies. Forward alpha-beta search can efficiently prove narrow, highly ordered lines but may expand large unresolved subtrees. Backward symbolic solving can potentially exploit structural regularity and shared residual behavior across large sets of positions but may encounter difficult symbolic representations or boundary growth. Their intersection therefore creates the possibility that each solver terminates work that is expensive for the other.

This paper develops the architecture without assuming that any particular quotient representation is correct. Instead, the BSFP side is required to satisfy a strict external contract:

\[
Q(s)\rightarrow\{\text{Unknown},W,D,L\}.
\]

Any internal compression—decision diagrams, frontier states, residual-function classes, flat transfer tables, symmetry reduction, or other representations—is valid only insofar as it preserves this exact query semantics.

The resulting design separates mathematical correctness from representation choice, removes temporal races from the asynchronous system through immutable publication epochs, and turns the proposed hybrid solver into a collection of independently falsifiable engineering hypotheses.

---

## 1. Problem Statement

Consider standard Connect Four:

- board width \(7\);
- board height \(6\);
- alternating play;
- gravity-constrained placement;
- four connected stones required to win;
- play terminates immediately upon a win;
- otherwise a filled board is a draw.

Let

\[
\mathcal S
\]

denote the set of **legal reachable game states**, not merely all assignments of stones to board cells.

For every nonterminal state \(s\), let

\[
Succ(s)
\]

be the legal successor states obtained by one valid move.

Define the exact game-theoretic value from the perspective of the side to move:

\[
V(s)\in\{W,D,L\}.
\]

For terminal states the value is known directly.

For nonterminal positions,

\[
V(s)=W
\]

when at least one legal move produces a losing state for the opponent:

\[
\exists t\in Succ(s):V(t)=L.
\]

Similarly,

\[
V(s)=L
\]

when every legal move produces a winning state for the opponent:

\[
\forall t\in Succ(s):V(t)=W.
\]

All remaining completely evaluated positions are draws.

The objective is to compute

\[
V(s_0)
\]

for the empty-board root \(s_0\), while minimizing total computational work.

---

## 2. Core Architectural Hypothesis

A conventional exact solver normally commits primarily to one traversal direction.

A forward solver begins at

\[
s_0
\]

and explores descendants.

A backward solver begins from solved terminal conditions and propagates exact information toward their predecessors.

The proposed architecture does both concurrently.

Let

\[
F_t
\]

represent states encountered by the forward solver by time \(t\).

Let

\[
B_t
\]

represent states for which the backward solver has established exact outcomes by time \(t\).

Whenever

\[
s\in F_t\cap B_t,
\]

the forward solver may substitute the already established value

\[
V(s)
\]

instead of continuing to solve the subtree rooted at \(s\).

This event is called **exact confluence**.

The mechanism is analogous to probing a dynamically generated tablebase, but the tablebase may be symbolic rather than explicitly enumerated.

The important property is therefore not the physical representation of \(B_t\). It is the query contract:

\[
Q_t(s)=
\begin{cases}
V(s), & s\in B_t\\
\text{Unknown}, & s\notin B_t.
\end{cases}
\]

A hybrid solver is correct if every non-`Unknown` result returned by \(Q_t\) is exact.

---

## 3. Separation of Solving Semantics

The architecture intentionally does **not** combine minimax and BSFP into a single solving algorithm. They remain separate exact engines.

### 3.1 Forward Exact Prover

The forward engine may use:

- minimax;
- negamax;
- alpha-beta pruning;
- transposition tables;
- exact move ordering;
- iterative deepening;
- threat-based ordering;
- or other search optimizations.

Heuristics may determine exploration order. They must not create speculative proof results.

A heuristic may answer:

> Search this move first.

It may not answer:

> This move is winning, therefore stop.

unless that statement has been established exactly.

The forward engine therefore acts as an **exact proof-search consumer** of backward information.

---

## 4. Backward Symbolic Fixed-Point Solver

The CUDA-BSFP engine works in the opposite direction.

Rather than recursively traversing complete legal move trees from the root, it propagates exact outcome information backward from known states.

Its internal representation need not resemble a conventional board database. Possible representations include:

- explicit packed positions;
- bitsets;
- BDDs;
- ZDDs;
- frontier-state transfer systems;
- residual-function equivalence classes;
- flat state-transition arrays;
- symmetry-reduced canonical states;
- or combinations of these.

The architecture does not assume that any of these representations will succeed.

Instead, BSFP owns the invariant:

\[
\boxed{
\text{Every published solved state has the correct exact game value.}
}
\]

Compression mechanisms are internal implementation details subordinate to that invariant.

---

## 5. Representation Equivalence Must Be a Congruence

One of the most dangerous opportunities in symbolic game solving is excessive state quotienting.

It is easy to identify positions that appear strategically similar. That is insufficient.

Suppose an abstraction defines

\[
s_1\sim s_2.
\]

For this relation to safely merge exact game states, it must preserve everything required by the solving recurrence.

At minimum, equivalent states must preserve the distinctions relevant to:

1. terminal status;
2. side to move;
3. legal successor behavior;
4. exact W/D/L recurrence;
5. gravity constraints;
6. immediate game termination after a win.

A useful conceptual condition is that \(\sim\) behave as a congruence under the game operator.

If

\[
s_1\sim s_2,
\]

then evaluating the game from either state must produce the same result:

\[
V(s_1)=V(s_2).
\]

More strongly, the abstraction used during recursive or fixed-point propagation must preserve enough successor structure to justify that equality rather than merely observe it afterward.

Therefore concepts such as similar threats, equal numbers of winning lines, equivalent geometric potential, or comparable strategic patterns must not be used as exact quotient criteria without proof.

---

## 6. Residual-Function Equivalence

A particularly promising route to exact compression is to define equivalence through the residual problem itself.

Consider processing the game representation according to some decomposition that separates:

- already processed information;
- an active frontier;
- unprocessed information.

Let

\[
f_h(x)
\]

be the exact residual game function produced by processed history \(h\), expressed over the remaining variables \(x\).

Two histories may be merged exactly when

\[
f_{h_1}=f_{h_2}.
\]

This gives the equivalence relation

\[
h_1\sim h_2
\iff
f_{h_1}(x)=f_{h_2}(x)
\quad\forall x.
\]

This is substantially stronger than saying the histories look strategically similar. They are interchangeable because they induce the same remaining exact problem.

If a small frontier descriptor uniquely determines this residual function, the entire forgotten history becomes unnecessary.

The resulting state may then take the form

\[
(\text{frontier configuration},\text{residual class}).
\]

In the strongest case the residual class is completely determined by the frontier configuration itself, eliminating persistent graph structures.

This opens the possibility of a bounded flat transfer representation:

\[
state_k
\xrightarrow{\text{local transition}}
state_{k+1}.
\]

Such a representation is particularly attractive for GPU execution because it replaces pointer-heavy symbolic traversal with predictable indexed memory operations.

Whether this compression exists for the required Connect Four exact semantics is an empirical and mathematical question, not an assumption.

---

## 7. Exact Confluence Contract

The boundary between the two solvers should expose a minimal semantic API:

\[
Query(s)\rightarrow\{\text{Unknown},W,D,L\}.
\]

No internal symbolic structure needs to cross this boundary.

The forward solver submits a canonical exact position. The confluence layer returns either an exact solved value or `Unknown`.

`Unknown` does **not** mean draw. It means only:

> The currently published backward solution does not establish this state's value.

This distinction is fundamental.

---

## 8. Canonical State Representation

A Connect Four state can be represented compactly using

\[
(P,O)
\]

where:

- \(P\) is the bitmask belonging to the player whose perspective is represented;
- \(O\) is total occupied cells.

The opponent mask is then

\[
P_{\text{opp}}=O\oplus P.
\]

For a \(7\times6\) board only 42 board bits are required per mask.

However, an exact canonical representation must establish additional conventions.

### 8.1 Perspective

Every state must use one consistent interpretation, such as

\[
P=\text{stones belonging to the player to move}.
\]

Then result values are also interpreted from that same player's perspective. This avoids separate player identifiers.

### 8.2 Ply

The move count is recoverable from occupancy:

\[
ply=\operatorname{popcount}(O).
\]

A stored ply field may therefore be useful for integrity checking or indexing but is not fundamental state information.

### 8.3 Reflection Canonicalization

Connect Four has horizontal reflection symmetry.

Let

\[
R(s)
\]

denote the reflected state.

A canonical key may be defined as

\[
C(s)=\min(s,R(s))
\]

under some deterministic packed ordering.

All solved-state publication and forward queries must apply the same canonicalization.

### 8.4 Reachability

Not every gravity-respecting board is a legal Connect Four state.

A legal state must satisfy the actual game history rules, including immediate termination after the first win.

Backward generation must therefore exclude configurations that would require play to continue after an earlier terminal state.

This legality requirement is part of BSFP correctness.

---

## 9. Why Live Collision Streams Are Insufficient

A naïve implementation might continuously stream forward states and backward states into a coordinator and report when matching entries happen to be simultaneously present.

This is incomplete.

Suppose:

1. forward search emits state \(s\);
2. \(s\) is not currently solved backward;
3. the coordinator discards it;
4. BSFP later solves \(s\).

The exact confluence existed, but it is never observed.

The two streams therefore form a temporal join problem.

A correct design requires persistent state on at least one side or a completeness mechanism.

The proposed solution is **epoch publication**.

---

## 10. Immutable Publication Epochs

Let

\[
B^{(n)}
\]

be a complete immutable snapshot of the backward solved region at publication epoch \(n\).

The GPU constructs the next region privately,

\[
B^{(n+1)},
\]

while CPU workers continue querying

\[
B^{(n)}.
\]

When the new snapshot has been fully produced and validated, it is atomically published.

Conceptually:

\[
\boxed{GPU:\ B^{(n)}\rightarrow B^{(n+1)}}
\]

in parallel with

\[
\boxed{CPU:\ Query(B^{(n)},s)}
\]

followed by

\[
B_{\text{published}}\leftarrow B^{(n+1)}.
\]

Readers never observe a partially constructed solved set.

This provides several benefits:

- no temporal collision race;
- simple correctness reasoning;
- stable concurrent lookup;
- reproducible benchmarking;
- easy rollback;
- deterministic version identity.

The backward solver may still internally stream work. Only the externally visible exact-query surface requires snapshot semantics.

---

## 11. Query Result Routing

A global boolean such as

\[
CollisionFound=1
\]

is insufficient.

A proof result must identify which forward query was answered.

A result therefore needs at least

\[
(\text{request ID},\text{value},\text{epoch}).
\]

Potentially useful additional information includes:

- canonical state key;
- proof class;
- source layer;
- integrity checksum.

The forward engine can associate the request ID with the corresponding search node or continuation.

When a response arrives,

\[
(requestID,W),
\]

the corresponding leaf is assigned an exact win and that result is propagated through the normal alpha-beta machinery.

---

## 12. Asynchronous Correctness

Delayed confluence information does not compromise correctness.

Suppose the backward solver has already established

\[
V(s)=W
\]

but the forward solver continues exploring below \(s\) before receiving that result.

Any nodes explored during that interval are redundant but still belong to an exact computation.

Once the published result arrives, the redundant work may be abandoned.

Thus confluence latency affects performance but not mathematical correctness.

This distinction is useful, but it must not be misunderstood. A latency of hundreds of milliseconds may represent substantial wasted search work in a high-performance solver. Therefore the architecture should optimize notification latency without placing correctness dependence on low latency.

---

## 13. Communication Architecture

The exact communication mechanism is secondary to the ownership model.

A practical implementation may use shared-memory queues between Node/V8 control code, CPU workers and CUDA host components.

However, producer topology must be explicit.

A ring buffer is truly SPSC only when it has exactly one producer and exactly one consumer.

If several CPU search threads submit queries, alternatives include:

- one SPSC queue per producer;
- an MPSC queue;
- local batching followed by a single aggregation producer.

The same principle applies to result delivery.

Batching is likely preferable because per-position synchronization can otherwise dominate the cost of the query itself.

---

## 14. Confluence Service Responsibilities

The confluence service should remain deliberately small.

It owns:

1. the currently published BSFP epoch;
2. canonical query routing;
3. exact membership/value lookup;
4. request/result identity;
5. epoch transition visibility.

It should **not** become the global graph authority.

The forward solver owns its proof tree.

The BSFP engine owns its symbolic/fixed-point computation.

The confluence service owns the contract between them.

This preserves a clean architecture:

\[
\text{Forward Solver}
\quad\longleftrightarrow\quad
\text{Exact Query Interface}
\quad\longleftrightarrow\quad
\text{CUDA-BSFP}.
\]

---

## 15. Filtering and Membership Acceleration

If an exact published set is expensive to query, a probabilistic prefilter may reject obvious misses.

For example:

\[
H(s)\rightarrow \text{candidate/no candidate}.
\]

A Bloom filter or other coarse membership structure may safely produce false positives:

\[
\text{candidate}\not\Rightarrow\text{solved}.
\]

It must never produce false negatives for values actually present in the exact published set.

Therefore a negative prefilter result can safely yield `Unknown` only when the filter's construction guarantees complete insertion of every published member.

A positive result must still be verified by the exact representation.

The prefilter is purely a performance optimization.

---

## 16. GPU Representation Is Not Prescribed

The confluence architecture deliberately avoids requiring BSFP's native representation to be exported.

If CUDA-BSFP internally uses a graph structure, the host need not traverse that graph.

Instead, an epoch may include a separately generated lookup representation optimized for host or CPU queries.

Possible publication formats include:

- sorted canonical state keys;
- perfect or near-perfect hash tables;
- compact rank/select bitsets;
- flat frontier-class lookup tables;
- outcome-separated membership structures;
- generated decision procedures;
- or device-resident queries invoked in large batches.

The best representation should be selected experimentally.

The external invariant remains:

\[
Query(s)
\]

must return an exact value or `Unknown`.

---

## 17. Device-Resident Confluence

It may eventually be undesirable to transfer backward structures to CPU memory at all.

Another architecture is:

\[
\text{CPU forward probes}
\rightarrow
\text{batched GPU query}
\rightarrow
\text{exact result batch}.
\]

This becomes attractive if

\[
T_{\text{PCIe batch}}+T_{\text{GPU lookup}}
\]

is smaller than the host-side query cost or if the symbolic state cannot be economically exported.

The design therefore does not require the confluence layer to execute in JavaScript.

A V8 worker is one possible orchestration implementation, not a mathematical component of the architecture.

---

## 18. Performance Model

No square-root or half-depth complexity reduction should be assumed.

The relevant quantity is saved total work.

Let:

- \(T_F\) = forward solver work;
- \(T_B\) = BSFP work;
- \(T_Q\) = lookup/publication/communication overhead;
- \(S\) = forward work eliminated through exact confluence.

For concurrent execution, a first-order model is:

\[
T_{\text{hybrid}}
\approx
\max(T_F,T_B)+T_Q-S.
\]

This is not an asymptotic theorem. It is an engineering decomposition.

Hybrid solving is beneficial when

\[
S>T_Q
\]

and when performing BSFP concurrently does not consume resources that would have produced more value if allocated elsewhere.

---

## 19. Confluence Value

Not all solved states are equally valuable.

Suppose a forward state \(s\) has probability

\[
p(s)
\]

of being encountered by the forward solver.

Let

\[
C_F(s)
\]

be the expected forward cost of solving beneath it.

Let

\[
C_Q(s)
\]

be its membership/query overhead.

Then the expected value of having \(s\) available backward is approximately

\[
p(s)\left(C_F(s)-C_Q(s)\right).
\]

At a boundary or class level, this suggests optimizing

\[
\sum_{s\in B}p(s)\,C_F(s)
\]

rather than simply maximizing the number of backward-solved states.

A small backward region intersecting expensive principal search corridors may be more useful than a much larger region rarely reached by the forward prover.

---

## 20. The Confluence Band Is an Experimental Variable

There is no theoretical reason to assume that the best intersection necessarily occurs at the numerical middle of the game.

A candidate range such as plies 18–24 is reasonable to investigate, but it is a hypothesis.

The optimum depends on:

- backward representation density;
- symbolic compression;
- forward branching;
- move-ordering quality;
- solved-state lookup cost;
- GPU throughput;
- CPU throughput;
- probability of forward visitation.

The correct boundary is whichever region maximizes total avoided work.

---

## 21. Why the Two Solvers May Be Complementary

The architecture becomes interesting only if their difficulty distributions differ.

Forward alpha-beta tends to benefit from:

- strong move ordering;
- immediate tactical wins;
- narrow principal variations;
- rapid proof cutoffs.

It tends to suffer when:

- several moves remain plausible;
- outcomes require deep resolution;
- transpositions do not sufficiently collapse the tree.

Symbolic backward solving may benefit from:

- repeated structural conditions;
- compact residual states;
- regular local transitions;
- high SIMD/SIMT parallelism;
- shared computation across many concrete positions.

It may suffer from:

- symbolic frontier explosion;
- irregular representation growth;
- poor quotient effectiveness;
- expensive predecessor generation.

The proposed hybrid is therefore based on the hypothesis

\[
\operatorname{Hard}_{forward}
\not\approx
\operatorname{Hard}_{backward}.
\]

If their difficult regions are sufficiently different, each engine can solve states that save disproportionate work for the other.

---

## 22. Experimental Program

The architecture should be validated progressively rather than constructed in full before its assumptions are measured.

### 22.1 Experiment A — Exact Boundary Replay

Run a conventional exact forward solver while recording states reached at selected plies.

Independently construct an exact backward solved region.

Replay the recorded forward states against that region.

Measure

\[
hitRate(d)
\]

for each candidate ply \(d\).

More importantly, record the search work that would have been removed by each successful hit.

This directly measures potential confluence value without requiring live concurrency.

### 22.2 Experiment B — Query Representation Cost

For the same backward region, construct several exact lookup representations.

Measure:

- memory;
- construction time;
- lookup throughput;
- lookup latency;
- batch sensitivity;
- host/device transfer requirements.

This determines whether exact confluence lookup is economically useful.

### 22.3 Experiment C — Residual-State Sufficiency

For a candidate frontier decomposition:

1. fix a candidate frontier descriptor;
2. vary all forgotten history consistent with it;
3. compute the resulting exact residual problem;
4. compare residual functions.

If all histories sharing the frontier produce the same residual function, the frontier state is sufficient.

If not, determine how many distinct residual-history classes occur per frontier assignment.

A result such as

\[
\max classes=4
\]

would imply only

\[
\log_2 4=2
\]

additional exact class bits are required.

This provides a quantitative route from failed compression to improved compression rather than an all-or-nothing test.

### 22.4 Experiment D — Live Epoch Confluence

Only after the first three experiments succeed should live asynchronous operation be enabled.

Measure:

- CPU utilization;
- GPU utilization;
- queue volume;
- confluence hits per second;
- response latency;
- nodes eliminated;
- total wall-clock improvement.

The baseline comparison is not theoretical asymptotics. It is:

\[
\frac{T_{\text{best standalone exact solver}}}
{T_{\text{hybrid exact solver}}}.
\]

---

## 23. Failure Modes

The architecture has several clear ways to fail.

### 23.1 Symbolic Boundary Explosion

The backward solved region may become too large to construct or publish economically.

Then the architecture provides no benefit regardless of forward search behavior.

### 23.2 Low Intersection Probability

Forward search may visit very few states represented by the backward solver.

Then the engines are individually useful but poorly coupled.

### 23.3 Cheap Forward Continuation

Even if collision frequency is high, the states being solved may already be inexpensive for alpha-beta.

Then confluence saves little work.

### 23.4 Expensive Lookup

A backward representation may compress well but be too costly for arbitrary point queries.

A representation useful for BSFP propagation is not automatically a good tablebase representation.

### 23.5 Incorrect Abstraction

An abstraction may merge states whose exact continuations differ.

This is a correctness failure, not merely a performance failure.

Every compression technique must therefore be validated against exact semantics before its performance matters.

---

## 24. Architectural Consequence of a Flat Residual Representation

The most interesting possible outcome is that exact residual-state experiments reveal a small bounded state space.

Suppose a cut requires at most \(k\) binary frontier variables and \(c\) residual-history bits.

Then the state space has at most

\[
2^{k+c}
\]

keys.

If, for example,

\[
k=20
\]

and no additional history class is required, then

\[
2^{20}=1,048,576.
\]

A one-bit property over all keys occupies only

\[
2^{20}/8=131,072\text{ bytes},
\]

or 128 KiB.

Even several value planes or transition tables may therefore remain small enough for highly regular GPU memory access.

If this result holds, persistent pointer-based BDD/ZDD structures could become unnecessary for that phase of the solver.

The BSFP computation could instead resemble

\[
\text{ordered structural stream}
\rightarrow
\text{bounded residual state}
\rightarrow
\text{flat transfer operation}.
\]

Such a result would also simplify confluence dramatically because the forward solver could potentially compute the same compact exact key.

This possibility deserves direct investigation.

---

## 25. System Ownership

A clean implementation should preserve strict ownership.

### Forward exact solver owns

- forward proof tree;
- alpha-beta state;
- move ordering;
- forward transposition tables;
- request generation;
- propagation of returned values.

### CUDA-BSFP owns

- backward recurrence;
- symbolic or residual representation;
- legality of backward-generated states;
- solved-set correctness;
- publication construction.

### Confluence service owns

- published epoch identity;
- canonical query API;
- membership/value lookup;
- request/result correlation;
- atomic publication visibility.

No component should become a second authority for another component's state.

---

## 26. Exactness Theorem for Hybrid Substitution

Let the forward solver be exact when executed without confluence.

Let a confluence query return either `Unknown` or an exact game-theoretic value.

Then replacing the recursive evaluation of any forward node \(s\) by a non-`Unknown` confluence value preserves exactness.

### Proof

Assume the confluence service returns

\[
Q(s)=V(s).
\]

Without confluence, the exact forward solver would recursively evaluate descendants of \(s\) and eventually compute the same value

\[
V(s).
\]

Substituting \(Q(s)\) therefore replaces an exact computation with an equal exact result.

All ancestor values are functions of child values under the same exact minimax recurrence.

Therefore every ancestor value remains unchanged.

Applying this substitution to any number of nodes preserves the value of the root.

Hence

\[
V_{\text{hybrid}}(s_0)=V_{\text{forward}}(s_0).
\]

\[
\boxed{\text{QED}}
\]

This theorem requires no particular backward representation.

The only critical assumption is the exactness of every published non-`Unknown` answer.

---

## 27. Research Hypotheses

The architecture reduces to several concrete hypotheses.

### H1 — Exact symbolic compression exists

A useful subset of Connect Four backward semantics admits a representation substantially smaller than explicit state enumeration.

### H2 — The representation supports economical point queries

Arbitrary canonical forward states can be classified as

\[
Unknown/W/D/L
\]

without reconstructing the original state space.

### H3 — Forward and backward difficulty are complementary

The backward solved set intersects states whose forward continuation is disproportionately expensive.

### H4 — Publication overhead is smaller than eliminated work

\[
T_Q<S.
\]

### H5 — Residual-state equivalence is small

A bounded frontier representation, perhaps with a small residual-history class, is sufficient for some or all BSFP stages.

None of these hypotheses is guaranteed. Each can be directly tested.

---

## 28. Discussion

The principal insight of this architecture is not that a CPU and GPU can run simultaneously. That fact is trivial.

The deeper proposal is to construct a **semantic confluence boundary** between two independently exact but structurally different proof mechanisms.

The forward solver asks:

> What happens from this exact state?

The backward solver asks:

> Which earlier states have already been mathematically classified by the solved region I have constructed?

Confluence occurs when both questions refer to the same state.

At that moment, the remaining forward proof becomes unnecessary.

This permits a new kind of heterogeneous solver in which compute engines do not divide the tree spatially or compete for shared transposition-table ownership. Instead, they independently generate exact knowledge and exchange only certified results.

The architecture is therefore compatible with aggressive experimentation inside either solver.

A new BSFP representation does not require redesigning alpha-beta.

A new forward proof engine does not require changing the fixed-point recurrence.

Only the exact query contract is shared.

---

## 29. Conclusion

Asynchronous hybrid Connect Four solving is theoretically straightforward once the boundary between the two solvers is defined correctly.

The safe architecture is not based on opportunistic collisions between transient streams and does not depend on an assumed strategic quotient.

It is based on a stronger invariant:

\[
\boxed{
\text{The backward solver publishes an exact, queryable solved region.}
}
\]

The forward solver may substitute any exact result obtained from this region and remain mathematically identical to a standalone exact proof search.

The primary research challenge is therefore shifted away from concurrency and toward representation:

\[
\boxed{
\text{Can CUDA-BSFP construct a sufficiently compact exact solved region that supports cheap arbitrary queries?}
}
\]

If the answer is yes, asynchronous confluence provides a principled way to exploit it.

If residual-function analysis further reveals a small bounded frontier state, the architecture becomes especially attractive: the same compact representation that makes BSFP efficient may also provide the natural key through which the two exact solvers meet.

The proposal is therefore best understood not as a finished solver design, but as a precise research program.

Its central claim is modest but consequential:

> **Two exact solvers operating in opposite directions need not share a search tree to cooperate. They need only share an exact semantic boundary.**
