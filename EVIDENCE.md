# Evidence status

This repository follows the shared [iteathen evidence and validation policy](https://github.com/iteathen/.github/blob/main/EVIDENCE_POLICY.md).

## Current posture

CUDA-MCGS is a public pre-release framework. Its CUDA-free reference implementations, Search IR checks, package/interface tests, and conformance runners are **INTERNAL-QUALIFICATION**. They do not establish a physically qualified production GPU-resident search runtime.

## Registered claims

| Claim | Evidence class | Status |
| --- | --- | --- |
| `MCGS-INT-001` — maintained reference/conformance cases satisfy the repository's accepted contracts for their tested scope | **INTERNAL-QUALIFICATION** | repository-controlled |
| `MCGS-GPU-001` — the complete framework is physically qualified as a production GPU-resident search runtime | **UNVALIDATED** | explicitly open |

Machine-readable records: [`evidence/claims.json`](evidence/claims.json).

## What current evidence establishes

The repository can establish deterministic Search IR normalization/reference behavior, interface/package contracts, and the exact portable/conformance cases covered by its maintained checks.

## What it does not establish

Portable/reference success does not establish native CUDA correctness, device-resident end-to-end progression on physical hardware, production reliability, performance, or third-party reproduction.

## Path to stronger evidence

Physical qualification must pin a compatible CUDA-MCGS/CUDA-JS(/Tensor where used) revision set, hardware/driver/Node environment, domain/profile, launch and progression evidence, termination/result correctness, resource bounds, raw logs, and measured performance where claimed.

## Non-mutation rule

Evidence work may run reference, conformance, adapter, and physical qualification paths. It must not alter search semantics, Search IR contracts, device progression, evaluator behavior, resource policy, or runtime implementation merely to make an evidence result pass.
