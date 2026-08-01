# Context Model

## Purpose

Context is stable project knowledge that helps an AI coding agent understand the repository before changing it.

## Design

Context should describe durable facts rather than active work. Useful context includes:

- product purpose and users;
- domain terminology;
- architecture overview;
- technology stack;
- repository map;
- coding conventions;
- operational constraints.

Context should be written for both humans and agents. It should be compact enough to review, but specific enough to prevent repeated rediscovery.

## Responsibilities

Context documents should explain what is true about the project under normal conditions.

They should point to source files, decisions, or external documentation when those references are more authoritative than a summary.

## Boundaries

Context is not the place for transient task notes, unresolved incidents, or personal preferences. Those belong in memory, workflows, rules, or user instructions.

## Open Questions

- Which context documents are required for the smallest valid Pakemin-compatible project?
- How should context reference private or sensitive information without leaking it to generated adapters?
