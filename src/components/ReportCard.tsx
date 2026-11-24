import { Link } from "react-router-dom";
import type { ReportSummary } from "../lib/api";
import { formatDate } from "../lib/dates";
import { Badge } from "./Badge";
import styles from "./ReportCard.module.css";

interface ReportCardProps {
    report: ReportSummary;
}

export function ReportCard({ report }: ReportCardProps) {
    const hasPhoto = Boolean(report.imageUrl);

    return (
        <Link
            to={`/report/${encodeURIComponent(report.id)}`}
            className={`${styles.card}${hasPhoto ? "" : ` ${styles.noPhoto}`}${
                report.reportType === "LOST" ? ` ${styles.lost}` : ""
            }`}
        >
            {hasPhoto ? (
                <div className={styles.media}>
                    <img
                        src={report.imageUrl ?? ""}
                        alt={`Foto ${report.itemName}`}
                        loading="lazy"
                    />
                    <Badge type={report.reportType} className={styles.badge} />
                </div>
            ) : null}

            <div className={styles.body}>
                {hasPhoto ? null : (
                    <div className={styles.badgeRow}>
                        <Badge type={report.reportType} />
                    </div>
                )}

                <h3 className={styles.title}>{report.itemName}</h3>

                <div className={styles.meta}>
                    <span>
                        {report.location.name}
                        {report.locationDetail
                            ? ` · ${report.locationDetail}`
                            : ""}
                    </span>
                    <span>{formatDate(report.createdAt)}</span>
                </div>

                <span className={styles.chip}>{report.category.name}</span>
            </div>
        </Link>
    );
}
