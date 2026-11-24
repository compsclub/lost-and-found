import type { Category, Location, Prisma } from "@prisma/client";
import { prisma } from "./db.js";
import {
    toCategoryList,
    toLocationList,
    toReportDetail,
    toReportSummary,
} from "./presenters.js";
import type {
    CategoryView,
    LocationView,
    ReportDetailView,
    ReportPageView,
} from "./types.js";
import type { CreateReportInput, ListReportsQuery } from "./validation.js";

const reportInclude = {
    category: true,
    location: true,
} satisfies Prisma.ReportInclude;

const reportDetailInclude = {
    ...reportInclude,
    contact: true,
} satisfies Prisma.ReportInclude;

export function findCategories(): Promise<CategoryView[]> {
    return prisma.category
        .findMany({ orderBy: { name: "asc" } })
        .then(toCategoryList);
}

export function findLocations(): Promise<LocationView[]> {
    return prisma.location
        .findMany({ orderBy: { name: "asc" } })
        .then(toLocationList);
}

export async function findReportPage({
    q,
    type,
    category,
    location,
    page,
    limit,
}: ListReportsQuery): Promise<ReportPageView> {
    const where: Prisma.ReportWhereInput = {
        ...(type ? { reportType: type } : {}),
        ...(q ? { itemName: { contains: q, mode: "insensitive" } } : {}),
        ...(category ? { category: { slug: category } } : {}),
        ...(location ? { location: { slug: location } } : {}),
    };

    const [totalItems, reports] = await prisma.$transaction([
        prisma.report.count({ where }),
        prisma.report.findMany({
            where,
            include: reportInclude,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
    ]);

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    return {
        data: reports.map(toReportSummary),
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
}

export function findReportById(id: string): Promise<ReportDetailView | null> {
    return prisma.report
        .findUnique({ where: { id }, include: reportDetailInclude })
        .then((report) => (report ? toReportDetail(report) : null));
}

export function findCategoryById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } });
}

export function findLocationById(id: string): Promise<Location | null> {
    return prisma.location.findUnique({ where: { id } });
}

export async function createReport(
    input: CreateReportInput,
): Promise<ReportDetailView> {
    const report = await prisma.report.create({
        data: {
            reportType: input.reportType,
            itemName: input.itemName,
            categoryId: input.categoryId,
            categoryOther: input.categoryOther ?? null,
            description: input.description,
            locationId: input.locationId,
            locationDetail: input.locationDetail ?? null,
            occurredAt: input.occurredAt ? new Date(input.occurredAt) : null,
            contact: {
                create: {
                    method: input.contact.method,
                    value: input.contact.value,
                },
            },
        },
        include: reportDetailInclude,
    });

    return toReportDetail(report);
}

export function countReports(): Promise<number> {
    return prisma.report.count();
}
