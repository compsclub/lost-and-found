/* Report persistence.
 * Reports are stored locally for now; every read/write goes through this module
 * so the storage layer can be replaced without touching the views. */

const STORAGE_KEY = "fasilkom-lost-and-found:reports";

function readAll() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);

        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeAll(reports) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));

        return true;
    } catch {
        return false;
    }
}

export function listReports() {
    return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function findReport(id) {
    return readAll().find((report) => report.id === id) ?? null;
}

export function saveReport(report) {
    const reports = readAll();

    if (!writeAll([report, ...reports])) {
        if (!report.photo) {
            return { saved: false, droppedPhoto: false };
        }

        if (!writeAll([{ ...report, photo: "" }, ...reports])) {
            return { saved: false, droppedPhoto: false };
        }

        return { saved: true, droppedPhoto: true };
    }

    return { saved: true, droppedPhoto: false };
}

export function createReportId() {
    return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/* Downscale photos so they fit comfortably in local storage. */
export function readPhoto(file, { maxSize = 900, quality = 0.72 } = {}) {
    return new Promise((resolve) => {
        if (!file || !/^image\//.test(file.type)) {
            resolve(null);

            return;
        }

        const reader = new FileReader();

        reader.onerror = () => resolve(null);
        reader.onload = () => {
            const image = new Image();

            image.onerror = () => resolve(null);
            image.onload = () => {
                const scale = Math.min(
                    1,
                    maxSize / Math.max(image.width, image.height),
                );
                const canvas = document.createElement("canvas");

                canvas.width = Math.round(image.width * scale);
                canvas.height = Math.round(image.height * scale);

                const context = canvas.getContext("2d");

                context.fillStyle = "#fff";
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0, canvas.width, canvas.height);

                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            image.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}
