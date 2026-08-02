# Validation Requirements

## Purpose

This document records early validation requirements for Pakemin documentation and future tooling.

## Documentation Validation

Documentation changes should validate that:

- relative Markdown links resolve;
- category navigation files list added or renamed documents;
- ADR links resolve;
- normal documentation filenames are not numbered;
- ADR filenames use the public Pakemin convention `0001-kebab-case.md`;
- Pakemin starter documents exist when validating a portable core;
- required core headings are present in starter documents;
- documents remain inside the current milestone scope.

Relative Markdown link validation resolves the path portion of a link. Query strings and fragments, such as `?tab=readme` or `#section`, are ignored when checking whether the target file exists.

## Specification Validation

Specification validation should check that:

- project-owned sources of truth are identifiable;
- vendor adapters do not become independent sources of truth;
- context, memory, rules, workflows, skills, templates, and overrides are distinguishable;
- sensitive context is not included in generated adapters unless explicitly allowed.

## ADR Filename Convention

When a target project contains `docs/adr`, Pakemin validation treats ADR filenames as part of the public convention.

ADR filenames must use four digits, a hyphen, lowercase kebab-case text, and the `.md` extension:

```text
0001-kebab-case.md
```

## Boundaries

This document does not define a schema or package format.

## Open Questions

- Which validation checks are required for Pakemin compatibility?
- Which checks should be warnings rather than failures?
- Should validation be possible without installing a CLI?
