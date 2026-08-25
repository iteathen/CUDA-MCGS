# Linux-first native execution direction

**Status:** Informational

**Authority:** Project-owner direction and CUDA-JS ADR-0006

**Date:** 2026-08-25

**Current phase:** Dependency planning only; no CUDA-MCGS native Linux or product support claim

## Decision

CUDA-MCGS adopts native Linux x86-64 as the reference platform for its first finite native universal engine and exact CUDA-JS compatible pair. Ubuntu 24.04 LTS is the first exact qualification cell selected by CUDA-JS; CUDA-MCGS remains distribution-neutral at its semantic, Search IR, Search Program and execution-package boundaries.

Windows is not removed. Existing CUDA-JS Windows evidence remains valid and a CUDA-MCGS Windows profile may be qualified later, but Windows no longer determines the forward native-engine sequence. WSL is a separate profile and cannot substitute for native Linux evidence.

## Why this does not change the universal core

Platform identity belongs to the CUDA-JS adapter/realization and exact compatible-pair evidence. CUDA-MCGS core contracts continue to own product-neutral graph/search/policy/evaluator/output/resource/session meaning without OS, loader, Driver-model or distro assumptions. The same normalized Search IR and Search Program/package inputs must remain portable; platform/toolchain/device facts enter only the lowering/package/evidence identity that can change native realization.

The current Windows-first wording was a sequencing artifact from available hardware, not a semantic dependency. Replacing it does not reopen completed CUDA-free reference evidence or accepted CUDA-JS Windows qualification.

## Dependency path

1. Complete `ENGINE-IR-COMPOSER-01`, universal reference evidence and `ENGINE-CONTRACT-ACCEPTANCE-01` without native circularity.
2. Complete CUDA-JS issue #4's canonical Linux DriverActor, compiler-provider and installed-package chain on exact Ubuntu 24.04 hardware.
3. Freeze one CUDA-MCGS Search Program/package/adapter artifact and one selected CUDA-JS revision/package.
4. Run the first exact single-device Linux compatible-pair evidence under CUDA-JS issue #32.
5. Build and qualify `ENGINE-LINUX-01`, the first finite terminal native universal engine, through public CUDA-JS contracts only.
6. Run representative Linux resource/performance work after correctness and lifecycle pass.
7. Qualify the independent-replica multi-GPU profile only on a controlled native Linux host with at least two independently visible physical GPUs.

## Ownership

CUDA-MCGS owns restricted Device-JS/Search Program source, semantic/package identity, finite search resources, reference equivalence and product result meaning. CUDA-JS owns Linux Driver/toolkit/provider discovery, Node FFI, selected-device/runtime/context/resource ownership, generated CUDA artifacts, generic operations, health, cleanup and platform qualification.

No CUDA-specific source, direct FFI, native addon, embedded PTX/CUDA or subprocess native search implementation enters CUDA-MCGS.

## Qualification limits

- Portable Linux reference results do not prove native Linux CUDA.
- CUDA-JS Linux qualification does not prove a CUDA-MCGS compatible pair.
- A one-GPU Linux pair does not prove explicit selection between distinct devices or multi-GPU behavior.
- Windows results do not become Linux results, and Linux results do not erase Windows evidence.
- Ubuntu 24.04 evidence promotes only its exact Node/OS/ABI/Driver/toolkit/provider/GPU/package profile.
