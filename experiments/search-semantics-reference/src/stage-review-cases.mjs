import { expectCode, profileById, selectedInvocation } from './stage-case-support.mjs';

export function registerStageReviewCases({ defineCase, stageProjection }) {
  defineCase('stage-declared-outcome-release-contract-is-enforced', () => {
    const profile = profileById(stageProjection, 'extension.synthetic-capability-pair');
    for (const field of ['workerReleased', 'mutableLeaseReleased']) {
      const invocation = selectedInvocation(profile, {
        outcomeCode: 'extension-work-complete',
        outcomeOverrides: { [field]: false },
      });
      expectCode(
        () => invocation.oracle.apply(invocation.oracle.initialState(), invocation.input),
        'STAGE_REFERENCE_OUTCOME_RELEASE',
      );
    }
    return { normalizedReleaseContractEnforced: ['workerReleased', 'mutableLeaseReleased'] };
  }, ['EXT-OUTCOME-', 'EXT-CONFORMANCE-']);

  defineCase('stage-undeclared-owner-facts-are-rejected', () => {
    const profile = profileById(stageProjection, 'extension.synthetic-capability-pair');
    const invocation = selectedInvocation(profile, { outcomeCode: 'extension-pending' });
    const extraFact = {
      id: 'extension-context.synthetic-capability-pair.undeclared',
      sourceOwner: invocation.input.ownerFacts[0].sourceOwner,
      stable: true,
      value: { identity: 'extension-context.synthetic-capability-pair.undeclared-public' },
    };
    expectCode(
      () => invocation.oracle.apply(invocation.oracle.initialState(), {
        ...invocation.input,
        ownerFacts: [...invocation.input.ownerFacts, extraFact],
      }),
      'STAGE_REFERENCE_OWNER_FACT_RESIDUE',
    );
    return { undeclaredOwnerFactRejected: true };
  }, ['EXT-CONFORMANCE-']);
}
