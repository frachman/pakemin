# ADR-0009: Layered Authority and Provenance

- Status: Accepted
- Date: 2026-09-21
- Decision owners: Farandy Rachman

## Context

ADR-0002 defines a flat precedence order. Pakemin also needs repository-native authority that can be resolved by scope and reproduced in review or CI.

## Decision

Pakemin resolves authority through Defaults, optional Organization, Repository, Scope, and Task layers. Filesystem paths select scopes; each nested scope has one parent.

Context may be additive and retrieval-filtered. Authority and policy may only remain equally restrictive or become more restrictive toward child layers. A child cannot silently weaken a parent. An exception must be explicit, narrow, attributable, and auditable.

Every effective rule retains provenance: its source layer, source document, and applicable scope. Safety and platform restrictions remain above this project-owned hierarchy, and an explicit current user instruction governs ordinary task-local work unless a higher restriction applies.

## Consequences

This ADR supersedes ADR-0002 for project-owned authority resolution. Future resolvers and reports must expose effective-rule provenance. It does not introduce a resolver, manifest, lockfile, or task file format.

## Alternatives Considered

Retaining flat precedence was rejected because it cannot express nested scope, restrictive inheritance, or auditable exceptions.
