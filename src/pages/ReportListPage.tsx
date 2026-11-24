import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Container } from "../components/Container";
import { ReportCard } from "../components/ReportCard";
import type {
    CategoryView,
    LocationView,
    Pagination,
    ReportSummary,
    ReportType,
} from "../lib/api";
import {
    ApiError,
    fetchCategories,
    fetchLocations,
    fetchReports,
} from "../lib/api";
import type { SelectOption } from "../lib/options";
import {
    REPORT_TYPES,
    toCategoryOptions,
    toLocationOptions,
} from "../lib/options";
import styles from "./ReportListPage.module.css";

interface Filters {
    q: string;
    type: ReportType | "";
    category: string;
    location: string;
}

const initialFilters: Filters = {
    q: "",
    type: "",
    category: "",
    location: "",
};

const PAGE_SIZE = 12;

export function ReportListPage() {
    const [reports, setReports] = useState<ReportSummary[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState<"loading" | "ready" | "error">(
        "loading",
    );
    const [errorMessage, setErrorMessage] = useState("");
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [categories, setCategories] = useState<CategoryView[]>([]);
    const [locations, setLocations] = useState<LocationView[]>([]);

    // Reference data drives the filter options, so it always matches the API.
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
                // The listing still works without filter options.
            });

        return () => controller.abort();
    }, []);

    // Debounce typing so each keystroke does not hit the API.
    const [query, setQuery] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters((current) =>
                current.q === query ? current : { ...current, q: query },
            );
            setPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const controller = new AbortController();

        setStatus("loading");

        fetchReports(
            {
                q: filters.q,
                type: filters.type,
                category: filters.category,
                location: filters.location,
                page,
                limit: PAGE_SIZE,
            },
            controller.signal,
        )
            .then((result) => {
                setReports(result.data);
                setPagination(result.pagination);
                setStatus("ready");
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }

                setErrorMessage(
                    error instanceof ApiError
                        ? error.message
                        : "Gagal memuat laporan.",
                );
                setStatus("error");
            });

        return () => controller.abort();
    }, [filters, page]);

    const categoryOptions = useMemo(
        () => toCategoryOptions(categories),
        [categories],
    );
    const locationOptions = useMemo(
        () => toLocationOptions(locations),
        [locations],
    );

    const updateFilter = useCallback(
        (name: Exclude<keyof Filters, "q">, value: string) => {
            setFilters((current) => ({ ...current, [name]: value }));
            setPage(1);
        },
        [],
    );

    const resetFilters = useCallback(() => {
        setFilters(initialFilters);
        setQuery("");
        setPage(1);
    }, []);

    const hasFilters = Object.values(filters).some(Boolean);
    const totalItems = pagination?.totalItems ?? 0;
    const shownCount = reports.length;

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
                                    to="/new?type=LOST"
                                    variant="red"
                                >
                                    Saya kehilangan barang
                                </Button>
                                <Button
                                    as={Link}
                                    to="/new?type=FOUND"
                                    variant="light"
                                >
                                    Saya menemukan barang
                                </Button>
                            </div>
                        </div>

                        <ul className={styles.stats}>
                            <li className={styles.stat}>
                                <span className={styles.statNum}>
                                    {totalItems}
                                </span>
                                <span className={styles.statLabel}>
                                    Total laporan
                                </span>
                            </li>
                            <li className={styles.stat}>
                                <span className={styles.statNum}>
                                    {shownCount}
                                </span>
                                <span className={styles.statLabel}>
                                    Di halaman ini
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
                            value={query}
                            placeholder="mis. dompet hitam, charger laptop…"
                            onChange={(event) => setQuery(event.target.value)}
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
                            {categoryOptions.map((option: SelectOption) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
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
                            {locationOptions.map((option: SelectOption) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
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
                        {status === "loading"
                            ? "Memuat laporan…"
                            : `Menampilkan ${shownCount} dari ${totalItems} laporan`}
                    </p>
                </div>

                {status === "error" ? (
                    <div className={styles.empty}>
                        <h2>Gagal memuat laporan</h2>
                        <p>{errorMessage}</p>
                        <Button variant="blue" onClick={() => setPage(1)}>
                            Coba lagi
                        </Button>
                    </div>
                ) : null}

                {status !== "error" && reports.length > 0 ? (
                    <ul className={styles.grid}>
                        {reports.map((report) => (
                            <li key={report.id} className={styles.gridItem}>
                                <ReportCard report={report} />
                            </li>
                        ))}
                    </ul>
                ) : null}

                {status === "ready" && reports.length === 0 ? (
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
                ) : null}

                {pagination && pagination.totalPages > 1 ? (
                    <nav className={styles.paginationBar} aria-label="Paginasi">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={!pagination.hasPreviousPage}
                            onClick={() => setPage((current) => current - 1)}
                        >
                            Sebelumnya
                        </Button>
                        <span>
                            Halaman {pagination.page} dari{" "}
                            {pagination.totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={!pagination.hasNextPage}
                            onClick={() => setPage((current) => current + 1)}
                        >
                            Berikutnya
                        </Button>
                    </nav>
                ) : null}
            </Container>
        </>
    );
}
