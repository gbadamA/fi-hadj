/**
 * Source de vérité visuelle de FI-HADJ. Aucune couleur ni rayon en dur ailleurs
 * dans le code : tout part d'ici, et `tailwind-preset.js` en est le miroir.
 *
 * DA « bleu diplomatique & or ».
 * Le bleu nuit porte l'institution (protocole, conventions de Vienne, chancellerie) ;
 * l'azur ouvre et allège ; l'or est un accent RARE — filets, sceaux, distinctions —
 * jamais une grande surface, jamais un fond de texte clair.
 */

/** Dégradé signature (135°) : bannières, en-têtes de page, boutons primaires. */
export const gradient = {
  /** Bleu nuit → azur → or. Le liseré doré ne doit occuper que la fin de course. */
  diplomatic: ["#0B2A4A", "#14507F", "#C9A227"] as const,
  /** Variante sobre (sans or) pour les grandes surfaces et les fonds de section. */
  deep: ["#08203A", "#14507F"] as const,
  angle: 135,
};

/**
 * Couleurs de marque (indépendantes du thème).
 * ⚠️ Contraste : `secondary` (or) ne porte QUE du texte sombre (`palette.light.text`).
 *    Le bleu `primary` ne porte QUE du texte blanc.
 */
export const brand = {
  primary: "#0F3D6B", // bleu diplomatique — actions
  primaryHover: "#0B2E52",
  secondary: "#C9A227", // or — distinctions, filets, badges
  secondaryHover: "#A9871C",
  tertiary: "#2E7CB8", // azur — liens, focus, illustrations
  success: "#12B76A",
  warning: "#F59E0B",
  danger: "#DC2626",
};

/** Neutres par thème — teintés très légèrement bleu pour l'unité chromatique. */
export const palette = {
  light: {
    bg: "#F5F8FC",
    surface: "#FFFFFF",
    surfaceAlt: "#EAF1F8",
    border: "#D8E3EF",
    text: "#0B1A2A",
    textMuted: "#5A6B7D",
  },
  dark: {
    bg: "#060F1A",
    surface: "#0E1B2A",
    surfaceAlt: "#152435",
    border: "#23374C",
    text: "#E8EFF7",
    textMuted: "#90A3B8",
  },
} as const;

/**
 * Couleur dédiée à chacun des 4 sous-thèmes / panels du forum.
 * Sert les pastilles de programme, les onglets de panel et les cartes de thème.
 */
export const panelColors = {
  organisation: "#0F3D6B", // 1. organisation du pèlerinage (étatique / privée)
  interculturalite: "#2E7CB8", // 2. interculturalité et procédures
  fluxSanitaire: "#0E9F6E", // 3. gestion des flux et protocole sanitaire
  diplomatieEconomique: "#C9A227", // 4. diplomatie économique et opportunités d'affaires
} as const;

/** Couleur par type d'inscription — reprise dans les badges et les tableaux. */
export const registrationColors = {
  PARTICIPANT: "#2E7CB8",
  EXPOSANT: "#0E9F6E",
  SPONSOR: "#C9A227",
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  full: 999,
};

/** Espacement en base 4. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
};

export const typography = {
  fonts: {
    display: "Playfair Display", // titres — sérif institutionnel
    body: "Inter", // texte courant
    arabic: "Amiri", // toponymes et formules arabes (Hadj, Oumrah)
  },
  sizes: {
    display: 34,
    h1: 28,
    h2: 22,
    h3: 18,
    body: 15,
    caption: 13,
  },
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

/** Ombres douces teintées bleu plutôt que noires pures. */
export const shadows = {
  card: "0 8px 24px rgba(15, 61, 107, 0.12)",
  glow: "0 0 20px rgba(15, 61, 107, 0.35)",
  gold: "0 0 18px rgba(201, 162, 39, 0.35)",
};

export type ThemeName = keyof typeof palette;
export type PanelColorKey = keyof typeof panelColors;
