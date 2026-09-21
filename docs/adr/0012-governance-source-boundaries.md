# ADR-0012: Governance Source Boundaries

- Status: Proposed
- Date: 2026-09-21
- Decision owners: Farandy Rachman

## Context

Pakemin needs a clear boundary between repository governance that contributors can review and private or runtime state that must not become a hidden requirement or leak through version control. The accepted layered-authority model reserves an optional Organization layer, but v0.2 must remain independently useful for a repository without organization governance.

## Decision

Repository governance and durable project knowledge belong in `.ai/` and are version-controlled. Content in `.ai/` must be safe for the repository's intended visibility. Rules a contributor needs to create a valid contribution must be visible in the repository.

Temporary runtime state, credentials, caches, conversation history, and private state do not belong in `.ai/`. v0.2 local or private Pakemin state belongs under `~/.pakemin/`; it must not be required to understand or validate the repository's contributor contract.

Repository governance is complete without organization governance. An organization may later provide optional internal policy, but v0.2 does not implement organization governance and a private organization binding must never be written into a public repository. A lockfile is deferred until an external governance dependency requires reproducible binding.

## Consequences

Repositories remain portable and reviewable using their committed files alone. Authors must keep `.ai/` free of secrets and private operational data, and must not rely on hidden local or organization state for public contribution requirements.

This ADR does not define a governance manifest, schema, resolver, task envelope, or lockfile. Those require later accepted decisions.

## Alternatives Considered

Storing all agent state in `.ai/` was rejected because it risks committing credentials, private history, and runtime artifacts.

Requiring organization governance was rejected because it would make independent repositories incomplete and introduce hidden dependencies.

Using a repository lockfile now was rejected because no external governance dependency exists to bind.
