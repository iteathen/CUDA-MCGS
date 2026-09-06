# CUDA-MCGS packaging

This area covers distribution, execution-package compatibility, and reproducibility metadata. A private development package is defined in the [root manifest](../package.json); there is no released npm package yet.

- [Library interface](../components/library-interface/README.md): public exports.
- [Installed-package conformance](../conformance/library-interface/README.md): pack/install checks.
- [Compatible-pair qualification](../conformance/cuda-js-compatible-pair/README.md): exact CUDA-MCGS/CUDA-JS evidence.
- [Specifications](../docs/specs/README.md): package and compatibility contracts.

Future releases need recorded provenance and independently qualified runtime compatibility. Packaging consumes declared public component/library outputs, not private peer source paths.
