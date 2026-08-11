import { CanActivate, ForbiddenException, Injectable, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { MODULE_LABELS, canAccess, type AdminModule, type Role } from "@fihadj/shared-types";
import {
  IS_PUBLIC,
  REQUIRED_MODULE,
  REQUIRED_ROLES,
  type AuthenticatedUser,
} from "../decorators/auth.decorators";

/**
 * Applique la matrice RBAC de `@fihadj/shared-types`. Le backoffice masque les
 * entrées de menu avec la MÊME fonction `canAccess` : un module invisible dans
 * l'interface est aussi refusé ici, jamais l'un sans l'autre.
 */
@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const requiredModule = this.reflector.getAllAndOverride<AdminModule | undefined>(
      REQUIRED_MODULE,
      targets,
    );
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      REQUIRED_ROLES,
      targets,
    );
    if (!requiredModule && !requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (!user) throw new ForbiddenException("Authentification requise");

    if (requiredRoles && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException("Votre rôle ne permet pas cette action");
    }
    if (requiredModule && !canAccess(user.role, requiredModule)) {
      throw new ForbiddenException(
        `Votre rôle n'a pas accès au module « ${MODULE_LABELS[requiredModule]} »`,
      );
    }
    return true;
  }
}
