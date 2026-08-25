# Search IR 0.2.0 Composer Reference

**Status:** Research Note

This bounded CUDA-free capsule implements proposal Search IR 0.2.0 catalog, normalization and reference-Composer evidence in dependency order. It is not a production component, public API, accepted semantic contract or native-support claim.

The current `IR-CATALOG-01` slice freezes:

- the accepted Search IR 0.1.0 governing specification, schema, normalizer and identity fixture by SHA-256;
- the exact twelve proposal contracts and 989 unique normative requirement IDs consumed by Search IR 0.2.0 work;
- one primary semantic owner and dependency-ordered owner leaf for every extracted ID; and
- an honest coverage state of zero classified and 989 pending owner-leaf dispositions.

Normative sentences remain solely in [`docs/specs/`](../../docs/specs/). The checked-in catalog records identities, owners, counts, paths and `sha256-utf8-lf-v1` digests; the explicit LF-normalized UTF-8 digest contract is checkout-platform independent. The capsule expands the IDs directly from the frozen sources and fails on source, metadata, count, prefix, uniqueness or coverage-route drift.

Run with Node.js 26 or newer:

```text
node experiments/search-ir-composer-reference/run.mjs
```

Generated `build/evidence.json` is ignored, reproducible evidence and must not be committed. Later focus leaves extend this same capsule with owner schemas, cross-owner normalization, deterministic restricted Device-JS/Search Program composition and deletion/identity oracles. Native CUDA-JS qualification remains separate.
