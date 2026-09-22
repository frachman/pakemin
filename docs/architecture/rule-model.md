# Rule Model

## Purpose

Rules define constraints that should consistently govern AI-assisted work in a project.

## Design

Rules should be explicit, testable where possible, and scoped to the project or shared framework that owns them. The declarative model for machine-enforceable rules is defined in [ADR-0013](../adr/0013-declarative-governance-schema.md); Markdown remains appropriate for explanatory and non-deterministic guidance.

Useful rules include:

- testing expectations;
- security restrictions;
- Git conventions;
- deployment restrictions;
- migration policies;
- review requirements.

Rules should avoid vague preferences. A rule should help an agent decide what to do or avoid in a concrete situation. A natural-language description may explain a future machine-enforceable rule, but it cannot determine that rule's outcome.

## Responsibilities

Rules are responsible for stable constraints, not step-by-step process. A workflow may reference rules, but should not be the only place where important constraints are documented.

## Boundaries

Rules do not override current user instructions, safety restrictions, or platform restrictions.

Rules should not encode vendor-specific behavior. Vendor-specific constraints belong in adapter documentation unless they affect the portable core.

The evaluation states and final governance outcomes for machine-enforceable rules are defined in [ADR-0014](../adr/0014-least-change-verification.md).

[Governance Schema v0](../reference/governance-schema-v0.md) is the accepted normative input contract for typed rules and exceptions and is enforced by `pakemin check`.

[Verification Contract v0](verification-contract-v0.md) is the accepted normative repository-level evaluation and report contract and is implemented by `pakemin check`; task-aware verification remains deferred until a task-envelope contract exists.

## Open Questions

- Which rule categories are normative?
- How should conflicting shared rules and project overrides be represented?
- How should rules expose whether they are mandatory or recommended?
