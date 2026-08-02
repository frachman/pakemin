# Package Metadata

## Purpose

This document records the current package metadata decisions for Pakemin.

## Current State

The package is publishable and pre-1.0:

- `name`: `pakemin`
- `version`: `0.1.0`
- `private`: omitted
- `license`: `MIT`
- command namespace: `pakemin`
- runtime: Node.js 18 or newer
- package files: `bin`, `src`, `README.md`, and `LICENSE`

MIT is used to keep early public adoption simple and familiar.

## Release Policy

Use `0.x` versions until Pakemin v1.0 conventions and CLI behavior are stable.

Before v1.0, minor versions may add or adjust behavior. Patch versions should be compatible fixes.

The first npm release is `0.1.0`.

## Review Notes

A package lock is not required while Pakemin has no runtime or development dependencies.

The first release can be published manually after repository checks, `npm pack`, and tarball installation smoke tests pass.
