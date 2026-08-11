/**
 * Énumérations partagées entre l'API NestJS et le front Next.js.
 *
 * ⚠️ Ces valeurs sont le miroir EXACT des `enum` Prisma (`apps/api/prisma/schema.prisma`).
 * Toute modification ici doit être répercutée là-bas, et inversement — c'est ce
 * couplage assumé qui évite un générateur de types supplémentaire.
 */

/** Rôles alignés sur l'organigramme réel du Commissariat Général (cahier §5.8). */
export const ROLES = [
  "SUPER_ADMIN",
  "COMMISSAIRE_GENERAL",
  "COMMISSAIRE_ADJOINT_1",
  "COMMISSAIRE_ADJOINT_2",
  "RESPONSABLE_LOGISTIQUE",
  "RESPONSABLE_COMMUNICATION",
  "RESPONSABLE_PARTENARIATS_SPONSORING",
  "RESPONSABLE_EXPOSITIONS",
  "RESPONSABLE_ATELIERS_PANELS",
  "RESPONSABLE_EVENEMENTIEL",
  "RESPONSABLE_FINANCIER",
  "RESPONSABLE_RH",
  "RESPONSABLE_IT",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super administrateur",
  COMMISSAIRE_GENERAL: "Commissaire Général",
  COMMISSAIRE_ADJOINT_1: "Commissaire Général Adjoint 1 — stratégie & partenariats",
  COMMISSAIRE_ADJOINT_2: "Commissaire Général Adjoint 2 — aspects religieux",
  RESPONSABLE_LOGISTIQUE: "Responsable Logistique",
  RESPONSABLE_COMMUNICATION: "Responsable Communication",
  RESPONSABLE_PARTENARIATS_SPONSORING: "Responsable Partenariats & Sponsoring",
  RESPONSABLE_EXPOSITIONS: "Responsable Expositions",
  RESPONSABLE_ATELIERS_PANELS: "Responsable Ateliers & Panels",
  RESPONSABLE_EVENEMENTIEL: "Responsable Événementiel",
  RESPONSABLE_FINANCIER: "Responsable Financier",
  RESPONSABLE_RH: "Responsable Ressources Humaines",
  RESPONSABLE_IT: "Responsable Informatique",
};

export const REGISTRATION_TYPES = ["PARTICIPANT", "EXPOSANT", "SPONSOR"] as const;
export type RegistrationType = (typeof REGISTRATION_TYPES)[number];

export const REGISTRATION_TYPE_LABELS: Record<RegistrationType, string> = {
  PARTICIPANT: "Participant / Visiteur",
  EXPOSANT: "Exposant",
  SPONSOR: "Sponsor / Partenaire",
};

export const REGISTRATION_STATUSES = ["EN_ATTENTE", "VALIDE", "REJETE"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  EN_ATTENTE: "En attente",
  VALIDE: "Validée",
  REJETE: "Rejetée",
};

export const PAYMENT_STATUSES = ["NON_APPLICABLE", "EN_ATTENTE", "PAYE", "REMBOURSE"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  NON_APPLICABLE: "Sans objet",
  EN_ATTENTE: "En attente de paiement",
  PAYE: "Payé",
  REMBOURSE: "Remboursé",
};

export const CIVILITIES = ["M", "MME", "DR", "PR", "SE", "CHEIKH", "IMAM"] as const;
export type Civility = (typeof CIVILITIES)[number];

/** Titres protocolaires — le forum s'adresse à des autorités religieuses et diplomatiques. */
export const CIVILITY_LABELS: Record<Civility, string> = {
  M: "M.",
  MME: "Mme",
  DR: "Dr",
  PR: "Pr",
  SE: "S.E.", // Son Excellence — corps diplomatique
  CHEIKH: "Cheikh",
  IMAM: "Imam",
};

export const PROGRAM_ITEM_TYPES = [
  "CEREMONIE",
  "PANEL",
  "ATELIER",
  "EXPOSITION",
  "GALA",
  "PAUSE",
] as const;
export type ProgramItemType = (typeof PROGRAM_ITEM_TYPES)[number];

export const PROGRAM_ITEM_TYPE_LABELS: Record<ProgramItemType, string> = {
  CEREMONIE: "Cérémonie",
  PANEL: "Panel",
  ATELIER: "Atelier",
  EXPOSITION: "Exposition / stands",
  GALA: "Dîner-gala",
  PAUSE: "Pause",
};

export const OBJECTIVE_TYPES = ["GENERAL", "SPECIFIQUE"] as const;
export type ObjectiveType = (typeof OBJECTIVE_TYPES)[number];

export const SPONSOR_LEVELS = ["PLATINE", "OR", "ARGENT", "BRONZE", "PARTENAIRE"] as const;
export type SponsorLevel = (typeof SPONSOR_LEVELS)[number];

export const SPONSOR_LEVEL_LABELS: Record<SponsorLevel, string> = {
  PLATINE: "Platine",
  OR: "Or",
  ARGENT: "Argent",
  BRONZE: "Bronze",
  PARTENAIRE: "Partenaire institutionnel",
};

export const BUDGET_ENTRY_TYPES = ["RECETTE", "DEPENSE"] as const;
export type BudgetEntryType = (typeof BUDGET_ENTRY_TYPES)[number];

export const BUDGET_ENTRY_TYPE_LABELS: Record<BudgetEntryType, string> = {
  RECETTE: "Recette",
  DEPENSE: "Dépense",
};

export const STAND_STATUSES = ["LIBRE", "RESERVE", "ATTRIBUE", "PAYE"] as const;
export type StandStatus = (typeof STAND_STATUSES)[number];

export const STAND_STATUS_LABELS: Record<StandStatus, string> = {
  LIBRE: "Libre",
  RESERVE: "Réservé",
  ATTRIBUE: "Attribué",
  PAYE: "Payé",
};

export const MEDIA_TYPES = ["LOGO", "IMAGE", "DOCUMENT", "GALERIE"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const ARTICLE_STATUSES = ["BROUILLON", "PUBLIE"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];
