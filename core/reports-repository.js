import { prisma } from "./db.js";
import {
    toCategoryList,
    toLocationList,
    toReportDetail,
    toReportSummary,
} from "./presenters.js";

const reportInclude = {
    category: true,
    location: true,
};

const reportDetailInclude = {
    ...reportInclude,
    contact: true,
};

export function findCategories() {
    return prisma.category
        .findMany({ orderBy: { name: "asc" } })
        .then(toCategoryList);
}

export function findLocations() {
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
}) {
    const where = {
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

export function findReportById(id) {
    return prisma.report
        .findUnique({ where: { id }, include: reportDetailInclude })
        .then((report) => (report ? toReportDetail(report) : null));
}

export function findCategoryById(id) {
    return prisma.category.findUnique({ where: { id } });
}

export function findLocationById(id) {
    return prisma.location.findUnique({ where: { id } });
}

export async function createReport(input) {
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

export function countReports() {
    return prisma.report.count();
}
