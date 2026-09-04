# SPEC-0005 addendum — bounded external control sideband projection

- **Status:** Accepted
- **Version:** 0.1.0
- **Selection:** Universal package correction for bounded external control and publication sidebands
- **Semantic owner:** Framework / Progress, with Search Session owning optional session-command meaning when selected
- **Package owner:** Search Program Composition (`contract.cuda-js-package`)
- **Concrete lower mapping owner:** `integration.cuda-js`
- **Acceptance gate:** Protected integration under CUDA-MCGS #202

This document is an accepted addendum to `CUDA-MCGS-SPEC-0005@0.4.0`. It is complementary to the accepted operation-local resource-access addendum and does not replace SPEC-0000, SPEC-0005, SPEC-0006, or SPEC-0012.

## 1. Problem statement

The accepted execution package already identifies restricted Device-JS, finite resources, operation launch requirements, ordinary operation-local resource access, lifecycle intent, and public lower capability requirements. It does not yet make every required external-control/publication seam mechanically realizable.

In particular:

- framework cancellation is semantically required even when Search Session is absent, but the package currently exposes only the abstract lifecycle fact `bounded-external-intent`;
- operation bindings currently identify only resident resources or scalars, so there is no generic package-side binding for an externally published control signal;
- a selected Search Session already declares a public publication-mailbox requirement in its owner contribution, but current Program Package requirement closure does not generically propagate every selected owner's realization requirements;
- a concrete runtime adapter therefore cannot construct the required external-control path without inventing package semantics, parsing generated source, or hard-coding current owner/profile names.

That is an MCGS package-representation defect. It is not authority to move semantic ownership into CUDA-JS and not authority to add a native/private CUDA escape path.

## 2. Governing boundary

`FRAMEWORK-IR-008`, the SPEC-0005 package contract, the Framework lifecycle contract, SPEC-0006 Search Session semantics, and SPEC-0012 device-owned Progress remain authoritative.

The boundary is:

- Framework / Progress own cancellation, first-cause, stop/drain, and bounded device-side observation/application semantics.
- Search Session, when selected, owns the semantics of advance, reroot, attention, cancellation, observation-request, command identity, command ordering, replay, and command application points.
- Search Program Composition owns the finite package representation that projects those selected meanings into consumer-neutral runtime requirements.
- `integration.cuda-js` may translate accepted generic package facts to public CUDA-JS resources and operations only mechanically.
- CUDA-JS owns generic publication-mailbox, memory, launch, operation, health, failure, and teardown mechanisms.

The adapter MUST NOT infer a missing control path from semantic profile ids, function names, lifecycle strings, generated Device-JS source, CUDA-JS private implementation details, or native state.

## 3. Generic sideband representation

### SIDEBAND-REP-001 — explicit package meaning

Every selected post-ignition external/publication seam required for runtime realization MUST be explicit finite package meaning before ignition.

A package-side sideband declaration MUST identify, in MCGS-owned vocabulary:

- a stable sideband id;
- its semantic owner and role;
- direction;
- finite value representation;
- finite logical cardinality/capacity required by the selected profile;
- publication/observation semantics needed by the semantic owner;
- the bounded device application/observation point or declared relation that determines where the signal is consumed;
- lifetime and cleanup scope;
- any relation to an already-declared resident payload resource.

The first accepted realization requires host-to-device u32 signals. This does not make u32 a universal identity width or payload model.

### SIDEBAND-REP-002 — generic parameter and binding

Generated Program Package functions/operations MUST be able to identify a generic sideband signal without naming CUDA-JS mechanisms.

The package representation MUST therefore provide:

- a generic sideband signal parameter role/type in MCGS vocabulary; and
- an operation binding source that refers to one declared package-side sideband id.

A sideband binding MUST NOT contain a CUDA-JS mailbox object, lane name, raw pointer, native handle, mapped-memory layout, or other lower-private mechanism.

### SIDEBAND-BIND-001 — closure and exactness

A required sideband declaration without a deterministic generated-source/operation binding, or an equivalent accepted package mechanism that unambiguously connects it to the generated program, is non-realizable.

A binding to an unknown sideband, wrong direction, incompatible value representation, incompatible role, or unavailable public lower capability MUST fail before partial lower realization.

## 4. Public requirement closure

### SIDEBAND-REQ-001 — selected-owner requirements are generic inputs

Every public runtime requirement contributed by a selected owner and required for realization MUST participate in Program Package public-requirement closure.

Package composition MUST NOT hard-code only particular owners such as Stage or Channel. Search Session requirements, and future independently selected owner requirements, MUST flow through the same generic contribution mechanism.

Unselected owners contribute zero requirement residue.

### SIDEBAND-REQ-002 — no lower capability inference

A generic sideband declaration does not itself prove that the selected lower runtime can realize it. The concrete adapter MUST validate the required versioned public lower capability before creating dependent resources or submitting work.

Missing capability is a pre-ignition fail-closed result, not permission to substitute a private import, direct FFI, hand-written PTX, source inspection, or a different lower primitive with materially different semantics.

## 5. Framework cancellation

### SIDEBAND-FRAMEWORK-001 — always-available bounded cancellation signal

Framework cancellation exists even when Search Session is absent. Every execution package that declares bounded external cancellation intent MUST therefore carry a complete generic framework-cancellation sideband path.

The first accepted framework-cancellation signal is:

- host-to-device;
- finite u32 representation;
- idempotent one-way intent (`not-requested` → `requested`);
- initial not-requested state;
- repeated requests semantically idempotent;
- observed/applied only at the bounded device-owned checkpoints required by Framework / Progress;
- independent of Session command semantics;
- bound explicitly into the generated operation/program path that observes it.

The host MUST NOT implement cancellation by relaunching the search, polling for a decision and rewriting search state, or driving a post-ignition progress loop.

### SIDEBAND-FRAMEWORK-002 — first-cause and drain ownership are unchanged

The sideband is only the external intent publication mechanism. It does not own first-cause arbitration, stop-state transition, must-drain priority, terminal publication, or teardown ordering. Those remain with Framework / Progress and their existing selected owners.

## 6. Search Session command publication

### SIDEBAND-SESSION-001 — optional distinct session publication signal

When Search Session is selected and external command publication is part of the accepted Session profile, the package MUST carry a Session-owned host-to-device publication sideband separate from the always-present Framework cancellation sideband.

Session absence MUST remove the Session-only sideband declaration, binding, lower requirement, payload relation, and solely owned package residue while preserving the independent Framework cancellation path.

### SIDEBAND-SESSION-002 — payload and semantic identity remain resident MCGS state

The Session sideband is a publication notification/fence, not a message bus and not command identity.

Selected Session already owns a finite resident `session-control` payload and distinct typed command semantics for advance, reroot, attention, cancellation, and observation request. Those command records, their ordering, validation, replay/idempotence, effects, and application points remain authoritative MCGS state.

In particular, accepted Session command-id and command-generation counters are 128-bit. A u32 sideband value MUST NOT narrow, relabel, alias, wrap, or replace either 128-bit identity.

A compliant realization therefore:

1. validates and publishes the bounded Session control payload through an accepted public lower memory mechanism;
2. performs the required host-to-device release publication operation on the generic sideband;
3. has device code perform the corresponding acquire observation at a bounded accepted checkpoint; and
4. reads/validates the authoritative resident Session payload and 128-bit generation before applying a command.

Signal value equality is not authoritative proof that no new Session command exists. The publication operation and authoritative payload generation are distinct facts.

### SIDEBAND-SESSION-003 — operation separation is preserved

A shared Session publication signal does not collapse semantic command kinds. Advance, reroot, attention, cancellation, and observation request remain distinct selected Session operations/facts where the Session specification requires them.

A generic `root-update`, `control-word`, or similar shortcut that causes the adapter/lower runtime to reinterpret those semantics is non-conforming.

## 7. Runtime realizability and historical evidence

### SIDEBAND-REALIZE-001 — explicit path required

After this addendum is implemented, abstract lifecycle text such as `bounded-external-intent` is insufficient by itself to claim CUDA-JS runtime realizability.

A package that requires external control but lacks the corresponding explicit sideband declaration, lower public requirement, and program/operation binding MUST fail runtime-realizability preflight before partial lower construction.

### SIDEBAND-HIST-001 — historical structural validity without reinterpretation

Previously accepted 0.2.0 package evidence that structurally omits the new sideband representation MAY remain historically normalizable when required to preserve exact evidence identity.

Historical omission MUST NOT be silently repaired or reinterpreted. If that historical subject declares semantics that now require an explicit sideband path, it is structurally historical but non-realizable through `integration.cuda-js`.

No source parsing, profile-name inference, lifecycle-string inference, or automatic lower-lane synthesis may convert historical evidence into a current realizable package.

## 8. Identity and deletion

### SIDEBAND-IDENTITY-001 — material sideband meaning is identity-bearing

Material changes to sideband direction, value representation, semantic role, publication/application contract, finite capacity/cardinality, resident payload relation, or operation binding MUST change the appropriate normalized Program Package / execution-package identity.

Changing an implementation-chosen lower lane name or lower-private handle MUST NOT become MCGS semantic identity.

### SIDEBAND-DELETE-001 — selected-owner deletion is exact

Removing an optional owner/capability MUST remove every sideband declaration, binding, public requirement, payload relation, and adapter requirement solely owned by that selection while preserving unrelated Framework and package facts.

Deletion MUST NOT leave an unbound signal, unused lower requirement, hidden allocation, host progress path, or compatibility residue.

## 9. First public CUDA-JS mapping boundary

### SIDEBAND-BOUNDARY-001 — public mechanism only

The first CUDA-JS adapter realization MAY mechanically map accepted generic host-to-device u32 sidebands to the versioned public CUDA-JS publication-mailbox capability, provided exact public compatibility validation succeeds.

The adapter chooses lower lane names and lower resource handles. Those are not semantic-owner vocabulary.

The adapter MAY use the bounded direct public CUDA-JS submission primitive for an operation whose accepted launch arguments require a sideband. The existence of CUDA-JS prepared-operation DAGs does not create an MCGS semantic requirement to use them, and lack of mailbox-valued prepared-DAG bindings is not by itself authority to redesign MCGS package meaning.

This addendum does not authorize a host relaunch loop, a generic lower scheduler, or post-ignition host progression.

### SIDEBAND-BOUNDARY-002 — native evidence remains separate

CUDA-free reference evidence may prove representation, deterministic projection, fail-closed validation, identity sensitivity, and no-inference properties.

It MUST NOT claim native release/acquire correctness, mapped-memory coherence, races, physical cancellation latency, teardown behavior, or exact compatible-pair support. Those require the separate native compatible-pair evidence owned by the CUDA-JS integration program (including CUDA-JS #32 or its successor).

## 10. Required permanent falsifiers for implementation

The dependent implementation MUST permanently prove at least:

1. **Base cancellation omission:** a one-shot/session-absent package that declares external cancellation but lacks the Framework cancellation sideband or binding is non-realizable.
2. **Selected Session requirement omission:** a selected Session public runtime requirement needed for realization cannot disappear from Program Package closure.
3. **Binding closure:** a required sideband with no binding, or a binding to an unknown/incompatible sideband, fails closed.
4. **No inference:** deleting a required sideband fact does not cause `integration.cuda-js` or package composition to synthesize one from lifecycle text, profile ids, function names, or Device-JS source.
5. **128-bit preservation:** Session command-id/generation remain authoritative 128-bit values; a u32 notification cannot become command identity or impose 32-bit rollover/alias behavior.
6. **Operation separation:** shared notification does not collapse advance, reroot, attention, cancellation, or observation-request semantics.
7. **Optional deletion:** Session absence removes Session-only sideband/binding/requirement residue while retaining the independent Framework cancellation path.
8. **Identity sensitivity:** material sideband meaning changes alter package identity; lower-private lane naming does not.
9. **Finite/fail-closed:** unsupported direction/value/control forms, unavailable lower capabilities, and incomplete payload relations reject before partial realization.
10. **Source boundary:** no CUDA-JS private/native import, direct FFI, native CUDA, hand PTX, or second semantic interpreter appears in MCGS realization.
11. **Publication-not-identity:** repeated/same u32 notification values cannot by themselves suppress a newly published Session command when the authoritative resident 128-bit generation has advanced; novelty is determined from MCGS payload identity after the required publication/acquire step.

The red-before-green observation already captured for #202 is implementation evidence, not part of this authority diff. The dependent implementation must reintroduce a permanent conforming verifier after this authority is protected.

## 11. Non-goals

This addendum does not:

- define product-specific command payloads;
- add multi-GPU, CUDA Graph, Tensor Core, or topology semantics;
- authorize runtime source interpretation;
- make publication mailbox vocabulary part of universal MCGS semantics;
- replace Session command queues with sideband words;
- widen ordinary operation-local resource access into atomic/publication authority;
- introduce MCGS native CUDA code;
- qualify a native CUDA-JS compatible pair.

The intended result is a small LEGO seam: semantic owners define bounded control truth, Program Package makes the required sideband connection explicit, and a replaceable runtime adapter maps that accepted public fact to a compatible lower mechanism without guessing.
