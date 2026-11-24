import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
        testTimeout: 15000,
        // The API suites share one database. Running them in parallel lets two
        // processes interleave on the same connections, which is only safe when
        // every test is fully independent of the others.
        fileParallelism: false,
    },
});
