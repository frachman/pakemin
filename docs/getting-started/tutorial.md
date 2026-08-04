# First-Time User Tutorial

This walkthrough takes a new project from installing Pakemin to making and validating your first real edit in `.ai`. It is the hands-on companion to the [Quick Start](../../README.md#quick-start).

## 1. Install Pakemin

Install the CLI globally from npm:

```text
npm install -g pakemin
```

Confirm it is available:

```text
pakemin --help
```

## 2. Initialize a Project

From inside your project directory, initialize the portable `.ai` core:

```text
cd /path/to/your-project
pakemin init
```

`pakemin init` creates the project-owned portable core:

```text
.ai
├── README.md
├── context/
├── memory/
├── rules/
├── workflows/
├── skills/
├── templates/
└── overrides/
```

## 3. Generate Adapters After Init

Run adapter generation **after** `pakemin init`:

```text
pakemin adapters generate
```

This must run after `init` because adapters are thin files that point AI coding tools to the `.ai/README.md` portable core. Until adapters are generated, tools have no instruction file directing them to that core. The command creates files such as `AGENTS.md`, `CLAUDE.md`, and `.cursor/rules/pakemin.md`.

## 4. Validate the Project

Validate your project structure and links:

```text
pakemin validate --adapters
```

A passing validation confirms required starter files are present and your internal Markdown links resolve.

## 5. Make Your First Useful Edit

Look at the starter documents `init` created. Open one, for example the context or memory starter, and complete its fields:

```text
.ai/context/project.md
```

Fill in the `Status:`, `Owner:`, and `Updated:` fields with values that match your project, and add one real sentence about your project in the body.

Re-run validation to confirm your edit stays consistent:

```text
pakemin validate --adapters
```

Validation remains green after your edit. You now have a working, validated Pakemin project with a complete documented starter for your project knowledge.
