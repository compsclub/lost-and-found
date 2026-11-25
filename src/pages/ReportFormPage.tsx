import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Container } from "../components/Container";
import { Field, FieldErrors } from "../components/Field";
import type { CategoryView, LocationView } from "../lib/api";
import {
    ApiError,
    createReport,
    fetchCategories,
    fetchLocations,
} from "../lib/api";
import { toE164 } from "../lib/contact";
import { todayIso } from "../lib/dates";
import { CONTACT_METHODS, contactOf, REPORT_TYPES } from "../lib/options";
import type { ReportFormErrors, ReportFormValues } from "../lib/validation";
import {
    DESCRIPTION_LIMIT,
    PHOTO_TYPES,
    photoError,
    TITLE_LIMIT,
    validateReportForm,
} from "../lib/validation";
import styles from "./ReportFormPage.module.css";

const emptyForm: ReportFormValues = {
    type: "LOST",
    title: "",
    categorySlug: "",
    categoryOther: "",
    locationSlug: "",
    room: "",
    date: "",
    description: "",
    contactMethod: "WHATSAPP",
    contactValue: "",
};

export function ReportFormPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const presetType = searchParams.get("type");

    const [form, setForm] = useState<ReportFormValues>({
        ...emptyForm,
        type: presetType === "FOUND" ? "FOUND" : "LOST",
        date: todayIso(),
    });
    const [errors, setErrors] = useState<ReportFormErrors>({});
    const [serverError, setServerError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoIssue, setPhotoIssue] = useState<string | null>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [categories, setCategories] = useState<CategoryView[]>([]);
    const [locations, setLocations] = useState<LocationView[]>([]);
    const formRef = useRef<HTMLFormElement>(null);

    /* Object URLs stay alive until revoked, so the preview gets one that lives
     * exactly as long as the chosen file. */
    const photoUrl = useMemo(
        () => (photo ? URL.createObjectURL(photo) : ""),
        [photo],
    );

    useEffect(
        () => () => {
            if (photoUrl) {
                URL.revokeObjectURL(photoUrl);
            }
        },
        [photoUrl],
    );

    function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        const issue = photoError(file);

        if (issue) {
            // Drop the rejected file so the form cannot submit it.
            setPhoto(null);
            setPhotoIssue(issue);

            if (photoInputRef.current) {
                photoInputRef.current.value = "";
            }

            return;
        }

        setPhoto(file);
        setPhotoIssue(null);
    }

    function clearPhoto() {
        setPhoto(null);
        setPhotoIssue(null);

        if (photoInputRef.current) {
            photoInputRef.current.value = "";
        }
    }

    useEffect(() => {
        document.title = "Buat laporan · Fasilkom UI Lost & Found";
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        Promise.all([
            fetchCategories(controller.signal),
            fetchLocations(controller.signal),
        ])
            .then(([nextCategories, nextLocations]) => {
                setCategories(nextCategories);
                setLocations(nextLocations);
            })
            .catch(() => {
                setServerError(
                    "Gagal memuat pilihan kategori dan lokasi. Muat ulang halaman.",
                );
            });

        return () => controller.abort();
    }, []);

    // Custom category/location names apply only to the "other" rows.
    const selectedCategory = useMemo(
        () => categories.find((item) => item.slug === form.categorySlug),
        [categories, form.categorySlug],
    );
    const selectedLocation = useMemo(
        () => locations.find((item) => item.slug === form.locationSlug),
        [locations, form.locationSlug],
    );
    const isOtherCategory = selectedCategory?.slug === "other";
    const isOtherLocation = selectedLocation?.slug === "other";
    const contact = contactOf(form.contactMethod);

    function update(name: keyof ReportFormValues, value: string) {
        setForm((current) => ({ ...current, [name]: value }));
    }

    function focusFirstError(nextErrors: ReportFormErrors) {
        const firstField = Object.keys(nextErrors)[0];

        if (!firstField) {
            return;
        }

        const element = formRef.current?.querySelector<HTMLElement>(
            `[name="${firstField}"]`,
        );

        element?.scrollIntoView({ behavior: "smooth", block: "center" });
        element?.focus();
    }

    function applyServerDetails(error: ApiError) {
        const nextErrors: ReportFormErrors = {};

        for (const detail of error.details) {
            const field = detail.field as keyof ReportFormValues;

            if (field in emptyForm) {
                nextErrors[field] = detail.message;
            }
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors((current) => ({ ...current, ...nextErrors }));
            focusFirstError(nextErrors);

            return;
        }

        setServerError(error.message);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setServerError("");

        const nextErrors = validateReportForm(form);

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            focusFirstError(nextErrors);

            return;
        }

        if (!selectedCategory || !selectedLocation) {
            setServerError("Silakan pilih kategori dan lokasi.");

            return;
        }

        const issue = photoError(photo);

        if (issue) {
            setPhotoIssue(issue);

            return;
        }

        setSubmitting(true);

        try {
            const created = await createReport(
                {
                    reportType: form.type,
                    itemName: form.title.trim(),
                    categoryId: selectedCategory.id,
                    categoryOther: isOtherCategory
                        ? form.categoryOther.trim()
                        : null,
                    description: form.description.trim(),
                    locationId: selectedLocation.id,
                    locationDetail: form.room.trim() || null,
                    occurredAt: form.date
                        ? new Date(form.date).toISOString()
                        : null,
                    contact: {
                        method: form.contactMethod,
                        value:
                            form.contactMethod === "EMAIL"
                                ? form.contactValue.trim()
                                : toE164(form.contactValue),
                    },
                },
                photo,
            );

            navigate(`/report/${encodeURIComponent(created.id)}`);
        } catch (error: unknown) {
            setSubmitting(false);

            if (error instanceof ApiError) {
                applyServerDetails(error);

                return;
            }

            setServerError("Laporan gagal dikirim. Coba lagi.");
        }
    }

    const dateLabel =
        form.type === "LOST" ? "Tanggal hilang" : "Tanggal ditemukan";

    return (
        <Container narrow>
            <Link to="/" className={styles.backLink}>
                ← Kembali ke semua laporan
            </Link>

            <div className={styles.card}>
                <h1 className={styles.title}>Buat laporan</h1>
                <p className={styles.muted}>
                    Laporan bersifat publik. Hanya metode kontak yang kamu pilih
                    di bawah yang akan ditampilkan kepada pengunjung.
                </p>

                {serverError ? (
                    <p className={styles.notice} role="alert">
                        {serverError}
                    </p>
                ) : null}

                <form ref={formRef} onSubmit={handleSubmit} noValidate>
                    <fieldset className={styles.typeToggle}>
                        <legend>Ada apa?</legend>

                        {REPORT_TYPES.map((type) => (
                            <label
                                key={type.value}
                                className={`${styles.typeOption} ${
                                    type.value === "LOST"
                                        ? styles.typeLost
                                        : styles.typeFound
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="type"
                                    value={type.value}
                                    checked={form.type === type.value}
                                    onChange={() => update("type", type.value)}
                                />
                                <span>
                                    <strong>
                                        {type.value === "LOST"
                                            ? "Saya kehilangan barang"
                                            : "Saya menemukan barang"}
                                    </strong>
                                    <small>
                                        {type.value === "LOST"
                                            ? "Sedang mencari sesuatu yang saya hilangkan"
                                            : "Saya menyimpan barang milik orang lain"}
                                    </small>
                                </span>
                            </label>
                        ))}
                    </fieldset>

                    <FieldErrors errors={errors} />

                    <Field
                        label="Nama barang"
                        name="title"
                        required
                        error={errors.title}
                    >
                        <input
                            id="title"
                            name="title"
                            type="text"
                            maxLength={TITLE_LIMIT}
                            value={form.title}
                            placeholder="mis. Ransel Eiger hitam"
                            onChange={(event) =>
                                update("title", event.target.value)
                            }
                        />
                    </Field>

                    <div className={styles.row}>
                        <Field
                            label="Kategori"
                            name="categorySlug"
                            required
                            error={errors.categorySlug}
                        >
                            <select
                                id="categorySlug"
                                name="categorySlug"
                                value={form.categorySlug}
                                onChange={(event) =>
                                    update("categorySlug", event.target.value)
                                }
                            >
                                <option value="">Pilih kategori</option>
                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.slug}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field
                            label="Lokasi"
                            name="locationSlug"
                            required
                            error={errors.locationSlug}
                        >
                            <select
                                id="locationSlug"
                                name="locationSlug"
                                value={form.locationSlug}
                                onChange={(event) =>
                                    update("locationSlug", event.target.value)
                                }
                            >
                                <option value="">Pilih lokasi</option>
                                {locations.map((location) => (
                                    <option
                                        key={location.id}
                                        value={location.slug}
                                    >
                                        {location.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    {isOtherCategory ? (
                        <Field
                            label="Nama kategori"
                            name="categoryOther"
                            required
                            error={errors.categoryOther}
                        >
                            <input
                                id="categoryOther"
                                name="categoryOther"
                                type="text"
                                maxLength={100}
                                value={form.categoryOther}
                                placeholder="mis. Payung, alat musik"
                                onChange={(event) =>
                                    update("categoryOther", event.target.value)
                                }
                            />
                        </Field>
                    ) : null}

                    <Field
                        label={
                            isOtherLocation
                                ? "Nama lokasi"
                                : "Ruangan atau titik spesifik"
                        }
                        name="room"
                        required={isOtherLocation}
                        optionalLabel={isOtherLocation ? undefined : "opsional"}
                        error={errors.room}
                    >
                        <input
                            id="room"
                            name="room"
                            type="text"
                            maxLength={200}
                            value={form.room}
                            placeholder={
                                isOtherLocation
                                    ? "mis. Kantin Fakultas Teknik, dekat pintu timur"
                                    : "mis. Ruang 2.3, koridor lantai 2"
                            }
                            onChange={(event) =>
                                update("room", event.target.value)
                            }
                        />
                    </Field>

                    <Field
                        label={dateLabel}
                        name="date"
                        required
                        error={errors.date}
                    >
                        <input
                            id="date"
                            name="date"
                            type="date"
                            max={todayIso()}
                            value={form.date}
                            onChange={(event) =>
                                update("date", event.target.value)
                            }
                        />
                    </Field>

                    <Field
                        label="Deskripsi"
                        name="description"
                        required
                        hint={`${form.description.length}/${DESCRIPTION_LIMIT}`}
                        error={errors.description}
                    >
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            maxLength={DESCRIPTION_LIMIT}
                            value={form.description}
                            placeholder="Warna, merek, tanda khusus, lokasi persis, dan detail lain yang membantu mengenalinya."
                            onChange={(event) =>
                                update("description", event.target.value)
                            }
                        />
                    </Field>

                    <div className={styles.photoBox}>
                        <label htmlFor="photo">Foto barang (opsional)</label>
                        <p className={styles.hint}>
                            JPEG, PNG, atau WebP, maksimal 5 MB. Satu foto per
                            laporan.
                        </p>

                        <input
                            ref={photoInputRef}
                            id="photo"
                            name="photo"
                            type="file"
                            accept={PHOTO_TYPES.join(",")}
                            onChange={handlePhotoChange}
                        />

                        {photo ? (
                            <div className={styles.photoPreview}>
                                <img src={photoUrl} alt="Pratinjau foto" />
                                <div>
                                    <p className={styles.photoName}>
                                        {photo.name}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearPhoto}
                                    >
                                        Hapus foto
                                    </Button>
                                </div>
                            </div>
                        ) : null}

                        {photoIssue ? (
                            <p className={styles.photoError} role="alert">
                                {photoIssue}
                            </p>
                        ) : null}
                    </div>

                    <fieldset className={styles.contactBox}>
                        <legend>Kontak publik</legend>
                        <p className={styles.hint}>
                            Pilih <strong>satu</strong> metode kontak. Hanya
                            detail ini yang akan terlihat oleh publik.
                        </p>

                        <div className={styles.row}>
                            <Field
                                label="Metode kontak"
                                name="contactMethod"
                                required
                            >
                                <select
                                    id="contactMethod"
                                    name="contactMethod"
                                    value={form.contactMethod}
                                    onChange={(event) =>
                                        update(
                                            "contactMethod",
                                            event.target.value,
                                        )
                                    }
                                >
                                    {CONTACT_METHODS.map((method) => (
                                        <option
                                            key={method.value}
                                            value={method.value}
                                        >
                                            {method.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label={contact.field}
                                name="contactValue"
                                required
                                error={errors.contactValue}
                            >
                                <input
                                    id="contactValue"
                                    name="contactValue"
                                    type={contact.type}
                                    maxLength={80}
                                    value={form.contactValue}
                                    placeholder={contact.placeholder}
                                    onChange={(event) =>
                                        update(
                                            "contactValue",
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                        </div>
                    </fieldset>

                    <div className={styles.actions}>
                        <Button as={Link} to="/" variant="ghost">
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="red"
                            disabled={submitting}
                        >
                            {submitting ? "Mengirim…" : "Kirim laporan"}
                        </Button>
                    </div>
                </form>
            </div>
        </Container>
    );
}
