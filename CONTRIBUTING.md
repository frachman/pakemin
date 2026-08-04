# Contributing to Pakemin

Thanks for your interest in contributing to Pakemin. This document describes how to set up a local checkout, run checks, and prepare a contribution.

## Local Setup

Clone the repository and install dependencies:

```text
git clone git@github.com:frachman/pakemin.git
cd pakemin
npm install
npm link
```

`npm link` makes the `pakemin` command available so you can run the CLI directly. After linking, you can also use it from the checkout:

```text
node ./bin/pakemin.js --help
```

## Running Checks

Run the test suite:

```text
npm test
```

Run link validation across the documentation:

```text
npm run validate
```

Validate the reference repository with adapters:

```text
node ./bin/pakemin.js validate examples/saas-reference-repository --adapters
```

Run all three before opening a pull request.

## Branch Policy

Work on a dedicated version branch named after the intended release, such as `v0.1.2` or `v0.2.0`:

```text
git checkout master
git checkout -b v0.1.2
```

Do not push release-bound changes directly to `master` without maintainer approval. `master` represents the latest stable public state.

## Commit Expectations

- Write meaningful commit messages that describe the logical change.
- Make one logical change per commit rather than bundling unrelated edits.
- Keep commits reviewable and easy to revert independently.

## Pull Request Expectations

- Open pull requests against the appropriate version branch, not directly against `master` for release-bound work.
- Ensure `npm test` and `npm run validate` pass before requesting review.
- Keep documentation changes scoped to their stated milestone.
- Report assumptions when a requirement is unclear rather than inventing behavior beyond the documented scope.
