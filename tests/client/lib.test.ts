import { describe, expect, it } from "vitest";
import { contactHref, isEmail, isPhone } from "../../src/lib/contact";
import { formatDate, todayIso, toIsoDate } from "../../src/lib/dates";
import { categoryOf, contactOf, reportTypeLabel } from "../../src/lib/options";

describe("contactHref", () => {
    it("builds a wa.me link and prefixes Indonesian numbers with 62", () => {
        expect(contactHref("whatsapp", "081234567890")).toBe(
            "https://wa.me/6281234567890",
        );
    });

    it("keeps an already international number intact", () => {
        expect(contactHref("whatsapp", "+62 812-3456-7890")).toBe(
            "https://wa.me/6281234567890",
        );
    });

    it("strips a leading at-sign for instagram", () => {
        expect(contactHref("instagram", "@rina.cs23")).toBe(
            "https://instagram.com/rina.cs23",
        );
    });

    it("builds a mailto link", () => {
        expect(contactHref("email", "nama@ui.ac.id")).toBe(
            "mailto:nama@ui.ac.id",
        );
    });

    it("returns an empty string for LINE, which has no deep link", () => {
        expect(contactHref("line", "rina.cs23")).toBe("");
    });

    it("returns an empty string for an empty value", () => {
        expect(contactHref("whatsapp", "   ")).toBe("");
    });
});

describe("isEmail", () => {
    it("accepts a normal address", () => {
        expect(isEmail("nama@ui.ac.id")).toBe(true);
    });

    it("rejects a missing domain", () => {
        expect(isEmail("not-an-email")).toBe(false);
    });

    it("rejects whitespace inside the address", () => {
        expect(isEmail("na ma@ui.ac.id")).toBe(false);
    });
});

describe("isPhone", () => {
    it("accepts at least eight digits", () => {
        expect(isPhone("0812345678")).toBe(true);
    });

    it("rejects a short number", () => {
        expect(isPhone("0812")).toBe(false);
    });

    it("counts digits only, so punctuation does not shorten the number", () => {
        expect(isPhone("0812-3456-78")).toBe(true);
    });
});

describe("dates", () => {
    it("formats an ISO date for display", () => {
        expect(formatDate("2026-11-20")).toContain("2026");
    });

    it("passes through a value that is not an ISO date", () => {
        expect(formatDate("kemarin")).toBe("kemarin");
    });

    it("returns an empty string for a missing value", () => {
        expect(formatDate("")).toBe("");
    });

    it("renders today as a zero-padded ISO date", () => {
        expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("zero-pads single-digit months and days", () => {
        expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    });
});

describe("options", () => {
    it("resolves a known category", () => {
        expect(categoryOf("bottle").label).toBe("Botol minum");
    });

    it("falls back to the other category", () => {
        expect(categoryOf("unknown").value).toBe("other");
    });

    it("resolves a contact method with its field label", () => {
        expect(contactOf("email").field).toBe("Alamat email");
    });

    it("falls back to the first contact method", () => {
        expect(contactOf("unknown").value).toBe("whatsapp");
    });

    it("labels both report types", () => {
        expect(reportTypeLabel("lost")).toBe("Hilang");
        expect(reportTypeLabel("found")).toBe("Ditemukan");
    });
});
