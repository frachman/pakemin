import fs from "node:fs";
import path from "node:path";

import { LANGUAGE_PRESETS } from "./catalog.js";
import { exists } from "./fs-utils.js";
import { write } from "./output.js";

export function selectPresets(preset, detected) {
  if (!preset) {
    return [];
  }

  const requested = preset.split(",").map((value) => value.trim()).filter(Boolean);
  const ids = requested.includes("auto")
    ? [...new Set([
      ...detected.map((language) => language.id),
      ...requested.filter((id) => id !== "auto")
    ])]
    : requested;

  const unknown = ids.filter((id) => !LANGUAGE_PRESETS.some((language) => language.id === id));
  if (unknown.length > 0) {
    throw new Error(`unknown preset id(s): ${unknown.join(", ")}`);
  }

  return LANGUAGE_PRESETS.filter((language) => ids.includes(language.id));
}

export function detectLanguages(root) {
  return LANGUAGE_PRESETS.map((language) => ({
    ...language,
    foundMarkers: language.markers.filter((marker) => markerExists(root, marker))
  })).filter((language) => language.foundMarkers.length > 0);
}

export function reportDetection(stream, detected, applied) {
  if (detected.length === 0) {
    return;
  }

  write(stream, "Detected stacks:\n");
  for (const language of detected) {
    write(stream, `detected: ${language.id} (${language.foundMarkers.join(", ")})\n`);
  }

  if (applied.length > 0) {
    write(stream, `Applied presets: ${applied.map((language) => language.id).join(", ")}\n`);
  } else {
    write(stream, "Suggested next step: pakemin init --preset=<id>\n");
  }
}

function markerExists(root, marker) {
  if (!exists(root)) {
    return false;
  }

  if (!marker.includes("*")) {
    return exists(path.join(root, marker));
  }

  const entries = fs.readdirSync(root, { withFileTypes: true });
  const pattern = wildcardPattern(marker);
  return entries.some((entry) => entry.isFile() && pattern.test(entry.name));
}

function wildcardPattern(marker) {
  const escaped = marker
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");

  return new RegExp(`^${escaped}$`);
}
