"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ButtonLink, cx } from "@/components/ui/primitives";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/forum", label: "Le forum" },
  { href: "/programme", label: "Programme" },
  { href: "/gala", label: "Dîner-gala" },
  { href: "/exposants", label: "Exposants" },
  { href: "/organigramme", label: "Organisation" },
  { href: "/actualites", label: "Actualités" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fermer le menu mobile à la navigation : sinon il reste ouvert par-dessus la
  // nouvelle page.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cx(
        "sticky top-0 z-50 border-b transition-colors print:hidden",
        scrolled
          ? "border-light-border bg-light-surface/90 backdrop-blur dark:border-dark-border dark:bg-dark-surface/90"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="FI-HADJ — accueil">
          <LogoMark />
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold tracking-wide">FI-HADJ</span>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-light-muted dark:text-dark-muted">
              Forum International du Hadj
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {NAV.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "rounded-full px-3 py-2 text-caption font-medium transition",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-light-muted hover:text-primary dark:text-dark-muted",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <ThemeToggle className="hidden sm:flex" />
          <ButtonLink href="/inscription" size="sm" className="hidden sm:inline-flex">
            S&apos;inscrire
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-full p-2 text-light-text lg:hidden dark:text-dark-text"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-light-border bg-light-surface px-5 pb-6 pt-2 lg:hidden dark:border-dark-border dark:bg-dark-surface"
          aria-label="Navigation mobile"
        >
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block rounded-md px-3 py-3 text-body font-medium hover:bg-light-surface-alt dark:hover:bg-dark-surface-alt"
            >
              {label}
            </Link>
          ))}
          <div className="mt-4 flex items-center gap-3">
            <ButtonLink href="/inscription" size="sm" className="flex-1">
              S&apos;inscrire
            </ButtonLink>
            <ThemeToggle />
          </div>
        </nav>
      )}
    </header>
  );
}

/**
 * Marque : un losange (motif géométrique islamique) inscrit dans le dégradé
 * signature. Dessiné en SVG plutôt qu'importé — pas de logo officiel fourni,
 * et un placeholder d'image serait pire qu'une marque assumée.
 */
function LogoMark() {
  return (
    <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-diplomatic">
      <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden focusable="false">
        <g fill="none" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="1.4">
          <path d="M20 6 L34 20 L20 34 L6 20 Z" />
          <path d="M20 12 L28 20 L20 28 L12 20 Z" />
        </g>
        <circle cx="20" cy="20" r="3" fill="#C9A227" />
      </svg>
    </span>
  );
}
