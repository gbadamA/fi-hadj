import type {
  Edition,
  ExpectedResult,
  ImpactProjection,
  Objective,
  OrgChartMember,
  Prize,
  ProgramItem,
  Promoter,
  Sponsor,
  SubTheme,
  TargetCategory,
} from "@fihadj/shared-types";

/** Réponse de `GET /home` — tout le contenu de la page d'accueil en une requête. */
export interface HomeBundle {
  edition: Edition;
  promoters: Promoter[];
  objectives: Objective[];
  expectedResults: ExpectedResult[];
  theme: { id: string; title: string; description: string | null; subThemes: SubTheme[] } | null;
  programItems: ProgramItem[];
  prizes: Prize[];
  targetCategories: TargetCategory[];
  impactProjections: ImpactProjection[];
  orgChart: OrgChartMember[];
  sponsors: Sponsor[];
  contexte: { key: string; title: string; body: string } | null;
}

export interface SiteContentBlock {
  id: string;
  key: string;
  title: string;
  body: string;
  updatedAt: string;
}

export interface PublicExhibitor {
  id: string;
  companyName: string;
  activitySector: string;
  logoUrl: string | null;
  standNumber: string | null;
}

export interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
}

export interface BadgeVerification {
  reference: string;
  valid: boolean;
  status: string;
  type: string;
  holder: string;
  organization: string | null;
  edition: { year: number; title: string };
}
