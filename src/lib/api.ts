/* Typed access to the report API.
 * Every request funnels through `request`, so error handling and the JSON
 * envelope stay in one place. */

const API_BASE_URL: string =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api/v1";

export type ReportType = "LOST" | "FOUND";

export type ContactMethod = "EMAIL" | "PHONE" | "WHATSAPP";

export interface CategoryView {
    id: string;
    slug: string;
    name: string;
}

export interface LocationView {
    id: string;
    slug: string;
    name: string;
}

export interface ReportSummary {
    id: string;
    reportType: ReportType;
    itemName: string;
    category: CategoryView;
    location: LocationView;
    locationDetail: string | null;
    imageUrl: string | null;
    createdAt: string;
}

export interface PublicContact {
    method: ContactMethod;
    value: string;
}

export interface ReportDetail extends ReportSummary {
    categoryOther: string | null;
    description: string;
    occurredAt: string | null;
    publicContact: PublicContact | null;
}

export interface Pagination {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface ReportPage {
    data: ReportSummary[];
    pagination: Pagination;
}

export interface ReportFilters {
    q?: string;
    type?: ReportType | "";
    category?: string;
    location?: string;
    page?: number;
    limit?: number;
}

export interface CreateReportInput {
    reportType: ReportType;
    itemName: string;
    categoryId: string;
    categoryOther: string | null;
    description: string;
    locationId: string;
    locationDetail: string | null;
    occurredAt: string | null;
    contact: PublicContact;
}

interface ApiErrorBody {
    error?: {
        code?: string;
        message?: string;
        details?: Array<{ field: string; message: string }>;
    };
}

/** An API failure carrying the server's code and per-field details. */
export class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details: Array<{ field: string; message: string }>;

    constructor(
        status: number,
        code: string,
        message: string,
        details: Array<{ field: string; message: string }> = [],
    ) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, init);
    } catch {
        throw new ApiError(
            0,
            "NETWORK_ERROR",
            "Tidak dapat menghubungi server. Periksa koneksimu.",
        );
    }

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        const body = (payload ?? {}) as ApiErrorBody;
        const error = body.error ?? {};

        throw new ApiError(
            response.status,
            error.code ?? "UNKNOWN_ERROR",
            error.message ?? "Permintaan gagal.",
            error.details ?? [],
        );
    }

    return payload as T;
}

function buildQuery(filters: ReportFilters): string {
    const params = new URLSearchParams();

    if (filters.q) {
        params.set("q", filters.q);
    }

    if (filters.type) {
        params.set("type", filters.type);
    }

    if (filters.category) {
        params.set("category", filters.category);
    }

    if (filters.location) {
        params.set("location", filters.location);
    }

    params.set("page", String(filters.page ?? 1));
    params.set("limit", String(filters.limit ?? 12));

    return params.toString();
}

export async function fetchReports(
    filters: ReportFilters = {},
    signal?: AbortSignal,
): Promise<ReportPage> {
    const payload = await request<ReportPage>(
        `/reports?${buildQuery(filters)}`,
        { signal },
    );

    return {
        data: payload.data ?? [],
        pagination: payload.pagination,
    };
}

export async function fetchReport(
    id: string,
    signal?: AbortSignal,
): Promise<ReportDetail> {
    const payload = await request<{ data: ReportDetail }>(`/reports/${id}`, {
        signal,
    });

    return payload.data;
}

export async function fetchCategories(
    signal?: AbortSignal,
): Promise<CategoryView[]> {
    const payload = await request<{ data: CategoryView[] }>("/categories", {
        signal,
    });

    return payload.data;
}

export async function fetchLocations(
    signal?: AbortSignal,
): Promise<LocationView[]> {
    const payload = await request<{ data: LocationView[] }>("/locations", {
        signal,
    });

    return payload.data;
}

export async function createReport(
    input: CreateReportInput,
): Promise<ReportDetail> {
    const payload = await request<{ data: ReportDetail }>("/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });

    return payload.data;
}
