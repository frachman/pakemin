import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const CORE_CATEGORIES = [
  "context",
  "memory",
  "rules",
  "workflows",
  "skills",
  "templates",
  "overrides"
];

const ADAPTERS = [
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

const LANGUAGE_PRESETS = [
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
  }
];

export async function runCli(args, io) {
  const command = args[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    write(io.stdout, helpText());
    return 0;
  }

  if (command === "--version" || command === "-v") {
    write(io.stdout, "0.0.0\n");
    return 0;
  }

  try {
    if (command === "init") {
      return initCommand(args.slice(1), io);
    }

    if (command === "validate") {
      return validateCommand(args.slice(1), io);
    }

    if (command === "adapters") {
      if (args[1] === "generate") {
        return adaptersGenerateCommand(args.slice(2), io);
      }

      if (args[1] === "list") {
        return adaptersListCommand(args.slice(2), io);
      }
    }

    if (command === "doctor") {
      return doctorCommand(args.slice(1), io);
    }
  } catch (error) {
    write(io.stderr, `Error: ${error.message}\n`);
    return 1;
  }

  write(io.stderr, `Unknown command: ${args.join(" ")}\n\n${helpText()}`);
  return 1;
}

function initCommand(args, io) {
  const options = parseOptions(args);
  const root = resolveTarget(io.cwd, options.positionals[0] || ".");
  const force = options.flags.has("force");
  const dryRun = options.flags.has("dry-run");
  const detected = detectLanguages(root);
  const presets = selectPresets(options.values.preset, detected);

  const files = [
    {
      file: ".ai/README.md",
      content: portableCoreReadme()
    },
    ...CORE_CATEGORIES.map((category) => ({
      file: `.ai/${category}/README.md`,
      content: categoryReadme(category)
    }))
  ];

  if (presets.length > 0) {
    files.push(...presetFiles(presets));
  }

  const result = writeFiles(root, files, { force, dryRun });
  reportWriteResult(io.stdout, "Initialized Pakemin portable core", result);
  reportDetection(io.stdout, detected, presets);
  return result.blocked.length > 0 ? 1 : 0;
}

function validateCommand(args, io) {
  const options = parseOptions(args);
  const root = resolveTarget(io.cwd, options.positionals[0] || ".");
  const result = validateProject(root, {
    requireCore: !options.flags.has("links-only"),
    requireAdapters: options.flags.has("adapters")
  });

  for (const warning of result.warnings) {
    write(io.stdout, `warning: ${warning}\n`);
  }

  for (const error of result.errors) {
    write(io.stdout, `error: ${error}\n`);
  }

  if (result.errors.length === 0) {
    write(io.stdout, `Pakemin validation passed for ${root}\n`);
    return 0;
  }

  write(io.stdout, `Pakemin validation failed with ${result.errors.length} error(s)\n`);
  return 1;
}

function adaptersGenerateCommand(args, io) {
  const options = parseOptions(args);
  const root = resolveTarget(io.cwd, options.positionals[0] || ".");
  const force = options.flags.has("force");
  const dryRun = options.flags.has("dry-run");
  const adapters = selectAdapters(options.values.only);

  if (!exists(path.join(root, ".ai/README.md"))) {
    write(io.stderr, "Error: .ai/README.md was not found. Run `pakemin init` first.\n");
    return 1;
  }

  const result = writeFiles(root, adapters, { force, dryRun });
  reportWriteResult(io.stdout, "Generated Pakemin adapters", result);
  return result.blocked.length > 0 ? 1 : 0;
}

function adaptersListCommand(args, io) {
  const options = parseOptions(args);
  const root = resolveTarget(io.cwd, options.positionals[0] || ".");

  for (const adapter of ADAPTERS) {
    const status = exists(path.join(root, adapter.file)) ? "found" : "missing";
    write(io.stdout, `${adapter.id}\t${status}\t${adapter.file}\n`);
  }

  return 0;
}

function doctorCommand(args, io) {
  const options = parseOptions(args);
  const root = resolveTarget(io.cwd, options.positionals[0] || ".");
  const detected = detectLanguages(root);
  const checks = [
    ["Node.js", process.version],
    ["Working directory", root],
    ["Portable core", exists(path.join(root, ".ai/README.md")) ? "found" : "missing"],
    ["Package metadata", exists(path.join(root, "package.json")) ? "found" : "missing"]
  ];

  for (const [label, value] of checks) {
    write(io.stdout, `${label}: ${value}\n`);
  }

  reportDetection(io.stdout, detected, []);
  return 0;
}

export function validateProject(root, options = {}) {
  const requireCore = options.requireCore !== false;
  const requireAdapters = options.requireAdapters === true;
  const errors = [];
  const warnings = [];
  const coreReadme = path.join(root, ".ai/README.md");

  if (requireCore) {
    if (!exists(coreReadme)) {
      errors.push(".ai/README.md is missing");
    }

    for (const category of CORE_CATEGORIES) {
      const readme = path.join(root, ".ai", category, "README.md");
      if (!exists(readme)) {
        errors.push(`.ai/${category}/README.md is missing`);
      }
    }
  }

  if (requireAdapters) {
    for (const adapter of ADAPTERS) {
      const adapterFile = path.join(root, adapter.file);
      if (!exists(adapterFile)) {
        errors.push(`${adapter.file} is missing`);
        continue;
      }

      const text = fs.readFileSync(adapterFile, "utf8");
      if (!text.includes(".ai/README.md")) {
        errors.push(`${adapter.file} does not point to .ai/README.md`);
      }
    }
  }

  const markdownFiles = listMarkdownFiles(root);
  for (const file of markdownFiles) {
    const links = markdownLinks(fs.readFileSync(file, "utf8"));
    for (const href of links) {
      const target = href.split("#", 1)[0];
      if (!target || isExternalLink(target)) {
        continue;
      }

      const resolved = path.resolve(path.dirname(file), target);
      if (!exists(resolved)) {
        errors.push(`${relative(root, file)} links to missing target ${href}`);
      }
    }
  }

  if (markdownFiles.length === 0) {
    warnings.push("no Markdown files found");
  }

  return { errors, warnings };
}

function writeFiles(root, files, options) {
  const written = [];
  const skipped = [];
  const blocked = [];

  for (const entry of files) {
    const target = path.join(root, entry.file);
    if (exists(target) && !options.force) {
      blocked.push(entry.file);
      continue;
    }

    if (options.dryRun) {
      skipped.push(entry.file);
      continue;
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${entry.content.trimEnd()}\n`);
    written.push(entry.file);
  }

  return { written, skipped, blocked };
}

function reportWriteResult(stream, title, result) {
  write(stream, `${title}\n`);

  for (const file of result.written) {
    write(stream, `created: ${file}\n`);
  }

  for (const file of result.skipped) {
    write(stream, `dry-run: ${file}\n`);
  }

  for (const file of result.blocked) {
    write(stream, `exists: ${file} (use --force to overwrite)\n`);
  }
}

function portableCoreReadme() {
  return `# Portable Core

This directory is the project-owned source of truth for AI-assisted work.

## Categories

- [Context](context/README.md): durable project facts.
- [Memory](memory/README.md): changing project state.
- [Rules](rules/README.md): stable constraints for work.
- [Workflows](workflows/README.md): reusable task processes.
- [Skills](skills/README.md): specialized work instructions.
- [Templates](templates/README.md): standard output formats.
- [Overrides](overrides/README.md): project-specific refinements.
`;
}

function categoryReadme(category) {
  const descriptions = {
    context: "Context contains stable project knowledge.",
    memory: "Memory contains changing project state.",
    rules: "Rules define stable constraints.",
    workflows: "Workflows describe reusable task processes.",
    skills: "Skills contain specialized instructions.",
    templates: "Templates define standard output structures.",
    overrides: "Overrides refine shared defaults for this project."
  };

  return `# ${titleCase(category)}

${descriptions[category]}

Parent: [Portable core](../README.md)

## Documents

Add project-specific documents here as the specification matures.
`;
}

function parseOptions(args) {
  const flags = new Set();
  const values = {};
  const positionals = [];

  for (const arg of args) {
    if (arg.startsWith("--")) {
      const option = arg.slice(2);
      const [key, value] = option.split("=", 2);
      flags.add(key);
      if (value !== undefined) {
        values[key] = value;
      }
    } else {
      positionals.push(arg);
    }
  }

  return { flags, values, positionals };
}

function selectAdapters(only) {
  if (!only) {
    return ADAPTERS;
  }

  const requested = only.split(",").map((value) => value.trim()).filter(Boolean);
  const unknown = requested.filter((id) => !ADAPTERS.some((adapter) => adapter.id === id));
  if (unknown.length > 0) {
    throw new Error(`unknown adapter id(s): ${unknown.join(", ")}`);
  }

  return ADAPTERS.filter((adapter) => requested.includes(adapter.id));
}

function selectPresets(preset, detected) {
  if (!preset) {
    return [];
  }

  const requested = preset.split(",").map((value) => value.trim()).filter(Boolean);
  const ids = requested.includes("auto")
    ? detected.map((language) => language.id)
    : requested;

  const unknown = ids.filter((id) => !LANGUAGE_PRESETS.some((language) => language.id === id));
  if (unknown.length > 0) {
    throw new Error(`unknown preset id(s): ${unknown.join(", ")}`);
  }

  return LANGUAGE_PRESETS.filter((language) => ids.includes(language.id));
}

function detectLanguages(root) {
  return LANGUAGE_PRESETS.map((language) => ({
    ...language,
    foundMarkers: language.markers.filter((marker) => exists(path.join(root, marker)))
  })).filter((language) => language.foundMarkers.length > 0);
}

function presetFiles(presets) {
  return [
    {
      file: ".ai/context/technology-stack.md",
      content: technologyStackContent(presets)
    },
    {
      file: ".ai/rules/testing.md",
      content: testingRulesContent(presets)
    },
    {
      file: ".ai/rules/formatting.md",
      content: formattingRulesContent(presets)
    }
  ];
}

function technologyStackContent(presets) {
  return `# Technology Stack

This file was created by explicit Pakemin preset selection.

${presets.map((preset) => `## ${preset.name}

${preset.technology}`).join("\n\n")}
`;
}

function testingRulesContent(presets) {
  return `# Testing Rules

This file was created by explicit Pakemin preset selection.

${presets.map((preset) => `## ${preset.name}

${preset.testing}`).join("\n\n")}
`;
}

function formattingRulesContent(presets) {
  return `# Formatting Rules

This file was created by explicit Pakemin preset selection.

${presets.map((preset) => `## ${preset.name}

${preset.formatting}`).join("\n\n")}
`;
}

function reportDetection(stream, detected, applied) {
  if (detected.length === 0) {
    return;
  }

  write(stream, "Detected stacks:\n");
  for (const language of detected) {
    write(stream, `detected: ${language.id} (${language.foundMarkers.join(", ")})\n`);
  }

  if (applied.length > 0) {
    write(stream, `Applied presets: ${applied.map((language) => language.id).join(", ")}\n`);
  } else {
    write(stream, "Suggested next step: pakemin init --preset=<id>\n");
  }
}

function listMarkdownFiles(root) {
  const results = [];
  walk(root, results);
  return results.filter((file) => file.endsWith(".md"));
}

function walk(dir, results) {
  if (!exists(dir)) {
    return;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, results);
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
}

function markdownLinks(text) {
  const links = [];
  const pattern = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    links.push(match[1]);
  }

  return links;
}

function isExternalLink(href) {
  return /^(https?:|mailto:|#)/.test(href);
}

function resolveTarget(cwd, target) {
  return path.resolve(cwd, target);
}

function exists(file) {
  return fs.existsSync(file);
}

function relative(root, file) {
  return path.relative(root, file) || ".";
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function write(stream, text) {
  stream.write(text);
}

function helpText() {
  return `Pakemin

An AI Engineering Specification for vendor-agnostic project knowledge.

Usage:
  pakemin init [path] [--force] [--dry-run] [--preset=go]
  pakemin validate [path] [--links-only] [--adapters]
  pakemin adapters list [path]
  pakemin adapters generate [path] [--force] [--dry-run] [--only=agents,claude]
  pakemin doctor [path]
  pakemin --version

Commands:
  init                 Create a minimal .ai portable core.
  validate             Validate local Pakemin structure and Markdown links.
  adapters list        List supported vendor adapters.
  adapters generate    Generate thin vendor adapter files.
  doctor               Print local environment and project checks.
`;
}
