"use client";

import { forwardRef, useId, type ComponentProps, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cx } from "./primitives";

const CONTROL =
  "w-full rounded-md border border-light-border bg-light-surface px-3.5 py-2.5 text-body text-light-text transition " +
  "placeholder:text-light-muted focus:border-primary focus:outline-none " +
  "dark:border-dark-border dark:bg-dark-surface dark:text-dark-text dark:placeholder:text-dark-muted " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const INVALID = "border-danger focus:border-danger";

/**
 * Enveloppe de champ : libellé lié au contrôle, indication de champ obligatoire,
 * aide contextuelle et message d'erreur annoncé aux lecteurs d'écran
 * (`role="alert"`), conformément à l'exigence d'accessibilité du cahier §8.
 */
export function Field({
  label,
  error,
  hint,
  required,
  htmlFor,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-caption font-medium">
        {label}
        {required && (
          <span className="ml-1 text-danger" aria-label="obligatoire">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="text-caption text-light-muted dark:text-dark-muted">{hint}</p>
      )}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-caption text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input"> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cx(CONTROL, invalid && INVALID, className)}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<
  HTMLSelectElement,
  ComponentProps<"select"> & { invalid?: boolean }
>(function Select({ className, invalid, ...props }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx(CONTROL, invalid && INVALID, className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  ComponentProps<"textarea"> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx(CONTROL, "min-h-[120px] resize-y", invalid && INVALID, className)}
      {...props}
    />
  );
});

export const Checkbox = forwardRef<
  HTMLInputElement,
  ComponentProps<"input"> & { children: ReactNode; error?: string }
>(function Checkbox({ children, error, className, ...props }, ref) {
  const id = useId();
  return (
    <div className={cx("space-y-1.5", className)}>
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={props.id ?? id}
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border-light-border text-primary focus:ring-primary dark:border-dark-border"
          aria-invalid={Boolean(error) || undefined}
          {...props}
        />
        <label htmlFor={props.id ?? id} className="text-caption leading-relaxed">
          {children}
        </label>
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-caption text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
});

/** Bandeau de résultat après soumission — succès ou échec global du formulaire. */
export function FormAlert({
  tone,
  title,
  children,
}: {
  tone: "success" | "error" | "info";
  title: string;
  children?: ReactNode;
}) {
  const tones = {
    success: "border-success/40 bg-success/10 text-success",
    error: "border-danger/40 bg-danger/10 text-danger",
    info: "border-primary/30 bg-primary/10 text-primary",
  };
  return (
    <div role="status" className={cx("rounded-md border p-4", tones[tone])}>
      <p className="font-medium">{title}</p>
      {children && (
        <div className="mt-1 text-caption text-light-text dark:text-dark-text">{children}</div>
      )}
    </div>
  );
}
