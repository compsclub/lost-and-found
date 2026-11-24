import { createApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./db.js";

const app = createApp();

const server = app.listen(config.port, () => {
    console.info(`API listening on http://localhost:${config.port}/api/v1`);
});

function shutdown(signal: NodeJS.Signals): void {
    console.info(`Received ${signal}, shutting down.`);

    server.close(() => {
        void prisma.$disconnect().finally(() => {
            process.exit(0);
        });
    });
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => shutdown(signal));
}
