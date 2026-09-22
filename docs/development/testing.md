# Testing

## Purpose

This document describes how to verify Pakemin during public preview development.

## Automated Checks

Install the locked dependency graph before running checks:

```text
npm ci
```

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

The same checks run in CI for pushes to `master` and `v*` release branches, and for pull requests.

The Node.js suite includes focused repository-local governance loader, schema, path-pattern, and actual-path resolver tests. It has separate load-time 36/36 and resolution-time 2/2 conformance inventories, plus loader-security fixtures for YAML features, special object keys, symlinks, containment, and parser-boundary isolation. It does not run Git collection, rule evaluation, reporting, or a CLI command.

## End-to-End Smoke Test

Use a temporary project directory:

```text
node ./bin/pakemin.js init /tmp/pakemin-smoke
node ./bin/pakemin.js adapters generate /tmp/pakemin-smoke
node ./bin/pakemin.js adapters list /tmp/pakemin-smoke
node ./bin/pakemin.js validate /tmp/pakemin-smoke --adapters
node ./bin/pakemin.js doctor /tmp/pakemin-smoke
```

Expected result: initialization creates `.ai`, default adapter generation creates `AGENTS.md`, adapter listing identifies primary and optional roles, and validation passes.

## npm Smoke Test

After a package is published, install it from npm and run a temporary-project smoke test:

```text
npm install -g pakemin
pakemin --version
pakemin init /tmp/pakemin-npm-smoke
pakemin adapters generate /tmp/pakemin-npm-smoke
pakemin validate /tmp/pakemin-npm-smoke --adapters
```

Expected result: the installed version matches the release, initialization creates the v1 scaffold, adapter generation succeeds, and validation passes.
