# Presets

## Purpose

Presets add small, language-aware starting points to the Pakemin portable core.

## Supported Presets

- `go`
- `java`
- `node`
- `python`
- `rust`
- `dotnet`
- `ruby`
- `auto`

`auto` applies presets for detected stacks. It is explicit and must be requested by the user.

## Detection

Pakemin detects stacks using common project files:

- Go: `go.mod`
- Java: `pom.xml`, `build.gradle`, or `build.gradle.kts`
- Node.js: `package.json`
- Python: `pyproject.toml`, `requirements.txt`, or `setup.py`
- Rust: `Cargo.toml`
- .NET: `*.sln`, `*.csproj`, or `global.json`
- Ruby: `Gemfile`, `*.gemspec`, or `.ruby-version`

Detection is advisory during default `init` and `doctor`.

## CLI Usage

```text
pakemin init [path]
```

Creates the language-neutral portable core and reports detected stacks with suggested preset commands.

```text
pakemin init [path] --preset=go
```

Creates the portable core and applies the Go preset.

```text
pakemin init [path] --preset=dotnet
pakemin init [path] --preset=ruby
```

Creates the portable core and applies the .NET or Ruby preset.

```text
pakemin init [path] --preset=auto
```

Creates the portable core and applies presets for detected stacks.

## Boundaries

Presets are starting points, not authoritative language standards.

Presets should not install dependencies, modify source code, contact package registries, or run build tools.
