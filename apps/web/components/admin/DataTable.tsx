"use client";

import type { ReactNode } from "react";
import { cx } from "@/components/ui/primitives";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  /** Aligne à droite — montants, dates, actions. */
  align?: "right";
  className?: string;
}

/**
 * Tableau du back-office. Le défilement horizontal est confiné au conteneur
 * (`overflow-x-auto`) : la page elle-même ne défile jamais latéralement, même
 * avec dix colonnes sur un écran de portable.
 */
export function DataTable<T>({
  rows,
  columns,
  keyOf,
  empty = "Aucune donnée à afficher.",
  minWidth = 800,
}: {
  rows: T[];
  columns: Column<T>[];
  keyOf: (row: T) => string;
  empty?: string;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto scroll-slim rounded-md border border-light-border dark:border-dark-border">
      <table className="w-full border-collapse text-body" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-light-border bg-light-surface-alt text-left text-caption uppercase tracking-wider text-light-muted dark:border-dark-border dark:bg-dark-surface-alt dark:text-dark-muted">
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={cx("px-4 py-3 font-medium", column.align === "right" && "text-right")}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-light-muted dark:text-dark-muted"
              >
                {empty}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr
              key={keyOf(row)}
              className="border-b border-light-border last:border-0 hover:bg-light-surface-alt dark:border-dark-border dark:hover:bg-dark-surface-alt"
            >
              {columns.map((column, index) => (
                <td
                  key={index}
                  className={cx(
                    "px-4 py-3 align-top",
                    column.align === "right" && "text-right",
                    column.className,
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Groupe de boutons d'action en fin de ligne. */
export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1">{children}</div>;
}

export function IconButton({
  title,
  onClick,
  children,
  tone = "default",
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cx(
        "rounded-full p-2 transition",
        tone === "danger"
          ? "text-light-muted hover:bg-danger/10 hover:text-danger dark:text-dark-muted"
          : "text-primary hover:bg-primary/10",
      )}
    >
      {children}
    </button>
  );
}
