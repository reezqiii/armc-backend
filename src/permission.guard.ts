import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

export const PERMISSIONS_KEY = "permission_ids";

export const RequirePermissions = (...permissions: (number | string)[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<(number | string)[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException("Unauthorized");

    const userPermissions: (number | string)[] = user.permission_ids ?? [];

    const hasPermission = required.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied. You do not have the required permission ID: ${required.join(" or ")}`,
      );
    }

    return true;
  }
}
