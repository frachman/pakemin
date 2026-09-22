# CLI

## Purpose

The Pakemin CLI provides minimal local tooling for initializing portable-core files, validating documentation, generating thin adapters, verifying Git change sets against repository governance, and checking the local project environment.

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

Command target paths must be directories. `pakemin init <missing-dir>` creates the missing target directory; it is the only command that creates a missing target. `pakemin validate <missing-path>`, `pakemin check <missing-path>`, and `pakemin doctor <missing-path>` return a clear missing-target error instead, and all commands return a clear error when the target path exists as a file.

Run `pakemin <command> --help` (or `-h`) to print the CLI help instead of executing the command.

## Commands

```text
pakemin init [path] [--force] [--dry-run] [--preset=<id>]
```

Creates a `.ai` portable core with category `README.md` files and compact starter documents for context, memory, rules, workflows, and templates. Existing files are not overwritten unless `--force` is provided.

Default `init` may report detected stacks and suggest preset commands. It does not apply language-specific presets unless `--preset` is provided.

Use `--preset=auto` to explicitly apply presets for detected stacks. Use `--preset=auto,<id>` to combine detected presets with explicitly listed presets.

If `--preset`, `--preset=`, or a blank `--preset` value is provided, Pakemin prints a warning and continues without applying language presets.

```text
pakemin validate [path] [--links-only] [--adapters]
```

Checks for `.ai/README.md`, required category navigation files, required starter documents, core headings, broken relative Markdown links, and Pakemin ADR filename conventions.

When a target project contains `docs/adr`, ADR files must use the public Pakemin filename convention:

```text
0001-kebab-case.md
```

Use `--links-only` when validating documentation that is not itself a Pakemin-compatible project.

Use `--adapters` to require the primary default adapter and verify that it points to `.ai/README.md`. Existing optional compatibility adapters are also checked when present.

```text
pakemin check [path] [--baseline=<revision>] [--target=<revision>] [--working-tree]
```

Verifies a Git change set against repository governance and prints a deterministic Verification Contract v0 report. `--baseline` is required. Choose exactly one target form:

- `--target=<revision>` compares two resolved commit object IDs and sets `reproducible: true`.
- `--working-tree` compares the baseline commit to the current working tree and sets `reproducible: false`.

Supplying both target forms, or neither, is a runtime `invalid-comparison` error. Unknown options and extra arguments are rejected with the same `invalid-comparison` error instead of being silently ignored; use the `=` form for option values, for example `--baseline=main`. There are no silent defaults: Pakemin never infers a baseline or an unverifiable target. Untracked files are not collected because v0 change sets are Git diff results.

On a governance outcome, `check` prints the report as JSON on stdout and exits `0` for `pass`, `1` for `fail`, or `2` for `requires-review`. On a configuration or runtime failure it prints a diagnostic envelope as JSON on stderr and exits `3` or `4`; no report is printed. Reports keep `verificationMode: "repository"` and never claim task-authority compliance.

```text
pakemin adapters list [path]
```

Lists each adapter's role (primary or optional), file status, and path.

```text
pakemin adapters generate [path] [--force] [--dry-run] [--only=agents,claude]
```

Generates the primary `AGENTS.md` adapter by default. Claude, Gemini, Cursor, and GitHub Copilot adapters remain available through explicit `--only` selection. Existing adapter files are not overwritten unless `--force` is provided.

Use `--only` with comma-separated adapter IDs to generate a subset.

If `--only`, `--only=`, or a blank `--only` value is provided, Pakemin prints a warning and generates the default adapter profile.

```text
pakemin doctor [path]
```

Prints local environment and project checks.

## Boundaries

The CLI does not define a schema, publish a package, install plugins, fetch shared frameworks, or contact vendor APIs.

Language-aware detection is advisory by default. Presets are applied only when explicitly requested.
