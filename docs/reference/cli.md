# CLI

## Purpose

The Pakemin CLI provides minimal local tooling for initializing portable-core files, validating documentation, generating thin adapters, and checking the local project environment.

## Installation

Install from npm:

```text
npm install -g pakemin
pakemin --help
```

For local development, run the CLI from a checkout:

```text
node ./bin/pakemin.js --help
node . --help
```

From another project, point Node at the Pakemin checkout:

```text
cd /path/to/your-project
node /path/to/pakemin init
```

Pakemin uses `0.x` versions before v1.0. Minor releases may add or adjust pre-1.0 behavior; patch releases should be compatible fixes.

Boolean flags such as `--force`, `--dry-run`, `--links-only`, and `--adapters` are enabled by presence. They do not support `--flag=false` to disable; omit the flag instead.

Command target paths must be directories. `pakemin init <missing-dir>` creates the missing target directory; commands return a clear error when the target path exists as a file.

## Commands

```text
pakemin init [path] [--force] [--dry-run] [--preset=<id>]
```

Creates a `.ai` portable core with category `README.md` files and compact starter documents for context, memory, rules, workflows, and templates. Existing files are not overwritten unless `--force` is provided.

Default `init` may report detected stacks and suggest preset commands. It does not apply language-specific presets unless `--preset` is provided.

Use `--preset=auto` to explicitly apply presets for detected stacks. Use `--preset=auto,<id>` to combine detected presets with explicitly listed presets.

If `--preset` or `--preset=` is provided without a value, Pakemin prints a warning and continues without applying language presets.

```text
pakemin validate [path] [--links-only] [--adapters]
```

Checks for `.ai/README.md`, required category navigation files, required starter documents, core headings, broken relative Markdown links, and Pakemin ADR filename conventions.

When a target project contains `docs/adr`, ADR files must use the public Pakemin filename convention:

```text
0001-kebab-case.md
```

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

If `--only` or `--only=` is provided without a value, Pakemin prints a warning and generates all supported adapters.

```text
pakemin doctor [path]
```

Prints local environment and project checks.

## Boundaries

The CLI does not define a schema, publish a package, install plugins, fetch shared frameworks, or contact vendor APIs.

Language-aware detection is advisory by default. Presets are applied only when explicitly requested.
