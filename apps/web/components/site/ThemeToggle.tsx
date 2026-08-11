"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/lib/theme";

const OPTIONS: { key: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { key: "light", label: "Clair", Icon: Sun },
  { key: "dark", label: "Sombre", Icon: Moon },
  { key: "system", label: "Système", Icon: Monitor },
];

/**
 * Sélecteur de thème. Sans lui, la moitié sombre du design system resterait
 * inatteignable et donc jamais vérifiée.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();
  return (
    <div
      className={`flex gap-0.5 rounded-full bg-light-surface-alt p-1 dark:bg-dark-surface-alt ${className ?? ""}`}
      role="group"
      aria-label="Thème d'affichage"
    >
      {OPTIONS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => setMode(key)}
          title={label}
          aria-label={`Thème ${label.toLowerCase()}`}
          aria-pressed={mode === key}
          className={`rounded-full p-1.5 transition ${
            mode === key
              ? "bg-light-surface text-primary shadow-sm dark:bg-dark-surface"
              : "text-light-muted hover:text-primary dark:text-dark-muted"
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
