import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadGovernance } from "../src/governance/index.js";
import { classifyInputs } from "../src/verification/changes.js";
import { verifyRepository } from "../src/verification/index.js";

const COMPARISON = { source: "git", baseline: "a1", target: "b2", reproducible: true };

const BASE = 'formatVersion: "0"\nscopes:\n  - id: repository\n    paths: ["**"]\n';
const DOCS_SCOPE = '  - id: docs\n    parent: repository\n    paths: ["docs/**"]\n';
const REQUIRED_RULE = `${BASE}rules:\n  - id: repository.source-change-requires-tests\n    type: changed-path-requires-changed-path\n    scope: repository\n    when:\n      changedPaths:\n        include: ["src/**"]\n    require:\n      changedPaths:\n        include: ["test/**"]\n`;
const FORBIDDEN_RULE = `${BASE}rules:\n  - id: repository.protect-production\n    type: forbidden-paths\n    scope: repository\n    paths: ["infra/production/**"]\n`;
const REVIEW_RULE = `${BASE}rules:\n  - id: repository.ci-change-requires-review\n    type: changed-path-requires-review\n    scope: repository\n    paths: [".github/workflows/**"]\n`;
const BOTH_RULES = `${BASE}rules:\n  - id: repository.ci-change-requires-review\n    type: changed-path-requires-review\n    scope: repository\n    paths: [".github/workflows/**"]\n  - id: repository.protect-production\n    type: forbidden-paths\n    scope: repository\n    paths: ["infra/production/**"]\n`;
const EXCEPTION_RULES = `${BASE}rules:\n  - id: repository.protect-shared-ui\n    type: forbidden-paths\n    scope: repository\n    paths: ["packages/ui/**"]\n  - id: repository.protect-button\n    type: forbidden-paths\n    scope: repository\n    paths: ["packages/ui/Button.tsx"]\nexceptions:\n  - id: exception.shared-ui-button-001\n    rule: repository.protect-shared-ui\n    scope: repository\n    paths: ["packages/ui/Button.tsx"]\n    reason: approved\n    approvedBy: maintainer\n`;
const RENAME_RULE = `${BASE}rules:\n  - id: repository.protect-shared-ui\n    type: forbidden-paths\n    scope: repository\n    paths: ["packages/ui/**"]\nexceptions:\n  - id: exception.shared-ui-button-001\n    rule: repository.protect-shared-ui\n    scope: repository\n    paths: ["packages/ui/Button.tsx"]\n    reason: approved\n    approvedBy: maintainer\n`;
const AMBIGUOUS_SCOPES = 'formatVersion: "0"\nscopes:\n  - id: repository\n    paths: ["**"]\n  - id: app\n    parent: repository\n    paths: ["apps/**"]\n  - id: docs\n    parent: repository\n    paths: ["apps/docs/**"]\n';
const OUTSIDE_EXCEPTION = `${BASE}${DOCS_SCOPE}rules:\n  - id: docs.allowed\n    type: allowed-paths\n    scope: docs\n    paths: ["docs/**"]\nexceptions:\n  - id: exception.docs\n    rule: docs.allowed\n    scope: docs\n    paths: ["other/a.md"]\n    reason: approved\n    approvedBy: maintainer\n`;
const ALLOWED_TWO = `${BASE}rules:\n  - id: repository.allowed\n    type: allowed-paths\n    scope: repository\n    paths: ["apps/**", "apps/docs/**"]\n`;
const FORBIDDEN_CLEAR = `${BASE}${DOCS_SCOPE}rules:\n  - id: docs.protect-private\n    type: forbidden-paths\n    scope: docs\n    paths: ["docs/private/**"]\n`;
const ORDERING_RULES = `${BASE}${DOCS_SCOPE}rules:\n  - id: repository.never\n    type: forbidden-paths\n    scope: repository\n    paths: ["never/**"]\n  - id: docs.private\n    type: forbidden-paths\n    scope: docs\n    paths: ["docs/**"]\n`;

function load(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pakemin-verification-"));
  for (const [name, contents] of Object.entries(files)) {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
  }
  const loaded = loadGovernance(root);
  assert.equal(loaded.ok, true);
  return { root, governance: loaded.governance };
}
function governanceOf(yaml) { return load({ ".ai/pakemin.yaml": yaml }).governance; }
function summary(changes, evaluations, satisfied, violated, indeterminate) { return { changes, evaluations, satisfied, violated, indeterminate }; }
function report(outcome, changes, summaryCounts, evaluations) {
  return { contractVersion: "0", governanceSchemaVersion: "0", verificationMode: "repository", outcome, comparison: COMPARISON, changes, summary: summaryCounts, evaluations };
}

const REQUIRED_PRESENT_EVALUATION = {
  ruleId: "repository.source-change-requires-tests",
  ruleType: "changed-path-requires-changed-path",
  state: "satisfied",
  reasonCode: "required-changed-path-present",
  scopeId: "repository",
  source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/rules/0" },
  affectedPaths: [{ path: "src/app.js", role: "path", changeKind: "modified" }, { path: "test/app.test.js", role: "path", changeKind: "modified" }],
  evidence: [{ kind: "required-match", path: "test/app.test.js", role: "path", changeKind: "modified", pattern: "test/**" }, { kind: "required-trigger", path: "src/app.js", role: "path", changeKind: "modified", pattern: "src/**" }],
  explanation: "Required changed path evidence is present."
};

const FIXTURE_INVENTORY = [
  "empty-change-set",
  "required-present",
  "required-missing",
  "forbidden-match",
  "exception-waives-one-rule-only",
  "review-required",
  "fail-dominates-review",
  "rename-independent-sides",
  "ambiguous-change-path",
  "outside-scope-exception-empty-changes",
  "invalid-comparison",
  "invalid-change-set-duplicate",
  "allowed-two-pattern-evidence",
  "forbidden-clear-no-match",
  "evaluation-ordering",
  "evidence-ordering"
];

const FIXTURES = {
  "empty-change-set": () => ({ governance: governanceOf(BASE), comparison: COMPARISON, changes: [], expected: { ok: true, report: report("pass", [], summary(0, 0, 0, 0, 0), []) } }),
  "required-present": () => ({ governance: governanceOf(REQUIRED_RULE), comparison: COMPARISON, changes: [{ kind: "modified", path: "src/app.js" }, { kind: "modified", path: "test/app.test.js" }], expected: { ok: true, report: report("pass", [{ kind: "modified", path: "src/app.js" }, { kind: "modified", path: "test/app.test.js" }], summary(2, 1, 1, 0, 0), [REQUIRED_PRESENT_EVALUATION]) } }),
  "required-missing": () => ({ governance: governanceOf(REQUIRED_RULE), comparison: COMPARISON, changes: [{ kind: "modified", path: "src/app.js" }], expected: { ok: true, report: report("fail", [{ kind: "modified", path: "src/app.js" }], summary(1, 1, 0, 1, 0), [{ ruleId: "repository.source-change-requires-tests", ruleType: "changed-path-requires-changed-path", state: "violated", reasonCode: "required-changed-path-missing", scopeId: "repository", source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/rules/0" }, affectedPaths: [{ path: "src/app.js", role: "path", changeKind: "modified" }], evidence: [{ kind: "required-missing", patterns: ["test/**"] }, { kind: "required-trigger", path: "src/app.js", role: "path", changeKind: "modified", pattern: "src/**" }], explanation: "Required changed path evidence is missing." }]) } }),
  "forbidden-match": () => ({ governance: governanceOf(FORBIDDEN_RULE), comparison: COMPARISON, changes: [{ kind: "modified", path: "infra/production/app.yaml" }], expected: { ok: true, report: report("fail", [{ kind: "modified", path: "infra/production/app.yaml" }], summary(1, 1, 0, 1, 0), [{ ruleId: "repository.protect-production", ruleType: "forbidden-paths", state: "violated", reasonCode: "forbidden-path-matched", scopeId: "repository", source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/rules/0" }, affectedPaths: [{ path: "infra/production/app.yaml", role: "path", changeKind: "modified" }], evidence: [{ kind: "forbidden-match", path: "infra/production/app.yaml", role: "path", changeKind: "modified", pattern: "infra/production/**" }], explanation: "One or more relevant paths match a forbidden pattern." }]) } }),
  "exception-waives-one-rule-only": () => ({ governance: governanceOf(EXCEPTION_RULES), comparison: COMPARISON, changes: [{ kind: "modified", path: "packages/ui/Button.tsx" }], expected: { ok: true, report: report("fail", [{ kind: "modified", path: "packages/ui/Button.tsx" }], summary(1, 2, 1, 1, 0), [
    { ruleId: "repository.protect-button", ruleType: "forbidden-paths", state: "violated", reasonCode: "forbidden-path-matched", scopeId: "repository", source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/rules/1" }, affectedPaths: [{ path: "packages/ui/Button.tsx", role: "path", changeKind: "modified" }], evidence: [{ kind: "forbidden-match", path: "packages/ui/Button.tsx", role: "path", changeKind: "modified", pattern: "packages/ui/Button.tsx" }], explanation: "One or more relevant paths match a forbidden pattern." },
    { ruleId: "repository.protect-shared-ui", ruleType: "forbidden-paths", state: "satisfied", reasonCode: "forbidden-paths-clear", scopeId: "repository", source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/rules/0" }, affectedPaths: [{ path: "packages/ui/Button.tsx", role: "path", changeKind: "modified" }], evidence: [{ kind: "exception-applied", path: "packages/ui/Button.tsx", role: "path", changeKind: "modified", exceptionId: "exception.shared-ui-button-001" }, { kind: "forbidden-match", path: "packages/ui/Button.tsx", role: "path", changeKind: "modified", pattern: "packages/ui/**" }], explanation: "Every forbidden match is excepted." }
  ]) } }),
  "review-required": () => ({ governance: governanceOf(REVIEW_RULE), comparison: COMPARISON, changes: [{ kind: "modified", path: ".github/workflows/ci.yml" }], expected: { ok: true, report: report("requires-review", [{ kind: "modified", path: ".github/workflows/ci.yml" }], summary(1, 1, 0, 0, 1), [{ ruleId: "repository.ci-change-requires-review", ruleType: "changed-path-requires-review", state: "indeterminate", reasonCode: "human-review-required", scopeId: "repository", source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/rules/0" }, affectedPaths: [{ path: ".github/workflows/ci.yml", role: "path", changeKind: "modified" }], evidence: [{ kind: "review-match", path: ".github/workflows/ci.yml", role: "path", changeKind: "modified", pattern: ".github/workflows/**" }], explanation: "Human review is required for changed paths." }]) } }),
  "fail-dominates-review": () => ({ governance: governanceOf(BOTH_RULES), comparison: COMPARISON, changes: [{ kind: "modified", path: ".github/workflows/ci.yml" }, { kind: "modified", path: "infra/production/app.yaml" }], expected: { ok: true, report: report("fail", [{ kind: "modified", path: ".github/workflows/ci.yml" }, { kind: "modified", path: "infra/production/app.yaml" }], summary(2, 2, 0, 1, 1), [
    { ruleId: "repository.ci-change-requires-review", ruleType: "changed-path-requires-review", state: "indeterminate", reasonCode: "human-review-required", scopeId: "repository", source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/rules/0" }, affectedPaths: [{ path: ".github/workflows/ci.yml", role: "path", changeKind: "modified" }], evidence: [{ kind: "review-match", path: ".github/workflows/ci.yml", role: "path", changeKind: "modified", pattern: ".github/workflows/**" }], explanation: "Human review is required for changed paths." },
    { ruleId: "repository.protect-production", ruleType: "forbidden-paths", state: "violated", reasonCode: "forbidden-path-matched", scopeId: "repository", source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/rules/1" }, affectedPaths: [{ path: "infra/production/app.yaml", role: "path", changeKind: "modified" }], evidence: [{ kind: "forbidden-clear", path: ".github/workflows/ci.yml", role: "path", changeKind: "modified" }, { kind: "forbidden-match", path: "infra/production/app.yaml", role: "path", changeKind: "modified", pattern: "infra/production/**" }], explanation: "One or more relevant paths match a forbidden pattern." }
  ]) } }),
  "rename-independent-sides": () => ({ governance: governanceOf(RENAME_RULE), comparison: COMPARISON, changes: [{ kind: "renamed", oldPath: "packages/ui/Legacy.tsx", newPath: "packages/ui/Button.tsx" }], expected: { ok: true, report: report("fail", [{ kind: "renamed", oldPath: "packages/ui/Legacy.tsx", newPath: "packages/ui/Button.tsx" }], summary(1, 1, 0, 1, 0), [{ ruleId: "repository.protect-shared-ui", ruleType: "forbidden-paths", state: "violated", reasonCode: "forbidden-path-matched", scopeId: "repository", source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/rules/0" }, affectedPaths: [{ path: "packages/ui/Button.tsx", role: "destination", changeKind: "renamed" }, { path: "packages/ui/Legacy.tsx", role: "source", changeKind: "renamed" }], evidence: [{ kind: "exception-applied", path: "packages/ui/Button.tsx", role: "destination", changeKind: "renamed", exceptionId: "exception.shared-ui-button-001" }, { kind: "forbidden-match", path: "packages/ui/Button.tsx", role: "destination", changeKind: "renamed", pattern: "packages/ui/**" }, { kind: "forbidden-match", path: "packages/ui/Legacy.tsx", role: "source", changeKind: "renamed", pattern: "packages/ui/**" }], explanation: "One or more relevant paths match a forbidden pattern." }]) } }),
  "ambiguous-change-path": () => ({ governance: governanceOf(AMBIGUOUS_SCOPES), comparison: COMPARISON, changes: [{ kind: "modified", path: "apps/docs/index.md" }], expected: { ok: false, errorKind: "configuration", contractVersion: "0", exitCode: 3, errors: [{ code: "ambiguous-scope-match", source: { document: ".ai/pakemin.yaml", field: "/scopes/1/paths/0" }, path: "apps/docs/index.md" }, { code: "ambiguous-scope-match", source: { document: ".ai/pakemin.yaml", field: "/scopes/2/paths/0" }, path: "apps/docs/index.md" }] } }),
  "outside-scope-exception-empty-changes": () => ({ governance: governanceOf(OUTSIDE_EXCEPTION), comparison: COMPARISON, changes: [], expected: { ok: false, errorKind: "configuration", contractVersion: "0", exitCode: 3, errors: [{ code: "exception-outside-scope", source: { document: ".ai/pakemin.yaml", field: "/exceptions/0/paths/0" }, path: "other/a.md" }] } }),
  "invalid-comparison": () => ({ governance: governanceOf(BASE), comparison: { source: "git", target: "b2", reproducible: true }, changes: [], expected: { ok: false, errorKind: "runtime", contractVersion: "0", exitCode: 4, errors: [{ code: "invalid-comparison", message: "invalid comparison: baseline must be a nonempty string" }, { code: "invalid-comparison", message: "invalid comparison: fields must be exactly source, baseline, target, reproducible" }] } }),
  "invalid-change-set-duplicate": () => ({ governance: governanceOf(BASE), comparison: COMPARISON, changes: [{ kind: "modified", path: "src/app.js" }, { kind: "modified", path: "src/app.js" }], expected: { ok: false, errorKind: "runtime", contractVersion: "0", exitCode: 4, errors: [{ code: "invalid-change-set", message: "invalid change entry at index 1: duplicate change identity" }] } }),
  "allowed-two-pattern-evidence": () => ({ governance: governanceOf(ALLOWED_TWO), comparison: COMPARISON, changes: [{ kind: "modified", path: "apps/docs/index.md" }], expected: { ok: true, report: report("pass", [{ kind: "modified", path: "apps/docs/index.md" }], summary(1, 1, 1, 0, 0), [{ ruleId: "repository.allowed", ruleType: "allowed-paths", state: "satisfied", reasonCode: "allowed-paths-satisfied", scopeId: "repository", source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/rules/0" }, affectedPaths: [{ path: "apps/docs/index.md", role: "path", changeKind: "modified" }], evidence: [{ kind: "allowed-match", path: "apps/docs/index.md", role: "path", changeKind: "modified", pattern: "apps/**" }, { kind: "allowed-match", path: "apps/docs/index.md", role: "path", changeKind: "modified", pattern: "apps/docs/**" }], explanation: "Every relevant path is allowed." }]) } }),
  "forbidden-clear-no-match": () => ({ governance: governanceOf(FORBIDDEN_CLEAR), comparison: COMPARISON, changes: [{ kind: "modified", path: "docs/public/a.md" }], expected: { ok: true, report: report("pass", [{ kind: "modified", path: "docs/public/a.md" }], summary(1, 1, 1, 0, 0), [{ ruleId: "docs.protect-private", ruleType: "forbidden-paths", state: "satisfied", reasonCode: "forbidden-paths-clear", scopeId: "docs", source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/rules/0" }, affectedPaths: [], evidence: [{ kind: "forbidden-clear", path: "docs/public/a.md", role: "path", changeKind: "modified" }], explanation: "No relevant path matches a forbidden pattern." }]) } }),
  "evaluation-ordering": () => ({ governance: governanceOf(ORDERING_RULES), comparison: COMPARISON, changes: [{ kind: "modified", path: "docs/a.md" }], expected: { ok: true, report: report("fail", [{ kind: "modified", path: "docs/a.md" }], summary(1, 2, 1, 1, 0), [
    { ruleId: "repository.never", ruleType: "forbidden-paths", state: "satisfied", reasonCode: "forbidden-paths-clear", scopeId: "repository", source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/rules/0" }, affectedPaths: [], evidence: [{ kind: "forbidden-clear", path: "docs/a.md", role: "path", changeKind: "modified" }], explanation: "No relevant path matches a forbidden pattern." },
    { ruleId: "docs.private", ruleType: "forbidden-paths", state: "violated", reasonCode: "forbidden-path-matched", scopeId: "docs", source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/rules/1" }, affectedPaths: [{ path: "docs/a.md", role: "path", changeKind: "modified" }], evidence: [{ kind: "forbidden-match", path: "docs/a.md", role: "path", changeKind: "modified", pattern: "docs/**" }], explanation: "One or more relevant paths match a forbidden pattern." }
  ]) } }),
  "evidence-ordering": () => ({ governance: governanceOf(ALLOWED_TWO), comparison: COMPARISON, changes: [{ kind: "modified", path: "apps/docs/index.md" }, { kind: "modified", path: "missing/file.txt" }], expected: { ok: true, report: report("fail", [{ kind: "modified", path: "apps/docs/index.md" }, { kind: "modified", path: "missing/file.txt" }], summary(2, 1, 0, 1, 0), [{ ruleId: "repository.allowed", ruleType: "allowed-paths", state: "violated", reasonCode: "path-not-allowed", scopeId: "repository", source: { layer: "repository", document: ".ai/pakemin.yaml", field: "/rules/0" }, affectedPaths: [{ path: "apps/docs/index.md", role: "path", changeKind: "modified" }, { path: "missing/file.txt", role: "path", changeKind: "modified" }], evidence: [{ kind: "allowed-match", path: "apps/docs/index.md", role: "path", changeKind: "modified", pattern: "apps/**" }, { kind: "allowed-match", path: "apps/docs/index.md", role: "path", changeKind: "modified", pattern: "apps/docs/**" }, { kind: "allowed-miss", path: "missing/file.txt", role: "path", changeKind: "modified" }], explanation: "One or more relevant paths are not allowed." }]) } })
};

const FIXTURE_COVERAGE = Object.fromEntries(FIXTURE_INVENTORY.map((key) => [key, `verification fixture: ${key}`]));

test("comparison and change-set validation classifies runtime input errors", async (t) => {
  await t.test("comparison missing a field", () => expectRuntime(classifyInputs({ source: "git", target: "b2", reproducible: true }, []), ["invalid-comparison", "invalid-comparison"]));
  await t.test("comparison extra field", () => expectRuntime(classifyInputs({ ...COMPARISON, extra: 1 }, []), ["invalid-comparison"]));
  await t.test("comparison source not git", () => expectRuntime(classifyInputs({ ...COMPARISON, source: "svn" }, []), ["invalid-comparison"], ['invalid comparison: source must be "git"']));
  await t.test("empty baseline or target", () => expectRuntime(classifyInputs({ ...COMPARISON, baseline: "", target: "" }, []), ["invalid-comparison", "invalid-comparison"]));
  await t.test("non-boolean reproducible", () => expectRuntime(classifyInputs({ ...COMPARISON, reproducible: "true" }, []), ["invalid-comparison"]));
  await t.test("non-array changes", () => expectRuntime(classifyInputs(COMPARISON, "nope"), ["invalid-change-set"], ["changes must be an array"]));
  await t.test("unsupported kind", () => expectRuntime(classifyInputs(COMPARISON, [{ kind: "copied", path: "a.md" }]), ["unsupported-change-kind"], ['unsupported change kind "copied" at index 0']));
  await t.test("modified carrying oldPath", () => expectRuntime(classifyInputs(COMPARISON, [{ kind: "modified", path: "a.md", oldPath: "b.md" }]), ["invalid-change-set"]));
  await t.test("rename missing newPath", () => expectRuntime(classifyInputs(COMPARISON, [{ kind: "renamed", oldPath: "a.md" }]), ["invalid-change-set"]));
  for (const noncanonical of ["docs//a.md", "../a", "docs/a.md/"]) {
    await t.test(`noncanonical path ${noncanonical}`, () => expectRuntime(classifyInputs(COMPARISON, [{ kind: "modified", path: noncanonical }]), ["invalid-change-set"]));
  }
  await t.test("identical rename source and destination", () => expectRuntime(classifyInputs(COMPARISON, [{ kind: "renamed", oldPath: "a.md", newPath: "a.md" }]), ["invalid-change-set"]));
  await t.test("duplicate modified identity", () => expectRuntime(classifyInputs(COMPARISON, [{ kind: "modified", path: "a.md" }, { kind: "modified", path: "a.md" }]), ["invalid-change-set"], ["invalid change entry at index 1: duplicate change identity"]));
  await t.test("duplicate rename identity", () => expectRuntime(classifyInputs(COMPARISON, [{ kind: "renamed", oldPath: "a.md", newPath: "b.md" }, { kind: "renamed", oldPath: "a.md", newPath: "b.md" }]), ["invalid-change-set"]));
  await t.test("multiple offending entries stay one error per entry in stable order", () => {
    const result = classifyInputs(COMPARISON, [{ kind: "copied", path: "a.md" }, { kind: "modified", path: "docs//a.md" }, { kind: "modified", path: "b.md" }, { kind: "modified", path: "b.md" }]);
    assert.deepEqual(result.errors.map((error) => error.code), ["invalid-change-set", "invalid-change-set", "unsupported-change-kind"]);
    assert.deepEqual(result.errors.map((error) => error.message), ["invalid change entry at index 1: path \"docs//a.md\" is not canonical", "invalid change entry at index 3: duplicate change identity", "unsupported change kind \"copied\" at index 0"]);
  });
  await t.test("valid mixed change set with reproducible false is accepted", () => {
    const changes = [{ kind: "added", path: "a.md" }, { kind: "modified", path: "src/app.js" }, { kind: "deleted", path: "old.md" }, { kind: "renamed", oldPath: "x.md", newPath: "y.md" }];
    assert.equal(classifyInputs({ ...COMPARISON, reproducible: false }, changes), null);
  });
});

test("the verification fixture inventory matches the keyed fixture object", () => {
  assert.deepEqual(Object.keys(FIXTURES), FIXTURE_INVENTORY);
  assert.equal(FIXTURE_INVENTORY.length, 16);
  assert.deepEqual(Object.keys(FIXTURE_COVERAGE), FIXTURE_INVENTORY);
});

for (const key of FIXTURE_INVENTORY) test(`verification fixture: ${key}`, () => {
  const fixture = FIXTURES[key]();
  assert.deepEqual(verifyRepository(fixture.governance, fixture.comparison, fixture.changes), fixture.expected);
});

test("successful verification report is recursively plain documented data", () => {
  const { root, governance } = load({ ".ai/pakemin.yaml": REQUIRED_RULE });
  const result = verifyRepository(governance, COMPARISON, [{ kind: "modified", path: "src/app.js" }, { kind: "modified", path: "test/app.test.js" }]);
  assert.equal(result.ok, true);
  const visit = (item) => {
    assert.equal(item instanceof Map || item instanceof Set || item instanceof RegExp || typeof item === "function", false);
    if (Array.isArray(item)) { assert.equal(Object.getPrototypeOf(item), Array.prototype); item.forEach(visit); }
    else if (item && typeof item === "object") { assert.equal(Object.getPrototypeOf(item), Object.prototype); Object.values(item).forEach(visit); }
    else if (typeof item === "string") assert.equal(item.includes(root), false);
    else if (typeof item === "number") assert.equal(Number.isFinite(item), true);
  };
  visit(result.report);
  assert.deepEqual(Object.keys(result.report), ["contractVersion", "governanceSchemaVersion", "verificationMode", "outcome", "comparison", "changes", "summary", "evaluations"]);
  assert.deepEqual(Object.keys(result.report.comparison), ["source", "baseline", "target", "reproducible"]);
  assert.deepEqual(Object.keys(result.report.summary), ["changes", "evaluations", "satisfied", "violated", "indeterminate"]);
  const evaluation = result.report.evaluations[0];
  assert.deepEqual(Object.keys(evaluation), ["ruleId", "ruleType", "state", "reasonCode", "scopeId", "source", "affectedPaths", "evidence", "explanation"]);
  assert.deepEqual(Object.keys(evaluation.source), ["layer", "document", "field"]);
  assert.deepEqual(Object.keys(evaluation.affectedPaths[0]), ["path", "role", "changeKind"]);
  const fields = { "required-match": ["kind", "path", "role", "changeKind", "pattern"], "required-trigger": ["kind", "path", "role", "changeKind", "pattern"] };
  for (const item of evaluation.evidence) assert.deepEqual(Object.keys(item).sort(), fields[item.kind].slice().sort());
});

test("returned verification data never aliases governance, inputs, or a later verification", () => {
  const { governance } = load({ ".ai/pakemin.yaml": REQUIRED_RULE });
  const comparison = { ...COMPARISON };
  const changes = [{ kind: "modified", path: "src/app.js" }, { kind: "modified", path: "test/app.test.js" }];
  const governanceSnapshot = structuredClone(governance);
  const comparisonSnapshot = structuredClone(comparison);
  const changesSnapshot = structuredClone(changes);
  const expected = verifyRepository(governance, comparison, changes);
  const first = verifyRepository(governance, comparison, changes);
  first.report.changes.push({ kind: "added", path: "z.md" });
  first.report.changes[0].path = "mutated.md";
  first.report.evaluations.push({});
  first.report.evaluations[0].affectedPaths.push({ path: "x.md", role: "path", changeKind: "added" });
  first.report.evaluations[0].affectedPaths[0].path = "mutated.md";
  first.report.evaluations[0].evidence.push({ kind: "allowed-miss" });
  first.report.evaluations[0].evidence[0].kind = "mutated";
  first.report.summary.changes = 99;
  assert.deepEqual(governance, governanceSnapshot);
  assert.deepEqual(comparison, comparisonSnapshot);
  assert.deepEqual(changes, changesSnapshot);
  assert.deepEqual(verifyRepository(governance, comparison, changes), expected);
});

test("verification is deterministic for identical inputs", () => {
  const governance = governanceOf(REQUIRED_RULE);
  const changes = [{ kind: "modified", path: "src/app.js" }, { kind: "modified", path: "test/app.test.js" }];
  assert.deepEqual(verifyRepository(governance, COMPARISON, changes), verifyRepository(governance, COMPARISON, changes));
});

test("no failure return carries an outcome and no report carries an exit code", () => {
  const failures = [
    verifyRepository(governanceOf(BASE), { ...COMPARISON, source: "svn" }, []),
    verifyRepository(governanceOf(BASE), COMPARISON, [{ kind: "copied", path: "a.md" }]),
    verifyRepository(governanceOf(AMBIGUOUS_SCOPES), COMPARISON, [{ kind: "modified", path: "apps/docs/index.md" }]),
    verifyRepository(governanceOf(OUTSIDE_EXCEPTION), COMPARISON, [])
  ];
  for (const failure of failures) {
    assert.equal(failure.ok, false);
    assert.equal("outcome" in failure, false);
    assert.equal("report" in failure, false);
    assert.equal("exitCode" in failure, true);
  }
  const success = verifyRepository(governanceOf(BASE), COMPARISON, []);
  assert.equal(success.ok, true);
  assert.equal("exitCode" in success.report, false);
  assert.deepEqual(Object.keys(success.report).includes("exitCode"), false);
});

function expectRuntime(result, codes, messages = []) {
  assert.equal(result.ok, false);
  assert.equal(result.errorKind, "runtime");
  assert.equal(result.exitCode, 4);
  assert.equal(result.contractVersion, "0");
  assert.equal("outcome" in result, false);
  assert.deepEqual(result.errors.map((error) => error.code), codes);
  for (const message of messages) assert.equal(result.errors.some((error) => error.message === message), true, message);
}