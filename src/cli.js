import fs from "node:fs";

import {
  adaptersGenerateCommand,
  adaptersListCommand,
  doctorCommand,
  initCommand,
  validateCommand
} from "./commands.js";
import { write } from "./output.js";

export { validateProject } from "./validation.js";

const packageJson = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")
);

export async function runCli(args, io) {
  const command = args[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    write(io.stdout, helpText());
    return 0;
  }

  if (command === "--version" || command === "-v") {
    write(io.stdout, `${packageJson.version}\n`);
    return 0;
  }

  try {
    if (command === "init") {
      return initCommand(args.slice(1), io);
    }

    if (command === "validate") {
      return validateCommand(args.slice(1), io);
    }

    if (command === "adapters") {
      if (args[1] === "generate") {
        return adaptersGenerateCommand(args.slice(2), io);
      }

      if (args[1] === "list") {
        return adaptersListCommand(args.slice(2), io);
      }
    }

    if (command === "doctor") {
      return doctorCommand(args.slice(1), io);
    }
  } catch (error) {
    write(io.stderr, `Error: ${error.message}\n`);
    return 1;
  }

  write(io.stderr, `Unknown command: ${args.join(" ")}\n\n${helpText()}`);
  return 1;
}

function helpText() {
  return `Pakemin

An AI Engineering Specification for vendor-agnostic project knowledge.

Usage:
  pakemin init [path] [--force] [--dry-run] [--preset=<id>]
  pakemin validate [path] [--links-only] [--adapters]
  pakemin adapters list [path]
  pakemin adapters generate [path] [--force] [--dry-run] [--only=agents,claude]
  pakemin doctor [path]
  pakemin --version

Commands:
  init                 Create a minimal .ai portable core.
  validate             Validate local Pakemin structure and Markdown links.
  adapters list        List supported vendor adapters.
  adapters generate    Generate thin vendor adapter files.
  doctor               Print local environment and project checks.
`;
}
