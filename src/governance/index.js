import { loadGovernanceSources } from "./loader.js";
import { validateGovernance } from "./schema.js";

export { loadGovernanceSources } from "./loader.js";

export function loadGovernance(root) {
  const loaded = loadGovernanceSources(root);
  return loaded.ok ? validateGovernance(loaded.sources) : loaded;
}
