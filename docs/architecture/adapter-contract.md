# Adapter Contract

## Purpose

The adapter contract defines the responsibilities of vendor-specific files that connect AI coding agents to Pakemin project knowledge.

## Design

An adapter should:

- identify the project-owned source of truth;
- load or point to the relevant portable-core documents;
- state tool-specific limitations only when necessary;
- avoid duplicating substantial project knowledge;
- preserve the precedence model defined by ADRs;
- make unsupported behavior explicit.

Adapters may be handwritten during early milestones. Future tooling may generate them from the portable core.

## Responsibilities

Adapters are compatibility layers. They should help a specific agent find the right instructions without changing the meaning of the portable core.

## Boundaries

An adapter is not the canonical specification. If adapter content becomes broadly useful, it should move into the portable core.

Adapters should not introduce vendor preference into the core architecture.

## Open Questions

- Should adapters copy content or only reference it?
- How should agents that cannot recursively load linked files be supported?
- Should `AGENTS.md` be the universal fallback adapter?
- How should adapter output be validated?
