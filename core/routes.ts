import type { Request, Response } from "express";
import { Router } from "express";
import type { ZodType } from "zod";
import { getPhotoUploader } from "./cloudinary.js";
import {
    imageUploadFailed,
    internalError,
    notFound,
    validationError,
    zodDetails,
} from "./http.js";
import {
    createReport,
    findCategories,
    findCategoryById,
    findLocationById,
    findLocations,
    findReportById,
    findReportPage,
} from "./reports-repository.js";
import type { FieldIssue } from "./types.js";
import { photoError, uploadPhoto } from "./uploads.js";
import {
    createReportSchema,
    listReportsQuerySchema,
    reportIdSchema,
} from "./validation.js";

export const apiRouter = Router();

/* Validate input against a schema, answering 400 when it fails.
 * Returns the parsed value, or null when a response was already sent. */
function parseOrRespond<T>(
    schema: ZodType<T>,
    value: unknown,
    response: Response,
): T | null {
    const result = schema.safeParse(value);

    if (!result.success) {
        response.status(400).json(validationError(zodDetails(result.error)));

        return null;
    }

    return result.data;
}

apiRouter.get("/health", (_request: Request, response: Response) => {
    response.status(200).json({ data: { status: "ok" } });
});

apiRouter.get("/categories", (_request: Request, response: Response) => {
    findCategories()
        .then((categories) => response.status(200).json({ data: categories }))
        .catch((error: unknown) => {
            console.error("Failed to load categories", error);
            response.status(500).json(internalError());
        });
});

apiRouter.get("/locations", (_request: Request, response: Response) => {
    findLocations()
        .then((locations) => response.status(200).json({ data: locations }))
        .catch((error: unknown) => {
            console.error("Failed to load locations", error);
            response.status(500).json(internalError());
        });
});

apiRouter.get("/reports", (request: Request, response: Response) => {
    const query = parseOrRespond(
        listReportsQuerySchema,
        request.query,
        response,
    );

    if (!query) {
        return;
    }

    findReportPage(query)
        .then((page) => response.status(200).json(page))
        .catch((error: unknown) => {
            console.error("Failed to load reports", error);
            response.status(500).json(internalError());
        });
});

apiRouter.get("/reports/:id", (request: Request, response: Response) => {
    const params = parseOrRespond(reportIdSchema, request.params, response);

    if (!params) {
        return;
    }

    findReportById(params.id)
        .then((report) => {
            if (!report) {
                response
                    .status(404)
                    .json(
                        notFound(
                            "REPORT_NOT_FOUND",
                            "The requested report does not exist.",
                        ),
                    );

                return;
            }

            response.status(200).json({ data: report });
        })
        .catch((error: unknown) => {
            console.error("Failed to load report", error);
            response.status(500).json(internalError());
        });
});

/* Read the report payload from either content type. A multipart request carries
 * the same JSON as a string in its `data` field, alongside an optional photo. */
function readReportBody(request: Request): unknown {
    const raw: unknown = request.body;

    if (raw && typeof raw === "object" && "data" in raw) {
        const data = (raw as { data?: unknown }).data;

        if (typeof data === "string") {
            try {
                return JSON.parse(data);
            } catch {
                return null;
            }
        }
    }

    return raw;
}

apiRouter.post(
    "/reports",
    uploadPhoto.single("photo"),
    (request: Request, response: Response) => {
        const body = parseOrRespond(
            createReportSchema,
            readReportBody(request),
            response,
        );

        if (!body) {
            return;
        }

        // Checked after parsing so a rejected type is distinguishable from no photo.
        const photoIssue = photoError(request.file);

        if (photoIssue) {
            response.status(photoIssue.status).json(photoIssue.body);

            return;
        }

        Promise.all([
            findCategoryById(body.categoryId),
            findLocationById(body.locationId),
        ])
            .then(async ([category, location]) => {
                if (!category) {
                    response
                        .status(404)
                        .json(
                            notFound(
                                "CATEGORY_NOT_FOUND",
                                "The selected category does not exist.",
                            ),
                        );

                    return null;
                }

                if (!location) {
                    response
                        .status(404)
                        .json(
                            notFound(
                                "LOCATION_NOT_FOUND",
                                "The selected location does not exist.",
                            ),
                        );

                    return null;
                }

                const issues: FieldIssue[] = [];

                if (category.slug === "other" && !body.categoryOther) {
                    issues.push({
                        field: "categoryOther",
                        message:
                            "Must be provided when the selected category is other.",
                    });
                }

                if (category.slug !== "other" && body.categoryOther) {
                    issues.push({
                        field: "categoryOther",
                        message:
                            "Must be null unless the selected category is other.",
                    });
                }

                if (location.slug === "other" && !body.locationDetail) {
                    issues.push({
                        field: "locationDetail",
                        message:
                            "Must be provided when the selected location is other.",
                    });
                }

                if (issues.length > 0) {
                    response.status(400).json(validationError(issues));

                    return null;
                }

                /* Store the photo before the row so a failed upload cannot leave
                 * a report that references an image nobody can load. */
                if (request.file) {
                    try {
                        const image = await getPhotoUploader().upload(
                            request.file.buffer,
                        );

                        return await createReport(body, image);
                    } catch (error: unknown) {
                        console.error("Failed to upload report photo", error);
                        response.status(502).json(imageUploadFailed());

                        return null;
                    }
                }

                return createReport(body);
            })
            .then((report) => {
                if (report) {
                    response.status(201).json({ data: report });
                }
            })
            .catch((error: unknown) => {
                console.error("Failed to create report", error);
                response.status(500).json(internalError());
            });
    },
);
