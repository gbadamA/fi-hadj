"use client";

import { useState, type ReactNode } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { cx } from "@/components/ui/primitives";

/** En-tête de page du back-office : titre, sous-titre, actions à droite. */
export function AdminHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-light-border pb-6 dark:border-dark-border">
      <div>
        <h1 className="font-display text-h1">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-body text-light-muted dark:text-dark-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function AdminPage({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">{children}</div>;
}

/** Tuile d'indicateur du tableau de bord. */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "gold" | "success" | "danger";
}) {
  const accent = {
    default: "text-primary",
    gold: "text-secondary",
    success: "text-success",
    danger: "text-danger",
  }[tone];
  return (
    <div className="lift rounded-md border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
      <p className="text-caption uppercase tracking-wider text-light-muted dark:text-dark-muted">
        {label}
      </p>
      <p className={cx("mt-2 font-display text-3xl font-bold tabular-nums", accent)}>{value}</p>
      {hint && <p className="mt-1 text-caption text-light-muted dark:text-dark-muted">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-md border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface",
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-light-border px-5 py-4 dark:border-dark-border">
          {title && <h2 className="font-display text-h3">{title}</h2>}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Spinner({ label = "Chargement…" }: { label?: string }) {
  return (
    <p className="flex items-center justify-center gap-2 py-12 text-body text-light-muted dark:text-dark-muted">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {label}
    </p>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-body text-danger"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

/**
 * Boîte de dialogue modale.
 *
 * Fermeture par la touche Échap et par le fond : sans l'une des deux, un
 * formulaire ouvert par erreur devient une impasse.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  width = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: "md" | "lg";
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#04101C]/60 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onKeyDown={(event) => event.key === "Escape" && onClose()}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className={cx(
          "w-full rounded-md border border-light-border bg-light-surface shadow-card dark:border-dark-border dark:bg-dark-surface",
          width === "lg" ? "max-w-3xl" : "max-w-xl",
        )}
      >
        <header className="flex items-center justify-between border-b border-light-border px-5 py-4 dark:border-dark-border">
          <h2 className="font-display text-h3">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1.5 text-light-muted transition hover:text-danger dark:text-dark-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto scroll-slim p-5">{children}</div>
      </div>
    </div>
  );
}

/** Confirmation avant une suppression — rien d'irréversible sans un second clic. */
export function useConfirm() {
  const [pending, setPending] = useState<{ message: string; action: () => void } | null>(null);

  const confirm = (message: string, action: () => void) => setPending({ message, action });

  const dialog = (
    <Modal open={Boolean(pending)} onClose={() => setPending(null)} title="Confirmer l'action">
      <p className="text-body">{pending?.message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setPending(null)}
          className="rounded-full border border-light-border px-4 py-2 text-caption dark:border-dark-border"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => {
            pending?.action();
            setPending(null);
          }}
          className="rounded-full bg-danger px-4 py-2 text-caption text-white"
        >
          Confirmer
        </button>
      </div>
    </Modal>
  );

  return { confirm, dialog };
}
