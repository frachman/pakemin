import { loadGovernanceSources } from "./loader.js";
import { validateGovernance } from "./schema.js";
import { resolveGovernancePaths } from "./resolver.js";

export { resolveGovernancePaths } from "./resolver.js";

export function loadGovernance(root) {
  const loaded = loadGovernanceSources(root);
  return loaded.ok ? validateGovernance(loaded.sources) : loaded;
}
