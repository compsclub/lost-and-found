import type { ContactMethod, ReportType } from "./api";
import { isEmail, isPhone } from "./contact";
import { todayIso } from "./dates";

export const DESCRIPTION_LIMIT = 600;
export const TITLE_LIMIT = 80;
export const ROOM_LIMIT = 200;

/** Mirrors the server's upload limit so the form can reject a file early. */
export const PHOTO_LIMIT_BYTES = 5 * 1024 * 1024;

/** The image types Cloudinary and the API accept. */
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** The values collected by the submission form. */
export interface ReportFormValues {
    type: ReportType;
    title: string;
    categorySlug: string;
    /** Only used when the selected category is `other`. */
    categoryOther: string;
    locationSlug: string;
    room: string;
    date: string;
    description: string;
    contactMethod: ContactMethod;
    contactValue: string;
}

/** Field name to message, for the fields that failed validation. */
export type ReportFormErrors = Partial<Record<keyof ReportFormValues, string>>;

/* Validate a report form. `now` is injectable so the future-date rule can be
 * tested without depending on the clock. */
export function validateReportForm(
    form: ReportFormValues,
    now: string = todayIso(),
): ReportFormErrors {
    const errors: ReportFormErrors = {};

    if (!form.title.trim()) {
        errors.title = "Silakan isi nama barang.";
    } else if (form.title.trim().length < 3) {
        errors.title = "Nama barang minimal 3 karakter.";
    } else if (form.title.trim().length > TITLE_LIMIT) {
        errors.title = `Nama barang maksimal ${TITLE_LIMIT} karakter.`;
    }

    if (!form.categorySlug) {
        errors.categorySlug = "Silakan pilih kategori.";
    }

    const categoryOther = form.categoryOther.trim();

    if (form.categorySlug === "other") {
        if (categoryOther.length < 3) {
            errors.categoryOther =
                "Silakan isi nama kategori (minimal 3 karakter).";
        } else if (categoryOther.length > 100) {
            errors.categoryOther = "Nama kategori maksimal 100 karakter.";
        }
    }

    if (!form.locationSlug) {
        errors.locationSlug = "Silakan pilih lokasi.";
    }

    if (!form.date) {
        errors.date = "Silakan pilih tanggal.";
    } else if (form.date > now) {
        errors.date = "Tanggal tidak boleh di masa depan.";
    }

    if (form.description.trim().length < 10) {
        errors.description =
            "Silakan tambahkan deskripsi singkat (minimal 10 karakter).";
    } else if (form.description.trim().length > DESCRIPTION_LIMIT) {
        errors.description = `Deskripsi maksimal ${DESCRIPTION_LIMIT} karakter.`;
    }

    const contactValue = form.contactValue.trim();

    if (!contactValue) {
        errors.contactValue = "Silakan isi detail kontak.";
    } else if (form.contactMethod === "EMAIL" && !isEmail(contactValue)) {
        errors.contactValue = "Silakan isi alamat email yang valid.";
    } else if (form.contactMethod !== "EMAIL" && !isPhone(contactValue)) {
        errors.contactValue = "Silakan isi nomor telepon yang valid.";
    }

    if (form.room.trim().length > ROOM_LIMIT) {
        errors.room = `Detail lokasi maksimal ${ROOM_LIMIT} karakter.`;
    }

    return errors;
}

/** Returns a message when the chosen photo cannot be uploaded, else null. */
export function photoError(file: File | null): string | null {
    if (!file) {
        return null;
    }

    if (!PHOTO_TYPES.includes(file.type as (typeof PHOTO_TYPES)[number])) {
        return "Foto harus berformat JPEG, PNG, atau WebP.";
    }

    if (file.size > PHOTO_LIMIT_BYTES) {
        return "Ukuran foto maksimal 5 MB.";
    }

    return null;
}
