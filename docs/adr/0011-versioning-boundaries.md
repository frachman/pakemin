# ADR-0011: Versioning Boundaries

- Status: Accepted
- Date: 2026-09-21
- Decision owners: Farandy Rachman

## Context

Pakemin's npm release version, future portable-core compatibility, and future verification report compatibility serve different consumers and must not be conflated.

## Decision

The npm package, Git tag, GitHub Release, and changelog use SemVer. This branch targets 0.2.0 while `package.json` remains at 0.1.2 until approved release preparation.

Any portable-core manifest requires a separate ADR that defines its necessity and semantics before a file is introduced. Verification reports use their own explicit contract version; the proposed Verification Contract v0 uses `contractVersion: "0"`.

## Consequences

Documentation labels current stable behavior, target release work, accepted decisions, proposals, and implemented behavior separately. No manifest or lockfile is introduced by this decision.

## Alternatives Considered

Using the package version as every compatibility version was rejected because it would hide independent format and report evolution.
