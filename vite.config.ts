import react from "@vitejs/plugin-react";
import * as path from "node:path";
import { defineConfig } from "vitest/config";
import packageJson from "./package.json" with { type: "json" };
import banner from 'vite-plugin-banner'
const buildDate = new Date().toUTCString();

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        banner(`/*! Build Date: ${new Date().toISOString()} */`)
    ],

    server: {
        open: true,
    },
    build: {
        minify: false,
        emptyOutDir: true,
        outDir: "docs",
        rollupOptions: {
            output: {
                entryFileNames: "assets/[name].js",
                assetFileNames: "assets/[name].[ext]",
                banner: `/* Build Date: ${buildDate} */`,
            },
            input: {
                index: "index.html",
                worker: "src-worker/index.ts"
            },
        },
    },

    test: {
        root: import.meta.dirname,
        name: packageJson.name,
        environment: "jsdom",

        typecheck: {
            enabled: true,
            tsconfig: path.join(import.meta.dirname, "tsconfig.json"),
        },

        globals: true,
        watch: false,
        setupFiles: ["./src/setupTests.ts"],
    },
});
