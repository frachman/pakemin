export const STARTER_DOCUMENTS = [
  {
    file: ".ai/context/project.md",
    content: `# Project Context

Status:
Owner:
Updated:

## Purpose

Describe what this project does and who it serves.

## Product or Domain

Record domain terms, user roles, and business constraints that agents should understand.

## Repository Notes

Point to the most important source directories, docs, and entry points.
`
  },
  {
    file: ".ai/context/architecture.md",
    content: `# Architecture Context

Status:
Owner:
Updated:

## Overview

Describe the current architecture in stable, project-owned language.

## Key Components

List the main components and their responsibilities.

## Boundaries

Record constraints that should shape future changes.
`
  },
  {
    file: ".ai/context/stack.md",
    content: `# Stack Context

Status:
Owner:
Updated:

## Runtime

List the primary runtime, framework, and package manager.

## Commands

Record common local commands for install, test, build, lint, and format.

## Tooling Notes

Describe project-specific tooling that agents should respect.
`
  },
  {
    file: ".ai/context/roles.md",
    content: `# Role Context

Status:
Owner:
Updated:

## Maintainer

Describe maintainer responsibilities and review expectations.

## Contributor

Describe contributor expectations.

## AI Agent

Describe how AI agents should gather context, make changes, validate work, and report results.
`
  },
  {
    file: ".ai/memory/active.md",
    content: `# Active Memory

Status:
Owner:
Updated:

## Current Focus

Record active work that should survive across sessions.

## Constraints

List temporary constraints, blockers, or decisions not yet made durable.

## Follow-ups

List follow-up items that future contributors or agents should not lose.
`
  },
  {
    file: ".ai/memory/known-issues.md",
    content: `# Known Issues

Status:
Owner:
Updated:

## Issues

Record known bugs, limitations, or risks that may affect future work.

## Review Notes

Move durable items into context, rules, workflows, or ADRs when they stabilize.
`
  },
  {
    file: ".ai/rules/engineering.md",
    content: `# Engineering Rules

Status:
Owner:
Updated:

## Change Rules

Describe constraints for safe, reviewable code changes.

## Testing Rules

Describe expected validation before work is considered complete.

## Documentation Rules

Describe when documentation should be updated with code changes.
`
  },
  {
    file: ".ai/rules/ai-agents.md",
    content: `# AI Agent Rules

Status:
Owner:
Updated:

## Loading

Start with .ai/README.md, then read the context, rules, and workflow documents relevant to the task.

## Change Discipline

Do not invent project behavior. Prefer existing code, documentation, and ADRs.

## Reporting

Report what changed, how it was validated, and any remaining risk.
`
  },
  {
    file: ".ai/workflows/feature.md",
    content: `# Feature Workflow

Status:
Owner:
Updated:

## Steps

1. Read relevant context, rules, and active memory.
2. Clarify the requirement and acceptance criteria.
3. Make the smallest coherent change.
4. Run the expected validation.
5. Report changes and remaining risks.
`
  },
  {
    file: ".ai/workflows/bugfix.md",
    content: `# Bugfix Workflow

Status:
Owner:
Updated:

## Steps

1. Reproduce or narrow the issue.
2. Identify the smallest likely cause.
3. Fix the behavior without unrelated refactors.
4. Add or update a focused test when practical.
5. Report the cause, fix, and validation.
`
  },
  {
    file: ".ai/workflows/review.md",
    content: `# Review Workflow

Status:
Owner:
Updated:

## Steps

1. Read the requested change and relevant project context.
2. Prioritize bugs, regressions, missing tests, and maintainability risks.
3. Reference concrete files or behavior.
4. Keep summaries secondary to findings.
`
  },
  {
    file: ".ai/templates/requirement.md",
    content: `# Requirement Template

Status:
Owner:
Updated:

## Problem

## Desired Behavior

## Acceptance Criteria

## Out of Scope
`
  },
  {
    file: ".ai/templates/adr.md",
    content: `# ADR Template

- Status:
- Date:
- Decision owners:

## Context

## Decision

## Consequences

## Alternatives Considered
`
  },
  {
    file: ".ai/templates/milestone.md",
    content: `# Milestone Template

Status:
Owner:
Updated:

## Goal

## Deliverables

## Validation

## Out of Scope
`
  },
  {
    file: ".ai/templates/task.md",
    content: `# Task Template

Status:
Owner:
Updated:

## Input

## Expected Output

## Steps

## Validation
`
  }
];
