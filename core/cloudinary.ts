import { v2 as cloudinary } from "cloudinary";
import { config } from "./config.js";

/** A stored photo: the delivery URL plus the identifier used to manage it. */
export interface UploadedImage {
    url: string;
    publicId: string;
}

/** Raised when Cloudinary does not accept or store the photo. */
export class ImageUploadError extends Error {
    constructor(message: string, options?: { cause?: unknown }) {
        super(message, options);
        this.name = "ImageUploadError";
    }
}

export interface PhotoUploader {
    upload(file: Buffer): Promise<UploadedImage>;
    /** True when credentials are configured, so the route can fail predictably. */
    isConfigured(): boolean;
}

function isConfigured(): boolean {
    const { cloudName, apiKey, apiSecret } = config.cloudinary;

    return Boolean(cloudName && apiKey && apiSecret);
}

/* Cloudinary reports failures as its own error objects; map anything thrown
 * here onto a single type so the route can answer 502 without leaking SDK
 * details to the caller. */
async function uploadToCloudinary(file: Buffer): Promise<UploadedImage> {
    if (!isConfigured()) {
        throw new ImageUploadError(
            "Cloudinary credentials are not configured.",
        );
    }

    cloudinary.config({
        cloud_name: config.cloudinary.cloudName,
        api_key: config.cloudinary.apiKey,
        api_secret: config.cloudinary.apiSecret,
        secure: true,
    });

    try {
        const result = await new Promise<Record<string, unknown>>(
            (resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(
                        {
                            folder: config.cloudinary.folder,
                            resource_type: "image",
                            // Keep the media type honest; the route already
                            // refuses anything else before calling us.
                            allowed_formats: ["jpg", "jpeg", "png", "webp"],
                        },
                        (error, uploaded) => {
                            if (error) {
                                reject(
                                    new ImageUploadError(error.message, {
                                        cause: error,
                                    }),
                                );

                                return;
                            }

                            if (!uploaded) {
                                reject(
                                    new ImageUploadError(
                                        "Cloudinary returned no result.",
                                    ),
                                );

                                return;
                            }

                            resolve(uploaded as Record<string, unknown>);
                        },
                    )
                    .end(file);
            },
        );

        const url = result.secure_url;
        const publicId = result.public_id;

        if (typeof url !== "string" || typeof publicId !== "string") {
            throw new ImageUploadError(
                "Cloudinary returned an unexpected response.",
            );
        }

        return { url, publicId };
    } catch (error: unknown) {
        if (error instanceof ImageUploadError) {
            throw error;
        }

        throw new ImageUploadError("Cloudinary upload failed.", {
            cause: error,
        });
    }
}

/* Swappable so tests can exercise the route without reaching Cloudinary. */
let uploader: PhotoUploader = {
    upload: uploadToCloudinary,
    isConfigured,
};

export function getPhotoUploader(): PhotoUploader {
    return uploader;
}

/** Replace the uploader. Tests use this; production keeps the default. */
export function setPhotoUploader(next: PhotoUploader): void {
    uploader = next;
}
