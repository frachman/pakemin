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
- Language and framework presets: first language presets documented in [../reference/presets.md](../reference/presets.md).
- Language-aware project detection for stacks such as Go, Java, Node.js, Python, Rust, .NET, and Ruby: implemented for common project marker files.
- Explicit preset application, such as `pakemin init --preset=go`: implemented.
- Safe auto-detection that reports findings and suggestions without silently applying language-specific rules: implemented for default `init` and `doctor`.
- MCP capability descriptions.

## Milestone 5.25: CLI Code Organization

Scope this milestone narrowly. It should improve maintainability before npm publication without changing user-facing behavior.

- Split the current CLI implementation into smaller modules.
- Keep command behavior unchanged.
- Keep the CLI dependency-free unless an ADR accepts a dependency.
- Preserve existing tests and add focused tests only when behavior is touched.

Do not add new CLI commands, presets, adapter support, plugin architecture, or release automation in this milestone.

## Milestone 5.5: v1.0 Framework Direction

Scope this milestone narrowly. It should define the direction before v1.0 framework behavior is implemented.

- Accept Pakemin v1.0 as a lightweight AI Development Framework.
- Define philosophy, principles, and boundaries.
- Framework direction: accepted in [../adr/0007-v1-framework-direction.md](../adr/0007-v1-framework-direction.md).

Do not add CLI behavior, starter files, validation rules, schemas, or dependencies in this milestone.

## Milestone 5.6: Core Document Conventions

Scope this milestone narrowly. It should define how project knowledge is written before tooling enforces it.

- Define folder responsibilities.
- Define naming conventions.
- Define stable context versus evolving memory.
- Define conventions for requirements, ADRs, milestones, tasks, workflows, role context, and memory.

Keep conventions Markdown-first and lightweight.

## Milestone 5.7: Init Scaffold Upgrade

Scope this milestone narrowly. It should make `pakemin init` more useful without expanding the product surface.

- Create practical starter files for the v1.0 conventions.
- Keep generated content compact and editable.
- Preserve safe behavior for existing projects.

Do not introduce strict schemas, external dependencies, or new command families in this milestone.

## Milestone 5.8: Validation and Review Upgrade

Scope this milestone narrowly. It should validate conventions that reduce agent guesswork.

- Validate required starter files.
- Validate Markdown links, adapter pointers, ADR naming, and core headings.
- Add tests for fresh init plus validation.

Keep validation convention-based, not schema-heavy.

## Milestone 5.9: Reference Repository v1 Refresh

Scope this milestone narrowly. It should demonstrate the v1.0 conventions in a reusable example.

- Update the reference repository to show v1.0 conventions.
- Include small examples for requirements, ADRs, milestones, tasks, workflows, role context, and memory.
- Keep examples short enough to copy and adapt.

Do not add unrelated product features in this milestone.

## Milestone 6.0: npm Publish Readiness

Scope this milestone narrowly. It should prepare the existing CLI for npm publication without expanding the product surface.

- Decide release and versioning policy.
- Decide whether to remove `private: true`.
- Add final install guidance.
- Consider package lock or release workflow.
- Run smoke tests with `npm pack` and tarball installation.

Do not add new presets, plugin architecture, hosted services, or unrelated CLI commands in this milestone.
