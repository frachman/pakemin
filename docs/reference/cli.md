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
pakemin init [path] [--force] [--dry-run]
```

Creates a minimal `.ai` portable core with category `README.md` files. Existing files are not overwritten unless `--force` is provided.

```text
pakemin validate [path] [--links-only]
```

Checks for `.ai/README.md`, required category navigation files, and broken relative Markdown links.

Use `--links-only` when validating documentation that is not itself a Pakemin-compatible project.

```text
pakemin adapters generate [path] [--force] [--dry-run]
```

Generates thin adapter files for `AGENTS.md`, Claude, Gemini, Cursor, and GitHub Copilot. Existing adapter files are not overwritten unless `--force` is provided.

```text
pakemin doctor [path]
```

Prints local environment and project checks.

## Boundaries

The CLI does not define a schema, publish a package, install plugins, fetch shared frameworks, contact vendor APIs, or apply language-specific presets.

Language-aware detection and presets are deferred until the extensibility milestone. The default `init` command should remain vendor-neutral and language-neutral until that milestone is accepted.
