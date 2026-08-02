# Document Conventions

## Purpose

This document defines lightweight v1.0 conventions for Pakemin portable-core documents.

The goal is to help humans and AI agents understand project knowledge without requiring strict schemas.

## Folder Responsibilities

- `context`: stable project facts such as purpose, domain, architecture, stack, and repository map.
- `memory`: evolving project state such as active work, known issues, migrations, and temporary constraints.
- `rules`: durable constraints that should consistently govern agent behavior.
- `workflows`: repeatable engineering processes for common tasks.
- `skills`: specialized instructions for a class of work.
- `templates`: reusable document shapes and output formats.
- `overrides`: project-specific refinements to shared Pakemin defaults.

## Naming

Use lowercase kebab-case for normal document filenames, such as `project-overview.md`.

Use numbered filenames only where order is part of the convention:

- ADRs: `0001-decision-title.md`
- milestones: `milestone-001-short-name.md`
- tasks: `task-001-short-name.md`

Keep names stable after review. Prefer adding a replacement document over renaming widely linked documents.

## Stable and Evolving Context

Stable context belongs in `context`. It should change slowly and describe facts that future contributors can rely on.

Evolving context belongs in `memory`. It should include date, owner, status, and enough detail to know when it can be retired.

When memory becomes durable, move it into `context`, `rules`, `workflows`, or an ADR.

## Document Types

Requirements describe desired behavior, constraints, and acceptance criteria.

ADRs record significant decisions, their context, consequences, and alternatives.

Milestones group related work into a small deliverable with clear boundaries.

Tasks describe one unit of work with expected inputs, outputs, validation, and reporting.

Workflows describe how to perform a repeatable process from context gathering through validation.

Role context describes responsibilities, permissions, and perspective for a contributor or agent role.

Memory records active or temporary project state that should survive across sessions.

## Minimum Shape

Use this shape for new portable-core documents unless a more specific template exists:

```markdown
# Title

Status:
Owner:
Updated:

## Purpose

## Content

## Review Notes
```

Omit empty metadata only when it would add noise. Keep content readable as normal Markdown.

## Boundaries

These conventions are not schemas. They define a shared writing pattern for humans and AI agents.

Validation may check for important headings and links, but v1.0 should remain Markdown-first and lightweight.
