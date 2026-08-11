/**
 * Schémas Zod partagés — le formulaire React Hook Form du site et le DTO NestJS
 * valident exactement la même chose. Une règle écrite une fois, appliquée des deux côtés.
 */
import { z } from "zod";
import {
  CIVILITIES,
  REGISTRATION_TYPES,
  REGISTRATION_STATUSES,
  PAYMENT_STATUSES,
  SPONSOR_LEVELS,
  BUDGET_ENTRY_TYPES,
  PROGRAM_ITEM_TYPES,
  OBJECTIVE_TYPES,
  ROLES,
  STAND_STATUSES,
  ARTICLE_STATUSES,
  MEDIA_TYPES,
} from "./enums";

/** Accepte +225 07 07 07 07 07, 0707070707, +33 6 12 34 56 78… */
const phone = z
  .string()
  .trim()
  .min(8, "Numéro trop court")
  .max(24, "Numéro trop long")
  .regex(/^\+?[0-9\s.\-()]{8,24}$/, "Numéro de téléphone invalide");

const shortText = (max = 160) => z.string().trim().min(1, "Champ requis").max(max);

/* ─────────────────────────── Inscriptions ─────────────────────────── */

const registrationBase = {
  civility: z.enum(CIVILITIES),
  lastName: shortText(80),
  firstName: shortText(80),
  email: z.string().trim().email("Adresse email invalide").max(160),
  phone,
  country: shortText(80),
  organization: z.string().trim().max(160).optional().or(z.literal("")),
  position: z.string().trim().max(160).optional().or(z.literal("")),
  targetCategoryId: z.string().uuid().optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  /**
   * Consentement explicite — l'inscription collecte des données personnelles
   * (cahier §8 « protection des données »). Le refus bloque l'envoi.
   */
  consent: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter la politique de confidentialité" }),
  }),
};

export const participantRegistrationSchema = z.object({
  ...registrationBase,
  type: z.literal("PARTICIPANT"),
});

export const exhibitorRegistrationSchema = z.object({
  ...registrationBase,
  type: z.literal("EXPOSANT"),
  organization: shortText(160), // la raison sociale devient obligatoire
  activitySector: shortText(120),
  standSize: z.string().trim().max(60).optional().or(z.literal("")),
  websiteUrl: z.string().trim().url("URL invalide").max(200).optional().or(z.literal("")),
});

export const sponsorRegistrationSchema = z.object({
  ...registrationBase,
  type: z.literal("SPONSOR"),
  organization: shortText(160),
  sponsorLevel: z.enum(SPONSOR_LEVELS),
  websiteUrl: z.string().trim().url("URL invalide").max(200).optional().or(z.literal("")),
});

export const registrationSchema = z.discriminatedUnion("type", [
  participantRegistrationSchema,
  exhibitorRegistrationSchema,
  sponsorRegistrationSchema,
]);

export type ParticipantRegistrationInput = z.infer<typeof participantRegistrationSchema>;
export type ExhibitorRegistrationInput = z.infer<typeof exhibitorRegistrationSchema>;
export type SponsorRegistrationInput = z.infer<typeof sponsorRegistrationSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;

export const registrationStatusUpdateSchema = z.object({
  status: z.enum(REGISTRATION_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  /** Motif obligatoire en cas de rejet — un refus sans explication est ingérable. */
  reason: z.string().trim().max(500).optional(),
});

export const registrationQuerySchema = z.object({
  type: z.enum(REGISTRATION_TYPES).optional(),
  status: z.enum(REGISTRATION_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  editionId: z.string().uuid().optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
});

/* ─────────────────────────── Contact ─────────────────────────── */

export const contactSchema = z.object({
  name: shortText(120),
  email: z.string().trim().email("Adresse email invalide").max(160),
  phone: phone.optional().or(z.literal("")),
  subject: shortText(160),
  message: z.string().trim().min(10, "Message trop court").max(4000),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter la politique de confidentialité" }),
  }),
});
export type ContactInput = z.infer<typeof contactSchema>;

/* ─────────────────────────── Authentification ─────────────────────────── */

export const loginSchema = z.object({
  email: z.string().trim().email("Adresse email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const userCreateSchema = z.object({
  fullName: shortText(120),
  email: z.string().trim().email("Adresse email invalide"),
  password: z.string().min(8, "8 caractères minimum").max(72),
  role: z.enum(ROLES),
  phone: phone.optional().or(z.literal("")),
});

export const userUpdateSchema = userCreateSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

/* ─────────────────────────── Contenu éditorial ─────────────────────────── */

export const editionSchema = z.object({
  year: z.coerce.number().int().min(2024).max(2100),
  title: shortText(160),
  theme: shortText(300),
  startDate: z.string().min(1, "Date requise"),
  endDate: z.string().min(1, "Date requise"),
  venue: shortText(200),
  city: shortText(120),
  isCurrent: z.boolean().default(false),
  registrationOpen: z.boolean().default(true),
  heroSubtitle: z.string().trim().max(400).optional().or(z.literal("")),
});

export const promoterSchema = z.object({
  name: shortText(200),
  acronym: shortText(20),
  description: z.string().trim().min(1).max(4000),
  logoUrl: z.string().trim().max(400).optional().or(z.literal("")),
  websiteUrl: z.string().trim().max(200).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
});

export const objectiveSchema = z.object({
  type: z.enum(OBJECTIVE_TYPES),
  text: z.string().trim().min(1).max(1000),
  order: z.coerce.number().int().min(0).default(0),
  editionId: z.string().uuid().optional(),
});

export const expectedResultSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  order: z.coerce.number().int().min(0).default(0),
  editionId: z.string().uuid().optional(),
});

export const subThemeSchema = z.object({
  title: shortText(300),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  colorKey: z.string().trim().max(40).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
});

export const programItemSchema = z.object({
  title: shortText(200),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
  type: z.enum(PROGRAM_ITEM_TYPES),
  day: z.string().min(1, "Date requise"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  speakers: z.array(z.string().trim().max(160)).default([]),
  subThemeId: z.string().uuid().optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
  editionId: z.string().uuid().optional(),
});

export const prizeSchema = z.object({
  name: shortText(200),
  sponsorName: z.string().trim().max(200).optional().or(z.literal("")),
  laureate: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
  editionId: z.string().uuid().optional(),
});

export const targetCategorySchema = z.object({
  name: shortText(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  subCategories: z.array(z.string().trim().max(200)).default([]),
  order: z.coerce.number().int().min(0).default(0),
});

export const impactProjectionSchema = z.object({
  year: z.coerce.number().int().min(2024).max(2100),
  onSite: z.coerce.number().int().min(0),
  online: z.coerce.number().int().min(0),
  trained: z.coerce.number().int().min(0),
  directJobs: z.coerce.number().int().min(0),
  indirectJobs: z.coerce.number().int().min(0),
});

export const orgChartMemberSchema = z.object({
  position: shortText(200),
  holderName: z.string().trim().max(160).optional().or(z.literal("")),
  missions: z.array(z.string().trim().max(400)).default([]),
  role: z.enum(ROLES).optional(),
  photoUrl: z.string().trim().max(400).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
});

export const articleSchema = z.object({
  title: shortText(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Minuscules, chiffres et tirets uniquement"),
  excerpt: z.string().trim().max(400).optional().or(z.literal("")),
  content: z.string().trim().min(1),
  coverUrl: z.string().trim().max(400).optional().or(z.literal("")),
  status: z.enum(ARTICLE_STATUSES).default("BROUILLON"),
  publishedAt: z.string().optional().or(z.literal("")),
});

export const mediaAssetSchema = z.object({
  url: z.string().trim().min(1).max(400),
  type: z.enum(MEDIA_TYPES),
  caption: z.string().trim().max(300).optional().or(z.literal("")),
  section: z.string().trim().max(80).optional().or(z.literal("")),
});

/* ─────────────────────────── Exposants / sponsors ─────────────────────────── */

export const exhibitorSchema = z.object({
  companyName: shortText(200),
  activitySector: shortText(120),
  contactName: z.string().trim().max(160).optional().or(z.literal("")),
  contactEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
  contactPhone: phone.optional().or(z.literal("")),
  logoUrl: z.string().trim().max(400).optional().or(z.literal("")),
  standNumber: z.string().trim().max(30).optional().or(z.literal("")),
  standStatus: z.enum(STAND_STATUSES).default("RESERVE"),
  standFee: z.coerce.number().min(0).default(0),
  paidAmount: z.coerce.number().min(0).default(0),
  registrationId: z.string().uuid().optional().or(z.literal("")),
  editionId: z.string().uuid().optional(),
});

export const sponsorSchema = z.object({
  name: shortText(200),
  level: z.enum(SPONSOR_LEVELS),
  logoUrl: z.string().trim().max(400).optional().or(z.literal("")),
  websiteUrl: z.string().trim().max(200).optional().or(z.literal("")),
  benefits: z.array(z.string().trim().max(300)).default([]),
  amount: z.coerce.number().min(0).default(0),
  order: z.coerce.number().int().min(0).default(0),
  editionId: z.string().uuid().optional(),
});

/* ─────────────────────────── Budget ─────────────────────────── */

export const budgetEntrySchema = z.object({
  type: z.enum(BUDGET_ENTRY_TYPES),
  category: shortText(120),
  label: shortText(200),
  amount: z.coerce.number().min(0),
  currency: z.string().trim().length(3).default("XOF"),
  date: z.string().min(1, "Date requise"),
  editionId: z.string().uuid().optional(),
});

export type EditionInput = z.infer<typeof editionSchema>;
export type ProgramItemInput = z.infer<typeof programItemSchema>;
export type ExhibitorInput = z.infer<typeof exhibitorSchema>;
export type SponsorInput = z.infer<typeof sponsorSchema>;
export type BudgetEntryInput = z.infer<typeof budgetEntrySchema>;
export type OrgChartMemberInput = z.infer<typeof orgChartMemberSchema>;
export type ArticleInput = z.infer<typeof articleSchema>;
