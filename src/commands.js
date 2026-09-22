import path from "node:path";
import process from "node:process";

import { ADAPTERS } from "./catalog.js";
import { coreFiles, presetFiles } from "./content.js";
import { selectAdapters } from "./adapters.js";
import { ensureDirectory, exists, isDirectory, resolveTarget, writeFiles } from "./fs-utils.js";
import { loadGovernance } from "./governance/index.js";
import { detectLanguages, reportDetection, selectPresets } from "./languages.js";
import { isFlagSet, parseOptions } from "./options.js";
import { reportWriteResult, write } from "./output.js";
import { validateProject } from "./validation.js";
import { collectChanges, resolveComparison, verifyRepository } from "./verification/index.js";
import { configurationEnvelope, runtimeEnvelope, runtimeError } from "./verification/changes.js";

export function initCommand(args, io) {
  const options = parseOptions(args);
  const root = resolveTarget(io.cwd, options.positionals[0] || ".");
  const force = isFlagSet(options, "force");
  const dryRun = isFlagSet(options, "dry-run");

  if (exists(root) && !isDirectory(root)) {
    write(io.stderr, `Error: target path exists but is not a directory: ${root}\n`);
    return 1;
  }

  if (!dryRun) {
    ensureDirectory(root);
  }

  const detected = detectLanguages(root);
  const presets = selectPresets(options.values.preset, detected);
  const files = coreFiles();

  if (isFlagSet(options, "preset") && !options.values.preset?.trim()) {
    write(io.stdout, "warning: --preset was provided with no value; no preset was applied\n");
  }

  if (presets.length > 0) {
    files.push(...presetFiles(presets));
  }

  const result = writeFiles(root, files, { force, dryRun });
  reportWriteResult(io.stdout, "Initialized Pakemin portable core", result);
  reportDetection(io.stdout, detected, presets);
  return result.blocked.length > 0 ? 1 : 0;
}

export function validateCommand(args, io) {
  const options = parseOptions(args);
  const root = resolveTarget(io.cwd, options.positionals[0] || ".");

  if (!exists(root)) {
    write(io.stderr, `Error: target path does not exist: ${root}\n`);
    return 1;
  }

  if (exists(root) && !isDirectory(root)) {
    write(io.stderr, `Error: target path exists but is not a directory: ${root}\n`);
    return 1;
  }

  const result = validateProject(root, {
    requireCore: !isFlagSet(options, "links-only"),
    requireAdapters: isFlagSet(options, "adapters")
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

export function adaptersGenerateCommand(args, io) {
  const options = parseOptions(args);
  const root = resolveTarget(io.cwd, options.positionals[0] || ".");
  const force = isFlagSet(options, "force");
  const dryRun = isFlagSet(options, "dry-run");
  const adapters = selectAdapters(options.values.only);

  if (isFlagSet(options, "only") && !options.values.only?.trim()) {
    write(io.stdout, "warning: --only was provided with no value; the default adapter profile will be generated\n");
  }

  if (!exists(path.join(root, ".ai/README.md"))) {
    write(io.stderr, "Error: .ai/README.md was not found. Run `pakemin init` first.\n");
    return 1;
  }

  const result = writeFiles(root, adapters, { force, dryRun });
  reportWriteResult(io.stdout, "Generated Pakemin adapters", result);
  return result.blocked.length > 0 ? 1 : 0;
}

export function adaptersListCommand(args, io) {
  const options = parseOptions(args);
  const root = resolveTarget(io.cwd, options.positionals[0] || ".");

  for (const adapter of ADAPTERS) {
    const status = exists(path.join(root, adapter.file)) ? "found" : "missing";
    write(io.stdout, `${adapter.id}\t${adapter.role}\t${status}\t${adapter.file}\n`);
  }

  return 0;
}

export function checkCommand(args, io) {
  const options = parseOptions(args);
  const root = resolveTarget(io.cwd, options.positionals[0] || ".");
  const hasBaseline = isFlagSet(options, "baseline");
  const hasTarget = isFlagSet(options, "target");
  const workingTree = isFlagSet(options, "working-tree");

  const knownOptions = new Set(["baseline", "target", "working-tree"]);
  const unknownOptions = [...new Set([...options.flags, ...Object.keys(options.values)])].filter((key) => !knownOptions.has(key));
  if (unknownOptions.length > 0) return emitEnvelope(io, runtimeEnvelope(unknownOptions.map((key) => runtimeError("invalid-comparison", `unknown option: --${key}`))));

  if (options.positionals.length > 1) {
    return emitEnvelope(io, runtimeEnvelope(options.positionals.slice(1).map((argument) => runtimeError("invalid-comparison", `unexpected argument: ${argument}`))));
  }

  const errors = [];
  if (!hasBaseline) errors.push(runtimeError("invalid-comparison", "invalid comparison: --baseline is required"));
  else if (!options.values.baseline?.trim()) errors.push(runtimeError("invalid-comparison", "invalid comparison: --baseline requires a value"));
  if (workingTree && hasTarget) errors.push(runtimeError("invalid-comparison", "invalid comparison: --target and --working-tree are mutually exclusive"));
  else if (!workingTree && !hasTarget) errors.push(runtimeError("invalid-comparison", "invalid comparison: --target or --working-tree is required"));
  else if (!workingTree && !options.values.target?.trim()) errors.push(runtimeError("invalid-comparison", "invalid comparison: --target requires a value"));
  if (errors.length) return emitEnvelope(io, runtimeEnvelope(errors));

  if (!exists(root)) {
    write(io.stderr, `Error: target path does not exist: ${root}\n`);
    return 1;
  }

  if (exists(root) && !isDirectory(root)) {
    write(io.stderr, `Error: target path exists but is not a directory: ${root}\n`);
    return 1;
  }

  const loaded = loadGovernance(root);
  if (!loaded.ok) return emitEnvelope(io, configurationEnvelope(loaded.errors));

  const target = workingTree ? "working-tree" : options.values.target;
  const resolved = resolveComparison(root, options.values.baseline, target);
  if (!resolved.ok) return emitEnvelope(io, runtimeEnvelope(resolved.errors));

  const collected = collectChanges(root, options.values.baseline, target);
  if (!collected.ok) return emitEnvelope(io, runtimeEnvelope(collected.errors));

  const result = verifyRepository(loaded.governance, resolved.comparison, collected.changes);
  if (!result.ok) return emitEnvelope(io, result);

  write(io.stdout, `${JSON.stringify(result.report, null, 2)}\n`);
  return { pass: 0, fail: 1, "requires-review": 2 }[result.report.outcome];
}

export function doctorCommand(args, io) {
  const options = parseOptions(args);
  const root = resolveTarget(io.cwd, options.positionals[0] || ".");

  if (!exists(root)) {
    write(io.stderr, `Error: target path does not exist: ${root}\n`);
    return 1;
  }

  if (!isDirectory(root)) {
    write(io.stderr, `Error: target path exists but is not a directory: ${root}\n`);
    return 1;
  }

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

function emitEnvelope(io, envelope) {
  const { ok, ...display } = envelope;
  write(io.stderr, `${JSON.stringify(display, null, 2)}\n`);
  return envelope.exitCode;
}
