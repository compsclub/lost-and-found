const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
});

export function todayIso(): string {
    return toIsoDate(new Date());
}

export function toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function formatDate(value: string | null | undefined): string {
    if (!value) {
        return "";
    }

    const parts = String(value).split("-");

    if (parts.length !== 3) {
        return value;
    }

    const [year, month, day] = parts.map(Number);

    if (!year || !month || !day) {
        return value;
    }

    return dateFormatter.format(new Date(year, month - 1, day));
}

export function formatTimestamp(value: number | string | Date): string {
    return new Date(value).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}
