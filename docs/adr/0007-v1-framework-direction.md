# ADR-0007: v1.0 Framework Direction

- Status: Accepted
- Date: 2026-08-02
- Decision owners: Farandy Rachman

## Context

Pakemin already defines a portable `.ai` core with context, memory, rules, workflows, skills, templates, and overrides.

Early use shows that folders alone do not give AI agents enough guidance. Agents still need a clear way to understand document purpose, naming, stable context, evolving memory, requirements, decisions, milestones, tasks, roles, and loading behavior.

Pakemin needs a v1.0 direction that reduces prompt length without becoming tied to one AI vendor or turning into a full orchestration platform.

## Decision

Pakemin v1.0 will be developed as a lightweight AI Development Framework for project-owned AI knowledge.

The framework will define:

- philosophy, principles, and boundaries;
- folder responsibilities;
- lightweight Markdown document conventions;
- naming conventions;
- stable context versus evolving memory;
- conventions for requirements, ADRs, milestones, tasks, workflows, role context, and memory;
- AI loading guidance for thin vendor adapters;
- validation and review rules that reduce ambiguity.

Pakemin v1.0 will not be an agent runtime, LLM wrapper, workflow engine, hosted memory service, plugin marketplace, or strict schema system.

## Consequences

Future milestones can add more useful `init` scaffolding and validation rules, but those changes must remain compact, readable, and Markdown-first.

Vendor adapters should continue to point agents toward the portable core instead of becoming separate instruction systems.

The framework should minimize repeated prompting by helping agents know where to read, how to interpret project knowledge, and how to keep changes reviewable.

## Alternatives Considered

Keeping Pakemin as folders plus thin adapters was rejected because it leaves too much interpretation to each agent.

Making Pakemin a strict schema-first specification was rejected because it would make adoption heavier and weaken the Markdown-first principle.

Building an agent orchestration platform was rejected because it would expand Pakemin beyond project-owned knowledge conventions.
