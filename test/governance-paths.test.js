import assert from "node:assert/strict";
import test from "node:test";
import { matchesPattern } from "../src/governance/schema.js";
test("documents the v0 pattern matching table", () => { for (const [pattern, value, expected] of [["**", "README.md", true], ["**", "apps/docs/index.md", true], ["*.md", "README.md", true], ["*.md", "docs/README.md", false], ["docs/**", "docs/index.md", true], ["docs/**", "docs/guides/start.md", true], ["**/*.test.js", "app.test.js", true], ["**/*.test.js", "test/app.test.js", true], ["apps/*/config.yaml", "apps/docs/config.yaml", true], ["apps/*/config.yaml", "apps/docs/internal/config.yaml", false]]) assert.equal(matchesPattern(pattern, value), expected); });
