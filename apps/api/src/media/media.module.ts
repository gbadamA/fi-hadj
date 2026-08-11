import { randomUUID } from "node:crypto";
import { extname, join } from "node:path";
import { unlink } from "node:fs/promises";
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
// `multer` est une dépendance de @nestjs/platform-express, mais pnpm n'expose pas
// les dépendances transitives : elle est déclarée explicitement dans package.json,
// épinglée sur la version que résout platform-express pour éviter deux copies
// dont l'une fournirait un `StorageEngine` que l'autre ne reconnaîtrait pas.
import { diskStorage } from "multer";
import { MEDIA_TYPES, type MediaType } from "@fihadj/shared-types";
import { PrismaService } from "../common/prisma/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { CurrentUser, Public, RequireModule, type AuthenticatedUser } from "../common/decorators/auth.decorators";

/**
 * Médiathèque : logos des promoteurs, sponsors et exposants, visuels de la
 * galerie, documents téléchargeables.
 *
 * Le stockage est sur DISQUE LOCAL, servi en statique sous `/uploads`. Passer à
 * un bucket S3 en production ne demande de remplacer que `storage` et l'URL
 * construite ici — le reste du code ne connaît que `MediaAsset.url`.
 */
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
]);
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  findAll(type?: MediaType, section?: string) {
    return this.prisma.mediaAsset.findMany({
      where: { ...(type && { type }), ...(section && { section }) },
      orderBy: { createdAt: "desc" },
    });
  }

  async register(
    file: Express.Multer.File,
    meta: { type?: string; caption?: string; section?: string },
    actorId: string,
  ) {
    const base = this.config.get<string>("PUBLIC_API_URL") ?? "";
    const type = (MEDIA_TYPES as readonly string[]).includes(meta.type ?? "")
      ? (meta.type as MediaType)
      : file.mimetype === "application/pdf"
        ? "DOCUMENT"
        : "IMAGE";

    const asset = await this.prisma.mediaAsset.create({
      data: {
        url: `${base}/uploads/${file.filename}`,
        type,
        caption: meta.caption || null,
        section: meta.section || null,
        fileName: file.filename,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });
    await this.audit.log({
      actorId,
      action: "media.uploaded",
      entity: "MediaAsset",
      entityId: asset.id,
      metadata: { fileName: asset.fileName, sizeBytes: asset.sizeBytes },
    });
    return asset;
  }

  async remove(id: string, actorId: string): Promise<void> {
    const asset = await this.prisma.mediaAsset.delete({ where: { id } });
    if (asset.fileName) {
      const dir = join(process.cwd(), this.config.get<string>("UPLOAD_DIR") ?? "./uploads");
      // Le fichier peut avoir déjà disparu (nettoyage manuel, restauration) :
      // l'entrée en base doit tout de même être supprimée.
      await unlink(join(dir, asset.fileName)).catch(() => undefined);
    }
    await this.audit.log({ actorId, action: "media.deleted", entity: "MediaAsset", entityId: id });
  }
}

@ApiTags("médias")
@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Public()
  @Get()
  @ApiQuery({ name: "type", required: false, enum: MEDIA_TYPES })
  @ApiQuery({ name: "section", required: false })
  findAll(@Query("type") type?: MediaType, @Query("section") section?: string) {
    return this.media.findAll(type, section);
  }

  @RequireModule("medias")
  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Téléverse un logo, un visuel ou un document (8 Mo max)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        type: { type: "string", enum: [...MEDIA_TYPES] },
        caption: { type: "string" },
        section: { type: "string" },
      },
      required: ["file"],
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: join(process.cwd(), process.env.UPLOAD_DIR ?? "./uploads"),
        // Nom aléatoire : deux « logo.png » téléversés le même jour ne doivent
        // pas s'écraser, et le nom d'origine ne doit pas dicter le chemin sur disque.
        filename: (_req, file, callback) =>
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME.has(file.mimetype)) {
          callback(new BadRequestException("Format non autorisé (PNG, JPEG, WebP, SVG ou PDF)"), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query("type") type: string | undefined,
    @Query("caption") caption: string | undefined,
    @Query("section") section: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException("Aucun fichier reçu");
    return this.media.register(file, { type, caption, section }, user.id);
  }

  @RequireModule("medias")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.media.remove(id, user.id);
  }
}

@Module({
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
