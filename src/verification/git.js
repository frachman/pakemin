import { spawnSync } from "node:child_process";

import { runtimeError } from "./changes.js";

const KIND_BY_STATUS = { A: "added", M: "modified", D: "deleted" };

export function resolveComparison(root, baseline, target) {
  const repository = resolveRepository(root);
  if (!repository.ok) return repository;

  const baselineCommit = resolveRevision(repository.path, baseline);
  if (!baselineCommit.ok) return { ok: false, errors: [runtimeError("invalid-comparison", `baseline revision does not resolve: ${baseline}`)] };

  if (target === "working-tree") {
    return { ok: true, comparison: { source: "git", baseline: baselineCommit.oid, target: "working-tree", reproducible: false } };
  }

  const targetCommit = resolveRevision(repository.path, target);
  if (!targetCommit.ok) return { ok: false, errors: [runtimeError("invalid-comparison", `target revision does not resolve: ${target}`)] };

  return { ok: true, comparison: { source: "git", baseline: baselineCommit.oid, target: targetCommit.oid, reproducible: true } };
}

export function collectChanges(root, baseline, target) {
  const resolved = resolveComparison(root, baseline, target);
  if (!resolved.ok) return resolved;

  const repository = resolveRepository(root);
  if (!repository.ok) return repository;

  const args = ["diff", "--find-renames", "--name-status", "-z", resolved.comparison.baseline];
  if (target !== "working-tree") args.push(resolved.comparison.target);

  const diff = git(repository.path, args);
  if (!diff.ok) return { ok: false, errors: [runtimeError("change-collection-failed", `git diff failed for ${baseline}..${target}`)] };

  return parseNameStatus(diff.stdout);
}

export function resolveRepository(root) {
  const result = git(root, ["rev-parse", "--show-toplevel"]);
  if (!result.ok || !result.stdout.trim()) return { ok: false, errors: [runtimeError("change-collection-failed", `not a git work tree: ${root}`)] };
  return { ok: true, path: result.stdout.trim() };
}

function resolveRevision(repository, revision) {
  const result = git(repository, ["rev-parse", "--verify", `${revision}^{commit}`]);
  if (!result.ok) return { ok: false };
  return { ok: true, oid: result.stdout.trim() };
}

function parseNameStatus(output) {
  const tokens = output.split("\0");
  const changes = [];
  let index = 0;
  while (index < tokens.length) {
    const status = tokens[index];
    index += 1;
    if (status === "") continue;
    const marker = status[0];
    if (marker === "R") {
      const oldPath = tokens[index];
      const newPath = tokens[index + 1];
      index += 2;
      changes.push({ kind: "renamed", oldPath, newPath });
      continue;
    }
    const file = tokens[index];
    index += 1;
    if (!Object.hasOwn(KIND_BY_STATUS, marker)) return { ok: false, errors: [runtimeError("unsupported-change-kind", `unsupported git change status ${JSON.stringify(marker)} for path ${JSON.stringify(file)}`)] };
    changes.push({ kind: KIND_BY_STATUS[marker], path: file });
  }
  return { ok: true, changes };
}

function git(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  return { ok: result.status === 0, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}