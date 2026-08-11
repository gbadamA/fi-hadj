"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, LogOut, Menu, ShieldAlert, X } from "lucide-react";
import { ROLE_LABELS } from "@fihadj/shared-types";
import { AuthProvider, useAuth } from "@/lib/auth";
import { EditionProvider } from "@/lib/edition";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { cx } from "@/components/ui/primitives";
import { Spinner } from "@/components/admin/shell";
import { NAV, navLabel } from "@/components/admin/nav";
import { EditionBanner, EditionSwitcher } from "@/components/admin/EditionSwitcher";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* L'édition est chargée à l'intérieur de l'authentification : elle n'a de
          sens qu'une fois la session ouverte. */}
      <EditionProvider>
        <AdminShell>{children}</AdminShell>
      </EditionProvider>
    </AuthProvider>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut, modules } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !user && !isLoginPage) router.replace("/admin/login");
  }, [loading, user, isLoginPage, router]);

  useEffect(() => setMenuOpen(false), [pathname]);

  // La page de connexion se rend seule, hors de la coquille.
  if (isLoginPage) return <>{children}</>;

  if (loading) return <Spinner label="Ouverture de la session…" />;
  if (!user) return <Spinner label="Redirection vers la connexion…" />;

  if (modules.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <ShieldAlert className="h-10 w-10 text-danger" aria-hidden />
        <h1 className="font-display text-h2">Aucun module ne vous est ouvert</h1>
        <p className="max-w-md text-body text-light-muted dark:text-dark-muted">
          Votre compte existe mais son rôle ne donne accès à aucun module. Contactez le Responsable
          Ressources Humaines ou le Commissaire Général.
        </p>
        <button onClick={signOut} className="mt-2 rounded-full border border-light-border px-5 py-2 text-body dark:border-dark-border">
          Se déconnecter
        </button>
      </div>
    );
  }

  const sidebar = (
    <>
      <div className="mb-8 flex items-center gap-3 px-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-diplomatic">
          <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
            <g fill="none" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="1.4">
              <path d="M20 6 L34 20 L20 34 L6 20 Z" />
              <path d="M20 12 L28 20 L20 28 L12 20 Z" />
            </g>
            <circle cx="20" cy="20" r="3" fill="#C9A227" />
          </svg>
        </span>
        <span className="leading-tight">
          <span className="block font-display text-lg font-bold">FI-HADJ</span>
          <span className="block text-[10px] uppercase tracking-widest text-light-muted dark:text-dark-muted">
            Back-office
          </span>
        </span>
      </div>

      <EditionSwitcher />

      <nav className="flex flex-1 flex-col gap-0.5" aria-label="Modules">
        {modules.map((module) => {
          const { href, Icon } = NAV[module];
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={module}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-body transition",
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-light-muted hover:bg-light-surface-alt dark:text-dark-muted dark:hover:bg-dark-surface-alt",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {navLabel(module)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-4 border-t border-light-border pt-4 dark:border-dark-border">
        <ThemeToggle />
        <div>
          <p className="px-1 text-body font-medium">{user.fullName}</p>
          <p className="px-1 text-caption leading-snug text-primary">{ROLE_LABELS[user.role]}</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-1 text-caption text-light-muted transition hover:text-primary dark:text-dark-muted"
        >
          <ExternalLink className="h-4 w-4" aria-hidden /> Voir le site public
        </Link>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 px-1 text-caption text-light-muted transition hover:text-danger dark:text-dark-muted"
        >
          <LogOut className="h-4 w-4" aria-hidden /> Se déconnecter
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto scroll-slim border-r border-light-border bg-light-surface p-4 lg:flex dark:border-dark-border dark:bg-dark-surface print:hidden">
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-light-border px-4 py-3 lg:hidden dark:border-dark-border print:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            className="rounded-full p-2"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-display text-lg font-bold">FI-HADJ</span>
        </div>

        {menuOpen && (
          <aside className="flex flex-col border-b border-light-border bg-light-surface p-4 lg:hidden dark:border-dark-border dark:bg-dark-surface">
            {sidebar}
          </aside>
        )}

        <EditionBanner />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
