import type { Category, Location } from "@prisma/client";
import type {
    CategoryView,
    LocationView,
    ReportDetailView,
    ReportSummaryView,
    ReportWithContact,
    ReportWithRelations,
} from "./types.js";

function toCategory(category: Category): CategoryView {
    return {
        id: category.id,
        slug: category.slug,
        name: category.name,
    };
}

function toLocation(location: Location): LocationView {
    return {
        id: location.id,
        slug: location.slug,
        name: location.name,
    };
}

export function toReportSummary(
    report: ReportWithRelations,
): ReportSummaryView {
    return {
        id: report.id,
        reportType: report.reportType,
        itemName: report.itemName,
        category: toCategory(report.category),
        location: toLocation(report.location),
        locationDetail: report.locationDetail,
        imageUrl: report.imageUrl,
        createdAt: report.createdAt.toISOString(),
    };
}

export function toReportDetail(report: ReportWithContact): ReportDetailView {
    return {
        ...toReportSummary(report),
        categoryOther: report.categoryOther,
        description: report.description,
        occurredAt: report.occurredAt ? report.occurredAt.toISOString() : null,
        publicContact: report.contact
            ? { method: report.contact.method, value: report.contact.value }
            : null,
    };
}

export function toCategoryList(categories: Category[]): CategoryView[] {
    return categories.map(toCategory);
}

export function toLocationList(locations: Location[]): LocationView[] {
    return locations.map(toLocation);
}
