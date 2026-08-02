import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runCli, validateProject } from "../src/cli.js";

const packageJson = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")
);

test("version reports package version", async () => {
  const root = tempProject();
  const io = memoryIo(root);

  const exitCode = await runCli(["--version"], io);

  assert.equal(exitCode, 0);
  assert.equal(io.stdout.text, `${packageJson.version}\n`);
});

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

test("init creates a missing target directory", async () => {
  const parent = tempProject();
  const root = path.join(parent, "new-project");
  const io = memoryIo(parent);

  const exitCode = await runCli(["init", root], io);

  assert.equal(exitCode, 0);
  assert.equal(fs.existsSync(root), true);
  assert.equal(fs.existsSync(path.join(root, ".ai/README.md")), true);
});

test("init reports a clear error when target path is a file", async () => {
  const parent = tempProject();
  const root = path.join(parent, "target-file");
  fs.writeFileSync(root, "not a directory\n");
  const io = memoryIo(parent);

  const exitCode = await runCli(["init", root], io);

  assert.equal(exitCode, 1);
  assert.match(io.stderr.text, /target path exists but is not a directory/);
  assert.doesNotMatch(io.stderr.text, /EEXIST|ENOTDIR/);
});

test("init reports a clear error when target path is a dangling symlink", async (t) => {
  const parent = tempProject();
  const root = path.join(parent, "dangling-link");
  const missingTarget = path.join(parent, "missing-target");

  try {
    fs.symlinkSync(missingTarget, root);
  } catch {
    t.skip("symlinks are not available in this environment");
    return;
  }

  const io = memoryIo(parent);
  const exitCode = await runCli(["init", root], io);

  assert.equal(exitCode, 1);
  assert.match(io.stderr.text, /unable to create target directory/);
  assert.doesNotMatch(io.stderr.text, /ENOENT|EEXIST/);
});

test("init auto preset does not crash when target directory is missing", async () => {
  const parent = tempProject();
  const root = path.join(parent, "new-project");
  const io = memoryIo(parent);

  const exitCode = await runCli(["init", root, "--preset=auto"], io);

  assert.equal(exitCode, 0);
  assert.equal(fs.existsSync(path.join(root, ".ai/README.md")), true);
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

test("init reports a clear error when a path segment is a file", async () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, ".ai"), "not a directory\n");
  const io = memoryIo(root);

  const exitCode = await runCli(["init", root], io);

  assert.equal(exitCode, 1);
  assert.match(
    io.stderr.text,
    /unable to write .ai\/README.md: a path segment exists as a file, not a directory/
  );
  assert.doesNotMatch(io.stderr.text, /EEXIST|ENOTDIR/);
});

test("init force value flag overwrites existing portable core files", async () => {
  const root = tempProject();
  fs.mkdirSync(path.join(root, ".ai"), { recursive: true });
  fs.writeFileSync(path.join(root, ".ai/README.md"), "custom\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["init", root, "--force=true"], io);

  assert.equal(exitCode, 0);
  assert.notEqual(fs.readFileSync(path.join(root, ".ai/README.md"), "utf8"), "custom\n");
  assert.match(io.stdout.text, /created: .ai\/README.md/);
});

test("init dry-run value flag does not write files", async () => {
  const parent = tempProject();
  const root = path.join(parent, "dry-run-project");
  const io = memoryIo(parent);

  const exitCode = await runCli(["init", root, "--dry-run=true"], io);

  assert.equal(exitCode, 0);
  assert.match(io.stdout.text, /dry-run: .ai\/README.md/);
  assert.doesNotMatch(io.stdout.text, /created:/);
  assert.equal(fs.existsSync(path.join(root, ".ai/README.md")), false);
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

test("init combines auto presets with explicit presets", async () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "go.mod"), "module example.com/app\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["init", root, "--preset=auto,rust"], io);

  assert.equal(exitCode, 0);
  assert.match(io.stdout.text, /Applied presets: go, rust/);

  const technologyStack = fs.readFileSync(
    path.join(root, ".ai/context/technology-stack.md"),
    "utf8"
  );
  assert.match(technologyStack, /Go project detected/);
  assert.match(technologyStack, /Rust project detected/);
});

test("init applies explicit presets when auto detects nothing", async () => {
  const root = tempProject();

  const io = memoryIo(root);
  const exitCode = await runCli(["init", root, "--preset=auto,rust"], io);

  assert.equal(exitCode, 0);
  assert.match(
    fs.readFileSync(path.join(root, ".ai/context/technology-stack.md"), "utf8"),
    /Rust project detected/
  );
});

test("init auto preset alone only applies detected presets", async () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "go.mod"), "module example.com/app\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["init", root, "--preset=auto"], io);

  assert.equal(exitCode, 0);
  assert.match(io.stdout.text, /Applied presets: go/);
  assert.doesNotMatch(
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

test("init rejects unknown presets when combined with known presets", async () => {
  const root = tempProject();
  const io = memoryIo(root);

  const exitCode = await runCli(["init", root, "--preset=rust,unknown-lang"], io);

  assert.equal(exitCode, 1);
  assert.match(io.stderr.text, /unknown preset id\(s\): unknown-lang/);
});

test("init warns when preset flag has no value", async () => {
  const root = tempProject();
  const io = memoryIo(root);

  const exitCode = await runCli(["init", root, "--preset"], io);

  assert.equal(exitCode, 0);
  assert.match(
    io.stdout.text,
    /warning: --preset was provided with no value; no preset was applied/
  );
  assert.equal(fs.existsSync(path.join(root, ".ai/context/technology-stack.md")), false);
});

test("init warns when preset value is empty", async () => {
  const root = tempProject();
  const io = memoryIo(root);

  const exitCode = await runCli(["init", root, "--preset="], io);

  assert.equal(exitCode, 0);
  assert.match(
    io.stdout.text,
    /warning: --preset was provided with no value; no preset was applied/
  );
  assert.equal(fs.existsSync(path.join(root, ".ai/context/technology-stack.md")), false);
});

test("init warns when preset value is whitespace only", async () => {
  const root = tempProject();
  const io = memoryIo(root);

  const exitCode = await runCli(["init", root, "--preset=   "], io);

  assert.equal(exitCode, 0);
  assert.match(
    io.stdout.text,
    /warning: --preset was provided with no value; no preset was applied/
  );
  assert.equal(fs.existsSync(path.join(root, ".ai/context/technology-stack.md")), false);
});

test("init does not warn when preset has a value", async () => {
  const root = tempProject();
  const io = memoryIo(root);

  const exitCode = await runCli(["init", root, "--preset=node"], io);

  assert.equal(exitCode, 0);
  assert.doesNotMatch(io.stdout.text, /warning: --preset was provided with no value/);
  assert.match(
    fs.readFileSync(path.join(root, ".ai/context/technology-stack.md"), "utf8"),
    /Node.js project detected/
  );
});

test("doctor reports detected stacks", async () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "pom.xml"), "<project></project>\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["doctor", root], io);

  assert.equal(exitCode, 0);
  assert.match(io.stdout.text, /detected: java \(pom.xml\)/);
});

test("doctor reports a clear error for missing target directory", async () => {
  const parent = tempProject();
  const root = path.join(parent, "missing-project");
  const io = memoryIo(parent);

  const exitCode = await runCli(["doctor", root], io);

  assert.equal(exitCode, 1);
  assert.match(io.stderr.text, /target path does not exist/);
});

test("doctor reports a clear error when target path is a file", async () => {
  const parent = tempProject();
  const root = path.join(parent, "target-file");
  fs.writeFileSync(root, "not a directory\n");
  const io = memoryIo(parent);

  const exitCode = await runCli(["doctor", root], io);

  assert.equal(exitCode, 1);
  assert.match(io.stderr.text, /target path exists but is not a directory/);
  assert.doesNotMatch(io.stderr.text, /EEXIST|ENOTDIR/);
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

test("adapters generate force value flag overwrites existing adapter files", async () => {
  const root = tempProject();
  await runCli(["init", root], memoryIo(root));
  fs.writeFileSync(path.join(root, "AGENTS.md"), "custom\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["adapters", "generate", root, "--force=true"], io);

  assert.equal(exitCode, 0);
  assert.notEqual(fs.readFileSync(path.join(root, "AGENTS.md"), "utf8"), "custom\n");
  assert.match(io.stdout.text, /created: AGENTS.md/);
});

test("adapters generate warns when only flag has no value", async () => {
  const root = tempProject();
  await runCli(["init", root], memoryIo(root));

  const io = memoryIo(root);
  const exitCode = await runCli(["adapters", "generate", root, "--only"], io);

  assert.equal(exitCode, 0);
  assert.match(
    io.stdout.text,
    /warning: --only was provided with no value; all adapters will be generated/
  );
  assert.equal(fs.existsSync(path.join(root, "AGENTS.md")), true);
  assert.equal(fs.existsSync(path.join(root, "CLAUDE.md")), true);
  assert.equal(fs.existsSync(path.join(root, "GEMINI.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".cursor/rules/pakemin.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".github/copilot-instructions.md")), true);
});

test("adapters generate warns when only value is empty", async () => {
  const root = tempProject();
  await runCli(["init", root], memoryIo(root));

  const io = memoryIo(root);
  const exitCode = await runCli(["adapters", "generate", root, "--only="], io);

  assert.equal(exitCode, 0);
  assert.match(
    io.stdout.text,
    /warning: --only was provided with no value; all adapters will be generated/
  );
  assert.equal(fs.existsSync(path.join(root, "AGENTS.md")), true);
  assert.equal(fs.existsSync(path.join(root, "CLAUDE.md")), true);
  assert.equal(fs.existsSync(path.join(root, "GEMINI.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".cursor/rules/pakemin.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".github/copilot-instructions.md")), true);
});

test("adapters generate warns when only value is whitespace only", async () => {
  const root = tempProject();
  await runCli(["init", root], memoryIo(root));

  const io = memoryIo(root);
  const exitCode = await runCli(["adapters", "generate", root, "--only=   "], io);

  assert.equal(exitCode, 0);
  assert.match(
    io.stdout.text,
    /warning: --only was provided with no value; all adapters will be generated/
  );
  assert.equal(fs.existsSync(path.join(root, "AGENTS.md")), true);
  assert.equal(fs.existsSync(path.join(root, "CLAUDE.md")), true);
  assert.equal(fs.existsSync(path.join(root, "GEMINI.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".cursor/rules/pakemin.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".github/copilot-instructions.md")), true);
});

test("adapters generate does not warn when only has a value", async () => {
  const root = tempProject();
  await runCli(["init", root], memoryIo(root));

  const io = memoryIo(root);
  const exitCode = await runCli(["adapters", "generate", root, "--only=agents"], io);

  assert.equal(exitCode, 0);
  assert.doesNotMatch(io.stdout.text, /warning: --only was provided with no value/);
  assert.equal(fs.existsSync(path.join(root, "AGENTS.md")), true);
  assert.equal(fs.existsSync(path.join(root, "CLAUDE.md")), false);
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

test("validate adapters value flag requires supported adapters", async () => {
  const root = tempProject();
  await runCli(["init", root], memoryIo(root));

  const io = memoryIo(root);
  const exitCode = await runCli(["validate", root, "--adapters=true"], io);

  assert.equal(exitCode, 1);
  assert.match(io.stdout.text, /AGENTS.md is missing/);
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
    result.errors.includes(
      "docs/adr/bad-name.md should follow the Pakemin ADR filename convention: 0001-kebab-case.md"
    )
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

test("validate accepts relative Markdown links with query strings", async () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "README.md"), "[With query](./target.md?foo=bar)\n");
  fs.writeFileSync(path.join(root, "target.md"), "# Target\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["validate", root, "--links-only"], io);

  assert.equal(exitCode, 0);
  assert.match(io.stdout.text, /Pakemin validation passed/);
});

test("validate detects broken relative Markdown links with query strings", async () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "README.md"), "[Missing](./missing.md?foo=bar)\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["validate", root, "--links-only"], io);

  assert.equal(exitCode, 1);
  assert.match(io.stdout.text, /links to missing target .\/missing.md\?foo=bar/);
});

test("validate can run in links-only mode", async () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "README.md"), "# Docs\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["validate", root, "--links-only"], io);

  assert.equal(exitCode, 0);
  assert.match(io.stdout.text, /Pakemin validation passed/);
});

test("validate links-only value flag does not require starter documents", async () => {
  const root = tempProject();
  fs.writeFileSync(path.join(root, "README.md"), "# Docs\n");

  const io = memoryIo(root);
  const exitCode = await runCli(["validate", root, "--links-only=true"], io);

  assert.equal(exitCode, 0);
  assert.match(io.stdout.text, /Pakemin validation passed/);
});

test("validate reports a clear error when target path is a file", async () => {
  const parent = tempProject();
  const root = path.join(parent, "target-file");
  fs.writeFileSync(root, "not a directory\n");
  const io = memoryIo(parent);

  const exitCode = await runCli(["validate", root], io);

  assert.equal(exitCode, 1);
  assert.match(io.stderr.text, /target path exists but is not a directory/);
  assert.doesNotMatch(io.stderr.text, /EEXIST|ENOTDIR/);
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
