import { useEffect, useState } from "react";
import styles from "./Toast.module.css";

interface ToastProps {
    message: string | null;
    duration?: number;
    onDismiss?: () => void;
}

export function Toast({ message, duration = 3200, onDismiss }: ToastProps) {
    const [visible, setVisible] = useState(Boolean(message));

    useEffect(() => {
        if (!message) {
            setVisible(false);

            return;
        }

        setVisible(true);

        const timer = setTimeout(() => {
            setVisible(false);
            onDismiss?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [message, duration, onDismiss]);

    if (!visible || !message) {
        return null;
    }

    return (
        <div className={styles.toast} role="status" aria-live="polite">
            {message}
        </div>
    );
}
