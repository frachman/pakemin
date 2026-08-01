# Pakemin

An AI Engineering Specification for vendor-neutral project knowledge.

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
- [CLI reference](docs/reference/cli.md)
- [Development](docs/development/README.md)
- [Architecture decision records](docs/adr/README.md)
- [Examples](examples/README.md)

## Current Status

This repository has completed the documentation foundation, specification draft, reference repository, and minimal CLI milestones.

Implementation work such as schemas, plugins, automated extraction, hosted services, and CI is intentionally deferred until the relevant milestone begins.

## Verification

Run the core checks from a checkout:

```text
npm test
npm run validate
node ./bin/pakemin.js validate examples/saas-reference-repository --adapters
```
