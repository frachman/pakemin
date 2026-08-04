# Package Metadata

## Purpose

This document records the current package metadata decisions for Pakemin.

## Current State

The package is published and pre-1.0:

- `name`: `pakemin`
- `version`: `0.1.1`
- `private`: omitted
- `license`: `MIT`
- command namespace: `pakemin`
- runtime: Node.js 18 or newer
- package files: `bin`, `src`, `docs`, `examples`, `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, and `LICENSE`

MIT is used to keep early public adoption simple and familiar.

## Release Policy

Use `0.x` versions until Pakemin v1.0 conventions and CLI behavior are stable.

Before v1.0, minor versions may add or adjust behavior. Patch versions should be compatible fixes.

The first npm release is `0.1.0`. The `0.1.1` patch release is published. The next patch candidate is `0.1.2`.

`master` represents the latest stable public state. Changes for a future release should be developed on a dedicated version branch named after the intended version, such as `v0.1.2` or `v0.2.0`, then merged after validation and maintainer approval.

## Review Notes

A package lock is not required while Pakemin has no runtime or development dependencies.

Future releases should run repository checks, `npm pack`, tarball installation smoke tests, and npm registry smoke tests.
