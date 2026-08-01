# Roadmap

## Purpose

This document records the provisional Pakemin roadmap. Milestones may change as the specification matures.

## Milestone 0: Documentation Foundation

- Vision and philosophy.
- Architecture overview.
- Project structure.
- Documentation conventions.
- ADR process.
- Scope and terminology.

## Milestone 1: Specification Draft

- Portable-core definition: drafted in [../architecture/portable-core.md](../architecture/portable-core.md).
- Context model: drafted in [../architecture/context-model.md](../architecture/context-model.md).
- Memory model: drafted in [../architecture/memory-model.md](../architecture/memory-model.md).
- Rule model: drafted in [../architecture/rule-model.md](../architecture/rule-model.md).
- Workflow model: drafted in [../architecture/workflow-model.md](../architecture/workflow-model.md).
- Adapter contract: drafted in [../architecture/adapter-contract.md](../architecture/adapter-contract.md).
- Precedence rules: accepted in [../adr/0002-precedence-model.md](../adr/0002-precedence-model.md).
- Validation requirements: drafted in [../reference/validation-requirements.md](../reference/validation-requirements.md).

## Milestone 2: Reference Repository

- Example `.ai` structure: drafted in [../../examples/saas-reference-repository/.ai/README.md](../../examples/saas-reference-repository/.ai/README.md).
- Sample SaaS repository: drafted in [../../examples/saas-reference-repository/README.md](../../examples/saas-reference-repository/README.md).
- Sample adapters: drafted in [../../examples/saas-reference-repository/AGENTS.md](../../examples/saas-reference-repository/AGENTS.md), `CLAUDE.md`, `GEMINI.md`, Cursor rules, and GitHub Copilot instructions.
- Manual validation checklist: drafted in [../../examples/saas-reference-repository/validation-checklist.md](../../examples/saas-reference-repository/validation-checklist.md).

## Milestone 3: Minimal CLI

Implemented commands:

```text
pakemin init
pakemin validate
pakemin adapters list
pakemin adapters generate
pakemin doctor
```

The minimal CLI is documented in [../reference/cli.md](../reference/cli.md) and authorized by [../adr/0004-minimal-cli.md](../adr/0004-minimal-cli.md).

## Milestone 4: Adapter Support

- Supported adapter set: accepted in [../adr/0005-initial-adapter-support.md](../adr/0005-initial-adapter-support.md).
- Adapter reference: documented in [../reference/adapters.md](../reference/adapters.md).
- Adapter listing: implemented as `pakemin adapters list`.
- Adapter generation: supports all adapters or selected IDs.
- Adapter validation: available with `pakemin validate --adapters`.

## Milestone 4.5: Project Quality and Release Readiness

Scope this milestone narrowly. It should make the existing project easier to trust before extensibility work begins.

- Testing documentation: drafted in [testing.md](testing.md).
- CI for `npm test`, `npm run validate`, and reference repository validation: implemented in [../../.github/workflows/ci.yml](../../.github/workflows/ci.yml).
- License decision: MIT selected.
- Minimal release checklist: drafted in [release-checklist.md](release-checklist.md).
- Package metadata review: documented in [package-metadata.md](package-metadata.md).

Do not add language presets, plugin architecture, hosted services, or publishing automation in this milestone.

## Milestone 5: Extensibility

- Reusable framework distribution.
- Adapter plugins.
- Language and framework presets.
- Language-aware project detection for stacks such as Go, Java, Node.js, Python, and Rust.
- Explicit preset application, such as `pakemin init --preset go`, after the core CLI behavior is stable.
- Safe auto-detection that reports findings and suggestions without silently applying language-specific rules.
- MCP capability descriptions.
