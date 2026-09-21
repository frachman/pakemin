# Governance Schema v0

- Status: Normative specification
- Contract version: 0
- Target release: v0.2.0 (unreleased)
- Implementation status: Not implemented

This contract is derived from [ADR-0013](../adr/0013-declarative-governance-schema.md). It defines repository-local YAML governance; Markdown remains the format for context, decisions, explanations, and workflows.

## Normative Language

MUST and MUST NOT are mandatory. SHOULD and SHOULD NOT are recommended unless a documented reason justifies deviation. MAY is optional. A configuration error means Pakemin cannot produce a governance verdict and later exits with code `3`.

Examples illustrate this contract; requirements in this document are normative.

## Canonical Source Model

The required entry point is `.ai/pakemin.yaml`. It MUST be valid UTF-8 YAML containing exactly one document and `formatVersion: "0"`. It MUST use repository-relative references, be safe for repository visibility, and be sufficient to discover every repository governance source. It MUST NOT contain credentials, runtime state, private bindings, or machine-specific absolute paths.

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

Resolve an include relative to the physical `.ai/` directory, then normalize and canonicalize its target. The canonical target MUST remain within canonical `.ai/` and be a regular file. A symlink escaping `.ai/`, a symlink cycle, a directory, or two entries resolving to the same canonical file is invalid. Absolute paths, `..`, URLs, Git references, globs, and missing files are configuration errors. Fragments MUST NOT include other fragments or redeclare `formatVersion` or `includes`; they MAY contain only `scopes`, `rules`, and `exceptions`. Inline and included collections MAY be combined, but IDs are globally unique per category. Include order MUST NOT affect semantics. Every effective item retains its source file as provenance.

### Repository-Local Eligibility

A valid governance source MUST be repository-local and under `.ai/`. The intended contributor contract is version-controlled, but local authoring tools MAY validate new or modified governance files before commit. CI and reproducible revision checks evaluate files present in the checked-out revision. Repository-level verification MUST NOT load hidden governance from outside the repository.

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

Paths are normalized repository-relative paths using `/`. A matching file inherits every ancestor scope. Effective scopes are ordered from `repository` to the deepest scope. During resolution, if an actual path matches unrelated scopes, resolution fails with `ambiguous-scope-match`; declaration order, lexical order, and apparent pattern specificity never select a winner. A validator MAY report a statically provable unrelated overlap early, but need not solve general glob intersection.

## Path Normalization

Every governance path and change-collector path MUST be a nonempty UTF-8 string relative to repository root. It MUST use `/`, preserve case, and contain no NUL, backslash, leading or trailing `/`, empty segment, `.` segment, or `..` segment. Configuration values not already in this canonical form are invalid rather than silently normalized. A CLI MAY display a platform-native path separately, but it is not governance input. Governance evaluates file paths, not directory nodes; directories are represented only by files beneath them.

## Path Patterns

Patterns are case-sensitive and evaluated against complete canonical file paths. Their only tokens are literal characters, `*` within one segment, `**` as a complete segment, and `/` as a segment separator. `*` matches zero or more non-`/` characters in exactly one segment. `**` matches zero or more complete path segments. Dot-prefixed segments have no special exclusion.

To match, split both pattern and path on `/`. Recursively compare their next segments: a literal-or-`*` pattern segment matches one path segment; a `**` matches every possible count of consecutive path segments, including zero; matching succeeds only when both sequences are exhausted. `**` is invalid when it is not a complete segment. `?`, character classes, braces, extglobs, escapes, leading `!`, consecutive `/`, leading or trailing `/`, `.` segments, and `..` segments are invalid. Unsupported syntax is a configuration error, not a literal fallback. Symlink traversal outside the repository cannot create a valid governed path. Rules evaluate both normalized source and destination paths for a rename where relevant.

| Pattern | Path | Match |
| --- | --- | --- |
| `**` | `README.md` | yes |
| `**` | `apps/docs/index.md` | yes |
| `*.md` | `README.md` | yes |
| `*.md` | `docs/README.md` | no |
| `docs/**` | `docs/index.md` | yes |
| `docs/**` | `docs/guides/start.md` | yes |
| `**/*.test.js` | `app.test.js` | yes |
| `**/*.test.js` | `test/app.test.js` | yes |
| `apps/*/config.yaml` | `apps/docs/config.yaml` | yes |
| `apps/*/config.yaml` | `apps/docs/internal/config.yaml` | no |

`docs/**` therefore matches files beneath `docs/`, such as `docs/index.md`; there is no separate directory-path result for `docs` itself.

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

Resolved governance MAY contain rules not triggered by a change set. Only triggered or otherwise applicable rules enter the per-rule evaluation set: an untriggered `changed-path-requires-changed-path` rule remains resolved but is omitted from evaluations; `allowed-paths` and `forbidden-paths` are applicable only for relevant changed paths in their effective scope chain; and `changed-path-requires-review` enters evaluation only when a relevant path matches. This does not add a fourth evaluation state.

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

Each exception requires `id`, `rule`, `scope`, `paths`, `reason`, and `approvedBy`. `paths` is a nonempty list of exact canonical file paths; wildcards are invalid. `reason` and `approvedBy` are nonempty strings. Its rule and scope MUST exist, and its scope MUST be a descendant of the target rule's scope. An exception path MUST match its declared scope when it is resolved; a path outside that scope is `exception-outside-scope` and never grants permission. An exception applies only to its target rule and listed exact path, and cannot create unrelated permission. Exceptions apply only to `allowed-paths` and `forbidden-paths`; targeting another type is `unsupported-exception-target`.

For `allowed-paths`, an exception waives only its target rule for the exact path; every other applicable allowed rule still applies. For `forbidden-paths`, it waives only its target forbidden rule for the exact path; every other applicable forbidden rule remains active. Rename source and destination paths are evaluated independently. Unknown fields, duplicate IDs, unknown targets, unrelated scopes, wildcard paths, or invalid shapes are configuration errors.

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
10. During path resolution, reject an actual unrelated sibling-scope match.

An implementation MAY report multiple errors, but ordering MUST be stable. Error output sorts by canonical source path, then field location, then reason code. Include loading may follow manifest order, but semantic merging is order-independent. Scope chains sort root-to-leaf; resolved rules by scope depth then rule ID; exceptions by exception ID; and matched paths bytewise by canonical path. This document defines schema-validation requirements only, not Verification Contract error JSON.

## Schema Error Catalog

Every configuration error reports the stable code below, its source document, and its field location; a resolution-time error additionally reports the canonical path being resolved.

| Code | Trigger | Timing |
| --- | --- | --- |
| `missing-manifest` | `.ai/pakemin.yaml` is absent. | load |
| `invalid-yaml` | YAML cannot be safely parsed as UTF-8. | load |
| `multiple-yaml-documents` | A source has more than one YAML document. | load |
| `unsupported-format-version` | `formatVersion` is missing or not `"0"`. | load |
| `unknown-top-level-key` | A source has an unrecognized top-level key. | load |
| `duplicate-mapping-key` | A YAML mapping repeats a key. | load |
| `unsupported-yaml-feature` | Tags, constructors, anchors, or aliases are used. | load |
| `invalid-include-path` | An include is malformed, absolute, traverses, or is a glob/remote reference. | load |
| `include-outside-ai` | An include canonicalizes outside `.ai/`. | load |
| `include-not-file` | An include resolves to a directory or non-regular file. | load |
| `include-cycle` | Include resolution encounters a symlink cycle. | load |
| `duplicate-include` | Two entries resolve to one canonical file. | load |
| `missing-include` | An include target does not exist. | load |
| `invalid-id` | A scope, rule, or exception ID violates the grammar. | load |
| `duplicate-scope-id` | Scope IDs repeat across sources. | load |
| `duplicate-rule-id` | Rule IDs repeat across sources. | load |
| `duplicate-exception-id` | Exception IDs repeat across sources. | load |
| `missing-repository-scope` | Exactly one `repository` root scope is absent. | load |
| `invalid-repository-scope` | The root has a parent or does not declare `["**"]`. | load |
| `unknown-parent-scope` | A scope parent is absent. | load |
| `scope-cycle` | Parent links form a cycle. | load |
| `ambiguous-scope-match` | A resolved path matches unrelated scopes. | resolution |
| `invalid-path-pattern` | A pattern or governed path violates normalization or token rules. | load |
| `unknown-rule-type` | A rule type is not one of the four v0 types. | load |
| `unknown-rule-scope` | A rule names an absent scope. | load |
| `invalid-rule-shape` | A rule lacks required fields or has forbidden fields/types. | load |
| `unknown-exception-rule` | An exception names an absent rule. | load |
| `unknown-exception-scope` | An exception names an absent scope. | load |
| `unsupported-exception-target` | An exception targets a rule type other than allowed or forbidden paths. | load |
| `invalid-exception-path` | An exception path is wildcarded or not canonical. | load |
| `exception-outside-scope` | A resolved exception path does not match its scope. | resolution |
| `invalid-exception-shape` | An exception lacks required fields or has forbidden fields/types. | load |

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

When resolving `apps/docs/index.md`, both sibling scopes match. Expected: configuration error `ambiguous-scope-match`.

```yaml
paths: ["../private/**"]
```

Expected: configuration error `invalid-path-pattern`; `?` and leading `!` are likewise unsupported.

### Exception boundaries

```yaml
exceptions:
  - id: exception.invalid-wildcard
    rule: repository.protect-shared-ui
    scope: shared-ui
    paths: ["packages/ui/*.tsx"]
    reason: Invalid wildcard example.
    approvedBy: maintainer
```

Expected: configuration error `invalid-exception-path`.

```yaml
exceptions:
  - id: exception.invalid-review-target
    rule: repository.ci-change-requires-review
    scope: repository
    paths: [".github/workflows/ci.yml"]
    reason: Invalid target example.
    approvedBy: maintainer
```

Expected: configuration error `unsupported-exception-target`.

```text
Rules: repository.protect-shared-ui and repository.protect-button both forbid packages/ui/Button.tsx.
Exception: targets only repository.protect-shared-ui for packages/ui/Button.tsx.
Changed: packages/ui/Button.tsx.
Result: repository.protect-button still applies and violates.
```

```text
Exception: targets repository.protect-shared-ui only for packages/ui/Button.tsx.
Rename: packages/ui/LegacyButton.tsx -> packages/ui/Button.tsx.
Result: destination is excepted for that rule; source remains independently evaluated and violates if forbidden.
```

## Conformance

An implementation conforms only if it accepts every valid normative example, rejects every invalid normative example, resolves scopes and rules deterministically, preserves source provenance, rejects unknown rule types and fields, never evaluates natural language to determine governance, loads governance only from repository-local sources under `.ai/`, supports local pre-commit authoring and checked-out-revision CI, requires no organization governance, executes no configuration content, and never silently ignores invalid enforceable configuration.
