import { Controller, Delete, Get, HttpCode, Injectable, Module, NotFoundException, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { articleSchema, slugify, type ArticleInput } from "@fihadj/shared-types";
import { PrismaService } from "../common/prisma/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { ApiZodBody, ZBody } from "../common/zod/zod";
import {
  CurrentUser,
  Public,
  RequireModule,
  type AuthenticatedUser,
} from "../common/decorators/auth.decorators";

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Le site public ne voit que les articles publiés et déjà datés. */
  findPublished(limit?: number) {
    return this.prisma.article.findMany({
      where: { status: "PUBLIE", publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverUrl: true,
        publishedAt: true,
      },
    });
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: { author: { select: { fullName: true } } },
    });
    if (!article || article.status !== "PUBLIE") throw new NotFoundException("Article introuvable");
    return article;
  }

  findAll() {
    return this.prisma.article.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { author: { select: { fullName: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.article.findUniqueOrThrow({ where: { id } });
  }

  async create(input: ArticleInput, actorId: string) {
    const article = await this.prisma.article.create({
      data: {
        ...this.toData(input),
        slug: input.slug || slugify(input.title),
        authorId: actorId,
      } as never,
    });
    await this.audit.log({
      actorId,
      action: "article.created",
      entity: "Article",
      entityId: article.id,
      metadata: { title: article.title },
    });
    return article;
  }

  async update(id: string, input: Partial<ArticleInput>, actorId: string) {
    const article = await this.prisma.article.update({
      where: { id },
      data: this.toData(input) as never,
    });
    await this.audit.log({ actorId, action: "article.updated", entity: "Article", entityId: id });
    return article;
  }

  async remove(id: string, actorId: string): Promise<void> {
    await this.prisma.article.delete({ where: { id } });
    await this.audit.log({ actorId, action: "article.deleted", entity: "Article", entityId: id });
  }

  private toData(input: Partial<ArticleInput>) {
    const { publishedAt, status, ...rest } = input;
    return {
      ...rest,
      ...(status !== undefined && { status }),
      // Publier sans date explicite = publier maintenant. Repasser en brouillon
      // efface la date, sinon l'article resterait visible dans les listes datées.
      ...(status === "PUBLIE" && { publishedAt: publishedAt ? new Date(publishedAt) : new Date() }),
      ...(status === "BROUILLON" && { publishedAt: null }),
    };
  }
}

@ApiTags("actualités")
@Controller("articles")
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Public()
  @Get("published")
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiOperation({ summary: "Articles publiés — fil d'actualités du site" })
  findPublished(@Query("limit") limit?: string) {
    return this.articles.findPublished(limit ? Number(limit) : undefined);
  }

  @Public()
  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.articles.findBySlug(slug);
  }

  @RequireModule("actualites")
  @Get()
  findAll() {
    return this.articles.findAll();
  }

  @RequireModule("actualites")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.articles.findOne(id);
  }

  @RequireModule("actualites")
  @Post()
  @ApiZodBody(articleSchema)
  create(@ZBody(articleSchema) dto: never, @CurrentUser() user: AuthenticatedUser) {
    return this.articles.create(dto, user.id);
  }

  @RequireModule("actualites")
  @Patch(":id")
  @ApiZodBody(articleSchema.partial())
  update(
    @Param("id") id: string,
    @ZBody(articleSchema.partial()) dto: never,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articles.update(id, dto, user.id);
  }

  @RequireModule("actualites")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.articles.remove(id, user.id);
  }
}

@Module({
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
