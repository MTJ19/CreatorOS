import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  createParamDecorator,
} from '@nestjs/common';
import { Request } from 'express';

import { BrandPortalService } from './brand-portal.service';

/**
 * Guard for public portal endpoints.
 *
 * Reads the raw portal token from either:
 *   1. `Authorization: Bearer <token>` header (preferred)
 *   2. `X-Portal-Token: <token>` header (CSRF-safe alternative for forms)
 *
 * On success, attaches `request.portalContext` and `request.portalTokenRecord`
 * for downstream handlers.
 */
@Injectable()
export class PortalTokenGuard implements CanActivate {
  constructor(private readonly brandPortalService: BrandPortalService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & {
        portalContext: any;
        portalTokenRecord: any;
      }
    >();

    // Extract token from header — support both auth bearer and explicit header
    const authHeader = request.headers.authorization;
    const explicitHeader = request.headers['x-portal-token'] as string | undefined;

    let rawToken: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      rawToken = authHeader.slice(7).trim();
    } else if (explicitHeader) {
      rawToken = explicitHeader.trim();
    }

    if (!rawToken) {
      throw new UnauthorizedException('Portal token is required');
    }

    try {
      const { tokenRecord, context: portalCtx } =
        await this.brandPortalService.verifyToken(rawToken);
      request.portalContext = portalCtx;
      request.portalTokenRecord = tokenRecord;
      return true;
    } catch (err: any) {
      // Re-throw typed errors as-is; wrap unknown errors as ForbiddenException
      if (err instanceof UnauthorizedException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new ForbiddenException('Invalid or expired portal token');
    }
  }
}

export const PortalContext = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<any>().portalContext;
});

export const PortalTokenRecord = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<any>().portalTokenRecord;
});
