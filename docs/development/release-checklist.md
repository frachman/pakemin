# Release Checklist

## Purpose

This checklist defines the minimum readiness review before Pakemin is published or tagged as a release.

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

## Out of Scope

This checklist does not define release automation, signing, changelog generation, or v1.0 semantic-version guarantees.
