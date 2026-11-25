// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CreateReportInput } from "../../src/lib/api";
import { createReport } from "../../src/lib/api";

/* The server side of multipart is covered end-to-end in
 * `tests/api/photo-upload.test.ts`. This suite pins what the *client* puts on
 * the wire, because a browser cannot be persuaded to send a real multipart
 * body through Node's fetch inside jsdom. */
const input: CreateReportInput = {
    reportType: "LOST",
    itemName: "Ransel hitam",
    categoryId: "11111111-1111-4111-8111-111111111111",
    categoryOther: null,
    description: "Deskripsi yang cukup panjang untuk lolos validasi.",
    locationId: "22222222-2222-4222-8222-222222222222",
    locationDetail: null,
    occurredAt: null,
    contact: { method: "EMAIL", value: "klien@example.com" },
};

interface CapturedRequest {
    url: string;
    init: RequestInit | undefined;
}

function stubFetch(payload: unknown = { data: { id: "report-1" } }) {
    const captured: CapturedRequest[] = [];

    vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string, init?: RequestInit) => {
            captured.push({ url, init });

            return new Response(JSON.stringify(payload), {
                status: 201,
                headers: { "Content-Type": "application/json" },
            });
        }),
    );

    return captured;
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("createReport request shape", () => {
    it("sends JSON when no photo is attached", async () => {
        const captured = stubFetch();

        await createReport(input, null);

        expect(captured).toHaveLength(1);

        const [first] = captured;

        if (!first) {
            throw new Error("The client did not call fetch.");
        }

        const { init } = first;
        const headers = new Headers(init?.headers);

        expect(headers.get("Content-Type")).toBe("application/json");
        expect(typeof init?.body).toBe("string");
        expect(JSON.parse(String(init?.body))).toMatchObject({
            itemName: "Ransel hitam",
        });
    });

    it("sends multipart with a data field and the photo when one is attached", async () => {
        const captured = stubFetch();
        const photo = new File([new Uint8Array([1, 2, 3])], "foto.png", {
            type: "image/png",
        });

        await createReport(input, photo);

        const [first] = captured;

        if (!first) {
            throw new Error("The client did not call fetch.");
        }

        const { init } = first;

        expect(init?.body).toBeInstanceOf(FormData);

        const body = init?.body as FormData;

        expect(body.get("photo")).toBeInstanceOf(File);
        // The JSON travels as a string so the server can parse it back.
        expect(JSON.parse(String(body.get("data")))).toMatchObject({
            reportType: "LOST",
            itemName: "Ransel hitam",
            contact: { method: "EMAIL", value: "klien@example.com" },
        });
        // The browser must set the multipart boundary itself.
        expect(new Headers(init?.headers).get("Content-Type")).toBeNull();
    });
});
