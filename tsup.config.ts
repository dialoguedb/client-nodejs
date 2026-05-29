/// <reference types="node" />
import { defineConfig } from "tsup";
import { chmod } from "fs/promises";
import { join } from "path";

// Order matters: the SDK entry (clean: true) wipes dist/ first,
// then the CLI entry (clean: false) appends cli.js into the cleaned dir.
// Reordering would cause the CLI output to be deleted by the SDK build.
export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
    outDir: "dist",
  },
  {
    entry: { cli: "src/cli/index.ts" },
    format: ["cjs"],
    dts: false,
    clean: false,
    outDir: "dist",
    banner: { js: "#!/usr/bin/env node" },
    async onSuccess() {
      await chmod(join("dist", "cli.js"), 0o755);
    },
  },
]);
