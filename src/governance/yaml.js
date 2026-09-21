import YAML, { Alias, Scalar, YAMLMap, YAMLSeq } from "yaml";

import { diagnostic } from "./diagnostics.js";

export function parseYaml(bytes, document, kind) {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { errors: [diagnostic("invalid-yaml", document)] };
  }

  const documents = YAML.parseAllDocuments(text, { uniqueKeys: true, prettyErrors: false });
  if (documents.length !== 1) {
    return { errors: [diagnostic("multiple-yaml-documents", document)] };
  }

  const yamlDocument = documents[0];
  if (yamlDocument.errors.length > 0) {
    const code = yamlDocument.errors.some((error) => error.code === "DUPLICATE_KEY")
      ? "duplicate-mapping-key"
      : "invalid-yaml";
    return { errors: [diagnostic(code, document)] };
  }

  if (!yamlDocument.contents || !(yamlDocument.contents instanceof YAMLMap)) {
    return { errors: [diagnostic("invalid-document-shape", document)] };
  }

  if (hasUnsupportedFeature(yamlDocument.contents)) {
    return { errors: [diagnostic("unsupported-yaml-feature", document)] };
  }

  const errors = [];
  const value = objectFromMap(yamlDocument.contents, "", document, errors);
  return errors.length > 0 ? { errors } : { value, map: yamlDocument.contents };
}

function hasUnsupportedFeature(node) {
  if (!node) {
    return false;
  }
  if (node instanceof Alias || node.anchor || node.tag) {
    return true;
  }
  if (node instanceof YAMLMap) {
    return node.items.some((pair) => hasUnsupportedFeature(pair.key) || hasUnsupportedFeature(pair.value));
  }
  if (node instanceof YAMLSeq) {
    return node.items.some(hasUnsupportedFeature);
  }
  return false;
}

function objectFromMap(map, field, document, errors) {
  const value = {};
  for (const pair of map.items) {
    if (!(pair.key instanceof Scalar) || typeof pair.key.value !== "string") {
      errors.push(diagnostic("invalid-yaml", document, field));
      continue;
    }
    value[pair.key.value] = nodeToValue(pair.value, pointer(field, pair.key.value), document, errors);
  }
  return value;
}

function nodeToValue(node, field, document, errors) {
  if (node === null) {
    return null;
  }
  if (node instanceof Scalar) {
    return node.value;
  }
  if (node instanceof YAMLSeq) {
    return node.items.map((item, index) => nodeToValue(item, pointer(field, index), document, errors));
  }
  if (node instanceof YAMLMap) {
    return objectFromMap(node, field, document, errors);
  }
  errors.push(diagnostic("unsupported-yaml-feature", document, field));
  return null;
}

export function pointer(parent, token) {
  const escaped = String(token).replace(/~/g, "~0").replace(/\//g, "~1");
  return `${parent}/${escaped}`;
}
