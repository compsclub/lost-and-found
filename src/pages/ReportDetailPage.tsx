import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Container } from "../components/Container";
import type { ReportDetail } from "../lib/api";
import { ApiError, fetchReport } from "../lib/api";
import { contactHref } from "../lib/contact";
import { formatDate, formatTimestamp } from "../lib/dates";
import { contactOf, reportTypeLabel } from "../lib/options";
import styles from "./ReportDetailPage.module.css";

export function ReportDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [report, setReport] = useState<ReportDetail | null>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "error">(
        "loading",
    );
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!id) {
            setStatus("error");
            setMessage("Tautan laporan tidak valid.");

            return;
        }

        const controller = new AbortController();

        setStatus("loading");

        fetchReport(id, controller.signal)
            .then((result) => {
                setReport(result);
                setStatus("ready");
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }

                setStatus("error");
                setMessage(
                    error instanceof ApiError && error.status === 404
                        ? "Laporan ini tidak ditemukan atau sudah dihapus."
                        : "Gagal memuat laporan. Coba lagi nanti.",
                );
            });

        return () => controller.abort();
    }, [id]);

    useEffect(() => {
        document.title = report
            ? `${report.itemName} · Fasilkom UI Lost & Found`
            : "Laporan tidak ditemukan · Fasilkom UI Lost & Found";
    }, [report]);

    if (status === "loading") {
        return (
            <Container narrow>
                <Link to="/" className={styles.backLink}>
                    ← Kembali ke semua laporan
                </Link>
                <p className={styles.loading}>Memuat laporan…</p>
            </Container>
        );
    }

    if (status === "error" || !report) {
        return (
            <Container narrow>
                <Link to="/" className={styles.backLink}>
                    ← Kembali ke semua laporan
                </Link>

                <div className={styles.empty}>
                    <h2>Laporan tidak ditemukan</h2>
                    <p>{message}</p>
                    <Button as={Link} to="/" variant="blue">
                        Lihat semua laporan
                    </Button>
                </div>
            </Container>
        );
    }

    const contact = contactOf(report.publicContact?.method);
    const action = report.publicContact
        ? contactHref(report.publicContact.method, report.publicContact.value)
        : "";

    const info: Array<{ label: string; value: string }> = [
        { label: "Kategori", value: report.category.name },
        { label: "Lokasi", value: report.location.name },
    ];

    if (report.locationDetail) {
        info.push({
            label: "Ruangan / titik",
            value: report.locationDetail,
        });
    }

    info.push({
        label: "Dilaporkan",
        value: formatTimestamp(report.createdAt),
    });

    if (report.occurredAt) {
        info.push({
            label:
                report.reportType === "LOST"
                    ? "Tanggal hilang"
                    : "Tanggal ditemukan",
            value: formatDate(report.occurredAt),
        });
    }

    return (
        <Container narrow>
            <Link to="/" className={styles.backLink}>
                ← Kembali ke semua laporan
            </Link>

            <article className={styles.card}>
                {report.imageUrl ? (
                    <div className={styles.media}>
                        <img
                            src={report.imageUrl}
                            alt={`Foto ${report.itemName}`}
                        />
                    </div>
                ) : null}

                <div className={styles.body}>
                    <div className={styles.head}>
                        <Badge type={report.reportType} />
                        <h1>{report.itemName}</h1>
                    </div>

                    <p className={styles.typeNote}>
                        {reportTypeLabel(report.reportType)}
                    </p>

                    <dl className={styles.infoGrid}>
                        {info.map((item) => (
                            <div key={item.label} className={styles.info}>
                                <dt>{item.label}</dt>
                                <dd>{item.value}</dd>
                            </div>
                        ))}
                    </dl>

                    <h2 className={styles.sectionTitle}>Deskripsi</h2>
                    <p className={styles.description}>{report.description}</p>

                    {report.categoryOther ? (
                        <p className={styles.categoryOther}>
                            Kategori lain: {report.categoryOther}
                        </p>
                    ) : null}

                    <div className={styles.contactPanel}>
                        <div>
                            <div className={styles.contactLabel}>
                                Kontak via {contact.label}
                            </div>
                            <div className={styles.contactValue}>
                                {report.publicContact?.value ??
                                    "Tidak tersedia"}
                            </div>
                            <p className={styles.note}>
                                {report.reportType === "LOST"
                                    ? "Menemukan barang ini? Silakan hubungi pelapor."
                                    : "Apakah ini barangmu? Jelaskan detail yang hanya diketahui pemiliknya."}
                            </p>
                        </div>

                        {action ? (
                            <Button
                                as="a"
                                href={action}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="red"
                            >
                                Buka {contact.label}
                            </Button>
                        ) : null}
                    </div>
                </div>
            </article>
        </Container>
    );
}
