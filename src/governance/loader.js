import fs from "node:fs";
import path from "node:path";

import { compare, diagnostic, sortDiagnostics } from "./diagnostics.js";
import { isContained, repositoryPath, validateIncludePath } from "./paths.js";
import { parseYaml, pointer } from "./yaml.js";

export function loadGovernanceSources(root) {
  const repositoryRoot = fs.realpathSync(root);
  const aiEntry = path.join(repositoryRoot, ".ai");
  const manifestEntry = path.join(aiEntry, "pakemin.yaml");
  const missingDocument = ".ai/pakemin.yaml";

  if (!fs.existsSync(aiEntry)) {
    return failure([diagnostic("missing-manifest", missingDocument)]);
  }

  const ai = resolveDirectory(aiEntry, repositoryRoot);
  if (!ai.ok) {
    return failure([diagnostic("invalid-governance-root", missingDocument)]);
  }

  const manifest = resolveFile(manifestEntry, ai.path, "missing-manifest", "manifest-outside-ai", "manifest-not-file");
  if (!manifest.ok) {
    return failure([diagnostic(manifest.code, missingDocument)]);
  }

  const sources = [];
  const seenIncludes = new Set();
  const manifestDocument = repositoryPath(repositoryRoot, manifest.path);
  const manifestSource = readSource(manifest.path, manifestDocument, "manifest");
  if (manifestSource.errors) {
    return failure(manifestSource.errors);
  }
  sources.push(manifestSource.source);

  const includes = manifestSource.source.value.includes;
  if (includes !== undefined && !Array.isArray(includes)) {
    return failure([diagnostic("invalid-include-path", manifestDocument, "/includes")]);
  }

  for (let index = 0; index < (includes || []).length; index += 1) {
    const include = includes[index];
    const field = pointer("/includes", index);
    if (!validateIncludePath(include)) {
      return failure([diagnostic("invalid-include-path", manifestDocument, field)]);
    }

    const entry = path.join(ai.path, ...include.split("/"));
    const resolved = resolveFile(entry, ai.path, "missing-include", "include-outside-ai", "include-not-file");
    if (!resolved.ok) {
      return failure([diagnostic(resolved.code, manifestDocument, field)]);
    }
    if (seenIncludes.has(resolved.path)) {
      return failure([diagnostic("duplicate-include", manifestDocument, field)]);
    }
    seenIncludes.add(resolved.path);

    const document = repositoryPath(repositoryRoot, resolved.path);
    const fragment = readSource(resolved.path, document, "fragment");
    if (fragment.errors) {
      return failure(fragment.errors);
    }
    sources.push(fragment.source);
  }

  return { ok: true, sources: sources.sort((left, right) => compare(left.document, right.document)) };
}

function readSource(file, document, kind) {
  let bytes;
  try {
    bytes = fs.readFileSync(file);
  } catch (error) {
    throw internalError(error);
  }
  const parsed = parseYaml(bytes, document, kind);
  return parsed.errors ? { errors: parsed.errors } : { source: { document, kind, ...parsed } };
}

function resolveDirectory(entry, root) {
  try {
    const resolved = fs.realpathSync(entry);
    if (!fs.statSync(resolved).isDirectory() || !isContained(root, resolved)) {
      return { ok: false };
    }
    return { ok: true, path: resolved };
  } catch {
    return { ok: false };
  }
}

function resolveFile(entry, container, missingCode, outsideCode, notFileCode) {
  if (!fs.existsSync(entry)) {
    return { ok: false, code: missingCode };
  }
  try {
    const resolved = fs.realpathSync(entry);
    if (!isContained(container, resolved)) {
      return { ok: false, code: outsideCode };
    }
    if (!fs.statSync(resolved).isFile()) {
      return { ok: false, code: notFileCode };
    }
    return { ok: true, path: resolved };
  } catch (error) {
    if (error.code === "ELOOP") {
      return { ok: false, code: outsideCode === "manifest-outside-ai" ? "manifest-not-file" : "include-cycle" };
    }
    return { ok: false, code: missingCode };
  }
}

function failure(errors) {
  return { ok: false, errors: sortDiagnostics(errors) };
}

function internalError(cause) {
  const error = new Error("governance source loading failed", { cause });
  error.code = "internal-error";
  return error;
}
