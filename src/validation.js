import fs from "node:fs";
import path from "node:path";

import { ADAPTERS, CORE_CATEGORIES } from "./catalog.js";
import { exists, listMarkdownFiles, relative } from "./fs-utils.js";
import { isExternalLink, markdownLinks } from "./markdown.js";

export function validateProject(root, options = {}) {
  const requireCore = options.requireCore !== false;
  const requireAdapters = options.requireAdapters === true;
  const errors = [];
  const warnings = [];
  const coreReadme = path.join(root, ".ai/README.md");

  if (requireCore) {
    if (!exists(coreReadme)) {
      errors.push(".ai/README.md is missing");
    }

    for (const category of CORE_CATEGORIES) {
      const readme = path.join(root, ".ai", category, "README.md");
      if (!exists(readme)) {
        errors.push(`.ai/${category}/README.md is missing`);
      }
    }
  }

  if (requireAdapters) {
    for (const adapter of ADAPTERS) {
      const adapterFile = path.join(root, adapter.file);
      if (!exists(adapterFile)) {
        errors.push(`${adapter.file} is missing`);
        continue;
      }

      const text = fs.readFileSync(adapterFile, "utf8");
      if (!text.includes(".ai/README.md")) {
        errors.push(`${adapter.file} does not point to .ai/README.md`);
      }
    }
  }

  const markdownFiles = listMarkdownFiles(root);
  for (const file of markdownFiles) {
    const links = markdownLinks(fs.readFileSync(file, "utf8"));
    for (const href of links) {
      const target = href.split("#", 1)[0];
      if (!target || isExternalLink(target)) {
        continue;
      }

      const resolved = path.resolve(path.dirname(file), target);
      if (!exists(resolved)) {
        errors.push(`${relative(root, file)} links to missing target ${href}`);
      }
    }
  }

  if (markdownFiles.length === 0) {
    warnings.push("no Markdown files found");
  }

  return { errors, warnings };
}
