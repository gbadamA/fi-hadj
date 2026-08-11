import { createHash, randomUUID } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import type { AuthUser, Role } from "@fihadj/shared-types";
import { PrismaService } from "../common/prisma/prisma.service";
import { AuditService } from "../common/audit/audit.service";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Durée de vie du jeton de rafraîchissement, pour poser le cookie. */
  refreshMaxAgeMs: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Le jeton de rafraîchissement est stocké HACHÉ (SHA-256). Un hachage
   * déterministe est indispensable ici — il faut pouvoir retrouver la ligne à
   * partir du jeton présenté, ce que bcrypt ne permet pas. Le jeton étant un JWT
   * aléatoire de haute entropie (et non un mot de passe humain), SHA-256 suffit.
   */
  private static digest(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  static hashPassword(plain: string): Promise<string> {
    return hash(plain, 12);
  }

  async validateCredentials(email: string, password: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    // Message volontairement identique dans les deux cas : ne pas révéler
    // quelles adresses existent dans le back-office.
    const invalid = new UnauthorizedException("Identifiants incorrects");
    if (!user) {
      // Comparaison à vide quand même, pour ne pas offrir d'oracle temporel.
      await compare(password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
      throw invalid;
    }
    if (!(await compare(password, user.passwordHash))) throw invalid;
    if (!user.isActive) throw new UnauthorizedException("Ce compte est désactivé");

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return this.toAuthUser(user);
  }

  async issueTokens(
    user: { id: string; email: string; role: Role },
    userAgent?: string,
  ): Promise<TokenPair> {
    const accessTtl = this.config.get<string>("JWT_ACCESS_TTL") ?? "15m";
    const refreshTtl = this.config.get<string>("JWT_REFRESH_TTL") ?? "7d";
    // `expiresIn` est passé en SECONDES plutôt qu'en chaîne « 15m » : les deux
    // sont acceptés par jsonwebtoken, mais la forme numérique est celle dont on
    // dérive aussi le `maxAge` du cookie — une seule conversion, pas deux
    // écritures de la même durée qui pourraient diverger.
    const accessSeconds = Math.floor(parseDuration(accessTtl) / 1000);
    const refreshMaxAgeMs = parseDuration(refreshTtl);

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret: this.config.get<string>("JWT_ACCESS_SECRET"), expiresIn: accessSeconds },
    );
    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti },
      {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: Math.floor(refreshMaxAgeMs / 1000),
      },
    );
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: AuthService.digest(refreshToken),
        expiresAt: new Date(Date.now() + refreshMaxAgeMs),
        userAgent: userAgent?.slice(0, 200),
      },
    });
    return { accessToken, refreshToken, refreshMaxAgeMs };
  }

  /**
   * Rotation stricte : le jeton présenté est révoqué et remplacé. S'il avait
   * déjà été révoqué, c'est le signe d'un vol — on coupe TOUTES les sessions
   * de l'utilisateur plutôt que d'en laisser une continuer.
   */
  async refresh(rawToken: string | undefined, userAgent?: string): Promise<TokenPair> {
    if (!rawToken) throw new UnauthorizedException("Session expirée");

    let payload: { sub: string; jti: string };
    try {
      payload = await this.jwt.verifyAsync(rawToken, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Session expirée");
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: AuthService.digest(rawToken) },
      include: { user: true },
    });
    if (!stored) throw new UnauthorizedException("Session expirée");

    if (stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit.log({
        actorId: stored.userId,
        action: "auth.refresh_reuse_detected",
        entity: "RefreshToken",
        entityId: stored.id,
      });
      throw new UnauthorizedException("Session invalidée, veuillez vous reconnecter");
    }
    if (stored.expiresAt < new Date()) throw new UnauthorizedException("Session expirée");
    if (!stored.user.isActive) throw new UnauthorizedException("Ce compte est désactivé");

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(
      { id: stored.user.id, email: stored.user.email, role: stored.user.role as Role },
      userAgent,
    );
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: AuthService.digest(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(userId: string, current: string, next: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await compare(current, user.passwordHash))) {
      throw new UnauthorizedException("Mot de passe actuel incorrect");
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await AuthService.hashPassword(next) },
    });
    // Changer de mot de passe ferme les autres sessions : c'est le geste attendu
    // quand on soupçonne une compromission.
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.log({ actorId: userId, action: "auth.password_changed", entity: "User", entityId: userId });
  }

  toAuthUser(user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
    phone: string | null;
  }): AuthUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role as Role,
      isActive: user.isActive,
      phone: user.phone,
    };
  }
}

/** « 15m », « 7d », « 24h », « 30s » → millisecondes. */
export function parseDuration(value: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(value.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2] as "s" | "m" | "h" | "d";
  const factor = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return amount * factor;
}
