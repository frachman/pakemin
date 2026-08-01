# ADR-0003: Product Name and Command Namespace

- Status: Accepted
- Date: 2026-08-01
- Decision owners: Farandy Rachman

## Context

The project started with the working title AI Engineering Specification, abbreviated as AES. That name described the technical intent, but it was not intended as final branding or a command namespace.

The repository owner chose the name Pakemin. The name aligns with the Javanese idea of `pakem`: a trusted rule, pattern, convention, or reference point.

## Decision

The product name is Pakemin. The descriptive category is AI Engineering Specification.

Future CLI examples should use the `pakemin` command namespace, such as:

```text
pakemin init
pakemin validate
pakemin adapters generate
pakemin doctor
```

No CLI is implemented by this ADR.

## Consequences

Documentation can use a stable project name before the CLI milestone begins.

The earlier `aes` command examples are retired before implementation, avoiding a later command rename.

The phrase AI Engineering Specification remains useful as a category and concept. It should not replace Pakemin as the product name.

## Alternatives Considered

Keeping AES was considered, but it was too generic and carried less project-specific meaning.

Using `aes` as the command namespace was considered, but it would not align with the chosen product name.
