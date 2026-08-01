# ADR-0006: Language Detection and Presets

- Status: Accepted
- Date: 2026-08-01
- Decision owners: Farandy Rachman

## Context

Pakemin should help projects using different programming languages without making the portable core depend on one stack.

The default `init` command is intentionally vendor-agnostic and language-neutral. Language-aware behavior should improve onboarding while avoiding surprising project-specific rules.

## Decision

Pakemin will support safe language detection and explicit language presets.

Default `pakemin init` may report detected stacks and suggest preset commands, but it must not silently apply language-specific rules.

Language-specific content is applied only when the user provides an explicit preset, such as:

```text
pakemin init --preset=go
pakemin init --preset=java
pakemin init --preset=auto
```

`--preset=auto` is explicit. It may apply presets for detected stacks.

## Consequences

Projects get useful stack-specific starting points without losing the language-neutral portable core.

Detection remains advisory by default, which keeps `init` safe in polyglot and legacy repositories.

Future presets must remain small, reviewable, and written into `.ai` instead of hidden configuration.

## Alternatives Considered

Automatically applying detected presets during default `init` was rejected because it could add rules that the user did not ask for.

Keeping all language behavior out of the CLI was rejected because language-aware onboarding is part of the extensibility roadmap.
