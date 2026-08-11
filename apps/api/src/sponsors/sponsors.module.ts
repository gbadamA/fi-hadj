import { Controller, Delete, Get, HttpCode, Injectable, Module, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { sponsorSchema, type SponsorInput, type SponsorLevel } from "@fihadj/shared-types";
import { PrismaService } from "../common/prisma/prisma.service";
import { EditionsService } from "../editions/editions.service";
import { AuditService } from "../common/audit/audit.service";
import { ApiZodBody, ZBody } from "../common/zod/zod";
import {
  CurrentUser,
  Public,
  RequireModule,
  type AuthenticatedUser,
} from "../common/decorators/auth.decorators";

/**
 * Ordre d'affichage des niveaux de sponsoring. L'ordre alphabétique de l'enum
 * placerait « ARGENT » avant « PLATINE », ce qui inverserait la hiérarchie sur
 * le mur des partenaires.
 */
const LEVEL_RANK: Record<SponsorLevel, number> = {
  PLATINE: 0,
  OR: 1,
  ARGENT: 2,
  BRONZE: 3,
  PARTENAIRE: 4,
};

@Injectable()
export class SponsorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly editions: EditionsService,
    private readonly audit: AuditService,
  ) {}

  async findAll(editionId?: string) {
    const edition = await this.editions.resolve(editionId);
    const sponsors = await this.prisma.sponsor.findMany({
      where: { editionId: edition.id },
      orderBy: { order: "asc" },
    });
    return sponsors.sort(
      (a, b) =>
        LEVEL_RANK[a.level as SponsorLevel] - LEVEL_RANK[b.level as SponsorLevel] ||
        a.order - b.order,
    );
  }

  async create(input: SponsorInput, actorId: string) {
    const edition = await this.editions.resolve(input.editionId);
    const { editionId: _ignored, ...data } = input;
    const sponsor = await this.prisma.sponsor.create({
      data: { ...data, editionId: edition.id } as never,
    });
    await this.audit.log({
      actorId,
      action: "sponsor.created",
      entity: "Sponsor",
      entityId: sponsor.id,
      metadata: { name: sponsor.name, level: sponsor.level },
    });
    return sponsor;
  }

  async update(id: string, input: Partial<SponsorInput>, actorId: string) {
    const { editionId: _ignored, ...data } = input;
    const sponsor = await this.prisma.sponsor.update({ where: { id }, data: data as never });
    await this.audit.log({ actorId, action: "sponsor.updated", entity: "Sponsor", entityId: id });
    return sponsor;
  }

  async remove(id: string, actorId: string): Promise<void> {
    await this.prisma.sponsor.delete({ where: { id } });
    await this.audit.log({ actorId, action: "sponsor.deleted", entity: "Sponsor", entityId: id });
  }
}

@ApiTags("sponsors")
@Controller("sponsors")
export class SponsorsController {
  constructor(private readonly sponsors: SponsorsService) {}

  @Public()
  @Get()
  @ApiQuery({ name: "editionId", required: false })
  @ApiOperation({ summary: "Sponsors et partenaires, classés par niveau" })
  findAll(@Query("editionId") editionId?: string) {
    return this.sponsors.findAll(editionId);
  }

  @RequireModule("sponsors")
  @Post()
  @ApiZodBody(sponsorSchema)
  create(@ZBody(sponsorSchema) dto: never, @CurrentUser() user: AuthenticatedUser) {
    return this.sponsors.create(dto, user.id);
  }

  @RequireModule("sponsors")
  @Patch(":id")
  @ApiZodBody(sponsorSchema.partial())
  update(
    @Param("id") id: string,
    @ZBody(sponsorSchema.partial()) dto: never,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sponsors.update(id, dto, user.id);
  }

  @RequireModule("sponsors")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.sponsors.remove(id, user.id);
  }
}

@Module({
  controllers: [SponsorsController],
  providers: [SponsorsService],
  exports: [SponsorsService],
})
export class SponsorsModule {}
