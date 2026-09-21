# Vendor Adapters

## Purpose

Vendor adapters connect specific AI coding agents to the portable core without making vendor-specific files the source of truth.

## Background

AI coding tools load project instructions differently. Some tools read a root instruction file. Others use editor settings, rule directories, or platform-specific configuration.

Pakemin should support these differences while keeping project knowledge portable.

## Design

Adapters should be thin. They may point to canonical documentation, summarize loading instructions, or translate a subset of the portable core when a tool cannot follow links reliably.

The supported adapters are defined by [ADR-0005: Initial Adapter Support](../adr/0005-initial-adapter-support.md). [ADR-0010](../adr/0010-primary-adapter-profile.md) defines their profiles:

- `AGENTS.md` is the primary default adapter.
- `CLAUDE.md`
- `GEMINI.md`
- Cursor rules
- GitHub Copilot instructions

## Boundaries

Adapters must not become independent documentation sets. If an adapter needs substantial content, the corresponding source should exist in the portable core.

See [Adapter contract](adapter-contract.md) for the draft contract.

For standard local Claude Code, `AGENTS.md` is read as a fallback when `CLAUDE.md` is absent. Existing `CLAUDE.md` takes precedence and hosted-provider support may differ; generate the Claude adapter explicitly when needed.

## Open Questions

- How should unsupported vendor capabilities be detected?
- How should shared framework versions be pinned?
- What compatibility guarantees should semantic versions represent?
