# CLI

## Purpose

The Pakemin CLI provides minimal local tooling for initializing portable-core files, validating documentation, generating thin adapters, and checking the local project environment.

## Installation

During the pre-release milestone, run the CLI from a checkout:

```text
node ./bin/pakemin.js --help
```

The package is private until the repository owner chooses a final license and release strategy.

## Commands

```text
pakemin init [path] [--force] [--dry-run] [--preset=<id>]
```

Creates a minimal `.ai` portable core with category `README.md` files. Existing files are not overwritten unless `--force` is provided.

Default `init` may report detected stacks and suggest preset commands. It does not apply language-specific presets unless `--preset` is provided.

Use `--preset=auto` to explicitly apply presets for detected stacks.

```text
pakemin validate [path] [--links-only] [--adapters]
```

Checks for `.ai/README.md`, required category navigation files, and broken relative Markdown links.

Use `--links-only` when validating documentation that is not itself a Pakemin-compatible project.

Use `--adapters` to require all supported adapter files and verify that they point to `.ai/README.md`.

```text
pakemin adapters list [path]
```

Lists supported adapters and whether each adapter file exists in the target project.

```text
pakemin adapters generate [path] [--force] [--dry-run] [--only=agents,claude]
```

Generates thin adapter files for `AGENTS.md`, Claude, Gemini, Cursor, and GitHub Copilot. Existing adapter files are not overwritten unless `--force` is provided.

Use `--only` with comma-separated adapter IDs to generate a subset.

```text
pakemin doctor [path]
```

Prints local environment and project checks.

## Boundaries

The CLI does not define a schema, publish a package, install plugins, fetch shared frameworks, or contact vendor APIs.

Language-aware detection is advisory by default. Presets are applied only when explicitly requested.
