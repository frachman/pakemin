# Pakemin

Pakemin is a vendor-neutral documentation and tooling specification for software projects that work with multiple AI coding agents.

The name comes from the Javanese idea of `pakem`: a trusted rule, pattern, or reference point. Pakemin helps a project make its AI-facing knowledge explicit and dependable without tying that knowledge to one vendor.

## Purpose

AI coding tools use different project instruction formats, including `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, Cursor rules, GitHub Copilot instructions, and other tool-specific files. When each format becomes its own source of truth, project knowledge is duplicated and eventually diverges.

Pakemin treats project knowledge as project-owned. The portable core describes context, memory, rules, workflows, skills, templates, and overrides in a vendor-independent form. Thin vendor adapters can then point agents toward that shared source or translate it for tools with narrower loading behavior.

## Goals

- Keep project knowledge independent from any one AI vendor.
- Store project context, decisions, rules, and workflows in version-controlled files.
- Support gradual adoption in existing repositories.
- Keep the system readable and editable by humans.
- Provide a foundation for future CLI tooling and adapters.

## Non-Goals

Pakemin is not an LLM wrapper, chat application, prompt marketplace, hosted memory database, MCP replacement, plugin marketplace, or autonomous development platform.

Those areas may be explored later, but they are outside the current documentation milestone.

## Repository Guide

- [Documentation overview](docs/README.md)
- [Getting started](docs/getting-started/README.md)
- [Architecture](docs/architecture/README.md)
- [Reference](docs/reference/README.md)
- [Development](docs/development/README.md)
- [Architecture decision records](docs/adr/README.md)
- [Examples](examples/README.md)

## Current Status

This repository is in Milestone 0: Documentation Foundation. The current work defines the problem, core concepts, repository structure, documentation conventions, and first architecture decision.

Implementation work such as a CLI, schemas, adapter generation, plugins, automated extraction, and CI is intentionally deferred until the specification draft is clearer.
