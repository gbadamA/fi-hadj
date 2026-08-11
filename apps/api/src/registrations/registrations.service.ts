import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Edition, Prisma, Registration } from "@prisma/client";
import {
  CIVILITY_LABELS,
  PAYMENT_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_TYPE_LABELS,
  buildRegistrationReference,
  canRegister,
  formatDateTime,
  isEditionPast,
  type Civility,
  type PaymentStatus,
  type RegistrationInput,
  type RegistrationStatus,
  type RegistrationType,
} from "@fihadj/shared-types";
import { PrismaService } from "../common/prisma/prisma.service";
import { EditionsService } from "../editions/editions.service";
import { MailService } from "../mail/mail.service";
import { AuditService } from "../common/audit/audit.service";
import { BadgeService } from "./badge.service";
import { toCsv } from "../common/csv";

export interface RegistrationQuery {
  type?: RegistrationType;
  status?: RegistrationStatus;
  paymentStatus?: PaymentStatus;
  editionId?: string;
  search?: string;
  page: number;
  pageSize: number;
}

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly editions: EditionsService,
    private readonly mail: MailService,
    private readonly badges: BadgeService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Inscription publique.
   *
   * La référence doit être séquentielle par édition ET par type. Deux formulaires
   * envoyés à la même seconde calculeraient le même numéro : on sérialise donc
   * l'attribution avec un verrou consultatif Postgres, pris pour la durée de la
   * transaction et portant sur le couple (édition, type). C'est plus léger qu'un
   * SELECT … FOR UPDATE sur toute la table, et ça n'affecte pas les autres types.
   */
  async create(input: RegistrationInput): Promise<Registration> {
    const edition = await this.editions.findCurrent();
    // Même règle que le site (`canRegister` de @fihadj/shared-types) : l'interrupteur
    // ET la date. Le front masque déjà le formulaire, mais un POST direct doit être
    // refusé lui aussi — republier une ancienne édition ne doit pas rouvrir les
    // inscriptions d'un forum déjà tenu.
    if (!canRegister(edition)) {
      throw new BadRequestException(
        isEditionPast(edition)
          ? "Cette édition du forum est terminée : les inscriptions ne sont plus possibles."
          : "Les inscriptions sont closes pour cette édition.",
      );
    }

    const registration = await this.prisma.$transaction(async (tx) => {
      const lockKey = `${edition.id}:${input.type}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const last = await tx.registration.findFirst({
        where: { editionId: edition.id, type: input.type },
        orderBy: { sequence: "desc" },
        select: { sequence: true },
      });
      const sequence = (last?.sequence ?? 0) + 1;

      return tx.registration.create({
        data: {
          editionId: edition.id,
          reference: buildRegistrationReference(edition.year, input.type, sequence),
          sequence,
          type: input.type,
          civility: input.civility,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email.toLowerCase(),
          phone: input.phone,
          country: input.country,
          organization: input.organization || null,
          position: input.position || null,
          targetCategoryId: input.targetCategoryId || null,
          message: input.message || null,
          activitySector: "activitySector" in input ? input.activitySector : null,
          standSize: "standSize" in input ? input.standSize || null : null,
          websiteUrl: "websiteUrl" in input ? input.websiteUrl || null : null,
          sponsorLevel: "sponsorLevel" in input ? input.sponsorLevel : null,
          // Un participant n'est pas facturé ; exposants et sponsors le sont.
          paymentStatus: input.type === "PARTICIPANT" ? "NON_APPLICABLE" : "EN_ATTENTE",
        },
      });
    });

    // Une fiche exposant est ouverte immédiatement : le Responsable Expositions
    // doit pouvoir attribuer un stand sans attendre la validation.
    if (registration.type === "EXPOSANT") {
      await this.prisma.exhibitor.create({
        data: {
          editionId: edition.id,
          registrationId: registration.id,
          companyName: registration.organization ?? `${registration.firstName} ${registration.lastName}`,
          activitySector: registration.activitySector ?? "Non précisé",
          contactName: `${registration.firstName} ${registration.lastName}`,
          contactEmail: registration.email,
          contactPhone: registration.phone,
        },
      });
    }

    await this.mail.sendRegistrationReceived(registration, edition);
    await this.audit.log({
      action: "registration.created",
      entity: "Registration",
      entityId: registration.id,
      metadata: { reference: registration.reference, type: registration.type },
    });
    return registration;
  }

  async findAll(query: RegistrationQuery) {
    const edition = await this.editions.resolve(query.editionId);
    const where: Prisma.RegistrationWhereInput = {
      editionId: edition.id,
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
      ...(query.paymentStatus && { paymentStatus: query.paymentStatus }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: "insensitive" } },
          { lastName: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
          { organization: { contains: query.search, mode: "insensitive" } },
          { reference: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        include: { targetCategory: true, exhibitor: true },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.registration.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: { targetCategory: true, exhibitor: true, edition: true, reviewedBy: true },
    });
    if (!registration) throw new NotFoundException("Inscription introuvable");
    return registration;
  }

  /** Vérification publique d'un badge par sa référence (cible du QR code). */
  async findByReference(reference: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { reference: reference.toUpperCase() },
      include: { edition: true },
    });
    if (!registration) throw new NotFoundException("Référence inconnue");
    return {
      reference: registration.reference,
      valid: registration.status === "VALIDE",
      status: registration.status,
      type: registration.type,
      holder: `${CIVILITY_LABELS[registration.civility as Civility]} ${registration.firstName} ${registration.lastName.toUpperCase()}`,
      organization: registration.organization,
      edition: { year: registration.edition.year, title: registration.edition.title },
    };
  }

  /**
   * Validation ou rejet. La validation produit le badge et l'envoie par email :
   * séparer les deux gestes garantirait tôt ou tard des inscrits validés sans badge.
   */
  async updateStatus(
    id: string,
    dto: { status: RegistrationStatus; paymentStatus?: PaymentStatus; reason?: string },
    actorId: string,
  ) {
    const existing = await this.prisma.registration.findUnique({
      where: { id },
      include: { edition: true },
    });
    if (!existing) throw new NotFoundException("Inscription introuvable");
    if (dto.status === "REJETE" && !dto.reason?.trim()) {
      throw new BadRequestException("Un motif est requis pour rejeter une inscription.");
    }

    const registration = await this.prisma.registration.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.paymentStatus && { paymentStatus: dto.paymentStatus }),
        reviewReason: dto.reason?.trim() || null,
        reviewedById: actorId,
        reviewedAt: new Date(),
        ...(dto.status === "VALIDE" && { badgeIssuedAt: new Date() }),
      },
    });

    if (dto.status === "VALIDE") {
      const badge = await this.badges.generate(registration, existing.edition);
      await this.mail.sendRegistrationValidated(registration, existing.edition, badge);
    } else if (dto.status === "REJETE") {
      await this.mail.sendRegistrationRejected(
        registration,
        existing.edition,
        dto.reason ?? null,
      );
    }

    await this.audit.log({
      actorId,
      action: `registration.${dto.status.toLowerCase()}`,
      entity: "Registration",
      entityId: id,
      metadata: { reference: registration.reference, reason: dto.reason ?? null },
    });
    return registration;
  }

  async updatePayment(id: string, paymentStatus: PaymentStatus, actorId: string) {
    const registration = await this.prisma.registration.update({
      where: { id },
      data: { paymentStatus },
    });
    await this.audit.log({
      actorId,
      action: "registration.payment_updated",
      entity: "Registration",
      entityId: id,
      metadata: { paymentStatus },
    });
    return registration;
  }

  async badge(id: string): Promise<{ pdf: Buffer; registration: Registration }> {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: { edition: true },
    });
    if (!registration) throw new NotFoundException("Inscription introuvable");
    if (registration.status !== "VALIDE") {
      throw new BadRequestException(
        "Le badge n'est délivré qu'après validation de l'inscription.",
      );
    }
    const pdf = await this.badges.generate(registration, registration.edition);
    return { pdf, registration };
  }

  async remove(id: string, actorId: string): Promise<void> {
    const registration = await this.prisma.registration.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: "registration.deleted",
      entity: "Registration",
      entityId: id,
      metadata: { reference: registration.reference },
    });
  }

  /** Export destiné à Excel : une ligne par inscrit, tous champs utiles. */
  async exportCsv(query: Omit<RegistrationQuery, "page" | "pageSize">): Promise<string> {
    const edition = await this.editions.resolve(query.editionId);
    const rows = await this.prisma.registration.findMany({
      where: {
        editionId: edition.id,
        ...(query.type && { type: query.type }),
        ...(query.status && { status: query.status }),
        ...(query.paymentStatus && { paymentStatus: query.paymentStatus }),
      },
      include: { targetCategory: true, exhibitor: true },
      orderBy: [{ type: "asc" }, { sequence: "asc" }],
    });

    return toCsv(rows, [
      { header: "Référence", value: (r) => r.reference },
      { header: "Type", value: (r) => REGISTRATION_TYPE_LABELS[r.type as RegistrationType] },
      { header: "Civilité", value: (r) => CIVILITY_LABELS[r.civility as Civility] },
      { header: "Nom", value: (r) => r.lastName },
      { header: "Prénom", value: (r) => r.firstName },
      { header: "Email", value: (r) => r.email },
      { header: "Téléphone", value: (r) => r.phone },
      { header: "Pays", value: (r) => r.country },
      { header: "Organisation", value: (r) => r.organization },
      { header: "Fonction", value: (r) => r.position },
      { header: "Catégorie de cible", value: (r) => r.targetCategory?.name },
      { header: "Secteur d'activité", value: (r) => r.activitySector },
      { header: "Stand", value: (r) => r.exhibitor?.standNumber },
      { header: "Niveau de sponsoring", value: (r) => r.sponsorLevel },
      { header: "Statut", value: (r) => REGISTRATION_STATUS_LABELS[r.status as RegistrationStatus] },
      {
        header: "Paiement",
        value: (r) => PAYMENT_STATUS_LABELS[r.paymentStatus as PaymentStatus],
      },
      { header: "Inscrit le", value: (r) => formatDateTime(r.createdAt) },
    ]);
  }

  /**
   * Rappel avant l'ouverture, envoyé aux inscrits validés.
   * Déclenché manuellement depuis le back-office : mieux vaut un geste explicite
   * du Responsable Communication qu'un automatisme qui part au mauvais moment.
   */
  async sendReminders(editionId: string | undefined, actorId: string) {
    const edition: Edition = await this.editions.resolve(editionId);
    const days = Math.max(
      0,
      Math.ceil((edition.startDate.getTime() - Date.now()) / 86_400_000),
    );
    const recipients = await this.prisma.registration.findMany({
      where: { editionId: edition.id, status: "VALIDE" },
    });
    for (const recipient of recipients) {
      await this.mail.sendEventReminder(recipient, edition, days);
    }
    await this.audit.log({
      actorId,
      action: "registration.reminders_sent",
      entity: "Edition",
      entityId: edition.id,
      metadata: { count: recipients.length, days },
    });
    return { sent: recipients.length, days };
  }
}
