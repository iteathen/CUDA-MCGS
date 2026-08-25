# ADR-0019: Pure Node/Device-JS Production and CUDA-JS Capability Escalation

**Status:** Accepted

**Date:** 2026-08-24

## Context

CUDA-MCGS requires GPU-resident active search while using CUDA-JS as its only generic CUDA execution boundary. Earlier authority prohibited local CUDA-specific escape paths and CPU-produced intermediate search decisions, but it did not state one complete production-source rule or explain when an awkward Device-JS design is evidence of a missing CUDA-JS capability.

That omission creates two symmetric risks:

- a seemingly convenient C, C++, CUDA C++, PTX, native-addon or direct-Driver implementation could leak generic CUDA mechanism into CUDA-MCGS; or
- an implementation could obey the letter of the language boundary while contorting MCGS semantics around an unnatural, inefficient or unsafe use of the current CUDA-JS API.

The first CUDA-MCGS engine will be a demanding first consumer of CUDA-JS. A missing second consumer is not proof that a needed generic mechanism is CUDA-MCGS-specific. Conversely, first-consumer demand is not permission to move search policy into CUDA-JS.

## Decision

### 1. Maintained production source

CUDA-MCGS production source is JavaScript only:

- ordinary Node.js source owns host-side configuration, composition, lifecycle, observation and result consumption; and
- restricted Device-JS source owns CUDA-MCGS device programs and is submitted only through versioned public CUDA-JS contracts.

CUDA-MCGS production MUST NOT author or maintain C, C++, CUDA C++, `.cu`/`.cuh`, hand-written PTX, embedded CUDA source, a native addon, direct FFI/Driver calls, or a subprocess native search implementation.

This restriction applies to CUDA-MCGS, not CUDA-JS. CUDA-JS may use JIT compilation, native code, C/C++, CUDA C++, PTX, driver bindings and other native machinery wherever needed or desired to implement its consumer-neutral runtime contracts. CUDA-JS may generate, compile, cache, package and load PTX, cubin, LTO or other CUDA artifacts. CUDA-MCGS may identify and consume those outputs through the public package contract as opaque generated artifacts; it must not patch, interpret or become their implementation owner. Bounded historical experiments remain evidence only and are not production dependencies.

### 2. Device closure and narrow host interaction

After search ignition, every internal search decision and all progress needed to reach the selected stopping/output condition remain device-owned. The host may:

- perform pre-ignition configuration, validation, composition, compilation, allocation, upload and launch;
- asynchronously read bounded coherent observations and completed results whose absence or delayed consumption cannot block search progress;
- asynchronously submit externally supplied attention, root, budget, priority or other control changes only through an accepted finite, versioned, generation-scoped contract with explicit admission, publication, application and stale-input semantics;
- request cancellation and perform completion, error and teardown lifecycle work.

An external control value represents outside intent or environment state. It MUST NOT be a CPU-computed intermediate derived from an observation in order to select, schedule, evaluate, back up or otherwise advance the next internal search step. A host read-decide-write, polling/relaunch or callback progression loop is non-conforming.

### 3. Natural-expression gate

A CUDA-MCGS behavior may use an existing public CUDA-JS contract only when the resulting expression is reasonably direct, bounded, lifecycle-complete, synchronization-safe, testable and compatible with the selected performance/resource envelope.

The inclination to implement a CUDA-MCGS requirement with native code is itself an early diagnostic clue that CUDA-JS may be incomplete. It triggers the ownership/capability analysis before design or implementation proceeds; the project does not wait for a native workaround or failed Device-JS contortion to prove the gap. The clue is not automatic proof: the analysis may instead show that the need is CUDA-MCGS-specific policy or that an existing public contract already expresses it naturally.

If a design would naturally be implemented as a generic CUDA mechanism but the available CUDA-JS surface requires material semantic distortion, artificial kernel fragmentation, host polling/relaunch, duplicated resource or synchronization lifecycle, unsafe visibility assumptions, private imports, CUDA-specific source, or another conspicuous workaround, CUDA-MCGS work stops at that boundary. The need is classified and, when consumer-neutral, proposed and qualified in CUDA-JS before CUDA-MCGS resumes using the released public contract.

This gate is an architectural signal, not a requirement to force every desired convenience into CUDA-JS. The proposed capability must state:

- the generic mechanism and equivalence class it owns;
- what MCGS/domain/product policy it explicitly excludes;
- finite resource, synchronization, failure, cancellation and teardown semantics;
- public lifecycle and compatibility identity;
- independent CUDA-JS qualification and the first-consumer deletion result.

A credible first-consumer deletion result is sufficient: deleting CUDA-MCGS must leave a coherent consumer-neutral CUDA-JS capability. A second live consumer is useful evidence but is not required.

### 4. Ownership test

CUDA-MCGS retains search, domain, evaluator, product, attention meaning, admission policy and resource-partition policy. CUDA-JS owns only generic execution, compilation, memory, synchronization, publication, queueing, scheduling primitive, resource-lifetime and platform mechanisms.

If the proposed capability cannot be described naturally without MCGS vocabulary or would require CUDA-JS to interpret a search decision, the CUDA-MCGS design must be reconsidered rather than exported.

## Rationale and evidence

The decision preserves the one-way LEGO boundary accepted by ADR-0014 while preventing boundary compliance from becoming API contortion. Restricted Device-JS supplies CUDA-MCGS-owned specialized hot-path semantics in JavaScript source; CUDA-JS is free to realize those programs and its generic runtime with JIT and native implementation. Device closure preserves the architectural reason for CUDA-MCGS, while explicit asynchronous exceptions permit useful observation and externally owned changes without establishing a second host control plane.

The rule also matches the evidence workflow: the demanding consumer states the needed mechanism, CUDA-JS owns and independently qualifies the reusable contract, and CUDA-MCGS proves one exact compatible pair without private-source coupling.

## Consequences

- Production implementation and review must reject maintained native/CUDA source or direct CUDA runtime access in CUDA-MCGS.
- Specifications and plans must distinguish external asynchronous inputs from host-produced internal search intermediates.
- A natural-expression failure is a design stop and dependency-classification event, not authority for a local workaround.
- CUDA-JS capability work may originate from CUDA-MCGS requirements, but its contract, tests and lifecycle remain consumer-neutral and independently owned.
- CUDA-MCGS implementation resumes only after the required capability is available through an exact versioned public CUDA-JS pair.
- Bounded diagnostic/reference experiments must remain explicitly non-production and cannot silently become an implementation escape path.

## Alternatives considered

### Prohibit only checked-in `.cu` files

Rejected. Native addons, embedded source, hand PTX, direct FFI and subprocess implementations would preserve the same ownership failure under different packaging.

### Require CUDA-MCGS to express every behavior through the current CUDA-JS surface

Rejected. That would turn an incomplete generic mechanism boundary into distorted search architecture and could reintroduce host progression or unsafe synchronization indirectly.

### Require two consumers before adding any CUDA-JS capability

Rejected. CUDA-MCGS is intentionally a demanding first consumer. Consumer-neutral ownership, exclusions, lifecycle and deletion evidence are the relevant tests; an arbitrary second consumer would encourage fake generality or block a legitimate foundation.

### Permit native CUDA-MCGS implementations behind an adapter

Rejected. An adapter would hide rather than remove duplicated CUDA mechanism ownership and would make CUDA-JS optional precisely where its public contract is intended to be authoritative.

## Compatibility and migration

Existing bounded native/PTX experiments retain historical and research value but are not production implementation inputs. Current proposal specifications and plans must be interpreted under this ADR and revised before acceptance where their wording implies CUDA-MCGS-authored PTX, CUDA source or host progression.

The first production engine selects an exact public CUDA-JS package/revision and records every required capability and qualification key. Missing capability work is completed in CUDA-JS before that pair is accepted.

## Validation

Validation requires:

- repository checks that reject prohibited maintained production-source forms and direct CUDA access;
- specification/conformance cases proving search continues without observation consumption;
- negative cases rejecting stale, over-capacity, invalid or post-terminal external control inputs without partial semantic mutation;
- evidence that any selected asynchronous mechanism has coherent publication and lifecycle semantics;
- CUDA-JS independent qualification for each newly required generic capability;
- exact CUDA-JS/CUDA-MCGS package and revision compatibility evidence;
- first-consumer deletion review at both ownership boundaries.

## Revisit criteria

Revisit only if JavaScript/Device-JS ceases to be the accepted ecosystem language boundary, CUDA-JS changes its ownership mission, or native evidence demonstrates that a required universal GPU-search behavior cannot be supplied through a coherent consumer-neutral public capability. Revisit requires an accepted replacement ADR; implementation inconvenience alone is insufficient.

## Supersedes

This ADR does not supersede ADR-0014 or ADR-0018. It makes their production-source, device-closure and missing-capability consequences explicit.
