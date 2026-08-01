# Workflow Model

## Purpose

Workflows describe reusable processes for common engineering activities.

## Design

A workflow should help an agent perform a recognizable task from start to finish. Examples include:

- feature implementation;
- bug fixing;
- code review;
- incident response;
- release preparation;
- documentation updates.

Workflows may reference context, memory, rules, skills, and templates.

## Responsibilities

Workflows are responsible for sequencing work. They should describe when to gather context, when to make changes, when to validate, and what to report.

## Boundaries

Workflows are not specialized skill instructions. A workflow explains the process for a task; a skill explains how to perform a specialized class of work.

Workflows are not automation scripts. Future tooling may execute parts of a workflow, but the current milestone defines the documentation model only.

## Open Questions

- What belongs in a skill versus a workflow?
- Should workflows have required inputs and outputs?
- How should workflows compose without becoming an orchestration engine?

