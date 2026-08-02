import fs from "node:fs";
import path from "node:path";

import { ADAPTERS, CORE_CATEGORIES } from "./catalog.js";
import { exists, listMarkdownFiles, relative } from "./fs-utils.js";
import { isExternalLink, markdownLinks } from "./markdown.js";
import { STARTER_DOCUMENTS } from "./starter-documents.js";

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
        continue;
      }

      requireHeadings(root, readme, [`# ${titleCase(category)}`, "## Documents"], errors);
    }

    for (const entry of STARTER_DOCUMENTS) {
      const starterFile = path.join(root, entry.file);
      if (!exists(starterFile)) {
        errors.push(`${entry.file} is missing`);
        continue;
      }

      requireHeadings(root, starterFile, ["# "], errors);
    }

    if (exists(coreReadme)) {
      requireHeadings(root, coreReadme, ["# Portable Core", "## Categories"], errors);
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

  validateAdrFilenames(root, errors);

  return { errors, warnings };
}

function requireHeadings(root, file, headings, errors) {
  const text = fs.readFileSync(file, "utf8");
  for (const heading of headings) {
    if (!text.includes(heading)) {
      errors.push(`${relative(root, file)} is missing heading ${heading}`);
    }
  }
}

function validateAdrFilenames(root, errors) {
  const adrDir = path.join(root, "docs/adr");
  if (!exists(adrDir)) {
    return;
  }

  for (const entry of fs.readdirSync(adrDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "README.md") {
      continue;
    }

    if (!/^\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(entry.name)) {
      errors.push(`docs/adr/${entry.name} should use a numeric kebab-case ADR filename`);
    }
  }
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
