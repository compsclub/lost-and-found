import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        // Component suites opt into jsdom with a `@vitest-environment` comment.
        include: ["tests/**/*.test.{ts,tsx}"],
        testTimeout: 15000,
        // The API suites share one database. Running them in parallel lets two
        // processes interleave on the same connections, which is only safe when
        // every test is fully independent of the others.
        fileParallelism: false,
        // React only exports `act` from its development build, and a shell that
        // exports NODE_ENV=production would otherwise make every render fail.
        env: { NODE_ENV: "test" },
    },
});
