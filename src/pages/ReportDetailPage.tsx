import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Container } from "../components/Container";
import { contactHref } from "../lib/contact";
import { formatDate } from "../lib/dates";
import { categoryOf, contactOf } from "../lib/options";
import type { StoredReport } from "../lib/reports-store";
import { findReport } from "../lib/reports-store";
import styles from "./ReportDetailPage.module.css";

export function ReportDetailPage() {
    const { id } = useParams();
    const [report, setReport] = useState<StoredReport | null | undefined>(
        undefined,
    );

    useEffect(() => {
        setReport(id ? findReport(id) : null);
    }, [id]);

    useEffect(() => {
        document.title = report
            ? `${report.title} · Fasilkom UI Lost & Found`
            : "Laporan tidak ditemukan · Fasilkom UI Lost & Found";
    }, [report]);

    if (report === undefined) {
        return null;
    }

    if (report === null) {
        return (
            <Container narrow>
                <Link to="/" className={styles.backLink}>
                    ← Kembali ke semua laporan
                </Link>

                <div className={styles.empty}>
                    <h2>Laporan tidak ditemukan</h2>
                    <p>
                        Laporan ini mungkin sudah dihapus atau tautannya salah.
                    </p>
                    <Button as={Link} to="/" variant="blue">
                        Lihat semua laporan
                    </Button>
                </div>
            </Container>
        );
    }

    const category = categoryOf(report.category);
    const contact = contactOf(report.contactMethod);
    const action = contactHref(report.contactMethod, report.contactValue);
    const info: Array<{ label: string; value: string }> = [
        { label: "Kategori", value: category.label },
        { label: "Lokasi", value: report.location },
    ];

    if (report.room) {
        info.push({ label: "Ruangan / titik", value: report.room });
    }

    info.push({
        label: report.type === "lost" ? "Tanggal hilang" : "Tanggal ditemukan",
        value: formatDate(report.date),
    });

    if (report.name) {
        info.push({ label: "Dilaporkan oleh", value: report.name });
    }

    return (
        <Container narrow>
            <Link to="/" className={styles.backLink}>
                ← Kembali ke semua laporan
            </Link>

            <article className={styles.card}>
                {report.photo ? (
                    <div className={styles.media}>
                        <img src={report.photo} alt={`Foto ${report.title}`} />
                    </div>
                ) : null}

                <div className={styles.body}>
                    <div className={styles.head}>
                        <Badge type={report.type} />
                        <h1>{report.title}</h1>
                    </div>

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

                    <div className={styles.contactPanel}>
                        <div>
                            <div className={styles.contactLabel}>
                                Kontak via {contact.label}
                            </div>
                            <div className={styles.contactValue}>
                                {report.contactValue}
                            </div>
                            <p className={styles.note}>
                                {report.type === "lost"
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
