import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadGovernance } from "../src/governance/index.js";
import { classifyInputs } from "../src/verification/changes.js";
import { collectChanges, verifyRepository } from "../src/verification/index.js";

const BIN = path.resolve(process.cwd(), "bin/pakemin.js");
const IDENTITY = {
  GIT_AUTHOR_NAME: "Pakemin Test",
  GIT_AUTHOR_EMAIL: "pakemin@example.com",
  GIT_COMMITTER_NAME: "Pakemin Test",
  GIT_COMMITTER_EMAIL: "pakemin@example.com",
  GIT_AUTHOR_DATE: "2020-01-01T00:00:00Z",
  GIT_COMMITTER_DATE: "2020-01-01T00:00:00Z"
};

const BASE = 'formatVersion: "0"\nscopes:\n  - id: repository\n    paths: ["**"]\n';
const REQUIRED_RULE = `${BASE}rules:\n  - id: repository.source-change-requires-tests\n    type: changed-path-requires-changed-path\n    scope: repository\n    when:\n      changedPaths:\n        include: ["src/**"]\n    require:\n      changedPaths:\n        include: ["test/**"]\n`;
const FORBIDDEN_RULE = `${BASE}rules:\n  - id: repository.protect-production\n    type: forbidden-paths\n    scope: repository\n    paths: ["infra/production/**"]\n`;
const REVIEW_RULE = `${BASE}rules:\n  - id: repository.ci-change-requires-review\n    type: changed-path-requires-review\n    scope: repository\n    paths: [".github/workflows/**"]\n`;
const BROKEN_RULE = `${BASE}rules:\n  - id: repository.future\n    type: future\n    scope: repository\n    paths: ["x"]\n`;
const AMBIGUOUS_SCOPES = 'formatVersion: "0"\nscopes:\n  - id: repository\n    paths: ["**"]\n  - id: app\n    parent: repository\n    paths: ["apps/**"]\n  - id: docs\n    parent: repository\n    paths: ["apps/docs/**"]\n';

function git(cwd, args) {
  const result = spawnSync("git", args, { cwd, env: { ...process.env, ...IDENTITY }, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function write(root, name, contents) { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, contents); }
function temporary(prefix) { return fs.mkdtempSync(path.join(os.tmpdir(), prefix)); }
function initRepo(yaml, files = {}) {
  const root = temporary("pakemin-check-");
  git(root, ["init", "-q"]);
  write(root, ".ai/pakemin.yaml", yaml);
  write(root, "placeholder.txt", "placeholder\n");
  for (const [name, contents] of Object.entries(files)) write(root, name, contents);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-qm", "base"]);
  return { root, base: git(root, ["rev-parse", "HEAD"]) };
}
function commitAll(root, message) { git(root, ["add", "-A"]); git(root, ["commit", "-qm", message]); return git(root, ["rev-parse", "HEAD"]); }
function emptyCommit(root, message) { git(root, ["commit", "--allow-empty", "-qm", message]); return git(root, ["rev-parse", "HEAD"]); }
function runCheck(root, args) { return spawnSync(process.execPath, [BIN, "check", root, ...args], { cwd: root, encoding: "utf8", env: { ...process.env, ...IDENTITY } }); }
function reportOf(result) { assert.equal(result.stderr, ""); return JSON.parse(result.stdout); }
function envelopeOf(result, exitCode) { assert.equal(result.status, exitCode); assert.equal(result.stdout, ""); return JSON.parse(result.stderr); }

test("check prints a pass report with explicit zero counts for an empty diff", () => {
  const { root, base } = initRepo(BASE);
  const target = emptyCommit(root, "empty");
  const result = runCheck(root, [`--baseline=${base}`, `--target=${target}`]);
  const report = reportOf(result);
  assert.equal(result.status, 0);
  assert.deepEqual(report, {
    contractVersion: "0",
    governanceSchemaVersion: "0",
    verificationMode: "repository",
    outcome: "pass",
    comparison: { source: "git", baseline: base, target, reproducible: true },
    changes: [],
    summary: { changes: 0, evaluations: 0, satisfied: 0, violated: 0, indeterminate: 0 },
    evaluations: []
  });
});

test("check prints the required-present pass report", () => {
  const { root, base } = initRepo(REQUIRED_RULE, { "src/app.js": "source\n", "test/app.test.js": "test\n" });
  write(root, "src/app.js", "source\nmore\n");
  write(root, "test/app.test.js", "test\nmore\n");
  const target = commitAll(root, "change");
  const before = git(root, ["status", "--porcelain"]);
  const result = runCheck(root, [`--baseline=${base}`, `--target=${target}`]);
  const report = reportOf(result);
  assert.equal(result.status, 0);
  assert.deepEqual(report, {
    contractVersion: "0",
    governanceSchemaVersion: "0",
    verificationMode: "repository",
    outcome: "pass",
    comparison: { source: "git", baseline: base, target, reproducible: true },
    changes: [{ kind: "modified", path: "src/app.js" }, { kind: "modified", path: "test/app.test.js" }],
    summary: { changes: 2, evaluations: 1, satisfied: 1, violated: 0, indeterminate: 0 },
    evaluations: [{
      ruleId: "repository.source-change-requires-tests",
      ruleType: "changed-path-requires-changed-path",
      state: "satisfied",
      reasonCode: "required-changed-path-present",
      scopeId: "repository",
      source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/rules/0" },
      affectedPaths: [{ path: "src/app.js", role: "path", changeKind: "modified" }, { path: "test/app.test.js", role: "path", changeKind: "modified" }],
      evidence: [{ kind: "required-match", path: "test/app.test.js", role: "path", changeKind: "modified", pattern: "test/**" }, { kind: "required-trigger", path: "src/app.js", role: "path", changeKind: "modified", pattern: "src/**" }],
      explanation: "Required changed path evidence is present."
    }]
  });
  assert.equal(git(root, ["status", "--porcelain"]), before);
  assert.equal(git(root, ["rev-parse", "HEAD"]), target);
});

test("check exits 1 for a missing required change", () => {
  const { root, base } = initRepo(REQUIRED_RULE, { "src/app.js": "source\n" });
  write(root, "src/app.js", "source\nmore\n");
  const target = commitAll(root, "source only");
  const result = runCheck(root, [`--baseline=${base}`, `--target=${target}`]);
  const report = reportOf(result);
  assert.equal(result.status, 1);
  assert.equal(report.outcome, "fail");
  assert.equal(report.evaluations[0].reasonCode, "required-changed-path-missing");
});

test("check exits 2 for a review-required workflow change", () => {
  const { root, base } = initRepo(REVIEW_RULE);
  write(root, ".github/workflows/ci.yml", "name: ci\n");
  const target = commitAll(root, "workflow");
  const result = runCheck(root, [`--baseline=${base}`, `--target=${target}`]);
  const report = reportOf(result);
  assert.equal(result.status, 2);
  assert.equal(report.outcome, "requires-review");
  assert.equal(report.evaluations[0].state, "indeterminate");
});

test("check prints a configuration envelope for broken governance", () => {
  const { root, base } = initRepo(BROKEN_RULE);
  const target = emptyCommit(root, "empty");
  const envelope = envelopeOf(runCheck(root, [`--baseline=${base}`, `--target=${target}`]), 3);
  assert.equal(envelope.contractVersion, "0");
  assert.equal(envelope.errorKind, "configuration");
  assert.equal(envelope.exitCode, 3);
  assert.equal("outcome" in envelope, false);
  assert.equal(envelope.errors.some((error) => error.code === "unknown-rule-type"), true);
});

test("check prints a configuration envelope for an ambiguous changed path", () => {
  const { root, base } = initRepo(AMBIGUOUS_SCOPES);
  write(root, "apps/docs/index.md", "docs\n");
  const target = commitAll(root, "ambiguous");
  const envelope = envelopeOf(runCheck(root, [`--baseline=${base}`, `--target=${target}`]), 3);
  assert.equal(envelope.errorKind, "configuration");
  assert.equal("outcome" in envelope, false);
  assert.equal(envelope.errors.some((error) => error.code === "ambiguous-scope-match"), true);
});

test("check prints an invalid-comparison envelope for a nonexistent baseline", () => {
  const { root } = initRepo(BASE);
  const target = emptyCommit(root, "empty");
  const envelope = envelopeOf(runCheck(root, ["--baseline=does-not-exist", `--target=${target}`]), 4);
  assert.equal(envelope.errorKind, "runtime");
  assert.equal(envelope.exitCode, 4);
  assert.equal("outcome" in envelope, false);
  assert.equal(envelope.errors[0].code, "invalid-comparison");
});

test("engine runtime envelopes stay closed and are unreachable from collected git sets", () => {
  const { root, base } = initRepo(REQUIRED_RULE);
  const loaded = loadGovernance(root);
  assert.equal(loaded.ok, true);
  const duplicate = verifyRepository(loaded.governance, { source: "git", baseline: base, target: base, reproducible: true }, [{ kind: "modified", path: "src/app.js" }, { kind: "modified", path: "src/app.js" }]);
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.errorKind, "runtime");
  assert.equal("outcome" in duplicate, false);

  git(root, ["mv", "placeholder.txt", "renamed.txt"]);
  write(root, "renamed.txt", "placeholder\nchanged\n");
  const target = commitAll(root, "rename");
  const collected = collectChanges(root, base, target);
  assert.equal(collected.ok, true);
  assert.equal(classifyInputs({ source: "git", baseline: base, target, reproducible: true }, collected.changes), null);
});

test("check requires explicit comparison flags", () => {
  const { root, base } = initRepo(BASE);
  const target = emptyCommit(root, "empty");
  const missingBaseline = envelopeOf(runCheck(root, [`--target=${target}`]), 4);
  assert.equal(missingBaseline.errors[0].code, "invalid-comparison");
  assert.equal(missingBaseline.errors[0].message, "invalid comparison: --baseline is required");
  const missingTarget = envelopeOf(runCheck(root, [`--baseline=${base}`]), 4);
  assert.equal(missingTarget.errors[0].message, "invalid comparison: --target or --working-tree is required");
  const bothTargets = envelopeOf(runCheck(root, [`--baseline=${base}`, `--target=${target}`, "--working-tree"]), 4);
  assert.equal(bothTargets.errors[0].message, "invalid comparison: --target and --working-tree are mutually exclusive");
});

test("check supports a non-reproducible working-tree comparison", () => {
  const { root, base } = initRepo(FORBIDDEN_RULE, { "infra/production/app.yaml": "production\n" });
  write(root, "infra/production/app.yaml", "changed\n");
  const result = runCheck(root, [`--baseline=${base}`, "--working-tree"]);
  const report = reportOf(result);
  assert.equal(result.status, 1);
  assert.equal(report.outcome, "fail");
  assert.deepEqual(report.comparison, { source: "git", baseline: base, target: "working-tree", reproducible: false });
});

test("check is deterministic across reruns", () => {
  const { root, base } = initRepo(REQUIRED_RULE);
  write(root, "src/app.js", "source\n");
  write(root, "test/app.test.js", "test\n");
  const target = commitAll(root, "change");
  const first = runCheck(root, [`--baseline=${base}`, `--target=${target}`]);
  const second = runCheck(root, [`--baseline=${base}`, `--target=${target}`]);
  assert.equal(first.stdout, second.stdout);
  assert.deepEqual(JSON.parse(first.stdout), JSON.parse(second.stdout));
});

test("check separates streams and never emits a partial report", () => {
  const { root, base } = initRepo(REQUIRED_RULE);
  write(root, "src/app.js", "source\n");
  const target = commitAll(root, "source only");
  const fail = runCheck(root, [`--baseline=${base}`, `--target=${target}`]);
  assert.equal(fail.status, 1);
  assert.equal(fail.stderr, "");
  assert.equal("exitCode" in JSON.parse(fail.stdout), false);

  const configuration = runCheck(root, ["--baseline=does-not-exist", `--target=${target}`]);
  assert.equal(configuration.status, 4);
  assert.equal(configuration.stdout, "");
  assert.equal("outcome" in JSON.parse(configuration.stderr), false);

  const missingFlags = runCheck(root, []);
  assert.equal(missingFlags.status, 4);
  assert.equal(missingFlags.stdout, "");
  assert.equal("outcome" in JSON.parse(missingFlags.stderr), false);
});