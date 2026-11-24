// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
    createReportId,
    findReport,
    listReports,
    saveReport,
} from "../../src/lib/reports-store.js";

const baseReport = {
    id: "r-test-1",
    type: "lost",
    title: "Dompet hitam",
    category: "cards",
    location: "Gedung Lama",
    room: "",
    date: "2026-11-20",
    description: "Dompet kulit hitam berisi kartu mahasiswa.",
    photo: "",
    contactMethod: "whatsapp",
    contactValue: "081234567890",
    name: "",
    createdAt: 1,
};

describe("reports-store", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("returns an empty list when nothing is stored", () => {
        expect(listReports()).toEqual([]);
    });

    it("stores and reads back a report", () => {
        expect(saveReport(baseReport)).toEqual({
            saved: true,
            droppedPhoto: false,
        });
        expect(listReports()).toHaveLength(1);
        expect(findReport(baseReport.id)?.title).toBe("Dompet hitam");
    });

    it("returns null for an unknown id", () => {
        expect(findReport("missing")).toBeNull();
    });

    it("sorts newest first", () => {
        saveReport({ ...baseReport, id: "older", createdAt: 1 });
        saveReport({ ...baseReport, id: "newer", createdAt: 2 });

        expect(listReports().map((report) => report.id)).toEqual([
            "newer",
            "older",
        ]);
    });

    it("ignores corrupted stored data", () => {
        localStorage.setItem("fasilkom-lost-and-found:reports", "{not json");

        expect(listReports()).toEqual([]);
    });

    it("ignores stored data that is not an array", () => {
        localStorage.setItem(
            "fasilkom-lost-and-found:reports",
            JSON.stringify({ nope: true }),
        );

        expect(listReports()).toEqual([]);
    });

    it("generates distinct report ids", () => {
        const first = createReportId();
        const second = createReportId();

        expect(first).toMatch(/^r/);
        expect(first).not.toBe(second);
    });

    it("reports a failure instead of throwing when storage rejects the write", () => {
        const original = Storage.prototype.setItem;

        Storage.prototype.setItem = () => {
            throw new Error("quota");
        };

        try {
            expect(saveReport(baseReport)).toEqual({
                saved: false,
                droppedPhoto: false,
            });
        } finally {
            Storage.prototype.setItem = original;
        }
    });
});
