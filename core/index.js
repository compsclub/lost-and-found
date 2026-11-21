import { createApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./db.js";

const app = createApp();

const server = app.listen(config.port, () => {
    console.info(`API listening on http://localhost:${config.port}/api/v1`);
});

function shutdown(signal) {
    console.info(`Received ${signal}, shutting down.`);

    server.close(() => {
        prisma.$disconnect().finally(() => {
            process.exit(0);
        });
    });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => shutdown(signal));
}
