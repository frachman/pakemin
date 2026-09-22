import { compare, diagnostic, sortDiagnostics } from "./diagnostics.js";
import { pointer } from "./yaml.js";

const identifier = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const ruleTypes = new Set(["allowed-paths", "forbidden-paths", "changed-path-requires-changed-path", "changed-path-requires-review"]);

export function validateGovernance(sources) {
  const errors = [];
  const manifest = sources.find((source) => source.kind === "manifest");
  for (const source of sources) validateTopLevel(source, source.kind === "manifest", errors);

  const items = collect(sources);
  const scopes = validateScopes(items.scopes, errors);
  const scopeById = new Map(scopes.map((item) => [item.definition.id, item]));
  validateRules(items.rules, scopeById, errors);
  validateExceptions(items.exceptions, scopeById, items.rules, errors);
  if (errors.length) return failure(errors);

  return {
    ok: true,
    governance: {
      formatVersion: "0",
      manifest: ".ai/pakemin.yaml",
      sources: sources.map((source) => source.document).sort(compare),
      scopes: output(byDepth(scopes, (item) => depth(item, scopeById))),
      rules: output(byDepth(items.rules, (item) => depth(scopeById.get(item.definition.scope), scopeById))),
      exceptions: output(stable(items.exceptions, (item) => item.definition.id))
    }
  };
}

function validateTopLevel(source, isManifest, errors) {
  const allowed = isManifest ? new Set(["formatVersion", "includes", "scopes", "rules", "exceptions"]) : new Set(["scopes", "rules", "exceptions"]);
  for (const key of Object.keys(source.value)) if (!allowed.has(key)) errors.push(diag("unknown-top-level-key", source, pointer("", key)));
  if (isManifest && source.value.formatVersion !== "0") errors.push(diag("unsupported-format-version", source, "/formatVersion"));
  if (source.value.includes !== undefined && !Array.isArray(source.value.includes)) errors.push(diag("invalid-include-path", source, "/includes"));
}

function collect(sources) {
  const result = { scopes: [], rules: [], exceptions: [] };
  for (const source of sources) {
    for (const category of Object.keys(result)) {
      const value = source.value[category];
      if (value === undefined) continue;
      if (!Array.isArray(value)) {
        result[category].push({ invalidCollection: true, source, category });
        continue;
      }
      value.forEach((definition, index) => result[category].push({ definition, source: provenance(source, `/${category}/${index}`), category }));
    }
  }
  return result;
}

function validateScopes(items, errors) {
  const valid = [];
  for (const item of items) {
    if (item.invalidCollection || !mapping(item.definition) || !scopeShape(item.definition)) {
      errors.push(diag("invalid-scope-shape", item.source || item.source, item.invalidCollection ? `/${item.category}` : item.source.field));
      continue;
    }
    if (!identifier.test(item.definition.id)) errors.push(diag("invalid-id", item.source, `${item.source.field}/id`));
    else valid.push(item);
  }
  duplicates(valid, "duplicate-scope-id", errors);
  const unique = withoutDuplicates(valid);
  const root = unique.filter((item) => item.definition.id === "repository");
  if (root.length !== 1 && !items.some((item) => item.invalidCollection)) errors.push(diag("missing-repository-scope", root[0]?.source || items[0]?.source || { document: ".ai/pakemin.yaml", field: "" }, root[0]?.source.field || "/scopes"));
  for (const item of root) if (item.definition.parent !== undefined || !same(item.definition.paths, ["**"])) errors.push(diag("invalid-repository-scope", item.source, item.source.field));
  const byId = new Map(unique.map((item) => [item.definition.id, item]));
  for (const item of unique) {
    const { id, parent, paths } = item.definition;
    if (id !== "repository" && !byId.has(parent)) errors.push(diag("unknown-parent-scope", item.source, `${item.source.field}/parent`));
    patterns(paths, item, "invalid-path-pattern", errors);
  }
  for (const item of unique) if (item.definition.id !== "repository" && cycle(item, byId)) errors.push(diag("scope-cycle", item.source, item.source.field));
  return unique;
}

function validateRules(items, scopes, errors) {
  const valid = [];
  for (const item of items) {
    if (item.invalidCollection || !mapping(item.definition) || !commonRuleShape(item.definition)) {
      errors.push(diag("invalid-rule-shape", item.source || item.source, item.invalidCollection ? `/${item.category}` : item.source.field)); continue;
    }
    const rule = item.definition;
    if (!identifier.test(rule.id)) errors.push(diag("invalid-id", item.source, `${item.source.field}/id`)); else valid.push(item);
    if (typeof rule.scope === "string" && !scopes.has(rule.scope)) errors.push(diag("unknown-rule-scope", item.source, `${item.source.field}/scope`));
    if (!ruleTypes.has(rule.type)) { errors.push(diag("unknown-rule-type", item.source, `${item.source.field}/type`)); continue; }
    if (!ruleShape(rule)) { errors.push(diag("invalid-rule-shape", item.source, item.source.field)); continue; }
    if (Array.isArray(rule.paths)) patterns(rule.paths, item, "invalid-path-pattern", errors);
    for (const field of ["when", "require"]) if (rule[field]) patterns(rule[field].changedPaths.include, item, "invalid-path-pattern", errors, `${item.source.field}/${field}/changedPaths/include`);
  }
  duplicates(valid, "duplicate-rule-id", errors);
  items.splice(0, items.length, ...withoutDuplicates(valid));
}

function validateExceptions(items, scopes, rules, errors) {
  const valid = [];
  const ruleById = new Map(rules.map((item) => [item.definition.id, item]));
  for (const item of items) {
    if (item.invalidCollection || !mapping(item.definition) || !exceptionShape(item.definition)) {
      errors.push(diag("invalid-exception-shape", item.source || item.source, item.invalidCollection ? `/${item.category}` : item.source.field)); continue;
    }
    const value = item.definition;
    if (!identifier.test(value.id)) errors.push(diag("invalid-id", item.source, `${item.source.field}/id`)); else valid.push(item);
    const target = ruleById.get(value.rule);
    if (!target) errors.push(diag("unknown-exception-rule", item.source, `${item.source.field}/rule`));
    else if (!["allowed-paths", "forbidden-paths"].includes(target.definition.type)) errors.push(diag("unsupported-exception-target", item.source, `${item.source.field}/rule`));
    if (!scopes.has(value.scope)) errors.push(diag("unknown-exception-scope", item.source, `${item.source.field}/scope`));
    else if (target && !descends(value.scope, target.definition.scope, scopes)) errors.push(diag("invalid-exception-scope", item.source, `${item.source.field}/scope`));
    value.paths.forEach((entry, index) => { if (!canonicalPath(entry) || entry.includes("*")) errors.push(diag("invalid-exception-path", item.source, `${item.source.field}/paths/${index}`)); });
  }
  duplicates(valid, "duplicate-exception-id", errors);
  items.splice(0, items.length, ...withoutDuplicates(valid));
}

function scopeShape(value) {
  const keys = Object.keys(value); const root = value.id === "repository";
  const allowed = root ? ["id", "paths", "parent"] : ["id", "parent", "paths"];
  return keys.every((key) => allowed.includes(key)) && typeof value.id === "string" && Array.isArray(value.paths) && value.paths.length > 0 && value.paths.every((entry) => typeof entry === "string") && (root ? (value.parent === undefined || typeof value.parent === "string") : typeof value.parent === "string");
}
function commonRuleShape(value) { return typeof value.id === "string" && typeof value.type === "string" && typeof value.scope === "string" && (value.description === undefined || typeof value.description === "string"); }
function ruleShape(value) {
  if (!commonRuleShape(value)) return false;
  const common = ["id", "type", "scope", "description"];
  if (["allowed-paths", "forbidden-paths", "changed-path-requires-review"].includes(value.type)) return exactKeys(value, [...common, "paths"]) && patternList(value.paths);
  if (value.type === "changed-path-requires-changed-path") return exactKeys(value, [...common, "when", "require"]) && changedPart(value.when) && changedPart(value.require);
  return exactKeys(value, common);
}
function exceptionShape(value) { return exactKeys(value, ["id", "rule", "scope", "paths", "reason", "approvedBy"]) && typeof value.id === "string" && typeof value.rule === "string" && typeof value.scope === "string" && patternList(value.paths) && typeof value.reason === "string" && value.reason.length > 0 && typeof value.approvedBy === "string" && value.approvedBy.length > 0; }
function changedPart(value) { return mapping(value) && exactKeys(value, ["changedPaths"]) && mapping(value.changedPaths) && exactKeys(value.changedPaths, ["include"]) && patternList(value.changedPaths.include); }
function patternList(value) { return Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === "string"); }
function exactKeys(value, keys) { return Object.keys(value).every((key) => keys.includes(key)) && keys.every((key) => Object.hasOwn(value, key) || key === "description"); }
function mapping(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function patterns(values, item, code, errors, base = `${item.source.field}/paths`) { if (Array.isArray(values)) values.forEach((value, index) => { if (!validPattern(value)) errors.push(diag(code, item.source, `${base}/${index}`)); }); }
function validPattern(value) { if (!canonicalPath(value) || value.startsWith("!") || /[?\[\]{}\\]/.test(value) || /[@+*!?]\(/.test(value)) return false; return value.split("/").every((segment) => segment === "**" || !segment.includes("**")); }
function canonicalPath(value) { return typeof value === "string" && value.length > 0 && !value.includes("\0") && !value.includes("\\") && !value.startsWith("/") && !value.endsWith("/") && !value.split("/").some((segment) => !segment || segment === "." || segment === ".."); }
function duplicates(items, code, errors) { const seen = new Map(); for (const item of stable(items, (x) => `${x.source.document}\0${x.source.field}`)) { const id = item.definition.id; if (seen.has(id)) errors.push(diag(code, item.source, `${item.source.field}/id`)); else seen.set(id, item); } }
function withoutDuplicates(items) { const seen = new Set(); return stable(items, (x) => `${x.source.document}\0${x.source.field}`).filter((item) => !seen.has(item.definition.id) && seen.add(item.definition.id)); }
function provenance(source, field) { return { layer: "repository", document: source.document, field }; }
function diag(code, source, field) { return diagnostic(code, source.document, field); }
function stable(items, key) { return [...items].sort((left, right) => compare(key(left), key(right))); }
function output(items) { return items.map(({ definition, source }) => ({ definition: plain(definition), source: { ...source } })); }
function plain(value) { if (Array.isArray(value)) return value.map(plain); if (mapping(value)) return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, plain(child)])); return value; }
function byDepth(items, getDepth) { return [...items].sort((left, right) => getDepth(left) - getDepth(right) || compare(left.definition.id, right.definition.id)); }
function same(left, right) { return Array.isArray(left) && left.length === right.length && left.every((entry, index) => entry === right[index]); }
function cycle(item, scopes) { const seen = new Set(); let current = item; while (current && current.definition.id !== "repository") { if (seen.has(current.definition.id)) return true; seen.add(current.definition.id); current = scopes.get(current.definition.parent); } return false; }
function descends(id, ancestor, scopes) { let current = scopes.get(id); while (current) { if (current.definition.id === ancestor) return true; current = scopes.get(current.definition.parent); } return false; }
function depth(item, scopes) { let result = 0; let current = item; while (current && current.definition.id !== "repository") { result += 1; current = scopes.get(current.definition.parent); } return result; }
function failure(errors) { return { ok: false, errors: sortDiagnostics(errors) }; }

export function matchesPattern(pattern, file) {
  const patternParts = pattern.split("/");
  const fileParts = file.split("/");
  const visit = (patternIndex, fileIndex) => {
    if (patternIndex === patternParts.length) return fileIndex === fileParts.length;
    const part = patternParts[patternIndex];
    if (part === "**") {
      for (let next = fileIndex; next <= fileParts.length; next += 1) if (visit(patternIndex + 1, next)) return true;
      return false;
    }
    if (fileIndex === fileParts.length) return false;
    const expression = new RegExp(`^${part.split("*").map(escapeRegex).join("[^/]*")}$`);
    return expression.test(fileParts[fileIndex]) && visit(patternIndex + 1, fileIndex + 1);
  };
  return visit(0, 0);
}

function escapeRegex(value) { return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&"); }
