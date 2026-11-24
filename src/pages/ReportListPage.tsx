import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Container } from "../components/Container";
import { ReportCard } from "../components/ReportCard";
import { CATEGORIES, LOCATIONS, REPORT_TYPES } from "../lib/options";
import type { StoredReport } from "../lib/reports-store";
import { listReports } from "../lib/reports-store";
import styles from "./ReportListPage.module.css";

interface Filters {
    q: string;
    type: string;
    category: string;
    location: string;
}

export function ReportListPage() {
    const [reports, setReports] = useState<StoredReport[]>([]);
    const [filters, setFilters] = useState<Filters>({
        q: "",
        type: "",
        category: "",
        location: "",
    });

    useEffect(() => {
        setReports(listReports());
    }, []);

    const visibleReports = useMemo(() => {
        const query = filters.q.trim().toLowerCase();

        return reports.filter((report) => {
            if (query && !report.title.toLowerCase().includes(query)) {
                return false;
            }

            if (filters.type && report.type !== filters.type) {
                return false;
            }

            if (filters.category && report.category !== filters.category) {
                return false;
            }

            if (filters.location && report.location !== filters.location) {
                return false;
            }

            return true;
        });
    }, [reports, filters]);

    const lostCount = reports.filter((report) => report.type === "lost").length;
    const foundCount = reports.length - lostCount;

    function updateFilter(name: keyof Filters, value: string) {
        setFilters((current) => ({ ...current, [name]: value }));
    }

    function resetFilters() {
        setFilters({ q: "", type: "", category: "", location: "" });
    }

    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <>
            <section className={styles.hero}>
                <Container>
                    <div className={styles.heroInner}>
                        <div>
                            <h1>Lost and Found</h1>
                            <p className={styles.heroSub}>
                                Telusuri laporan publik dari lingkungan
                                Fasilkom, atau buat laporanmu sendiri agar
                                barang kembali ke pemiliknya.
                            </p>
                            <div className={styles.heroActions}>
                                <Button
                                    as={Link}
                                    to="/new?type=lost"
                                    variant="red"
                                >
                                    Saya kehilangan barang
                                </Button>
                                <Button
                                    as={Link}
                                    to="/new?type=found"
                                    variant="light"
                                >
                                    Saya menemukan barang
                                </Button>
                            </div>
                        </div>

                        <ul className={styles.stats}>
                            <li className={styles.stat}>
                                <span className={styles.statNum}>
                                    {lostCount}
                                </span>
                                <span className={styles.statLabel}>Hilang</span>
                            </li>
                            <li className={styles.stat}>
                                <span className={styles.statNum}>
                                    {foundCount}
                                </span>
                                <span className={styles.statLabel}>
                                    Ditemukan
                                </span>
                            </li>
                        </ul>
                    </div>
                </Container>
            </section>

            <Container>
                <form
                    className={styles.filters}
                    autoComplete="off"
                    onSubmit={(event) => event.preventDefault()}
                >
                    <div className={`${styles.field} ${styles.search}`}>
                        <label htmlFor="filter-search">Cari nama barang</label>
                        <input
                            id="filter-search"
                            type="search"
                            value={filters.q}
                            placeholder="mis. dompet hitam, charger laptop…"
                            onChange={(event) =>
                                updateFilter("q", event.target.value)
                            }
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="filter-type">Jenis laporan</label>
                        <select
                            id="filter-type"
                            value={filters.type}
                            onChange={(event) =>
                                updateFilter("type", event.target.value)
                            }
                        >
                            <option value="">Semua jenis</option>
                            {REPORT_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="filter-category">Kategori</label>
                        <select
                            id="filter-category"
                            value={filters.category}
                            onChange={(event) =>
                                updateFilter("category", event.target.value)
                            }
                        >
                            <option value="">Semua kategori</option>
                            {CATEGORIES.map((category) => (
                                <option
                                    key={category.value}
                                    value={category.value}
                                >
                                    {category.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="filter-location">Lokasi</label>
                        <select
                            id="filter-location"
                            value={filters.location}
                            onChange={(event) =>
                                updateFilter("location", event.target.value)
                            }
                        >
                            <option value="">Semua lokasi</option>
                            {LOCATIONS.map((location) => (
                                <option
                                    key={location.value}
                                    value={location.value}
                                >
                                    {location.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className={styles.reset}
                        onClick={resetFilters}
                        disabled={!hasFilters}
                    >
                        Atur ulang
                    </Button>
                </form>

                <div className={styles.resultsBar}>
                    <p className={styles.resultCount} aria-live="polite">
                        {visibleReports.length === reports.length
                            ? `Menampilkan semua ${reports.length} laporan`
                            : `Menampilkan ${visibleReports.length} dari ${reports.length} laporan`}
                    </p>
                </div>

                {visibleReports.length > 0 ? (
                    <ul className={styles.grid}>
                        {visibleReports.map((report) => (
                            <li key={report.id} className={styles.gridItem}>
                                <ReportCard report={report} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className={styles.empty}>
                        <h2>Tidak ada laporan yang cocok</h2>
                        <p>
                            Coba kata kunci lain atau hapus filter. Jika barang
                            belum terdaftar, kamu bisa membuat laporan.
                        </p>
                        <Button as={Link} to="/new" variant="blue">
                            Laporkan barang
                        </Button>
                    </div>
                )}
            </Container>
        </>
    );
}
