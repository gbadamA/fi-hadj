import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

/** Largeur de lecture commune à toutes les sections — l'unité du gabarit. */
export function Container({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
}) {
  const width = {
    narrow: "max-w-3xl",
    default: "max-w-6xl",
    wide: "max-w-7xl",
  }[size];
  return <div className={cx("mx-auto w-full px-5 sm:px-8", width, className)}>{children}</div>;
}

/**
 * Surtitre doré. L'or de la DA n'apparaît qu'en petites touches : ici, les
 * filets, les puces de liste et les bordures de distinction. Jamais en aplat.
 */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cx(
        "flex items-center gap-3 text-caption font-semibold uppercase tracking-[0.18em] text-secondary",
        className,
      )}
    >
      <span className="h-px w-8 bg-secondary" aria-hidden />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  id,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  align?: "left" | "center";
  id?: string;
}) {
  return (
    <header className={cx("mb-10", align === "center" && "text-center")}>
      {eyebrow && (
        <Eyebrow className={align === "center" ? "justify-center" : undefined}>{eyebrow}</Eyebrow>
      )}
      <h2
        id={id}
        className="mt-4 font-display text-[clamp(1.6rem,3.4vw,2.4rem)] font-bold leading-tight"
      >
        {title}
      </h2>
      {intro && (
        <div
          className={cx(
            "mt-4 max-w-3xl text-body text-light-muted dark:text-dark-muted",
            align === "center" && "mx-auto",
          )}
        >
          {intro}
        </div>
      )}
    </header>
  );
}

/** Espacement vertical uniforme entre sections, avec ancre pour la navigation. */
export function Section({
  id,
  children,
  className,
  tone = "default",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "default" | "alt";
}) {
  return (
    <section
      id={id}
      className={cx(
        "scroll-mt-24 py-16 sm:py-20",
        tone === "alt" && "bg-light-surface-alt dark:bg-dark-surface-alt",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Card({
  children,
  className,
  as: Tag = "article",
}: {
  children: ReactNode;
  className?: string;
  as?: "article" | "div" | "li";
}) {
  return (
    <Tag
      className={cx(
        "lift rounded-md border border-light-border bg-light-surface p-6 shadow-card dark:border-dark-border dark:bg-dark-surface",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  // Le dégradé signature porte l'action principale.
  primary: "bg-diplomatic text-white shadow-card hover:opacity-95",
  // L'or ne porte que du texte sombre — contraste insuffisant avec du blanc.
  secondary: "bg-secondary text-light-text hover:bg-secondary-hover",
  ghost:
    "border border-light-border text-light-text hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text",
  danger: "bg-danger text-white hover:opacity-90",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-caption",
  md: "px-5 py-2.5 text-body",
  lg: "px-7 py-3.5 text-body",
};

function buttonClass(variant: ButtonVariant, size: ButtonSize, className?: string): string {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Badge({
  children,
  color,
  className,
}: {
  children: ReactNode;
  /** Couleur libre (hex du token de sous-thème ou de type d'inscription). */
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-medium",
        !color && "bg-primary/10 text-primary",
        className,
      )}
      style={color ? { backgroundColor: `${color}1A`, color } : undefined}
    >
      {children}
    </span>
  );
}

/** État vide explicite — mieux qu'un tableau blanc sans explication. */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-md border border-dashed border-light-border p-10 text-center dark:border-dark-border">
      <p className="font-display text-h3">{title}</p>
      {hint && <p className="mt-2 text-body text-light-muted dark:text-dark-muted">{hint}</p>}
    </div>
  );
}
