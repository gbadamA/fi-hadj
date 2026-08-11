import { SetMetadata, createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AdminModule, Role } from "@fihadj/shared-types";

export const IS_PUBLIC = "fihadj:isPublic";
export const REQUIRED_MODULE = "fihadj:module";
export const REQUIRED_ROLES = "fihadj:roles";

/**
 * Ouvre un endpoint sans authentification. Le garde JWT est global : sans ce
 * marqueur, TOUT est fermé — c'est le défaut sûr, on n'oublie pas de protéger.
 */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Restreint l'endpoint aux rôles qui ont ce module dans la matrice RBAC. */
export const RequireModule = (module: AdminModule) => SetMetadata(REQUIRED_MODULE, module);

/** Restriction explicite à une liste de rôles (plus fin que le module). */
export const RequireRoles = (...roles: Role[]) => SetMetadata(REQUIRED_ROLES, roles);

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  fullName: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
