# CUDA-MCGS Security Policy

CUDA-MCGS is pre-release research and engineering software. Security reports are welcome, especially for issues involving native execution, generated CUDA code, executable schemas, unsafe resource access, credentials, supply-chain integrity, or repository automation.

## Report a vulnerability

Do **not** open a public issue containing exploit details for a vulnerability that could expose credentials, private data, arbitrary native execution, unsafe pointer/resource access, or another exploitable security boundary.

Use GitHub's private vulnerability reporting / Security Advisory flow for `iteathen/UMCGS` when it is available. If private reporting is unavailable, open only a minimal public issue asking the maintainer to establish a private security contact; do not include vulnerability details, secrets, proof-of-concept payloads, or sensitive logs in that issue.

Include the detailed reproduction only through the private channel: affected commit/version, platform, Node/CUDA/Driver/toolkit/GPU identity where relevant, expected behavior, observed behavior, minimal reproduction, and any evidence that secrets or external systems may have been affected.

## Supported security posture

This repository is pre-release and does not yet publish a production support window. Security fixes are evaluated against current `main` and any explicitly identified released artifact. A report against an older revision may require confirmation against current code before remediation.

## Native and generated-code boundaries

Treat CUDA modules, JIT inputs, schemas that select executable behavior, function/resource identities, and generated code as executable or security-sensitive content. Public APIs must not expose arbitrary native addresses, unchecked executable schemas, credentials, or private provider paths as ordinary data.

Security checks fail closed. Compatibility, performance, or developer convenience is not a reason to downgrade a demonstrated security failure into a warning.

## Secrets and publication

Never commit tokens, passwords, private keys, credentials, private endpoints, private user data, or captured environment secrets. Scrub logs, benchmark evidence, generated artifacts, crash dumps, screenshots, and issue attachments before publication.

If a secret is committed or disclosed, deletion alone is insufficient: revoke or rotate it, preserve bounded incident evidence, and inspect downstream copies and automation according to the repository cleanup/security rules.

## Third-party material

Third-party code or substantial copied material requires exact provenance, revision, license compatibility, and review before integration. See [`LICENSING.md`](LICENSING.md), [`CONTRIBUTING.md`](CONTRIBUTING.md), and [`agent_files/general_foundation/SECURITY.md`](agent_files/general_foundation/SECURITY.md).
