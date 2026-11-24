export const CATEGORIES = [
    { value: "electronics", label: "Elektronik" },
    { value: "cards", label: "Kartu & Dokumen" },
    { value: "bottle", label: "Botol minum" },
    { value: "other", label: "Lainnya" },
];

export const LOCATIONS = [
    { value: "Gedung Lama", label: "Gedung Lama" },
    { value: "Gedung Baru", label: "Gedung Baru" },
];

export const CONTACT_METHODS = [
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

export const REPORT_TYPES = [
    { value: "lost", label: "Hilang" },
    { value: "found", label: "Ditemukan" },
];

export function categoryOf(value) {
    return (
        CATEGORIES.find((item) => item.value === value) ??
        CATEGORIES[CATEGORIES.length - 1]
    );
}

export function contactOf(value) {
    return (
        CONTACT_METHODS.find((item) => item.value === value) ??
        CONTACT_METHODS[0]
    );
}

export function reportTypeLabel(value) {
    return value === "lost" ? "Hilang" : "Ditemukan";
}
