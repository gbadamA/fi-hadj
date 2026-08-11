import { Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { z } from "zod";
import {
  PAYMENT_STATUSES,
  registrationQuerySchema,
  registrationSchema,
  registrationStatusUpdateSchema,
} from "@fihadj/shared-types";
import type { Response } from "express";
import { ApiZodBody, ApiZodQuery, ZBody, ZQuery } from "../common/zod/zod";
import {
  CurrentUser,
  Public,
  RequireModule,
  type AuthenticatedUser,
} from "../common/decorators/auth.decorators";
import { csvFileName } from "../common/csv";
import { RegistrationsService, type RegistrationQuery } from "./registrations.service";

const paymentUpdateSchema = z.object({ paymentStatus: z.enum(PAYMENT_STATUSES) });

@ApiTags("inscriptions")
@Controller("registrations")
export class RegistrationsController {
  constructor(private readonly registrations: RegistrationsService) {}

  @Public()
  // Formulaire public : 5 envois par heure et par IP. Assez pour corriger une
  // erreur de saisie, trop peu pour noyer la base sous des inscriptions factices.
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @Post()
  @ApiOperation({ summary: "Inscription publique (participant, exposant ou sponsor)" })
  @ApiZodBody(registrationSchema)
  create(@ZBody(registrationSchema) dto: never) {
    return this.registrations.create(dto);
  }

  @Public()
  @Get("verify/:reference")
  @ApiOperation({
    summary: "Vérifie un badge par sa référence",
    description: "Cible du QR code imprimé sur le badge — utilisée au contrôle d'accès.",
  })
  verify(@Param("reference") reference: string) {
    return this.registrations.findByReference(reference);
  }

  @RequireModule("inscriptions")
  @Get()
  @ApiOperation({ summary: "Liste paginée et filtrable des inscriptions" })
  @ApiZodQuery(registrationQuerySchema)
  findAll(@ZQuery(registrationQuerySchema) query: RegistrationQuery) {
    return this.registrations.findAll(query);
  }

  @RequireModule("inscriptions")
  @Get("export")
  @ApiOperation({ summary: "Export CSV (séparateur « ; », BOM UTF-8 pour Excel)" })
  async export(
    @Query("type") type: string | undefined,
    @Query("status") status: string | undefined,
    @Query("editionId") editionId: string | undefined,
    @Res() res: Response,
  ) {
    const csv = await this.registrations.exportCsv({
      type: type as never,
      status: status as never,
      editionId,
    });
    res
      .status(200)
      .setHeader("Content-Type", "text/csv; charset=utf-8")
      .setHeader("Content-Disposition", `attachment; filename="${csvFileName("inscriptions")}"`)
      .send(csv);
  }

  @RequireModule("inscriptions")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.registrations.findOne(id);
  }

  @RequireModule("inscriptions")
  @Get(":id/badge")
  @ApiOperation({ summary: "Badge PDF avec QR code (inscription validée uniquement)" })
  async badge(@Param("id") id: string, @Res() res: Response) {
    const { pdf, registration } = await this.registrations.badge(id);
    res
      .status(200)
      .setHeader("Content-Type", "application/pdf")
      .setHeader(
        "Content-Disposition",
        `inline; filename="badge-${registration.reference}.pdf"`,
      )
      .send(pdf);
  }

  @RequireModule("inscriptions")
  @Patch(":id/status")
  @ApiOperation({
    summary: "Valide ou rejette une inscription",
    description: "La validation génère le badge et l'envoie par email à l'inscrit.",
  })
  @ApiZodBody(registrationStatusUpdateSchema)
  updateStatus(
    @Param("id") id: string,
    @ZBody(registrationStatusUpdateSchema) dto: never,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registrations.updateStatus(id, dto, user.id);
  }

  @RequireModule("inscriptions")
  @Patch(":id/payment")
  @ApiZodBody(paymentUpdateSchema)
  updatePayment(
    @Param("id") id: string,
    @ZBody(paymentUpdateSchema) dto: { paymentStatus: never },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registrations.updatePayment(id, dto.paymentStatus, user.id);
  }

  @RequireModule("inscriptions")
  @Post("reminders")
  @ApiOperation({ summary: "Envoie un rappel à tous les inscrits validés" })
  sendReminders(
    @Query("editionId") editionId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registrations.sendReminders(editionId, user.id);
  }

  @RequireModule("inscriptions")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.registrations.remove(id, user.id);
  }
}
