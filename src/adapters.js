import { ADAPTERS } from "./catalog.js";

export function selectAdapters(only) {
  if (!only) {
    return defaultAdapters();
  }

  const requested = only.split(",").map((value) => value.trim()).filter(Boolean);
  if (requested.length === 0) {
    return defaultAdapters();
  }

  const unknown = requested.filter((id) => !ADAPTERS.some((adapter) => adapter.id === id));
  if (unknown.length > 0) {
    throw new Error(`unknown adapter id(s): ${unknown.join(", ")}`);
  }

  return ADAPTERS.filter((adapter) => requested.includes(adapter.id));
}

export function defaultAdapters() {
  return ADAPTERS.filter((adapter) => adapter.role === "primary");
}
