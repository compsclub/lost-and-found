import type { ReportType } from "../lib/options";
import styles from "./Badge.module.css";

interface BadgeProps {
    type: ReportType;
    className?: string;
}

export function Badge({ type, className = "" }: BadgeProps) {
    const isLost = type === "lost";
    const classes = [
        styles.badge,
        isLost ? styles.lost : styles.found,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return <span className={classes}>{isLost ? "Hilang" : "Ditemukan"}</span>;
}
