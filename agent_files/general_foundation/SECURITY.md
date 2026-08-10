# Security Rules

**Scope:** Reusable foundation.

## Secrets and credentials

Never commit tokens, keys, credentials, private endpoints, private user data, or captured environment secrets. Scrub logs and artifacts before publication.

## Native and executable capabilities

Treat JIT schemas, function addresses, device modules, plugins, and generated code as executable content.

- validate schema shape and allowed operations;
- permit only trusted/signed package sources by default;
- enforce write-xor-execute memory policy;
- keep arbitrary-address binding behind an explicitly unsafe boundary;
- do not expose raw pointers as ordinary public data;
- bind capabilities to lifetime and owner;
- include schema/toolchain/runtime identity in caches;
- reject unknown ABI/type categories safely.

## Third-party material

Record exact source revision and license before copying code, tests, generated data, diagrams, or substantial documentation. A concept may be referenced without copying implementation, but attribution and patent/licensing risk still require review for substantial reuse.

## Failure behavior

Security checks must fail closed. Do not turn a validation failure into a warning merely to preserve compatibility.
