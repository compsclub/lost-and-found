-- CreateEnum
CREATE TYPE "report_type" AS ENUM ('LOST', 'FOUND');

-- CreateEnum
CREATE TYPE "contact_method" AS ENUM ('EMAIL', 'PHONE', 'WHATSAPP');

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "report_type" "report_type" NOT NULL,
    "item_name" VARCHAR(100) NOT NULL,
    "category_id" UUID NOT NULL,
    "category_other" VARCHAR(100),
    "description" TEXT NOT NULL,
    "location_id" UUID NOT NULL,
    "location_detail" VARCHAR(200),
    "occurred_at" TIMESTAMPTZ(6),
    "image_url" TEXT,
    "image_public_id" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_contacts" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "method" "contact_method" NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "report_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "locations_slug_key" ON "locations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "locations_name_key" ON "locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "reports_image_public_id_key" ON "reports"("image_public_id");

-- CreateIndex
CREATE INDEX "reports_created_at_idx" ON "reports"("created_at" DESC);

-- CreateIndex
CREATE INDEX "reports_type_created_at_idx" ON "reports"("report_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reports_category_created_at_idx" ON "reports"("category_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reports_location_created_at_idx" ON "reports"("location_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "report_contacts_report_id_key" ON "report_contacts"("report_id");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_contacts" ADD CONSTRAINT "report_contacts_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep the Cloudinary reference pair consistent: both columns are NULL or both are set.
ALTER TABLE "reports"
    ADD CONSTRAINT "reports_image_reference_check" CHECK (
        ("image_url" IS NULL AND "image_public_id" IS NULL)
        OR ("image_url" IS NOT NULL AND "image_public_id" IS NOT NULL)
    );
