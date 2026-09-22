import { compare, diagnostic, sortDiagnostics } from "./diagnostics.js";
import { isCanonicalGovernancePath, isExactGovernancePath, matchesGovernancePattern } from "./paths.js";

const identifier = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const ruleTypes = new Set(["allowed-paths", "forbidden-paths", "changed-path-requires-changed-path", "changed-path-requires-review"]);

export function resolveGovernancePaths(governance, paths) {
  assertInput(governance, paths);
  const model = modelFor(governance);
  const byPath = new Map();
  const errors = [];
  const allPaths = new Set(paths);
  for (const exception of model.exceptions) for (const file of exception.definition.paths) allPaths.add(file);
  for (const file of allPaths) {
    const result = resolvePath(model, file);
    if (result.errors) errors.push(...result.errors);
    else byPath.set(file, result);
  }
  for (const exception of model.exceptions) {
    exception.definition.paths.forEach((file, index) => {
      const resolved = byPath.get(file);
      if (resolved && !resolved.effectiveScopeIds.includes(exception.definition.scope)) errors.push({ ...diagnostic("exception-outside-scope", exception.source.document, `${exception.source.field}/paths/${index}`), path: file });
    });
  }
  if (errors.length) return { ok: false, errors: sortDiagnostics(errors) };
  for (const file of paths) {
    const resolved = byPath.get(file);
    resolved.exceptionIds = model.exceptions.filter((exception) => exception.definition.paths.includes(file) && resolved.effectiveScopeIds.includes(exception.definition.scope) && resolved.ruleIds.includes(exception.definition.rule)).map((exception) => exception.definition.id).sort(compare);
  }
  return { ok: true, resolution: { paths: paths.map((file) => byPath.get(file)).sort((left, right) => compare(left.path, right.path)).map(publicResult) } };
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
  assertGovernance(governance);
  if (!safeArray(paths)) throw internalError();
  const seen = new Set();
  for (const file of paths) { if (!isCanonicalGovernancePath(file) || seen.has(file)) throw internalError(); seen.add(file); }
}

function assertGovernance(governance) {
  if (!safeRecord(governance) || governance.formatVersion !== "0" || !isAiPath(governance.manifest) || !safeArray(governance.sources) || !safeArray(governance.scopes) || !safeArray(governance.rules) || !safeArray(governance.exceptions)) throw internalError();
  if (governance.sources.length === 0) throw internalError();
  const sources = new Set();
  for (const source of governance.sources) { if (!isAiPath(source) || sources.has(source)) throw internalError(); sources.add(source); }
  if (!sources.has(governance.manifest)) throw internalError();
  const scopes = new Map();
  for (const scope of governance.scopes) {
    if (!entry(scope) || !identifier.test(scope.definition.id) || !safeArray(scope.definition.paths) || scope.definition.paths.length === 0 || !scope.definition.paths.every(isValidPattern) || scopes.has(scope.definition.id)) throw internalError();
    if (scope.definition.id === "repository") { if (Object.hasOwn(scope.definition, "parent") || scope.definition.paths.length !== 1 || scope.definition.paths[0] !== "**") throw internalError(); }
    else if (typeof scope.definition.parent !== "string") throw internalError();
    scopes.set(scope.definition.id, scope);
  }
  const root = scopes.get("repository"); if (!root || governance.scopes.filter((scope) => scope.definition.id === "repository").length !== 1) throw internalError();
  for (const scope of scopes.values()) if (scope.definition.id !== "repository" && !scopes.has(scope.definition.parent)) throw internalError();
  for (const scope of scopes.values()) { const seen = new Set(); let current = scope; while (current.definition.id !== "repository") { if (seen.has(current.definition.id)) throw internalError(); seen.add(current.definition.id); current = scopes.get(current.definition.parent); if (!current) throw internalError(); } }
  const rules = new Map();
  for (const rule of governance.rules) {
    if (!entry(rule) || !identifier.test(rule.definition.id) || typeof rule.definition.type !== "string" || typeof rule.definition.scope !== "string" || !ruleTypes.has(rule.definition.type) || !scopes.has(rule.definition.scope) || rules.has(rule.definition.id) || !normalizedRule(rule.definition)) throw internalError();
    rules.set(rule.definition.id, rule);
  }
  const exceptions = new Set();
  for (const exception of governance.exceptions) {
    if (!entry(exception) || !identifier.test(exception.definition.id) || typeof exception.definition.rule !== "string" || typeof exception.definition.scope !== "string" || typeof exception.definition.reason !== "string" || exception.definition.reason.length === 0 || typeof exception.definition.approvedBy !== "string" || exception.definition.approvedBy.length === 0 || !safeArray(exception.definition.paths) || exception.definition.paths.length === 0 || !exception.definition.paths.every(isExactGovernancePath) || exceptions.has(exception.definition.id) || !rules.has(exception.definition.rule) || !scopes.has(exception.definition.scope)) throw internalError();
    exceptions.add(exception.definition.id);
  }
}

function entry(value) { return safeRecord(value) && safeRecord(value.definition) && source(value.source); }
function source(value) { return safeRecord(value) && value.layer === "repository" && isAiPath(value.document) && validPointer(value.field); }
function normalizedRule(value) {
  if (value.description !== undefined && typeof value.description !== "string") return false;
  if (["allowed-paths", "forbidden-paths", "changed-path-requires-review"].includes(value.type)) return safeArray(value.paths) && value.paths.length > 0 && value.paths.every(isValidPattern);
  return changedPart(value.when) && changedPart(value.require);
}
function changedPart(value) { return safeRecord(value) && safeRecord(value.changedPaths) && safeArray(value.changedPaths.include) && value.changedPaths.include.length > 0 && value.changedPaths.include.every(isValidPattern); }
function isValidPattern(value) { return typeof value === "string" && isCanonicalGovernancePath(value) && !value.startsWith("!") && !/[?\[\]{}\\]/.test(value) && !/[@+*!?]\(/.test(value) && value.split("/").every((segment) => segment === "**" || !segment.includes("**")); }
function isAiPath(value) { return isCanonicalGovernancePath(value) && value.startsWith(".ai/"); }
function safeRecord(value) { if (value === null || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return false; return Object.values(Object.getOwnPropertyDescriptors(value)).every((descriptor) => Object.hasOwn(descriptor, "value")); }
function safeArray(value) { if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return false; const descriptors = Object.getOwnPropertyDescriptors(value); for (let index = 0; index < value.length; index += 1) if (!Object.hasOwn(descriptors, String(index)) || !Object.hasOwn(descriptors[String(index)], "value")) return false; return Object.values(descriptors).every((descriptor) => Object.hasOwn(descriptor, "value")); }
function validPointer(value) { return typeof value === "string" && value.startsWith("/") && !/(?:^|[^~])~(?:$|[^01])/.test(value) && !/~[^01]/.test(value); }
function internalError() { const error = new Error("invalid governance resolver input"); error.code = "internal-error"; return error; }
