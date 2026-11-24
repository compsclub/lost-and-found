import type { ReactNode } from "react";
import styles from "./Layout.module.css";

interface ContainerProps {
    children: ReactNode;
    narrow?: boolean;
}

export function Container({ children, narrow = false }: ContainerProps) {
    return (
        <div
            className={`${styles.container}${narrow ? ` ${styles.narrow}` : ""}`}
        >
            {children}
        </div>
    );
}
