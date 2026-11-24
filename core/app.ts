import cors from "cors";
import type { Express } from "express";
import express from "express";
import { config } from "./config.js";
import { notFound } from "./http.js";
import { apiRouter } from "./routes.js";

export function createApp(): Express {
    const app = express();

    app.disable("x-powered-by");
    app.use(cors({ origin: config.frontendOrigins }));
    app.use(express.json({ limit: "1mb" }));

    app.use("/api/v1", apiRouter);

    app.use((_request, response) => {
        response
            .status(404)
            .json(
                notFound("NOT_FOUND", "The requested endpoint does not exist."),
            );
    });

    return app;
}
