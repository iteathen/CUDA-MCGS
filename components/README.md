# Components

Production framework components live here.

Every immediate child component must contain:

- `README.md`;
- `component.yaml` based on [`../agent_files/templates/component-manifest.template.yaml`](../agent_files/templates/component-manifest.template.yaml);
- a clear public/internal boundary;
- declared dependencies;
- owned validation;
- governing specifications/ADRs.

Do not create component directories merely to reserve speculative names. Planned boundaries are tracked in [`../agent_files/SYSTEM_REGISTRY.md`](../agent_files/SYSTEM_REGISTRY.md) until accepted contracts assign implementation ownership.

Generic `common`, `shared`, `utils`, `helpers`, `misc`, or equivalent dumping-ground components are prohibited.
