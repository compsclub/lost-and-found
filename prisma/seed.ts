import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

interface ReferenceRow {
    id: string;
    slug: string;
    name: string;
}

interface ReferenceResponse {
    data: ReferenceRow[];
}

interface SeedReport {
    id: string;
    reportType: "LOST" | "FOUND";
    itemName: string;
    category: ReferenceRow;
    categoryOther: string | null;
    description: string;
    location: ReferenceRow;
    locationDetail: string | null;
    occurredAt: string | null;
    imageUrl: string | null;
    publicContact: {
        method: "EMAIL" | "PHONE" | "WHATSAPP";
        value: string;
    };
    createdAt: string;
}

const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
);
const mockDirectory = path.join(projectRoot, "tests", "mock");

async function readMock<T>(name: string): Promise<T> {
    const source = await readFile(path.join(mockDirectory, name), "utf8");

    return JSON.parse(source) as T;
}

function buildAdapter(): PrismaPg {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error("DATABASE_URL must be set to seed the database.");
    }

    return new PrismaPg({ connectionString });
}

async function seedCategories(
    prisma: PrismaClient,
    categories: ReferenceResponse,
): Promise<void> {
    for (const category of categories.data) {
        await prisma.category.upsert({
            where: { slug: category.slug },
            update: { name: category.name },
            create: {
                id: category.id,
                slug: category.slug,
                name: category.name,
            },
        });
    }
}

async function seedLocations(
    prisma: PrismaClient,
    locations: ReferenceResponse,
): Promise<void> {
    for (const location of locations.data) {
        await prisma.location.upsert({
            where: { slug: location.slug },
            update: { name: location.name },
            create: {
                id: location.id,
                slug: location.slug,
                name: location.name,
            },
        });
    }
}

function buildImagePublicId(imageUrl: string | null): string | null {
    if (!imageUrl) {
        return null;
    }

    const fileName = imageUrl.split("/").pop() ?? "report-image";
    const baseName = fileName.replace(/\.[^.]+$/, "");

    return `lost-and-found-demo/reports/${baseName}`;
}

async function seedReports(
    prisma: PrismaClient,
    reports: SeedReport[],
): Promise<void> {
    for (const report of reports) {
        await prisma.report.upsert({
            where: { id: report.id },
            update: {},
            create: {
                id: report.id,
                reportType: report.reportType,
                itemName: report.itemName,
                categoryId: report.category.id,
                categoryOther: report.categoryOther,
                description: report.description,
                locationId: report.location.id,
                locationDetail: report.locationDetail,
                occurredAt: report.occurredAt
                    ? new Date(report.occurredAt)
                    : null,
                imageUrl: report.imageUrl,
                imagePublicId: buildImagePublicId(report.imageUrl),
                createdAt: new Date(report.createdAt),
                contact: {
                    create: {
                        method: report.publicContact.method,
                        value: report.publicContact.value,
                    },
                },
            },
        });
    }
}

async function main(): Promise<void> {
    const prisma = new PrismaClient({ adapter: buildAdapter() });
    const [categories, locations, reports] = await Promise.all([
        readMock<ReferenceResponse>("categories.response.json"),
        readMock<ReferenceResponse>("locations.response.json"),
        readMock<SeedReport[]>("reports.seed.json"),
    ]);

    await seedCategories(prisma, categories);
    await seedLocations(prisma, locations);
    await seedReports(prisma, reports);

    const counts = await Promise.all([
        prisma.category.count(),
        prisma.location.count(),
        prisma.report.count(),
        prisma.reportContact.count(),
    ]);

    console.info(
        `Seeded categories=${counts[0]}, locations=${counts[1]}, reports=${counts[2]}, contacts=${counts[3]}.`,
    );
    await prisma.$disconnect();
}

await main();
