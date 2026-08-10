# Packaging

UMCGS release composition, execution-package manifests, compatibility matrices, reproducibility metadata, installation/distribution packaging, and release verification live here.

Packaging consumes declared UMCGS component outputs and released/versioned CUDA-JS public artifacts. It must not reach into UMCGS component internals, CUDA-JS private source, branches, worktrees, local build directories, or incidental generated paths.

For each compatible UMCGS/CUDA-JS pair, manifests must identify where material:

- UMCGS and CUDA-JS package versions and exact tested revisions/artifacts;
- public contract/schema versions;
- generated search package, generator/compiler, and complete cache identity;
- host binding backend and platform/CPU ABI;
- Node runtime, CUDA driver/toolkit, GPU architecture, and build flags;
- evaluator/model/adapter and resource profile;
- checksums, provenance, conformance tier, and known limitations.

The UMCGS package may compose or depend on a released CUDA-JS package. It may not vendor an untracked copy as a second source of truth.

A future installer that coordinates independently released peer projects should be a peer repository consuming these manifests rather than internal source paths.