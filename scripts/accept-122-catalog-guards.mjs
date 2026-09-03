import { readFile, writeFile } from 'node:fs/promises';

const file = 'experiments/search-ir-composer-reference/src/catalog.mjs';
let text = await readFile(file, 'utf8');

function replaceExact(before, after, label) {
  const occurrences = text.split(before).length - 1;
  if (occurrences !== 1) throw new Error(`accept-122-catalog: ${label}: expected one occurrence, found ${occurrences}`);
  text = text.replace(before, after);
}

replaceExact(
`      requirements.push({
        id,
        contract: contract.id,
        primaryOwner: route.primaryOwner,
        evidenceOwner: route.evidenceOwner,
        currentDisposition: classification?.primaryDisposition ?? route.currentDisposition,
        supportingDispositions: classification?.supportingDispositions ?? [],
        evidenceOwner: classification?.evidenceOwner ?? route.evidenceOwner,
        evidenceStatus: classification?.evidenceStatus ?? 'pending',
        evidenceRefs: classification?.evidenceRefs ?? [],
        classificationStatus: classification?.classificationStatus ?? 'pending',
      });`,
`      requirements.push({
        id,
        contract: contract.id,
        primaryOwner: route.primaryOwner,
        currentDisposition: classification?.primaryDisposition ?? route.currentDisposition,
        supportingDispositions: classification?.supportingDispositions ?? [],
        evidenceOwner: classification?.evidenceOwner ?? route.evidenceOwner,
        evidenceStatus: classification?.evidenceStatus ?? 'pending',
        evidenceRefs: classification?.evidenceRefs ?? [],
        classificationStatus: classification?.classificationStatus ?? 'pending',
      });`,
  'deduplicate expanded evidenceOwner',
);

replaceExact(
`  for (const route of coverage.contracts) {
    const routeHasClassification = coverage.classifications.some(({ contract }) => contract === route.contract);
    const expectedState = routeHasClassification ? ['section-classified', 'in-progress'] : ['pending-owner-classification', 'pending'];
    if (route.currentDisposition !== expectedState[0] || route.completionStatus !== expectedState[1]) {
      fail('COVERAGE_ROUTE_STATE', \\`${'${route.contract}'} route state disagrees with its classifications\\`);
    }
  }`,
`  for (const route of coverage.contracts) {
    const expanded = requirements.filter(({ contract }) => contract === route.contract);
    if (route.currentDisposition !== 'accepted-reference' || route.completionStatus !== 'accepted') {
      fail('COVERAGE_ROUTE_STATE', \\`${'${route.contract}'} route is not accepted reference authority\\`);
    }
    if (expanded.length === 0 || expanded.some(({ classificationStatus }) => classificationStatus !== 'classified')) {
      fail('COVERAGE_ROUTE_STATE', \\`${'${route.contract}'} has an unclassified accepted requirement\\`);
    }
    for (const requirement of expanded) {
      const expectedEvidenceStatus = requirement.currentDisposition === 'native-compatible-pair-qualification'
        ? 'deferred-native'
        : 'accepted-reference';
      if (requirement.evidenceStatus !== expectedEvidenceStatus) {
        fail('COVERAGE_ROUTE_STATE', \\`${'${requirement.id}'} evidence status disagrees with its final disposition\\`);
      }
    }
  }`,
  'replace proposal route-state model',
);

await writeFile(file, text, 'utf8');
console.log('accept-122 catalog guards migrated to accepted route semantics');
