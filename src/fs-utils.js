import fs from "node:fs";
import path from "node:path";

export function writeFiles(root, files, options) {
  const written = [];
  const skipped = [];
  const blocked = [];

  for (const entry of files) {
    const target = path.join(root, entry.file);
    if (exists(target) && !options.force) {
      blocked.push(entry.file);
      continue;
    }

    if (options.dryRun) {
      skipped.push(entry.file);
      continue;
    }

    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, `${entry.content.trimEnd()}\n`);
    } catch (error) {
      if (error.code === "ENOTDIR" || error.code === "EEXIST") {
        throw new Error(
          `unable to write ${entry.file}: a path segment exists as a file, not a directory`
        );
      }

      throw error;
    }
    written.push(entry.file);
  }

  return { written, skipped, blocked };
}

export function ensureDirectory(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    throw new Error(`unable to create target directory: ${dir}`);
  }
}

export function listMarkdownFiles(root) {
  const results = [];
  walk(root, results);
  return results.filter((file) => file.endsWith(".md"));
}

export function resolveTarget(cwd, target) {
  return path.resolve(cwd, target);
}

export function exists(file) {
  return fs.existsSync(file);
}

export function isDirectory(target) {
  return exists(target) && fs.statSync(target).isDirectory();
}

export function relative(root, file) {
  return path.relative(root, file) || ".";
}

function walk(dir, results) {
  if (!exists(dir)) {
    return;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, results);
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
}
