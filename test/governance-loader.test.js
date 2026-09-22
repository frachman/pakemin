import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadGovernanceSources } from "../src/governance/loader.js";

function repository(files = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pakemin-governance-"));
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return root;
}

test("loads the manifest and canonical, sorted fragment sources", () => {
  const root = repository({
    ".ai/pakemin.yaml": 'formatVersion: "0"\nincludes: [z.yaml, a.yaml]\n',
    ".ai/a.yaml": "rules: []\n",
    ".ai/z.yaml": "scopes: []\n"
  });
  const result = loadGovernanceSources(root);
  assert.equal(result.ok, true);
  assert.deepEqual(result.sources.map((source) => source.document), [".ai/a.yaml", ".ai/pakemin.yaml", ".ai/z.yaml"]);
});

test("reports missing manifest without absolute paths", () => {
  const result = loadGovernanceSources(repository());
  assert.deepEqual(result, { ok: false, errors: [{ code: "missing-manifest", source: { document: ".ai/pakemin.yaml", field: "" } }] });
});

test("rejects unsafe include spelling and escaping include links", () => {
  const root = repository({ ".ai/pakemin.yaml": 'formatVersion: "0"\nincludes: [../outside.yaml]\n' });
  assert.equal(loadGovernanceSources(root).errors[0].code, "invalid-include-path");
  fs.writeFileSync(path.join(root, "outside.yaml"), "scopes: []\n");
  fs.writeFileSync(path.join(root, ".ai", "pakemin.yaml"), 'formatVersion: "0"\nincludes: [linked.yaml]\n');
  fs.symlinkSync(path.join(root, "outside.yaml"), path.join(root, ".ai", "linked.yaml"));
  assert.equal(loadGovernanceSources(root).errors[0].code, "include-outside-ai");
});

test("rejects unsafe YAML constructs", () => {
  const root = repository({ ".ai/pakemin.yaml": 'formatVersion: "0"\na: &x value\n' });
  assert.equal(loadGovernanceSources(root).errors[0].code, "unsupported-yaml-feature");
});

test("keeps nested YAML feature and duplicate diagnostics at their pointers", () => {
  const root = repository({ ".ai/pakemin.yaml": 'formatVersion: "0"\nrules:\n  - id: &id one\n    id: two\n' });
  const result = loadGovernanceSources(root);
  assert.deepEqual(result.errors, [
    { code: "duplicate-mapping-key", source: { document: ".ai/pakemin.yaml", field: "/rules/0/id" } },
    { code: "unsupported-yaml-feature", source: { document: ".ai/pakemin.yaml", field: "/rules/0/id" } }
  ]);
});

test("does not leak parser objects or absolute paths", () => {
  const result = loadGovernanceSources(repository({ ".ai/pakemin.yaml": 'formatVersion: "0"\n' }));
  assert.equal(result.ok, true);
  assert.equal("map" in result.sources[0], false);
  assert.equal(JSON.stringify(result).includes("/var/"), false);
});

test("classifies symlink cycles without prechecking existence", () => {
  const root = repository();
  fs.symlinkSync(".ai", path.join(root, ".ai"));
  assert.equal(loadGovernanceSources(root).errors[0].code, "invalid-governance-root");
  fs.unlinkSync(path.join(root, ".ai")); fs.mkdirSync(path.join(root, ".ai"));
  fs.symlinkSync("pakemin.yaml", path.join(root, ".ai/pakemin.yaml"));
  assert.equal(loadGovernanceSources(root).errors[0].code, "manifest-not-file");
  fs.unlinkSync(path.join(root, ".ai/pakemin.yaml")); fs.writeFileSync(path.join(root, ".ai/pakemin.yaml"), 'formatVersion: "0"\nincludes: [loop.yaml]\n'); fs.symlinkSync("loop.yaml", path.join(root, ".ai/loop.yaml"));
  assert.equal(loadGovernanceSources(root).errors[0].code, "include-cycle");
});

test("rejects YAML features on roots and mapping keys with exact pointers", () => {
  for (const [contents, field] of [
    ['&root\nformatVersion: "0"\n', ""],
    ['!!map\nformatVersion: "0"\n', ""],
    ['formatVersion: "0"\nscopes:\n  - &key id: repository\n    paths: ["**"]\n', "/scopes/0/id"]
  ]) {
    const result = loadGovernanceSources(repository({ ".ai/pakemin.yaml": contents }));
    assert.deepEqual(result.errors, [{ code: "unsupported-yaml-feature", source: { document: ".ai/pakemin.yaml", field } }]);
  }
});

test("distinguishes a broken .ai link from a missing .ai entry", () => {
  const root = repository();
  fs.symlinkSync("missing-ai", path.join(root, ".ai"));
  assert.deepEqual(loadGovernanceSources(root).errors, [{ code: "invalid-governance-root", source: { document: ".ai/pakemin.yaml", field: "" } }]);
});

test("retains special object keys without prototype mutation", () => {
  const root = repository({ ".ai/pakemin.yaml": 'formatVersion: "0"\n__proto__: polluted\nconstructor: retained\nprototype: retained\n' });
  const result = loadGovernanceSources(root);
  assert.equal(result.ok, true);
  assert.equal({}.polluted, undefined);
  assert.deepEqual(Object.keys(result.sources[0].value).sort(), ["__proto__", "constructor", "formatVersion", "prototype"]);
});
