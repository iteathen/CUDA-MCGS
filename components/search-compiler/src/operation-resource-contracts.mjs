import { canonicalIdentity, exactKeys, fail } from './validation.mjs';
import { normalizeContentIdentity } from './foundation.mjs';

const EFFECTS = new Set(['atomic-add-relaxed-device', 'atomic-cas-relaxed-device', 'atomic-load-acquire-device', 'atomic-store-release-device']);
const PUBLICATION = 'cuda-js.device-publication-release-acquire/0.1.0';

export function normalizeDeviceEffects(input, source, resource, context) {
  if (!Array.isArray(input) || input.length === 0 || new Set(input).size !== input.length
      || input.some((effect) => !EFFECTS.has(effect))) fail('COMPOSE_DEVICE_EFFECT', 'device effects must be distinct admitted operation/order/scope facts');
  if (!source.view || !['u32', 'u64'].includes(source.view.dtype) || !resource.access.includes('atomic')) {
    fail('COMPOSE_DEVICE_EFFECT', 'device atomic effects require an explicit integer view and atomic Resource capability');
  }
  const requirements = new Set(context.publicRequirements.map(({ contract }) => contract.id));
  if (!requirements.has('cuda-js.device-js/0.1.0')
      || (input.some((effect) => effect.includes('acquire') || effect.includes('release')) && !requirements.has(PUBLICATION))) {
    fail('COMPOSE_DEVICE_EFFECT', 'device effects lack their selected public CUDA-JS contract');
  }
  // Access is the operation's complete read/write hazard envelope. Effects keep
  // atomic ordering/type/scope explicit rather than disguising it as ordinary IO.
  if (input.some((effect) => effect !== 'atomic-load-acquire-device') && source.access !== 'read-write') {
    fail('COMPOSE_DEVICE_EFFECT', 'atomic mutation requires a read-write hazard envelope');
  }
  if (!['read', 'read-write'].includes(source.access)) fail('COMPOSE_DEVICE_EFFECT', 'atomic observation requires explicit read access');
  return [...input].sort();
}

export function normalizeArtifactReference(input, source, resource, context, viewByteLength) {
  exactKeys(input, ['ownerProfile', 'artifactId', 'artifactIdentity', 'evaluatorResource', 'contentSha256'], 'COMPOSE_ARTIFACT_FIELDS', 'artifact reference');
  const owner = context.profileById.get(input.ownerProfile)?.normalized;
  const artifact = owner?.artifacts?.find(({ id }) => id === input.artifactId);
  const identity = normalizeContentIdentity(input.artifactIdentity, 'COMPOSE_ARTIFACT_IDENTITY', 'artifact identity');
  if (owner?.schema !== 'cuda-mcgs.evaluator-profile/0.2.0' || !artifact || artifact.identity.sha256 !== identity.sha256
      || artifact.provenance.contentSha256 !== input.contentSha256 || !/^[0-9a-f]{64}$/.test(input.contentSha256)) {
    fail('COMPOSE_ARTIFACT_IDENTITY', 'artifact reference differs from the selected evaluator owner');
  }
  if (artifact.mutability !== 'immutable' || artifact.scope !== 'engine' || artifact.residentBeforeIgnition !== true
      || source.access !== 'read' || source.deviceEffects || !source.view) fail('COMPOSE_ARTIFACT_LIFETIME', 'artifact binding requires an immutable engine artifact and read-only explicit view');
  if (viewByteLength > BigInt(artifact.maxBytes) || BigInt(source.view.elementCount) > BigInt(artifact.maxElements)) {
    fail('COMPOSE_ARTIFACT_EXTENT', 'artifact view exceeds the selected owner bounds');
  }
  const ownedResource = owner.resources.find(({ id }) => id === input.evaluatorResource);
  const plan = context.resourceResult.normalized;
  const contributors = plan.contributors.filter(({ profile }) => profile.id === owner.id);
  const classes = plan.classes.filter((entry) => entry.contributor === contributors[0]?.id && entry.sourceResource === input.evaluatorResource);
  const partitions = plan.partitions.filter((entry) => entry.class === classes[0]?.id);
  const partition = partitions[0];
  const provider = context.providerById.get(resource.providerRequirement);
  if (ownedResource?.class !== 'artifact' || ownedResource.scope !== 'per-engine' || ownedResource.unit !== 'bytes'
      || contributors.length !== 1 || classes.length !== 1 || partitions.length !== 1 || partition?.alias?.kind !== 'none'
      || !provider || partition.pool !== provider.pool || partition.offset !== source.view.byteOffset
      || BigInt(partition.capacity) !== viewByteLength || BigInt(ownedResource.maximum) !== viewByteLength
      || BigInt(source.view.byteOffset) % BigInt(ownedResource.alignment) !== 0n) {
    fail('COMPOSE_ARTIFACT_RESOURCE', 'artifact view must bind the exact selected owner Resource partition');
  }
  return { ...input, artifactIdentity: identity };
}

export function validateImmutableOperationRanges(operations, resources, widths) {
  const bindings = operations.flatMap(({ bindings: entries }) => entries).filter(({ source }) => source.kind === 'resource');
  const range = (source) => source.view
    ? [BigInt(source.view.byteOffset), BigInt(source.view.elementCount) * widths.get(source.view.dtype)]
    : [0n, BigInt(resources.get(source.resource).capacity)];
  for (const { source } of bindings.filter(({ source }) => source.artifact)) {
    const [offset, length] = range(source);
    for (const { source: other } of bindings) {
      if (other.resource !== source.resource) continue;
      const [otherOffset, otherLength] = range(other);
      if (offset >= otherOffset + otherLength || otherOffset >= offset + length) continue;
      if (other.access !== 'read' || other.deviceEffects) fail('COMPOSE_ARTIFACT_MUTATION', 'immutable artifact overlaps a mutable operation binding');
      if (other.artifact && (offset !== otherOffset || length !== otherLength
          || canonicalIdentity(source.artifact).sha256 !== canonicalIdentity(other.artifact).sha256)) {
        fail('COMPOSE_ARTIFACT_ALIAS', 'overlapping immutable bindings disagree on artifact identity or extent');
      }
    }
  }
}
