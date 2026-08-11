/**
 * Pont Zod ↔ NestJS.
 *
 * Les schémas viennent de `@fihadj/shared-types` : le formulaire du site et le DTO
 * de l'API valident littéralement le même objet. Ce fichier fournit de quoi les
 * brancher sur les paramètres de contrôleur ET sur la documentation Swagger, sans
 * dupliquer les règles dans des classes `class-validator`.
 */
import {
  BadRequestException,
  Body,
  Query,
  applyDecorators,
  type ArgumentMetadata,
  type PipeTransform,
} from "@nestjs/common";
import { ApiBody, ApiQuery } from "@nestjs/swagger";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodTypeAny, z } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    // `flatten()` donne { formErrors, fieldErrors } — exactement la forme que
    // React Hook Form sait afficher champ par champ côté site.
    const flat = result.error.flatten();
    throw new BadRequestException({
      statusCode: 400,
      message: "Données invalides",
      errors: flat.fieldErrors,
      formErrors: flat.formErrors,
    });
  }
}

/** `@ZBody(schema) dto: Type` — valide le corps de la requête. */
export const ZBody = (schema: ZodTypeAny): ParameterDecorator =>
  Body(new ZodValidationPipe(schema));

/** `@ZQuery(schema) query: Type` — valide et coerce la query string. */
export const ZQuery = (schema: ZodTypeAny): ParameterDecorator =>
  Query(new ZodValidationPipe(schema));

function toOpenApi(schema: ZodTypeAny): Record<string, unknown> {
  // `zodToJsonSchema` infère le type de sortie depuis la forme du schéma ; sur
  // nos unions discriminées ce calcul explose la limite de profondeur de
  // TypeScript (TS2589). La sortie ne sert qu'à Swagger : on l'efface.
  return zodToJsonSchema(schema as never, {
    target: "openApi3",
    $refStrategy: "none",
  }) as Record<string, unknown>;
}

/** Documente le corps attendu dans Swagger à partir du même schéma Zod. */
export const ApiZodBody = (schema: ZodTypeAny) =>
  applyDecorators(ApiBody({ schema: toOpenApi(schema) as never }));

/** Documente chaque champ d'un schéma objet comme paramètre de query. */
export const ApiZodQuery = (schema: ZodTypeAny) => {
  const json = toOpenApi(schema) as {
    properties?: Record<string, Record<string, unknown>>;
    required?: string[];
  };
  const required = new Set(json.required ?? []);
  const decorators = Object.entries(json.properties ?? {}).map(([name, prop]) =>
    ApiQuery({ name, required: required.has(name), schema: prop as never }),
  );
  return applyDecorators(...decorators);
};

export type Infer<S extends ZodTypeAny> = z.infer<S>;
