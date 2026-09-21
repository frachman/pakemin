# SaaS Reference Repository

This example shows how a small SaaS project could adopt Pakemin without implementing a schema.

The files are illustrative. They are not normative and should not be treated as the final Pakemin project layout.

## Structure

```text
.
├── README.md
├── AGENTS.md
└── .ai
    ├── README.md
    ├── context
    ├── memory
    ├── rules
    ├── workflows
    ├── skills
    ├── templates
    └── overrides
```

## Documents

- [.ai overview](.ai/README.md): describes the portable core in this example.
- [Manual validation checklist](validation-checklist.md): lists checks a reviewer can run without tooling.
- [AGENTS.md](AGENTS.md): shows the primary default adapter.

The repository also retains optional compatibility examples for [Claude](CLAUDE.md), [Gemini](GEMINI.md), [Cursor](.cursor/rules/pakemin.md), and [GitHub Copilot](.github/copilot-instructions.md). They are not part of the default generated profile.
