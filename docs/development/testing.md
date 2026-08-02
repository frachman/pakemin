# Testing

## Purpose

This document describes how to verify Pakemin during public preview development.

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

The same checks run in CI for pushes to `master` and pull requests.

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
