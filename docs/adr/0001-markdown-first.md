# ADR-0001: Markdown First

- Status: Accepted
- Date: 2026-07-31
- Decision owners: Repository owner

## Context

AES needs a portable representation for project knowledge that can be read by humans, reviewed in Git, and consumed by multiple AI coding agents.

The initial project scope is documentation only. Introducing schemas or tooling before the core concepts stabilize would add implementation commitments too early.

## Decision

Markdown is the default portable representation for AES documentation and project knowledge.

Structured formats such as YAML or JSON may be introduced when they provide clear validation, interoperability, or machine-processing value.

## Consequences

Project knowledge remains easy to read, edit, diff, and review.

The specification can mature before committing to a schema or CLI behavior.

Some future validation may be less strict until structured formats are introduced for specific areas.

## Alternatives Considered

YAML was considered for stronger structure, but it would make early authoring less approachable and imply schema decisions before the specification is stable.

JSON was considered for machine compatibility, but it is less comfortable for long-form human documentation.

Mixed Markdown and structured data remains available for future milestones when a category needs it.

