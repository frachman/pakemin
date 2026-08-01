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
- Decide whether the package should remain private or become publishable.

## Out of Scope

This checklist does not define release automation, package publishing, signing, changelog generation, or semantic-version guarantees.
