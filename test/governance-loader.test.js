import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadGovernanceSources } from "../src/governance/index.js";

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
