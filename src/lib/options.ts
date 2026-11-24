export interface SelectOption {
    value: string;
    label: string;
}

export interface ContactMethodOption extends SelectOption {
    field: string;
    placeholder: string;
    type: "tel" | "text" | "email";
}

export type ReportType = "lost" | "found";

export const CATEGORIES: SelectOption[] = [
    { value: "electronics", label: "Elektronik" },
    { value: "cards", label: "Kartu & Dokumen" },
    { value: "bottle", label: "Botol minum" },
    { value: "other", label: "Lainnya" },
];

export const LOCATIONS: SelectOption[] = [
    { value: "Gedung Lama", label: "Gedung Lama" },
    { value: "Gedung Baru", label: "Gedung Baru" },
];

export const CONTACT_METHODS: ContactMethodOption[] = [
    {
        value: "whatsapp",
        label: "WhatsApp",
        field: "Nomor WhatsApp",
        placeholder: "mis. 081234567890",
        type: "tel",
    },
    {
        value: "line",
        label: "LINE",
        field: "ID LINE",
        placeholder: "mis. rina.cs23",
        type: "text",
    },
    {
        value: "instagram",
        label: "Instagram",
        field: "Nama pengguna Instagram",
        placeholder: "mis. rina.cs23",
        type: "text",
    },
    {
        value: "email",
        label: "Email",
        field: "Alamat email",
        placeholder: "mis. nama@ui.ac.id",
        type: "email",
    },
];

export const REPORT_TYPES: Array<{ value: ReportType; label: string }> = [
    { value: "lost", label: "Hilang" },
    { value: "found", label: "Ditemukan" },
];

/** Resolve a category, falling back to the catch-all option. */
export function categoryOf(value: string | undefined): SelectOption {
    return (
        CATEGORIES.find((item) => item.value === value) ??
        (CATEGORIES[CATEGORIES.length - 1] as SelectOption)
    );
}

/** Resolve a contact method, falling back to the first option. */
export function contactOf(value: string | undefined): ContactMethodOption {
    return (
        CONTACT_METHODS.find((item) => item.value === value) ??
        (CONTACT_METHODS[0] as ContactMethodOption)
    );
}

export function reportTypeLabel(value: ReportType): string {
    return value === "lost" ? "Hilang" : "Ditemukan";
}
