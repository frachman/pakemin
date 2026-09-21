# Verification Contract v0

- Status: Proposal
- Target: v0.2.0 (unreleased)

## Purpose

This proposed provider-agnostic contract defines deterministic evidence for a proposed repository change. It does not add a `pakemin check` command or enforce policy until accepted and implemented.

The Least Change model, evaluation states, governance outcomes, and process exit codes are defined in [ADR-0014](../adr/0014-least-change-verification.md). This document is not yet the normative contract.

[Governance Schema v0](../reference/governance-schema-v0.md) defines configuration input separately and does not finalize this report contract.

## Inputs

A verifier normalizes repository facts, changed paths, applicable effective context and authority, and explicit task facts. Each effective rule includes its source layer, source document, and applicable scope.

## Outcomes and Exit Codes

| Outcome | Meaning | Exit code |
| --- | --- | --- |
| `pass` | All applicable deterministic rules are satisfied. | 0 |
| `fail` | A deterministic rule is violated. | 1 |
| `requires-review` | Repository facts are insufficient for a deterministic decision or an explicit human decision is required. | 2 |

## Required Report Fields

Every machine-readable report includes `contractVersion`, `outcome`, `affectedFiles`, `applicableRules`, `provenance`, `evidence`, and `reason`. `contractVersion` is `"0"` for this proposal.

```json
{
  "contractVersion": "0",
  "outcome": "pass",
  "affectedFiles": ["src/app.js"],
  "applicableRules": ["source changes require tests"],
  "provenance": [{"layer": "repository", "document": ".ai/rules/engineering.md", "scope": "."}],
  "evidence": ["test/app.test.js changed"],
  "reason": "Applicable deterministic requirements are satisfied."
}
```

## Examples

A source change with required test evidence is valid and returns `pass`.

A source change that violates an applicable rule requiring tests is forbidden and returns `fail`.

A change requiring an unrecorded approval returns `requires-review`; it must not be reported as enforcement success.

## Acceptance Criteria

An implementation must produce the same outcome, evidence, provenance, and exit code for identical repository facts regardless of the model that proposed the change. It must not rely on a particular LLM provider.
