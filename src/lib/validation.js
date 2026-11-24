import { isEmail, isPhone } from "./contact.js";
import { todayIso } from "./dates.js";

export const DESCRIPTION_LIMIT = 600;
export const TITLE_LIMIT = 80;
export const ROOM_LIMIT = 60;
export const PHOTO_LIMIT_BYTES = 10 * 1024 * 1024;

/* Validate a report form. `now` is injectable so the future-date rule can be
 * tested without depending on the clock. */
export function validateReportForm(form, now = todayIso()) {
    const errors = {};

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
