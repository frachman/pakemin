import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("package directory entrypoint can initialize a project from another cwd", () => {
  const root = tempProject();
  const result = runNode([repoRoot, "init", root], { cwd: os.tmpdir() });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Initialized Pakemin portable core/);
  assert.equal(fs.existsSync(path.join(root, ".ai/README.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".ai/templates/README.md")), true);
});

test("CLI smoke lifecycle covers init, adapters, validate, and doctor", () => {
  const root = tempProject();

  assert.equal(runPakemin(["init", root]).status, 0);

  const adapters = runPakemin(["adapters", "generate", root]);
  assert.equal(adapters.status, 0);
  assert.match(adapters.stdout, /Generated Pakemin adapters/);

  const list = runPakemin(["adapters", "list", root]);
  assert.equal(list.status, 0);
  assert.match(list.stdout, /agents\tfound\tAGENTS.md/);
  assert.match(list.stdout, /copilot\tfound\t.github\/copilot-instructions.md/);

  const validate = runPakemin(["validate", root, "--adapters"]);
  assert.equal(validate.status, 0);
  assert.match(validate.stdout, /Pakemin validation passed/);

  const doctor = runPakemin(["doctor", root]);
  assert.equal(doctor.status, 0);
  assert.match(doctor.stdout, /Portable core: found/);
});

test("init dry-run reports files without writing them", () => {
  const root = tempProject();
  const result = runPakemin(["init", root, "--dry-run"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /dry-run: .ai\/README.md/);
  assert.equal(fs.existsSync(path.join(root, ".ai/README.md")), false);
});

test("init force overwrites existing portable core files", () => {
  const root = tempProject();
  const readme = path.join(root, ".ai/README.md");
  fs.mkdirSync(path.dirname(readme), { recursive: true });
  fs.writeFileSync(readme, "custom\n");

  const result = runPakemin(["init", root, "--force"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /created: .ai\/README.md/);
  assert.match(fs.readFileSync(readme, "utf8"), /# Portable Core/);
});

test("adapters generate fails before init", () => {
  const root = tempProject();
  const result = runPakemin(["adapters", "generate", root]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /\.ai\/README.md was not found/);
  assert.equal(fs.existsSync(path.join(root, "AGENTS.md")), false);
});

function runPakemin(args, options = {}) {
  return runNode([path.join(repoRoot, "bin/pakemin.js"), ...args], options);
}

function runNode(args, options = {}) {
  return spawnSync(process.execPath, args, {
    cwd: options.cwd || repoRoot,
    encoding: "utf8"
  });
}

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pakemin-smoke-"));
}
