import { Controller, Delete, Get, HttpCode, Injectable, Module, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { contactSchema, type ContactInput } from "@fihadj/shared-types";
import { PrismaService } from "../common/prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { AuditService } from "../common/audit/audit.service";
import { ApiZodBody, ZBody } from "../common/zod/zod";
import {
  CurrentUser,
  Public,
  RequireModule,
  type AuthenticatedUser,
} from "../common/decorators/auth.decorators";

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
  ) {}

  async create(input: ContactInput) {
    const message = await this.prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone || null,
        subject: input.subject,
        message: input.message,
      },
    });
    // Accusé de réception immédiat : sans lui, l'internaute renvoie le formulaire.
    await this.mail.sendContactAcknowledgement({
      name: message.name,
      email: message.email,
      subject: message.subject,
    });
    return { id: message.id, createdAt: message.createdAt };
  }

  findAll(handled?: boolean) {
    return this.prisma.contactMessage.findMany({
      where: handled === undefined ? {} : { handled },
      orderBy: [{ handled: "asc" }, { createdAt: "desc" }],
    });
  }

  async setHandled(id: string, handled: boolean, actorId: string) {
    const message = await this.prisma.contactMessage.update({
      where: { id },
      data: { handled, handledAt: handled ? new Date() : null },
    });
    await this.audit.log({
      actorId,
      action: handled ? "contact.handled" : "contact.reopened",
      entity: "ContactMessage",
      entityId: id,
    });
    return message;
  }

  async remove(id: string, actorId: string): Promise<void> {
    await this.prisma.contactMessage.delete({ where: { id } });
    await this.audit.log({ actorId, action: "contact.deleted", entity: "ContactMessage", entityId: id });
  }
}

@ApiTags("contact")
@Controller("contact")
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Public()
  // Formulaire ouvert : 5 messages par heure et par IP suffisent à un usage
  // légitime et coupent court aux robots de spam.
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @Post()
  @ApiOperation({ summary: "Envoi d'un message depuis le site public" })
  @ApiZodBody(contactSchema)
  create(@ZBody(contactSchema) dto: never) {
    return this.contact.create(dto);
  }

  @RequireModule("messages")
  @Get()
  @ApiQuery({ name: "handled", required: false, type: Boolean })
  findAll(@Query("handled") handled?: string) {
    return this.contact.findAll(handled === undefined ? undefined : handled === "true");
  }

  @RequireModule("messages")
  @Patch(":id/handled")
  setHandled(
    @Param("id") id: string,
    @Query("value") value: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contact.setHandled(id, value !== "false", user.id);
  }

  @RequireModule("messages")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.contact.remove(id, user.id);
  }
}

@Module({
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
