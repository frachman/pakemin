# ADR-0004: Minimal CLI

- Status: Accepted
- Date: 2026-08-01
- Decision owners: Repository owner

## Context

Pakemin has completed its documentation foundation, specification draft, and reference repository milestones.

The roadmap defines a minimal CLI milestone with provisional commands for initializing project structure, validating documents, generating adapters, and reporting environment health.

## Decision

Pakemin will include a minimal dependency-free Node.js CLI using the `pakemin` command namespace.

The initial commands are:

```text
pakemin init
pakemin validate
pakemin adapters generate
pakemin doctor
```

The CLI should implement useful local behavior while avoiding package publishing, schemas, plugin systems, and network requirements.

## Consequences

The repository may now include implementation code, tests, and package metadata needed to run the CLI locally.

The package remains private until the repository owner chooses a final license and release strategy.

Future milestones may replace or expand internals, but the command namespace should remain `pakemin`.

## Alternatives Considered

Keeping Milestone 3 as documentation only was rejected because the roadmap now needs executable validation and initialization behavior.

Using a dependency-heavy framework was rejected for the first CLI because Pakemin should remain easy to inspect and run locally.

