import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { EditionsService } from "../editions/editions.service";

/**
 * Contenu institutionnel du site : promoteurs, objectifs, résultats attendus,
 * thème et sous-thèmes, programme, distinctions, cibles, projections, organigramme
 * et blocs de texte libres.
 *
 * Tout ce qui varie d'une édition à l'autre passe par `editions.resolve()` : un
 * appel sans `editionId` retombe automatiquement sur l'édition courante, ce qui
 * rend le site public indépendant du multi-édition.
 */
@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly editions: EditionsService,
  ) {}

  private async editionId(explicit?: string | null): Promise<string> {
    return (await this.editions.resolve(explicit)).id;
  }

  /* ─── Promoteurs (permanents, hors édition) ─── */

  listPromoters() {
    return this.prisma.promoter.findMany({ orderBy: { order: "asc" } });
  }
  createPromoter(data: Record<string, unknown>) {
    return this.prisma.promoter.create({ data: data as never });
  }
  updatePromoter(id: string, data: Record<string, unknown>) {
    return this.prisma.promoter.update({ where: { id }, data: data as never });
  }
  async deletePromoter(id: string) {
    await this.prisma.promoter.delete({ where: { id } });
  }

  /* ─── Objectifs ─── */

  async listObjectives(editionId?: string) {
    return this.prisma.objective.findMany({
      where: { editionId: await this.editionId(editionId) },
      orderBy: [{ type: "asc" }, { order: "asc" }],
    });
  }
  async createObjective(data: Record<string, unknown>) {
    return this.prisma.objective.create({
      data: { ...data, editionId: await this.editionId(data.editionId as string) } as never,
    });
  }
  updateObjective(id: string, data: Record<string, unknown>) {
    return this.prisma.objective.update({ where: { id }, data: data as never });
  }
  async deleteObjective(id: string) {
    await this.prisma.objective.delete({ where: { id } });
  }

  /* ─── Résultats attendus ─── */

  async listExpectedResults(editionId?: string) {
    return this.prisma.expectedResult.findMany({
      where: { editionId: await this.editionId(editionId) },
      orderBy: { order: "asc" },
    });
  }
  async createExpectedResult(data: Record<string, unknown>) {
    return this.prisma.expectedResult.create({
      data: { ...data, editionId: await this.editionId(data.editionId as string) } as never,
    });
  }
  updateExpectedResult(id: string, data: Record<string, unknown>) {
    return this.prisma.expectedResult.update({ where: { id }, data: data as never });
  }
  async deleteExpectedResult(id: string) {
    await this.prisma.expectedResult.delete({ where: { id } });
  }

  /* ─── Thème et sous-thèmes ─── */

  async getTheme(editionId?: string) {
    const theme = await this.prisma.theme.findUnique({
      where: { editionId: await this.editionId(editionId) },
      include: { subThemes: { orderBy: { order: "asc" } } },
    });
    if (!theme) throw new NotFoundException("Aucun thème défini pour cette édition");
    return theme;
  }

  async upsertTheme(data: { title: string; description?: string; editionId?: string }) {
    const editionId = await this.editionId(data.editionId);
    return this.prisma.theme.upsert({
      where: { editionId },
      update: { title: data.title, description: data.description || null },
      create: { editionId, title: data.title, description: data.description || null },
      include: { subThemes: { orderBy: { order: "asc" } } },
    });
  }

  async createSubTheme(data: Record<string, unknown> & { editionId?: string }) {
    const theme = await this.getTheme(data.editionId);
    const { editionId: _ignored, ...rest } = data;
    return this.prisma.subTheme.create({ data: { ...rest, themeId: theme.id } as never });
  }
  updateSubTheme(id: string, data: Record<string, unknown>) {
    return this.prisma.subTheme.update({ where: { id }, data: data as never });
  }
  async deleteSubTheme(id: string) {
    await this.prisma.subTheme.delete({ where: { id } });
  }

  /* ─── Programme ─── */

  async listProgramItems(editionId?: string) {
    return this.prisma.programItem.findMany({
      where: { editionId: await this.editionId(editionId) },
      include: { subTheme: true },
      orderBy: [{ day: "asc" }, { startTime: "asc" }, { order: "asc" }],
    });
  }

  async createProgramItem(data: Record<string, unknown>) {
    return this.prisma.programItem.create({
      data: {
        ...this.programData(data),
        editionId: await this.editionId(data.editionId as string),
      } as never,
      include: { subTheme: true },
    });
  }

  updateProgramItem(id: string, data: Record<string, unknown>) {
    return this.prisma.programItem.update({
      where: { id },
      data: this.programData(data) as never,
      include: { subTheme: true },
    });
  }

  async deleteProgramItem(id: string) {
    await this.prisma.programItem.delete({ where: { id } });
  }

  private programData(data: Record<string, unknown>) {
    const { editionId: _ignored, day, subThemeId, ...rest } = data;
    return {
      ...rest,
      ...(day !== undefined && { day: new Date(day as string) }),
      // Une chaîne vide venant d'un <select> vaut « aucun sous-thème », pas une
      // clé étrangère invalide.
      ...(subThemeId !== undefined && { subThemeId: (subThemeId as string) || null }),
    };
  }

  /* ─── Distinctions du gala ─── */

  async listPrizes(editionId?: string) {
    return this.prisma.prize.findMany({
      where: { editionId: await this.editionId(editionId) },
      orderBy: { order: "asc" },
    });
  }
  async createPrize(data: Record<string, unknown>) {
    return this.prisma.prize.create({
      data: { ...data, editionId: await this.editionId(data.editionId as string) } as never,
    });
  }
  updatePrize(id: string, data: Record<string, unknown>) {
    return this.prisma.prize.update({ where: { id }, data: data as never });
  }
  async deletePrize(id: string) {
    await this.prisma.prize.delete({ where: { id } });
  }

  /* ─── Catégories de cible (permanentes) ─── */

  listTargetCategories() {
    return this.prisma.targetCategory.findMany({ orderBy: { order: "asc" } });
  }
  createTargetCategory(data: Record<string, unknown>) {
    return this.prisma.targetCategory.create({ data: data as never });
  }
  updateTargetCategory(id: string, data: Record<string, unknown>) {
    return this.prisma.targetCategory.update({ where: { id }, data: data as never });
  }
  async deleteTargetCategory(id: string) {
    await this.prisma.targetCategory.delete({ where: { id } });
  }

  /* ─── Projections d'impact (permanentes) ─── */

  listImpactProjections() {
    return this.prisma.impactProjection.findMany({ orderBy: { year: "asc" } });
  }
  upsertImpactProjection(data: { year: number } & Record<string, unknown>) {
    return this.prisma.impactProjection.upsert({
      where: { year: data.year },
      update: data as never,
      create: data as never,
    });
  }
  async deleteImpactProjection(id: string) {
    await this.prisma.impactProjection.delete({ where: { id } });
  }

  /* ─── Organigramme ─── */

  async listOrgChart(editionId?: string) {
    return this.prisma.orgChartMember.findMany({
      where: { editionId: await this.editionId(editionId) },
      orderBy: { order: "asc" },
    });
  }
  async createOrgChartMember(data: Record<string, unknown>) {
    const { editionId, ...rest } = data;
    return this.prisma.orgChartMember.create({
      data: { ...rest, editionId: await this.editionId(editionId as string) } as never,
    });
  }
  updateOrgChartMember(id: string, data: Record<string, unknown>) {
    const { editionId: _ignored, ...rest } = data;
    return this.prisma.orgChartMember.update({ where: { id }, data: rest as never });
  }
  async deleteOrgChartMember(id: string) {
    await this.prisma.orgChartMember.delete({ where: { id } });
  }

  /* ─── Blocs de texte libres ─── */

  listSiteContent() {
    return this.prisma.siteContent.findMany({ orderBy: { key: "asc" } });
  }
  async getSiteContent(key: string) {
    const block = await this.prisma.siteContent.findUnique({ where: { key } });
    if (!block) throw new NotFoundException(`Bloc de contenu « ${key} » introuvable`);
    return block;
  }
  upsertSiteContent(key: string, data: { title: string; body: string }) {
    return this.prisma.siteContent.upsert({
      where: { key },
      update: data,
      create: { key, ...data },
    });
  }

  /**
   * Charge en une seule requête tout ce dont la page d'accueil a besoin.
   * Sans cela le site enchaînerait huit allers-retours HTTP pour un seul rendu.
   */
  async homeBundle(editionId?: string) {
    const edition = await this.editions.resolve(editionId);
    const [
      promoters,
      objectives,
      expectedResults,
      theme,
      programItems,
      prizes,
      targetCategories,
      impactProjections,
      orgChart,
      sponsors,
      contexte,
    ] = await Promise.all([
      this.prisma.promoter.findMany({ orderBy: { order: "asc" } }),
      this.prisma.objective.findMany({
        where: { editionId: edition.id },
        orderBy: [{ type: "asc" }, { order: "asc" }],
      }),
      this.prisma.expectedResult.findMany({
        where: { editionId: edition.id },
        orderBy: { order: "asc" },
      }),
      this.prisma.theme.findUnique({
        where: { editionId: edition.id },
        include: { subThemes: { orderBy: { order: "asc" } } },
      }),
      this.prisma.programItem.findMany({
        where: { editionId: edition.id },
        include: { subTheme: true },
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
      }),
      this.prisma.prize.findMany({
        where: { editionId: edition.id },
        orderBy: { order: "asc" },
      }),
      this.prisma.targetCategory.findMany({ orderBy: { order: "asc" } }),
      this.prisma.impactProjection.findMany({ orderBy: { year: "asc" } }),
      this.prisma.orgChartMember.findMany({
        where: { editionId: edition.id },
        orderBy: { order: "asc" },
      }),
      this.prisma.sponsor.findMany({
        where: { editionId: edition.id },
        orderBy: [{ level: "asc" }, { order: "asc" }],
      }),
      this.prisma.siteContent.findUnique({ where: { key: "contexte" } }),
    ]);

    return {
      edition,
      promoters,
      objectives,
      expectedResults,
      theme,
      programItems,
      prizes,
      targetCategories,
      impactProjections,
      orgChart,
      sponsors,
      contexte,
    };
  }
}
