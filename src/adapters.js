import { ADAPTERS } from "./catalog.js";

export function selectAdapters(only) {
  if (!only) {
    return ADAPTERS;
  }

  const requested = only.split(",").map((value) => value.trim()).filter(Boolean);
  if (requested.length === 0) {
    return ADAPTERS;
  }

  const unknown = requested.filter((id) => !ADAPTERS.some((adapter) => adapter.id === id));
  if (unknown.length > 0) {
    throw new Error(`unknown adapter id(s): ${unknown.join(", ")}`);
  }

  return ADAPTERS.filter((adapter) => requested.includes(adapter.id));
}
