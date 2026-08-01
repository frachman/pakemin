# Project Structure

## Purpose

This document describes the initial repository structure for the documentation foundation.

## Structure

```text
.
├── README.md
├── AGENTS.md
├── LICENSE
├── package.json
├── bin
│   └── pakemin.js
├── src
│   └── cli.js
├── test
│   └── cli.test.js
├── docs
│   ├── README.md
│   ├── getting-started
│   ├── architecture
│   ├── reference
│   ├── development
│   └── adr
└── examples
    └── README.md
```

## Categories

The root `README.md` introduces the project and links to documentation.

The root `AGENTS.md` gives concise guidance to AI coding agents working in this repository.

The `bin`, `src`, and `test` directories contain the minimal CLI authorized by ADR-0004.

The `docs` directory contains all documentation categories.

The `examples` directory contains illustrative project layouts that are not normative.

## Naming

Normal documentation filenames should not be numbered.

ADR filenames should use a stable sequence number such as `0001-markdown-first.md`.

## Future Work

Future milestones may define shared framework layout, adapter templates, and generated validation behavior.
