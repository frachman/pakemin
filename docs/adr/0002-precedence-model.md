# ADR-0002: Precedence Model

- Status: Accepted
- Date: 2026-08-01
- Decision owners: Farandy Rachman

## Context

Pakemin needs a clear rule for resolving conflicts between current user requests, platform restrictions, project-specific content, shared framework defaults, and vendor adapter behavior.

Without an explicit precedence model, adapters and project documentation may interpret the same instruction differently.

## Decision

Pakemin uses this precedence order:

1. Safety and platform restrictions.
2. Explicit current user instruction.
3. Project-specific overrides.
4. Project decisions and context.
5. Shared framework defaults.
6. Vendor adapter defaults.

Safety and platform restrictions are first because agents must not follow instructions that violate their operating constraints. Explicit current user instruction is next because task-local intent should govern ordinary project work unless it conflicts with higher restrictions.

## Consequences

Project-specific overrides can refine shared defaults without changing the shared framework.

Vendor adapters remain the lowest-precedence layer and should not redefine project knowledge.

Documentation and future tooling have a single conflict-resolution model to reference.

## Alternatives Considered

Putting user instruction above safety and platform restrictions was rejected because Pakemin cannot require agents to violate their operating constraints.

Leaving the order provisional was rejected because adapter and override behavior needs a documented baseline before Milestone 1 can proceed.
