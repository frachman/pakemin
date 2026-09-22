import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { loadGovernance, resolveGovernancePaths } from "../src/governance/index.js";

const RESOLUTION_TIME_SCHEMA_CODES = ["ambiguous-scope-match", "exception-outside-scope"];

const ACCEPTANCE_COVERAGE = {
  1: "cousin ambiguity emits only participating descendants and closes the result",
  2: "chain plus unrelated scope never selects a winner",
  3: "scope declaration order does not change equivalent resolution",
  4: "ambiguity diagnostics retain included-fragment provenance and document ordering",
  5: "cross-document ambiguity diagnostics sort by document, field, code, and path",
  6: "included exception outside scope retains fragment provenance and closes output",
  7: "unrelated resolved exception scope fails without ambiguity",
  8: "failure results stay closed and never leak successful paths",
  9: "successful resolver output is recursively plain documented data",
  10: "returned arrays never alias governance or a later resolution",
  11: "CLI help has no public check command"
};

function governanceWithRoot(yaml) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pakemin-resolver-"));
  fs.mkdirSync(path.join(root, ".ai")); fs.writeFileSync(path.join(root, ".ai/pakemin.yaml"), yaml);
  const loaded = loadGovernance(root); assert.equal(loaded.ok, true); return { root, governance: loaded.governance };
}
function governance(yaml) { return governanceWithRoot(yaml).governance; }
function governanceFiles(files) { const root = fs.mkdtempSync(path.join(os.tmpdir(), "pakemin-resolver-files-")); for (const [name, value] of Object.entries(files)) { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); } const loaded = loadGovernance(root); assert.equal(loaded.ok, true); return loaded.governance; }
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

test("enforces pointer, exact exception, audit, dense-array, and source boundary predicates", async (t) => {
  const value = governance(`${base}rules:\n  - id: repository.rule\n    type: allowed-paths\n    scope: repository\n    paths: ["**"]\nexceptions:\n  - id: exception.one\n    rule: repository.rule\n    scope: repository\n    paths: ["docs/a.md"]\n    reason: approved\n    approvedBy: maintainer\n`);
  const corruptions = [
    ["non-pointer provenance", (copy) => { copy.rules[0].source.field = "rules/0"; }],
    ["invalid pointer escape", (copy) => { copy.rules[0].source.field = "/rules/~2"; }],
    ["wildcard exception", (copy) => { copy.exceptions[0].definition.paths = ["docs/*.md"]; }],
    ["double-star exception", (copy) => { copy.exceptions[0].definition.paths = ["docs/**"]; }],
    ["pattern exception", (copy) => { copy.exceptions[0].definition.paths = ["docs/[a].md"]; }],
    ["empty reason", (copy) => { copy.exceptions[0].definition.reason = ""; }],
    ["empty approver", (copy) => { copy.exceptions[0].definition.approvedBy = ""; }],
    ["sparse sources", (copy) => { copy.sources = new Array(1); }],
    ["sparse scope paths", (copy) => { copy.scopes[0].definition.paths = new Array(1); }],
    ["sparse rule paths", (copy) => { copy.rules[0].definition.paths = new Array(1); }],
    ["sparse exception paths", (copy) => { copy.exceptions[0].definition.paths = new Array(1); }],
    ["empty sources", (copy) => { copy.sources = []; }],
    ["manifest absent from sources", (copy) => { copy.sources = [".ai/other.yaml"]; }]
  ];
  for (const [name, corrupt] of corruptions) await t.test(name, () => { const copy = structuredClone(value); corrupt(copy); assert.throws(() => resolveGovernancePaths(copy, []), { code: "internal-error" }); });
  await t.test("valid escaped pointer tokens pass", () => { const escaped = structuredClone(value); escaped.rules[0].source.field = "/rules/a~0b~1c"; assert.equal(resolveGovernancePaths(escaped, []).ok, true); });
  await t.test("mid-segment literal exclamation paths pass the boundary", () => {
    const literal = governance(`${base}rules:\n  - id: repository.rule\n    type: allowed-paths\n    scope: repository\n    paths: ["**"]\nexceptions:\n  - id: exception.one\n    rule: repository.rule\n    scope: repository\n    paths: ["docs/a!b.md"]\n    reason: approved\n    approvedBy: maintainer\n`);
    assert.equal(resolveGovernancePaths(literal, ["docs/a!b.md"]).ok, true);
  });
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

test("cousin ambiguity emits only participating descendants and closes the result", () => {
  const value = governance(`${base}  - id: left\n    parent: repository\n    paths: ["left/**"]\n  - id: left-child\n    parent: left\n    paths: ["shared/**"]\n  - id: right\n    parent: repository\n    paths: ["right/**"]\n  - id: right-child\n    parent: right\n    paths: ["shared/**"]\n`);
  const result = resolveGovernancePaths(value, ["shared/a.md"]);
  assert.deepEqual(result.errors.map((error) => error.source.field), ["/scopes/2/paths/0", "/scopes/4/paths/0"]);
  assert.deepEqual(Object.keys(result), ["ok", "errors"]);
});

test("chain plus unrelated scope never selects a winner", () => {
  const value = governance(`${base}  - id: parent\n    parent: repository\n    paths: ["shared/**"]\n  - id: child\n    parent: parent\n    paths: ["shared/**"]\n  - id: unrelated\n    parent: repository\n    paths: ["shared/**"]\n`);
  const result = resolveGovernancePaths(value, ["shared/a.md"]);
  assert.deepEqual(result.errors.map((error) => error.source.field), ["/scopes/1/paths/0", "/scopes/2/paths/0", "/scopes/3/paths/0"]);
  assert.equal("resolution" in result, false);
});

test("scope declaration order does not change equivalent resolution", () => {
  const suffix = '  - id: docs\n    parent: repository\n    paths: ["docs/**"]\n  - id: api\n    parent: repository\n    paths: ["api/**"]\n';
  const first = governance(`formatVersion: "0"\nscopes:\n  - id: repository\n    paths: ["**"]\n${suffix}`);
  const second = governance(`formatVersion: "0"\nscopes:\n  - id: api\n    parent: repository\n    paths: ["api/**"]\n  - id: repository\n    paths: ["**"]\n  - id: docs\n    parent: repository\n    paths: ["docs/**"]\n`);
  assert.deepEqual(resolveGovernancePaths(first, ["docs/a.md", "api/a.md"]), resolveGovernancePaths(second, ["api/a.md", "docs/a.md"]));
  const fragments = { ".ai/a.yaml": 'scopes:\n  - id: docs\n    parent: repository\n    paths: ["docs/**"]\n', ".ai/z.yaml": 'scopes:\n  - id: api\n    parent: repository\n    paths: ["api/**"]\n' };
  const includeForward = governanceFiles({ ...fragments, ".ai/pakemin.yaml": 'formatVersion: "0"\nincludes: [z.yaml, a.yaml]\nscopes:\n  - id: repository\n    paths: ["**"]\n' });
  const includeReversed = governanceFiles({ ...fragments, ".ai/pakemin.yaml": 'formatVersion: "0"\nincludes: [a.yaml, z.yaml]\nscopes:\n  - id: repository\n    paths: ["**"]\n' });
  assert.deepEqual(resolveGovernancePaths(includeForward, ["docs/a.md", "api/a.md"]), resolveGovernancePaths(includeReversed, ["docs/a.md", "api/a.md"]));
});

test("ambiguity diagnostics retain included-fragment provenance and document ordering", () => {
  const value = governanceFiles({ ".ai/pakemin.yaml": 'formatVersion: "0"\nincludes: [z.yaml, a.yaml]\nscopes:\n  - id: repository\n    paths: ["**"]\n', ".ai/a.yaml": 'scopes:\n  - id: a\n    parent: repository\n    paths: ["same/**"]\n', ".ai/z.yaml": 'scopes:\n  - id: z\n    parent: repository\n    paths: ["same/**"]\n' });
  const result = resolveGovernancePaths(value, ["same/a.md"]);
  assert.deepEqual(result.errors.map((error) => error.source.document), [".ai/a.yaml", ".ai/z.yaml"]);
  assert.deepEqual(result.errors.map((error) => error.source.field), ["/scopes/0/paths/0", "/scopes/0/paths/0"]);
  assert.deepEqual(result.errors.map((error) => error.path), ["same/a.md", "same/a.md"]);
  assert.deepEqual(result.errors.map((error) => error.code), ["ambiguous-scope-match", "ambiguous-scope-match"]);
});

test("cross-document ambiguity diagnostics sort by document, field, code, and path", () => {
  const value = governanceFiles({ ".ai/pakemin.yaml": 'formatVersion: "0"\nincludes: [z.yaml, a.yaml]\nscopes:\n  - id: repository\n    paths: ["**"]\n', ".ai/a.yaml": 'scopes:\n  - id: a-one\n    parent: repository\n    paths: ["same/**"]\n  - id: a-two\n    parent: repository\n    paths: ["same/**"]\n', ".ai/z.yaml": 'scopes:\n  - id: z-one\n    parent: repository\n    paths: ["same/**"]\n' });
  const result = resolveGovernancePaths(value, ["same/a.md", "same/b.md"]);
  const tuples = result.errors.map((error) => [error.source.document, error.source.field, error.code, error.path]);
  assert.deepEqual(tuples, [
    [".ai/a.yaml", "/scopes/0/paths/0", "ambiguous-scope-match", "same/a.md"],
    [".ai/a.yaml", "/scopes/0/paths/0", "ambiguous-scope-match", "same/b.md"],
    [".ai/a.yaml", "/scopes/1/paths/0", "ambiguous-scope-match", "same/a.md"],
    [".ai/a.yaml", "/scopes/1/paths/0", "ambiguous-scope-match", "same/b.md"],
    [".ai/z.yaml", "/scopes/0/paths/0", "ambiguous-scope-match", "same/a.md"],
    [".ai/z.yaml", "/scopes/0/paths/0", "ambiguous-scope-match", "same/b.md"]
  ]);
});

test("included exception outside scope retains fragment provenance and closes output", () => {
  const value = governanceFiles({ ".ai/pakemin.yaml": 'formatVersion: "0"\nincludes: [exceptions.yaml]\nscopes:\n  - id: repository\n    paths: ["**"]\n  - id: docs\n    parent: repository\n    paths: ["docs/**"]\nrules:\n  - id: docs.allowed\n    type: allowed-paths\n    scope: docs\n    paths: ["docs/**"]\n', ".ai/exceptions.yaml": 'exceptions:\n  - id: exception.docs\n    rule: docs.allowed\n    scope: docs\n    paths: ["other/a.md"]\n    reason: approved\n    approvedBy: maintainer\n' });
  assert.deepEqual(resolveGovernancePaths(value, []), { ok: false, errors: [{ code: "exception-outside-scope", source: { document: ".ai/exceptions.yaml", field: "/exceptions/0/paths/0" }, path: "other/a.md" }] });
});

test("unrelated resolved exception scope fails without ambiguity", () => {
  const value = governance(`${base}  - id: docs\n    parent: repository\n    paths: ["docs/**"]\n  - id: api\n    parent: repository\n    paths: ["api/**"]\nrules:\n  - id: docs.allowed\n    type: allowed-paths\n    scope: docs\n    paths: ["docs/**"]\nexceptions:\n  - id: exception.docs\n    rule: docs.allowed\n    scope: docs\n    paths: ["api/a.md"]\n    reason: approved\n    approvedBy: maintainer\n`);
  const result = resolveGovernancePaths(value, []); assert.equal(result.errors[0].code, "exception-outside-scope"); assert.equal(result.errors.some((error) => error.code === "ambiguous-scope-match"), false);
});

test("failure results stay closed and never leak successful paths", () => {
  const ambiguity = governance(`${base}  - id: one\n    parent: repository\n    paths: ["same/**"]\n  - id: two\n    parent: repository\n    paths: ["same/**"]\n`);
  const ambiguityResult = resolveGovernancePaths(ambiguity, ["same/a.md", "clean/b.md"]);
  assert.equal(ambiguityResult.ok, false);
  assert.deepEqual(Object.keys(ambiguityResult), ["ok", "errors"]);
  assert.equal("resolution" in ambiguityResult, false);
  assert.equal(JSON.stringify(ambiguityResult).includes("clean/b.md"), false);

  const exception = governance(`${base}  - id: docs\n    parent: repository\n    paths: ["docs/**"]\nrules:\n  - id: docs.allowed\n    type: allowed-paths\n    scope: docs\n    paths: ["docs/**"]\nexceptions:\n  - id: exception.docs\n    rule: docs.allowed\n    scope: docs\n    paths: ["other/a.md"]\n    reason: approved\n    approvedBy: maintainer\n`);
  const exceptionResult = resolveGovernancePaths(exception, ["docs/ok.md"]);
  assert.equal(exceptionResult.errors.some((error) => error.code === "exception-outside-scope"), true);
  assert.equal(exceptionResult.ok, false);
  assert.deepEqual(Object.keys(exceptionResult), ["ok", "errors"]);
  assert.equal("resolution" in exceptionResult, false);
  assert.equal(JSON.stringify(exceptionResult).includes("docs/ok.md"), false);
});

test("successful resolver output is recursively plain documented data", () => {
  const { root, governance: value } = governanceWithRoot(base);
  const result = resolveGovernancePaths(value, ["missing/a.md"]);
  const visit = (item) => { assert.equal(item instanceof Map || item instanceof Set || item instanceof RegExp || typeof item === "function", false); if (Array.isArray(item)) { assert.equal(Object.getPrototypeOf(item), Array.prototype); item.forEach(visit); } else if (item && typeof item === "object") { assert.equal(Object.getPrototypeOf(item), Object.prototype); Object.values(item).forEach(visit); } else if (typeof item === "string") assert.equal(item.includes(root), false); };
  visit(result);
  assert.deepEqual(Object.keys(result), ["ok", "resolution"]);
  assert.deepEqual(Object.keys(result.resolution), ["paths"]);
  assert.deepEqual(Object.keys(result.resolution.paths[0]), ["path", "directScopeIds", "effectiveScopeIds", "ruleIds", "exceptionIds"]);
});

test("returned arrays never alias governance or a later resolution", () => {
  const value = governance(base); const snapshot = structuredClone(value); const first = resolveGovernancePaths(value, ["a.md"]); first.resolution.paths.push({}); first.resolution.paths[0].directScopeIds.push("x"); first.resolution.paths[0].effectiveScopeIds.push("x"); first.resolution.paths[0].ruleIds.push("x"); first.resolution.paths[0].exceptionIds.push("x");
  assert.deepEqual(value, snapshot); assert.deepEqual(resolveGovernancePaths(value, ["a.md"]).resolution.paths[0], { path: "a.md", directScopeIds: ["repository"], effectiveScopeIds: ["repository"], ruleIds: [], exceptionIds: [] });
});

test("CLI help has no public check command", () => {
  const help = spawnSync(process.execPath, ["./bin/pakemin.js", "--help"], { cwd: process.cwd(), encoding: "utf8" });
  assert.equal(help.stdout.includes("  check"), false);
  const unsupported = spawnSync(process.execPath, ["./bin/pakemin.js", "check"], { cwd: process.cwd(), encoding: "utf8" });
  assert.notEqual(unsupported.status, 0);
});

test("acceptance coverage map names every resolver acceptance row", () => {
  assert.deepEqual(Object.keys(ACCEPTANCE_COVERAGE), Array.from({ length: 11 }, (_, index) => String(index + 1)));
  assert.equal(Object.values(ACCEPTANCE_COVERAGE).every((name) => typeof name === "string" && name.length > 0), true);
});
