import { BadRequestException, Controller, Delete, ForbiddenException, Get, HttpCode, Injectable, Module, Param, Patch, Post } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ROLE_LABELS, userCreateSchema, userUpdateSchema, type AuthUser, type Role } from "@fihadj/shared-types";
import { z } from "zod";
import { PrismaService } from "../common/prisma/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { MailService } from "../mail/mail.service";
import { AuthService } from "../auth/auth.service";
import { ApiZodBody, ZBody } from "../common/zod/zod";
import { CurrentUser, RequireModule, type AuthenticatedUser } from "../common/decorators/auth.decorators";

type UserCreateInput = z.infer<typeof userCreateSchema>;
type UserUpdateInput = z.infer<typeof userUpdateSchema>;

const SELECT = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  phone: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  findAll() {
    return this.prisma.user.findMany({ select: SELECT, orderBy: { fullName: "asc" } });
  }

  findOne(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id }, select: SELECT });
  }

  async create(input: UserCreateInput, actor: AuthenticatedUser) {
    this.assertCanGrant(actor.role, input.role);
    const user = await this.prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        role: input.role,
        phone: input.phone || null,
        passwordHash: await AuthService.hashPassword(input.password),
      },
      select: SELECT,
    });

    await this.mail.sendAccountCreated({
      to: user.email,
      fullName: user.fullName,
      roleLabel: ROLE_LABELS[user.role as Role],
      temporaryPassword: input.password,
      adminUrl: `${this.config.get<string>("PUBLIC_WEB_URL") ?? ""}/admin`,
    });
    await this.audit.log({
      actorId: actor.id,
      action: "user.created",
      entity: "User",
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
    });
    return user;
  }

  async update(id: string, input: UserUpdateInput, actor: AuthenticatedUser) {
    if (input.role) this.assertCanGrant(actor.role, input.role);
    if (id === actor.id && input.isActive === false) {
      throw new BadRequestException("Vous ne pouvez pas désactiver votre propre compte.");
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(input.fullName !== undefined && { fullName: input.fullName }),
        ...(input.email !== undefined && { email: input.email.toLowerCase() }),
        ...(input.role !== undefined && { role: input.role }),
        ...(input.phone !== undefined && { phone: input.phone || null }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.password && { passwordHash: await AuthService.hashPassword(input.password) }),
      },
      select: SELECT,
    });

    // Désactiver un compte ou changer son mot de passe doit couper ses sessions
    // ouvertes : sinon le jeton de rafraîchissement continue de fonctionner.
    if (input.isActive === false || input.password) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await this.audit.log({
      actorId: actor.id,
      action: "user.updated",
      entity: "User",
      entityId: id,
      metadata: { role: user.role, isActive: user.isActive },
    });
    return user;
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    if (id === actor.id) {
      throw new BadRequestException("Vous ne pouvez pas supprimer votre propre compte.");
    }
    await this.prisma.user.delete({ where: { id } });
    await this.audit.log({ actorId: actor.id, action: "user.deleted", entity: "User", entityId: id });
  }

  /**
   * Seuls le Super administrateur et le Commissaire Général peuvent créer ou
   * promouvoir un compte à ces deux rôles. Sans cette garde, le Responsable RH
   * — qui a bien accès au module « utilisateurs » — pourrait s'auto-promouvoir.
   */
  private assertCanGrant(actorRole: Role, targetRole: Role): void {
    const privileged: Role[] = ["SUPER_ADMIN", "COMMISSAIRE_GENERAL"];
    if (privileged.includes(targetRole) && !privileged.includes(actorRole)) {
      throw new ForbiddenException(
        "Seuls le Super administrateur et le Commissaire Général peuvent attribuer ce rôle.",
      );
    }
  }

  /** Journal d'audit — visible des seuls rôles ayant le module « utilisateurs ». */
  auditTrail(limit = 100) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { id: true, fullName: true, role: true } } },
    });
  }
}

@ApiTags("utilisateurs")
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @RequireModule("utilisateurs")
  @Get()
  @ApiOperation({ summary: "Comptes du back-office" })
  findAll(): Promise<Partial<AuthUser>[]> {
    return this.users.findAll() as never;
  }

  @RequireModule("utilisateurs")
  @Get("audit")
  @ApiOperation({ summary: "Journal d'audit des actions sensibles" })
  audit() {
    return this.users.auditTrail();
  }

  @RequireModule("utilisateurs")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.users.findOne(id);
  }

  @RequireModule("utilisateurs")
  @Post()
  @ApiZodBody(userCreateSchema)
  create(@ZBody(userCreateSchema) dto: UserCreateInput, @CurrentUser() user: AuthenticatedUser) {
    return this.users.create(dto, user);
  }

  @RequireModule("utilisateurs")
  @Patch(":id")
  @ApiZodBody(userUpdateSchema)
  update(
    @Param("id") id: string,
    @ZBody(userUpdateSchema) dto: UserUpdateInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.users.update(id, dto, user);
  }

  @RequireModule("utilisateurs")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.users.remove(id, user);
  }
}

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
