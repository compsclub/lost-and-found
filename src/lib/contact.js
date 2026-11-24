export function contactHref(method, value) {
    const trimmed = String(value ?? "").trim();

    if (!trimmed) {
        return "";
    }

    switch (method) {
        case "whatsapp": {
            let digits = trimmed.replace(/\D/g, "");

            if (digits.startsWith("0")) {
                digits = `62${digits.slice(1)}`;
            }

            return `https://wa.me/${digits}`;
        }
        case "instagram":
            return `https://instagram.com/${encodeURIComponent(trimmed.replace(/^@/, ""))}`;
        case "telegram":
            return `https://t.me/${encodeURIComponent(trimmed.replace(/^@/, ""))}`;
        case "email":
            return `mailto:${encodeURI(trimmed)}`;
        default:
            return "";
    }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value) {
    return EMAIL_PATTERN.test(String(value ?? "").trim());
}

export function isPhone(value) {
    return String(value ?? "").replace(/\D/g, "").length >= 8;
}
