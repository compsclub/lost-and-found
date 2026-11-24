import type { ContactMethod } from "./api";

/** Build a deep link for the selected contact method.
 * LINE has no reliable deep link, so it returns an empty string. */
export function contactHref(method: ContactMethod, value: string): string {
    const trimmed = String(value ?? "").trim();

    if (!trimmed) {
        return "";
    }

    switch (method) {
        case "WHATSAPP": {
            let digits = trimmed.replace(/\D/g, "");

            if (digits.startsWith("0")) {
                digits = `62${digits.slice(1)}`;
            }

            return `https://wa.me/${digits}`;
        }
        case "PHONE":
            return `tel:${trimmed.replace(/\s/g, "")}`;
        case "EMAIL":
            return `mailto:${encodeURI(trimmed)}`;
        default:
            return "";
    }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string): boolean {
    return EMAIL_PATTERN.test(String(value ?? "").trim());
}

/** Accepts local or international formatting; the API normalises to E.164. */
export function isPhone(value: string): boolean {
    const trimmed = String(value ?? "").trim();
    const digits = trimmed.replace(/\D/g, "");
    const looksInternational = trimmed.startsWith("+");

    if (looksInternational) {
        return /^\+[1-9]\d{7,14}$/.test(trimmed.replace(/[\s-]/g, ""));
    }

    return digits.length >= 8 && digits.length <= 15;
}

/** Normalise a phone number to the E.164 shape the API expects. */
export function toE164(value: string): string {
    const trimmed = String(value ?? "").trim();
    const digits = trimmed.replace(/\D/g, "");

    if (trimmed.startsWith("+")) {
        return `+${digits}`;
    }

    if (digits.startsWith("0")) {
        return `+62${digits.slice(1)}`;
    }

    return `+${digits}`;
}
