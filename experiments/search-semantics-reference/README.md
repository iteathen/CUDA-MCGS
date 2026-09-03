# CUDA-MCGS search-semantics reference experiment

**Status:** Informational

This CUDA-free experiment is the behavioral/reference evidence lane for `ENGINE-REFERENCE-01`. Semantic owners keep their own bounded oracles; the final integration layer consumes their canonical evidence and verifies cross-owner closure without becoming another interpreter.

## Authority and current candidate base

Protected semantic authority remains:

`main@3ecac11e3576bd063760bc9572f79bea78acd031`

The exact integrated candidate/reference input to `REF-INTEGRATE-01` is:

`experimental/portfolio@85c20d794746031d201f72bc78fce25ff9f69c3d`

tree `5eadec7f403a388ea096f983ebf2e87eca2465f0`.

That candidate already contains the qualified Domain, Graph, Policy, Evaluator, Resource, Progress, Output, Framework, terminal, Session, Stage, and Channel reference leaves. Candidate integration is not protected #122 acceptance, native CUDA qualification, production readiness, or product support.

## Active final reference leaf

Issue #36 / `REF-INTEGRATE-01` uses branch `ref/integrate-01`.

The final verifier is intentionally thin:

- `run-integration.mjs` consumes generated owner evidence only;
- `run-integration-gate.mjs` freezes the exact input evidence identities and executes integration-boundary mutations;
- `integration-cases.json` names required product-neutral, deletion, schedule, and replica-neutrality witnesses already owned by existing capsules;
- `run-engine-reference-integration.mjs` regenerates the complete evidence chain before running the final gate;
- `engine-reference-integration.yml` qualifies the packet on Node 26 and retains the evidence artifact.

No Domain, Graph, Policy, Evaluator, Resource, Progress, Output, Session, Stage, Channel, or Framework state machine is reimplemented here. No native/CUDA/private CUDA-JS path is introduced.

## Final packet contract

The final packet must prove exactly:

- `352` direct non-Channel `ENGINE-REFERENCE-01` behavioral requirements;
- `41` SPEC-0004 Channel requirements through the existing Channel owner evidence;
- `393` CUDA-free reference requirements total;
- `52` native-compatible-pair requirements still deferred;
- one exact Composer composition identity across all consumers;
- exact presence of all required owner evidence packets;
- materially different product-neutral instances;
- optional owner/capability/product deletion and zero-residue behavior;
- materially different legal schedule witnesses;
- finite independent semantic replicas whose opaque device labels do not alter one-device meaning;
- content-sensitive final evidence identity;
- no product-specific or native-support claim.

Multi-device evidence is deliberately limited to device-count-neutral semantic packaging. It does not define cross-device coordination, aggregation semantics beyond terminal-only evidence packaging, or multi-GPU support.

## Red-before-green evidence

The first final-verifier checkpoint intentionally omitted the integration witness fixture. Run `33707203690` at head `6b5cb57521ba3a656e7e75ab2902d1630691eb41` regenerated every upstream owner capsule successfully and then failed exactly with `INTEGRATION_FIXTURE_MISSING`. The retained artifact is `9875632375`.

The first green packet run `33707424655` then exposed a review-level evidence gap: the live packet was asserted, but the promised integration mutation matrix did not explicitly demonstrate rejection of all required corruption classes. No owner semantic defect was found.

The repaired gate on checkpoint `a58997d444e33bc1697c2cd92249ecd8f5017aa0` passed run `33707930265`:

- baseline integration cases `11/11`;
- direct routes `352`;
- Channel routes `41`;
- reference total `393`;
- native deferred `52`;
- integration-boundary mutations `7/7` detected;
- baseline integration evidence `85373be650852a997cb4d57f5fbc6b972e0c5e5925cff496933bb1a47b078a46`, `14594` canonical bytes;
- mutation-gate evidence `183f753e2595c3401e2642563edaa84ffbfd20083d6f44fc0bb259d60da58046`, `4542` canonical bytes;
- artifact `9875893868`, digest `sha256:c3a8c7a4dc1bf363c0eacd335ed2282bb62dac7ec0ffa0e4ff9e17af45997404`.

The mutation matrix detects missing owner evidence, substituted owner identity, missing required witness, false native-route promotion, Channel route loss, divergent replica semantics, and final evidence-identity corruption. File mutations occur only in the disposable CI workspace, are restored in `finally`, and the exact baseline packet is rerun afterward.

## Run

Use Node.js 26 or newer:

```bash
node scripts/run-engine-reference-integration.mjs
```

This regenerates the owner evidence chain and runs both the final packet verifier and mutation gate.

## Current gate

Current-state documentation is being reconciled on `ref/integrate-01`. The real draft PR against `experimental/portfolio` is the next qualification surface because it triggers both the dedicated final integration gate and the full repository/documentation matrix on the same candidate head.

After all exact-head PR workflows and a fresh complete author review are green, freeze the exact head/tree and stop for fresh repository-owner exact-head authorization before candidate integration. Authorization previously supplied for PR #191 does not authorize #36.

## Claim limits

This is CUDA-free, product-neutral reference evidence. It does not establish protected #122 semantic acceptance, native Device-JS/CUDA lowering, release/acquire races, physical GPU progress, multi-GPU support, performance, production readiness, release readiness, stable SDK compatibility, or downstream product semantics.