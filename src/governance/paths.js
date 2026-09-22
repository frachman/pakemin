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

export function isCanonicalGovernancePath(value) {
  return typeof value === "string" && value.length > 0 && !value.includes("\0") && !value.includes("\\") && !value.startsWith("/") && !value.endsWith("/") && !value.split("/").some((segment) => !segment || segment === "." || segment === "..");
}

export function isValidGovernancePattern(value) {
  if (!isCanonicalGovernancePath(value) || value.startsWith("!") || /[?\[\]{}\\]/.test(value) || /[@+*!?]\(/.test(value)) return false;
  return value.split("/").every((segment) => segment === "**" || !segment.includes("**"));
}

// Callers validate both arguments with the Schema v0 helpers before matching.
export function matchesGovernancePattern(pattern, file) {
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
