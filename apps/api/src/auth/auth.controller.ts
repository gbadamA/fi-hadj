import { Body, Controller, Get, HttpCode, Post, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { z } from "zod";
import { loginSchema } from "@fihadj/shared-types";
import type { Request, Response } from "express";
import { ApiZodBody, ZBody } from "../common/zod/zod";
import {
  CurrentUser,
  Public,
  type AuthenticatedUser,
} from "../common/decorators/auth.decorators";
import { AuthService } from "./auth.service";
import { PrismaService } from "../common/prisma/prisma.service";
import { AuditService } from "../common/audit/audit.service";

/**
 * Le jeton de rafraîchissement voyage en cookie **httpOnly** : contrairement au
 * localStorage, il reste hors de portée d'un script injecté. Le jeton d'accès,
 * lui, est court (15 min) et vit en mémoire côté client.
 */
const REFRESH_COOKIE = "fihadj_rt";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "8 caractères minimum").max(72),
});

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private setRefreshCookie(res: Response, token: string, maxAge: number): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax", // le site et l'API partagent le même site (ports différents)
      secure: process.env.NODE_ENV === "production",
      maxAge,
      path: "/auth",
    });
  }

  @Public()
  // Une tentative toutes les ~6 s en moyenne : suffisant pour un humain,
  // dissuasif pour un bourrage d'identifiants.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Connexion au back-office" })
  @ApiZodBody(loginSchema)
  async login(
    @ZBody(loginSchema) dto: { email: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.validateCredentials(dto.email, dto.password);
    const tokens = await this.auth.issueTokens(user, req.headers["user-agent"]);
    this.setRefreshCookie(res, tokens.refreshToken, tokens.refreshMaxAgeMs);
    await this.audit.log({ actorId: user.id, action: "auth.login", entity: "User", entityId: user.id });
    return { accessToken: tokens.accessToken, user };
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({ summary: "Renouvelle le jeton d'accès à partir du cookie de session" })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const tokens = await this.auth.refresh(raw, req.headers["user-agent"]);
    this.setRefreshCookie(res, tokens.refreshToken, tokens.refreshMaxAgeMs);

    const payload = JSON.parse(
      Buffer.from(tokens.accessToken.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as { sub: string };
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    return { accessToken: tokens.accessToken, user: this.auth.toAuthUser(user) };
  }

  @Public()
  @Post("logout")
  @HttpCode(204)
  @ApiOperation({ summary: "Déconnexion — révoque la session courante" })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE] as string | undefined);
    res.clearCookie(REFRESH_COOKIE, { path: "/auth" });
  }

  @Get("me")
  @ApiOperation({ summary: "Profil de l'utilisateur connecté" })
  async me(@CurrentUser() user: AuthenticatedUser) {
    const full = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return this.auth.toAuthUser(full);
  }

  @Post("change-password")
  @HttpCode(204)
  @ApiOperation({ summary: "Change son propre mot de passe" })
  @ApiZodBody(changePasswordSchema)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @ZBody(changePasswordSchema) dto: { currentPassword: string; newPassword: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword);
    res.clearCookie(REFRESH_COOKIE, { path: "/auth" });
  }
}
