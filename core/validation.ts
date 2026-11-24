import { z } from "zod";

const MAX_ITEM_NAME = 100;
const MIN_ITEM_NAME = 3;
const MIN_DESCRIPTION = 10;
const MAX_DESCRIPTION = 2000;
const MAX_LOCATION_DETAIL = 200;
const MIN_CUSTOM_NAME = 3;

const itemName = z.string().trim().min(MIN_ITEM_NAME).max(MAX_ITEM_NAME);

const description = z.string().trim().min(MIN_DESCRIPTION).max(MAX_DESCRIPTION);

const customName = z.string().trim().min(MIN_CUSTOM_NAME).max(MAX_ITEM_NAME);

const uuid = z.uuid();

const isoTimestamp = z.iso.datetime({ offset: true });

export const reportTypeSchema = z.enum(["LOST", "FOUND"]);

export const contactMethodSchema = z.enum(["EMAIL", "PHONE", "WHATSAPP"]);

const emailValue = z.email();

const phoneValue = z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, "Must be an E.164 phone number.");

const contactSchema = z
    .object({
        method: contactMethodSchema,
        value: z.string().trim().min(3).max(255),
    })
    .superRefine((contact, context) => {
        const valueSchema =
            contact.method === "EMAIL" ? emailValue : phoneValue;

        if (!valueSchema.safeParse(contact.value).success) {
            context.addIssue({
                code: "custom",
                path: ["value"],
                message:
                    contact.method === "EMAIL"
                        ? "Must be a valid email address."
                        : "Must be an E.164 phone number.",
            });
        }
    });

export const createReportSchema = z
    .object({
        reportType: reportTypeSchema,
        itemName,
        categoryId: uuid,
        categoryOther: customName.nullish(),
        description,
        locationId: uuid,
        locationDetail: z.string().trim().max(MAX_LOCATION_DETAIL).nullish(),
        occurredAt: isoTimestamp.nullish(),
        contact: contactSchema,
    })
    .superRefine((body, context) => {
        if (body.occurredAt && new Date(body.occurredAt) > new Date()) {
            context.addIssue({
                code: "custom",
                path: ["occurredAt"],
                message: "Must not be in the future.",
            });
        }

        if (
            body.locationDetail &&
            body.locationDetail.length > MAX_LOCATION_DETAIL
        ) {
            context.addIssue({
                code: "custom",
                path: ["locationDetail"],
                message: `Must be at most ${MAX_LOCATION_DETAIL} characters.`,
            });
        }
    });

export const reportIdSchema = z.object({ id: uuid });

export const listReportsQuerySchema = z.object({
    q: z.string().trim().max(100).optional(),
    type: reportTypeSchema.optional(),
    category: z.string().trim().max(50).optional(),
    location: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type ReportType = z.infer<typeof reportTypeSchema>;

export type ContactMethod = z.infer<typeof contactMethodSchema>;

export type CreateReportInput = z.infer<typeof createReportSchema>;

export type ReportIdParams = z.infer<typeof reportIdSchema>;

export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
