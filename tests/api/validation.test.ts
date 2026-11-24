import { describe, expect, it } from "vitest";
import {
    createReportSchema,
    listReportsQuerySchema,
} from "../../core/validation";

const validBody = {
    reportType: "LOST",
    itemName: "Tumbler hitam",
    categoryId: "33333333-3333-4333-8333-333333333333",
    categoryOther: null,
    description: "Tumbler hitam berkapasitas 600 ml dengan stiker kucing.",
    locationId: "a1000000-0000-4000-8000-000000000001",
    locationDetail: "Lantai 2, ruang A206",
    occurredAt: "2026-11-16T05:00:00.000Z",
    contact: {
        method: "WHATSAPP",
        value: "+6281234567010",
    },
};

describe("createReportSchema", () => {
    it("accepts a well-formed report", () => {
        const result = createReportSchema.safeParse(validBody);

        expect(result.success).toBe(true);
    });

    it("trims itemName before measuring its length", () => {
        const result = createReportSchema.safeParse({
            ...validBody,
            itemName: "  ab  ",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(["itemName"]);
    });

    it("rejects a description shorter than ten characters", () => {
        const result = createReportSchema.safeParse({
            ...validBody,
            description: "pendek",
        });

        expect(result.success).toBe(false);
    });

    it("rejects a future occurredAt", () => {
        const result = createReportSchema.safeParse({
            ...validBody,
            occurredAt: "2999-01-01T00:00:00.000Z",
        });

        expect(result.success).toBe(false);
        expect(
            result.error?.issues.some(
                (issue) => issue.path[0] === "occurredAt",
            ),
        ).toBe(true);
    });

    it("requires an E.164 number for phone contacts", () => {
        const result = createReportSchema.safeParse({
            ...validBody,
            contact: { method: "PHONE", value: "0812345678" },
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(["contact", "value"]);
    });

    it("requires a valid email for email contacts", () => {
        const result = createReportSchema.safeParse({
            ...validBody,
            contact: { method: "EMAIL", value: "not-an-email" },
        });

        expect(result.success).toBe(false);
    });

    it("rejects unknown report types", () => {
        const result = createReportSchema.safeParse({
            ...validBody,
            reportType: "MISSING",
        });

        expect(result.success).toBe(false);
    });
});

describe("listReportsQuerySchema", () => {
    it("applies pagination defaults", () => {
        const result = listReportsQuerySchema.parse({});

        expect(result.page).toBe(1);
        expect(result.limit).toBe(12);
    });

    it("coerces numeric query strings", () => {
        const result = listReportsQuerySchema.parse({ page: "3", limit: "20" });

        expect(result.page).toBe(3);
        expect(result.limit).toBe(20);
    });

    it("rejects page zero", () => {
        expect(listReportsQuerySchema.safeParse({ page: "0" }).success).toBe(
            false,
        );
    });

    it("rejects a limit above fifty", () => {
        expect(listReportsQuerySchema.safeParse({ limit: "51" }).success).toBe(
            false,
        );
    });
});
