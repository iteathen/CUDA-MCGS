# Conformance

This product area will own:

- the deterministic Search IR reference backend;
- synthetic domains;
- contract and compatibility suites;
- golden boundary cases;
- differential tests across implementations;
- capability matrices.

Conformance consumes public contracts only and must not become a hidden production dependency.

The initial suite must cover transpositions, cycles/history, stochastic/chance behavior, lazy very-large actions, multiple evaluator modes, backup modes, and resource exhaustion.
