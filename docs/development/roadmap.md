# Roadmap

## Purpose

This document records the provisional AES roadmap. Milestones may change as the specification matures.

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

- Example `.ai` structure.
- Sample SaaS repository.
- Sample adapters.
- Manual validation checklist.

## Milestone 3: Minimal CLI

Potential commands:

```text
aes init
aes validate
aes adapters generate
aes doctor
```

Command names are provisional.

## Milestone 4: Adapter Support

Initial adapters may include:

- `AGENTS.md`
- Claude
- Gemini
- Cursor
- GitHub Copilot

## Milestone 5: Extensibility

- Reusable framework distribution.
- Adapter plugins.
- Language and framework presets.
- MCP capability descriptions.
