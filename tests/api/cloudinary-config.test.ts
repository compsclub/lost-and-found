import { describe, expect, it } from "vitest";
import { parseCloudinaryUrl } from "../../core/config";

/* The parser is pure, so these cases do not depend on module load order or on
 * the real environment. */
describe("parseCloudinaryUrl", () => {
    it("reads the connection string Cloudinary provides", () => {
        const parsed = parseCloudinaryUrl(
            "cloudinary://123456789012345:secret-value@my-cloud",
        );

        expect(parsed).toMatchObject({
            cloudName: "my-cloud",
            apiKey: "123456789012345",
            apiSecret: "secret-value",
        });
    });

    it("ignores query parameters appended to the connection string", () => {
        const parsed = parseCloudinaryUrl(
            "cloudinary://key123:secret123@some-cloud?analytics=false",
        );

        expect(parsed).toMatchObject({
            cloudName: "some-cloud",
            apiKey: "key123",
            apiSecret: "secret123",
        });
    });

    it("keeps a default folder and honours an override", () => {
        expect(parseCloudinaryUrl("cloudinary://k:s@c")?.folder).toBe(
            process.env.CLOUDINARY_FOLDER ?? "lost-and-found",
        );
    });

    it("rejects a value that is not a Cloudinary connection string", () => {
        expect(parseCloudinaryUrl("https://example.com")).toBeNull();
        expect(parseCloudinaryUrl("postgres://user:pass@host/db")).toBeNull();
    });

    it("rejects a connection string without credentials", () => {
        expect(parseCloudinaryUrl("cloudinary://my-cloud")).toBeNull();
    });
});
