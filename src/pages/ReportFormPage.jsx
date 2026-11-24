import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button.jsx";
import { Container } from "../components/Container.jsx";
import { Field, FieldErrors } from "../components/Field.jsx";
import { todayIso } from "../lib/dates.js";
import {
    CATEGORIES,
    CONTACT_METHODS,
    contactOf,
    LOCATIONS,
    REPORT_TYPES,
} from "../lib/options.js";
import { createReportId, readPhoto, saveReport } from "../lib/reports-store.js";
import {
    DESCRIPTION_LIMIT,
    PHOTO_LIMIT_BYTES,
    validateReportForm,
} from "../lib/validation.js";
import styles from "./ReportFormPage.module.css";

const emptyForm = {
    type: "lost",
    title: "",
    category: "",
    location: "",
    room: "",
    date: "",
    description: "",
    contactMethod: "whatsapp",
    contactValue: "",
    name: "",
};

export function ReportFormPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const presetType = searchParams.get("type");

    const [form, setForm] = useState({
        ...emptyForm,
        type: presetType === "found" ? "found" : "lost",
        date: todayIso(),
    });
    const [errors, setErrors] = useState({});
    const [photo, setPhoto] = useState("");
    const [photoError, setPhotoError] = useState("");
    const [notice, setNotice] = useState("");
    const formRef = useRef(null);

    useEffect(() => {
        document.title = "Buat laporan · Fasilkom UI Lost & Found";
    }, []);

    const contact = contactOf(form.contactMethod);

    function update(name, value) {
        setForm((current) => ({ ...current, [name]: value }));
    }

    function focusFirstError(nextErrors) {
        const firstField = Object.keys(nextErrors)[0];

        if (!firstField) {
            return;
        }

        const element = formRef.current?.querySelector(
            `[name="${firstField}"]`,
        );

        element?.scrollIntoView({ behavior: "smooth", block: "center" });
        element?.focus();
    }

    async function handlePhotoChange(event) {
        const file = event.target.files?.[0];

        setPhotoError("");

        if (!file) {
            setPhoto("");

            return;
        }

        if (!/^image\//.test(file.type)) {
            setPhotoError("Silakan pilih berkas gambar.");
            event.target.value = "";

            return;
        }

        if (file.size > PHOTO_LIMIT_BYTES) {
            setPhotoError("Ukuran gambar terlalu besar (maksimal 10 MB).");
            event.target.value = "";

            return;
        }

        const dataUrl = await readPhoto(file);

        if (!dataUrl) {
            setPhotoError("Gambar tidak dapat dibaca.");

            return;
        }

        setPhoto(dataUrl);
    }

    function removePhoto() {
        setPhoto("");
        setPhotoError("");

        const input = formRef.current?.querySelector('[name="photo"]');

        if (input) {
            input.value = "";
        }
    }

    function handleSubmit(event) {
        event.preventDefault();

        const nextErrors = validateReportForm(form);

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            focusFirstError(nextErrors);

            return;
        }

        const report = {
            id: createReportId(),
            type: form.type,
            title: form.title.trim(),
            category: form.category,
            location: form.location,
            room: form.room.trim(),
            date: form.date,
            description: form.description.trim(),
            photo,
            contactMethod: form.contactMethod,
            contactValue: form.contactValue.trim(),
            name: form.name.trim(),
            createdAt: Date.now(),
        };

        const result = saveReport(report);

        if (!result.saved) {
            setNotice(
                "Laporan tidak dapat disimpan: penyimpanan peramban penuh.",
            );

            return;
        }

        if (result.droppedPhoto) {
            setNotice(
                "Laporan terkirim, tetapi foto terlalu besar untuk disimpan.",
            );
        }

        navigate(`/report/${encodeURIComponent(report.id)}`);
    }

    const dateLabel =
        form.type === "lost" ? "Tanggal hilang" : "Tanggal ditemukan";

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

                {notice ? (
                    <p className={styles.notice} role="status">
                        {notice}
                    </p>
                ) : null}

                <form ref={formRef} onSubmit={handleSubmit} noValidate>
                    <fieldset className={styles.typeToggle}>
                        <legend>Ada apa?</legend>

                        {REPORT_TYPES.map((type) => (
                            <label
                                key={type.value}
                                className={`${styles.typeOption} ${
                                    type.value === "lost"
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
                                        {type.value === "lost"
                                            ? "Saya kehilangan barang"
                                            : "Saya menemukan barang"}
                                    </strong>
                                    <small>
                                        {type.value === "lost"
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
                            maxLength={80}
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
                            name="category"
                            required
                            error={errors.category}
                        >
                            <select
                                id="category"
                                name="category"
                                value={form.category}
                                onChange={(event) =>
                                    update("category", event.target.value)
                                }
                            >
                                <option value="">Pilih kategori</option>
                                {CATEGORIES.map((category) => (
                                    <option
                                        key={category.value}
                                        value={category.value}
                                    >
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field
                            label="Lokasi"
                            name="location"
                            required
                            error={errors.location}
                        >
                            <select
                                id="location"
                                name="location"
                                value={form.location}
                                onChange={(event) =>
                                    update("location", event.target.value)
                                }
                            >
                                <option value="">Pilih lokasi</option>
                                {LOCATIONS.map((location) => (
                                    <option
                                        key={location.value}
                                        value={location.value}
                                    >
                                        {location.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <Field
                        label="Ruangan atau titik spesifik"
                        name="room"
                        optionalLabel="opsional"
                        error={errors.room}
                    >
                        <input
                            id="room"
                            name="room"
                            type="text"
                            maxLength={60}
                            value={form.room}
                            placeholder="mis. Ruang 2.3, koridor lantai 2, dekat tangga"
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

                    <Field
                        label="Foto"
                        name="photo"
                        optionalLabel="opsional"
                        error={photoError}
                    >
                        <input
                            id="photo"
                            name="photo"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                        />

                        {photo ? (
                            <div className={styles.photoPreview}>
                                <img
                                    src={photo}
                                    alt="Pratinjau foto terpilih"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={removePhoto}
                                >
                                    Hapus foto
                                </Button>
                            </div>
                        ) : null}
                    </Field>

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

                    <Field
                        label="Nama tampilan"
                        name="name"
                        optionalLabel="opsional, ditampilkan publik"
                    >
                        <input
                            id="name"
                            name="name"
                            type="text"
                            maxLength={50}
                            value={form.name}
                            placeholder="mis. Rina (CS 2023)"
                            onChange={(event) =>
                                update("name", event.target.value)
                            }
                        />
                    </Field>

                    <div className={styles.actions}>
                        <Button as={Link} to="/" variant="ghost">
                            Batal
                        </Button>
                        <Button type="submit" variant="red">
                            Kirim laporan
                        </Button>
                    </div>
                </form>
            </div>
        </Container>
    );
}
