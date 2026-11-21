export function notFound(code, message) {
    return { error: { code, message } };
}

export function validationError(details) {
    return {
        error: {
            code: "VALIDATION_ERROR",
            message: "Some input fields are invalid.",
            details,
        },
    };
}

export function internalError() {
    return {
        error: {
            code: "INTERNAL_ERROR",
            message: "The server could not complete the request.",
        },
    };
}

export function zodDetails(error) {
    return error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
    }));
}
