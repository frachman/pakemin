# Documentation Guidelines

## Purpose

These guidelines keep Pakemin documentation concise, consistent, and easy for humans and AI agents to navigate.

## Style

Write in English.

Keep documents concise and explicit. Avoid marketing language, unsupported claims, and unnecessary abstraction.

Prefer short paragraphs over fragmented one-line statements.

Use Markdown by default. Use structured data only when it improves validation or interoperability.

Use Mermaid diagrams when a visual model is useful. Do not create decorative ASCII diagrams.

Use tables only when comparison is clearer in tabular form.

## Navigation

Every meaningful documentation directory must include a compact `README.md` that explains the category, lists documents inside it, describes each document in one sentence, and links to its parent category where appropriate.

Update navigation files when documents are added, renamed, moved, or removed.

## Architecture Documents

Use this structure where applicable:

```markdown
# Title

## Purpose

## Background

## Design

## Responsibilities

## Boundaries

## Trade-offs

## Open Questions

## Future Work
```

Do not add empty sections just to match the template.

## ADRs

Use ADRs for significant architectural decisions. ADR files should be numbered and stored in [../adr](../adr/README.md).

## Validation

After documentation changes, validate relative Markdown links.
