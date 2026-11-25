import type { Server } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../core/app";
import {
    getPhotoUploader,
    ImageUploadError,
    setPhotoUploader,
} from "../../core/cloudinary";
import { prisma } from "../../core/db";

/* The uploaded photo must never reach Cloudinary during a test run, so every
 * case here drives the swappable uploader instead. */
const defaultUploader = getPhotoUploader();

interface TestCategory {
    id: string;
    slug: string;
    name: string;
}

interface TestLocation {
    id: string;
    slug: string;
    name: string;
}

interface TestReportDetail {
    id: string;
    itemName: string;
    imageUrl: string | null;
}

let server: Server;
let baseUrl: string;
const createdReportIds: string[] = [];

interface TestReferenceBody {
    data: TestCategory[];
}

async function request<T>(
    path: string,
    options?: RequestInit,
): Promise<{ status: number; body: T }> {
    const response = await fetch(`${baseUrl}${path}`, options);

    return { status: response.status, body: (await response.json()) as T };
}

async function referenceData() {
    const categories = await request<TestReferenceBody>("/categories");
    const locations = await request<{ data: TestLocation[] }>("/locations");
    const category = categories.body.data.find(
        (item) => item.slug === "bottle",
    );
    const location = locations.body.data.find(
        (item) => item.slug === "fasilkom-library",
    );

    if (!category || !location) {
        throw new Error("Seed data is missing the expected reference rows.");
    }

    return { categoryId: category.id, locationId: location.id };
}

function reportBody(categoryId: string, locationId: string): string {
    return JSON.stringify({
        reportType: "LOST",
        itemName: "Botol dengan foto",
        categoryId,
        categoryOther: null,
        description: "Laporan yang dibuat oleh pengujian unggah foto.",
        locationId,
        locationDetail: "Meja baca lantai 1",
        occurredAt: "2026-11-16T05:00:00.000Z",
        contact: { method: "EMAIL", value: "foto@example.com" },
    });
}

/** A tiny but genuinely valid PNG, so the type check sees a real image. */
function pngBytes(): Buffer {
    return Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
        "base64",
    );
}

function multipart(
    data: string,
    photo?: { bytes: Buffer; type: string; name?: string },
): FormData {
    const form = new FormData();
    form.set("data", data);

    if (photo) {
        // Copy into a fresh ArrayBuffer: a Buffer's backing store may be shared.
        const bytes = new Uint8Array(photo.bytes).slice().buffer;

        form.set(
            "photo",
            new Blob([bytes], { type: photo.type }),
            photo.name ?? "photo.png",
        );
    }

    return form;
}

beforeAll(async () => {
    baseUrl = await listen();
    // The default uploader has no credentials in a test run; make that explicit
    // so a missing env var cannot turn into a confusing 502 assertion.
    setPhotoUploader(defaultUploader);
});

beforeEach(() => {
    setPhotoUploader(defaultUploader);
});

afterAll(async () => {
    if (createdReportIds.length > 0) {
        await prisma.report.deleteMany({
            where: { id: { in: createdReportIds } },
        });
    }

    setPhotoUploader(defaultUploader);

    await new Promise<void>((resolve) => {
        server.close(() => resolve());
    });
    await prisma.$disconnect();
});

function listen(): Promise<string> {
    return new Promise((resolve) => {
        server = createApp().listen(0, "127.0.0.1", () => {
            const address = server.address();
            const port = typeof address === "object" ? address?.port : 0;

            resolve(`http://127.0.0.1:${port}/api/v1`);
        });
    });
}

describe("POST /reports with a photo", () => {
    it("stores the photo and returns its URL", async () => {
        const { categoryId, locationId } = await referenceData();
        const uploads: Buffer[] = [];

        setPhotoUploader({
            isConfigured: () => true,
            upload: async (file) => {
                uploads.push(file);

                return {
                    url: "https://res.cloudinary.com/demo/image/upload/v1/lost-and-found/photo.png",
                    publicId: "lost-and-found/photo",
                };
            },
        });

        const { status, body } = await request<{ data: TestReportDetail }>(
            "/reports",
            {
                method: "POST",
                body: multipart(reportBody(categoryId, locationId), {
                    bytes: pngBytes(),
                    type: "image/png",
                }),
            },
        );

        expect(status).toBe(201);
        expect(body.data.imageUrl).toBe(
            "https://res.cloudinary.com/demo/image/upload/v1/lost-and-found/photo.png",
        );
        expect(uploads).toHaveLength(1);
        expect(uploads[0]?.length).toBe(pngBytes().length);
        createdReportIds.push(body.data.id);

        // The internal identifier is stored but never exposed.
        expect(body.data).not.toHaveProperty("imagePublicId");
    });

    it("rejects a photo that is not a supported image", async () => {
        const { categoryId, locationId } = await referenceData();
        let called = false;

        setPhotoUploader({
            isConfigured: () => true,
            upload: async () => {
                called = true;

                return { url: "x", publicId: "y" };
            },
        });

        const { status, body } = await request<{
            error: { code: string };
        }>("/reports", {
            method: "POST",
            body: multipart(reportBody(categoryId, locationId), {
                bytes: Buffer.from("GIF89a not really an image"),
                type: "image/gif",
            }),
        });

        expect(status).toBe(415);
        expect(body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
        expect(called).toBe(false);
    });

    it("answers 502 and creates nothing when the upload fails", async () => {
        const { categoryId, locationId } = await referenceData();

        setPhotoUploader({
            isConfigured: () => true,
            upload: async () => {
                throw new ImageUploadError("Cloudinary is unreachable.");
            },
        });

        const before = await prisma.report.count();
        const { status, body } = await request<{
            error: { code: string };
        }>("/reports", {
            method: "POST",
            body: multipart(reportBody(categoryId, locationId), {
                bytes: pngBytes(),
                type: "image/png",
            }),
        });

        expect(status).toBe(502);
        expect(body.error.code).toBe("IMAGE_UPLOAD_FAILED");
        // A partial report must not be created when the photo cannot be stored.
        expect(await prisma.report.count()).toBe(before);
    });

    it("still accepts a plain JSON body without a photo", async () => {
        const { categoryId, locationId } = await referenceData();

        setPhotoUploader({
            isConfigured: () => true,
            upload: async () => {
                throw new Error("must not be called without a photo");
            },
        });

        const { status, body } = await request<{ data: TestReportDetail }>(
            "/reports",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: reportBody(categoryId, locationId),
            },
        );

        expect(status).toBe(201);
        expect(body.data.imageUrl).toBeNull();
        createdReportIds.push(body.data.id);
    });

    it("answers 400 when the multipart data field is not valid JSON", async () => {
        const { status, body } = await request<{ error: { code: string } }>(
            "/reports",
            {
                method: "POST",
                body: multipart("{not json", {
                    bytes: pngBytes(),
                    type: "image/png",
                }),
            },
        );

        expect(status).toBe(400);
        expect(body.error.code).toBe("VALIDATION_ERROR");
    });
});
