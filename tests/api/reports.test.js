import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../core/app.js";
import { prisma } from "../../core/db.js";

let server;
let baseUrl;

function listen() {
    return new Promise((resolve) => {
        server = createApp().listen(0, "127.0.0.1", () => {
            const { port } = server.address();

            resolve(`http://127.0.0.1:${port}/api/v1`);
        });
    });
}

async function request(path, options) {
    const response = await fetch(`${baseUrl}${path}`, options);

    return { status: response.status, body: await response.json() };
}

beforeAll(async () => {
    baseUrl = await listen();
});

afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
});

describe("GET /reports", () => {
    it("returns seeded reports newest first with pagination metadata", async () => {
        const { status, body } = await request("/reports?limit=5&page=1");

        expect(status).toBe(200);
        expect(body.data).toHaveLength(5);
        expect(body.pagination).toMatchObject({
            page: 1,
            limit: 5,
            totalItems: expect.any(Number),
            hasPreviousPage: false,
        });

        const createdAt = body.data.map((report) => report.createdAt);
        const sorted = [...createdAt].sort().reverse();

        expect(createdAt).toEqual(sorted);
    });

    it("omits detail-only fields from list items", async () => {
        const { body } = await request("/reports?limit=1");
        const [report] = body.data;

        expect(report).not.toHaveProperty("description");
        expect(report).not.toHaveProperty("publicContact");
        expect(report).not.toHaveProperty("categoryOther");
        expect(report).not.toHaveProperty("imagePublicId");
    });

    it("filters by report type", async () => {
        const { body } = await request("/reports?type=FOUND&limit=50");

        expect(body.data.length).toBeGreaterThan(0);
        expect(body.data.every((report) => report.reportType === "FOUND")).toBe(
            true,
        );
    });

    it("filters by category slug", async () => {
        const { body } = await request(
            "/reports?category=electronics&limit=50",
        );

        expect(body.data.length).toBeGreaterThan(0);
        expect(
            body.data.every((report) => report.category.slug === "electronics"),
        ).toBe(true);
    });

    it("filters by the other location slug", async () => {
        const { body } = await request("/reports?location=other&limit=50");

        expect(body.data.length).toBeGreaterThan(0);
        expect(
            body.data.every((report) => report.location.slug === "other"),
        ).toBe(true);
    });

    it("searches item names case-insensitively", async () => {
        const { body } = await request("/reports?q=TUMBLER");

        expect(body.data.length).toBeGreaterThan(0);
        expect(
            body.data.every((report) =>
                report.itemName.toLowerCase().includes("tumbler"),
            ),
        ).toBe(true);
    });

    it("rejects an invalid type filter", async () => {
        const { status, body } = await request("/reports?type=MISSING");

        expect(status).toBe(400);
        expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects page zero", async () => {
        const { status } = await request("/reports?page=0");

        expect(status).toBe(400);
    });
});

describe("GET /reports/:id", () => {
    it("returns a full report detail", async () => {
        const { body: list } = await request("/reports?limit=1");
        const [{ id }] = list.data;

        const { status, body } = await request(`/reports/${id}`);

        expect(status).toBe(200);
        expect(body.data.id).toBe(id);
        expect(body.data).toHaveProperty("description");
        expect(body.data).toHaveProperty("publicContact");
        expect(body.data).not.toHaveProperty("imagePublicId");
    });

    it("returns 404 for an unknown report", async () => {
        const { status, body } = await request(
            "/reports/10000000-0000-4000-8000-0000000000ff",
        );

        expect(status).toBe(404);
        expect(body.error.code).toBe("REPORT_NOT_FOUND");
    });

    it("returns 400 for a malformed id", async () => {
        const { status } = await request("/reports/not-a-uuid");

        expect(status).toBe(400);
    });
});

describe("POST /reports", () => {
    it("creates a report and returns 201", async () => {
        const { body: categories } = await request("/categories");
        const { body: locations } = await request("/locations");
        const category = categories.data.find((item) => item.slug === "bottle");
        const location = locations.data.find(
            (item) => item.slug === "fasilkom-library",
        );

        const { status, body } = await request("/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                reportType: "LOST",
                itemName: "Botol uji integrasi",
                categoryId: category.id,
                categoryOther: null,
                description: "Laporan yang dibuat oleh pengujian integrasi.",
                locationId: location.id,
                locationDetail: "Meja baca lantai 1",
                occurredAt: "2026-11-16T05:00:00.000Z",
                contact: { method: "EMAIL", value: "uji@example.com" },
            }),
        });

        expect(status).toBe(201);
        expect(body.data.itemName).toBe("Botol uji integrasi");
        expect(body.data.publicContact).toEqual({
            method: "EMAIL",
            value: "uji@example.com",
        });
        expect(body.data).not.toHaveProperty("imagePublicId");
    });

    it("requires locationDetail when the location is other", async () => {
        const { body: categories } = await request("/categories");
        const { body: locations } = await request("/locations");
        const category = categories.data.find((item) => item.slug === "bottle");
        const otherLocation = locations.data.find(
            (item) => item.slug === "other",
        );

        const { status, body } = await request("/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                reportType: "FOUND",
                itemName: "Barang tanpa lokasi",
                categoryId: category.id,
                description: "Laporan tanpa detail lokasi kustom.",
                locationId: otherLocation.id,
                contact: { method: "PHONE", value: "+6281234567890" },
            }),
        });

        expect(status).toBe(400);
        expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the category does not exist", async () => {
        const { body: locations } = await request("/locations");

        const { status, body } = await request("/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                reportType: "LOST",
                itemName: "Kategori hilang",
                categoryId: "00000000-0000-4000-8000-000000000000",
                description: "Kategori ini tidak ada di database.",
                locationId: locations.data[0].id,
                contact: { method: "EMAIL", value: "uji@example.com" },
            }),
        });

        expect(status).toBe(404);
        expect(body.error.code).toBe("CATEGORY_NOT_FOUND");
    });
});

describe("metadata endpoints", () => {
    it("lists categories with slugs", async () => {
        const { status, body } = await request("/categories");

        expect(status).toBe(200);
        expect(body.data.length).toBeGreaterThan(0);
        expect(body.data[0]).toHaveProperty("slug");
    });

    it("lists locations including other", async () => {
        const { status, body } = await request("/locations");

        expect(status).toBe(200);
        expect(body.data.some((item) => item.slug === "other")).toBe(true);
    });
});
