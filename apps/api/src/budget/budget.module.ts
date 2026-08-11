import { Controller, Delete, Get, HttpCode, Injectable, Module, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import {
  BUDGET_ENTRY_TYPE_LABELS,
  budgetEntrySchema,
  formatDateShort,
  formatMoney,
  type BudgetEntryInput,
  type BudgetEntryType,
} from "@fihadj/shared-types";
import type { Response } from "express";
import { PrismaService } from "../common/prisma/prisma.service";
import { EditionsService } from "../editions/editions.service";
import { AuditService } from "../common/audit/audit.service";
import { ApiZodBody, ZBody } from "../common/zod/zod";
import { CurrentUser, RequireModule, type AuthenticatedUser } from "../common/decorators/auth.decorators";
import { csvFileName, toCsv } from "../common/csv";

@Injectable()
export class BudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly editions: EditionsService,
    private readonly audit: AuditService,
  ) {}

  async findAll(editionId?: string, type?: BudgetEntryType) {
    const edition = await this.editions.resolve(editionId);
    return this.prisma.budgetEntry.findMany({
      where: { editionId: edition.id, ...(type && { type }) },
      include: { createdBy: { select: { id: true, fullName: true } } },
      orderBy: { date: "desc" },
    });
  }

  /**
   * Synthèse budgétaire. Les montants sont en `Decimal` côté base pour éviter les
   * arrondis flottants ; on ne repasse en `number` qu'au tout dernier moment,
   * pour la sérialisation JSON.
   */
  async summary(editionId?: string) {
    const edition = await this.editions.resolve(editionId);
    const entries = await this.prisma.budgetEntry.findMany({
      where: { editionId: edition.id },
      select: { type: true, category: true, amount: true, currency: true },
    });

    const totalIncome = entries
      .filter((e) => e.type === "RECETTE")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalExpense = entries
      .filter((e) => e.type === "DEPENSE")
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const grouped = new Map<string, { type: BudgetEntryType; category: string; amount: number }>();
    for (const entry of entries) {
      const key = `${entry.type}::${entry.category}`;
      const current = grouped.get(key);
      if (current) current.amount += Number(entry.amount);
      else
        grouped.set(key, {
          type: entry.type as BudgetEntryType,
          category: entry.category,
          amount: Number(entry.amount),
        });
    }

    return {
      currency: entries[0]?.currency ?? "XOF",
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      byCategory: [...grouped.values()].sort((a, b) => b.amount - a.amount),
    };
  }

  async create(input: BudgetEntryInput, actorId: string) {
    const edition = await this.editions.resolve(input.editionId);
    const entry = await this.prisma.budgetEntry.create({
      data: {
        type: input.type,
        category: input.category,
        label: input.label,
        amount: input.amount,
        currency: input.currency,
        date: new Date(input.date),
        editionId: edition.id,
        createdById: actorId,
      },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
    await this.audit.log({
      actorId,
      action: "budget.created",
      entity: "BudgetEntry",
      entityId: entry.id,
      metadata: { type: entry.type, label: entry.label, amount: Number(entry.amount) },
    });
    return entry;
  }

  async update(id: string, input: Partial<BudgetEntryInput>, actorId: string) {
    const { editionId: _ignored, date, ...rest } = input;
    const entry = await this.prisma.budgetEntry.update({
      where: { id },
      data: { ...rest, ...(date && { date: new Date(date) }) } as never,
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
    await this.audit.log({ actorId, action: "budget.updated", entity: "BudgetEntry", entityId: id });
    return entry;
  }

  async remove(id: string, actorId: string): Promise<void> {
    const entry = await this.prisma.budgetEntry.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: "budget.deleted",
      entity: "BudgetEntry",
      entityId: id,
      metadata: { label: entry.label, amount: Number(entry.amount) },
    });
  }

  async exportCsv(editionId?: string): Promise<string> {
    const rows = await this.findAll(editionId);
    return toCsv(rows, [
      { header: "Date", value: (r) => formatDateShort(r.date) },
      { header: "Nature", value: (r) => BUDGET_ENTRY_TYPE_LABELS[r.type as BudgetEntryType] },
      { header: "Poste", value: (r) => r.category },
      { header: "Libellé", value: (r) => r.label },
      { header: "Montant", value: (r) => formatMoney(Number(r.amount), r.currency) },
      { header: "Saisi par", value: (r) => r.createdBy?.fullName },
    ]);
  }
}

@ApiTags("budget")
@Controller()
export class BudgetController {
  constructor(private readonly budget: BudgetService) {}

  @RequireModule("budget")
  @Get("budget-entries")
  @ApiQuery({ name: "editionId", required: false })
  @ApiQuery({ name: "type", required: false, enum: ["RECETTE", "DEPENSE"] })
  findAll(@Query("editionId") editionId?: string, @Query("type") type?: BudgetEntryType) {
    return this.budget.findAll(editionId, type);
  }

  @RequireModule("budget")
  @Get("budget/summary")
  @ApiOperation({ summary: "Recettes, dépenses, solde et ventilation par poste" })
  summary(@Query("editionId") editionId?: string) {
    return this.budget.summary(editionId);
  }

  @RequireModule("budget")
  @Get("budget/export")
  async export(@Query("editionId") editionId: string | undefined, @Res() res: Response) {
    const csv = await this.budget.exportCsv(editionId);
    res
      .status(200)
      .setHeader("Content-Type", "text/csv; charset=utf-8")
      .setHeader("Content-Disposition", `attachment; filename="${csvFileName("budget")}"`)
      .send(csv);
  }

  @RequireModule("budget")
  @Post("budget-entries")
  @ApiZodBody(budgetEntrySchema)
  create(@ZBody(budgetEntrySchema) dto: never, @CurrentUser() user: AuthenticatedUser) {
    return this.budget.create(dto, user.id);
  }

  @RequireModule("budget")
  @Patch("budget-entries/:id")
  @ApiZodBody(budgetEntrySchema.partial())
  update(
    @Param("id") id: string,
    @ZBody(budgetEntrySchema.partial()) dto: never,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.budget.update(id, dto, user.id);
  }

  @RequireModule("budget")
  @Delete("budget-entries/:id")
  @HttpCode(204)
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.budget.remove(id, user.id);
  }
}

@Module({
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule {}
