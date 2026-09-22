# Verification Contract v0

- Status: Normative specification
- Contract version: 0
- Governance schema version: 0
- Target release: v0.2.0 (unreleased)
- Implementation status: The pure repository-level evaluation engine is implemented as an internal module (comparison and change-set validation, resolution integration, rule evaluation, exception application, and evidence/report construction). Git collection, the CLI command, and task-envelope work remain unimplemented.

This is the provider-neutral post-flight contract for Verifiable Changes. It is derived from [ADR-0014](../adr/0014-least-change-verification.md) and [Governance Schema v0](../reference/governance-schema-v0.md). It is not an agent runtime, approval system, static-analysis engine, or LLM judgment layer.

## Normative Language and Mode

MUST and MUST NOT are mandatory. SHOULD and SHOULD NOT are recommended unless a documented reason justifies deviation. MAY is optional.

Contract v0 supports repository-level verification only. Every governance report MUST contain `"verificationMode": "repository"`. A repository-mode `pass` means the observed change set satisfies applicable repository governance; it does not mean a change stayed within authority declared for a task. Absence of a task envelope is not a failure and does not disable repository checks. A v0 report MUST NOT include `taskAuthority`, an equivalent claim, or a provisional task-envelope shape.

## Normalized Inputs

Verification is a pure function of a successfully loaded and resolved Governance Schema v0 configuration, a normalized comparison descriptor, an ordered normalized change set, and effective scopes, rules, exceptions, and provenance resolved for each change-side path. Identical normalized inputs MUST produce identical evaluations, evidence, ordering, outcome, and process exit code.

### Comparison

```json
{"source":"git","baseline":"<base>","target":"<target>","reproducible":true}
```

`source` MUST be `git`; `baseline` and `target` MUST be nonempty identifiers. For reproducible CI, they MUST identify resolved immutable Git object IDs. A local integration MAY identify an explicit working-tree target, but MUST set `reproducible` to `false` and MUST NOT present that report as revision-reproducible. CI MUST NOT silently infer or substitute an unverifiable baseline. This contract does not prescribe Git commands, merge-base policy, CLI flags, or local defaults.

### Changes

Only these change kinds are supported:

| Kind | Required fields |
| --- | --- |
| `added` | `path` |
| `modified` | `path` |
| `deleted` | `path` |
| `renamed` | `oldPath`, `newPath` |

Every path MUST satisfy Governance Schema v0 canonical path rules. A rename creates independently governed sides: `oldPath` with role `source` and `newPath` with role `destination`. Other kinds create one side with role `path`. Deletion remains governed. Copies, unmerged entries, submodule interpretation, similarity thresholds, content, line counts, and semantic diffs are outside v0. A collector MUST normalize a source to these kinds without losing path facts or stop with a runtime error; it MUST NOT silently omit an unsupported change. A supported kind with missing or extra fields, a noncanonical path, identical rename source and destination, or a duplicate normalized entry is `invalid-change-set`. Duplicate identity is `(kind, path)` for non-renames and `(kind, oldPath, newPath)` for renames; verifier input MUST NOT be silently deduplicated.

Changes sort by first canonical path bytewise (`path`, or `oldPath` for a rename), then by kind in this order: `added`, `modified`, `deleted`, `renamed`, then by `newPath` bytewise. Every path array sorts bytewise by path, then role in this order: `path`, `source`, `destination`.

## Resolution and Applicability

Verification has three stages: Loaded (configuration is valid), Resolved (effective scopes, rules, and exceptions are determined for actual change-side paths), and Evaluated (a resolved rule is triggered or otherwise applicable and receives a state). An untriggered rule is omitted from `evaluations`; it is not `satisfied`, `skipped`, or `not-applicable`.

If an actual path resolves to `ambiguous-scope-match` or `exception-outside-scope`, verification stops with configuration exit `3`. No governance outcome is emitted from partially resolved input.

At most one evaluation exists per stable rule ID; it aggregates every relevant path fact. A rule is relevant when its scope appears in a change-side path's effective root-to-leaf scope chain.

`affectedPaths` is exact and deduplicated by `(path, role, changeKind)`: `allowed-paths` contains every change-side path relevant to its scope; `forbidden-paths` contains every relevant path matching a forbidden pattern, including exact paths waived by an exception; `changed-path-requires-changed-path` contains the union of triggering and matching required paths; and `changed-path-requires-review` contains every matching review path. A satisfied forbidden rule with no match has `affectedPaths: []`.

## Rule Evaluation

Each evaluation state is exactly `satisfied`, `violated`, or `indeterminate`.

### `allowed-paths`

Evaluate when at least one change-side path is relevant to the scope.

- `satisfied`: every relevant path matches at least one rule pattern or has an applicable exact-file exception targeting this rule.
- `violated`: one or more relevant paths neither match nor have that exception.

Report every nonmatching path. An exception waives only this rule for its exact path; other allowed rules remain independent.

### `forbidden-paths`

Evaluate when at least one change-side path is relevant to the scope.

- `satisfied`: no relevant path matches, or every match has an applicable exact-file exception targeting this rule.
- `violated`: one or more relevant paths match and are not excepted for this rule.

Report every unexcepted match. An excepted match remains provenance evidence.

### `changed-path-requires-changed-path`

Evaluate only when one or more relevant change-side paths match `when.changedPaths.include`.

- `satisfied`: one or more relevant change-side paths match `require.changedPaths.include`.
- `violated`: the rule is triggered and no relevant change-side path matches a required pattern.

Report all triggers and all matching required paths. This does not claim semantic coverage or a source-to-test correspondence.

### `changed-path-requires-review`

Evaluate only when one or more relevant paths match the rule's patterns. Its state is always `indeterminate`. It causes `requires-review` unless another rule is violated. Report every match and the repository-authored description when available; Pakemin MUST NOT infer approval, reviewer identity, or approval completion.

## Outcome and Exit Codes

Aggregate in this order:

1. Any `violated` evaluation produces `fail` and exit `1`.
2. Otherwise, any `indeterminate` evaluation produces `requires-review` and exit `2`.
3. Otherwise, produce `pass` and exit `0`.

An empty evaluation set after successful resolution is `pass`; the report MUST explicitly show zero evaluations. `fail` dominates `requires-review`, but every violation and review requirement remains in the report.

Configuration errors exit `3`; verifier or runtime errors exit `4`. Neither is a governance outcome.

## Governance Report

For exits `0`, `1`, and `2`, the report MUST contain exactly these top-level fields:

```json
{
  "contractVersion": "0",
  "governanceSchemaVersion": "0",
  "verificationMode": "repository",
  "outcome": "pass",
  "comparison": {"source":"git","baseline":"<base>","target":"<target>","reproducible":true},
  "changes": [],
  "summary": {"changes":0,"evaluations":0,"satisfied":0,"violated":0,"indeterminate":0},
  "evaluations": []
}
```

`contractVersion` and `governanceSchemaVersion` are strings with value `"0"`; `outcome` is `pass`, `fail`, or `requires-review`. `changes` contains normalized, ordered entries with exactly `kind` and `path` for non-renames, or exactly `kind`, `oldPath`, and `newPath` for renames. `summary` contains exactly the five documented counts. `summary.changes` equals `changes.length`; `summary.evaluations` equals `evaluations.length`; each state count equals the number of evaluations with that state. Comparison objects contain exactly `source`, `baseline`, `target`, and `reproducible`; evaluation objects contain exactly the documented fields; source objects contain exactly `layer`, `document`, and `field`; and affected-path objects contain exactly `path`, `role`, and `changeKind`. Reports MUST NOT contain authoritative `exitCode`, extensions, an unscoped top-level evidence list, or natural-language rule identifiers.

Evaluations sort by effective scope depth then rule ID. Each has these fields:

```json
{
  "ruleId":"repository.source-change-requires-tests",
  "ruleType":"changed-path-requires-changed-path",
  "state":"satisfied",
  "reasonCode":"required-changed-path-present",
  "scopeId":"repository",
  "source":{"layer":"repository","document":".ai/pakemin.yaml","field":"/rules/0"},
  "affectedPaths":[{"path":"src/app.js","role":"path","changeKind":"modified"}],
  "evidence":[],
  "explanation":"Required changed path evidence is present."
}
```

`source.layer` is exactly `repository`; `document` is a canonical repository-relative source file and `field` is an RFC 6901 JSON Pointer relative to that document. Every affected path has canonical `path`, role `path`, `source`, or `destination`, and required `changeKind`. `explanation` is deterministic text derived from state, reason code, paths, and evidence; it adds no semantics.

Evidence is rule-scoped. It has no extension fields. Allowed kinds are `allowed-match`, `allowed-miss`, `forbidden-match`, `forbidden-clear`, `required-trigger`, `required-match`, `required-missing`, `review-match`, and `exception-applied`.

| Evidence kind | Required fields | Forbidden fields |
| --- | --- | --- |
| `allowed-match`, `forbidden-match`, `required-trigger`, `required-match`, `review-match` | `kind`, `path`, `role`, `changeKind`, `pattern` | `patterns`, `exceptionId` |
| `allowed-miss`, `forbidden-clear` | `kind`, `path`, `role`, `changeKind` | `pattern`, `patterns`, `exceptionId` |
| `exception-applied` | `kind`, `path`, `role`, `changeKind`, `exceptionId` | `patterns`; `pattern` unless explicitly tied to a matched target-rule pattern |
| `required-missing` | `kind`, `patterns` | `path`, `role`, `changeKind`, `pattern`, `exceptionId` |

Evidence emits one item for every matching `(path fact, pattern)` pair for allowed matches, forbidden matches, required triggers, required matches, and review matches. It emits one miss or clear item for every relevant path fact with no corresponding pattern match, exactly one `required-missing` with sorted required patterns when none match, and one `exception-applied` for every `(path fact, exception ID)` waiver. Patterns are literal canonical governance patterns, never internal translations. Deduplicate by the full structured tuple, then sort by kind, path, role, changeKind, pattern, and exception ID bytewise with missing values first; `patterns` sort bytewise.

## Rule Reason Codes

| Rule type | State | Reason code |
| --- | --- | --- |
| `allowed-paths` | `satisfied` | `allowed-paths-satisfied` |
| `allowed-paths` | `violated` | `path-not-allowed` |
| `forbidden-paths` | `satisfied` | `forbidden-paths-clear` |
| `forbidden-paths` | `violated` | `forbidden-path-matched` |
| `changed-path-requires-changed-path` | `satisfied` | `required-changed-path-present` |
| `changed-path-requires-changed-path` | `violated` | `required-changed-path-missing` |
| `changed-path-requires-review` | `indeterminate` | `human-review-required` |

Exceptions affect evidence only. If every otherwise failing path is excepted, use the normal satisfied reason code plus `exception-applied` evidence.

## Process Diagnostics

Configuration and runtime errors use this separate envelope and MUST NOT include `outcome`:

```json
{"contractVersion":"0","errorKind":"configuration","exitCode":3,"errors":[]}
```

For configuration errors, `errorKind` is `configuration`, `exitCode` is `3`, and each error is `{"code":"<schema-code>","source":{"document":".ai/pakemin.yaml","field":"<location>"}}`; resolution-time errors additionally contain canonical `path`. Ordering follows Governance Schema v0.

For runtime errors, `errorKind` is `runtime`, `exitCode` is `4`, and each error is `{"code":"<runtime-code>","message":"<deterministic message>"}`. The closed v0 runtime catalog is `invalid-comparison`, `change-collection-failed`, `unsupported-change-kind`, `invalid-change-set`, and `internal-error`. Unsupported kinds use `unsupported-change-kind`; malformed supported entries and duplicates use `invalid-change-set`; failures obtaining Git changes use `change-collection-failed`; missing or unverifiable comparison descriptors use `invalid-comparison`. Optional low-level diagnostics do not change classification. No partial governance report is emitted after configuration loading, resolution, comparison validation, or change collection fails.

## Normative Examples

### Empty change set

`changes: []` produces summary counts of zero, `evaluations: []`, outcome `pass`, and process exit `0`.

### Source and required test change

```json
{
  "contractVersion":"0",
  "governanceSchemaVersion":"0",
  "verificationMode":"repository",
  "outcome":"pass",
  "comparison":{"source":"git","baseline":"a1","target":"b2","reproducible":true},
  "changes":[{"kind":"modified","path":"src/app.js"},{"kind":"modified","path":"test/app.test.js"}],
  "summary":{"changes":2,"evaluations":1,"satisfied":1,"violated":0,"indeterminate":0},
  "evaluations":[{
    "ruleId":"repository.source-change-requires-tests",
    "ruleType":"changed-path-requires-changed-path",
    "state":"satisfied",
    "reasonCode":"required-changed-path-present",
    "scopeId":"repository",
    "source":{"layer":"repository","document":".ai/pakemin.yaml","field":"/rules/0"},
    "affectedPaths":[{"path":"src/app.js","role":"path","changeKind":"modified"},{"path":"test/app.test.js","role":"path","changeKind":"modified"}],
    "evidence":[{"kind":"required-match","path":"test/app.test.js","role":"path","changeKind":"modified","pattern":"test/**"},{"kind":"required-trigger","path":"src/app.js","role":"path","changeKind":"modified","pattern":"src/**"}],
    "explanation":"Required changed path evidence is present."
  }]
}
```

Expected exit: `0`.

### Other required fixtures

| Facts | Evaluation and result |
| --- | --- |
| `src/app.js` changes without a required test path. | `repository.source-change-requires-tests` is `violated` with `required-changed-path-missing`; `fail`, exit `1`. |
| `infra/production/app.yaml` changes under a matching forbidden rule. | `forbidden-paths` is `violated` with `forbidden-path-matched`; `fail`, exit `1`. |
| An exact exception waives `repository.protect-shared-ui`, but another forbidden rule matches `packages/ui/Button.tsx`. | The target rule is satisfied with `exception-applied`; the other rule is violated; `fail`, exit `1`. |
| `.github/workflows/ci.yml` changes under a review rule. | `indeterminate` with `human-review-required`; `requires-review`, exit `2`. |
| A forbidden path and review-required workflow both change. | The report retains violated and indeterminate evaluations; `fail`, exit `1`. |
| `packages/ui/Legacy.tsx` is renamed to an excepted `packages/ui/Button.tsx`. | Source and destination are separate affected paths; the destination may be excepted while the source remains independently evaluated. |
| Resolving `apps/docs/index.md` matches unrelated scopes. | Configuration diagnostic `ambiguous-scope-match`, exit `3`, no `outcome`. |
| Comparison lacks a valid baseline or target. | Runtime diagnostic `invalid-comparison`, exit `4`, no `outcome`. |

### Errata fixtures

| Facts | Required result |
| --- | --- |
| One allowed path matches `apps/**` and `apps/docs/**`. | Two `allowed-match` evidence items, one per literal pattern. |
| One forbidden path matches and has an exact exception. | Both `forbidden-match` and `exception-applied` evidence for its path fact. |
| A relevant forbidden rule has no match. | `satisfied`, `forbidden-paths-clear`, `affectedPaths: []`, and one `forbidden-clear` evidence item per relevant path. |
| Rename `src/old.js` to `src/new.js`. | Distinct affected paths with roles `source` and `destination`, each with `changeKind: "renamed"`. |
| Two identical normalized `modified` entries for `src/app.js`. | Runtime diagnostic `invalid-change-set`, exit `4`, no `outcome`. |
| A `modified` entry contains `oldPath` or a noncanonical `path`. | Runtime diagnostic `invalid-change-set`, exit `4`, no partial report. |

## Conformance

A conforming implementation MUST accept Governance Schema v0 inputs and no undocumented rule types; preserve its scope, rule, exception, and path semantics; emit identical normalized evaluations for identical inputs; never call an LLM or infer approval; never treat process errors as governance failures; never claim task-authority compliance in repository mode; preserve rule-scoped evidence and source provenance; retain violations and review requirements when fail dominates; produce specified stable array ordering; pass all normative fixtures; and remain usable without private organization governance.

Byte-for-byte JSON serialization, whitespace, and object-key order are not required; determinism applies to semantic content and specified arrays. Task-aware verification remains architecturally accepted but deferred until a task-envelope contract exists. `pakemin check` is not implemented and is not authorized by this document.
