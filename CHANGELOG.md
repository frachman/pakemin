# Changelog

All notable changes to Pakemin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-09-22

### Added

- Internal repository-local governance source loading and Schema v0 load-time validation. This does not add a user-facing command or verification behavior.
- Internal actual-path governance resolver for scope chains, relevant rules, and exact exception applicability. This does not add a user-facing command or verification behavior.
- Internal pure verification evaluation engine implementing the accepted Verification Contract v0 repository-level comparison and change-set validation, rule evaluation, exception application, and evidence/report construction. This does not add a user-facing command, Git collection, or task-envelope behavior.
- `pakemin check` command for repository-level verification of a Git change set, together with the internal Git comparison and change collector. It prints a deterministic report or diagnostic envelope, requires explicit comparison flags, and does not claim task-authority compliance.

### Changed

- Default adapter generation now creates only the primary `AGENTS.md`; optional compatibility adapters are generated explicitly with `--only`. Existing adapter files are never removed and never overwritten without `--force`.
- Documentation now describes the planned governance direction, layered authority, primary adapter profile, and separate versioning boundaries.

### Fixed

- `pakemin <command> --help` and `-h` print the CLI help instead of executing the command.
- `pakemin check` returns the same clear target-path errors as the other commands instead of a bare loading failure.
- `pakemin check` rejects unknown options and extra arguments with clear errors instead of silently ignoring them.
- Completed pre-release Governance Schema v0 loader and load-time validator conformance remediation.
- Hardened the internal actual-path resolver boundary and completed its pre-release acceptance coverage; no public verification command is added.
- Finalized pre-release resolver provenance, exact-exception, array-integrity, and acceptance-coverage hardening; no public verification command is added.
- Load-time and resolver exception-path validation now share one exact-path predicate, so pattern-only exception paths are rejected consistently; no public verification command is added.

## [0.1.2] - 2026-08-03

### Added

- First-time user tutorial walking through install, `init`, adapter generation, validation, and the first useful edit in `.ai`
- `CONTRIBUTING.md` with local setup, checks, branch policy, and pull request expectations

### Changed

- Removed duplicate legacy example documents from the reference repository so each concept has one canonical example
- Refreshed documentation wording to match the released `0.1.1` state
- Added a mandatory documentation consistency review to the release checklist
- The npm package now includes `docs`, `examples`, `CONTRIBUTING.md`, and `CHANGELOG.md` so README and documentation links work for npm and tarball users
- Expanded the first-time user tutorial with a Node.js prerequisite, install troubleshooting, representative command output, a language-presets pointer, and a closing step on committing project knowledge
- Corrected the roadmap's Milestone 7 statuses and synced the package metadata documentation with the packaged `files` list

### Fixed

- `pakemin validate <missing-path>` now returns a clear "target path does not exist" error instead of a list of misleading "missing" errors

## [0.1.1] - 2026-08-03

### Fixed

- **Boolean flags now recognized when given explicit values** (most safety-relevant): `--dry-run=true`, `--force=false`, and similar forms are now correctly parsed. Note: boolean flags are still recognized by presence, not by their literal value — `--force=false` still enables force; omit the flag to disable it.
- Preset auto-detection no longer discards explicitly specified IDs when using `--preset=auto,<id>`
- Added warnings for empty or whitespace-only values on `--preset` and `--only` options
- Clear error messages for non-directory and dangling symlink target paths instead of raw Node.js errors
- Markdown link validation no longer reports false positives for valid files with query strings or hash anchors

## [0.1.0] - 2026-08-02

### Added

- Initial public preview release with minimal CLI (`init`, `validate`, `adapters list/generate`, `doctor`)
