import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { classifyInputs } from "../src/verification/changes.js";
import { collectChanges, resolveComparison } from "../src/verification/index.js";

const IDENTITY = {
  GIT_AUTHOR_NAME: "Pakemin Test",
  GIT_AUTHOR_EMAIL: "pakemin@example.com",
  GIT_COMMITTER_NAME: "Pakemin Test",
  GIT_COMMITTER_EMAIL: "pakemin@example.com",
  GIT_AUTHOR_DATE: "2020-01-01T00:00:00Z",
  GIT_COMMITTER_DATE: "2020-01-01T00:00:00Z"
};

function git(cwd, args, env = process.env) {
  const result = spawnSync("git", args, { cwd, env: { ...process.env, ...env }, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function write(root, name, contents) { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, contents); }
function temporary(prefix) { return fs.mkdtempSync(path.join(os.tmpdir(), prefix)); }

function baseRepository() {
  const root = temporary("pakemin-collection-");
  git(root, ["init", "-q"], IDENTITY);
  write(root, "old-name.txt", Array.from({ length: 200 }, (_, index) => `line-${index}\n`).join(""));
  write(root, "modify.txt", "before\n");
  write(root, "delete.txt", "gone\n");
  write(root, "keep.txt", "keep\n");
  git(root, ["add", "-A"], IDENTITY);
  git(root, ["commit", "-qm", "base"], IDENTITY);
  const baseline = git(root, ["rev-parse", "HEAD"], IDENTITY);
  write(root, "added.txt", "new\n");
  write(root, "modify.txt", "after\n");
  fs.rmSync(path.join(root, "delete.txt"));
  git(root, ["mv", "old-name.txt", "new-name.txt"], IDENTITY);
  fs.appendFileSync(path.join(root, "new-name.txt"), "tail\n");
  git(root, ["add", "-A"], IDENTITY);
  git(root, ["commit", "-qm", "second"], IDENTITY);
  const target = git(root, ["rev-parse", "HEAD"], IDENTITY);
  return { root, baseline, target };
}

test("collects added, modified, deleted, and renamed entries as normalized data", () => {
  const { root, baseline, target } = baseRepository();
  const before = git(root, ["status", "--porcelain"], IDENTITY);
  assert.deepEqual(collectChanges(root, baseline, target), { ok: true, changes: [
    { kind: "added", path: "added.txt" },
    { kind: "deleted", path: "delete.txt" },
    { kind: "modified", path: "modify.txt" },
    { kind: "renamed", oldPath: "old-name.txt", newPath: "new-name.txt" }
  ] });
  assert.equal(git(root, ["status", "--porcelain"], IDENTITY), before);
  assert.equal(git(root, ["rev-parse", "HEAD"], IDENTITY), target);
});

test("resolves a comparison to full commit object IDs", () => {
  const { root, baseline, target } = baseRepository();
  assert.deepEqual(resolveComparison(root, baseline, target), { ok: true, comparison: { source: "git", baseline, target, reproducible: true } });
  assert.deepEqual(resolveComparison(root, baseline, "working-tree"), { ok: true, comparison: { source: "git", baseline, target: "working-tree", reproducible: false } });
});

test("returns an empty change set when baseline equals target", () => {
  const { root, target } = baseRepository();
  assert.deepEqual(collectChanges(root, target, target), { ok: true, changes: [] });
});

test("collects working-tree changes without a target revision", () => {
  const { root, baseline } = baseRepository();
  write(root, "later.txt", "uncommitted\n");
  write(root, "modify.txt", "working\n");
  assert.deepEqual(collectChanges(root, baseline, "working-tree"), { ok: true, changes: [
    { kind: "added", path: "added.txt" },
    { kind: "deleted", path: "delete.txt" },
    { kind: "modified", path: "modify.txt" },
    { kind: "renamed", oldPath: "old-name.txt", newPath: "new-name.txt" }
  ] });
});

test("reports a non-resolving revision as invalid-comparison", () => {
  const { root, target } = baseRepository();
  const result = collectChanges(root, "not-a-revision", target);
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, [{ code: "invalid-comparison", message: "baseline revision does not resolve: not-a-revision" }]);
  assert.equal(collectChanges(root, target, "not-a-revision").errors[0].code, "invalid-comparison");
});

test("reports a path outside any git work tree as change-collection-failed", () => {
  const outside = temporary("pakemin-outside-");
  const result = collectChanges(outside, "HEAD", "HEAD");
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors.map((error) => error.code), ["change-collection-failed"]);
});

test("reports a corrupt git environment as change-collection-failed", () => {
  const { root, baseline, target } = baseRepository();
  const previous = process.env.GIT_DIR;
  process.env.GIT_DIR = path.join(temporary("pakemin-gitdir-"), "missing");
  try {
    const result = collectChanges(root, baseline, target);
    assert.equal(result.ok, false);
    assert.deepEqual(result.errors.map((error) => error.code), ["change-collection-failed"]);
  } finally {
    if (previous === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = previous;
  }
});

test("the prescribed diff command never emits copy status", () => {
  const root = temporary("pakemin-copies-");
  git(root, ["init", "-q"], IDENTITY);
  write(root, "copy-src.txt", "source\n");
  git(root, ["add", "-A"], IDENTITY);
  git(root, ["commit", "-qm", "source"], IDENTITY);
  const baseline = git(root, ["rev-parse", "HEAD"], IDENTITY);
  write(root, "copy-dst.txt", "source\n");
  git(root, ["add", "-A"], IDENTITY);
  git(root, ["commit", "-qm", "copy"], IDENTITY);
  const target = git(root, ["rev-parse", "HEAD"], IDENTITY);
  assert.equal(git(root, ["diff", "-C", "-C", "--find-copies-harder", "--name-status", baseline, target], IDENTITY).includes("C"), true);
  const result = collectChanges(root, baseline, target);
  assert.deepEqual(result, { ok: true, changes: [{ kind: "added", path: "copy-dst.txt" }] });
  assert.deepEqual([...new Set(result.changes.map((change) => change.kind))].sort(), ["added"]);
});

test("collector output always passes Slice 3 change-set validation", () => {
  const { root, baseline, target } = baseRepository();
  const committed = collectChanges(root, baseline, target);
  assert.equal(classifyInputs({ source: "git", baseline, target, reproducible: true }, committed.changes), null);
  write(root, "later.txt", "uncommitted\n");
  const working = collectChanges(root, baseline, "working-tree");
  assert.equal(classifyInputs({ source: "git", baseline, target: "working-tree", reproducible: false }, working.changes), null);
});