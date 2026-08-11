import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Le front est une origine distincte : on ne peut pas se reposer sur le
    // même document pour la protection CSRF, d'où la liste blanche explicite.
    cors: false,
  });
  const config = app.get(ConfigService);
  const logger = new Logger("bootstrap");

  app.use(
    helmet({
      // Les logos et documents sont servis depuis l'API vers le site (autre port).
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cookieParser());

  const origins = (config.get<string>("CORS_ORIGINS") ?? "http://localhost:3050")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    // Le jeton de rafraîchissement voyage en cookie httpOnly : sans `credentials`
    // le navigateur ne l'enverrait jamais.
    credentials: true,
  });

  app.useGlobalFilters(new PrismaExceptionFilter());

  const uploadDir = join(process.cwd(), config.get<string>("UPLOAD_DIR") ?? "./uploads");
  mkdirSync(uploadDir, { recursive: true });
  app.useStaticAssets(uploadDir, { prefix: "/uploads" });

  const swagger = new DocumentBuilder()
    .setTitle("FI-HADJ — API")
    .setDescription(
      "API du Forum International du Hadj (Abidjan). Contenu public en lecture libre, " +
        "écriture protégée par JWT et par la matrice de rôles de l'organigramme.",
    )
    .setVersion("1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "access-token")
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swagger), {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(config.get<string>("PORT") ?? 3051);
  await app.listen(port, "0.0.0.0");
  logger.log(`API FI-HADJ sur http://localhost:${port} — documentation /docs`);
}

void bootstrap();
