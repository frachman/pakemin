# Architecture Decision Records

This category records significant architecture decisions for Pakemin.

Parent: [Documentation](../README.md)

## Documents

- [ADR-0001: Markdown First](0001-markdown-first.md): establishes Markdown as the default portable representation.
- [ADR-0002: Precedence Model](0002-precedence-model.md): historical flat model, superseded by ADR-0009.
- [ADR-0003: Product Name and Command Namespace](0003-product-name-and-command-namespace.md): names the project Pakemin and reserves the `pakemin` command namespace.
- [ADR-0004: Minimal CLI](0004-minimal-cli.md): allows a dependency-free local CLI for the minimal tooling milestone.
- [ADR-0005: Initial Adapter Support](0005-initial-adapter-support.md): defines the first supported adapter set.
- [ADR-0006: Language Detection and Presets](0006-language-detection-and-presets.md): defines safe language-aware detection and explicit presets.
- [ADR-0007: v1.0 Framework Direction](0007-v1-framework-direction.md): historical framework direction, superseded by ADR-0008.
- [ADR-0008: Governance Positioning](0008-governance-positioning.md): defines Pakemin as an AI Engineering Governance Framework.
- [ADR-0009: Layered Authority and Provenance](0009-layered-authority.md): supersedes the flat project-authority model.
- [ADR-0010: Primary Adapter Profile](0010-primary-adapter-profile.md): makes `AGENTS.md` the default adapter entry point.
- [ADR-0011: Versioning Boundaries](0011-versioning-boundaries.md): separates package, format, and verification-report versions.

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
