# Public Repository Transition

**Status:** Informational

**Updated:** 2026-08-12

This document is the operational checklist for changing `iteathen/UMCGS` from private to public visibility. It does not itself change repository visibility and it does not represent a CUDA-MCGS product release.

## Intended public posture

Once visibility is public:

- `main` remains the canonical integration trunk;
- contributors use forks or short-lived branches and pull requests rather than private intake repositories;
- CODEOWNERS and branch/ruleset protection should require owner review for foundational authority and other configured protected paths;
- GitHub-hosted documentation/reference CI is an active public-repository validation surface;
- issues and pull requests are public unless a security report requires a private vulnerability channel;
- AGPL-3.0-or-later plus the separately negotiated commercial-license option remains the licensing model;
- public visibility does **not** mean production readiness, native Linux support, a stable API, or a released CUDA-MCGS/CUDA-JS compatible pair.

## Hard pre-visibility gates

Before changing visibility, verify all of the following against the exact intended public `main` revision:

1. **License and legal surface**
   - `LICENSE` contains the GNU Affero General Public License v3 text;
   - `LICENSING.md` states `AGPL-3.0-or-later` and the commercial-license path;
   - third-party/source-donor provenance remains explicit;
   - contribution terms preserve the project's ability to distribute accepted contributions under the open-source and separately negotiated commercial models.
2. **Security and history**
   - current tree contains no credentials, private keys, tokens, private endpoints, private user data, machine-specific secrets, or sensitive retained artifacts;
   - repository **history**, not only the current tree, has been scanned for secrets and private material;
   - any discovered credential has been revoked/rotated before publication; rewriting history alone is not a credential-remediation strategy;
   - commit metadata, issue/PR history, filenames, research evidence, screenshots, logs, and generated artifacts have been reviewed for material that was safe only because the repository was private;
   - historical author/committer names and email addresses have an explicit owner disposition before publication.
3. **Public collaboration**
   - `CONTRIBUTING.md` describes fork/PR contribution flow;
   - `SECURITY.md` provides a non-public vulnerability-reporting path;
   - issue and pull-request templates do not instruct contributors to use private intake repositories;
   - CODEOWNERS names the intended owner(s).
4. **CI and branch protection**
   - `.github/workflows/docs.yml` is appropriate for untrusted public pull requests and requires no repository secrets;
   - workflow permissions remain least-authority (`contents: read` unless a reviewed job needs more);
   - public `main` protection/ruleset is configured after visibility changes to require the intended checks and owner review;
   - no workflow accepts arbitrary PR-controlled code while exposing repository secrets or write authority.
5. **Public claims**
   - README and STATUS clearly distinguish public repository visibility from production/release/support claims;
   - private-only collaboration language has been removed from current operating documents or retained only as clearly historical/archive material;
   - documentation indexes resolve and `./scripts/verify-docs.sh` passes on the exact public-ready head.

## History and metadata findings

The connected GitHub history listing shows historical commits whose author and, for some commits, committer identity includes a **personal non-GitHub-noreply email address**. Public repository visibility exposes raw reachable Git commit metadata. The exact address is intentionally not duplicated in this public-transition document.

Before publication, the repository owner must choose one disposition:

- **accept exposure** of the existing address as intended public commit metadata; or
- **authorize a history rewrite** to replace/redact it after separately assessing the consequences.

A history rewrite is high-consequence: it changes commit SHAs, can invalidate signatures and exact-revision evidence, breaks historical links/references, affects branches/tags/clones, and requires downstream reconciliation. It must not be performed merely for cosmetic cleanliness.

## History-scan limitation

GitHub secret-scanning alerts for the current private repository were not accessible to the connected integration during this preparation pass. Therefore this document deliberately does **not** certify the full Git history as secret-free.

Before the visibility switch, perform an authenticated full-history secret scan using an appropriate local or GitHub security tool and inspect any findings. This is a hard gate because making a repository public exposes reachable Git history, not only the current checkout.

## Visibility-switch sequence

1. Freeze the exact public-ready `main` SHA.
2. Complete the full-history secret/private-material audit and resolve every blocking finding.
3. Accept the existing historical commit-email exposure or complete an explicitly authorized history rewrite and reconcile all affected revisions/signatures/refs/evidence.
4. Confirm there are no open temporary PRs/branches or retained artifacts that should remain private.
5. Change repository visibility to public in GitHub settings.
6. Immediately configure/verify branch protection or rulesets for `main`, including required checks and owner review as intended.
7. Verify Actions are enabled and the public documentation/reference workflow runs successfully on the public repository.
8. Read back repository visibility, default branch, license detection, README, SECURITY, CONTRIBUTING, CODEOWNERS, issues, and workflow status.
9. Verify no repository secret, deploy key, runner, environment, or external integration gained unintended exposure or authority because of the visibility change.
10. Record the exact public-transition SHA/date in `STATUS.md` if a durable publication record is useful.

## Rollback and incident handling

Changing a repository back to private does not retract clones, forks, caches, package copies, screenshots, or already exposed credentials. Treat accidental publication of sensitive material as an incident: contain access, rotate/revoke secrets, preserve bounded evidence, assess downstream copies, and follow [`SECURITY.md`](../../SECURITY.md) plus the cleanup doctrine.

## Not a release gate waiver

Public repository visibility is independent from CUDA-MCGS product release. The project remains pre-release until its separate specifications, implementation, compatible-pair, platform, evidence, packaging, and release gates are satisfied.
