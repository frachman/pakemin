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

Scope this milestone narrowly. It improves maintainability before npm publication without changing user-facing behavior.

- CLI implementation split into smaller modules.
- Command behavior remains unchanged.
- CLI remains dependency-free.
- Existing tests remain the behavior safety net.

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
- Document conventions: drafted in [../reference/document-conventions.md](../reference/document-conventions.md).

Keep conventions Markdown-first and lightweight.

## Milestone 5.7: Init Scaffold Upgrade

Scope this milestone narrowly. It should make `pakemin init` more useful without expanding the product surface.

- Create practical starter files for the v1.0 conventions.
- Keep generated content compact and editable.
- Preserve safe behavior for existing projects.
- Init scaffold upgrade: implemented for context, memory, rules, workflows, and templates.

Do not introduce strict schemas, external dependencies, or new command families in this milestone.

## Milestone 5.8: Validation and Review Upgrade

Scope this milestone narrowly. It should validate conventions that reduce agent guesswork.

- Validate required starter files.
- Validate Markdown links, adapter pointers, ADR naming, and core headings.
- Add tests for fresh init plus validation.
- Validation upgrade: implemented with convention-based checks and tests.

Keep validation convention-based, not schema-heavy.

## Milestone 5.9: Reference Repository v1 Refresh

Scope this milestone narrowly. It should demonstrate the v1.0 conventions in a reusable example.

- Update the reference repository to show v1.0 conventions.
- Include small examples for requirements, ADRs, milestones, tasks, workflows, role context, and memory.
- Keep examples short enough to copy and adapt.
- Reference repository v1 refresh: implemented in [../../examples/saas-reference-repository/.ai/README.md](../../examples/saas-reference-repository/.ai/README.md).

Do not add unrelated product features in this milestone.

## Milestone 6.0: npm Publish Readiness

Scope this milestone narrowly. It should prepare the existing CLI for npm publication without expanding the product surface.

- Decide release and versioning policy.
- Decide whether to remove `private: true`.
- Add final install guidance.
- Consider package lock or release workflow.
- Run smoke tests with `npm pack` and tarball installation.
- Published to npm and tagged as `v0.1.0`.

Do not add new presets, plugin architecture, hosted services, or unrelated CLI commands in this milestone.

## Milestone 6.1: 0.1.1 Public Preview Hardening

Scope this milestone narrowly. It should patch the first public preview based on real user and agent feedback.

### Milestone 6.1.1: Missing Target Path Handling

- `pakemin init <missing-dir>` creates the target directory.
- `pakemin doctor <missing-dir>` returns a clear error.
- Wildcard language detection does not crash on missing paths.

### Milestone 6.1.2: ADR Validation Contract

- Keep ADR filename validation as a default convention.
- Document `0001-kebab-case.md` as a public Pakemin convention.
- Ensure validation errors point clearly to the convention.

### Milestone 6.1.3: Version Source of Truth

- Remove the hardcoded CLI version.
- Read the CLI version from `package.json`.
- Prepare patch version `0.1.1`.

### Milestone 6.1.4: CLI Option Parser Hardening

- Treat `--key=value` as a value option, not a boolean flag.
- Add focused parser tests.

### Milestone 6.1.5: Repo Hygiene

- Add a root `.gitignore`.
- Ignore `node_modules`, npm tarballs, logs, `.DS_Store`, and temporary cache artifacts.

### Milestone 6.1.6: Node Engine CI Matrix

- Run CI on Node.js 18, 20, 22, and 24.
- Keep existing test and validation jobs.

### Milestone 6.1.7: Preset Auto-Detection Combination

- Union explicitly specified preset IDs with auto-detected stacks when using `--preset=auto,<id>`.
- Fix bug that discarded explicit preset options in the presence of the wildcard auto option.

### Milestone 6.1.8: Boolean Flag Value Recognition

- Introduce the `isFlagSet()` helper to correctly parse explicit values passed to boolean flags.
- Fix bug where explicit flags such as `--dry-run=true` or `--force=false` were treated as missing.

### Milestone 6.1.9: Blank and Whitespace Value Warnings

- Add explicit warnings when value options such as `--preset` or `--only` are provided with empty or whitespace-only values.
- Document options parser warnings in the CLI reference guides.

### Milestone 6.1.10: Non-Directory and Dangling Symlink Target Handling

- Ensure `init`, `validate`, and `doctor` command executors handle file paths or dangling symlinks at target or core paths safely.
- Replace low-level Node.js filesystem errors with user-friendly target validation messages.

### Milestone 6.1.11: Link Validation Query String Handling

- Strip query strings and hash anchors before verifying local relative Markdown file links.
- Prevent false-positive validation errors for links pointing to valid files containing query parameters.

### Milestone 6.1.12: 0.1.1 Release Readiness

- Run full checks.
- Run `npm pack`.
- Install the tarball into a temporary project.
- Smoke test the CLI lifecycle.

Do not publish `0.1.1` until explicitly approved.
