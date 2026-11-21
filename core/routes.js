import { Router } from "express";
import {
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
import {
    createReportSchema,
    listReportsQuerySchema,
    reportIdSchema,
} from "./validation.js";

export const apiRouter = Router();

function parseOrRespond(schema, value, response) {
    const result = schema.safeParse(value);

    if (!result.success) {
        response.status(400).json(validationError(zodDetails(result.error)));

        return null;
    }

    return result.data;
}

apiRouter.get("/health", (_request, response) => {
    response.status(200).json({ data: { status: "ok" } });
});

apiRouter.get("/categories", (_request, response) => {
    findCategories()
        .then((categories) => response.status(200).json({ data: categories }))
        .catch((error) => {
            console.error("Failed to load categories", error);
            response.status(500).json(internalError());
        });
});

apiRouter.get("/locations", (_request, response) => {
    findLocations()
        .then((locations) => response.status(200).json({ data: locations }))
        .catch((error) => {
            console.error("Failed to load locations", error);
            response.status(500).json(internalError());
        });
});

apiRouter.get("/reports", (request, response) => {
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
        .catch((error) => {
            console.error("Failed to load reports", error);
            response.status(500).json(internalError());
        });
});

apiRouter.get("/reports/:id", (request, response) => {
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
        .catch((error) => {
            console.error("Failed to load report", error);
            response.status(500).json(internalError());
        });
});

apiRouter.post("/reports", (request, response) => {
    const body = parseOrRespond(createReportSchema, request.body, response);

    if (!body) {
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

            const issues = [];

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

            return createReport(body);
        })
        .then((report) => {
            if (report) {
                response.status(201).json({ data: report });
            }
        })
        .catch((error) => {
            console.error("Failed to create report", error);
            response.status(500).json(internalError());
        });
});
