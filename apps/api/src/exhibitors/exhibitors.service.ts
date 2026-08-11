import { Injectable } from "@nestjs/common";
import type { ExhibitorInput } from "@fihadj/shared-types";
import { STAND_STATUS_LABELS, formatMoney, type StandStatus } from "@fihadj/shared-types";
import { PrismaService } from "../common/prisma/prisma.service";
import { EditionsService } from "../editions/editions.service";
import { AuditService } from "../common/audit/audit.service";
import { toCsv } from "../common/csv";

@Injectable()
export class ExhibitorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly editions: EditionsService,
    private readonly audit: AuditService,
  ) {}

  async findAll(editionId?: string, status?: StandStatus) {
    const edition = await this.editions.resolve(editionId);
    return this.prisma.exhibitor.findMany({
      where: { editionId: edition.id, ...(status && { standStatus: status }) },
      include: { registration: true },
      orderBy: [{ standNumber: "asc" }, { companyName: "asc" }],
    });
  }

  /** Liste réduite pour le site public : seuls les exposants effectivement présents. */
  async findPublic(editionId?: string) {
    const edition = await this.editions.resolve(editionId);
    return this.prisma.exhibitor.findMany({
      where: { editionId: edition.id, standStatus: { in: ["ATTRIBUE", "PAYE"] } },
      select: {
        id: true,
        companyName: true,
        activitySector: true,
        logoUrl: true,
        standNumber: true,
      },
      orderBy: { companyName: "asc" },
    });
  }

  findOne(id: string) {
    return this.prisma.exhibitor.findUniqueOrThrow({
      where: { id },
      include: { registration: true },
    });
  }

  async create(input: ExhibitorInput, actorId: string) {
    const edition = await this.editions.resolve(input.editionId);
    const exhibitor = await this.prisma.exhibitor.create({
      data: { ...this.toData(input), editionId: edition.id } as never,
    });
    await this.audit.log({
      actorId,
      action: "exhibitor.created",
      entity: "Exhibitor",
      entityId: exhibitor.id,
      metadata: { companyName: exhibitor.companyName },
    });
    return exhibitor;
  }

  async update(id: string, input: Partial<ExhibitorInput>, actorId: string) {
    const exhibitor = await this.prisma.exhibitor.update({
      where: { id },
      data: this.toData(input) as never,
    });
    await this.audit.log({
      actorId,
      action: "exhibitor.updated",
      entity: "Exhibitor",
      entityId: id,
      metadata: { standNumber: exhibitor.standNumber, standStatus: exhibitor.standStatus },
    });
    return exhibitor;
  }

  async remove(id: string, actorId: string): Promise<void> {
    await this.prisma.exhibitor.delete({ where: { id } });
    await this.audit.log({ actorId, action: "exhibitor.deleted", entity: "Exhibitor", entityId: id });
  }

  /**
   * Taux de remplissage des stands (cahier §5.7). `totalStands` est le nombre de
   * fiches exposant ouvertes, pas une capacité théorique du site : la capacité
   * réelle du Palais de la Culture n'est pas dans le cahier.
   */
  async standStats(editionId?: string) {
    const edition = await this.editions.resolve(editionId);
    const exhibitors = await this.prisma.exhibitor.findMany({
      where: { editionId: edition.id },
      select: { standStatus: true, standFee: true, paidAmount: true },
    });
    const total = exhibitors.length;
    const assigned = exhibitors.filter((e) => e.standStatus === "ATTRIBUE" || e.standStatus === "PAYE").length;
    const paid = exhibitors.filter((e) => e.standStatus === "PAYE").length;
    const billed = exhibitors.reduce((sum, e) => sum + Number(e.standFee), 0);
    const collected = exhibitors.reduce((sum, e) => sum + Number(e.paidAmount), 0);
    return {
      total,
      assigned,
      paid,
      fillRate: total === 0 ? 0 : Math.round((assigned / total) * 100),
      billed,
      collected,
      outstanding: billed - collected,
    };
  }

  async exportCsv(editionId?: string): Promise<string> {
    const rows = await this.findAll(editionId);
    return toCsv(rows, [
      { header: "Stand", value: (r) => r.standNumber },
      { header: "Raison sociale", value: (r) => r.companyName },
      { header: "Secteur d'activité", value: (r) => r.activitySector },
      { header: "Contact", value: (r) => r.contactName },
      { header: "Email", value: (r) => r.contactEmail },
      { header: "Téléphone", value: (r) => r.contactPhone },
      { header: "Statut", value: (r) => STAND_STATUS_LABELS[r.standStatus as StandStatus] },
      { header: "Montant dû", value: (r) => formatMoney(Number(r.standFee)) },
      { header: "Montant réglé", value: (r) => formatMoney(Number(r.paidAmount)) },
      { header: "Reste à percevoir", value: (r) => formatMoney(Number(r.standFee) - Number(r.paidAmount)) },
      { header: "Référence d'inscription", value: (r) => r.registration?.reference },
    ]);
  }

  private toData(input: Partial<ExhibitorInput>) {
    const { editionId: _ignored, registrationId, ...rest } = input;
    return {
      ...rest,
      ...(registrationId !== undefined && { registrationId: registrationId || null }),
      // Un numéro vide doit rester NULL : la contrainte unique (édition, stand)
      // rejetterait deux chaînes vides comme un doublon.
      ...(rest.standNumber !== undefined && { standNumber: rest.standNumber || null }),
    };
  }
}
