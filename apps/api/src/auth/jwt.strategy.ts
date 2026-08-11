import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Role } from "@fihadj/shared-types";
import { PrismaService } from "../common/prisma/prisma.service";
import type { AuthenticatedUser } from "../common/decorators/auth.decorators";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_ACCESS_SECRET") ?? "dev-access-secret",
    });
  }

  /**
   * On relit l'utilisateur en base à chaque requête plutôt que de faire confiance
   * au seul jeton : désactiver un compte ou changer un rôle prend effet
   * immédiatement, sans attendre l'expiration du jeton d'accès.
   */
  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, fullName: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Compte inexistant ou désactivé");
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      fullName: user.fullName,
    };
  }
}
