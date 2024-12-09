import { defineConfig } from "tsup";

export default defineConfig({
    entry: {
        "index": "src/index.ts",
        "client/index": "src/client/index.ts",
        "server/index": "src/server/index.ts",
        "shared/index": "src/shared/index.ts"
    },
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
});