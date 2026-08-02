import assert from "node:assert/strict";
import test from "node:test";

import { parseOptions } from "../src/options.js";

test("parseOptions separates value options from boolean flags", () => {
  const options = parseOptions(["project", "--preset=node", "--force"]);

  assert.deepEqual(options.positionals, ["project"]);
  assert.equal(options.values.preset, "node");
  assert.equal(options.flags.has("preset"), false);
  assert.equal(options.flags.has("force"), true);
});

test("parseOptions keeps bare flags out of values", () => {
  const options = parseOptions(["--dry-run"]);

  assert.equal(options.flags.has("dry-run"), true);
  assert.equal(options.values["dry-run"], undefined);
});
