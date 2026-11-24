import "dotenv/config";

const DEFAULT_PORT = 3000;
const DEFAULT_FRONTEND_ORIGIN = "http://localhost:5173";

function parsePort(value: string | undefined): number {
    const port = Number(value ?? DEFAULT_PORT);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT must be an integer from 1 to 65535.");
    }

    return port;
}

function parseOrigins(value: string | undefined): string[] {
    return (value ?? DEFAULT_FRONTEND_ORIGIN)
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
}

export interface AppConfig {
    port: number;
    frontendOrigins: string[];
    databaseUrl: string;
}

export const config: AppConfig = {
    port: parsePort(process.env.PORT),
    frontendOrigins: parseOrigins(process.env.FRONTEND_ORIGIN),
    databaseUrl: process.env.DATABASE_URL ?? "",
};
