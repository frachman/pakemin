# ADR-0013: Declarative Governance Schema

- Status: Proposed
- Date: 2026-09-21
- Decision owners: Farandy Rachman

## Context

Pakemin needs a deterministic, human-reviewable way to express machine-enforceable scope and governance rules. Markdown remains appropriate for context, decisions, explanations, and workflows, but natural-language interpretation alone cannot produce provider-independent enforcement results.

## Decision

Pakemin uses Markdown for human-readable context, decisions, explanations, and workflows. It uses YAML only for a machine-enforceable manifest, scopes, authority, and typed rules.

The proposed canonical manifest is `.ai/pakemin.yaml`. It is version-controlled, declares a format version independent from the npm package version, and provides deterministic governance discovery. It may reference additional repository-local governance files. It must not contain credentials, runtime state, private organization bindings, or machine-specific absolute paths. Validation must be possible using committed repository files alone.

Scopes are declared centrally and selected by repository-relative filesystem paths with normalized `/` separators. Scope IDs are stable and unique. A scope has no more than one parent; unknown parents, inheritance cycles, and multiple inheritance are invalid. Matching and precedence must be deterministic; exact matching semantics belong in the normative schema reference.

```yaml
scopes:
  - id: repository
    paths: ["**"]
  - id: docs
    parent: repository
    paths: ["apps/docs/**"]
```

Schema v0 recognizes `merge`, `override`, and `restrict-only` behaviors. `merge` combines additive information; `override` replaces an explicitly replaceable value; `restrict-only` preserves or narrows parent authority. Governance and security constraints use `restrict-only` by default. Any exception that relaxes a parent restriction must be explicit, narrow, attached to a resolvable stable rule ID, attributable, reasoned, and auditable.

Every enforceable rule has a stable, unique ID for provenance, evidence association, exception targeting, deterministic reporting, and future migration. Duplicate rule IDs are invalid configuration.

Examples include `repository.source-change-requires-tests`, `repository.ci-change-requires-review`, and `docs.allowed-paths`.

Schema v0 proposes exactly four deterministic rule types:

1. `allowed-paths` constrains changes to declared paths.
2. `forbidden-paths` rejects changes to protected paths.
3. `changed-path-requires-changed-path` requires evidence in another path set when a trigger path changes.
4. `changed-path-requires-review` requires human review for protected or sensitive paths.

Unknown rule types are invalid configuration and must not be ignored. Natural-language descriptions may explain a rule but cannot determine its outcome. Identical committed inputs must resolve to identical governance; every effective rule retains its source document, source layer, scope, and stable ID, and generated output uses stable ordering.

Pakemin must fail closed for ambiguous enforceable configuration. Missing or unsupported format versions, duplicate scope or rule IDs, unknown parents, cycles, unknown rule types, unknown rule scopes, invalid path patterns, and exceptions targeting unknown rules are configuration errors. They are not governance violations and must later map to the Verification Contract's invalid-configuration process outcome.

## Consequences

Pakemin will no longer be purely Markdown-only for enforceable governance. YAML parsing and validation introduce implementation complexity, while a narrow typed rule set trades flexibility for determinism and explainability. Centralized scopes make monorepos first-class without requiring a separate `.ai/` directory in every package. Future format evolution requires explicit version handling.

This decision enables later normative schema work, but does not implement a manifest loader, resolver, task envelope, or `pakemin check`.

## Non-Decisions

This ADR does not define complete field-level YAML syntax, parser or library selection, task-envelope schema, Git base or head selection, verification aggregation, CLI options, organization governance, remote sources, lockfile design, plugin or custom-evaluator APIs, or production implementation.

## Alternatives Considered

Markdown-only enforcement was rejected as the sole representation because natural-language interpretation cannot guarantee deterministic results.

JSON was considered for strict parsing and dependency-free compatibility. YAML is proposed as the single v0 canonical format because it is more practical to author and review for repository governance; Pakemin will not support both formats in v0.

Distributed `.ai/` directories for each monorepo package were rejected because they duplicate infrastructure and complicate discovery. Centralized scopes remain the source of truth.

General-purpose policy expressions, executable user-defined evaluators, shell commands, remote evaluators, plugin hooks, LLM judgments, organization rule packages, and deep architecture or dependency analysis were rejected for v0 because they reduce predictability, security, or implementation focus.
