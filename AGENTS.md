# Agent Instructions

This repository contains Pakemin documentation and a minimal CLI authorized by [ADR-0004](docs/adr/0004-minimal-cli.md). Do not create schemas, plugin systems, websites, hosted services, or networked integrations unless the milestone scope changes through an accepted ADR or explicit maintainer instruction.

Before making architectural changes, read [docs/README.md](docs/README.md) and identify the relevant documentation category.

Keep documentation compact, vendor-agnostic, and written in English. Prefer clear Markdown over structured data unless YAML or JSON is necessary.

When adding, renaming, or removing documents, update the relevant category `README.md` and any affected links.

Use ADRs in [docs/adr](docs/adr/README.md) for significant architectural decisions. Do not silently resolve open design questions in ordinary documentation.

Report assumptions when requirements are unclear. Avoid inventing product, schema, package, or adapter behavior beyond the documented scope.

Treat `master` as the latest stable public state. For changes targeting a future release, work on a dedicated version branch before pushing, using a branch name that matches the intended version such as `v0.1.2` or `v0.2.0`. Do not push release-bound changes directly to `master` unless the maintainer explicitly requests it.

After documentation changes, validate relative Markdown links.
