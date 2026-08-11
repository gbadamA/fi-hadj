/**
 * Formes des réponses de l'API, telles que les consomme le front.
 * Les dates transitent en ISO 8601 (JSON n'a pas de type date).
 */
import type {
  ArticleStatus,
  BudgetEntryType,
  Civility,
  MediaType,
  ObjectiveType,
  PaymentStatus,
  ProgramItemType,
  RegistrationStatus,
  RegistrationType,
  Role,
  SponsorLevel,
  StandStatus,
} from "./enums";

export interface Edition {
  id: string;
  year: number;
  title: string;
  theme: string;
  startDate: string;
  endDate: string;
  venue: string;
  city: string;
  isCurrent: boolean;
  registrationOpen: boolean;
  heroSubtitle: string | null;
}

export interface Promoter {
  id: string;
  name: string;
  acronym: string;
  description: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  order: number;
}

export interface Objective {
  id: string;
  type: ObjectiveType;
  text: string;
  order: number;
}

export interface ExpectedResult {
  id: string;
  text: string;
  order: number;
}

export interface SubTheme {
  id: string;
  title: string;
  description: string | null;
  colorKey: string | null;
  order: number;
}

export interface Theme {
  id: string;
  title: string;
  description: string | null;
  subThemes: SubTheme[];
}

export interface ProgramItem {
  id: string;
  title: string;
  description: string | null;
  type: ProgramItemType;
  day: string;
  startTime: string;
  endTime: string;
  location: string | null;
  speakers: string[];
  subThemeId: string | null;
  subTheme?: SubTheme | null;
  order: number;
}

export interface Prize {
  id: string;
  name: string;
  sponsorName: string | null;
  laureate: string | null;
  description: string | null;
  order: number;
}

export interface TargetCategory {
  id: string;
  name: string;
  description: string | null;
  subCategories: string[];
  order: number;
}

export interface ImpactProjection {
  id: string;
  year: number;
  onSite: number;
  online: number;
  trained: number;
  directJobs: number;
  indirectJobs: number;
}

export interface OrgChartMember {
  id: string;
  position: string;
  holderName: string | null;
  missions: string[];
  role: Role | null;
  photoUrl: string | null;
  order: number;
}

export interface Sponsor {
  id: string;
  name: string;
  level: SponsorLevel;
  logoUrl: string | null;
  websiteUrl: string | null;
  benefits: string[];
  amount: number;
  order: number;
}

export interface Exhibitor {
  id: string;
  companyName: string;
  activitySector: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  logoUrl: string | null;
  standNumber: string | null;
  standStatus: StandStatus;
  standFee: number;
  paidAmount: number;
  registrationId: string | null;
}

export interface Registration {
  id: string;
  reference: string;
  type: RegistrationType;
  civility: Civility;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  organization: string | null;
  position: string | null;
  targetCategoryId: string | null;
  targetCategory?: TargetCategory | null;
  message: string | null;
  activitySector: string | null;
  standSize: string | null;
  websiteUrl: string | null;
  sponsorLevel: SponsorLevel | null;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  reviewReason: string | null;
  createdAt: string;
  exhibitor?: Exhibitor | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BudgetEntry {
  id: string;
  type: BudgetEntryType;
  category: string;
  label: string;
  amount: number;
  currency: string;
  date: string;
  createdById: string | null;
  createdBy?: { id: string; fullName: string } | null;
}

export interface BudgetSummary {
  currency: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: { type: BudgetEntryType; category: string; amount: number }[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  handled: boolean;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverUrl: string | null;
  status: ArticleStatus;
  publishedAt: string | null;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  url: string;
  type: MediaType;
  caption: string | null;
  section: string | null;
  /** Nom du fichier sur disque — sert à la suppression physique. */
  fileName: string | null;
  /** Décide de l'aperçu : image affichée, document représenté par une icône. */
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  phone: string | null;
}

export interface DashboardStats {
  edition: Pick<Edition, "id" | "year" | "title"> | null;
  registrations: {
    total: number;
    byType: { type: RegistrationType; count: number }[];
    byStatus: { status: RegistrationStatus; count: number }[];
    /** Cumul jour par jour, pour la courbe d'évolution. */
    timeline: { date: string; count: number }[];
  };
  stands: { total: number; assigned: number; paid: number; fillRate: number };
  budget: BudgetSummary;
  sponsors: { total: number; byLevel: { level: SponsorLevel; count: number }[] };
  contacts: { total: number; pending: number };
  /** Comparaison aux projections d'impact du cahier (tableau 2025-2028). */
  impact: { year: number; targetOnSite: number; actualRegistrations: number } | null;
}
