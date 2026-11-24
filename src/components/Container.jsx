import styles from "./Layout.module.css";

export function Container({ children, narrow = false }) {
    return (
        <div
            className={`${styles.container}${narrow ? ` ${styles.narrow}` : ""}`}
        >
            {children}
        </div>
    );
}
