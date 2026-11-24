import type {
    CategoryView,
    ContactMethod,
    LocationView,
    ReportType,
} from "./api";

export interface SelectOption {
    value: string;
    label: string;
}

export interface ContactMethodOption {
    value: ContactMethod;
    label: string;
    field: string;
    placeholder: string;
    type: "tel" | "text" | "email";
}

export const CONTACT_METHODS: ContactMethodOption[] = [
    {
        value: "WHATSAPP",
        label: "WhatsApp",
        field: "Nomor WhatsApp",
        placeholder: "mis. +6281234567890",
        type: "tel",
    },
    {
        value: "PHONE",
        label: "Telepon",
        field: "Nomor telepon",
        placeholder: "mis. +6281234567890",
        type: "tel",
    },
    {
        value: "EMAIL",
        label: "Email",
        field: "Alamat email",
        placeholder: "mis. nama@ui.ac.id",
        type: "email",
    },
];

export const REPORT_TYPES: Array<{ value: ReportType; label: string }> = [
    { value: "LOST", label: "Hilang" },
    { value: "FOUND", label: "Ditemukan" },
];

/** Resolve a contact method, falling back to the first option. */
export function contactOf(value: string | undefined): ContactMethodOption {
    return (
        CONTACT_METHODS.find((item) => item.value === value) ??
        (CONTACT_METHODS[0] as ContactMethodOption)
    );
}

export function reportTypeLabel(value: ReportType): string {
    return value === "LOST" ? "Hilang" : "Ditemukan";
}

/** Category and location options come from the API so they always match. */
export function toCategoryOptions(categories: CategoryView[]): SelectOption[] {
    return categories.map((category) => ({
        value: category.slug,
        label: category.name,
    }));
}

export function toLocationOptions(locations: LocationView[]): SelectOption[] {
    return locations.map((location) => ({
        value: location.slug,
        label: location.name,
    }));
}
