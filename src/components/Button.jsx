import styles from "./Button.module.css";

const VARIANTS = {
    red: styles.red,
    blue: styles.blue,
    light: styles.light,
    ghost: styles.ghost,
};

export function Button({
    as: Component = "button",
    variant = "blue",
    size,
    className = "",
    ...rest
}) {
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

    return <button type="button" className={classes} {...rest} />;
}
