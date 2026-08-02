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
  assert.equal(fs.existsSync(path.join(root, ".ai/context/project.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".ai/rules/ai-agents.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".ai/templates/requirement.md")), true);
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

test("init reports detected stacks without applying presets by default", async () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "go.mod"), "module example.com/app\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["init", root], io);

  assert.equal(exitCode, 0);
  assert.match(io.stdout.text, /detected: go \(go.mod\)/);
  assert.match(io.stdout.text, /Suggested next step: pakemin init --preset=<id>/);
  assert.equal(fs.existsSync(path.join(root, ".ai/context/technology-stack.md")), false);
});

test("init applies an explicit language preset", async () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "go.mod"), "module example.com/app\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["init", root, "--preset=go"], io);

  assert.equal(exitCode, 0);
  assert.match(io.stdout.text, /Applied presets: go/);
  assert.match(
    fs.readFileSync(path.join(root, ".ai/context/technology-stack.md"), "utf8"),
    /Go project detected/
  );
  assert.match(
    fs.readFileSync(path.join(root, ".ai/rules/testing.md"), "utf8"),
    /go test \.\/\.\.\./
  );
});

test("init applies auto presets for detected stacks", async () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "package.json"), "{}\n");
  fs.writeFileSync(path.join(root, "Cargo.toml"), "[package]\nname = \"demo\"\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["init", root, "--preset=auto"], io);

  assert.equal(exitCode, 0);
  assert.match(io.stdout.text, /Applied presets: node, rust/);
  assert.match(
    fs.readFileSync(path.join(root, ".ai/context/technology-stack.md"), "utf8"),
    /Node.js project detected/
  );
  assert.match(
    fs.readFileSync(path.join(root, ".ai/context/technology-stack.md"), "utf8"),
    /Rust project detected/
  );
});

test("init detects wildcard language markers", async () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "Demo.csproj"), "<Project></Project>\n");
  fs.writeFileSync(path.join(root, "pakemin.gemspec"), "Gem::Specification.new\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["init", root, "--preset=auto"], io);

  assert.equal(exitCode, 0);
  assert.match(io.stdout.text, /detected: dotnet \(\*.csproj\)/);
  assert.match(io.stdout.text, /detected: ruby \(\*.gemspec\)/);
  assert.match(io.stdout.text, /Applied presets: dotnet, ruby/);

  const technologyStack = fs.readFileSync(
    path.join(root, ".ai/context/technology-stack.md"),
    "utf8"
  );
  assert.match(technologyStack, /\.NET project detected/);
  assert.match(technologyStack, /Ruby project detected/);
});

test("init rejects unknown presets", async () => {
  const root = tempProject();
  const io = memoryIo(root);

  const exitCode = await runCli(["init", root, "--preset=elixir"], io);

  assert.equal(exitCode, 1);
  assert.match(io.stderr.text, /unknown preset id/);
});

test("doctor reports detected stacks", async () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "pom.xml"), "<project></project>\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["doctor", root], io);

  assert.equal(exitCode, 0);
  assert.match(io.stdout.text, /detected: java \(pom.xml\)/);
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

test("adapters list reports supported adapter status", async () => {
  const root = tempProject();
  await runCli(["init", root], memoryIo(root));
  await runCli(["adapters", "generate", root, "--only=agents"], memoryIo(root));

  const io = memoryIo(root);
  const exitCode = await runCli(["adapters", "list", root], io);

  assert.equal(exitCode, 0);
  assert.match(io.stdout.text, /agents\tfound\tAGENTS.md/);
  assert.match(io.stdout.text, /claude\tmissing\tCLAUDE.md/);
});

test("adapters generate can select adapters by id", async () => {
  const root = tempProject();
  await runCli(["init", root], memoryIo(root));

  const io = memoryIo(root);
  const exitCode = await runCli(["adapters", "generate", root, "--only=claude,gemini"], io);

  assert.equal(exitCode, 0);
  assert.equal(fs.existsSync(path.join(root, "AGENTS.md")), false);
  assert.equal(fs.existsSync(path.join(root, "CLAUDE.md")), true);
  assert.equal(fs.existsSync(path.join(root, "GEMINI.md")), true);
});

test("validate can require supported adapters", async () => {
  const root = tempProject();
  await runCli(["init", root], memoryIo(root));

  const missingIo = memoryIo(root);
  const missingExitCode = await runCli(["validate", root, "--adapters"], missingIo);

  assert.equal(missingExitCode, 1);
  assert.match(missingIo.stdout.text, /AGENTS.md is missing/);

  await runCli(["adapters", "generate", root], memoryIo(root));

  const validIo = memoryIo(root);
  const validExitCode = await runCli(["validate", root, "--adapters"], validIo);

  assert.equal(validExitCode, 0);
  assert.match(validIo.stdout.text, /Pakemin validation passed/);
});

test("validate requires v1 starter documents", async () => {
  const root = tempProject();
  await runCli(["init", root], memoryIo(root));
  fs.rmSync(path.join(root, ".ai/templates/task.md"));

  const result = validateProject(root);

  assert.ok(result.errors.includes(".ai/templates/task.md is missing"));
});

test("validate checks ADR filename convention", () => {
  const root = tempProject();
  fs.mkdirSync(path.join(root, "docs/adr"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs/adr/bad-name.md"), "# Bad ADR\n");

  const result = validateProject(root, { requireCore: false });

  assert.ok(
    result.errors.includes("docs/adr/bad-name.md should use a numeric kebab-case ADR filename")
  );
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
