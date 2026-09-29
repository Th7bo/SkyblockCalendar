import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  target: "node22",
  clean: true,
  // Bundle the workspace package; leave real npm deps (argon2 has native bindings) external.
  noExternal: ["@sbcal/core"],
});
