# Rule Model

## Purpose

Rules define constraints that should consistently govern AI-assisted work in a project.

## Design

Rules should be explicit, testable where possible, and scoped to the project or shared framework that owns them.

Useful rules include:

- testing expectations;
- security restrictions;
- Git conventions;
- deployment restrictions;
- migration policies;
- review requirements.

Rules should avoid vague preferences. A rule should help an agent decide what to do or avoid in a concrete situation.

## Responsibilities

Rules are responsible for stable constraints, not step-by-step process. A workflow may reference rules, but should not be the only place where important constraints are documented.

## Boundaries

Rules do not override current user instructions, safety restrictions, or platform restrictions.

Rules should not encode vendor-specific behavior. Vendor-specific constraints belong in adapter documentation unless they affect the portable core.

## Open Questions

- Which rule categories are normative?
- How should conflicting shared rules and project overrides be represented?
- How should rules expose whether they are mandatory or recommended?

