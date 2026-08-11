import { Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { exhibitorSchema, type StandStatus } from "@fihadj/shared-types";
import type { Response } from "express";
import { ApiZodBody, ZBody } from "../common/zod/zod";
import {
  CurrentUser,
  Public,
  RequireModule,
  type AuthenticatedUser,
} from "../common/decorators/auth.decorators";
import { csvFileName } from "../common/csv";
import { ExhibitorsService } from "./exhibitors.service";

@ApiTags("exposants")
@Controller("exhibitors")
export class ExhibitorsController {
  constructor(private readonly exhibitors: ExhibitorsService) {}

  @Public()
  @Get("public")
  @ApiQuery({ name: "editionId", required: false })
  @ApiOperation({ summary: "Exposants confirmés — alimente la page publique" })
  findPublic(@Query("editionId") editionId?: string) {
    return this.exhibitors.findPublic(editionId);
  }

  @RequireModule("exposants")
  @Get()
  @ApiQuery({ name: "editionId", required: false })
  @ApiQuery({ name: "status", required: false })
  findAll(@Query("editionId") editionId?: string, @Query("status") status?: StandStatus) {
    return this.exhibitors.findAll(editionId, status);
  }

  @RequireModule("exposants")
  @Get("stats")
  @ApiOperation({ summary: "Taux de remplissage et encaissements des stands" })
  stats(@Query("editionId") editionId?: string) {
    return this.exhibitors.standStats(editionId);
  }

  @RequireModule("exposants")
  @Get("export")
  async export(@Query("editionId") editionId: string | undefined, @Res() res: Response) {
    const csv = await this.exhibitors.exportCsv(editionId);
    res
      .status(200)
      .setHeader("Content-Type", "text/csv; charset=utf-8")
      .setHeader("Content-Disposition", `attachment; filename="${csvFileName("exposants")}"`)
      .send(csv);
  }

  @RequireModule("exposants")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.exhibitors.findOne(id);
  }

  @RequireModule("exposants")
  @Post()
  @ApiZodBody(exhibitorSchema)
  create(@ZBody(exhibitorSchema) dto: never, @CurrentUser() user: AuthenticatedUser) {
    return this.exhibitors.create(dto, user.id);
  }

  @RequireModule("exposants")
  @Patch(":id")
  @ApiZodBody(exhibitorSchema.partial())
  update(
    @Param("id") id: string,
    @ZBody(exhibitorSchema.partial()) dto: never,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.exhibitors.update(id, dto, user.id);
  }

  @RequireModule("exposants")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.exhibitors.remove(id, user.id);
  }
}
