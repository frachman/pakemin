import fs from "node:fs";
import path from "node:path";
import { compare, diagnostic, sortDiagnostics } from "./diagnostics.js";
import { isContained, repositoryPath, validateIncludePath } from "./paths.js";
import { parseYaml, pointer } from "./yaml.js";

export function loadGovernanceSources(root) {
  let repositoryRoot;
  try { repositoryRoot = fs.realpathSync(root); } catch (cause) { throw internalError(cause); }
  const entryDocument = ".ai/pakemin.yaml";
  const ai = resolveDirectory(path.join(repositoryRoot, ".ai"), repositoryRoot);
  if (!ai.ok) return failure([diagnostic(ai.code, entryDocument)]);
  const manifest = resolveFile(path.join(ai.path, "pakemin.yaml"), ai.path, "missing-manifest", "manifest-outside-ai", "manifest-not-file");
  if (!manifest.ok) return failure([diagnostic(manifest.code, entryDocument)]);
  const readManifest = readSource(manifest.path, repositoryPath(repositoryRoot, manifest.path), "manifest");
  if (readManifest.errors) return failure(readManifest.errors);
  const sources = [readManifest.source], seen = new Set([manifest.path]);
  const includes = readManifest.source.value.includes;
  if (includes !== undefined && !Array.isArray(includes)) return failure([diagnostic("invalid-include-path", entryDocument, "/includes")]);
  for (let index = 0; index < (includes || []).length; index += 1) {
    const include = includes[index], field = pointer("/includes", index);
    if (!validateIncludePath(include)) return failure([diagnostic("invalid-include-path", entryDocument, field)]);
    const loaded = resolveFile(path.join(ai.path, ...include.split("/")), ai.path, "missing-include", "include-outside-ai", "include-not-file", "include-cycle");
    if (!loaded.ok) return failure([diagnostic(loaded.code, entryDocument, field)]);
    if (seen.has(loaded.path)) return failure([diagnostic("duplicate-include", entryDocument, field)]);
    seen.add(loaded.path);
    const fragment = readSource(loaded.path, repositoryPath(repositoryRoot, loaded.path), "fragment");
    if (fragment.errors) return failure(fragment.errors);
    sources.push(fragment.source);
  }
  return { ok: true, sources: sources.sort((left, right) => compare(left.document, right.document)) };
}
function readSource(file, document, kind) { let bytes; try { bytes = fs.readFileSync(file); } catch (cause) { throw internalError(cause); } const parsed = parseYaml(bytes, document); return parsed.errors ? parsed : { source: { document, kind, value: parsed.value } }; }
function resolveDirectory(entry, root) { try { const resolved = fs.realpathSync(entry); return fs.statSync(resolved).isDirectory() && isContained(root, resolved) ? { ok: true, path: resolved } : { ok: false, code: "invalid-governance-root" }; } catch (cause) { if (cause.code === "ENOENT") return { ok: false, code: "missing-manifest" }; if (cause.code === "ELOOP") return { ok: false, code: "invalid-governance-root" }; throw internalError(cause); } }
function resolveFile(entry, container, missing, outside, notFile, cycle = notFile) { try { const resolved = fs.realpathSync(entry); if (!isContained(container, resolved)) return { ok: false, code: outside }; return fs.statSync(resolved).isFile() ? { ok: true, path: resolved } : { ok: false, code: notFile }; } catch (cause) { if (cause.code === "ENOENT") return { ok: false, code: missing }; if (cause.code === "ELOOP") return { ok: false, code: cycle }; throw internalError(cause); } }
function failure(errors) { return { ok: false, errors: sortDiagnostics(errors) }; }
function internalError(cause) { const error = new Error("governance source loading failed", { cause }); error.code = "internal-error"; return error; }
