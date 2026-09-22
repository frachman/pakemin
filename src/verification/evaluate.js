import { compare } from "../governance/diagnostics.js";
import { matchesGovernancePattern } from "../governance/paths.js";
import { resolveGovernancePaths } from "../governance/resolver.js";
import { classifyInputs, configurationEnvelope } from "./changes.js";

const KIND_ORDER = ["added", "modified", "deleted", "renamed"];
const ROLE_ORDER = ["path", "source", "destination"];

export function verifyRepository(governance, comparison, changes) {
  const inputError = classifyInputs(comparison, changes);
  if (inputError) return inputError;

  const facts = changeFacts(changes);
  const uniquePaths = [...new Set(facts.map((fact) => fact.path))];
  const resolved = resolveGovernancePaths(governance, uniquePaths);
  if (!resolved.ok) return configurationEnvelope(resolved.errors);

  const byPath = new Map(resolved.resolution.paths.map((entry) => [entry.path, entry]));
  const model = { exceptionsById: new Map(governance.exceptions.map((exception) => [exception.definition.id, exception])) };
  const views = facts.map((fact) => ({ ...fact, resolved: byPath.get(fact.path) }));
  const evaluations = evaluateRules(governance, views, model);
  const normalized = normalizeChanges(changes);

  return {
    ok: true,
    report: {
      contractVersion: "0",
      governanceSchemaVersion: "0",
      verificationMode: "repository",
      outcome: outcomeFor(evaluations),
      comparison: { source: comparison.source, baseline: comparison.baseline, target: comparison.target, reproducible: comparison.reproducible },
      changes: normalized,
      summary: summarize(normalized, evaluations),
      evaluations
    }
  };
}

function changeFacts(changes) {
  const facts = [];
  for (const change of changes) {
    if (change.kind === "renamed") {
      facts.push({ path: change.oldPath, role: "source", changeKind: "renamed" });
      facts.push({ path: change.newPath, role: "destination", changeKind: "renamed" });
    } else {
      facts.push({ path: change.path, role: "path", changeKind: change.kind });
    }
  }
  return facts;
}

function normalizeChanges(changes) {
  return changes
    .map((change) => change.kind === "renamed"
      ? { kind: change.kind, oldPath: change.oldPath, newPath: change.newPath }
      : { kind: change.kind, path: change.path })
    .sort((left, right) => compare(firstPath(left), firstPath(right)) || KIND_ORDER.indexOf(left.kind) - KIND_ORDER.indexOf(right.kind) || compare(left.newPath ?? "", right.newPath ?? ""));
}

function firstPath(change) { return change.kind === "renamed" ? change.oldPath : change.path; }

function evaluateRules(governance, facts, model) {
  const results = [];
  for (const rule of governance.rules) {
    const relevant = facts.filter((fact) => fact.resolved.effectiveScopeIds.includes(rule.definition.scope));
    if (relevant.length === 0) continue;
    const depth = relevant[0].resolved.effectiveScopeIds.indexOf(rule.definition.scope);
    const evaluation = evaluateRule(rule, relevant, model);
    if (evaluation) results.push({ depth, evaluation });
  }
  return results.sort((left, right) => left.depth - right.depth || compare(left.evaluation.ruleId, right.evaluation.ruleId)).map((item) => item.evaluation);
}

function evaluateRule(rule, relevant, model) {
  if (rule.definition.type === "allowed-paths") return evaluateAllowed(rule, relevant, model);
  if (rule.definition.type === "forbidden-paths") return evaluateForbidden(rule, relevant, model);
  if (rule.definition.type === "changed-path-requires-changed-path") return evaluateRequired(rule, relevant);
  return evaluateReview(rule, relevant);
}

function evaluateAllowed(rule, relevant, model) {
  const patterns = rule.definition.paths;
  const evidence = [];
  let satisfied = true;
  for (const fact of relevant) {
    const matched = patterns.filter((pattern) => matchesGovernancePattern(pattern, fact.path));
    for (const pattern of matched) evidence.push(matchEvidence("allowed-match", fact, pattern));
    if (matched.length) continue;
    evidence.push(baseEvidence("allowed-miss", fact));
    const exceptions = applicableExceptions(fact, rule, model);
    if (exceptions.length === 0) satisfied = false;
    else for (const exceptionId of exceptions) evidence.push(exceptionEvidence(fact, exceptionId));
  }
  return evaluation(rule, satisfied ? "satisfied" : "violated", satisfied ? "allowed-paths-satisfied" : "path-not-allowed", relevant, evidence,
    satisfied ? (hasKind(evidence, "exception-applied") ? "Every relevant path is allowed or excepted." : "Every relevant path is allowed.") : "One or more relevant paths are not allowed.");
}

function evaluateForbidden(rule, relevant, model) {
  const patterns = rule.definition.paths;
  const evidence = [];
  const matching = [];
  let satisfied = true;
  for (const fact of relevant) {
    const matched = patterns.filter((pattern) => matchesGovernancePattern(pattern, fact.path));
    if (matched.length === 0) { evidence.push(baseEvidence("forbidden-clear", fact)); continue; }
    matching.push(fact);
    for (const pattern of matched) evidence.push(matchEvidence("forbidden-match", fact, pattern));
    const exceptions = applicableExceptions(fact, rule, model);
    if (exceptions.length === 0) satisfied = false;
    else for (const exceptionId of exceptions) evidence.push(exceptionEvidence(fact, exceptionId));
  }
  return evaluation(rule, satisfied ? "satisfied" : "violated", satisfied ? "forbidden-paths-clear" : "forbidden-path-matched", matching, evidence,
    satisfied ? (hasKind(evidence, "exception-applied") ? "Every forbidden match is excepted." : "No relevant path matches a forbidden pattern.") : "One or more relevant paths match a forbidden pattern.");
}

function evaluateRequired(rule, relevant) {
  const whenPatterns = rule.definition.when.changedPaths.include;
  const requirePatterns = rule.definition.require.changedPaths.include;
  const evidence = [];
  const triggers = [];
  const required = [];
  for (const fact of relevant) {
    const triggered = whenPatterns.filter((pattern) => matchesGovernancePattern(pattern, fact.path));
    if (triggered.length) { triggers.push(fact); for (const pattern of triggered) evidence.push(matchEvidence("required-trigger", fact, pattern)); }
    const requiredMatches = requirePatterns.filter((pattern) => matchesGovernancePattern(pattern, fact.path));
    if (requiredMatches.length) { required.push(fact); for (const pattern of requiredMatches) evidence.push(matchEvidence("required-match", fact, pattern)); }
  }
  if (triggers.length === 0) return null;
  const satisfied = required.length > 0;
  if (!satisfied) evidence.push({ kind: "required-missing", patterns: [...requirePatterns].sort(compare) });
  return evaluation(rule, satisfied ? "satisfied" : "violated", satisfied ? "required-changed-path-present" : "required-changed-path-missing", [...triggers, ...required], evidence,
    satisfied ? "Required changed path evidence is present." : "Required changed path evidence is missing.");
}

function evaluateReview(rule, relevant) {
  const patterns = rule.definition.paths;
  const evidence = [];
  const matching = [];
  for (const fact of relevant) {
    const matched = patterns.filter((pattern) => matchesGovernancePattern(pattern, fact.path));
    if (matched.length === 0) continue;
    matching.push(fact);
    for (const pattern of matched) evidence.push(matchEvidence("review-match", fact, pattern));
  }
  if (matching.length === 0) return null;
  const explanation = typeof rule.definition.description === "string" && rule.definition.description.length > 0 ? rule.definition.description : "Human review is required for changed paths.";
  return evaluation(rule, "indeterminate", "human-review-required", matching, evidence, explanation);
}

function evaluation(rule, state, reasonCode, facts, evidence, explanation) {
  return {
    ruleId: rule.definition.id,
    ruleType: rule.definition.type,
    state,
    reasonCode,
    scopeId: rule.definition.scope,
    source: { layer: rule.source.layer, document: rule.source.document, field: rule.source.field },
    affectedPaths: affectedPaths(facts),
    evidence: orderEvidence(evidence),
    explanation
  };
}

function applicableExceptions(fact, rule, model) {
  return (fact.resolved.exceptionIds ?? []).filter((id) => model.exceptionsById.get(id)?.definition.rule === rule.definition.id).sort(compare);
}

function affectedPaths(facts) {
  const seen = new Set();
  const result = [];
  for (const fact of facts) {
    const key = `${fact.path}\0${fact.role}\0${fact.changeKind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ path: fact.path, role: fact.role, changeKind: fact.changeKind });
  }
  return result.sort((left, right) => compare(left.path, right.path) || ROLE_ORDER.indexOf(left.role) - ROLE_ORDER.indexOf(right.role));
}

function orderEvidence(items) {
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    const key = JSON.stringify(canonicalEvidence(item));
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique.sort(compareEvidence);
}

function canonicalEvidence(item) {
  return {
    kind: item.kind ?? null,
    path: item.path ?? null,
    role: item.role ?? null,
    changeKind: item.changeKind ?? null,
    pattern: item.pattern ?? null,
    exceptionId: item.exceptionId ?? null,
    patterns: item.patterns ? [...item.patterns].sort(compare) : null
  };
}

function compareEvidence(left, right) {
  return valueCompare(left.kind, right.kind) || valueCompare(left.path, right.path) || valueCompare(left.role, right.role) || valueCompare(left.changeKind, right.changeKind) || valueCompare(left.pattern, right.pattern) || valueCompare(left.exceptionId, right.exceptionId);
}

function valueCompare(left, right) { if (left === undefined && right === undefined) return 0; if (left === undefined) return -1; if (right === undefined) return 1; return compare(left, right); }

function matchEvidence(kind, fact, pattern) { return { kind, path: fact.path, role: fact.role, changeKind: fact.changeKind, pattern }; }

function baseEvidence(kind, fact) { return { kind, path: fact.path, role: fact.role, changeKind: fact.changeKind }; }

function exceptionEvidence(fact, exceptionId) { return { kind: "exception-applied", path: fact.path, role: fact.role, changeKind: fact.changeKind, exceptionId }; }

function hasKind(items, kind) { return items.some((item) => item.kind === kind); }

function outcomeFor(evaluations) {
  if (evaluations.some((evaluation) => evaluation.state === "violated")) return "fail";
  if (evaluations.some((evaluation) => evaluation.state === "indeterminate")) return "requires-review";
  return "pass";
}

function summarize(changes, evaluations) {
  return {
    changes: changes.length,
    evaluations: evaluations.length,
    satisfied: countState(evaluations, "satisfied"),
    violated: countState(evaluations, "violated"),
    indeterminate: countState(evaluations, "indeterminate")
  };
}

function countState(evaluations, state) { return evaluations.filter((evaluation) => evaluation.state === state).length; }