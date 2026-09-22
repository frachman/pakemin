# Package Metadata

## Purpose

This document records the current package metadata decisions for Pakemin.

## Current State

The package is published and pre-1.0:

- `name`: `pakemin`
- `version`: `0.2.0`
- `private`: omitted
- `license`: `MIT`
- command namespace: `pakemin`
- runtime: Node.js 18 or newer
- package files: `bin`, `src`, `docs`, `examples`, `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, and `LICENSE`

MIT is used to keep early public adoption simple and familiar.

## Release Policy

Use `0.x` versions until Pakemin v1.0 conventions and CLI behavior are stable.

Before v1.0, minor versions may add or adjust behavior. Patch versions should be compatible fixes.

The `0.1.0`, `0.1.1`, and `0.1.2` releases are published. The `0.2.0` release adds governance verification, including the `pakemin check` command. Package SemVer does not define a future portable-core format or verification-report contract version; see [ADR-0011](../adr/0011-versioning-boundaries.md).

`master` represents the latest stable public state. Changes for a future release should be developed on a dedicated version branch named after the intended version, such as `v0.1.2` or `v0.2.0`, then merged after validation and maintainer approval.

## Review Notes

A committed `package-lock.json` records the exact `yaml` runtime dependency for reproducible installation.

Future releases should run repository checks, `npm pack`, tarball installation smoke tests, and npm registry smoke tests.
