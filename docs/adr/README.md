# Architecture Decision Records

This category records significant architecture decisions for Pakemin.

Parent: [Documentation](../README.md)

## Documents

- [ADR-0001: Markdown First](0001-markdown-first.md): establishes Markdown as the default portable representation.
- [ADR-0002: Precedence Model](0002-precedence-model.md): defines conflict resolution order for Pakemin instructions.
- [ADR-0003: Product Name and Command Namespace](0003-product-name-and-command-namespace.md): names the project Pakemin and reserves the `pakemin` command namespace.
- [ADR-0004: Minimal CLI](0004-minimal-cli.md): allows a dependency-free local CLI for the minimal tooling milestone.
- [ADR-0005: Initial Adapter Support](0005-initial-adapter-support.md): defines the first supported adapter set.
- [ADR-0006: Language Detection and Presets](0006-language-detection-and-presets.md): defines safe language-aware detection and explicit presets.
- [ADR-0007: v1.0 Framework Direction](0007-v1-framework-direction.md): accepts Pakemin v1.0 as a lightweight AI Development Framework.

## Format

Each ADR should use this structure:

```markdown
# ADR-NNNN: Decision Title

- Status:
- Date:
- Decision owners:

## Context

## Decision

## Consequences

## Alternatives Considered
```
