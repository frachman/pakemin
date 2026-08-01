import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runCli, validateProject } from "../src/cli.js";

test("init creates the portable core", async () => {
  const root = tempProject();
  const io = memoryIo(root);

  const exitCode = await runCli(["init", root], io);

  assert.equal(exitCode, 0);
  assert.equal(fs.existsSync(path.join(root, ".ai/README.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".ai/context/README.md")), true);
  assert.match(io.stdout.text, /Initialized Pakemin portable core/);
});

test("init does not overwrite by default", async () => {
  const root = tempProject();
  fs.mkdirSync(path.join(root, ".ai/context"), { recursive: true });
  fs.writeFileSync(path.join(root, ".ai/README.md"), "custom\n");
  fs.writeFileSync(path.join(root, ".ai/context/README.md"), "custom\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["init", root], io);

  assert.equal(exitCode, 1);
  assert.equal(fs.readFileSync(path.join(root, ".ai/README.md"), "utf8"), "custom\n");
  assert.match(io.stdout.text, /exists: .ai\/README.md/);
});

test("adapters generate creates thin adapter files", async () => {
  const root = tempProject();
  await runCli(["init", root], memoryIo(root));

  const io = memoryIo(root);
  const exitCode = await runCli(["adapters", "generate", root], io);

  assert.equal(exitCode, 0);
  assert.equal(fs.existsSync(path.join(root, "AGENTS.md")), true);
  assert.equal(fs.existsSync(path.join(root, "CLAUDE.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".cursor/rules/pakemin.md")), true);
  assert.match(io.stdout.text, /Generated Pakemin adapters/);
});

test("validate fails when portable core is missing", () => {
  const root = tempProject();
  const result = validateProject(root);

  assert.ok(result.errors.includes(".ai/README.md is missing"));
  assert.ok(result.errors.includes(".ai/context/README.md is missing"));
});

test("validate detects broken relative Markdown links", async () => {
  const root = tempProject();
  await runCli(["init", root], memoryIo(root));
  fs.writeFileSync(path.join(root, "README.md"), "[Missing](docs/missing.md)\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["validate", root], io);

  assert.equal(exitCode, 1);
  assert.match(io.stdout.text, /links to missing target docs\/missing.md/);
});

test("validate can run in links-only mode", async () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "README.md"), "# Docs\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["validate", root, "--links-only"], io);

  assert.equal(exitCode, 0);
  assert.match(io.stdout.text, /Pakemin validation passed/);
});

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pakemin-test-"));
}

function memoryIo(cwd) {
  return {
    cwd,
    stdout: memoryStream(),
    stderr: memoryStream()
  };
}

function memoryStream() {
  return {
    text: "",
    write(value) {
      this.text += value;
    }
  };
}
