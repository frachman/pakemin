# Project Structure

## Purpose

This document describes the initial repository structure for the documentation foundation.

## Structure

```text
.
├── README.md
├── AGENTS.md
├── LICENSE
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

The `docs` directory contains all documentation categories.

The `examples` directory is reserved for future examples. It currently has a navigation file only.

## Naming

Normal documentation filenames should not be numbered.

ADR filenames should use a stable sequence number such as `0001-markdown-first.md`.

## Future Work

Future milestones may define an example AES project structure, shared framework layout, adapter templates, and validation checklist.

