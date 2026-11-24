import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../core/app";
import { prisma } from "../../core/db";

/* These tests exercise the real server over HTTP, so the client contract is
 * verified against the same code the browser talks to. */

let server: Server;
let baseUrl: string;

interface TestCategory {
    id: string;
    slug: string;
    name: string;
}

interface TestReport {
    id: string;
    reportType: "LOST" | "FOUND";
    itemName: string;
    category: TestCategory;
    location: TestCategory;
    locationDetail: string | null;
    imageUrl: string | null;
    createdAt: string;
    description?: string;
    categoryOther?: string | null;
    publicContact?: { method: string; value: string } | null;
}

interface TestPagination {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

interface ListBody {
    data: TestReport[];
    pagination: TestPagination;
}

interface DetailBody {
    data: TestReport;
}

interface ErrorBody {
    error: { code: string; message: string; details?: unknown[] };
}

function listen(): Promise<string> {
    return new Promise((resolve) => {
        server = createApp().listen(0, "127.0.0.1", () => {
            const { port } = server.address() as AddressInfo;

            resolve(`http://127.0.0.1:${port}/api/v1`);
        });
    });
}

async function request<T>(
    path: string,
    init?: RequestInit,
): Promise<{ status: number; body: T }> {
    const response = await fetch(`${baseUrl}${path}`, init);

    return {
        status: response.status,
        body: (await response.json()) as T,
    };
}

function postReport(
    payload: unknown,
): Promise<{ status: number; body: ErrorBody }> {
    return request<ErrorBody>("/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

/* Reports created by this suite; removed in teardown so a run leaves the
 * shared database as it found it. */
const createdReportIds: string[] = [];

beforeAll(async () => {
    baseUrl = await listen();
});

afterAll(async () => {
    if (createdReportIds.length > 0) {
        await prisma.report.deleteMany({
            where: { id: { in: createdReportIds } },
        });
    }

    await new Promise<void>((resolve) => {
        server.close(() => resolve());
    });
    await prisma.$disconnect();
});

describe("client contract: listing", () => {
    it("returns a page the client can render directly", async () => {
        const { status, body } = await request<ListBody>(
            "/reports?limit=3&page=1",
        );

        expect(status).toBe(200);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.pagination.page).toBe(1);
        expect(body.pagination.limit).toBe(3);

        for (const report of body.data) {
            expect(typeof report.id).toBe("string");
            expect(["LOST", "FOUND"]).toContain(report.reportType);
            expect(typeof report.itemName).toBe("string");
            expect(typeof report.category.name).toBe("string");
            expect(typeof report.location.name).toBe("string");
            expect(typeof report.createdAt).toBe("string");
        }
    });

    it("never leaks detail-only or internal fields into the list", async () => {
        const { body } = await request<ListBody>("/reports?limit=5");

        for (const report of body.data) {
            expect(report).not.toHaveProperty("imagePublicId");
            expect(report).not.toHaveProperty("publicContact");
            expect(report).not.toHaveProperty("description");
        }
    });

    it("keeps pagination arithmetic consistent", async () => {
        const { body } = await request<ListBody>("/reports?limit=2&page=1");
        const { pagination } = body;

        expect(pagination.totalPages).toBe(
            pagination.totalItems === 0
                ? 0
                : Math.ceil(pagination.totalItems / pagination.limit),
        );
        expect(pagination.hasNextPage).toBe(
            pagination.page < pagination.totalPages,
        );
        expect(pagination.hasPreviousPage).toBe(pagination.page > 1);
    });

    it("applies the type filter", async () => {
        const { body } = await request<ListBody>("/reports?type=LOST&limit=50");

        for (const report of body.data) {
            expect(report.reportType).toBe("LOST");
        }
    });

    it("applies the category filter by slug", async () => {
        const { body } = await request<ListBody>(
            "/reports?category=electronics&limit=50",
        );

        for (const report of body.data) {
            expect(report.category.slug).toBe("electronics");
        }
    });

    it("applies the location filter, including the other slug", async () => {
        const { body } = await request<ListBody>(
            "/reports?location=other&limit=50",
        );

        for (const report of body.data) {
            expect(report.location.slug).toBe("other");
        }
    });

    it("searches item names case-insensitively", async () => {
        const { body } = await request<ListBody>("/reports?q=CHARGER");

        for (const report of body.data) {
            expect(report.itemName.toLowerCase()).toContain("charger");
        }
    });

    it("combines several filters at once", async () => {
        const { status, body } = await request<ListBody>(
            "/reports?q=a&type=LOST&category=bottle&limit=50",
        );

        expect(status).toBe(200);

        for (const report of body.data) {
            expect(report.reportType).toBe("LOST");
            expect(report.category.slug).toBe("bottle");
        }
    });

    it("returns an empty array rather than an error for no matches", async () => {
        const { status, body } = await request<ListBody>(
            "/reports?q=zzzznothingmatchesthis",
        );

        expect(status).toBe(200);
        expect(body.data).toEqual([]);
        expect(body.pagination.totalItems).toBe(0);
    });
});

describe("client contract: detail", () => {
    it("returns everything the detail view renders", async () => {
        const { body: list } = await request<ListBody>("/reports?limit=1");
        const first = list.data[0];

        if (!first) {
            throw new Error("Expected at least one report in the seed data.");
        }

        const { status, body } = await request<DetailBody>(
            `/reports/${first.id}`,
        );

        expect(status).toBe(200);
        expect(body.data.id).toBe(first.id);
        expect(typeof body.data.description).toBe("string");
        expect(body.data).toHaveProperty("categoryOther");
        expect(body.data).toHaveProperty("publicContact");
        expect(body.data).not.toHaveProperty("imagePublicId");
    });

    it("returns a single public contact method", async () => {
        const { body: list } = await request<ListBody>("/reports?limit=20");

        for (const summary of list.data) {
            const { body } = await request<DetailBody>(
                `/reports/${summary.id}`,
            );

            if (body.data.publicContact) {
                expect(["EMAIL", "PHONE", "WHATSAPP"]).toContain(
                    body.data.publicContact.method,
                );
                expect(typeof body.data.publicContact.value).toBe("string");
            }
        }
    });

    it("reports a missing id with a stable error code", async () => {
        const { status, body } = await request<ErrorBody>(
            "/reports/10000000-0000-4000-8000-0000000000ff",
        );

        expect(status).toBe(404);
        expect(body.error.code).toBe("REPORT_NOT_FOUND");
    });
});

describe("client contract: creation", () => {
    async function referenceData(): Promise<{
        category: TestCategory;
        location: TestCategory;
        otherCategory: TestCategory;
        otherLocation: TestCategory;
    }> {
        const { body: categories } = await request<{ data: TestCategory[] }>(
            "/categories",
        );
        const { body: locations } = await request<{ data: TestCategory[] }>(
            "/locations",
        );

        const category = categories.data.find((row) => row.slug === "bottle");
        const location = locations.data.find(
            (row) => row.slug === "fasilkom-library",
        );
        const otherCategory = categories.data.find(
            (row) => row.slug === "other",
        );
        const otherLocation = locations.data.find(
            (row) => row.slug === "other",
        );

        if (!category || !location || !otherCategory || !otherLocation) {
            throw new Error(
                "Seed data is missing the expected reference rows.",
            );
        }

        return { category, location, otherCategory, otherLocation };
    }

    it("creates a report and returns the detail shape", async () => {
        const { category, location } = await referenceData();

        const { status, body } = await request<DetailBody>("/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                reportType: "LOST",
                itemName: "Uji kontrak klien",
                categoryId: category.id,
                categoryOther: null,
                description:
                    "Laporan yang dibuat oleh pengujian kontrak klien.",
                locationId: location.id,
                locationDetail: "Meja baca lantai 1",
                occurredAt: "2026-11-16T05:00:00.000Z",
                contact: { method: "EMAIL", value: "kontrak@example.com" },
            }),
        });

        expect(status).toBe(201);
        createdReportIds.push(body.data.id);
        expect(body.data.itemName).toBe("Uji kontrak klien");
        expect(body.data.publicContact?.method).toBe("EMAIL");
    });

    it("accepts the other category with a custom name", async () => {
        const { otherCategory, location } = await referenceData();

        const { status, body } = await request<DetailBody>("/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                reportType: "FOUND",
                itemName: "Uji kategori lain",
                categoryId: otherCategory.id,
                categoryOther: "Payung",
                description: "Laporan dengan kategori lain dan nama kustom.",
                locationId: location.id,
                contact: { method: "PHONE", value: "+6281234567890" },
            }),
        });

        expect(status).toBe(201);
        createdReportIds.push(body.data.id);
        expect(body.data.categoryOther).toBe("Payung");
        expect(body.data.category.slug).toBe("other");
    });

    it("rejects the other location without a custom name", async () => {
        const { category, otherLocation } = await referenceData();

        const { status, body } = await postReport({
            reportType: "LOST",
            itemName: "Tanpa lokasi kustom",
            categoryId: category.id,
            description: "Lokasi other tetapi tanpa detail lokasi.",
            locationId: otherLocation.id,
            contact: { method: "EMAIL", value: "kontrak@example.com" },
        });

        expect(status).toBe(400);
        expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects a custom category name on a predefined category", async () => {
        const { category, location } = await referenceData();

        const { status, body } = await postReport({
            reportType: "LOST",
            itemName: "Kategori tidak konsisten",
            categoryId: category.id,
            categoryOther: "Payung",
            description: "Kategori biasa tidak boleh punya nama kustom.",
            locationId: location.id,
            contact: { method: "EMAIL", value: "kontrak@example.com" },
        });

        expect(status).toBe(400);
        expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("reports an unknown category with a stable code", async () => {
        const { location } = await referenceData();

        const { status, body } = await postReport({
            reportType: "LOST",
            itemName: "Kategori tidak ada",
            categoryId: "00000000-0000-4000-8000-000000000000",
            description: "Kategori ini tidak ada di database.",
            locationId: location.id,
            contact: { method: "EMAIL", value: "kontrak@example.com" },
        });

        expect(status).toBe(404);
        expect(body.error.code).toBe("CATEGORY_NOT_FOUND");
    });

    it("returns field details the form can map back to inputs", async () => {
        const { status, body } = await postReport({
            reportType: "LOST",
            itemName: "ab",
            categoryId: "not-a-uuid",
            description: "pendek",
            locationId: "also-not-a-uuid",
            contact: { method: "EMAIL", value: "nope" },
        });

        expect(status).toBe(400);
        expect(body.error.code).toBe("VALIDATION_ERROR");
        expect(Array.isArray(body.error.details)).toBe(true);
        expect((body.error.details ?? []).length).toBeGreaterThan(0);
    });

    it("rejects a future occurredAt", async () => {
        const { category, location } = await referenceData();

        const { status } = await postReport({
            reportType: "LOST",
            itemName: "Tanggal masa depan",
            categoryId: category.id,
            description: "Terjadi di masa depan sehingga harus ditolak.",
            locationId: location.id,
            occurredAt: "2999-01-01T00:00:00.000Z",
            contact: { method: "EMAIL", value: "kontrak@example.com" },
        });

        expect(status).toBe(400);
    });
});
