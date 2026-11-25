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

/** The uploaded photo exceeds the size the API accepts. */
export function fileTooLarge(): ApiErrorBody {
    return {
        error: {
            code: "FILE_TOO_LARGE",
            message: "The photo must be at most 5 MB.",
        },
    };
}

/** The uploaded file is not a supported image type. */
export function unsupportedMediaType(): ApiErrorBody {
    return {
        error: {
            code: "UNSUPPORTED_MEDIA_TYPE",
            message: "The photo must be a JPEG, PNG, or WebP image.",
        },
    };
}

/** Cloudinary refused the photo, so no report was created. */
export function imageUploadFailed(): ApiErrorBody {
    return {
        error: {
            code: "IMAGE_UPLOAD_FAILED",
            message: "The photo could not be stored. Please try again.",
        },
    };
}

export function zodDetails(error: ZodError): FieldIssue[] {
    return error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
    }));
}
