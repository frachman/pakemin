# Portable Core

This directory is the project-owned source of truth for AI-assisted work in the sample SaaS repository.

## Categories

- [Context](context/README.md): durable project facts.
- [Memory](memory/README.md): changing project state.
- [Rules](rules/README.md): stable constraints for work.
- [Workflows](workflows/README.md): reusable task processes.
- [Skills](skills/README.md): specialized work instructions.
- [Templates](templates/README.md): standard output formats.
- [Overrides](overrides/README.md): project-specific refinements.

## Precedence

Follow the Pakemin precedence model:

1. Safety and platform restrictions.
2. Explicit current user instruction.
3. Project-specific overrides.
4. Project decisions and context.
5. Shared framework defaults.
6. Vendor adapter defaults.

## Loading Strategy

Read this file first. Then load task-relevant context, rules, memory, and workflows.
