# SaaS Reference Repository

This example shows how a small SaaS project could adopt AES without implementing a CLI or schema.

The files are illustrative. They are not normative and should not be treated as the final AES project layout.

## Structure

```text
.
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── GEMINI.md
├── .cursor
│   └── rules
│       └── aes.md
├── .github
│   └── copilot-instructions.md
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
- [AGENTS.md](AGENTS.md): shows a thin fallback adapter.
- [CLAUDE.md](CLAUDE.md): shows a thin Claude adapter.
- [GEMINI.md](GEMINI.md): shows a thin Gemini adapter.
- [Cursor rules](.cursor/rules/aes.md): shows a thin Cursor adapter.
- [GitHub Copilot instructions](.github/copilot-instructions.md): shows a thin Copilot adapter.

