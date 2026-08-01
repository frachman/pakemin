# Manual Validation Checklist

Use this checklist to review the sample SaaS reference repository without AES tooling.

## Portable Core

- `.ai/README.md` exists and identifies the portable core.
- Each meaningful `.ai` category has a `README.md`.
- Category `README.md` files list the documents inside the category.
- Context, memory, rules, workflows, skills, templates, and overrides are distinguishable.

## Adapters

- Root `AGENTS.md` points to `.ai/README.md`.
- `CLAUDE.md` points to `.ai/README.md`.
- `GEMINI.md` points to `.ai/README.md`.
- `.cursor/rules/aes.md` points to `.ai/README.md`.
- `.github/copilot-instructions.md` points to `.ai/README.md`.
- Adapter files do not duplicate substantial portable-core content.

## Content Boundaries

- Stable product knowledge appears in context.
- Changing project state appears in memory.
- Constraints appear in rules.
- Task processes appear in workflows.
- Specialized review guidance appears in skills.
- Output formats appear in templates.
- Project-specific refinements appear in overrides.

## Safety

- No sample file contains secrets, tokens, customer data, or private infrastructure details.
- Tenant isolation expectations are explicit in rules or context.
- Adapters do not include sensitive content that should remain out of vendor-specific files.

## Links

- Relative Markdown links resolve.
- Parent category links resolve.
- Adapter links resolve from their own directory locations.

