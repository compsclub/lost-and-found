import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import styles from "./Button.module.css";

const VARIANTS = {
    red: styles.red,
    blue: styles.blue,
    light: styles.light,
    ghost: styles.ghost,
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

interface ButtonProps {
    as?: ElementType;
    variant?: ButtonVariant;
    size?: "sm";
    className?: string;
    children?: ReactNode;
    [key: string]: unknown;
}

export function Button({
    as: Component = "button",
    variant = "blue",
    size,
    className = "",
    ...rest
}: ButtonProps) {
    const classes = [
        styles.btn,
        VARIANTS[variant] ?? styles.blue,
        size === "sm" ? styles.sm : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    if (Component !== "button") {
        return <Component className={classes} {...rest} />;
    }

    return (
        <button
            type="button"
            className={classes}
            {...(rest as ComponentPropsWithoutRef<"button">)}
        />
    );
}
