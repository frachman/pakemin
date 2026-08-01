# ADR-0005: Initial Adapter Support

- Status: Accepted
- Date: 2026-08-01
- Decision owners: Farandy Rachman

## Context

Pakemin needs useful adapter support without making vendor-specific files canonical.

The reference repository and minimal CLI already use thin adapter files for common AI coding tools, but the supported adapter set needs to be explicit before future adapter behavior expands.

## Decision

Pakemin initially supports these adapters:

- `agents`: root `AGENTS.md`
- `claude`: root `CLAUDE.md`
- `gemini`: root `GEMINI.md`
- `cursor`: `.cursor/rules/pakemin.md`
- `copilot`: `.github/copilot-instructions.md`

Adapters must remain thin entry points that direct agents to `.ai/README.md` and the portable core.

The CLI may list supported adapters, generate all or selected adapters, and validate adapter presence when explicitly requested.

## Consequences

Pakemin can provide practical multi-agent compatibility while keeping `.ai` as the project-owned source of truth.

Adding or changing supported adapters should update documentation, tests, and CLI behavior together.

## Alternatives Considered

Keeping adapters as examples only was rejected because Milestone 4 is specifically about adapter support.

Generating vendor-specific copies of the full portable core was rejected because it would create duplicate sources of truth.
