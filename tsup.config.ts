/// <reference types="node" />
import { defineConfig } from "tsup";
import { chmod } from "fs/promises";
import { join } from "path";

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
