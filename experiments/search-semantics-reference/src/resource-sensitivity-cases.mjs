import assert from 'node:assert/strict';

import { activeResourceOracle, classBySuffix, leaseInput, leaseRef } from './resource-case-support.mjs';

export function registerResourceSensitivityCases({ defineCase, projection }) {
  const base = projection.profiles.find(({ id }) => id === 'resource.synthetic-evaluator-absent').normalized;

  defineCase('resource-oracle-sensitivity-conservation', () => {
    const working = classBySuffix(base, 'class-output-working');
    const input = leaseInput(working, 'sensitivity-retired', { quantity: '31' });

    const correct = activeResourceOracle(base);
    correct.reserveResource(input);
    correct.publishResourceUse(leaseRef(input));
    correct.retireResource(leaseRef(input));
    const correctRetired = correct.observeResourceState(working.id);
    assert.equal(correctRetired.retiredUnreclaimed, '31');
    assert.equal(correct.reclaimResourceAccounting({ ...leaseRef(input), ownerQuiescent: false }).kind, 'pending');

    const freeRetiredMutant = activeResourceOracle(base, { mutations: { retiredCountsAsFree: true } });
    freeRetiredMutant.reserveResource(input);
    freeRetiredMutant.publishResourceUse(leaseRef(input));
    freeRetiredMutant.retireResource(leaseRef(input));
    const mutantRetired = freeRetiredMutant.observeResourceState(working.id);
    assert.notEqual(mutantRetired.available, correctRetired.available, 'case bank must distinguish a mutant that silently treats retired storage as free');

    const quiescenceMutant = activeResourceOracle(base, { mutations: { skipRetiredQuiescence: true } });
    quiescenceMutant.reserveResource(input);
    quiescenceMutant.publishResourceUse(leaseRef(input));
    quiescenceMutant.retireResource(leaseRef(input));
    assert.equal(quiescenceMutant.reclaimResourceAccounting({ ...leaseRef(input), ownerQuiescent: false }).kind, 'reclaimed', 'mutant intentionally violates the quiescence fence');

    correct.reclaimResourceAccounting({ ...leaseRef(input), ownerQuiescent: true });
    assert.equal(correct.cleanup().runtimeResidue, 0);
    assert.equal(freeRetiredMutant.cleanup().runtimeResidue, 0);
    assert.equal(quiescenceMutant.cleanup().runtimeResidue, 0);
    return { retiredFreeMutationDetected: true, quiescenceMutationDetected: true };
  }, ['RESOURCE-ADMIT-007', 'RESOURCE-ADMIT-009', 'RESOURCE-CLEANUP-001']);
}
