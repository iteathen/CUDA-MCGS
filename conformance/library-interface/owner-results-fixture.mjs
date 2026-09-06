import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  normalizeChannelProfile,
  normalizeDomainProfile,
  normalizeEvaluatorProfile,
  normalizeGraphProfile,
  normalizeOutputProfile,
  normalizePolicyProfile,
  normalizeProgressProfile,
  normalizeResourceProfile,
  normalizeStageProfile,
} from '../../components/search-compiler/testing.mjs';
import { inspectCatalog, sourceTextSha256 } from '../search-compiler/src/catalog.mjs';
import { buildDomainProfiles } from '../search-compiler/src/domain-fixtures.mjs';
import { buildGraphProfiles } from '../search-compiler/src/graph-fixtures.mjs';
import { buildEvaluatorProfiles } from '../search-compiler/src/evaluator-fixtures.mjs';
import { buildPolicyProfiles } from '../search-compiler/src/policy-fixtures.mjs';
import { buildChannelResourceProfile } from '../search-compiler/src/resource-fixtures.mjs';
import { buildChannelProgressProfile } from '../search-compiler/src/progress-fixtures.mjs';
import { buildOutputProfile } from '../search-compiler/src/output-fixtures.mjs';
import { buildChannelStageProfile } from '../search-compiler/src/stage-fixtures.mjs';
import { buildChannelProfile } from '../search-compiler/src/channel-fixtures.mjs';

function withSchema(result, schemaSha) {
  return { ...result, schemaSha };
}

async function readJson(absolutePath) {
  return JSON.parse(await readFile(absolutePath, 'utf8'));
}

export async function buildInstalledOwnerResultsFixture() {
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const schemaRoot = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0');
  const inspected = await inspectCatalog(
    repositoryRoot,
    await readJson(path.join(schemaRoot, 'contract-set.json')),
    await readJson(path.join(schemaRoot, 'requirement-coverage.json')),
  );
  const schemaSha = async (name) => sourceTextSha256(await readFile(path.join(schemaRoot, name)));
  const shas = {
    domain: await schemaSha('domain-profile.schema.json'),
    graph: await schemaSha('graph-profile.schema.json'),
    evaluator: await schemaSha('evaluator-profile.schema.json'),
    policy: await schemaSha('policy-profile.schema.json'),
    resource: await schemaSha('resource-profile.schema.json'),
    progress: await schemaSha('progress-profile.schema.json'),
    output: await schemaSha('output-profile.schema.json'),
    stage: await schemaSha('stage-profile.schema.json'),
    channel: await schemaSha('channel-profile.schema.json'),
  };

  const domainProfiles = buildDomainProfiles(inspected).map((input) => normalizeDomainProfile(input, inspected));
  const graphProfiles = buildGraphProfiles(inspected, domainProfiles, shas.domain)
    .map(({ input, domain }) => normalizeGraphProfile(input, inspected, domain));
  const evaluatorProfiles = buildEvaluatorProfiles(inspected, domainProfiles, graphProfiles, shas.domain, shas.graph)
    .map(({ input, domain, graph }) => normalizeEvaluatorProfile(input, inspected, domain, graph));
  const policyProfiles = buildPolicyProfiles(inspected, domainProfiles, graphProfiles, shas.domain, shas.graph, evaluatorProfiles, shas.evaluator)
    .map(({ input, domain, graph }) => normalizePolicyProfile(input, inspected, domain, graph));

  const knownResourceProfiles = [
    ...domainProfiles.map((result) => withSchema(result, shas.domain)),
    ...graphProfiles.map((result) => withSchema(result, shas.graph)),
    ...policyProfiles.map((result) => withSchema(result, shas.policy)),
    ...evaluatorProfiles.map((result) => withSchema(result, shas.evaluator)),
  ];
  const schemaShas = {
    domain: shas.domain,
    graph: shas.graph,
    policy: shas.policy,
    evaluator: shas.evaluator,
  };
  const resourceResult = withSchema(normalizeResourceProfile(
    buildChannelResourceProfile(inspected, domainProfiles, graphProfiles, policyProfiles, evaluatorProfiles, schemaShas),
    inspected,
    knownResourceProfiles,
  ), shas.resource);
  const progressResult = withSchema(normalizeProgressProfile(
    buildChannelProgressProfile(inspected, resourceResult),
    inspected,
    resourceResult,
    knownResourceProfiles,
  ), shas.progress);
  const outputResult = withSchema(normalizeOutputProfile(
    buildOutputProfile('synthetic-stage-channels', inspected, resourceResult, progressResult),
    inspected,
    resourceResult,
    progressResult,
  ), shas.output);
  const stageResult = withSchema(normalizeStageProfile(
    buildChannelStageProfile(inspected, resourceResult, progressResult, knownResourceProfiles),
    inspected,
    resourceResult,
    progressResult,
    knownResourceProfiles,
  ), shas.stage);
  const channelResult = withSchema(normalizeChannelProfile(
    buildChannelProfile('synthetic-evaluator-and-audit', inspected, resourceResult, progressResult, stageResult, { required: true }),
    inspected,
    resourceResult,
    progressResult,
    stageResult,
  ), shas.channel);

  const profileResults = [
    withSchema(domainProfiles[1], shas.domain),
    withSchema(graphProfiles[1], shas.graph),
    withSchema(policyProfiles[1], shas.policy),
    withSchema(evaluatorProfiles[0], shas.evaluator),
    resourceResult,
    progressResult,
    outputResult,
    stageResult,
    channelResult,
  ];

  return {
    inspected,
    profileResults,
    resourceResult,
    progressResult,
    outputResult,
    sessionResult: null,
    stageResult,
    channelResult,
  };
}
