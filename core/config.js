import "dotenv/config";

const DEFAULT_PORT = 3000;
const DEFAULT_FRONTEND_ORIGIN = "http://localhost:5173";

function parsePort(value) {
    const port = Number(value ?? DEFAULT_PORT);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT must be an integer from 1 to 65535.");
    }

    return port;
}

function parseOrigins(value) {
    return (value ?? DEFAULT_FRONTEND_ORIGIN)
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
}

export const config = {
    port: parsePort(process.env.PORT),
    frontendOrigins: parseOrigins(process.env.FRONTEND_ORIGIN),
    databaseUrl: process.env.DATABASE_URL ?? "",
};
