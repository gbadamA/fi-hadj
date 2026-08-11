import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import {
  expectedResultSchema,
  impactProjectionSchema,
  objectiveSchema,
  orgChartMemberSchema,
  prizeSchema,
  programItemSchema,
  promoterSchema,
  subThemeSchema,
  targetCategorySchema,
} from "@fihadj/shared-types";
import { ApiZodBody, ZBody } from "../common/zod/zod";
import { Public, RequireModule } from "../common/decorators/auth.decorators";
import { ContentService } from "./content.service";

/** `?editionId=` optionnel sur toutes les lectures publiques. */
const EditionQuery = ApiQuery({
  name: "editionId",
  required: false,
  description: "Édition ciblée. Par défaut : l'édition courante.",
});

@ApiTags("contenu")
@Controller()
export class HomeController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get("home")
  @EditionQuery
  @ApiOperation({
    summary: "Tout le contenu de la page d'accueil en une requête",
    description:
      "Agrège édition, promoteurs, objectifs, résultats, thème, programme, distinctions, " +
      "cibles, projections, organigramme et sponsors.",
  })
  home(@Query("editionId") editionId?: string) {
    return this.content.homeBundle(editionId);
  }
}

@ApiTags("contenu")
@Controller("promoters")
export class PromotersController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get()
  findAll() {
    return this.content.listPromoters();
  }

  @RequireModule("contenu")
  @Post()
  @ApiZodBody(promoterSchema)
  create(@ZBody(promoterSchema) dto: never) {
    return this.content.createPromoter(dto);
  }

  @RequireModule("contenu")
  @Patch(":id")
  @ApiZodBody(promoterSchema.partial())
  update(@Param("id") id: string, @ZBody(promoterSchema.partial()) dto: never) {
    return this.content.updatePromoter(id, dto);
  }

  @RequireModule("contenu")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    return this.content.deletePromoter(id);
  }
}

@ApiTags("contenu")
@Controller("objectives")
export class ObjectivesController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get()
  @EditionQuery
  findAll(@Query("editionId") editionId?: string) {
    return this.content.listObjectives(editionId);
  }

  @RequireModule("contenu")
  @Post()
  @ApiZodBody(objectiveSchema)
  create(@ZBody(objectiveSchema) dto: never) {
    return this.content.createObjective(dto);
  }

  @RequireModule("contenu")
  @Patch(":id")
  @ApiZodBody(objectiveSchema.partial())
  update(@Param("id") id: string, @ZBody(objectiveSchema.partial()) dto: never) {
    return this.content.updateObjective(id, dto);
  }

  @RequireModule("contenu")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    return this.content.deleteObjective(id);
  }
}

@ApiTags("contenu")
@Controller("expected-results")
export class ExpectedResultsController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get()
  @EditionQuery
  findAll(@Query("editionId") editionId?: string) {
    return this.content.listExpectedResults(editionId);
  }

  @RequireModule("contenu")
  @Post()
  @ApiZodBody(expectedResultSchema)
  create(@ZBody(expectedResultSchema) dto: never) {
    return this.content.createExpectedResult(dto);
  }

  @RequireModule("contenu")
  @Patch(":id")
  @ApiZodBody(expectedResultSchema.partial())
  update(@Param("id") id: string, @ZBody(expectedResultSchema.partial()) dto: never) {
    return this.content.updateExpectedResult(id, dto);
  }

  @RequireModule("contenu")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    return this.content.deleteExpectedResult(id);
  }
}

const themeSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(2000).optional(),
  editionId: z.string().uuid().optional(),
});

@ApiTags("contenu")
@Controller("themes")
export class ThemesController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get()
  @EditionQuery
  @ApiOperation({ summary: "Thème général et ses 4 sous-thèmes" })
  find(@Query("editionId") editionId?: string) {
    return this.content.getTheme(editionId);
  }

  @RequireModule("contenu")
  @Post()
  @ApiZodBody(themeSchema)
  upsert(@ZBody(themeSchema) dto: never) {
    return this.content.upsertTheme(dto);
  }
}

@ApiTags("contenu")
@Controller("sub-themes")
export class SubThemesController {
  constructor(private readonly content: ContentService) {}

  @RequireModule("contenu")
  @Post()
  @ApiZodBody(subThemeSchema)
  create(@ZBody(subThemeSchema.extend({ editionId: z.string().uuid().optional() })) dto: never) {
    return this.content.createSubTheme(dto);
  }

  @RequireModule("contenu")
  @Patch(":id")
  @ApiZodBody(subThemeSchema.partial())
  update(@Param("id") id: string, @ZBody(subThemeSchema.partial()) dto: never) {
    return this.content.updateSubTheme(id, dto);
  }

  @RequireModule("contenu")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    return this.content.deleteSubTheme(id);
  }
}

@ApiTags("contenu")
@Controller("program-items")
export class ProgramItemsController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get()
  @EditionQuery
  findAll(@Query("editionId") editionId?: string) {
    return this.content.listProgramItems(editionId);
  }

  @RequireModule("programme")
  @Post()
  @ApiZodBody(programItemSchema)
  create(@ZBody(programItemSchema) dto: never) {
    return this.content.createProgramItem(dto);
  }

  @RequireModule("programme")
  @Patch(":id")
  @ApiZodBody(programItemSchema.partial())
  update(@Param("id") id: string, @ZBody(programItemSchema.partial()) dto: never) {
    return this.content.updateProgramItem(id, dto);
  }

  @RequireModule("programme")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    return this.content.deleteProgramItem(id);
  }
}

@ApiTags("contenu")
@Controller("prizes")
export class PrizesController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get()
  @EditionQuery
  @ApiOperation({ summary: "Distinctions remises lors du dîner-gala" })
  findAll(@Query("editionId") editionId?: string) {
    return this.content.listPrizes(editionId);
  }

  @RequireModule("sponsors")
  @Post()
  @ApiZodBody(prizeSchema)
  create(@ZBody(prizeSchema) dto: never) {
    return this.content.createPrize(dto);
  }

  @RequireModule("sponsors")
  @Patch(":id")
  @ApiZodBody(prizeSchema.partial())
  update(@Param("id") id: string, @ZBody(prizeSchema.partial()) dto: never) {
    return this.content.updatePrize(id, dto);
  }

  @RequireModule("sponsors")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    return this.content.deletePrize(id);
  }
}

@ApiTags("contenu")
@Controller("target-categories")
export class TargetCategoriesController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get()
  findAll() {
    return this.content.listTargetCategories();
  }

  @RequireModule("contenu")
  @Post()
  @ApiZodBody(targetCategorySchema)
  create(@ZBody(targetCategorySchema) dto: never) {
    return this.content.createTargetCategory(dto);
  }

  @RequireModule("contenu")
  @Patch(":id")
  @ApiZodBody(targetCategorySchema.partial())
  update(@Param("id") id: string, @ZBody(targetCategorySchema.partial()) dto: never) {
    return this.content.updateTargetCategory(id, dto);
  }

  @RequireModule("contenu")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    return this.content.deleteTargetCategory(id);
  }
}

@ApiTags("contenu")
@Controller("impact-projections")
export class ImpactProjectionsController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Tableau des projections d'impact (2025-2028)" })
  findAll() {
    return this.content.listImpactProjections();
  }

  @RequireModule("contenu")
  @Post()
  @ApiZodBody(impactProjectionSchema)
  upsert(@ZBody(impactProjectionSchema) dto: never) {
    return this.content.upsertImpactProjection(dto);
  }

  @RequireModule("contenu")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    return this.content.deleteImpactProjection(id);
  }
}

@ApiTags("contenu")
@Controller("org-chart")
export class OrgChartController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get()
  @EditionQuery
  @ApiOperation({ summary: "Organigramme du Commissariat Général" })
  findAll(@Query("editionId") editionId?: string) {
    return this.content.listOrgChart(editionId);
  }

  @RequireModule("organigramme")
  @Post()
  @ApiZodBody(orgChartMemberSchema)
  create(@ZBody(orgChartMemberSchema.extend({ editionId: z.string().uuid().optional() })) dto: never) {
    return this.content.createOrgChartMember(dto);
  }

  @RequireModule("organigramme")
  @Patch(":id")
  @ApiZodBody(orgChartMemberSchema.partial())
  update(@Param("id") id: string, @ZBody(orgChartMemberSchema.partial()) dto: never) {
    return this.content.updateOrgChartMember(id, dto);
  }

  @RequireModule("organigramme")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    return this.content.deleteOrgChartMember(id);
  }
}

const siteContentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1),
});

@ApiTags("contenu")
@Controller("site-content")
export class SiteContentController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Blocs de texte libres (contexte, mentions légales, contact…)" })
  findAll() {
    return this.content.listSiteContent();
  }

  @Public()
  @Get(":key")
  findOne(@Param("key") key: string) {
    return this.content.getSiteContent(key);
  }

  @RequireModule("contenu")
  @Put(":key")
  @ApiZodBody(siteContentSchema)
  upsert(@Param("key") key: string, @ZBody(siteContentSchema) dto: never) {
    return this.content.upsertSiteContent(key, dto);
  }
}
