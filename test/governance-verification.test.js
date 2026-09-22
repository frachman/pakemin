import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { classifyInputs } from "../src/verification/changes.js";

const comparison = { source: "git", baseline: "a1", target: "b2", reproducible: true };

function expectRuntime(result, codes, messages = []) {
  assert.equal(result.ok, false);
  assert.equal(result.errorKind, "runtime");
  assert.equal(result.exitCode, 4);
  assert.equal(result.contractVersion, "0");
  assert.equal("outcome" in result, false);
  assert.deepEqual(result.errors.map((error) => error.code), codes);
  for (const message of messages) assert.equal(result.errors.some((error) => error.message === message), true, message);
}

test("comparison and change-set validation classifies runtime input errors", async (t) => {
  await t.test("comparison missing a field", () => expectRuntime(classifyInputs({ source: "git", target: "b2", reproducible: true }, []), ["invalid-comparison", "invalid-comparison"]));
  await t.test("comparison extra field", () => expectRuntime(classifyInputs({ ...comparison, extra: 1 }, []), ["invalid-comparison"]));
  await t.test("comparison source not git", () => expectRuntime(classifyInputs({ ...comparison, source: "svn" }, []), ["invalid-comparison"], ['invalid comparison: source must be "git"']));
  await t.test("empty baseline or target", () => expectRuntime(classifyInputs({ ...comparison, baseline: "", target: "" }, []), ["invalid-comparison", "invalid-comparison"]));
  await t.test("non-boolean reproducible", () => expectRuntime(classifyInputs({ ...comparison, reproducible: "true" }, []), ["invalid-comparison"]));
  await t.test("non-array changes", () => expectRuntime(classifyInputs(comparison, "nope"), ["invalid-change-set"], ["changes must be an array"]));
  await t.test("unsupported kind", () => expectRuntime(classifyInputs(comparison, [{ kind: "copied", path: "a.md" }]), ["unsupported-change-kind"], ['unsupported change kind "copied" at index 0']));
  await t.test("modified carrying oldPath", () => expectRuntime(classifyInputs(comparison, [{ kind: "modified", path: "a.md", oldPath: "b.md" }]), ["invalid-change-set"]));
  await t.test("rename missing newPath", () => expectRuntime(classifyInputs(comparison, [{ kind: "renamed", oldPath: "a.md" }]), ["invalid-change-set"]));
  for (const noncanonical of ["docs//a.md", "../a", "docs/a.md/"]) {
    await t.test(`noncanonical path ${noncanonical}`, () => expectRuntime(classifyInputs(comparison, [{ kind: "modified", path: noncanonical }]), ["invalid-change-set"]));
  }
  await t.test("identical rename source and destination", () => expectRuntime(classifyInputs(comparison, [{ kind: "renamed", oldPath: "a.md", newPath: "a.md" }]), ["invalid-change-set"]));
  await t.test("duplicate modified identity", () => expectRuntime(classifyInputs(comparison, [{ kind: "modified", path: "a.md" }, { kind: "modified", path: "a.md" }]), ["invalid-change-set"], ["invalid change entry at index 1: duplicate change identity"]));
  await t.test("duplicate rename identity", () => expectRuntime(classifyInputs(comparison, [{ kind: "renamed", oldPath: "a.md", newPath: "b.md" }, { kind: "renamed", oldPath: "a.md", newPath: "b.md" }]), ["invalid-change-set"]));
  await t.test("multiple offending entries stay one error per entry in stable order", () => {
    const result = classifyInputs(comparison, [{ kind: "copied", path: "a.md" }, { kind: "modified", path: "docs//a.md" }, { kind: "modified", path: "b.md" }, { kind: "modified", path: "b.md" }]);
    assert.deepEqual(result.errors.map((error) => error.code), ["invalid-change-set", "invalid-change-set", "unsupported-change-kind"]);
    assert.deepEqual(result.errors.map((error) => error.message), ["invalid change entry at index 1: path \"docs//a.md\" is not canonical", "invalid change entry at index 3: duplicate change identity", "unsupported change kind \"copied\" at index 0"]);
  });
  await t.test("valid mixed change set with reproducible false is accepted", () => {
    const changes = [{ kind: "added", path: "a.md" }, { kind: "modified", path: "src/app.js" }, { kind: "deleted", path: "old.md" }, { kind: "renamed", oldPath: "x.md", newPath: "y.md" }];
    assert.equal(classifyInputs({ ...comparison, reproducible: false }, changes), null);
  });
});