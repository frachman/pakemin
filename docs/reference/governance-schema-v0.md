# Governance Schema v0

- Status: Normative specification
- Contract version: 0
- Target release: v0.2.0 (unreleased)
- Implementation status: Not implemented

This contract is derived from [ADR-0013](../adr/0013-declarative-governance-schema.md). It defines committed YAML governance only; Markdown remains the format for context, decisions, explanations, and workflows.

## Normative Language

MUST and MUST NOT are mandatory. SHOULD and SHOULD NOT are recommended unless a documented reason justifies deviation. MAY is optional. A configuration error means Pakemin cannot produce a governance verdict and later exits with code `3`.

Examples illustrate this contract; requirements in this document are normative.

## Canonical Source Model

The required committed entry point is `.ai/pakemin.yaml`. It MUST be valid UTF-8 YAML containing exactly one document and `formatVersion: "0"`. It MUST use repository-relative references, be safe for repository visibility, and be sufficient to discover every repository governance source. It MUST NOT contain credentials, runtime state, private bindings, or machine-specific absolute paths.

Missing entry points, multiple documents, and unsupported format versions are configuration errors when governance verification is requested.

The only top-level keys are `formatVersion`, `includes`, `scopes`, `rules`, and `exceptions`. `formatVersion` is required; the collections default to empty when absent. Unknown keys, duplicate mapping keys, YAML tags, executable constructors, anchors, and aliases are configuration errors. Comments have no semantic effect. Implementations MUST preserve scalar types and MUST NOT coerce numeric or boolean values into identifiers.

```yaml
formatVersion: "0"
includes: []
scopes: []
rules: []
exceptions: []
```

### Includes

`includes` MAY list explicit repository-local fragment files relative to `.ai/`:

```yaml
formatVersion: "0"
includes:
  - governance/scopes.yaml
  - governance/rules.yaml
  - governance/exceptions.yaml
```

An include MUST be a unique explicit file path within `.ai/`; absolute paths, `..`, URLs, Git references, globs, and missing files are configuration errors. Fragments MUST NOT include other fragments or redeclare `formatVersion` or `includes`; they MAY contain only `scopes`, `rules`, and `exceptions`. Inline and included collections MAY be combined, but IDs are globally unique per category. Include order MUST NOT affect semantics. Every effective item retains its source file as provenance.

## Identifiers

Scope, rule, and exception IDs are case-sensitive strings matching:

```text
^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$
```

Examples: `repository`, `shared-ui`, `repository.source-change-requires-tests`, and `exception.docs-shared-ui-001`. IDs are unique within their category across all files. Whitespace normalization and inference from descriptions or filenames are forbidden. Duplicate IDs are configuration errors.

## Scopes

Every scope has only `id`, `parent`, and `paths`; unknown fields are configuration errors. Every manifest has exactly one root scope with ID `repository`. It MUST NOT have `parent`, MUST declare `paths: ["**"]`, and covers the repository root. Each non-root scope MUST have exactly one known `parent` and at least one `paths` pattern. Scope IDs are stable and unique; cycles and multiple inheritance are configuration errors.

```yaml
scopes:
  - id: repository
    paths: ["**"]
  - id: docs
    parent: repository
    paths: ["apps/docs/**"]
```

Paths are normalized repository-relative paths using `/`. A matching file inherits every ancestor scope. Effective scopes are ordered from `repository` to the deepest scope. If a path matches unrelated scopes, the manifest is ambiguous and invalid; declaration order never selects a winner. Directory patterns have no trailing `/`: `docs/**` matches files below `docs`, while `docs` matches only that literal file path. `**` matches every normalized nonempty repository file path, including root-level files.

## Path Patterns

Patterns are case-sensitive and evaluated against normalized repository-relative paths. `/` is the only separator. `*` matches zero or more non-`/` characters within one segment; `**` matches zero or more complete segments. Dotfiles match normally.

Only literal segments, `*`, and `**` are supported. `?`, character classes, braces, extglobs, leading `!`, absolute paths, backslashes, NUL, `.` segments, and `..` segments are invalid. Unsupported syntax is a configuration error, not a literal fallback. Symlink traversal outside the repository cannot create a valid governed path. Rules evaluate both normalized source and destination paths for a rename where relevant.

## Rules

Each rule requires `id`, `type`, and `scope`; `description` is optional and explanatory only. `scope` MUST name a known scope. Unknown fields are configuration errors unless this contract permits them for that type. All v0 rules are restrict-only: a child may add constraints but cannot replace a parent rule or reuse its ID.

```yaml
- id: repository.source-change-requires-tests
  type: changed-path-requires-changed-path
  scope: repository
  description: Source changes require corresponding test changes.
```

Schema v0 has exactly these types: `allowed-paths`, `forbidden-paths`, `changed-path-requires-changed-path`, and `changed-path-requires-review`. Unknown types are configuration errors.

### `allowed-paths`

```yaml
- id: docs.allowed-paths
  type: allowed-paths
  scope: docs
  paths: ["apps/docs/**"]
```

`paths` is a nonempty pattern list; no other type-specific fields are allowed. Every relevant changed path in the rule's effective scope chain MUST satisfy every applicable `allowed-paths` rule. This is intersection semantics: child authority can narrow, never widen. A relevant rename source or destination outside an allowed pattern violates the rule. A task envelope may impose additional allowed paths but cannot broaden this rule.

### `forbidden-paths`

```yaml
- id: repository.protect-production
  type: forbidden-paths
  scope: repository
  paths: ["infra/production/**"]
```

`paths` is a nonempty pattern list; no other type-specific fields are allowed. Any relevant changed path matching a forbidden pattern violates the rule unless a valid exception applies. Effective forbidden patterns accumulate by union. Rename source and destination are both relevant; deletion does not bypass the rule.

### `changed-path-requires-changed-path`

```yaml
- id: repository.source-change-requires-tests
  type: changed-path-requires-changed-path
  scope: repository
  when:
    changedPaths:
      include: ["src/**"]
  require:
    changedPaths:
      include: ["test/**", "**/*.test.js"]
```

Only `when` and `require` are allowed beyond common rule fields. `when.changedPaths.include` and `require.changedPaths.include` are nonempty pattern lists and have no other keys. When any relevant change matches `when`, at least one relevant changed path MUST match `require`; absence is a violation. Without a trigger, the rule remains resolved but is unevaluated and does not enter the per-rule evaluation set. Matching test paths are evidence only; they do not prove semantic test coverage.

### `changed-path-requires-review`

```yaml
- id: repository.ci-change-requires-review
  type: changed-path-requires-review
  scope: repository
  paths: [".github/workflows/**"]
```

`paths` is a nonempty pattern list; no other type-specific fields are allowed. Any relevant changed path matching it produces `indeterminate`; the final outcome is `requires-review` unless another rule is violated. Both sides of a rename are considered. The rule reports every matching path and does not infer, store, or validate approval.

## Restrict-Only Resolution

Machine-enforceable rules are collected root-to-leaf across the effective scope chain. `allowed-paths` narrow by requiring a path to satisfy every applicable rule; `forbidden-paths` accumulate by union; changed-path requirements and review rules accumulate. A child cannot remove a parent rule. Rule and scope declaration order does not affect semantics. Effective output is ordered by scope depth, then stable rule ID.

## Exceptions

An exception is an explicit, auditable relaxation for one target restriction:

```yaml
exceptions:
  - id: exception.shared-ui-button-001
    rule: repository.protect-shared-ui
    scope: shared-ui
    paths: ["packages/ui/Button.tsx"]
    reason: Approved docs navigation dependency update.
    approvedBy: maintainer
```

Each exception requires `id`, `rule`, `scope`, `paths`, `reason`, and `approvedBy`. `paths` is nonempty; `reason` and `approvedBy` are nonempty strings. Its rule and scope MUST exist, and its scope MUST be a descendant of the target rule's scope. Every exception path MUST be within its scope and may affect only the target rule's matching path; it cannot create unrelated permission. Exceptions apply only to `allowed-paths` and `forbidden-paths`; targeting another type is a configuration error. Unknown fields, duplicate IDs, unknown targets, unrelated scopes, or out-of-scope paths are configuration errors.

Exceptions are included in provenance and evidence and have no order-dependent effect. `approvedBy` is auditable repository metadata, not identity proof. Expiration is deferred because wall-clock evaluation would make identical committed inputs produce different outcomes. Runtime-only or hidden exceptions cannot change the contributor contract.

## Validation and Errors

Validation proceeds in this order:

1. Locate `.ai/pakemin.yaml`.
2. Parse safe YAML and require one document.
3. Validate top-level structure and version.
4. Load explicit local fragments.
5. Validate IDs and duplicates.
6. Validate scopes, parents, and cycles.
7. Validate path patterns.
8. Validate rules and scope references.
9. Validate exceptions and targets.
10. Validate ambiguous sibling-scope matches.

An implementation MAY report multiple errors, but ordering MUST be stable. Each error SHOULD include a stable reason code, source document, and field location. This document defines schema-validation requirements only, not Verification Contract error JSON.

## Complete Examples

### Minimal repository

```yaml
formatVersion: "0"
scopes:
  - id: repository
    paths: ["**"]
```

### Monorepo with all rule types and an exception

```yaml
formatVersion: "0"
scopes:
  - id: repository
    paths: ["**"]
  - id: docs
    parent: repository
    paths: ["apps/docs/**"]
  - id: shared-ui
    parent: repository
    paths: ["packages/ui/**"]
rules:
  - id: repository.protect-production
    type: forbidden-paths
    scope: repository
    paths: ["infra/production/**"]
  - id: repository.source-change-requires-tests
    type: changed-path-requires-changed-path
    scope: repository
    when: { changedPaths: { include: ["src/**"] } }
    require: { changedPaths: { include: ["test/**"] } }
  - id: repository.protect-shared-ui
    type: forbidden-paths
    scope: repository
    paths: ["packages/ui/**"]
  - id: repository.ci-change-requires-review
    type: changed-path-requires-review
    scope: repository
    paths: [".github/workflows/**"]
  - id: docs.allowed-paths
    type: allowed-paths
    scope: docs
    paths: ["apps/docs/**"]
exceptions:
  - id: exception.shared-ui-button-001
    rule: repository.protect-shared-ui
    scope: shared-ui
    paths: ["packages/ui/Button.tsx"]
    reason: Approved docs navigation dependency update.
    approvedBy: maintainer
```

### External fragment

```yaml
# .ai/pakemin.yaml
formatVersion: "0"
includes: ["governance/rules.yaml"]
scopes:
  - id: repository
    paths: ["**"]
```

```yaml
# .ai/governance/rules.yaml
rules:
  - id: repository.ci-change-requires-review
    type: changed-path-requires-review
    scope: repository
    paths: [".github/workflows/**"]
```

### Invalid configurations

```yaml
rules:
  - id: repository.duplicate
    type: forbidden-paths
    scope: repository
    paths: ["a/**"]
  - id: repository.duplicate
    type: forbidden-paths
    scope: repository
    paths: ["b/**"]
```

Expected: configuration error `duplicate-rule-id`.

```yaml
scopes:
  - id: repository
    paths: ["**"]
  - id: a
    parent: b
    paths: ["a/**"]
  - id: b
    parent: a
    paths: ["b/**"]
```

Expected: configuration error `scope-cycle`.

```yaml
scopes:
  - id: repository
    paths: ["**"]
  - id: app
    parent: repository
    paths: ["apps/**"]
  - id: docs
    parent: repository
    paths: ["apps/docs/**"]
```

Expected: configuration error `ambiguous-sibling-scope` because `apps/docs/index.md` matches unrelated scopes.

```yaml
paths: ["../private/**"]
```

Expected: configuration error `invalid-path-pattern`; `?` and leading `!` are likewise unsupported.

## Conformance

An implementation conforms only if it accepts every valid normative example, rejects every invalid normative example, resolves scopes and rules deterministically, preserves source provenance, rejects unknown rule types and fields, never evaluates natural language to determine governance, reads no governance outside committed repository sources, requires no organization governance, executes no configuration content, and never silently ignores invalid enforceable configuration.
