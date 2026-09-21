# ADR-0014: Least Change Verification

- Status: Proposed
- Date: 2026-09-21
- Decision owners: Farandy Rachman

## Context

Pakemin needs a deterministic way to compare declared authority and repository governance with actual changes. It must provide a useful CI gate without becoming an agent runtime or making a provider-dependent judgment.

## Decision

Least Change means a change remains within the minimum declared scope and authority necessary for a task and satisfies all applicable repository governance rules. It does not mean minimizing changed lines, preferring the smallest implementation regardless of correctness, using an LLM to judge elegance, performing semantic or dependency analysis, or preventing every cross-scope change. Cross-scope work may be valid when explicitly declared, allowed, evidenced, or reviewed.

Pakemin has two verification modes. Repository-level verification uses committed repository governance and actual repository changes. It evaluates forbidden paths, review-required paths, required changed-path evidence, repository and nested-scope rules, and configuration integrity. Without a task declaration it must not claim task-authority compliance.

Task-aware verification additionally uses a task envelope containing declared authority. It can evaluate allowed task scopes and paths, changes outside declared task authority, task-bound review requirements, and whether the envelope matches its repository baseline. A missing envelope does not disable repository-level checks, but task-scope compliance cannot be claimed without one.

Task authority is the narrow permission for one unit of work. It may identify a stable task ID, allowed scopes and paths, forbidden paths, review-required paths, applicable effective rule IDs, repository baseline revision, and governance contract or format versions. It is not a prompt and cannot grant permissions beyond repository governance; it may preserve or narrow inherited authority but cannot silently broaden it.

`pakemin context` may later produce a deterministic task envelope recording the effective authority before a change. Conceptually, the envelope binds task identity, repository identity or root, baseline revision, declared authority, effective governance identifiers, provenance or integrity references, and contract versions. It supports post-change comparison but does not claim cryptographic attestation or signer identity. Local or runtime copies belong under `~/.pakemin/` as defined by ADR-0012; CI transport is deferred.

The actual change set is normalized repository-relative Git changes evaluated against a declared comparison baseline. It supports added, modified, deleted, and renamed files with stable path ordering; both source and destination may matter for a rename. Reports must identify the comparison source sufficiently to reproduce the result. Exact Git commands, similarity thresholds, local working-tree defaults, and CLI flags are deferred, and CI must not silently choose an unverifiable baseline.

Each applicable rule evaluates to exactly one of `satisfied`, `violated`, or `indeterminate`. A satisfied rule has required deterministic evidence and no relevant violation; a violated rule has deterministic evidence of a break; an indeterminate rule cannot reach a deterministic decision or explicitly requires human judgment. Model reasoning cannot convert `indeterminate` to `satisfied`.

Final governance outcomes are exactly `pass`, `fail`, and `requires-review`:

```text
Any violated rule                 -> fail
No violation and indeterminate   -> requires-review
All applicable rules satisfied   -> pass
```

`fail` dominates `requires-review`. Review is not a pass; a future diagnostic warning is not a fourth governance outcome. A report may include all violations and review requirements even when its final outcome is `fail`.

Governance outcomes are separate from verifier execution outcomes:

| Exit code | Meaning |
| ---: | --- |
| `0` | Governance outcome `pass` |
| `1` | Governance outcome `fail` |
| `2` | Governance outcome `requires-review` |
| `3` | Invalid or unsupported Pakemin configuration |
| `4` | Verifier, runtime, or internal error |

Invalid configuration is never a governance violation. An internal error is never success or a human-review requirement.

Every applicable rule evaluation retains its stable rule ID, type, evaluation state, source document, source layer, applicable scope, affected paths, structured evidence, stable reason code, and human-readable explanation. Evidence is tied to the rule it supports or contradicts; a free-form top-level evidence list is insufficient. Future contracts may add content or source hashes, but hashing and canonicalization are not decided here.

A review-required rule is `indeterminate` and therefore produces `requires-review` unless another rule is violated. Pakemin reports the rule, paths, and reason, but does not impersonate or infer approval or turn external approval into `pass`. Approval storage, identity verification, and GitHub integration are deferred.

Enforcement does not call an LLM. Executor identity does not affect the verdict: identical normalized repository facts, governance, and task authority produce identical outcomes, evaluation ordering, evidence, and provenance whether the change was made by Codex, Claude Code, another agent, or a human.

Pakemin fails closed only for the governance surface it claims to evaluate. Invalid manifests and unknown rule types are configuration errors; missing required test-path evidence is a governance failure; a review-required workflow change requires review; no task envelope permits repository checks but not a task-scope claim; unsupported semantic questions must not be guessed or silently passed.

## Examples

```text
Changed: src/app.js, test/app.test.js
Rule: source changes require test changes
Result: satisfied -> pass
```

```text
Changed: src/app.js
Rule: source changes require test changes
Result: violated -> fail
```

```text
Changed: .github/workflows/ci.yml
Rule: workflow changes require human review
Result: indeterminate -> requires-review
```

```text
Task authority: apps/docs/**
Changed: apps/docs/navbar.tsx, packages/ui/Button.tsx
Result: packages/ui/Button.tsx violates declared authority -> fail
```

Configuration-error fixtures belong to the later normative Verification Contract because they are process failures rather than governance outcomes.

## Consequences

Pakemin gains a strong CI-gate position without becoming an agent runtime. Repository-level verification remains useful without task context, while task-aware verification requires an explicit pre-change authority artifact. `requires-review` may need CI-adapter behavior beyond a raw exit code. Determinism limits v0.2 to facts Pakemin can evaluate without semantic guessing. Task-envelope lifecycle and CI transport require later design work.

This decision enables, but does not implement, `pakemin context` or `pakemin check`.

## Non-Decisions

This ADR does not define complete task-definition or task-envelope syntax, envelope transport into CI, cryptographic signing or attestation, exact Git commands or default comparison modes, content hashing or canonical JSON, report JSON field syntax, approval identity or storage, GitHub Checks API integration, warning taxonomy, CLI option spelling, organization governance, remote policy sources, plugin or custom-evaluator support, LLM-based evaluation, or production implementation.

## Alternatives Considered

Advisory-only validation was rejected as the primary model because it cannot be a reliable CI governance gate.

Binary pass/fail was rejected because legitimate changes can require explicit human review rather than automatic acceptance or deterministic rejection.

LLM-based compliance judgment was rejected because identical facts could produce provider-dependent outcomes.

Line-count-based Least Change was rejected because a smaller diff is not necessarily safer, complete, or within authority.

Treating a missing task envelope as failure was rejected because repository-level verification remains useful without task-aware workflow; reports instead limit their claim.

Treating review-required as pass with warning was rejected because it represents a human decision as enforcement success.
