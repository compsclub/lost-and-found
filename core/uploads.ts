import multer from "multer";
import { fileTooLarge, unsupportedMediaType } from "./http.js";
import type { ApiErrorBody } from "./types.js";

/** Photos must stay small enough to upload quickly and fit the contract. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** The only image types the contract accepts. */
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/* Accept whatever arrives, then classify it in the route.
 *
 * Rejecting unsupported types here would drop the file silently, which looks
 * exactly like a request that never sent a photo. The route has to tell those
 * two cases apart, so the type check happens after parsing. */
export const uploadPhoto = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
});

export function isAllowedMimeType(mimeType: string): boolean {
    return ALLOWED_MIME_TYPES.has(mimeType);
}

export interface PhotoRejection {
    status: number;
    body: ApiErrorBody;
}

/** Describe why a parsed file cannot be used, or null when it is acceptable. */
export function photoError(
    file: { mimetype: string } | undefined,
): PhotoRejection | null {
    if (!file) {
        return null;
    }

    if (!isAllowedMimeType(file.mimetype)) {
        return { status: 415, body: unsupportedMediaType() };
    }

    return null;
}

/** Multer raises this before the route runs, so it is answered separately. */
export function isFileTooLarge(error: unknown): boolean {
    return (
        error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
    );
}

export { fileTooLarge };
