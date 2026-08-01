# Memory Model

## Purpose

Memory records relevant project state that changes over time and should remain visible to future contributors and AI agents.

## Design

Memory is project-owned. It is not conversational memory stored by an AI provider.

Useful memory includes:

- active work;
- accepted decisions not yet captured in ADRs;
- known issues;
- current migrations;
- temporary constraints;
- follow-up tasks that affect future changes.

Memory should include enough date, owner, and status information for reviewers to judge whether it is still relevant.

## Responsibilities

Memory should preserve continuity across sessions and tools. It should make active project state explicit rather than relying on a particular agent account or chat history.

## Boundaries

Memory should not duplicate permanent project context. When a memory item becomes durable, it should be moved into context, rules, reference documentation, or an ADR.

Memory should not store secrets or sensitive content that cannot safely be shared with supported agents.

## Open Questions

- Should memory be Markdown, YAML, or mixed?
- How should stale memory be detected and retired?
- What minimum metadata is needed without making memory cumbersome?

