# Cleanup, Reconciliation, and Artifact Disposition

**Scope:** Every task, plan node, experiment, investigation, implementation, migration, sanity check, PR, merge, release, interruption, failure, rollback, and handoff that creates, changes, reserves, supersedes, or exposes state beyond the intended durable result.

## Purpose

Engineering work creates more state than the final product change. It may create local files and folders, downloaded evidence, generated output, caches, build artifacts, logs, patches, worktrees, stashes, branches, pull requests, comments, processes, ports, containers, GPU contexts, locks, credentials, backups, test data, temporary permissions, remote objects, and partially completed transitions.

Unowned residue is not merely untidy. It can become:

- accidental authority;
- stale input to later work;
- a source of data loss or security exposure;
- hidden cost or resource leakage;
- a collaboration and branch-conflict hazard;
- misleading evidence about project state;
- an obstacle to rollback, recovery, reproduction, or continuation.

The governing rule is:

> Every task-created, temporarily modified, superseded, generated, diagnostic, local, remote, external, sensitive, partial, and coordination item has an explicit owner, lifecycle, final disposition, and verification. Work is not complete until temporary state is removed or restored, retained state is justified and owned, obsolete state is archived or superseded correctly, partial state is reconciled, and anything that remains is visible to the next consumer.

Cleanup is the final state transition of the work. It is not cosmetic and it is not blind deletion.

## Cleanup means disposition, not deletion

Every material item receives one explicit disposition:

- **remove** — delete task-owned state whose purpose and evidence/rollback value have ended;
- **restore** — return temporarily modified state to a verified pre-task value;
- **retain as authority** — keep because an accepted specification, contract, schema, source, manifest, migration, or product artifact owns it;
- **retain as bounded evidence** — keep only the evidence needed for audit, reproduction, debugging, provenance, benchmarking, or a downstream decision;
- **retain as recovery state** — keep a checkpoint, backup, journal, or rollback artifact until an explicit recovery boundary passes;
- **archive** — move historically useful or superseded material out of active execution paths with provenance, date, reason, successor, and removal context;
- **quarantine** — isolate unsafe, incompatible, unlicensed, suspect, or failed material so ordinary tooling cannot consume it;
- **transfer ownership** — hand the item to another declared owner, issue, component, operator, or plan node with exact state and acceptance conditions;
- **supersede** — replace the active meaning with a newer authoritative form while preserving required history and making the obsolete form unmistakable;
- **retain temporarily** — keep only with a named owner, exact location, reason, risk, expiry or removal trigger, and follow-up path;
- **protect unchanged** — preserve pre-existing, user-owned, shared, or unrelated state outside the task’s authority.

Deletion without ownership and dependency analysis is not cleanup. Retention without an owner and removal trigger is not cleanup.

## Authority and protected state

Cleanup follows the normal authority order. Agents may not delete, reset, overwrite, rewrite, redact, close, revoke, archive, or supersede without exact authority when the item is:

- user-created or pre-existing uncommitted work;
- shared by another active workstream;
- project authority or current source of truth;
- required evidence, provenance, audit, or security state;
- a rollback or recovery checkpoint whose boundary has not passed;
- persisted or remote state owned by another system;
- a protected/default branch or shared integration branch;
- an open PR, branch, issue, release, package, artifact, or claim with active dependents;
- a credential, permission, account, or external resource whose lifecycle is governed elsewhere;
- a file or directory whose ownership or use is not understood.

When disposition is ambiguous, preserve the item safely, make it non-authoritative when possible, record the uncertainty, and obtain a decision. Do not guess destructively.

## Cleanup scope

Agents are responsible for:

- state they created;
- state they modified temporarily;
- state their accepted change makes obsolete;
- invalid partial state from their failure, interruption, rollback, or abandoned approach;
- state explicitly assigned to their cleanup node;
- remote coordination state they created or made stale, including branches, PRs, claims, comments, labels, and review requests.

Agents do not use cleanup as permission for unrelated refactoring, repository beautification, broad dead-code deletion, history rewriting, or removal of unfamiliar files. Unrelated residue becomes a separate finding or issue.

A cleanup operation that changes behavior, public contracts, persisted meaning, compatibility, security, ownership, architecture, or release history is a normal governed change and must satisfy the relevant assessment, plan, review, migration, and validation rules.

## When a formal cleanup record is required

Routine task-owned scratch, ordinary ignored build output, and a feature branch with a normal directly verified PR lifecycle can be cleaned and reported inline.

Use [`../templates/cleanup-disposition.template.yaml`](../templates/cleanup-disposition.template.yaml) when any item is:

- pre-existing, user-owned, shared, or temporarily modified;
- remote, external, asynchronous, or eventually consistent;
- sensitive, credential-bearing, confidential, private, or provenance-controlled;
- retained evidence, rollback, recovery, migration, release, or compatibility state;
- a process, service, port, container, device context, lock, lease, permission, account, queue, database, storage object, or paid resource;
- difficult to identify or verify after deletion;
- expected to outlive the current operation, session, agent, or PR;
- part of an atomic transition with invalid intermediate states;
- blocked and requires independently tracked cleanup debt.

Do not create a formal ledger merely because temporary files existed. The record exists when another consumer needs the lifecycle evidence.

## Cleanup inventory

Before the first operation likely to create material residue, identify expected cleanup items. Add newly discovered items promptly.

For each material item record:

- stable cleanup ID;
- category and exact local or remote location/resource identifier;
- owner and whether it pre-existed the task;
- active dependents and shared users;
- purpose and operation that created or modified it;
- expected lifetime;
- planned disposition;
- dependency, expiry, merge, release, retention, or recovery trigger;
- exact cleanup method;
- required authority or permission;
- evidence, rollback, security, privacy, provenance, and data-loss implications;
- verification method;
- current status.

An item omitted from the original plan does not become exempt from cleanup.

## Cleanup categories

### Repository source and tracked files

Track as applicable:

- scratch source, scripts, patches, fixtures, and copied examples;
- debug-only code, temporary assertions, feature flags, and test seams;
- commented-out alternatives and temporary TODO markers;
- dependencies, imports, configurations, or workflow changes introduced by the task;
- stale generated files and duplicated generated/source authority;
- moved or renamed files left at obsolete paths;
- proposal, report, or planning files whose durable information has moved elsewhere;
- documentation made stale by the accepted change;
- remote repository files created for experiments, reports, or handoffs.

Historically useful stale material is archived rather than silently deleted. The archive records when, where, why, by what change, and what superseded it. Pure task-created scratch with no historical, evidence, rollback, or provenance value is removed.

Do not delete a repository file merely because it appears unused. Establish ownership, references, generation, packaging, and compatibility consequences first.

### Local files, folders, and workspace state

Track as applicable:

- untracked files and directories;
- ignored scratch directories;
- downloaded papers, archives, models, datasets, binaries, and donor repositories;
- temporary logs, traces, screenshots, profiler output, dumps, and reports;
- build output, test output, coverage data, caches, temporary packages, and installer staging;
- temporary environment files, editor metadata, shell scripts, and configuration overrides;
- copied backups, restore points, and handoff bundles;
- modified file permissions, symlinks, mounts, and environment variables.

Before cleanup, distinguish task-owned state from user-created or pre-existing state. Never use broad destructive commands such as unscoped recursive deletion, `git clean -fdx`, or `git reset --hard` against a workspace whose complete ownership and recovery state are not proven.

Use narrow exact paths. Preview destructive selectors where possible. Verify absence or restoration afterward.

### Git local state

Track:

- local branches;
- worktrees;
- stashes;
- detached heads;
- uncommitted changes;
- cherry-pick, rebase, bisect, merge, or revert state;
- local tags or refs created by the task;
- task-specific hooks, config, remotes, credentials, and signing overrides.

Do not discard user changes or stashes. A local feature branch normally remains until its PR is merged, closed, superseded, or explicitly abandoned and recovery/dependent needs are resolved.

After safe integration or abandonment:

- remove the associated worktree;
- remove the local branch when no dependent work needs it;
- drop task-created stashes only after their contents are verified unnecessary;
- restore task-specific Git configuration, remotes, hooks, and signing/auth changes;
- prune stale remote-tracking refs when appropriate;
- verify the active branch and worktree status are intentional.

### Remote branches and refs

A remote branch is not temporary merely because its PR merged. Check:

- PR state and exact integrated target;
- stacked or dependent PRs;
- open issues or automation that reference the branch;
- release, audit, recovery, comparison, or provenance needs;
- branch protection and repository policy;
- whether the branch is the only remaining copy of unmerged work.

When safe, remove task-owned merged, closed, superseded, or abandoned remote branches. Never delete the default, protected, release, recovery, or shared integration branch without explicit authority.

If tooling or permission cannot delete a safe obsolete remote branch, record the exact branch and reason. Do not claim cleanup succeeded. Create cleanup debt only when the residue is material enough to need an independently owned follow-up.

### Pull requests, issues, reviews, and GitHub coordination

GitHub history is normally preserved rather than deleted. Cleanup means making current state truthful.

Track and reconcile:

- draft versus ready state;
- open, merged, closed, abandoned, or superseded PRs;
- PR base/head changes;
- review requests, approvals, requested changes, and unresolved threads;
- stale or duplicate PRs and issues;
- labels, milestones, assignments, claims, checklists, and dependency links;
- comments that incorrectly describe current head, plan, status, or blockers;
- closing keywords and whether merge actually satisfied issue completion;
- follow-up findings and cleanup debt;
- source-branch disposition after merge or closure.

Rules:

- A merged PR remains as history; do not attempt to erase it.
- Close an abandoned or superseded PR only after preserving the reason, successor, useful discussion, and any unmerged work.
- Do not close an issue merely because a PR merged unless the issue’s full acceptance criteria are satisfied.
- Resolve or transfer review threads truthfully; do not mark a concern resolved without evidence.
- Remove stale review requests, assignments, labels, or claims when they no longer describe active ownership.
- Update canonical issue/PR state before handoff or interruption.
- Verify remote state after every close, merge, reopen, retarget, branch delete, or metadata update.

### Remote files, artifacts, releases, packages, and caches

Track:

- workflow artifacts and caches;
- uploaded reports, bundles, logs, screenshots, and binaries;
- pre-release or release assets;
- package versions and registries;
- remote build/test output;
- temporary object-storage files;
- remote datasets, model packages, generated engines, and cache entries;
- publication staging and failed release candidates.

Do not delete published or externally consumed artifacts without compatibility, provenance, and recovery analysis. Remove temporary or failed staging artifacts after evidence and rollback needs end. Archive or quarantine artifacts that must remain for audit but must not be consumed as current.

A remote file deletion requires exact repository/resource, version, owner, dependents, retention policy, and post-delete verification.

### Generated, build, test, and package output

Generated forms must either:

- match their authoritative source and be intentionally committed or published;
- remain in an approved ignored build/cache location;
- be retained as bounded evidence;
- be archived or quarantined;
- or be removed.

Do not leave generator output in source directories merely because a tool placed it there. Remove stale outputs whose cache/source identity no longer matches. Preserve only the builds, checksums, manifests, reports, and packages required by the accepted process.

### Processes, ports, containers, devices, and operating-system state

Track:

- background processes and development servers;
- ports and sockets;
- containers, virtual machines, jobs, and scheduled tasks;
- file locks, distributed locks, leases, and reservations;
- mounted volumes and temporary filesystems;
- temporary databases and services;
- GPU contexts, CUDA modules, allocations, IPC handles, shared memory, and device-side diagnostic buffers;
- environment variables, PATH changes, system settings, and temporary permissions.

Before acceptance or handoff, stop, release, restore, transfer, or explicitly retain each resource. Process exit does not prove port, container, remote service, GPU allocation, lock, or external reservation cleanup. Query the owning system.

Do not terminate an unfamiliar process, container, job, or device context without proving task ownership.

### Persistence, migrations, backups, and test data

Track:

- temporary databases, save files, and copied state;
- schema versions, migration checkpoints, journals, dirty markers, and recovery scans;
- rollback backups and snapshots;
- synthetic users, identities, records, and datasets;
- compatibility copies and converted artifacts;
- failed partial migrations.

Do not delete backups before the rollback boundary passes. Do not leave failed partial migrations in an ambiguous state. Separate:

- authoritative migrated state;
- source retained for rollback;
- bounded recovery evidence;
- obsolete compatibility forms;
- test-only data;
- final deletion or archive trigger.

Sensitive or large test data requires an owner, protection, and expiry.

### Diagnostics, instrumentation, and observability

Track:

- temporary logging and tracing;
- debug flags and verbose payloads;
- profilers and sampling changes;
- fault-injection hooks;
- temporary endpoints, metrics, assertions, and test seams;
- device/host diagnostic buffers and dumps.

Before acceptance, remove temporary instrumentation or formally adopt it as bounded production observability with an owner, budget, privacy/security review, and failure behavior. Preserve decisive evidence before removing the instrumentation that produced it.

### Research, prototypes, donor material, and evidence

Track:

- prototypes and experiment code;
- experiment branches and temporary repositories;
- donor-project checkouts;
- downloaded papers, archives, source, models, and datasets;
- notebooks and one-off scripts;
- traces, raw logs, benchmark inputs, and outputs.

Prototype artifacts do not survive by default. At conclusion they are removed, archived, quarantined, or retained as a bounded reference with:

- owner;
- purpose;
- provenance and exact revision;
- license or permitted use;
- prohibited use;
- location and access controls;
- expiry or review trigger;
- downstream issue or plan node.

Evidence supporting a decision must survive in a durable, cited, protected form; redundant scratch copies do not.

### Security, credentials, permissions, privacy, and provenance

Track:

- temporary tokens, keys, certificates, credentials, sessions, and accounts;
- elevated repository, cloud, filesystem, database, or device permissions;
- copied confidential files and sensitive logs;
- credentials written to config, environment, shell history, artifacts, or GitHub comments;
- temporary provenance or license exceptions.

Secrets must not be committed or pasted into GitHub work records. If exposure may have occurred, deletion is insufficient:

1. revoke or rotate the credential;
2. remove or redact exposed copies through the owning security process;
3. preserve bounded incident evidence;
4. inspect downstream logs, caches, artifacts, forks, and histories as required;
5. create the appropriate security follow-up.

Restore elevated permissions and temporary access when no longer needed, and verify revocation through the owning system.

### External and paid resources

Track:

- cloud instances, storage, queues, topics, databases, functions, and networks;
- test accounts, API objects, webhooks, integrations, and deployments;
- DNS, certificates, domains, tunnels, and callbacks;
- rented hardware, GPU jobs, reservations, and paid services;
- temporary directories or files on remote hosts.

Record exact external identifiers. Stop billing and release capacity promptly when no retention dependency remains. Verify remote final state; a local command returning successfully is not proof.

## Controlled cleanup lifecycle

Cleanup occurs throughout the task.

### Preflight

Before creating material exceptional state:

- capture a trustworthy pre-state;
- identify protected user/shared/authority/evidence/recovery state;
- create or update the cleanup inventory;
- define expected final state and disposition triggers;
- identify rollback-critical items;
- define evidence retention and verification;
- identify post-merge or delayed cleanup that cannot safely happen earlier.

### During execution

After each operation:

- register newly created or discovered state;
- avoid temporary state when an existing bounded mechanism suffices;
- update owner/disposition after a plan variation or deviation;
- remove completed scratch when no evidence, rollback, dependent, or integration need remains;
- preserve evidence and recovery state until their boundaries pass;
- verify remote/asynchronous state through the owning system;
- keep unrelated pre-existing residue outside edit scope.

### Before node acceptance or PR readiness

- reconcile every material inventory item;
- remove or restore task-owned temporary local state;
- remove temporary instrumentation, credentials, processes, ports, locks, containers, device allocations, and permissions;
- reconcile tracked and generated files, caches, build output, packages, and documentation;
- identify retained evidence/recovery/authority state with owners and triggers;
- reconcile issue, branch, PR, review, label, claim, and dependency state;
- verify actual disposition;
- create bounded cleanup debt only where cleanup cannot safely complete yet;
- block acceptance when residue creates material correctness, security, cost, collaboration, provenance, or accidental-authority risk.

### After merge, release, closure, or abandonment

Perform cleanup that could not safely happen before integration:

- verify the target branch and resulting integrated revision;
- remove task-owned local and remote branches and worktrees when safe;
- close or supersede abandoned/duplicate PRs and issues with truthful history;
- release review requests, claims, assignments, temporary permissions, and external resources;
- retarget or update dependent PRs/issues;
- remove temporary release candidates, staging, caches, and remote artifacts when retention permits;
- expire rollback/recovery artifacts only after their approved boundary;
- verify no temporary process, device, remote, credential, or paid resource remains;
- update handoff and canonical project state to the integrated revision.

Delayed post-merge cleanup may be a separate node when retention, permissions, external systems, or dependencies prevent immediate completion.

### Failure, pause, rollback, or interruption

On failure or interruption:

1. stop creating new state;
2. preserve decisive evidence;
3. classify every material partial item as valid, invalid, quarantined, recoverable, irreversible, or retained for continuation;
4. contain or restore unsafe state;
5. execute or prepare rollback;
6. release resources and claims that no longer protect recovery;
7. retain continuation-critical state only with owner, location, protection, expiry, and next action;
8. update the canonical issue, plan/execution record, branch/PR state, and cleanup inventory;
9. create cleanup or recovery debt only when it is safe and independently actionable.

No cleanup-critical fact may exist only in a shell history, local directory, or the originating agent’s memory.

## Dependency-safe cleanup ordering

Cleanup respects dependencies. For example:

- do not delete a backup before migration and rollback acceptance;
- do not remove instrumentation before decisive evidence is retained;
- do not delete a branch before its PR, stacked branches, comparisons, and recovery needs are resolved;
- do not close an issue before accepted outputs and revisions reach dependents;
- do not remove a fixture before dependent tests or audits finish;
- do not release a lock before the protected state transition is complete;
- do not revoke the only credential needed to finish recovery before ownership is transferred;
- do not delete generated output before determining whether it is authoritative, distributable, ignored build output, or required evidence;
- do not remove remote artifacts while an active release, audit, rollback, or downstream consumer still references them.

For coordinated or irreversible work, represent cleanup dependencies and the point of no return explicitly.

## Destructive cleanup safeguards

Before a destructive operation:

- verify exact target identity, owner, location, revision, and authority;
- identify user/shared/dependent/rollback/evidence state;
- use the narrowest selector possible;
- preview the target set where tooling permits;
- establish backup or recovery when consequence requires it;
- state expected effect and decisive verification;
- ensure the command cannot expand through symlinks, globbing, environment substitution, or wrong working directory;
- avoid force unless the governed state proves force is necessary and safe;
- inspect actual local and remote effects immediately.

Prohibited shortcuts include:

- broad `rm -rf`, recursive remote deletion, or wildcard cleanup without exact target proof;
- `git reset --hard`, `git clean -fdx`, or stash deletion in a mixed/unverified workspace;
- force-pushing or deleting shared/protected/default branches to simplify cleanup;
- deleting release, package, migration, or backup state without dependency and recovery analysis;
- closing PRs/issues or resolving reviews merely to produce a clean dashboard;
- deleting evidence before a finding, incident, benchmark, or decision is durably supported;
- deleting a leaked secret without revocation/rotation;
- claiming cleanup based only on a successful command.

## Cleanup verification

Use evidence appropriate to the item:

- repository status, diff, tracked/untracked file inventory, and exact path checks;
- restored content hash or configuration comparison;
- worktree, branch, ref, stash, tag, PR, issue, review, and dependent inspection;
- process, port, socket, container, lock, lease, mount, service, and job query;
- GPU/device allocation, context, module, IPC, and shared-memory inspection where applicable;
- remote API or owning-system confirmation;
- generated-source, cache-key, manifest, checksum, package, and release inspection;
- credential revocation, permission restoration, and access test;
- persistence or migration-state query;
- archive/quarantine location, provenance, and access verification;
- retained-item owner, expiry/removal trigger, and follow-up confirmation.

“The command succeeded,” “the process exited,” “the diff is clean,” or “the PR merged” is not sufficient when state is remote, asynchronous, shared, sensitive, generated, cached, or eventually consistent.

## Cleanup debt

Cleanup debt is permitted only when immediate cleanup would be less safe than temporary retention.

Every debt item must be:

- exact and independently identifiable;
- safe and contained;
- non-authoritative unless explicitly retained as authority;
- owned by a named person/component/node;
- linked to its parent work and exact revision;
- protected from ordinary consumption;
- bounded by an expiry, dependency, merge, release, permission, recovery, or retention trigger;
- accompanied by cleanup method and verification;
- explicit about whether the parent node may be accepted with the debt.

Use `.github/ISSUE_TEMPLATE/cleanup-debt.yml` when durable independent tracking is warranted. Do not create cleanup debt to hide ordinary incomplete work, a failed acceptance criterion, or unrelated repository residue.

Cleanup debt blocks parent acceptance when the remaining state can:

- corrupt current or future behavior;
- expose secrets or private data;
- incur uncontrolled cost;
- mislead ownership or authority;
- break rollback/recovery;
- contaminate tests, builds, releases, caches, or generated output;
- interfere with another active workstream.

## Handoff requirements

A continuation-ready handoff includes, where material:

- cleanup inventory and current dispositions;
- protected pre-existing/user/shared state;
- local files/folders, worktree, stash, branch, and uncommitted state;
- remote branches, PRs, issues, reviews, claims, and dependency state;
- active processes, ports, containers, locks, device contexts, permissions, credentials, and external resources;
- generated/build/package/release artifacts;
- backups, recovery state, evidence retention, and expiry triggers;
- cleanup already verified;
- exact cleanup still required and why;
- cleanup debt issue and owner;
- next safe cleanup or continuation action.

## Completion

Cleanup is complete only when:

- every material task-created, temporarily modified, superseded, partial, sensitive, local, remote, external, generated, and coordination item is accounted for;
- protected pre-existing state remains intact;
- every item has an intentional disposition;
- every removal, restoration, archive, quarantine, transfer, supersession, or retention is verified through the owning system;
- historically useful stale material is archived with provenance rather than silently erased;
- local workspace, Git state, remote branches, PRs/issues/reviews, processes, devices, credentials, artifacts, and external resources are intentional;
- no retained temporary item lacks an owner and removal trigger;
- cleanup debt is safe, bounded, visible, and independently actionable;
- no residue can become accidental authority or contaminate later work;
- canonical issue, plan, execution, PR, status, and handoff records describe what remains.
