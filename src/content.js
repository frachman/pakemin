import { CORE_CATEGORIES } from "./catalog.js";
import { STARTER_DOCUMENTS } from "./starter-documents.js";

export function coreFiles() {
  return [
    {
      file: ".ai/README.md",
      content: portableCoreReadme()
    },
    ...CORE_CATEGORIES.map((category) => ({
      file: `.ai/${category}/README.md`,
      content: categoryReadme(category)
    })),
    ...STARTER_DOCUMENTS
  ];
}

export function presetFiles(presets) {
  return [
    {
      file: ".ai/context/technology-stack.md",
      content: technologyStackContent(presets)
    },
    {
      file: ".ai/rules/testing.md",
      content: testingRulesContent(presets)
    },
    {
      file: ".ai/rules/formatting.md",
      content: formattingRulesContent(presets)
    }
  ];
}

function portableCoreReadme() {
  return `# Portable Core

This directory is the project-owned source of truth for AI-assisted work.

## Categories

- [Context](context/README.md): durable project facts.
- [Memory](memory/README.md): changing project state.
- [Rules](rules/README.md): stable constraints for work.
- [Workflows](workflows/README.md): reusable task processes.
- [Skills](skills/README.md): specialized work instructions.
- [Templates](templates/README.md): standard output formats.
- [Overrides](overrides/README.md): project-specific refinements.

## Loading Strategy

Read this file first. Then load the relevant context, rules, memory, and workflow documents for the task.
`;
}

function categoryReadme(category) {
  const descriptions = {
    context: "Context contains stable project knowledge.",
    memory: "Memory contains changing project state.",
    rules: "Rules define stable constraints.",
    workflows: "Workflows describe reusable task processes.",
    skills: "Skills contain specialized instructions.",
    templates: "Templates define standard output structures.",
    overrides: "Overrides refine shared defaults for this project."
  };

  const documents = STARTER_DOCUMENTS
    .filter((entry) => entry.file.startsWith(`.ai/${category}/`))
    .map((entry) => basename(entry.file));
  const documentList = documents.length > 0
    ? documents.map((file) => `- [${file}](${file})`).join("\n")
    : "Add project-specific documents here as the specification matures.";

  return `# ${titleCase(category)}

${descriptions[category]}

Parent: [Portable core](../README.md)

## Documents

${documentList}
`;
}

function technologyStackContent(presets) {
  return `# Technology Stack

This file was created by explicit Pakemin preset selection.

${presets.map((preset) => `## ${preset.name}

${preset.technology}`).join("\n\n")}
`;
}

function testingRulesContent(presets) {
  return `# Testing Rules

This file was created by explicit Pakemin preset selection.

${presets.map((preset) => `## ${preset.name}

${preset.testing}`).join("\n\n")}
`;
}

function formattingRulesContent(presets) {
  return `# Formatting Rules

This file was created by explicit Pakemin preset selection.

${presets.map((preset) => `## ${preset.name}

${preset.formatting}`).join("\n\n")}
`;
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function basename(file) {
  return file.split("/").at(-1);
}
