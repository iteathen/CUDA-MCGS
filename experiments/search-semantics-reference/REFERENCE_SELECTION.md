# Versioned reference evidence

**Status:** Informational

`fixtures/*.json` is the immutable historical `0.0.0-dev.0` chain. It remains
retained provenance; running current source does not replay the historical
implementation. `fixtures/0.0.0-dev.1/*.json` is the distinct selected chain for
the resident checkpoint. `fixtures/0.0.0-dev.2/*.json` separately selects the
cold-preinitialization package. Its manifest pins the retained dev.1 manifest
and fixture bytes as previous provenance. The resolver requires a registered version matching the
source package. It names actual selected fixture paths in evidence source keys.

The new chain changes Composer/profile/upstream evidence references and neutral
schedule evidence keys. It preserves case IDs, semantic oracle data, profile IDs,
requirement counts, routes and witnesses. The verification tool additionally
reconstructs each historically hash-pinned owner projection with only its old
producer reference restored, and requires the original projection hash. This
proves that ancestry evolution cannot hide changed normalized owner meaning.

`reference-chain-selection.json` pins normalized LF bytes of all twenty-one
historical fixtures, all twenty-one selected fixtures and the selector source.
An old/new chain substitution, unknown package version, historical byte drift,
selected byte drift or changed semantic oracle fails closed. Runtime and native
artifact identities are separate evidence; this chain grants no native claim.

Maintenance uses the existing `tools/reference-evidence-locks.mjs --write <source>`
port only in the explicitly selected new directory. It consumes passing actual
owner evidence and actual projections. Run owners in the dependency order in
`scripts/run-engine-reference-integration.mjs`, refreshing each producer's
dependent references only after it passes. Then run
`node tools/pin-reference-chain-selection.mjs` and
`node scripts/run-engine-reference-integration.mjs`. The normal integration path
performs checks only and retains all mutation falsifiers. Initialization is a
separate fail-if-existing tool, never an overwrite of either fixture chain.
