/**
 * Preset Tailwind partagé — miroir de `index.ts` au format Tailwind.
 *
 * Usage (tailwind.config.ts) :
 *   presets: [require('@fihadj/design-tokens/tailwind-preset')]
 *
 * Thème : classes `dark:` (ex. `bg-light-bg dark:bg-dark-bg`), stratégie `class`.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Marque — passées par variables CSS en canaux RVB pour rester
        // surchargeables à l'exécution sans perdre les modificateurs d'opacité
        // (`bg-primary/10` fonctionne, ce qui serait faux avec un hex direct).
        primary: {
          DEFAULT: "rgb(var(--c-primary) / <alpha-value>)",
          hover: "rgb(var(--c-primary-hover) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--c-secondary) / <alpha-value>)",
          hover: "rgb(var(--c-secondary-hover) / <alpha-value>)",
        },
        tertiary: "rgb(var(--c-tertiary) / <alpha-value>)",
        success: "#12B76A",
        warning: "#F59E0B",
        danger: "#DC2626",
        // Dégradé signature
        azure: { start: "#0B2A4A", mid: "#14507F", end: "#C9A227" },
        // Sous-thèmes / panels
        panel: {
          organisation: "#0F3D6B",
          interculturalite: "#2E7CB8",
          flux: "#0E9F6E",
          diplomatie: "#C9A227",
        },
        // Neutres — clair
        light: {
          bg: "#F5F8FC",
          surface: "#FFFFFF",
          "surface-alt": "#EAF1F8",
          border: "#D8E3EF",
          text: "#0B1A2A",
          muted: "#5A6B7D",
        },
        // Neutres — sombre
        dark: {
          bg: "#060F1A",
          surface: "#0E1B2A",
          "surface-alt": "#152435",
          border: "#23374C",
          text: "#E8EFF7",
          muted: "#90A3B8",
        },
      },
      borderRadius: {
        sm: "10px",
        md: "16px",
        lg: "24px",
      },
      fontFamily: {
        display: ["var(--font-display)", "Playfair Display", "Georgia", "serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        arabic: ["var(--font-arabic)", "Amiri", "Scheherazade New", "serif"],
      },
      fontSize: {
        display: ["34px", { lineHeight: "42px", fontWeight: "700" }],
        h1: ["28px", { lineHeight: "36px", fontWeight: "700" }],
        h2: ["22px", { lineHeight: "30px", fontWeight: "600" }],
        h3: ["18px", { lineHeight: "26px", fontWeight: "600" }],
        body: ["15px", { lineHeight: "24px" }],
        caption: ["13px", { lineHeight: "18px" }],
      },
      backgroundImage: {
        diplomatic: "linear-gradient(135deg, #0B2A4A 0%, #14507F 58%, #C9A227 100%)",
        "diplomatic-deep": "linear-gradient(135deg, #08203A 0%, #14507F 100%)",
        gold: "linear-gradient(135deg, #C9A227 0%, #E7C766 50%, #A9871C 100%)",
      },
      boxShadow: {
        card: "0 8px 24px rgba(15, 61, 107, 0.12)",
        glow: "0 0 20px rgba(15, 61, 107, 0.35)",
        gold: "0 0 18px rgba(201, 162, 39, 0.35)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
};
