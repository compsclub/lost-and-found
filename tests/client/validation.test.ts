import { describe, expect, it } from "vitest";
import type { ReportFormValues } from "../../src/lib/validation";
import { validateReportForm } from "../../src/lib/validation";

const valid: ReportFormValues = {
    type: "lost",
    title: "Ransel Eiger hitam",
    category: "bottle",
    location: "Gedung Lama",
    room: "Ruang 2.3",
    date: "2026-11-20",
    description: "Ransel Eiger hitam 30L dengan gantungan kunci beruang.",
    contactMethod: "whatsapp",
    contactValue: "081234567890",
    name: "Rina",
};

describe("validateReportForm", () => {
    it("accepts a complete report", () => {
        expect(validateReportForm(valid, "2026-11-25")).toEqual({});
    });

    it("requires an item name", () => {
        const errors = validateReportForm(
            { ...valid, title: "   " },
            "2026-11-25",
        );

        expect(errors.title).toBe("Silakan isi nama barang.");
    });

    it("rejects an item name longer than eighty characters", () => {
        const errors = validateReportForm(
            { ...valid, title: "a".repeat(81) },
            "2026-11-25",
        );

        expect(errors.title).toBe("Nama barang maksimal 80 karakter.");
    });

    it("requires a category and a location", () => {
        const errors = validateReportForm(
            { ...valid, category: "", location: "" },
            "2026-11-25",
        );

        expect(errors.category).toBe("Silakan pilih kategori.");
        expect(errors.location).toBe("Silakan pilih lokasi.");
    });

    it("rejects a missing date", () => {
        const errors = validateReportForm({ ...valid, date: "" }, "2026-11-25");

        expect(errors.date).toBe("Silakan pilih tanggal.");
    });

    it("rejects a date in the future", () => {
        const errors = validateReportForm(
            { ...valid, date: "2026-12-01" },
            "2026-11-25",
        );

        expect(errors.date).toBe("Tanggal tidak boleh di masa depan.");
    });

    it("requires a description of at least ten characters", () => {
        const errors = validateReportForm(
            { ...valid, description: "pendek" },
            "2026-11-25",
        );

        expect(errors.description).toContain("minimal 10 karakter");
    });

    it("rejects a description beyond the limit", () => {
        const errors = validateReportForm(
            { ...valid, description: "a".repeat(601) },
            "2026-11-25",
        );

        expect(errors.description).toContain("maksimal 600 karakter");
    });

    it("requires a contact value", () => {
        const errors = validateReportForm(
            { ...valid, contactValue: "  " },
            "2026-11-25",
        );

        expect(errors.contactValue).toBe("Silakan isi detail kontak.");
    });

    it("validates an email contact", () => {
        const errors = validateReportForm(
            { ...valid, contactMethod: "email", contactValue: "not-an-email" },
            "2026-11-25",
        );

        expect(errors.contactValue).toBe(
            "Silakan isi alamat email yang valid.",
        );
    });

    it("accepts a valid email contact", () => {
        const errors = validateReportForm(
            { ...valid, contactMethod: "email", contactValue: "nama@ui.ac.id" },
            "2026-11-25",
        );

        expect(errors).toEqual({});
    });

    it("requires a plausible phone number for WhatsApp", () => {
        const errors = validateReportForm(
            { ...valid, contactMethod: "whatsapp", contactValue: "0812" },
            "2026-11-25",
        );

        expect(errors.contactValue).toBe(
            "Silakan isi nomor telepon yang valid.",
        );
    });

    it("rejects an over-long room detail", () => {
        const errors = validateReportForm(
            { ...valid, room: "a".repeat(61) },
            "2026-11-25",
        );

        expect(errors.room).toBe("Detail ruangan maksimal 60 karakter.");
    });
});
