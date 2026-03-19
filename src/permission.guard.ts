import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector} from "@nestjs/core"; // ← tambah SetMetadata

export const PERMISSIONS_KEY = "permissions_key";

// ← Ganti Reflect.metadata dengan SetMetadata
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException("Unauthorized");

    const userPermissions: string[] = user.permissions_key ?? [];

    const hasPermission = required.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied. Required: ${required.join(" or ")}`,
      );
    }

    return true;
  }
}