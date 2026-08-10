# Packaging

Release composition, artifact manifests, compatibility matrices, reproducibility metadata, installation/distribution packaging, and release verification live here.

Packaging consumes declared component outputs. It must not reach into component internals or reconstruct artifacts from incidental source paths.

A future installer that coordinates independently released peer projects should be a peer repository consuming released artifacts/manifests.
