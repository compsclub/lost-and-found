import styles from "./Badge.module.css";

export function Badge({ type, className = "" }) {
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
