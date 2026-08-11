import { Injectable, NotFoundException } from "@nestjs/common";
import type { Edition } from "@prisma/client";
import type { EditionInput } from "@fihadj/shared-types";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class EditionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Edition[]> {
    return this.prisma.edition.findMany({ orderBy: { year: "desc" } });
  }

  async findCurrent(): Promise<Edition> {
    const edition =
      (await this.prisma.edition.findFirst({ where: { isCurrent: true } })) ??
      // Repli : si personne n'a coché « édition courante », on prend la plus
      // récente plutôt que de laisser le site public vide.
      (await this.prisma.edition.findFirst({ orderBy: { year: "desc" } }));
    if (!edition) throw new NotFoundException("Aucune édition n'est encore configurée");
    return edition;
  }

  /**
   * Résout l'édition à utiliser : celle demandée, sinon l'édition courante.
   * Tous les modules rattachés à une édition passent par ici — c'est ce qui rend
   * le multi-édition transparent pour les contrôleurs.
   */
  async resolve(editionId?: string | null): Promise<Edition> {
    if (!editionId) return this.findCurrent();
    const edition = await this.prisma.edition.findUnique({ where: { id: editionId } });
    if (!edition) throw new NotFoundException("Édition introuvable");
    return edition;
  }

  findOne(id: string): Promise<Edition> {
    return this.prisma.edition.findUniqueOrThrow({ where: { id } });
  }

  async create(input: EditionInput): Promise<Edition> {
    const edition = await this.prisma.edition.create({
      data: {
        year: input.year,
        title: input.title,
        theme: input.theme,
        venue: input.venue,
        city: input.city,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        registrationOpen: input.registrationOpen,
        heroSubtitle: input.heroSubtitle || null,
      },
    });
    if (input.isCurrent) await this.setCurrent(edition.id);
    return this.prisma.edition.findUniqueOrThrow({ where: { id: edition.id } });
  }

  async update(id: string, input: Partial<EditionInput>): Promise<Edition> {
    const edition = await this.prisma.edition.update({
      where: { id },
      data: this.toData(input),
    });
    if (input.isCurrent) await this.setCurrent(id);
    return this.prisma.edition.findUniqueOrThrow({ where: { id: edition.id } });
  }

  /** Une seule édition courante : la bascule est atomique. */
  async setCurrent(id: string): Promise<Edition> {
    return this.prisma.$transaction(async (tx) => {
      await tx.edition.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
      return tx.edition.update({ where: { id }, data: { isCurrent: true } });
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.edition.delete({ where: { id } });
  }

  private toData(input: Partial<EditionInput>) {
    return {
      ...(input.year !== undefined && { year: input.year }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.theme !== undefined && { theme: input.theme }),
      ...(input.venue !== undefined && { venue: input.venue }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.startDate !== undefined && { startDate: new Date(input.startDate) }),
      ...(input.endDate !== undefined && { endDate: new Date(input.endDate) }),
      ...(input.registrationOpen !== undefined && { registrationOpen: input.registrationOpen }),
      ...(input.heroSubtitle !== undefined && { heroSubtitle: input.heroSubtitle || null }),
    };
  }
}
