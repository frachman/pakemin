# Changelog

All notable changes to Pakemin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
