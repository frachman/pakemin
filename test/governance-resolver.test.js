import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadGovernance, resolveGovernancePaths } from "../src/governance/index.js";

function governance(yaml) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pakemin-resolver-"));
  fs.mkdirSync(path.join(root, ".ai")); fs.writeFileSync(path.join(root, ".ai/pakemin.yaml"), yaml);
  const loaded = loadGovernance(root); assert.equal(loaded.ok, true); return loaded.governance;
}
const base = 'formatVersion: "0"\nscopes:\n  - id: repository\n    paths: ["**"]\n';

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
