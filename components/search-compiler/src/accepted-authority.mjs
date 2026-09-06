import { readFileSync } from 'node:fs';

import { canonicalIdentity, compareRaw, exactKeys, fail } from './validation.mjs';

const CONTRACT_SET_URL = new URL('../../../schemas/search-ir/0.2.0/contract-set.json', import.meta.url);
const CONTRACT_SET_SCHEMA = 'cuda-mcgs.search-ir.contract-set/0.2.0';
const REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';

let cachedAuthority = null;

function normalizeBundledContractSet(input) {
  exactKeys(input, ['schema', 'representation', 'status', 'authorityBaseline', 'sourceDigest', 'foundation', 'contracts', 'totals'], 'COMPOSER_AUTHORITY_FIELDS', 'bundled contract set');
  if (input.schema !== CONTRACT_SET_SCHEMA || input.representation !== REPRESENTATION || input.status !== 'accepted') {
    fail('COMPOSER_AUTHORITY_CONTRACT', 'bundled accepted contract-set identity is incompatible');
  }
  if (!input.foundation || typeof input.foundation !== 'object' || !Array.isArray(input.foundation.artifacts)) {
    fail('COMPOSER_AUTHORITY_CONTRACT', 'bundled accepted contract-set foundation is invalid');
  }
  if (!Array.isArray(input.contracts) || input.contracts.length === 0) {
    fail('COMPOSER_AUTHORITY_CONTRACT', 'bundled accepted contract set is empty');
  }
  const artifacts = input.foundation.artifacts
    .map((artifact) => ({ ...artifact }))
    .sort((left, right) => compareRaw(left.role, right.role));
  const contracts = input.contracts
    .map((contract) => ({ ...contract }))
    .sort((left, right) => compareRaw(left.id, right.id));
  return {
    schema: input.schema,
    representation: input.representation,
    status: input.status,
    authorityBaseline: input.authorityBaseline,
    sourceDigest: input.sourceDigest,
    foundation: {
      representation: input.foundation.representation,
      governingContract: input.foundation.governingContract,
      artifacts,
    },
    contracts,
    totals: { ...input.totals },
  };
}

function loadAuthority() {
  if (cachedAuthority !== null) return cachedAuthority;
  const contractSet = normalizeBundledContractSet(JSON.parse(readFileSync(CONTRACT_SET_URL, 'utf8')));
  cachedAuthority = {
    contractSet,
    identities: {
      contractSet: canonicalIdentity(contractSet),
    },
  };
  return cachedAuthority;
}

export function getAcceptedContractAuthority() {
  return structuredClone(loadAuthority());
}

export const acceptedAuthorityConstants = Object.freeze({
  contractSetSchema: CONTRACT_SET_SCHEMA,
  representation: REPRESENTATION,
});
