function toCategory(category) {
    return {
        id: category.id,
        slug: category.slug,
        name: category.name,
    };
}

function toLocation(location) {
    return {
        id: location.id,
        slug: location.slug,
        name: location.name,
    };
}

export function toReportSummary(report) {
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

export function toReportDetail(report) {
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

export function toCategoryList(categories) {
    return categories.map(toCategory);
}

export function toLocationList(locations) {
    return locations.map(toLocation);
}
