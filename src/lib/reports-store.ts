/* Report persistence.
 * Reports are stored locally for now; every read and write goes through this
 * module so the storage layer can be replaced without touching the views. */

import type { ReportType } from "./options";

const STORAGE_KEY = "fasilkom-lost-and-found:reports";

export interface StoredReport {
    id: string;
    type: ReportType;
    title: string;
    category: string;
    location: string;
    room: string;
    /** ISO date, `YYYY-MM-DD`. */
    date: string;
    description: string;
    /** Data URL of the downscaled photo, or an empty string. */
    photo: string;
    contactMethod: string;
    contactValue: string;
    name: string;
    /** Millisecond timestamp used for ordering. */
    createdAt: number;
}

export interface SaveResult {
    saved: boolean;
    droppedPhoto: boolean;
}

function readAll(): StoredReport[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return [];
        }

        const parsed: unknown = JSON.parse(raw);

        return Array.isArray(parsed) ? (parsed as StoredReport[]) : [];
    } catch {
        return [];
    }
}

function writeAll(reports: StoredReport[]): boolean {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));

        return true;
    } catch {
        return false;
    }
}

export function listReports(): StoredReport[] {
    return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function findReport(id: string): StoredReport | null {
    return readAll().find((report) => report.id === id) ?? null;
}

export function saveReport(report: StoredReport): SaveResult {
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

export function createReportId(): string {
    return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

interface PhotoOptions {
    maxSize?: number;
    quality?: number;
}

/* Downscale photos so they fit comfortably in local storage. */
export function readPhoto(
    file: File | null | undefined,
    { maxSize = 900, quality = 0.72 }: PhotoOptions = {},
): Promise<string | null> {
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

                if (!context) {
                    resolve(null);

                    return;
                }

                context.fillStyle = "#fff";
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0, canvas.width, canvas.height);

                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            image.src = String(reader.result);
        };
        reader.readAsDataURL(file);
    });
}
