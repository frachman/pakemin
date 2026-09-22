import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadGovernance } from "../src/governance/index.js";

function load(contents) { const root = fs.mkdtempSync(path.join(os.tmpdir(), "pakemin-schema-")); fs.mkdirSync(path.join(root, ".ai")); fs.writeFileSync(path.join(root, ".ai/pakemin.yaml"), contents); return loadGovernance(root); }
const base = 'formatVersion: "0"\nscopes:\n  - id: repository\n    paths: ["**"]\n';

test("returns normalized repository governance with provenance", () => {
  const result = load(`${base}rules: []\nexceptions: []\n`);
  assert.deepEqual(result, { ok: true, governance: { formatVersion: "0", manifest: ".ai/pakemin.yaml", sources: [".ai/pakemin.yaml"], scopes: [{ definition: { id: "repository", paths: ["**"] }, source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/scopes/0" } }], rules: [], exceptions: [] } });
});
test("reports independent schema errors without parser or absolute-path detail", () => { const result = load('formatVersion: 1\nscopes: nope\n'); assert.equal(result.ok, false); assert.deepEqual(result.errors.map((error) => error.code), ["unsupported-format-version", "invalid-scope-shape"]); });
test("rejects invalid rules and exception targets", () => { const result = load(`${base}rules:\n  - id: bad\n    type: unknown\n    scope: missing\nexceptions: []\n`); assert.deepEqual(result.errors.map((error) => error.code), ["unknown-rule-scope", "unknown-rule-type"]); });

test("rejects wildcard exception paths and extglob rule patterns", () => {
  const result = load(`${base}rules:\n  - id: repository.allowed\n    type: allowed-paths\n    scope: repository\n    paths: ["src/@(a).js"]\nexceptions:\n  - id: exception.one\n    rule: repository.allowed\n    scope: repository\n    paths: ["src/*.js"]\n    reason: approved\n    approvedBy: maintainer\n`);
  assert.deepEqual(result.errors, [
    { code: "invalid-exception-path", source: { document: ".ai/pakemin.yaml", field: "/exceptions/0/paths/0" } },
    { code: "invalid-path-pattern", source: { document: ".ai/pakemin.yaml", field: "/rules/0/paths/0" } }
  ]);
});

test("recognizes repository parent as a repository-specific error", () => {
  const result = load('formatVersion: "0"\nscopes:\n  - id: repository\n    parent: other\n    paths: ["**"]\n');
  assert.deepEqual(result.errors, [{ code: "invalid-repository-scope", source: { document: ".ai/pakemin.yaml", field: "/scopes/0" } }]);
});

test("sorts scopes and rules by numeric depth", () => {
  let scopes = '  - id: repository\n    paths: ["**"]\n';
  let rules = "";
  for (let index = 1; index <= 11; index += 1) { scopes += `  - id: depth-${index}\n    parent: ${index === 1 ? "repository" : `depth-${index - 1}`}\n    paths: ["d${index}/**"]\n`; rules += `  - id: rule-${index}\n    type: allowed-paths\n    scope: depth-${index}\n    paths: ["d${index}/**"]\n`; }
  const result = load(`formatVersion: "0"\nscopes:\n${scopes}rules:\n${rules}`);
  assert.equal(result.ok, true);
  assert.deepEqual(result.governance.scopes.map((item) => item.definition.id), ["repository", ...Array.from({ length: 11 }, (_, index) => `depth-${index + 1}`)]);
  assert.deepEqual(result.governance.rules.map((item) => item.definition.id), Array.from({ length: 11 }, (_, index) => `rule-${index + 1}`));
});

test("allows literal exclamation marks but rejects negation and extglob", () => {
  for (const pattern of ["docs/a!b.md", "docs/hello!.md"]) {
    assert.equal(load(`${base}rules:\n  - id: repository.rule\n    type: allowed-paths\n    scope: repository\n    paths: ["${pattern}"]\n`).ok, true);
  }
  for (const pattern of ["!docs/**", "docs/!(a).md", "docs/@(a).md", "docs/+(a).md", "docs/*(a).md", "docs/?(a).md"]) {
    const result = load(`${base}rules:\n  - id: repository.rule\n    type: allowed-paths\n    scope: repository\n    paths: ["${pattern}"]\n`);
    assert.deepEqual(result.errors, [{ code: "invalid-path-pattern", source: { document: ".ai/pakemin.yaml", field: "/rules/0/paths/0" } }]);
  }
});

test("special keys remain visible to schema validation without prototype pollution", () => {
  const result = load('formatVersion: "0"\n__proto__: value\nconstructor: value\nprototype: value\nscopes:\n  - id: repository\n    paths: ["**"]\n    __proto__: value\n');
  assert.equal({}.value, undefined);
  assert.deepEqual(result.errors, [
    { code: "unknown-top-level-key", source: { document: ".ai/pakemin.yaml", field: "/__proto__" } },
    { code: "unknown-top-level-key", source: { document: ".ai/pakemin.yaml", field: "/constructor" } },
    { code: "unknown-top-level-key", source: { document: ".ai/pakemin.yaml", field: "/prototype" } },
    { code: "missing-repository-scope", source: { document: ".ai/pakemin.yaml", field: "/scopes" } },
    { code: "invalid-scope-shape", source: { document: ".ai/pakemin.yaml", field: "/scopes/0" } }
  ]);
});
