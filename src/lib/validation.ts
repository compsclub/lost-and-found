import { isEmail, isPhone } from "./contact";
import { todayIso } from "./dates";
import type { ReportType } from "./options";

export const DESCRIPTION_LIMIT = 600;
export const TITLE_LIMIT = 80;
export const ROOM_LIMIT = 60;
export const PHOTO_LIMIT_BYTES = 10 * 1024 * 1024;

/** The values collected by the submission form. */
export interface ReportFormValues {
    type: ReportType;
    title: string;
    category: string;
    location: string;
    room: string;
    date: string;
    description: string;
    contactMethod: string;
    contactValue: string;
    name: string;
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
    } else if (form.title.trim().length > TITLE_LIMIT) {
        errors.title = `Nama barang maksimal ${TITLE_LIMIT} karakter.`;
    }

    if (!form.category) {
        errors.category = "Silakan pilih kategori.";
    }

    if (!form.location) {
        errors.location = "Silakan pilih lokasi.";
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
    } else if (form.contactMethod === "email" && !isEmail(contactValue)) {
        errors.contactValue = "Silakan isi alamat email yang valid.";
    } else if (form.contactMethod === "whatsapp" && !isPhone(contactValue)) {
        errors.contactValue = "Silakan isi nomor telepon yang valid.";
    }

    if (form.room.trim().length > ROOM_LIMIT) {
        errors.room = `Detail ruangan maksimal ${ROOM_LIMIT} karakter.`;
    }

    return errors;
}
