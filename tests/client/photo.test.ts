import { describe, expect, it } from "vitest";
import {
    PHOTO_LIMIT_BYTES,
    PHOTO_TYPES,
    photoError,
} from "../../src/lib/validation";

/* A File stand-in: only the fields the validator reads are meaningful, so the
 * tests do not depend on a DOM implementation. */
function fakeFile(type: string, size: number, name = "photo"): File {
    return { type, size, name } as unknown as File;
}

describe("photoError", () => {
    it("accepts no photo, since the field is optional", () => {
        expect(photoError(null)).toBeNull();
    });

    it("accepts each supported image type at the size limit", () => {
        for (const type of PHOTO_TYPES) {
            expect(photoError(fakeFile(type, PHOTO_LIMIT_BYTES))).toBeNull();
        }
    });

    it("rejects a file that is not an accepted image type", () => {
        expect(photoError(fakeFile("image/gif", 1024))).toBe(
            "Foto harus berformat JPEG, PNG, atau WebP.",
        );
        expect(photoError(fakeFile("application/pdf", 1024))).not.toBeNull();
    });

    it("rejects a photo larger than the limit", () => {
        expect(photoError(fakeFile("image/png", PHOTO_LIMIT_BYTES + 1))).toBe(
            "Ukuran foto maksimal 5 MB.",
        );
    });

    it("checks the type before the size so the message is specific", () => {
        // A wrong type that is also too large still reports the type problem.
        expect(photoError(fakeFile("image/gif", PHOTO_LIMIT_BYTES * 2))).toBe(
            "Foto harus berformat JPEG, PNG, atau WebP.",
        );
    });
});
