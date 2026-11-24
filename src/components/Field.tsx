import type { ReactNode } from "react";
import styles from "./Field.module.css";

interface FieldProps {
    label: string;
    name: string;
    required?: boolean;
    optionalLabel?: string;
    hint?: string;
    error?: string;
    children: ReactNode;
}

export function Field({
    label,
    name,
    required = false,
    optionalLabel,
    hint,
    error,
    children,
}: FieldProps) {
    const invalid = Boolean(error);

    return (
        <div
            className={`${styles.field}${invalid ? ` ${styles.invalid}` : ""}`}
        >
            <label htmlFor={name}>
                {label}
                {required ? <span className={styles.req}> *</span> : null}
                {optionalLabel ? (
                    <span className={styles.optional}> ({optionalLabel})</span>
                ) : null}
            </label>

            {children}

            {hint ? <p className={styles.hint}>{hint}</p> : null}
            {error ? <p className={styles.error}>{error}</p> : null}
        </div>
    );
}

interface FieldErrorsProps {
    errors?: Record<string, string | undefined>;
}

export function FieldErrors({ errors }: FieldErrorsProps) {
    const entries = Object.entries(errors ?? {}).filter(
        ([, message]) => message,
    );

    if (entries.length === 0) {
        return null;
    }

    return (
        <ul className={styles.summary}>
            {entries.map(([field, message]) => (
                <li key={field}>{message}</li>
            ))}
        </ul>
    );
}
