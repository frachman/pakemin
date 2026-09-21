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
test("reports schema errors without parser or absolute-path detail", () => { const result = load('formatVersion: 1\nscopes: nope\n'); assert.equal(result.ok, false); assert.deepEqual(result.errors.map((error) => error.code), ["unsupported-format-version"]); });
test("rejects invalid rules and exception targets", () => { const result = load(`${base}rules:\n  - id: bad\n    type: unknown\n    scope: missing\nexceptions: []\n`); assert.deepEqual(result.errors.map((error) => error.code), ["unknown-rule-scope", "unknown-rule-type"]); });
