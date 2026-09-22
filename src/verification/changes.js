import { compare } from "../governance/diagnostics.js";
import { isCanonicalGovernancePath } from "../governance/paths.js";

const COMPARISON_FIELDS = ["baseline", "reproducible", "source", "target"];
const CHANGE_KINDS = new Set(["added", "modified", "deleted", "renamed"]);

export function runtimeError(code, message) { return { code, message }; }

export function configurationEnvelope(errors) { return { ok: false, errorKind: "configuration", contractVersion: "0", exitCode: 3, errors }; }

export function runtimeEnvelope(errors) { return { ok: false, errorKind: "runtime", contractVersion: "0", exitCode: 4, errors: sortRuntimeErrors(errors) }; }

export function validateComparison(comparison) {
  const errors = [];
  if (!plain(comparison)) { errors.push(runtimeError("invalid-comparison", "invalid comparison: must be a plain object")); return errors; }
  if (!sameSet(Object.keys(comparison), COMPARISON_FIELDS)) errors.push(runtimeError("invalid-comparison", "invalid comparison: fields must be exactly source, baseline, target, reproducible"));
  if (comparison.source !== "git") errors.push(runtimeError("invalid-comparison", 'invalid comparison: source must be "git"'));
  for (const field of ["baseline", "target"]) if (typeof comparison[field] !== "string" || comparison[field].length === 0) errors.push(runtimeError("invalid-comparison", `invalid comparison: ${field} must be a nonempty string`));
  if (comparison.reproducible !== true && comparison.reproducible !== false) errors.push(runtimeError("invalid-comparison", "invalid comparison: reproducible must be a boolean"));
  return errors;
}

export function validateChanges(changes) {
  if (!Array.isArray(changes)) return [runtimeError("invalid-change-set", "changes must be an array")];
  const errors = [];
  const seen = new Set();
  changes.forEach((entry, index) => {
    if (!plain(entry)) { errors.push(runtimeError("invalid-change-set", `invalid change entry at index ${index}: entry must be a plain object`)); return; }
    const kind = entry.kind;
    if (typeof kind !== "string" || !CHANGE_KINDS.has(kind)) {
      errors.push(runtimeError("unsupported-change-kind", `unsupported change kind ${typeof kind === "string" ? `"${kind}"` : String(kind)} at index ${index}`));
      return;
    }
    if (kind === "renamed") {
      if (!sameSet(Object.keys(entry), ["kind", "newPath", "oldPath"])) { errors.push(runtimeError("invalid-change-set", `invalid change entry at index ${index}: fields must be exactly kind, oldPath, newPath`)); return; }
      const noncanonical = [["oldPath", entry.oldPath], ["newPath", entry.newPath]].filter(([, value]) => !isCanonicalGovernancePath(value));
      if (noncanonical.length) { for (const [field, value] of noncanonical) errors.push(runtimeError("invalid-change-set", `invalid change entry at index ${index}: ${field} "${value}" is not canonical`)); return; }
      if (entry.oldPath === entry.newPath) { errors.push(runtimeError("invalid-change-set", `invalid change entry at index ${index}: rename source and destination must differ`)); return; }
      const identity = `renamed\0${entry.oldPath}\0${entry.newPath}`;
      if (seen.has(identity)) errors.push(runtimeError("invalid-change-set", `invalid change entry at index ${index}: duplicate change identity`)); else seen.add(identity);
      return;
    }
    if (!sameSet(Object.keys(entry), ["kind", "path"])) { errors.push(runtimeError("invalid-change-set", `invalid change entry at index ${index}: fields must be exactly kind, path`)); return; }
    if (!isCanonicalGovernancePath(entry.path)) { errors.push(runtimeError("invalid-change-set", `invalid change entry at index ${index}: path "${entry.path}" is not canonical`)); return; }
    const identity = `${kind}\0${entry.path}`;
    if (seen.has(identity)) errors.push(runtimeError("invalid-change-set", `invalid change entry at index ${index}: duplicate change identity`)); else seen.add(identity);
  });
  return errors;
}

export function classifyInputs(comparison, changes) {
  const errors = [...validateComparison(comparison), ...validateChanges(changes)];
  return errors.length ? runtimeEnvelope(errors) : null;
}

export function sortRuntimeErrors(errors) { return [...errors].sort((left, right) => compare(left.code, right.code) || compare(left.message, right.message)); }

function plain(value) { return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }

function sameSet(left, right) { const a = [...left].sort(); const b = [...right].sort(); return a.length === b.length && a.every((value, index) => value === b[index]); }