import type { Metadata } from "next";
import { Amiri, Inter, Playfair_Display } from "next/font/google";
import { ThemeProvider, THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Sérif institutionnel pour les titres — le registre attendu d'un forum
// diplomatique ; sans-serif neutre pour le texte courant ; Amiri pour l'arabe.
const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const arabic = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-arabic",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3050";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FI-HADJ — Forum International du Hadj",
    template: "%s · FI-HADJ",
  },
  description:
    "Forum International du Hadj — Abidjan. Étiquette et protocole au service de la réussite " +
    "du pèlerinage en Islam. Organisé par SESAP et la CDIDES.",
  openGraph: {
    type: "website",
    locale: "fr_CI",
    siteName: "FI-HADJ",
    title: "FI-HADJ — Forum International du Hadj",
    description:
      "Étiquette et protocole : solutions durables pour la réussite du pèlerinage en Islam. " +
      "Palais de la Culture de Treichville, Abidjan.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Pose la classe `dark` avant la première peinture — évite le flash clair. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body
        className={`${display.variable} ${body.variable} ${arabic.variable} bg-light-bg text-light-text antialiased dark:bg-dark-bg dark:text-dark-text`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
