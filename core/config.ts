import "dotenv/config";

const DEFAULT_PORT = 3000;
const DEFAULT_FRONTEND_ORIGIN = "http://localhost:5173";

function parsePort(value: string | undefined): number {
    const port = Number(value ?? DEFAULT_PORT);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT must be an integer from 1 to 65535.");
    }

    return port;
}

function parseOrigins(value: string | undefined): string[] {
    return (value ?? DEFAULT_FRONTEND_ORIGIN)
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
}

export interface AppConfig {
    port: number;
    frontendOrigins: string[];
    databaseUrl: string;
    cloudinary: CloudinaryConfig;
}

/** Credentials and storage target for report photos. */
export interface CloudinaryConfig {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    /** Folder that uploaded photos are stored under. */
    folder: string;
}

const DEFAULT_CLOUDINARY_FOLDER = "lost-and-found";

/* Accept the single connection string Cloudinary shows in its console:
 * `cloudinary://<api_key>:<api_secret>@<cloud_name>`. Some console pages also
 * append query parameters, so anything after `?` is ignored here. */
export function parseCloudinaryUrl(value: string): CloudinaryConfig | null {
    if (!value.toLowerCase().startsWith("cloudinary://")) {
        return null;
    }

    let parsed: URL;

    try {
        parsed = new URL(value);
    } catch {
        return null;
    }

    const cloudName = parsed.hostname;
    const apiKey = decodeURIComponent(parsed.username);
    const apiSecret = decodeURIComponent(parsed.password);

    if (!cloudName || !apiKey || !apiSecret) {
        return null;
    }

    return { cloudName, apiKey, apiSecret, folder: readFolder() };
}

function readFolder(): string {
    return process.env.CLOUDINARY_FOLDER ?? DEFAULT_CLOUDINARY_FOLDER;
}

/* Read once so a missing credential is reported at startup rather than on the
 * first upload attempt. The photo is optional, so the rest of the API still
 * runs without these; only the upload path answers 502.
 *
 * `CLOUDINARY_URL` wins when present because it is what the console offers;
 * the individual variables remain supported for deployments that set them. */
function readCloudinary(): CloudinaryConfig {
    const fromUrl = process.env.CLOUDINARY_URL
        ? parseCloudinaryUrl(process.env.CLOUDINARY_URL)
        : null;

    if (fromUrl) {
        return fromUrl;
    }

    return {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
        apiKey: process.env.CLOUDINARY_API_KEY ?? "",
        apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
        folder: readFolder(),
    };
}

export const config: AppConfig = {
    port: parsePort(process.env.PORT),
    frontendOrigins: parseOrigins(process.env.FRONTEND_ORIGIN),
    databaseUrl: process.env.DATABASE_URL ?? "",
    cloudinary: readCloudinary(),
};
