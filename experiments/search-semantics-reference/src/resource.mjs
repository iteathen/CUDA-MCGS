import { canonicalBytes, canonicalClone, frozenCanonicalClone } from './canonical.mjs';
import { fail } from './errors.mjs';

const freeze = (value, label = 'Resource value') => frozenCanonicalClone(value, label);
const dec = (value, label = 'decimal') => {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) fail('RESOURCE_REFERENCE_DECIMAL', `${label} must be a canonical decimal string`);
  return BigInt(value);
};
const text = (value, label) => {
  if (typeof value !== 'string' || value.length === 0) fail('RESOURCE_REFERENCE_ID', `${label} must be a non-empty string`);
  return value;
};
const epochKeys = ['engine', 'session', 'root', 'work'];
const normalizeEpochs = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('RESOURCE_REFERENCE_EPOCHS', 'lease epochs must be an object');
  const keys = Object.keys(input).sort();
  if (keys.length !== epochKeys.length || epochKeys.some((key) => !keys.includes(key))) fail('RESOURCE_REFERENCE_EPOCHS', 'lease epochs must contain exactly engine/session/root/work');
  return freeze(Object.fromEntries(epochKeys.map((key) => [key, dec(input[key], `${key} epoch`).toString()])), 'Resource lease epochs');
};
const leaseKey = ({ leaseId, generation }) => JSON.stringify([leaseId, generation]);
const liveStates = new Set(['claimed', 'published', 'retired-unreclaimed', 'quarantined']);
const terminalCauses = new Set(['identifier-space', 'generation-space', 'counter-width', 'provider-failure']);
const causeCodes = new Map([
  ['capacity', 'resource-capacity'],
  ['fragmentation-fit', 'resource-fragmentation'],
  ['identifier-space', 'resource-identifier-exhausted'],
  ['generation-space', 'resource-generation-exhausted'],
  ['counter-width', 'resource-counter-exhausted'],
  ['provider-failure', 'resource-provider-failure'],
]);

function classSnapshot(resourceClass, leases, diagnostics, mutation) {
  const amounts = { claimed: 0n, published: 0n, 'retired-unreclaimed': 0n, quarantined: 0n };
  for (const lease of leases.values()) {
    if (lease.classId !== resourceClass.id || !liveStates.has(lease.state)) continue;
    if (mutation?.retiredCountsAsFree === true && lease.state === 'retired-unreclaimed') continue;
    amounts[lease.state] += lease.quantity;
  }
  const capacity = dec(resourceClass.formula.maximumUnits, `${resourceClass.id} capacity`);
  const consumed = Object.values(amounts).reduce((sum, value) => sum + value, 0n);
  return {
    classId: resourceClass.id,
    capacity: capacity.toString(),
    claimed: amounts.claimed.toString(),
    published: amounts.published.toString(),
    retiredUnreclaimed: amounts['retired-unreclaimed'].toString(),
    quarantined: amounts.quarantined.toString(),
    available: (capacity - consumed).toString(),
    highWater: diagnostics.highWater.toString(),
    failedAdmissions: diagnostics.failedAdmissions.toString(),
    releases: diagnostics.releases.toString(),
    counter: diagnostics.counter.toString(),
  };
}

export function createResourceOracle({ profile, counterStarts = {}, mutations = {} } = {}) {
  if (!profile) fail('RESOURCE_REFERENCE_PROFILE', 'normalized Resource profile is required');
  const classById = new Map(profile.classes.map((entry) => [entry.id, entry]));
  const reserveById = new Map(profile.reserves.map((entry) => [entry.id, entry]));
  const admissionById = new Map(profile.admissionGroups.map((entry) => [entry.id, entry]));
  const watermarkByClass = new Map(profile.watermarks.map((entry) => [entry.class, entry]));
  const contributorById = new Map(profile.contributors.map((entry) => [entry.id, entry]));
  const leases = new Map();
  const latestGeneration = new Map();
  const transactions = new Map();
  const diagnostics = new Map(profile.classes.map((entry) => [entry.id, {
    failedAdmissions: 0n,
    releases: 0n,
    highWater: 0n,
    counter: dec(counterStarts[entry.id] ?? '0', `${entry.id} counter start`),
  }]));
  const exhaustionEvents = [];
  let firstTerminalCause = null;
  let lifecycle = 'pools-ledgers-initialized';
  let removedContributors = new Set();

  const resourceClass = (classId) => {
    const found = classById.get(classId);
    if (!found || removedContributors.has(found.contributor)) fail('RESOURCE_REFERENCE_CLASS', `unknown or removed Resource class ${classId}`);
    return found;
  };
  const findLease = (reference) => {
    const lease = leases.get(leaseKey(reference));
    if (!lease) fail('RESOURCE_REFERENCE_LEASE', `unknown lease ${reference.leaseId}/${reference.generation}`);
    const referenceEpochs = normalizeEpochs(reference.epochs);
    if (
      reference.classId !== lease.classId
      || reference.owner !== lease.owner
      || !canonicalBytes(referenceEpochs, 'lease reference epochs').equals(canonicalBytes(lease.epochs, 'authoritative lease epochs'))
    ) fail('RESOURCE_REFERENCE_LEASE_IDENTITY', 'lease reference does not match its authoritative class, owner, and epochs');
    return lease;
  };
  const requireActiveAdmission = (input = null) => {
    if (lifecycle === 'active') return;
    if (lifecycle === 'draining' && input?.reserveId !== null && input?.reserveId !== undefined) {
      const reserve = reserveById.get(input.reserveId);
      if (reserve && ['terminal-result', 'progress-cleanup'].includes(reserve.purpose)) return;
    }
    fail('RESOURCE_REFERENCE_ADMISSION_CLOSED', `Resource admission is closed in lifecycle state ${lifecycle}`);
  };
  const accounting = (classId) => {
    const entry = resourceClass(classId);
    return classSnapshot(entry, leases, diagnostics.get(classId), mutations);
  };
  const consumed = (classId) => {
    const state = accounting(classId);
    return dec(state.capacity) - dec(state.available);
  };
  const activeReserveUse = (reserveId) => {
    let total = 0n;
    for (const lease of leases.values()) if (lease.reserveId === reserveId && liveStates.has(lease.state)) total += lease.quantity;
    return total;
  };
  const protectedOrdinaryUnits = (classId) => profile.reserves
    .filter((reserve) => reserve.class === classId)
    .reduce((sum, reserve) => {
      const remaining = dec(reserve.maximum) - activeReserveUse(reserve.id);
      return sum + (remaining > 0n ? remaining : 0n);
    }, 0n);

  function recordExhaustion({ cause, classId = null, terminal = terminalCauses.has(cause), recoverable = !terminal, requested = null, available = null, readyFacts = [] } = {}) {
    if (!profile.exhaustion.causes.includes(cause)) fail('RESOURCE_REFERENCE_EXHAUSTION', `undeclared exhaustion cause ${cause}`);
    if (!Array.isArray(readyFacts) || readyFacts.some((fact) => fact?.state !== 'ready')) fail('RESOURCE_REFERENCE_READY_FACT', 'resource exhaustion may expose only already-ready semantic facts');
    const event = freeze({ cause, classId, terminal: terminal === true, recoverable: recoverable === true, requested, available, readyFacts }, 'Resource exhaustion event');
    exhaustionEvents.push(event);
    if (terminal === true) {
      if (firstTerminalCause === null) firstTerminalCause = event;
      if (lifecycle === 'active') lifecycle = 'draining';
    }
    return {
      kind: terminal === true ? 'terminal-exhaustion' : 'pressure',
      code: causeCodes.get(cause) ?? null,
      cause,
      firstTerminalCause: canonicalClone(firstTerminalCause),
      readyFacts: canonicalClone(readyFacts),
    };
  }

  function watermarkState(classId) {
    const resourceState = accounting(classId);
    const watermark = watermarkByClass.get(classId);
    if (!watermark) fail('RESOURCE_REFERENCE_WATERMARK', `class ${classId} has no watermark`);
    const measuredKey = watermark.measured === 'retired-unreclaimed' ? 'retiredUnreclaimed' : watermark.measured;
    const measured = dec(resourceState[measuredKey], `${classId} watermark measured`);
    const high = dec(watermark.highAt), critical = dec(watermark.criticalAt), exhausted = dec(watermark.exhaustedAt);
    let state = 'normal';
    if (watermark.comparison === 'used-at-least') {
      if (measured >= exhausted) state = 'exhausted';
      else if (measured >= critical) state = 'critical';
      else if (measured >= high) state = 'high';
    } else {
      if (measured <= exhausted) state = 'exhausted';
      else if (measured <= critical) state = 'critical';
      else if (measured <= high) state = 'high';
    }
    return {
      classId,
      state,
      measured: watermark.measured,
      quantity: measured.toString(),
      responses: canonicalClone(watermark.responses.filter((entry) => entry.state === state)),
      owner: resourceClass(classId).contributor,
    };
  }

  function failAdmission(entry, quantity, cause = entry.exhaustion, code = causeCodes.get(cause) ?? null) {
    const state = accounting(entry.id);
    diagnostics.get(entry.id).failedAdmissions += 1n;
    const terminal = terminalCauses.has(cause);
    if (terminal) recordExhaustion({ cause, classId: entry.id, terminal: true, recoverable: false, requested: quantity.toString(), available: state.available });
    return {
      kind: terminal ? 'stop' : 'pressure',
      code,
      cause,
      classId: entry.id,
      requested: quantity.toString(),
      available: state.available,
      watermark: watermarkState(entry.id).state,
      recoverable: !terminal,
    };
  }

  function planReservation(input, { countFailure = true } = {}) {
    requireActiveAdmission(input);
    const entry = resourceClass(text(input.classId, 'classId'));
    const quantity = dec(input.quantity, 'reservation quantity');
    if (quantity <= 0n) fail('RESOURCE_REFERENCE_QUANTITY', 'reservation quantity must be positive');
    const leaseId = text(input.leaseId, 'leaseId');
    const generation = dec(input.generation, 'lease generation');
    const epochs = normalizeEpochs(input.epochs);
    if (generation > dec(entry.range.generationMaximum)) return { failure: countFailure ? failAdmission(entry, quantity, 'generation-space') : { cause: 'generation-space' } };
    const previous = latestGeneration.get(leaseId);
    if (previous !== undefined && generation <= previous) fail('RESOURCE_REFERENCE_GENERATION', 'lease generation must advance for a reused lease id');
    const classDiagnostics = diagnostics.get(entry.id);
    if (classDiagnostics.counter >= dec(entry.range.counterMaximum)) return { failure: countFailure ? failAdmission(entry, quantity, 'counter-width') : { cause: 'counter-width' } };
    const owner = text(input.owner, 'reservation owner');
    let reserve = null;
    if (input.reserveId !== null && input.reserveId !== undefined) {
      reserve = reserveById.get(input.reserveId);
      if (!reserve || reserve.class !== entry.id) fail('RESOURCE_REFERENCE_RESERVE', 'reservation names an incompatible reserve');
      if (!reserve.eligibleOwners.includes(owner) || !reserve.eligibleTransitions.includes(input.transition)) fail('RESOURCE_REFERENCE_RESERVE_AUTHORITY', 'reservation is not eligible to consume the reserve');
      const reserveAvailable = dec(reserve.maximum) - activeReserveUse(reserve.id);
      if (quantity > reserveAvailable) return { failure: countFailure ? failAdmission(entry, quantity, 'capacity') : { cause: 'capacity' } };
    } else if (owner !== entry.contributor) {
      fail('RESOURCE_REFERENCE_OWNER', 'ordinary admission owner must match the Resource class contributor');
    }
    const free = dec(accounting(entry.id).available);
    const available = reserve === null ? free - protectedOrdinaryUnits(entry.id) : free;
    if (quantity > available) return { failure: countFailure ? failAdmission(entry, quantity, 'capacity') : { cause: 'capacity' } };
    return { entry, quantity, leaseId, generation, owner, reserve, epochs };
  }

  function commitReservation(plan, input) {
    const key = leaseKey(input);
    if (leases.has(key)) fail('RESOURCE_REFERENCE_LEASE', 'duplicate exact lease identity');
    const lease = {
      classId: plan.entry.id,
      leaseId: plan.leaseId,
      generation: input.generation,
      generationValue: plan.generation,
      quantity: plan.quantity,
      owner: plan.owner,
      reserveId: plan.reserve?.id ?? null,
      transition: input.transition ?? null,
      epochs: plan.epochs,
      state: 'claimed',
      terminalReason: null,
    };
    leases.set(key, lease);
    latestGeneration.set(lease.leaseId, lease.generationValue);
    const classDiagnostics = diagnostics.get(lease.classId);
    classDiagnostics.counter += 1n;
    const nowConsumed = consumed(lease.classId);
    if (nowConsumed > classDiagnostics.highWater) classDiagnostics.highWater = nowConsumed;
    return { kind: 'claimed', leaseId: lease.leaseId, generation: lease.generation, classId: lease.classId, quantity: lease.quantity.toString() };
  }

  function reserveResource(input) {
    const plan = planReservation(input);
    if (plan.failure) return plan.failure;
    return commitReservation(plan, input);
  }

  function reserveCompound(input) {
    requireActiveAdmission();
    const group = admissionById.get(text(input.groupId, 'admission group'));
    if (!group || group.atomicity !== 'all-or-none-transaction') fail('RESOURCE_REFERENCE_COMPOUND', 'compound admission requires a declared all-or-none group');
    const transactionId = text(input.transactionId, 'transactionId');
    if (transactions.has(transactionId)) fail('RESOURCE_REFERENCE_TRANSACTION', 'duplicate transaction id');
    if (!Array.isArray(input.reservations) || input.reservations.length !== group.classes.length) fail('RESOURCE_REFERENCE_COMPOUND', 'compound reservation must cover the declared group exactly');
    const byClass = new Map(input.reservations.map((entry) => [entry.classId, entry]));
    if (byClass.size !== group.classes.length || group.classes.some((classId) => !byClass.has(classId))) fail('RESOURCE_REFERENCE_COMPOUND', 'compound reservation classes differ from the declared group');
    const planned = [];
    for (const classId of group.globalOrder) {
      const reservation = byClass.get(classId);
      const plan = planReservation(reservation, { countFailure: false });
      if (plan.failure) {
        const entry = resourceClass(classId);
        const failed = failAdmission(entry, dec(reservation.quantity), plan.failure.cause);
        transactions.set(transactionId, freeze({ state: 'rolled-back', failedClass: classId }, 'Resource transaction result'));
        return { kind: 'rolled-back', transactionId, failure: failed, committed: 0 };
      }
      planned.push({ plan, reservation });
    }
    const leasesCommitted = planned.map(({ plan, reservation }) => commitReservation(plan, reservation));
    transactions.set(transactionId, freeze({ state: 'committed', leases: leasesCommitted.map(({ leaseId, generation }) => ({ leaseId, generation })) }, 'Resource transaction result'));
    return { kind: 'committed', transactionId, leases: leasesCommitted };
  }

  function publishResourceUse(reference) {
    const lease = findLease(reference);
    if (lease.state !== 'claimed') fail('RESOURCE_REFERENCE_PUBLICATION', 'only a claimed lease can become published');
    lease.state = 'published';
    return { kind: 'published', leaseId: lease.leaseId, generation: lease.generation };
  }

  function releaseResource(reference) {
    const lease = findLease(reference);
    if (!['claimed', 'published'].includes(lease.state)) fail('RESOURCE_REFERENCE_RELEASE', 'only claimed/published leases can release directly');
    lease.state = 'released';
    lease.terminalReason = reference.reason ?? 'released';
    diagnostics.get(lease.classId).releases += 1n;
    return { kind: 'released', leaseId: lease.leaseId, generation: lease.generation };
  }

  function retireResource(reference) {
    const lease = findLease(reference);
    if (!['claimed', 'published'].includes(lease.state)) fail('RESOURCE_REFERENCE_RETIRE', 'only claimed/published leases can retire');
    lease.state = 'retired-unreclaimed';
    lease.terminalReason = reference.reason ?? 'retired';
    return { kind: 'retired-unreclaimed', leaseId: lease.leaseId, generation: lease.generation };
  }

  function reclaimResourceAccounting(reference) {
    const lease = findLease(reference);
    if (lease.state !== 'retired-unreclaimed') fail('RESOURCE_REFERENCE_RECLAIM', 'only retired-unreclaimed leases can reclaim accounting');
    if (reference.ownerQuiescent !== true && mutations.skipRetiredQuiescence !== true) return { kind: 'pending', code: 'resource-owner-not-quiescent' };
    lease.state = 'released';
    diagnostics.get(lease.classId).releases += 1n;
    return { kind: 'reclaimed', leaseId: lease.leaseId, generation: lease.generation };
  }

  function quarantineResource(reference) {
    const lease = findLease(reference);
    if (!['claimed', 'published', 'retired-unreclaimed'].includes(lease.state)) fail('RESOURCE_REFERENCE_QUARANTINE', 'lease cannot enter quarantine from its current state');
    lease.state = 'quarantined';
    lease.terminalReason = reference.reason ?? 'quarantined';
    return { kind: 'quarantined', leaseId: lease.leaseId, generation: lease.generation };
  }

  function activate() {
    if (lifecycle !== 'pools-ledgers-initialized') fail('RESOURCE_REFERENCE_LIFECYCLE', 'activate requires pools-ledgers-initialized');
    lifecycle = 'active';
    return { kind: 'active' };
  }

  function beginDraining() {
    if (lifecycle !== 'active') fail('RESOURCE_REFERENCE_LIFECYCLE', 'draining requires active state');
    lifecycle = 'draining';
    return { kind: 'draining' };
  }

  function markTerminal() {
    if (lifecycle !== 'draining') fail('RESOURCE_REFERENCE_LIFECYCLE', 'terminal requires draining state');
    lifecycle = 'terminal';
    return { kind: 'terminal' };
  }

  function requestHostGrowth() {
    fail('RESOURCE_REFERENCE_HOST_GROWTH', 'post-ignition host growth/spill is prohibited');
  }

  function removeContributor(contributorId) {
    if (!contributorById.has(contributorId)) fail('RESOURCE_REFERENCE_CONTRIBUTOR', 'unknown contributor');
    const live = [...leases.values()].filter((lease) => resourceClass(lease.classId).contributor === contributorId && liveStates.has(lease.state));
    if (live.length !== 0) fail('RESOURCE_REFERENCE_CONTRIBUTOR_LIVE', 'cannot remove a contributor with live Resource leases');
    removedContributors = new Set([...removedContributors, contributorId]);
    return { kind: 'removed', contributorId, classes: profile.classes.filter((entry) => entry.contributor === contributorId).map((entry) => entry.id), runtimeResidue: 0 };
  }

  function assertConservation() {
    for (const entry of profile.classes) {
      if (removedContributors.has(entry.contributor)) continue;
      const state = accounting(entry.id);
      const total = dec(state.claimed) + dec(state.published) + dec(state.retiredUnreclaimed) + dec(state.quarantined) + dec(state.available);
      if (total !== dec(state.capacity) || dec(state.highWater) > dec(state.capacity) || dec(state.available) < 0n) fail('RESOURCE_REFERENCE_CONSERVATION', `ledger conservation failed for ${entry.id}`);
    }
    return { kind: 'conserved' };
  }

  function snapshot() {
    return {
      lifecycle,
      firstTerminalCause: canonicalClone(firstTerminalCause),
      exhaustionEvents: canonicalClone(exhaustionEvents),
      classes: profile.classes.filter((entry) => !removedContributors.has(entry.contributor)).map((entry) => accounting(entry.id)),
      leases: [...leases.values()].map((lease) => ({
        classId: lease.classId, leaseId: lease.leaseId, generation: lease.generation, quantity: lease.quantity.toString(), owner: lease.owner,
        reserveId: lease.reserveId, transition: lease.transition, epochs: canonicalClone(lease.epochs), state: lease.state, terminalReason: lease.terminalReason,
      })),
      removedContributors: [...removedContributors].sort(),
    };
  }

  function cleanup({ ownerWorkDisposed = false, retiredReleaseAuthorized = false, quarantineReleaseAuthorized = false, retainLedgerEvidence = false } = {}) {
    if (!['draining', 'terminal'].includes(lifecycle)) {
      if (lifecycle === 'active') lifecycle = 'draining';
      else if (lifecycle !== 'released') fail('RESOURCE_REFERENCE_CLEANUP', `cleanup cannot begin from ${lifecycle}`);
    }
    for (const lease of leases.values()) {
      if (!liveStates.has(lease.state)) continue;
      if (['claimed', 'published'].includes(lease.state) && ownerWorkDisposed !== true) fail('RESOURCE_REFERENCE_CLEANUP_OWNER', 'live owner work requires explicit teardown disposition before Resource releases its lease');
      if (lease.state === 'retired-unreclaimed' && retiredReleaseAuthorized !== true) fail('RESOURCE_REFERENCE_CLEANUP_RETIRED', 'retired capacity requires explicit owner quiescence/release authority at teardown');
      if (lease.state === 'quarantined' && quarantineReleaseAuthorized !== true) fail('RESOURCE_REFERENCE_CLEANUP_QUARANTINE', 'quarantined capacity requires explicit teardown recovery authority');
      lease.state = 'released';
      diagnostics.get(lease.classId).releases += 1n;
    }
    assertConservation();
    lifecycle = 'released';
    const runtimeResidue = [...leases.values()].filter((lease) => liveStates.has(lease.state)).length;
    return {
      kind: 'released',
      runtimeResidue,
      retainedEvidence: retainLedgerEvidence ? freeze({ profile: profile.id, classes: profile.classes.map((entry) => accounting(entry.id)) }, 'Resource retained ledger evidence') : null,
    };
  }

  return Object.freeze({
    profile,
    activate,
    reserveResource,
    reserveCompound,
    publishResourceUse,
    releaseResource,
    retireResource,
    reclaimResourceAccounting,
    quarantineResource,
    observeResourceState: accounting,
    observePressure: watermarkState,
    recordExhaustion,
    beginDraining,
    markTerminal,
    requestHostGrowth,
    removeContributor,
    assertConservation,
    snapshot,
    cleanup,
  });
}
