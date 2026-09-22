import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadGovernance } from "../src/governance/index.js";

const LOAD_TIME_SCHEMA_CODES = [
  "missing-manifest", "invalid-yaml", "multiple-yaml-documents", "invalid-document-shape", "unsupported-format-version", "unknown-top-level-key", "duplicate-mapping-key", "unsupported-yaml-feature", "invalid-include-path", "invalid-governance-root", "manifest-outside-ai", "manifest-not-file", "include-outside-ai", "include-not-file", "include-cycle", "duplicate-include", "missing-include", "invalid-id", "duplicate-scope-id", "duplicate-rule-id", "duplicate-exception-id", "missing-repository-scope", "invalid-repository-scope", "invalid-scope-shape", "unknown-parent-scope", "scope-cycle", "invalid-path-pattern", "unknown-rule-type", "unknown-rule-scope", "invalid-rule-shape", "unknown-exception-rule", "unknown-exception-scope", "invalid-exception-scope", "unsupported-exception-target", "invalid-exception-path", "invalid-exception-shape"
];

const ROOT = 'formatVersion: "0"\nscopes:\n  - id: repository\n    paths: ["**"]\n';
const rule = (body) => `${ROOT}rules:\n${body}`;
const exception = (body) => `${ROOT}rules: []\nexceptions:\n${body}`;

function write(root, name, contents) { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, contents); }
function repo(files = { ".ai/pakemin.yaml": ROOT }) { const root = fs.mkdtempSync(path.join(os.tmpdir(), "pakemin-conformance-")); for (const [name, contents] of Object.entries(files)) write(root, name, contents); return root; }
function expected(code, field, document = ".ai/pakemin.yaml") { return { code, source: { document, field } }; }

const CASES = [
  { code: "missing-manifest", arrange: () => repo({}) , expected: expected("missing-manifest", "") },
  { code: "invalid-yaml", arrange: () => repo({ ".ai/pakemin.yaml": "[" }), expected: expected("invalid-yaml", "") },
  { code: "multiple-yaml-documents", arrange: () => repo({ ".ai/pakemin.yaml": "---\nformatVersion: \"0\"\n---\nformatVersion: \"0\"\n" }), expected: expected("multiple-yaml-documents", "") },
  { code: "invalid-document-shape", arrange: () => repo({ ".ai/pakemin.yaml": "null\n" }), expected: expected("invalid-document-shape", "") },
  { code: "unsupported-format-version", arrange: () => repo({ ".ai/pakemin.yaml": `${ROOT.replace('"0"', '"1"')}` }), expected: expected("unsupported-format-version", "/formatVersion") },
  { code: "unknown-top-level-key", arrange: () => repo({ ".ai/pakemin.yaml": `${ROOT}unknown: value\n` }), expected: expected("unknown-top-level-key", "/unknown") },
  { code: "duplicate-mapping-key", arrange: () => repo({ ".ai/pakemin.yaml": 'formatVersion: "0"\nformatVersion: "0"\n' }), expected: expected("duplicate-mapping-key", "/formatVersion") },
  { code: "unsupported-yaml-feature", arrange: () => repo({ ".ai/pakemin.yaml": '&root\nformatVersion: "0"\n' }), expected: expected("unsupported-yaml-feature", "") },
  { code: "invalid-include-path", arrange: () => repo({ ".ai/pakemin.yaml": 'formatVersion: "0"\nincludes: [../bad.yaml]\n' }), expected: expected("invalid-include-path", "/includes/0") },
  { code: "invalid-governance-root", arrange: () => { const root = repo(); fs.rmSync(path.join(root, ".ai"), { recursive: true }); fs.writeFileSync(path.join(root, ".ai"), "file"); return root; }, expected: expected("invalid-governance-root", "") },
  { code: "manifest-outside-ai", arrange: () => { const root = repo({ ".ai/placeholder": "" }); write(root, "outside.yaml", ROOT); fs.symlinkSync(path.join(root, "outside.yaml"), path.join(root, ".ai/pakemin.yaml")); return root; }, expected: expected("manifest-outside-ai", "") },
  { code: "manifest-not-file", arrange: () => { const root = repo({ ".ai/placeholder": "" }); fs.mkdirSync(path.join(root, ".ai/pakemin.yaml")); return root; }, expected: expected("manifest-not-file", "") },
  { code: "include-outside-ai", arrange: () => { const root = repo({ ".ai/pakemin.yaml": 'formatVersion: "0"\nincludes: [link.yaml]\n' }); write(root, "outside.yaml", "scopes: []\n"); fs.symlinkSync(path.join(root, "outside.yaml"), path.join(root, ".ai/link.yaml")); return root; }, expected: expected("include-outside-ai", "/includes/0") },
  { code: "include-not-file", arrange: () => { const root = repo({ ".ai/pakemin.yaml": 'formatVersion: "0"\nincludes: [dir]\n' }); fs.mkdirSync(path.join(root, ".ai/dir")); return root; }, expected: expected("include-not-file", "/includes/0") },
  { code: "include-cycle", arrange: () => { const root = repo({ ".ai/pakemin.yaml": 'formatVersion: "0"\nincludes: [loop]\n' }); fs.symlinkSync("loop", path.join(root, ".ai/loop")); return root; }, expected: expected("include-cycle", "/includes/0") },
  { code: "duplicate-include", arrange: () => repo({ ".ai/pakemin.yaml": 'formatVersion: "0"\nincludes: [one.yaml, two.yaml]\n', ".ai/one.yaml": "scopes: []\n", ".ai/two.yaml": "scopes: []\n" }), mutate(root) { fs.rmSync(path.join(root, ".ai/two.yaml")); fs.symlinkSync("one.yaml", path.join(root, ".ai/two.yaml")); }, expected: expected("duplicate-include", "/includes/1") },
  { code: "missing-include", arrange: () => repo({ ".ai/pakemin.yaml": 'formatVersion: "0"\nincludes: [none.yaml]\n' }), expected: expected("missing-include", "/includes/0") },
  { code: "invalid-id", arrange: () => repo({ ".ai/pakemin.yaml": rule('  - id: Bad\n    type: allowed-paths\n    scope: repository\n    paths: ["src/**"]\n') }), expected: expected("invalid-id", "/rules/0/id") },
  { code: "duplicate-scope-id", arrange: () => repo({ ".ai/pakemin.yaml": 'formatVersion: "0"\nscopes:\n  - id: repository\n    paths: ["**"]\n  - id: docs\n    parent: repository\n    paths: ["docs/**"]\n  - id: docs\n    parent: repository\n    paths: ["more/**"]\n' }), expected: expected("duplicate-scope-id", "/scopes/2/id") },
  { code: "duplicate-rule-id", arrange: () => repo({ ".ai/pakemin.yaml": rule('  - id: same\n    type: allowed-paths\n    scope: repository\n    paths: ["a/**"]\n  - id: same\n    type: allowed-paths\n    scope: repository\n    paths: ["b/**"]\n') }), expected: expected("duplicate-rule-id", "/rules/1/id") },
  { code: "duplicate-exception-id", arrange: () => repo({ ".ai/pakemin.yaml": `${rule('  - id: r\n    type: allowed-paths\n    scope: repository\n    paths: ["a"]\n')}exceptions:\n  - id: same\n    rule: r\n    scope: repository\n    paths: ["a"]\n    reason: yes\n    approvedBy: m\n  - id: same\n    rule: r\n    scope: repository\n    paths: ["b"]\n    reason: yes\n    approvedBy: m\n` }), expected: expected("duplicate-exception-id", "/exceptions/1/id") },
  { code: "missing-repository-scope", arrange: () => repo({ ".ai/pakemin.yaml": 'formatVersion: "0"\nscopes: []\n' }), expected: expected("missing-repository-scope", "/scopes") },
  { code: "invalid-repository-scope", arrange: () => repo({ ".ai/pakemin.yaml": 'formatVersion: "0"\nscopes:\n  - id: repository\n    parent: x\n    paths: ["**"]\n' }), expected: expected("invalid-repository-scope", "/scopes/0") },
  { code: "invalid-scope-shape", arrange: () => repo({ ".ai/pakemin.yaml": 'formatVersion: "0"\nscopes: nope\n' }), expected: expected("invalid-scope-shape", "/scopes") },
  { code: "unknown-parent-scope", arrange: () => repo({ ".ai/pakemin.yaml": 'formatVersion: "0"\nscopes:\n  - id: repository\n    paths: ["**"]\n  - id: child\n    parent: none\n    paths: ["x/**"]\n' }), expected: expected("unknown-parent-scope", "/scopes/1/parent") },
  { code: "scope-cycle", arrange: () => repo({ ".ai/pakemin.yaml": 'formatVersion: "0"\nscopes:\n  - id: repository\n    paths: ["**"]\n  - id: a\n    parent: b\n    paths: ["a/**"]\n  - id: b\n    parent: a\n    paths: ["b/**"]\n' }), expected: expected("scope-cycle", "/scopes/1") },
  { code: "invalid-path-pattern", arrange: () => repo({ ".ai/pakemin.yaml": rule('  - id: r\n    type: allowed-paths\n    scope: repository\n    paths: ["src/@(a)"]\n') }), expected: expected("invalid-path-pattern", "/rules/0/paths/0") },
  { code: "unknown-rule-type", arrange: () => repo({ ".ai/pakemin.yaml": rule('  - id: r\n    type: future\n    scope: repository\n    paths: ["x"]\n') }), expected: expected("unknown-rule-type", "/rules/0/type") },
  { code: "unknown-rule-scope", arrange: () => repo({ ".ai/pakemin.yaml": rule('  - id: r\n    type: allowed-paths\n    scope: none\n    paths: ["x"]\n') }), expected: expected("unknown-rule-scope", "/rules/0/scope") },
  { code: "invalid-rule-shape", arrange: () => repo({ ".ai/pakemin.yaml": rule('  - id: r\n    type: allowed-paths\n    scope: repository\n') }), expected: expected("invalid-rule-shape", "/rules/0") },
  { code: "unknown-exception-rule", arrange: () => repo({ ".ai/pakemin.yaml": exception('  - id: e\n    rule: none\n    scope: repository\n    paths: ["x"]\n    reason: yes\n    approvedBy: m\n') }), expected: expected("unknown-exception-rule", "/exceptions/0/rule") },
  { code: "unknown-exception-scope", arrange: () => repo({ ".ai/pakemin.yaml": `${rule('  - id: r\n    type: allowed-paths\n    scope: repository\n    paths: ["x"]\n')}exceptions:\n  - id: e\n    rule: r\n    scope: none\n    paths: ["x"]\n    reason: yes\n    approvedBy: m\n` }), expected: expected("unknown-exception-scope", "/exceptions/0/scope") },
  { code: "invalid-exception-scope", arrange: () => repo({ ".ai/pakemin.yaml": 'formatVersion: "0"\nscopes:\n  - id: repository\n    paths: ["**"]\n  - id: a\n    parent: repository\n    paths: ["a/**"]\n  - id: b\n    parent: repository\n    paths: ["b/**"]\nrules:\n  - id: r\n    type: allowed-paths\n    scope: a\n    paths: ["a/**"]\nexceptions:\n  - id: e\n    rule: r\n    scope: b\n    paths: ["b/x"]\n    reason: yes\n    approvedBy: m\n' }), expected: expected("invalid-exception-scope", "/exceptions/0/scope") },
  { code: "unsupported-exception-target", arrange: () => repo({ ".ai/pakemin.yaml": `${rule('  - id: r\n    type: changed-path-requires-review\n    scope: repository\n    paths: ["x"]\n')}exceptions:\n  - id: e\n    rule: r\n    scope: repository\n    paths: ["x"]\n    reason: yes\n    approvedBy: m\n` }), expected: expected("unsupported-exception-target", "/exceptions/0/rule") },
  { code: "invalid-exception-path", arrange: () => repo({ ".ai/pakemin.yaml": exception('  - id: e\n    rule: none\n    scope: repository\n    paths: ["x/*"]\n    reason: yes\n    approvedBy: m\n') }), expected: expected("invalid-exception-path", "/exceptions/0/paths/0") },
  { code: "invalid-exception-shape", arrange: () => repo({ ".ai/pakemin.yaml": exception('  - id: e\n    rule: none\n    scope: repository\n    paths: ["x"]\n    approvedBy: m\n') }), expected: expected("invalid-exception-shape", "/exceptions/0") }
];

test("the governance conformance matrix has exactly every load-time code", () => {
  assert.deepEqual([...new Set(CASES.map((fixture) => fixture.code))].sort(), LOAD_TIME_SCHEMA_CODES.slice().sort());
  assert.equal(CASES.length, 36);
});

for (const fixture of CASES) test(`conformance: ${fixture.code}`, () => {
  const root = fixture.arrange(); fixture.mutate?.(root);
  const result = loadGovernance(root);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => assert.deepEqual(error, fixture.expected) === undefined));
  assert.equal(JSON.stringify(result).includes(root), false);
  assert.equal(JSON.stringify(result).includes("YAMLMap"), false);
});
