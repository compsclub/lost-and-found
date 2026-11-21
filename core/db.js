import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config } from "./config.js";

function buildAdapter() {
    if (!config.databaseUrl) {
        throw new Error("DATABASE_URL must be set before the API can start.");
    }

    return new PrismaPg({ connectionString: config.databaseUrl });
}

export const prisma = new PrismaClient({ adapter: buildAdapter() });
