import cors from "cors";
import type { Express } from "express";
import express from "express";
import { config } from "./config.js";
import { fileTooLarge, internalError, notFound } from "./http.js";
import { apiRouter } from "./routes.js";
import { isFileTooLarge } from "./uploads.js";

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

    // Upload limits are enforced while the body is read, so this is the only
    // place an oversized photo can be answered.
    app.use(
        (
            error: unknown,
            _request: express.Request,
            response: express.Response,
            next: express.NextFunction,
        ) => {
            if (isFileTooLarge(error)) {
                response.status(413).json(fileTooLarge());

                return;
            }

            if (error) {
                console.error("Unhandled request error", error);
                response.status(500).json(internalError());

                return;
            }

            next();
        },
    );

    return app;
}
