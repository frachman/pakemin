import path from "node:path";

export function isContained(root, target) {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== "..");
}

export function repositoryPath(root, target) {
  const relative = path.relative(root, target).split(path.sep).join("/");
  if (!relative || relative.startsWith("../") || relative === "..") {
    throw new Error("target is outside repository root");
  }
  return relative;
}

export function validateIncludePath(value) {
  if (typeof value !== "string" || !value || value.includes("\0") || value.includes("\\")) {
    return false;
  }

  if (path.isAbsolute(value) || value.startsWith("/") || value.endsWith("/")) {
    return false;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || /[*?\[\]{}!]/.test(value)) {
    return false;
  }

  return value.split("/").every((segment) => segment && segment !== "." && segment !== "..");
}
