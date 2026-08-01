# Vendor Adapters

## Purpose

Vendor adapters connect specific AI coding agents to the portable core without making vendor-specific files the source of truth.

## Background

AI coding tools load project instructions differently. Some tools read a root instruction file. Others use editor settings, rule directories, or platform-specific configuration.

Pakemin should support these differences while keeping project knowledge portable.

## Design

Adapters should be thin. They may point to canonical documentation, summarize loading instructions, or translate a subset of the portable core when a tool cannot follow links reliably.

Initial adapter candidates include:

- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- Cursor rules
- GitHub Copilot instructions

## Boundaries

Adapters must not become independent documentation sets. If an adapter needs substantial content, the corresponding source should exist in the portable core.

See [Adapter contract](adapter-contract.md) for the draft contract.

## Open Questions

- Which adapters should be supported first?
- How should unsupported vendor capabilities be detected?
- How should shared framework versions be pinned?
- What compatibility guarantees should semantic versions represent?
