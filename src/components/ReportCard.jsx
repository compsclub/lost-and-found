import { Link } from "react-router-dom";
import { formatDate } from "../lib/dates.js";
import { categoryOf } from "../lib/options.js";
import { Badge } from "./Badge.jsx";
import styles from "./ReportCard.module.css";

export function ReportCard({ report }) {
    const category = categoryOf(report.category);
    const hasPhoto = Boolean(report.photo);

    return (
        <Link
            to={`/report/${encodeURIComponent(report.id)}`}
            className={`${styles.card}${hasPhoto ? "" : ` ${styles.noPhoto}`}${
                report.type === "lost" ? ` ${styles.lost}` : ""
            }`}
        >
            {hasPhoto ? (
                <div className={styles.media}>
                    <img
                        src={report.photo}
                        alt={`Foto ${report.title}`}
                        loading="lazy"
                    />
                    <Badge type={report.type} className={styles.badge} />
                </div>
            ) : null}

            <div className={styles.body}>
                {hasPhoto ? null : (
                    <div className={styles.badgeRow}>
                        <Badge type={report.type} />
                    </div>
                )}

                <h3 className={styles.title}>{report.title}</h3>

                {report.description ? (
                    <p className={styles.description}>{report.description}</p>
                ) : null}

                <div className={styles.meta}>
                    <span>
                        {report.location}
                        {report.room ? ` · ${report.room}` : ""}
                    </span>
                    <span>{formatDate(report.date)}</span>
                </div>

                <span className={styles.chip}>{category.label}</span>
            </div>
        </Link>
    );
}
