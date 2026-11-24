// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* The retry control re-issues the request rather than changing state, so this
 * suite asserts the request count instead of the rendered status alone: a
 * button that silently does nothing would still leave the error message up. */
const fetchReports = vi.fn();

vi.mock("../../src/lib/api", async () => {
    const actual =
        await vi.importActual<typeof import("../../src/lib/api")>(
            "../../src/lib/api",
        );

    return {
        ...actual,
        fetchReports: (...args: unknown[]) => fetchReports(...args),
        fetchCategories: async () => [],
        fetchLocations: async () => [],
    };
});

const { ApiError } = await import("../../src/lib/api");
const { ReportListPage } = await import("../../src/pages/ReportListPage");

const emptyPage = {
    data: [],
    pagination: {
        page: 1,
        limit: 12,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    },
};

function renderPage() {
    return render(
        <MemoryRouter>
            <ReportListPage />
        </MemoryRouter>,
    );
}

describe("ReportListPage retry", () => {
    beforeEach(() => {
        fetchReports.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("re-issues the request when the failure is retried", async () => {
        fetchReports
            .mockRejectedValueOnce(
                new ApiError(
                    0,
                    "NETWORK_ERROR",
                    "Tidak dapat menghubungi server.",
                ),
            )
            .mockResolvedValueOnce(emptyPage);

        renderPage();

        const retry = await screen.findByRole("button", {
            name: "Coba lagi",
        });

        expect(fetchReports).toHaveBeenCalledTimes(1);

        retry.click();

        await waitFor(() => {
            expect(fetchReports).toHaveBeenCalledTimes(2);
        });

        // The second attempt succeeded, so the error screen is gone.
        await waitFor(() => {
            expect(screen.queryByText("Gagal memuat laporan")).toBeNull();
        });
    });

    it("keeps the error screen when the retry fails again", async () => {
        fetchReports.mockRejectedValue(
            new ApiError(0, "NETWORK_ERROR", "Tidak dapat menghubungi server."),
        );

        renderPage();

        const retry = await screen.findByRole("button", {
            name: "Coba lagi",
        });

        retry.click();

        await waitFor(() => {
            expect(fetchReports).toHaveBeenCalledTimes(2);
        });

        expect(screen.getByText("Gagal memuat laporan")).toBeTruthy();
    });
});
