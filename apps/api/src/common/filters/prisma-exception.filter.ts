import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Response } from "express";

/**
 * Traduit les erreurs Prisma en réponses HTTP lisibles. Sans ce filtre, une
 * violation de contrainte unique remonte en 500 « Internal server error » et
 * l'internaute ne sait pas qu'il s'est simplement inscrit deux fois.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    switch (exception.code) {
      case "P2002": {
        const target = (exception.meta?.target as string[] | string | undefined) ?? [];
        const fields = Array.isArray(target) ? target.join(", ") : String(target);
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: fields.includes("email")
            ? "Une inscription existe déjà avec cette adresse email pour ce type et cette édition."
            : `Valeur déjà utilisée (${fields}).`,
          code: exception.code,
        });
        return;
      }
      case "P2025":
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: "Enregistrement introuvable.",
          code: exception.code,
        });
        return;
      case "P2003":
        response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Référence invalide : l'élément lié n'existe pas.",
          code: exception.code,
        });
        return;
      default:
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "Erreur de base de données.",
          code: exception.code,
        });
    }
  }
}
