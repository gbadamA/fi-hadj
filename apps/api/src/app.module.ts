import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuditModule } from "./common/audit/audit.module";
import { MailModule } from "./mail/mail.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { ModuleGuard } from "./common/guards/module.guard";
import { AuthModule } from "./auth/auth.module";
import { EditionsModule } from "./editions/editions.module";
import { ContentModule } from "./content/content.module";
import { RegistrationsModule } from "./registrations/registrations.module";
import { ExhibitorsModule } from "./exhibitors/exhibitors.module";
import { SponsorsModule } from "./sponsors/sponsors.module";
import { BudgetModule } from "./budget/budget.module";
import { ContactModule } from "./contact/contact.module";
import { ArticlesModule } from "./articles/articles.module";
import { MediaModule } from "./media/media.module";
import { UsersModule } from "./users/users.module";
import { StatsModule } from "./stats/stats.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Plafond général, doublé de limites plus strictes sur les formulaires
    // publics (`/registrations`, `/contact`) déclarées au niveau des routes.
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuditModule,
    MailModule,
    AuthModule,
    EditionsModule,
    ContentModule,
    RegistrationsModule,
    ExhibitorsModule,
    SponsorsModule,
    BudgetModule,
    ContactModule,
    ArticlesModule,
    MediaModule,
    UsersModule,
    StatsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // ⚠️ L'ordre compte : le garde JWT peuple `request.user`, que ModuleGuard lit
    // ensuite pour appliquer la matrice RBAC. Inverser les deux ferait échouer
    // tous les contrôles de rôle avec « Authentification requise ».
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ModuleGuard },
  ],
})
export class AppModule {}
