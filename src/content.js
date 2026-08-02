import { CORE_CATEGORIES } from "./catalog.js";

export function coreFiles() {
  return [
    {
      file: ".ai/README.md",
      content: portableCoreReadme()
    },
    ...CORE_CATEGORIES.map((category) => ({
      file: `.ai/${category}/README.md`,
      content: categoryReadme(category)
    }))
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

  return `# ${titleCase(category)}

${descriptions[category]}

Parent: [Portable core](../README.md)

## Documents

Add project-specific documents here as the specification matures.
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
