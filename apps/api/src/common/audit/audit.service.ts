import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Journal d'audit. Treize rôles écrivent dans le même back-office : sans trace,
 * « qui a validé cette inscription » ou « qui a supprimé cette ligne de budget »
 * devient invérifiable.
 *
 * Volontairement non bloquant : un échec d'écriture du journal ne doit jamais
 * faire échouer l'action métier qu'il documente.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    actorId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId ?? null,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId ?? null,
          metadata: params.metadata,
        },
      });
    } catch (error) {
      this.logger.warn(`Journal d'audit non écrit (${params.action}) : ${String(error)}`);
    }
  }
}
