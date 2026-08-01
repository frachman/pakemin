# Pakemin

An AI Engineering Specification for vendor-agnostic project knowledge.

[![CI](https://github.com/frachman/pakemin/actions/workflows/ci.yml/badge.svg)](https://github.com/frachman/pakemin/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

The name comes from the Javanese idea of `pakem`: a trusted rule, pattern, or reference point. Pakemin helps a project make its AI-facing knowledge explicit and dependable without tying that knowledge to one vendor.

## Purpose

AI coding tools use different project instruction formats, including `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, Cursor rules, GitHub Copilot instructions, and other tool-specific files. When each format becomes its own source of truth, project knowledge is duplicated and eventually diverges.

Pakemin treats project knowledge as project-owned. The portable core describes context, memory, rules, workflows, skills, templates, and overrides in a vendor-independent form. Thin vendor adapters can then point agents toward that shared source or translate it for tools with narrower loading behavior.

## Quick Start

Run Pakemin from a checkout:

```text
git clone git@github.com:frachman/pakemin.git
cd pakemin
node ./bin/pakemin.js --help
```

Use it in another project:

```text
cd /path/to/your-project
node /path/to/pakemin/bin/pakemin.js init
node /path/to/pakemin/bin/pakemin.js adapters generate
node /path/to/pakemin/bin/pakemin.js validate --adapters
```

For local development, you can link the command:

```text
cd /path/to/pakemin
npm link
cd /path/to/your-project
pakemin init
pakemin adapters generate
pakemin validate --adapters
```

## What It Creates

`pakemin init` creates a project-owned portable core:

```text
.ai
├── README.md
├── context
├── memory
├── rules
├── workflows
├── skills
├── templates
└── overrides
```

`pakemin adapters generate` creates thin adapter files for supported AI coding tools:

- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `.cursor/rules/pakemin.md`
- `.github/copilot-instructions.md`

## Language Presets

Default `init` is language-neutral. If Pakemin detects common project files, it reports the detected stack and suggests an explicit preset.

```text
pakemin init --preset=go
pakemin init --preset=java
pakemin init --preset=node
pakemin init --preset=python
pakemin init --preset=rust
pakemin init --preset=auto
```

Presets write small starter documents into `.ai/context` and `.ai/rules`. They do not install dependencies, modify source code, or run build tools.

## CLI Commands

```text
pakemin init [path] [--force] [--dry-run] [--preset=go]
pakemin validate [path] [--links-only] [--adapters]
pakemin adapters list [path]
pakemin adapters generate [path] [--force] [--dry-run] [--only=agents,claude]
pakemin doctor [path]
```

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

Pakemin is pre-release but usable from a local checkout.

Completed foundations include documentation, specification drafts, a reference repository, a minimal CLI, adapter support, CI, MIT licensing, and explicit language presets.

The package is not published yet. Schemas, plugin architecture, shared framework distribution, hosted services, and release automation are intentionally deferred.

## Verification

Run the core checks from a checkout:

```text
npm test
npm run validate
node ./bin/pakemin.js validate examples/saas-reference-repository --adapters
```
