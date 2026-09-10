# Gate #32 evidence review

**Status:** Accepted

Decision: ACCEPT the recorded exact Windows physical compatible pair. No blocking correctness finding in the reviewed evidence. This is an evidence review by the executing Codex agent, not a separate human or independent-agent approval. The project owner approved this review and directed gate closure.

Authority: https://github.com/iteathen/CUDA-JS/issues/32 (current body, read during review). Protected heads re-read unchanged on 2026-09-10 UTC.

## Acceptance mapping

| Requirement | Review result |
| --- | --- |
| Exact protected source pair | PASS: CUDA-MCGS 41215dd65432f6c9a9d2bf146aaf82fe5d2f2fed/tree 405e189b08417ae777d89262e48167fd60243e80; CUDA-JS 97c0295ab79add204d4d8ced080a4da4b66149cf/tree ce03b3b9f598776c8d9e8ec6a59245da75941eb8; alpha.19/API 1. Runner validates tracked-clean trees and public root realpath before import. |
| Host/process ABI | PASS: native Windows 11 x64, Node 26.7.0/module ABI 147, experimental FFI. Host observations identify ASUS physical system and GTX 1660 Ti. HypervisorPresent is true on this Windows host; it is not by itself evidence of a guest VM. Qualification and actual native execution corroborate the directly exposed WDDM GPU profile. |
| Driver/provider/device/target | PASS with companion host evidence: driver 610.74, Driver API 13030, GTX 1660 Ti cc7.5, compute_75/sm_75; native JSON records exact NVRTC/builtins/nvJitLink 13.3 hashes and CCCL manifest. The public pair JSON deliberately records architecture rather than GPU marketing name or driver package version; prior host inspection and hardware public-summary supply those fields. |
| Production program/artifact identity | PASS: reconstructed Program Package, Search Program and execution-package hashes from the recorded pair; all equal evidence. Compiled artifact bytes match module request/result hashes. Cache disabled; one NVRTC program. No explicit linker transaction was selected (links created/destroyed 0/0); provider/target identity retained. |
| Bounded useful launch | PASS: 4 x 256 = 1024 useful work items; shared memory 0. |
| Channel release/acquire | PASS: accepted semantic handoff includes release-store/acquire-load and block barrier; observed consumer word 305419897 = payload 305419896 + readiness 1. Source/runner examined, not inferred only from status. |
| No host intermediate/relaunch | PASS: one submit, prepare/ignite/wait/deliver/close protocol; only host write is verified all-zero initialization of separate Channel storage; zero mailbox loads/stores. |
| Completed terminal Output | PASS: main and D2H child completed, child closed; independently decoded all 1024 words and recomputed byte digest. Exactly 4096 bytes delivered at offset 0 from Output memory-1; Channel is memory-0. |
| Pressure/failure/timeout/health | PASS within selected scope: one pending workload, healthy completion; no observed deferred failure or timeout. Portable PAIR-F01..F16 separately pass; not physical fault injection. |
| Cleanup truth | PASS: graceful aggregate close, both workers exit 0, program create/destroy 1/1, driver live/closing/orphaned 0/0/0, 14 closed; no retained resources, quarantine or restart required. |
| Lower neutrality | PASS: native recorded 114-file lower source/public-contract scan; portable F16 passes; runner imports public cuda-js and production adapter. No private CUDA-JS import or consumer-local FFI/native transaction found in examined runner/recorder. |

## Resolved review questions and limits

Output backing allocation is 12288 bytes and Channel allocation 49152 bytes. Reconstructed accepted Resource owners reproduce both values. The required Output delivery reserve is exactly 4096 bytes; larger backing capacity is not an extra delivery or an alias with Channel.

The native runtime reports testing-unconfirmed/nativeQualified false. That is the pre-promotion support registry state, not failed execution; this review qualifies only the recorded tuple and does not mutate the registry.

The later F8 version-assertion repair and full hardware pass belong to local CUDA-JS 0c0d33972270d518a3405def90873d5759ef3773. They are supplementary host evidence, not substituted for the protected pair. The only source difference is conformance/f8/verify.mjs's alpha.18 -> alpha.19 expectation. Gate #32 itself passed on the protected revision before this edit.

Acceptance relies on the original tool-observed native execution and pre-run remote/clean-tree checks plus the retained artifacts. JSON alone is not signed hardware attestation. This review content-addresses the original artifacts without modifying them; hashes identify local evidence, not external publication. No Linux #4, other GPU/toolchain, production stability, performance, or fault-injection claim follows.

## Reproducible review and evidence identity

review.mjs independently reconstructs the three program identities, checks all terminal words/hash, compile/load identity, launch, initialization, resource separation and cleanup. Execution result: PASS. The original local review script completed successfully; the recorded original evidence hashes below identify its inputs.

- native.json SHA-256: 4846ff8d9cb625a9fb1c8ce2b6718fba90158b87047547725d8bb92008897653
- portable.json SHA-256: 03ce13e81b16ac99388d87ff0d88fc95f6b52e58c75d6829a4304a3c2ecfa0ed
- terminal bytes SHA-256: 5c8ee0ac5d9073a58dc688621e43a3d87146757dab23f5ed1e72a65eb792203a

Technical evidence review is complete and owner-approved. This record publishes the accepted exact-pair evidence.

## Published derivative

The published native JSON redacts only the local checkout path and normalizes JSON formatting. Portable JSON removes the preceding console PASS lines and normalizes formatting. Original hashes above remain original-input provenance, not hashes of these public derivatives. See SHA256SUMS for public file integrity.
