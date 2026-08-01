# Testing

## Purpose

This document describes how to verify Pakemin during the current pre-release milestones.

## Automated Checks

Run the Node.js test suite:

```text
npm test
```

Run repository documentation validation:

```text
npm run validate
```

Validate the reference repository as a Pakemin-compatible project:

```text
node ./bin/pakemin.js validate examples/saas-reference-repository --adapters
```

The same checks run in CI for pushes to `main` and pull requests.

## End-to-End Smoke Test

Use a temporary project directory:

```text
node ./bin/pakemin.js init /tmp/pakemin-smoke
node ./bin/pakemin.js adapters generate /tmp/pakemin-smoke
node ./bin/pakemin.js adapters list /tmp/pakemin-smoke
node ./bin/pakemin.js validate /tmp/pakemin-smoke --adapters
node ./bin/pakemin.js doctor /tmp/pakemin-smoke
```

Expected result: initialization creates `.ai`, adapter generation creates thin vendor files, adapter listing reports supported adapters as found, and validation passes.

## Current Gaps

- The package is not published.
- The `pakemin` command is available from the checkout, not as a global install.
- Language-aware detection and presets are deferred to the extensibility milestone.
