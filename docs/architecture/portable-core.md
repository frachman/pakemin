# Portable Core

## Purpose

The portable core is the vendor-independent source of truth for project knowledge used by AI coding agents. It is project-owned in `.ai/`.

## Design

The core is expected to cover these categories:

- Context: stable information needed to understand the project.
- Memory: explicit records of relevant project state that change over time.
- Rules: constraints that consistently govern agent behavior.
- Workflows: reusable processes for common engineering activities.
- Skills: reusable instructions for specialized classes of work.
- Templates: standard output structures.
- Overrides: project-specific refinements to shared defaults.

## Responsibilities

The portable core should be readable by humans, reviewable in Git, and usable by multiple AI agents.

It should distinguish durable project facts from temporary working state and project-owned authority from vendor-specific loading behavior. Effective rules must retain the provenance required by [ADR-0009](../adr/0009-layered-authority.md).

## Boundaries

The current milestone does not define strict schemas or serialization formats beyond the Markdown-first default.

Lightweight v1.0 document conventions are defined in [Document conventions](../reference/document-conventions.md).

See also:

- [Context model](context-model.md)
- [Memory model](memory-model.md)
- [Rule model](rule-model.md)
- [Workflow model](workflow-model.md)
- [Adapter contract](adapter-contract.md)

## Open Questions

- How should stale memory be identified?
- What belongs in a skill versus a workflow?
- How should sensitive project context be excluded from generated adapters?
