# Adapters

## Purpose

Adapters are thin vendor-specific entry points that help AI coding agents find the Pakemin portable core.

## Supported Adapters

- `agents`: creates `AGENTS.md`.
- `claude`: creates `CLAUDE.md`.
- `gemini`: creates `GEMINI.md`.
- `cursor`: creates `.cursor/rules/pakemin.md`.
- `copilot`: creates `.github/copilot-instructions.md`.

## CLI Usage

```text
pakemin adapters list [path]
```

Lists supported adapters and whether each adapter file exists in the target project.

```text
pakemin adapters generate [path] [--force] [--dry-run] [--only=agents,claude]
```

Generates all supported adapters by default. Use `--only` with comma-separated adapter IDs to generate a subset.

Example:

```text
pakemin adapters generate . --only=agents,cursor
```

If `--only`, `--only=`, or a blank `--only` value is provided, Pakemin prints a warning and generates all supported adapters.

```text
pakemin validate [path] --adapters
```

Validates that all supported adapter files exist and point to `.ai/README.md`.

## Boundaries

Adapters are not the canonical project specification. Durable project knowledge belongs in `.ai`.

Adapter support does not imply that every vendor has identical loading behavior or capabilities.
