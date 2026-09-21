# ADR-0010: Primary Adapter Profile

- Status: Accepted
- Date: 2026-09-21
- Decision owners: Farandy Rachman

## Context

Generating every adapter by default creates unnecessary vendor files and makes optional compatibility look mandatory. `AGENTS.md` is the cross-agent entry point for the portable core. Claude compatibility remains useful where the `AGENTS.md` fallback is unavailable or an explicit override is required.

## Decision

`AGENTS.md` is Pakemin's primary default adapter. The default generation and adapter validation profile contains only `AGENTS.md`.

Claude, Gemini, Cursor, and GitHub Copilot adapters remain optional compatibility adapters. Explicit selection, including `pakemin adapters generate --only=claude`, remains available. Existing user-owned adapter files are never overwritten without `--force`; optional adapters that exist are still validated for their portable-core pointer.

## Consequences

Fresh projects do not receive `CLAUDE.md` by default. Documentation distinguishes the default profile from optional compatibility files and records tool or platform limitations where relevant.

## Alternatives Considered

Removing compatibility adapters was rejected because projects may need explicit vendor support. Treating every adapter as default was rejected because it adds files without establishing a primary entry point.
