import YAML, { Alias, Scalar, YAMLMap, YAMLSeq } from "yaml";

import { diagnostic, sortDiagnostics } from "./diagnostics.js";

export function parseYaml(bytes, document) {
  let text;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { return failure([diagnostic("invalid-yaml", document)]); }
  if (/^%/m.test(text)) return failure([diagnostic("unsupported-yaml-feature", document)]);
  let documents;
  try { documents = YAML.parseAllDocuments(text, { version: "1.2", schema: "core", merge: false, prettyErrors: false, uniqueKeys: false }); } catch { return failure([diagnostic("invalid-yaml", document)]); }
  if (documents.length !== 1) return failure([diagnostic("multiple-yaml-documents", document)]);
  const yamlDocument = documents[0];
  if (yamlDocument.errors.length) return failure([diagnostic("invalid-yaml", document)]);
  if (!(yamlDocument.contents instanceof YAMLMap)) return failure([diagnostic("invalid-document-shape", document)]);
  const errors = [];
  const value = mapValue(yamlDocument.contents, "", document, errors);
  return errors.length ? failure(errors) : { value };
}

function mapValue(map, field, document, errors) {
  const value = Object.create(null); const seen = new Set();
  for (const pair of map.items) {
    if (!(pair.key instanceof Scalar) || typeof pair.key.value !== "string") { errors.push(diagnostic("unsupported-yaml-feature", document, field)); continue; }
    const key = pair.key.value; const child = pointer(field, key);
    if (seen.has(key)) errors.push(diagnostic("duplicate-mapping-key", document, child));
    seen.add(key); value[key] = nodeValue(pair.value, child, document, errors);
  }
  return value;
}

function nodeValue(node, field, document, errors) {
  if (node === null) return null;
  if (node instanceof Alias || node.anchor || node.tag) { errors.push(diagnostic("unsupported-yaml-feature", document, field)); return null; }
  if (node instanceof Scalar) return node.value;
  if (node instanceof YAMLSeq) return node.items.map((item, index) => nodeValue(item, pointer(field, index), document, errors));
  if (node instanceof YAMLMap) return mapValue(node, field, document, errors);
  errors.push(diagnostic("unsupported-yaml-feature", document, field)); return null;
}

export function pointer(parent, token) { const escaped = String(token).replace(/~/g, "~0").replace(/\//g, "~1"); return `${parent}/${escaped}`; }
function failure(errors) { return { errors: sortDiagnostics(errors) }; }
