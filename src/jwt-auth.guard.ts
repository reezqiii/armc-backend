import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'auth/public.decorator';
import { requestStorage } from 'portal_request_user_permission/subscribers/async_local_storage';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // bypass auth
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Jika auth gagal, lempar error sesuai behavior default
    if (err || !user) {
      return null;
    }

    // Store ke ALS agar bisa dibaca subscriber
    requestStorage.enterWith({ userId: user.id_user });

    return user;
  }
}
