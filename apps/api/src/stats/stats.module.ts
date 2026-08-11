import { Controller, Get, Injectable, Module, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import type {
  DashboardStats,
  RegistrationStatus,
  RegistrationType,
  SponsorLevel,
} from "@fihadj/shared-types";
import { PrismaService } from "../common/prisma/prisma.service";
import { EditionsService } from "../editions/editions.service";
import { ExhibitorsService } from "../exhibitors/exhibitors.service";
import { ExhibitorsModule } from "../exhibitors/exhibitors.module";
import { BudgetModule, BudgetService } from "../budget/budget.module";
import { RequireModule } from "../common/decorators/auth.decorators";

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly editions: EditionsService,
    private readonly exhibitors: ExhibitorsService,
    private readonly budget: BudgetService,
  ) {}

  async dashboard(editionId?: string): Promise<DashboardStats> {
    const edition = await this.editions.resolve(editionId);

    const [byType, byStatus, registrations, stands, budget, sponsors, contactsTotal, contactsPending, projection] =
      await Promise.all([
        this.prisma.registration.groupBy({
          by: ["type"],
          where: { editionId: edition.id },
          _count: { _all: true },
        }),
        this.prisma.registration.groupBy({
          by: ["status"],
          where: { editionId: edition.id },
          _count: { _all: true },
        }),
        this.prisma.registration.findMany({
          where: { editionId: edition.id },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
        this.exhibitors.standStats(edition.id),
        this.budget.summary(edition.id),
        this.prisma.sponsor.groupBy({
          by: ["level"],
          where: { editionId: edition.id },
          _count: { _all: true },
        }),
        this.prisma.contactMessage.count(),
        this.prisma.contactMessage.count({ where: { handled: false } }),
        this.prisma.impactProjection.findUnique({ where: { year: edition.year } }),
      ]);

    return {
      edition: { id: edition.id, year: edition.year, title: edition.title },
      registrations: {
        total: registrations.length,
        byType: byType.map((row) => ({
          type: row.type as RegistrationType,
          count: row._count._all,
        })),
        byStatus: byStatus.map((row) => ({
          status: row.status as RegistrationStatus,
          count: row._count._all,
        })),
        timeline: cumulativeByDay(registrations.map((r) => r.createdAt)),
      },
      stands: {
        total: stands.total,
        assigned: stands.assigned,
        paid: stands.paid,
        fillRate: stands.fillRate,
      },
      budget,
      sponsors: {
        total: sponsors.reduce((sum, row) => sum + row._count._all, 0),
        byLevel: sponsors.map((row) => ({
          level: row.level as SponsorLevel,
          count: row._count._all,
        })),
      },
      contacts: { total: contactsTotal, pending: contactsPending },
      // Comparaison à l'objectif d'impact de l'année (cahier §5.7).
      impact: projection
        ? {
            year: projection.year,
            targetOnSite: projection.onSite,
            actualRegistrations: registrations.length,
          }
        : null,
    };
  }
}

/**
 * Courbe cumulée jour par jour. On renvoie le CUMUL et non le compte quotidien :
 * sur six semaines d'inscriptions clairsemées, une courbe cumulée montre la
 * dynamique, là où des barres quotidiennes ne montrent que du bruit.
 */
function cumulativeByDay(dates: Date[]): { date: string; count: number }[] {
  const perDay = new Map<string, number>();
  for (const date of dates) {
    const key = date.toISOString().slice(0, 10);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  let running = 0;
  return [...perDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => {
      running += count;
      return { date, count: running };
    });
}

@ApiTags("statistiques")
@Controller("stats")
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @RequireModule("stats")
  @Get("dashboard")
  @ApiQuery({ name: "editionId", required: false })
  @ApiOperation({ summary: "Indicateurs consolidés du tableau de bord" })
  dashboard(@Query("editionId") editionId?: string) {
    return this.stats.dashboard(editionId);
  }
}

@Module({
  // Le tableau de bord agrège des chiffres calculés ailleurs plutôt que de
  // redéfinir ses propres requêtes : une seule définition du « taux de
  // remplissage » et du « solde budgétaire » dans tout le projet.
  imports: [ExhibitorsModule, BudgetModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
