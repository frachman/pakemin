export const CORE_CATEGORIES = [
  "context",
  "memory",
  "rules",
  "workflows",
  "skills",
  "templates",
  "overrides"
];

export const ADAPTERS = [
  {
    id: "agents",
    name: "AGENTS.md",
    file: "AGENTS.md",
    content: `# Agent Instructions

This repository uses Pakemin. Treat [.ai/README.md](.ai/README.md) as the project-owned source of truth.

Before changing files, read the relevant context, rules, and workflow documents under \`.ai\`.

Keep this adapter thin. Move durable project knowledge into \`.ai\` instead of expanding this file.
`
  },
  {
    id: "claude",
    name: "CLAUDE.md",
    file: "CLAUDE.md",
    content: `# Claude Instructions

This repository uses Pakemin. Start with [.ai/README.md](.ai/README.md), then load the relevant documents for the task.

Use this file only as a Claude entry point. Do not duplicate the portable core here.
`
  },
  {
    id: "gemini",
    name: "GEMINI.md",
    file: "GEMINI.md",
    content: `# Gemini Instructions

This repository uses Pakemin. Start with [.ai/README.md](.ai/README.md), then load the relevant documents for the task.

Use this file only as a Gemini entry point. Do not duplicate the portable core here.
`
  },
  {
    id: "cursor",
    name: "Cursor rule",
    file: ".cursor/rules/pakemin.md",
    content: `# Pakemin Cursor Rule

This repository uses Pakemin. The portable core is in [.ai/README.md](../../.ai/README.md).

Before editing, identify the relevant \`.ai\` context, rules, and workflow documents.

Keep Cursor-specific instructions thin. Durable knowledge belongs in \`.ai\`.
`
  },
  {
    id: "copilot",
    name: "GitHub Copilot instructions",
    file: ".github/copilot-instructions.md",
    content: `# GitHub Copilot Instructions

This repository uses Pakemin. The portable core is in [.ai/README.md](../.ai/README.md).

Use \`.ai/context\`, \`.ai/rules\`, and \`.ai/workflows\` as the primary project knowledge sources.

Do not treat this adapter as a separate specification.
`
  }
];

export const LANGUAGE_PRESETS = [
  {
    id: "go",
    name: "Go",
    markers: ["go.mod"],
    technology: "Go project detected from `go.mod`.",
    testing: "Use `go test ./...` as the default test command.",
    formatting: "Use `gofmt` for Go source formatting before review."
  },
  {
    id: "java",
    name: "Java",
    markers: ["pom.xml", "build.gradle", "build.gradle.kts"],
    technology: "Java project detected from Maven or Gradle project files.",
    testing: "Use the project build tool for tests, such as `mvn test` or `./gradlew test`.",
    formatting: "Follow the project's Java formatter or style plugin when one is configured."
  },
  {
    id: "node",
    name: "Node.js",
    markers: ["package.json"],
    technology: "Node.js project detected from `package.json`.",
    testing: "Use the package test script, usually `npm test`, when it is defined.",
    formatting: "Follow the project's configured formatter, such as Prettier or ESLint."
  },
  {
    id: "python",
    name: "Python",
    markers: ["pyproject.toml", "requirements.txt", "setup.py"],
    technology: "Python project detected from common Python project files.",
    testing: "Use the project's configured test runner, such as `pytest`, when available.",
    formatting: "Follow the project's configured formatter, such as Black or Ruff."
  },
  {
    id: "rust",
    name: "Rust",
    markers: ["Cargo.toml"],
    technology: "Rust project detected from `Cargo.toml`.",
    testing: "Use `cargo test` as the default test command.",
    formatting: "Use `cargo fmt` for Rust source formatting before review."
  },
  {
    id: "dotnet",
    name: ".NET",
    markers: ["*.sln", "*.csproj", "global.json"],
    technology: ".NET project detected from solution, project, or SDK configuration files.",
    testing: "Use `dotnet test` as the default test command when a test project is available.",
    formatting: "Use `dotnet format` or the project's configured formatter before review."
  },
  {
    id: "ruby",
    name: "Ruby",
    markers: ["Gemfile", "*.gemspec", ".ruby-version"],
    technology: "Ruby project detected from common Ruby project files.",
    testing: "Use the project's configured test command, such as `bundle exec rspec` or `bundle exec rake test`.",
    formatting: "Follow the project's configured formatter, such as RuboCop."
  }
];
