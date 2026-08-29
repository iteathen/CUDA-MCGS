import fs from 'node:fs';

function replaceExactlyOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one match, found ${count}`);
  return source.replace(before, after);
}

const policyPath = 'experiments/search-semantics-reference/src/policy.mjs';
let policy = fs.readFileSync(policyPath, 'utf8');
const oldValidation = [
  "      if (declared.disposition === 'retain' && entry.action !== 'retain') fail('POLICY_REFERENCE_REUSE', `${entry.recordId} contradicts declared retain`);",
  "      if (declared.disposition === 'retain-if-key-valid') {",
  "        const expected = entry.keyValid === true ? 'retain' : 'invalidate';",
  "        if (entry.action !== expected) fail('POLICY_REFERENCE_REUSE', `${entry.recordId} key-valid reuse action must be ${expected}`);",
  "      }",
  "      if (declared.disposition === 'reset' && entry.action !== 'reset') fail('POLICY_REFERENCE_REUSE', `${entry.recordId} contradicts declared reset`);",
  "      byRecord.set(entry.recordId, entry);",
  "      reuseClassifications += 1n;",
  "      emit('reuse-classified', { recordId: entry.recordId, action: entry.action });",
  "    }",
  "    if (byRecord.size !== reuseByRecord.size) fail('POLICY_REFERENCE_REUSE', 'reroot must classify every persistent policy record');",
  "    currentRootEpoch = to;",
  "    for (const [recordId, entry] of byRecord) {",
].join('\n');
const newValidation = [
  "      if (declared.disposition === 'retain-if-key-valid') {",
  "        const expected = entry.keyValid === true ? 'retain' : 'invalidate';",
  "        if (entry.action !== expected) fail('POLICY_REFERENCE_REUSE', `${entry.recordId} key-valid reuse action must be ${expected}`);",
  "      } else if (entry.action !== declared.disposition) {",
  "        fail('POLICY_REFERENCE_REUSE', `${entry.recordId} contradicts declared ${declared.disposition}`);",
  "      }",
  "      byRecord.set(entry.recordId, entry);",
  "    }",
  "    if (byRecord.size !== reuseByRecord.size) fail('POLICY_REFERENCE_REUSE', 'reroot must classify every persistent policy record');",
  "    for (const [recordId, entry] of byRecord) {",
  "      reuseClassifications += 1n;",
  "      emit('reuse-classified', { recordId, action: entry.action });",
  "    }",
  "    for (const [recordId, entry] of byRecord) {",
].join('\n');
policy = replaceExactlyOnce(policy, oldValidation, newValidation, 'reroot validation');
const oldCommit = [
  "    }",
  "    emit('root-rerooted', { fromEpoch: input.fromEpoch, toEpoch: input.toEpoch, classifications: String(byRecord.size) });",
].join('\n');
const newCommit = [
  "    }",
  "    currentRootEpoch = to;",
  "    emit('root-rerooted', { fromEpoch: input.fromEpoch, toEpoch: input.toEpoch, classifications: String(byRecord.size) });",
].join('\n');
policy = replaceExactlyOnce(policy, oldCommit, newCommit, 'reroot commit');
fs.writeFileSync(policyPath, policy);

const casesPath = 'experiments/search-semantics-reference/src/policy-cases.mjs';
let cases = fs.readFileSync(casesPath, 'utf8');
const oldCase = [
  "    for (const declaration of scalar.reuse) {",
  "      const entry = rerootDispositions(scalar, true).find(({ recordId }) => recordId === declaration.record);",
  "      assert(entry);",
  "      if (declaration.disposition === 'retain') assert.equal(entry.action, 'retain');",
  "      if (declaration.disposition === 'retain-if-key-valid') assert.equal(entry.action, 'retain');",
  "      if (declaration.disposition === 'reset') assert.equal(entry.action, 'reset');",
  "    }",
  "    return result;",
].join('\n');
const newCase = [
  "    for (const declaration of scalar.reuse) {",
  "      const entry = rerootDispositions(scalar, true).find(({ recordId }) => recordId === declaration.record);",
  "      assert(entry);",
  "      if (declaration.disposition === 'retain') assert.equal(entry.action, 'retain');",
  "      if (declaration.disposition === 'retain-if-key-valid') assert.equal(entry.action, 'retain');",
  "      if (declaration.disposition === 'reset') assert.equal(entry.action, 'reset');",
  "    }",
  "",
  "    const mutableReuseIndex = scalar.reuse.findIndex(({ disposition }) => disposition === 'reset');",
  "    assert.notEqual(mutableReuseIndex, -1, 'Policy fixture needs one reset record for transform/invalidate sensitivity');",
  "    for (const disposition of ['transform', 'invalidate']) {",
  "      const variantProfile = canonicalClone(scalar);",
  "      variantProfile.reuse[mutableReuseIndex].disposition = disposition;",
  "      const variant = numericOracle(variantProfile);",
  "      for (const record of variantProfile.records) {",
  "        variant.initializeRecord({ recordId: record.id, storageKey: `key-${record.id}`, generation: '0', value: { marker: record.scope } });",
  "      }",
  "      variant.setRootEpoch({ rootEpoch: '20' });",
  "      const validDispositions = rerootDispositions(variantProfile, true);",
  "      const invalidDispositions = canonicalClone(validDispositions);",
  "      invalidDispositions[mutableReuseIndex].action = disposition === 'transform' ? 'reset' : 'retain';",
  "      const beforeInvalid = variant.snapshot();",
  "      assert.throws(",
  "        () => variant.reroot({ fromEpoch: '20', toEpoch: '21', dispositions: invalidDispositions }),",
  "        { code: 'POLICY_REFERENCE_REUSE' },",
  "      );",
  "      assert.deepEqual(variant.snapshot(), beforeInvalid, 'invalid reroot must not publish partial Policy reuse state');",
  "",
  "      const variantResult = variant.reroot({ fromEpoch: '20', toEpoch: '21', dispositions: validDispositions });",
  "      assert.equal(variantResult.reuseClassifications, String(variantProfile.reuse.length));",
  "      const targetRecord = variantProfile.records.find(({ id }) => id === variantProfile.reuse[mutableReuseIndex].record);",
  "      assert(targetRecord);",
  "      const targetKey = `key-${targetRecord.id}`;",
  "      if (disposition === 'transform') {",
  "        assert.deepEqual(variant.readRecord({ recordId: targetRecord.id, storageKey: targetKey }), { transformedFrom: { marker: targetRecord.scope } });",
  "      } else {",
  "        assert.throws(() => variant.readRecord({ recordId: targetRecord.id, storageKey: targetKey }), { code: 'POLICY_REFERENCE_RECORD' });",
  "      }",
  "    }",
  "    return result;",
].join('\n');
cases = replaceExactlyOnce(cases, oldCase, newCase, 'reroot case');
fs.writeFileSync(casesPath, cases);
