# First-Time User Tutorial

This walkthrough takes a new project from installing Pakemin to making and validating your first real edit in `.ai`. It is the hands-on companion to the [Quick Start](../../README.md#quick-start).

## 1. Install Pakemin

Pakemin requires Node.js 18 or newer. Confirm your version before continuing:

```text
node --version
```

Install the CLI globally from npm:

```text
npm install -g pakemin
```

Confirm it is available:

```text
pakemin --help
```

If `pakemin` is not found after a global install, the `npm` global binaries directory is not on your `PATH` — a common issue with nvm-managed Node installs. Run `npm prefix -g` to print the global npm prefix; the global binaries directory is the `bin` directory under that prefix. Add that `bin` directory to `PATH` (and to your shell profile) so the command resolves, then rerun `pakemin --help`.

## 2. Initialize a Project

From inside your project directory, initialize the portable `.ai` core:

```text
cd /path/to/your-project
pakemin init
```

`pakemin init` creates the project-owned portable core. A successful run prints `Initialized Pakemin portable core` followed by one `created:` line for every file it writes, for example:

```text
Initialized Pakemin portable core
created: .ai/README.md
created: .ai/context/README.md
created: .ai/context/project.md
created: .ai/workflows/feature.md
created: .ai/templates/task.md
```

Use this output to confirm the command ran successfully — if you see it, your `.ai` structure is in place:

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

If your project already uses a supported language stack, you can get more tailored starter content with a preset instead, such as `pakemin init --preset=go` — see [Language Presets](../../README.md#language-presets).

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

### What a validation error looks like

If you run `pakemin validate --adapters` before generating adapters, you will see errors listing each adapter it expects but that does not exist yet:

```text
error: AGENTS.md is missing
error: CLAUDE.md is missing
error: GEMINI.md is missing
error: .cursor/rules/pakemin.md is missing
error: .github/copilot-instructions.md is missing
Pakemin validation failed with 5 error(s)
```

This is expected before step 3. Resolve it by running `pakemin adapters generate` first (see step 3), then re-running `pakemin validate --adapters`.

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

## 6. Commit Your Project Knowledge

The whole point of the portable-core model is that project knowledge belongs to the project. Commit `.ai/` and the generated adapter files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/pakemin.md`, `.github/copilot-instructions.md`) to version control so the knowledge records and adapters are tracked, shared, and reviewed with the rest of your code:

```text
git add .ai AGENTS.md CLAUDE.md GEMINI.md .cursor/rules/pakemin.md .github/copilot-instructions.md
git commit -m "Add Pakemin portable core and adapters"
```

From here, your team and your AI coding agents read the same version-controlled source of truth.
