import type { ZodError } from "zod";
import type { ApiErrorBody, FieldIssue } from "./types.js";

export function notFound(code: string, message: string): ApiErrorBody {
    return { error: { code, message } };
}

export function validationError(details: FieldIssue[]): ApiErrorBody {
    return {
        error: {
            code: "VALIDATION_ERROR",
            message: "Some input fields are invalid.",
            details,
        },
    };
}

export function internalError(): ApiErrorBody {
    return {
        error: {
            code: "INTERNAL_ERROR",
            message: "The server could not complete the request.",
        },
    };
}

export function zodDetails(error: ZodError): FieldIssue[] {
    return error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
    }));
}
