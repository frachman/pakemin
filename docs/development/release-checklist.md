# Release Checklist

## Purpose

This checklist defines the minimum readiness review before Pakemin is published or tagged as a release.

## Release Versioning Scheme

This repeatable procedure keeps the published npm version, the git tag, and the GitHub release in sync. Follow it for every release.

1. Do all release-bound work on a dedicated version branch (e.g. `v0.1.2`), never directly on `master`.
2. Before merging to `master`: bump the `package.json` version, finalize the CHANGELOG entry for that version (leave the date blank until the final step below), and run the full check suite.
3. Merge the version branch into `master` only after maintainer approval.
4. On `master`, at the exact merge commit: fill in today's date on the CHANGELOG's version heading (replacing "Unreleased"), commit that single change directly as the release commit, then create the git tag on that exact commit: `git tag v<version>`.
5. Push the tag: `git push origin v<version>`.
6. From a clean checkout of that exact tag (not from a working directory that might have uncommitted changes), run `npm publish`. This guarantees the published npm tarball's contents exactly match the tagged git commit.
7. Create a GitHub Release for the pushed tag, using the same version number as the title (e.g. `v0.1.2`) and release notes adapted from the CHANGELOG entry for that version.
8. Verify parity: `npm view pakemin version` matches the GitHub tag name (minus the `v` prefix), and the GitHub Releases page shows the same version as the latest npm dist-tag.

Never run `npm publish` from an untagged or uncommitted working state, and never tag a commit that differs from what gets published — these two are the most common causes of GitHub/npm version mismatch.

## Required Before First Public Release

- Confirm the MIT license remains appropriate for the release.
- Confirm `package.json` license metadata matches `LICENSE`.
- Confirm package name, command namespace, and repository URLs.
- Run `npm test`.
- Run `npm run validate`.
- Run `node ./bin/pakemin.js validate examples/saas-reference-repository --adapters`.
- Review generated adapter content for thin-adapter behavior.
- Confirm README usage examples match the CLI.
- Confirm `private` is omitted from `package.json`.
- Confirm release policy and version are documented.
- Run `npm pack`.
- Install the generated tarball into a temporary project.
- Run `pakemin --help` from the tarball install.
- Run `pakemin init`, `pakemin adapters generate`, and `pakemin validate --adapters` from the tarball install.

## Required for Patch Releases (e.g., 0.1.1)

- Work from a dedicated version branch, such as `v0.1.2`, until the release is validated and approved for `master`.
- Confirm `package.json` version matches the version about to be published.
- Confirm a git tag matching `v<package.json version>` exists (or will be created as part of this release) and points at the commit being published.
- Confirm CHANGELOG.md has an entry for the version being published.
- Confirm README, getting-started, reference-repository, example, and CHANGELOG wording matches the version being published (documentation consistency review); fix any stale milestone or version references.
- Re-run `npm pack`, install the tarball into a temporary project, and smoke test `pakemin --version`, `pakemin init`, `pakemin adapters generate`, and `pakemin validate --adapters` from the tarball install — since fixes landed after the last time this was verified.

## Out of Scope

This checklist does not define release automation, signing, or v1.0 semantic-version guarantees.
