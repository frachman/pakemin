import { compare, diagnostic, sortDiagnostics } from "./diagnostics.js";
import { isCanonicalGovernancePath, matchesGovernancePattern } from "./paths.js";

export function resolveGovernancePaths(governance, paths) {
  assertInput(governance, paths);
  const model = modelFor(governance);
  const byPath = new Map();
  const errors = [];
  for (const file of paths) {
    const result = resolvePath(model, file);
    if (result.errors) errors.push(...result.errors);
    else byPath.set(file, result);
  }
  if (errors.length) return { ok: false, errors: sortDiagnostics(errors) };
  return { ok: true, resolution: { paths: [...byPath.values()].sort((left, right) => compare(left.path, right.path)).map(publicResult) } };
}

export function resolvePath(model, file) {
  const direct = [];
  for (const scope of model.scopes) {
    const patternIndex = scope.definition.paths.findIndex((pattern) => matchesGovernancePattern(pattern, file));
    if (patternIndex !== -1) direct.push({ scope, patternIndex });
  }
  const participants = direct.filter(({ scope }) => scope.definition.id !== "repository" && direct.some(({ scope: other }) => other.definition.id !== "repository" && other !== scope && !ancestor(scope.definition.id, other.definition.id, model.scopesById) && !ancestor(other.definition.id, scope.definition.id, model.scopesById)));
  if (participants.length) return { errors: participants.map(({ scope, patternIndex }) => ({ ...diagnostic("ambiguous-scope-match", scope.source.document, `${scope.source.field}/paths/${patternIndex}`), path: file })) };
  const deepest = [...direct].sort((left, right) => depth(right.scope, model.scopesById) - depth(left.scope, model.scopesById) || compare(left.scope.definition.id, right.scope.definition.id))[0]?.scope;
  const chain = chainFor(deepest || model.scopesById.get("repository"), model.scopesById);
  const effectiveScopeIds = chain.map((scope) => scope.definition.id);
  const rules = model.rules.filter((rule) => effectiveScopeIds.includes(rule.definition.scope)).sort((left, right) => depth(model.scopesById.get(left.definition.scope), model.scopesById) - depth(model.scopesById.get(right.definition.scope), model.scopesById) || compare(left.definition.id, right.definition.id));
  return { path: file, directScopeIds: direct.map(({ scope }) => scope).sort((left, right) => depth(left, model.scopesById) - depth(right, model.scopesById) || compare(left.definition.id, right.definition.id)).map((scope) => scope.definition.id), effectiveScopeIds, ruleIds: rules.map((rule) => rule.definition.id), exceptionIds: [] };
}

export function modelFor(governance) { return { governance, scopes: governance.scopes, rules: governance.rules, exceptions: governance.exceptions, scopesById: new Map(governance.scopes.map((scope) => [scope.definition.id, scope])) }; }

function publicResult(result) { return { path: result.path, directScopeIds: [...result.directScopeIds], effectiveScopeIds: [...result.effectiveScopeIds], ruleIds: [...result.ruleIds], exceptionIds: [...result.exceptionIds] }; }
function chainFor(scope, scopes) { const result = []; let current = scope; while (current) { result.unshift(current); current = current.definition.id === "repository" ? undefined : scopes.get(current.definition.parent); } return result; }
function ancestor(ancestorId, childId, scopes) { let current = scopes.get(childId); while (current && current.definition.id !== "repository") { if (current.definition.parent === ancestorId) return true; current = scopes.get(current.definition.parent); } return false; }
function depth(scope, scopes) { let result = 0; let current = scope; while (current && current.definition.id !== "repository") { result += 1; current = scopes.get(current.definition.parent); } return result; }
function assertInput(governance, paths) {
  if (!Array.isArray(paths) || !governance || governance.formatVersion !== "0" || !Array.isArray(governance.scopes) || !Array.isArray(governance.rules) || !Array.isArray(governance.exceptions)) throw internalError();
  const seen = new Set();
  for (const file of paths) { if (!isCanonicalGovernancePath(file) || seen.has(file)) throw internalError(); seen.add(file); }
  for (const scope of governance.scopes) if (!scope?.definition || !scope?.source || typeof scope.definition.id !== "string" || !Array.isArray(scope.definition.paths)) throw internalError();
}
function internalError() { const error = new Error("invalid governance resolver input"); error.code = "internal-error"; return error; }
