import type { Category, Location, Report, ReportContact } from "@prisma/client";

/** A report row with its reference relations loaded. */
export type ReportWithRelations = Report & {
    category: Category;
    location: Location;
};

/** A report row with every relation the detail view needs. */
export type ReportWithContact = ReportWithRelations & {
    contact: ReportContact | null;
};

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

export interface PublicContact {
    method: ReportContact["method"];
    value: string;
}

export interface ReportSummaryView {
    id: string;
    reportType: Report["reportType"];
    itemName: string;
    category: CategoryView;
    location: LocationView;
    locationDetail: string | null;
    imageUrl: string | null;
    createdAt: string;
}

export interface ReportDetailView extends ReportSummaryView {
    categoryOther: string | null;
    description: string;
    occurredAt: string | null;
    publicContact: PublicContact | null;
}

export interface PaginationView {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface ReportPageView {
    data: ReportSummaryView[];
    pagination: PaginationView;
}

/** Shape returned for every failed request. */
export interface ApiErrorBody {
    error: {
        code: string;
        message: string;
        details?: FieldIssue[];
    };
}

export interface FieldIssue {
    field: string;
    message: string;
}
