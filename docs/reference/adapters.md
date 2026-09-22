# Adapters

## Purpose

Adapters are thin vendor-specific entry points that help AI coding agents find the Pakemin portable core.

## Supported Adapters

- `agents`: primary default adapter; creates `AGENTS.md`.
- `claude`: optional compatibility adapter; creates `CLAUDE.md`.
- `gemini`: optional compatibility adapter; creates `GEMINI.md`.
- `cursor`: optional compatibility adapter; creates `.cursor/rules/pakemin.md`.
- `copilot`: optional compatibility adapter; creates `.github/copilot-instructions.md`.

## CLI Usage

```text
pakemin adapters list [path]
```

Lists each adapter's role (primary or optional), file status, and path.

```text
pakemin adapters generate [path] [--force] [--dry-run] [--only=agents,claude]
```

Generates the primary default profile (`AGENTS.md`). Use `--only` with comma-separated adapter IDs to generate an optional compatibility adapter or a custom subset.

Example:

```text
pakemin adapters generate . --only=agents,cursor
```

If `--only`, `--only=`, or a blank `--only` value is provided, Pakemin prints a warning and generates the default profile.

```text
pakemin validate [path] --adapters
```

Requires the default `AGENTS.md` adapter and validates its pointer to `.ai/README.md`. Optional adapters are not required, but any optional adapter present in the project must also have a valid pointer.

## Boundaries

Adapters are not the canonical project specification. Durable project knowledge belongs in `.ai`.

Adapter support does not imply that every vendor has identical loading behavior or capabilities.

For standard local Claude Code, an absent `CLAUDE.md` allows its `AGENTS.md` fallback. Keep or generate `CLAUDE.md` explicitly for legacy versions, explicit overrides, or hosted providers where that fallback is unavailable. Pakemin never removes user-owned adapter files automatically.

## Migrating from 0.1.2

Version 0.1.2 generated every adapter by default. Version 0.2.0 makes `AGENTS.md` the primary default profile and generates optional compatibility adapters only on explicit request.

- Fresh projects receive `AGENTS.md` only. Generate a compatibility adapter explicitly, for example `pakemin adapters generate --only=claude`.
- Existing adapter files are never removed and never overwritten without `--force`. A project upgrading from 0.1.2 keeps the adapter files it already has.
- `pakemin validate --adapters` still requires the default `AGENTS.md` adapter and still validates every optional adapter that is present.
