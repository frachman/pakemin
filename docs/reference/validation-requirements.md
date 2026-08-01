# Validation Requirements

## Purpose

This document records early validation requirements for Pakemin documentation and future tooling.

## Documentation Validation

Documentation changes should validate that:

- relative Markdown links resolve;
- category navigation files list added or renamed documents;
- ADR links resolve;
- normal documentation filenames are not numbered;
- ADR filenames use a stable numeric prefix;
- documents remain inside the current milestone scope.

## Specification Validation

Future specification validation should check that:

- project-owned sources of truth are identifiable;
- vendor adapters do not become independent sources of truth;
- required precedence rules are visible;
- context, memory, rules, workflows, skills, templates, and overrides are distinguishable;
- sensitive context is not included in generated adapters unless explicitly allowed.

## Boundaries

This document does not define a validation engine, command syntax, schema, or package format.

## Open Questions

- Which validation checks are required for Pakemin compatibility?
- Which checks should be warnings rather than failures?
- Should validation be possible without installing a CLI?
