import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadGovernance, resolveGovernancePaths } from "../src/governance/index.js";

const RESOLUTION_TIME_SCHEMA_CODES = ["ambiguous-scope-match", "exception-outside-scope"];

function governance(yaml) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pakemin-resolver-"));
  fs.mkdirSync(path.join(root, ".ai")); fs.writeFileSync(path.join(root, ".ai/pakemin.yaml"), yaml);
  const loaded = loadGovernance(root); assert.equal(loaded.ok, true); return loaded.governance;
}
const base = 'formatVersion: "0"\nscopes:\n  - id: repository\n    paths: ["**"]\n';

test("the resolution-time inventory remains exactly two deferred Slice 2 codes", () => {
  assert.deepEqual(RESOLUTION_TIME_SCHEMA_CODES, ["ambiguous-scope-match", "exception-outside-scope"]);
});

test("resolves direct and inherited scope chains with all rule types", () => {
  const value = governance(`${base}  - id: backend\n    parent: repository\n    paths: ["services/backend-entry/**"]\n  - id: auth\n    parent: backend\n    paths: ["services/auth/**"]\nrules:\n  - id: repository.allowed\n    type: allowed-paths\n    scope: repository\n    paths: ["**"]\n  - id: backend.forbidden\n    type: forbidden-paths\n    scope: backend\n    paths: ["x"]\n  - id: auth.changed\n    type: changed-path-requires-changed-path\n    scope: auth\n    when:\n      changedPaths:\n        include: ["x"]\n    require:\n      changedPaths:\n        include: ["y"]\n  - id: auth.review\n    type: changed-path-requires-review\n    scope: auth\n    paths: ["x"]\n`);
  const result = resolveGovernancePaths(value, ["services/auth/login.js", "missing/deleted.js"]);
  assert.deepEqual(result.resolution.paths[0], { path: "missing/deleted.js", directScopeIds: ["repository"], effectiveScopeIds: ["repository"], ruleIds: ["repository.allowed"], exceptionIds: [] });
  assert.deepEqual(result.resolution.paths[1], { path: "services/auth/login.js", directScopeIds: ["repository", "auth"], effectiveScopeIds: ["repository", "backend", "auth"], ruleIds: ["repository.allowed", "backend.forbidden", "auth.changed", "auth.review"], exceptionIds: [] });
});

test("returns one exact ambiguity diagnostic for each unrelated direct scope", () => {
  const value = governance(`${base}  - id: docs\n    parent: repository\n    paths: ["apps/**", "apps/docs/**"]\n  - id: web\n    parent: repository\n    paths: ["apps/**"]\n`);
  assert.deepEqual(resolveGovernancePaths(value, ["apps/docs/index.md"]), { ok: false, errors: [
    { code: "ambiguous-scope-match", source: { document: ".ai/pakemin.yaml", field: "/scopes/1/paths/0" }, path: "apps/docs/index.md" },
    { code: "ambiguous-scope-match", source: { document: ".ai/pakemin.yaml", field: "/scopes/2/paths/0" }, path: "apps/docs/index.md" }
  ] });
});

test("rejects malformed resolver caller input as an internal error", () => {
  const value = governance(base);
  for (const paths of ["nope", ["a", "a"], ["a\\b"], ["../a"]]) assert.throws(() => resolveGovernancePaths(value, paths), { code: "internal-error" });
  assert.throws(() => resolveGovernancePaths({}, []), { code: "internal-error" });
});

test("rejects corrupted normalized governance at the resolver boundary", () => {
  const value = governance(`${base}  - id: docs\n    parent: repository\n    paths: ["docs/**"]\nrules:\n  - id: repository.rule\n    type: allowed-paths\n    scope: repository\n    paths: ["**"]\nexceptions:\n  - id: exception.docs\n    rule: repository.rule\n    scope: docs\n    paths: ["docs/a.md"]\n    reason: approved\n    approvedBy: maintainer\n`);
  const corruptions = [
    ["null rule", (copy) => { copy.rules = [null]; }],
    ["rule definition", (copy) => { delete copy.rules[0].definition; }],
    ["rule provenance", (copy) => { delete copy.rules[0].source; }],
    ["rule scope", (copy) => { copy.rules[0].definition.scope = "none"; }],
    ["rule type", (copy) => { copy.rules[0].definition.type = "future"; }],
    ["duplicate rule id", (copy) => { copy.rules.push(structuredClone(copy.rules[0])); }],
    ["null exception", (copy) => { copy.exceptions = [null]; }],
    ["exception definition", (copy) => { delete copy.exceptions[0].definition; }],
    ["exception provenance", (copy) => { delete copy.exceptions[0].source; }],
    ["exception paths", (copy) => { copy.exceptions[0].definition.paths = "docs/a.md"; }],
    ["exception path", (copy) => { copy.exceptions[0].definition.paths = ["../a"]; }],
    ["exception rule", (copy) => { copy.exceptions[0].definition.rule = "none"; }],
    ["exception scope", (copy) => { copy.exceptions[0].definition.scope = "none"; }],
    ["duplicate exception id", (copy) => { copy.exceptions.push(structuredClone(copy.exceptions[0])); }],
    ["scope definition", (copy) => { delete copy.scopes[0].definition; }],
    ["scope provenance", (copy) => { delete copy.scopes[0].source; }],
    ["duplicate scope", (copy) => { copy.scopes.push(structuredClone(copy.scopes[0])); }],
    ["missing root", (copy) => { copy.scopes = copy.scopes.slice(1); }],
    ["unknown parent", (copy) => { copy.scopes[1].definition.parent = "none"; }],
    ["cycle", (copy) => { copy.scopes[1].definition.parent = "docs"; }],
    ["manifest", (copy) => { copy.manifest = "manifest.yaml"; }],
    ["sources", (copy) => { copy.sources = [".ai/pakemin.yaml", ".ai/pakemin.yaml"]; }],
    ["provenance", (copy) => { copy.scopes[0].source.document = "outside.yaml"; }],
    ["accessor", (copy) => { Object.defineProperty(copy.rules[0], "definition", { get() { return {}; } }); }]
  ];
  for (const [name, corrupt] of corruptions) {
    const copy = structuredClone(value); corrupt(copy);
    assert.throws(() => resolveGovernancePaths(copy, []), { code: "internal-error" }, name);
  }
  assert.equal(resolveGovernancePaths(value, ["docs/a.md"]).ok, true);
});

test("returns applicable exact exceptions and validates paths for empty input", () => {
  const value = governance(`${base}  - id: docs\n    parent: repository\n    paths: ["docs/**"]\nrules:\n  - id: repository.allowed\n    type: allowed-paths\n    scope: repository\n    paths: ["**"]\n  - id: docs.forbidden\n    type: forbidden-paths\n    scope: docs\n    paths: ["docs/private/**"]\nexceptions:\n  - id: exception.docs\n    rule: docs.forbidden\n    scope: docs\n    paths: ["docs/private/a.md", "docs/private/a.md"]\n    reason: approved\n    approvedBy: maintainer\n  - id: exception.repository\n    rule: repository.allowed\n    scope: repository\n    paths: ["docs/private/a.md"]\n    reason: approved\n    approvedBy: maintainer\n`);
  const result = resolveGovernancePaths(value, ["docs/private/a.md", "docs/other.md"]);
  assert.deepEqual(result.resolution.paths.find((item) => item.path === "docs/private/a.md").exceptionIds, ["exception.docs", "exception.repository"]);
  assert.deepEqual(result.resolution.paths.find((item) => item.path === "docs/other.md").exceptionIds, []);
  assert.equal(resolveGovernancePaths(value, []).ok, true);
});

test("reports exception paths outside their declared scope with provenance", () => {
  const value = governance(`${base}  - id: docs\n    parent: repository\n    paths: ["docs/**"]\nrules:\n  - id: docs.allowed\n    type: allowed-paths\n    scope: docs\n    paths: ["docs/**"]\nexceptions:\n  - id: exception.docs\n    rule: docs.allowed\n    scope: docs\n    paths: ["other/a.md"]\n    reason: approved\n    approvedBy: maintainer\n`);
  assert.deepEqual(resolveGovernancePaths(value, []), { ok: false, errors: [{ code: "exception-outside-scope", source: { document: ".ai/pakemin.yaml", field: "/exceptions/0/paths/0" }, path: "other/a.md" }] });
});

test("does not duplicate ambiguity when an exception path is requested", () => {
  const value = governance(`${base}  - id: one\n    parent: repository\n    paths: ["same/**"]\n  - id: two\n    parent: repository\n    paths: ["same/**"]\nrules:\n  - id: one.allowed\n    type: allowed-paths\n    scope: one\n    paths: ["same/**"]\nexceptions:\n  - id: exception.one\n    rule: one.allowed\n    scope: one\n    paths: ["same/a.md"]\n    reason: approved\n    approvedBy: maintainer\n`);
  const result = resolveGovernancePaths(value, ["same/a.md"]);
  assert.equal(result.errors.length, 2);
  assert.equal(result.errors.some((error) => error.code === "exception-outside-scope"), false);
});

test("keeps direct parent and child matches, one scope per matching pattern set, and numeric depth", () => {
  let scopes = '  - id: repository\n    paths: ["**"]\n';
  for (let index = 1; index <= 11; index += 1) scopes += `  - id: level-${index}\n    parent: ${index === 1 ? "repository" : `level-${index - 1}`}\n    paths: ["deep/**", "deep/leaf/**"]\n`;
  const value = governance(`formatVersion: "0"\nscopes:\n${scopes}`);
  const result = resolveGovernancePaths(value, ["deep/leaf/a.md"]);
  assert.deepEqual(result.resolution.paths[0].directScopeIds, ["repository", ...Array.from({ length: 11 }, (_, index) => `level-${index + 1}`)]);
  assert.deepEqual(result.resolution.paths[0].effectiveScopeIds, ["repository", ...Array.from({ length: 11 }, (_, index) => `level-${index + 1}`)]);
});

test("resolver is filesystem-independent and does not mutate or alias inputs", () => {
  const value = governance(base);
  const before = structuredClone(value); const paths = ["deleted/file.md"];
  const original = fs.readFileSync; fs.readFileSync = () => { throw new Error("resolver read filesystem"); };
  try {
    const result = resolveGovernancePaths(value, paths);
    assert.equal(result.ok, true);
    result.resolution.paths[0].directScopeIds.push("mutated");
  } finally { fs.readFileSync = original; }
  assert.deepEqual(value, before); assert.deepEqual(paths, ["deleted/file.md"]);
});

test("returns one pointer-specific outside-scope error per authored path occurrence", () => {
  const value = governance(`${base}  - id: docs\n    parent: repository\n    paths: ["docs/**"]\nrules:\n  - id: docs.allowed\n    type: allowed-paths\n    scope: docs\n    paths: ["docs/**"]\nexceptions:\n  - id: exception.docs\n    rule: docs.allowed\n    scope: docs\n    paths: ["other/a.md", "other/a.md", "other/b.md"]\n    reason: approved\n    approvedBy: maintainer\n`);
  assert.deepEqual(resolveGovernancePaths(value, []), { ok: false, errors: [
    { code: "exception-outside-scope", source: { document: ".ai/pakemin.yaml", field: "/exceptions/0/paths/0" }, path: "other/a.md" },
    { code: "exception-outside-scope", source: { document: ".ai/pakemin.yaml", field: "/exceptions/0/paths/1" }, path: "other/a.md" },
    { code: "exception-outside-scope", source: { document: ".ai/pakemin.yaml", field: "/exceptions/0/paths/2" }, path: "other/b.md" }
  ] });
});

test("resolution-time conformance fixtures are keyed to the exact inventory", () => {
  const fixtures = {
    "ambiguous-scope-match": () => {
      const value = governance(`${base}  - id: one\n    parent: repository\n    paths: ["same/**"]\n  - id: two\n    parent: repository\n    paths: ["same/**"]\n`);
      return resolveGovernancePaths(value, ["same/a.md"]);
    },
    "exception-outside-scope": () => {
      const value = governance(`${base}  - id: docs\n    parent: repository\n    paths: ["docs/**"]\nrules:\n  - id: docs.allowed\n    type: allowed-paths\n    scope: docs\n    paths: ["docs/**"]\nexceptions:\n  - id: exception.docs\n    rule: docs.allowed\n    scope: docs\n    paths: ["other/a.md"]\n    reason: approved\n    approvedBy: maintainer\n`);
      return resolveGovernancePaths(value, []);
    }
  };
  assert.deepEqual(Object.keys(fixtures).sort(), RESOLUTION_TIME_SCHEMA_CODES.slice().sort());
  assert.deepEqual(fixtures["ambiguous-scope-match"](), { ok: false, errors: [
    { code: "ambiguous-scope-match", source: { document: ".ai/pakemin.yaml", field: "/scopes/1/paths/0" }, path: "same/a.md" },
    { code: "ambiguous-scope-match", source: { document: ".ai/pakemin.yaml", field: "/scopes/2/paths/0" }, path: "same/a.md" }
  ] });
  assert.deepEqual(fixtures["exception-outside-scope"](), { ok: false, errors: [
    { code: "exception-outside-scope", source: { document: ".ai/pakemin.yaml", field: "/exceptions/0/paths/0" }, path: "other/a.md" }
  ] });
});
