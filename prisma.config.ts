import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx prisma/seed.ts",
    },
    datasource: {
        // `prisma generate` runs from `postinstall`, before a contributor has
        // created `.env`, so a missing URL must not abort the install. Commands
        // that really need a database still fail with their own clear error.
        url: process.env.DATABASE_URL ?? "",
    },
});
